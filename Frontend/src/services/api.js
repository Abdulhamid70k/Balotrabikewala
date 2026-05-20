import axios from "axios";
import { store } from "../app/store";
import { logout, setCredentials } from "../features/auth/authSlice";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Public instance (no auth) ───────────────────────────────────────────────
export const publicAPI = axios.create({ baseURL: BASE_URL });

// ─── Private instance (with auth + auto-refresh) ─────────────────────────────
const privateAPI = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Attach access token to every request
privateAPI.interceptors.request.use((config) => {
  const { token } = store.getState().auth;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401 TOKEN_EXPIRED — hard logout on any other 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

const forceLogout = () => {
  processQueue(new Error("Session expired"), null);
  store.dispatch(logout());
};

privateAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status  = error.response?.status;
    const code    = error.response?.data?.code;

    // 401 but NOT token-expired → hard logout immediately (invalid token, deactivated, etc.)
    if (status === 401 && code !== "TOKEN_EXPIRED") {
      forceLogout();
      return Promise.reject(error);
    }

    // 401 + TOKEN_EXPIRED → try refresh once
    if (status === 401 && code === "TOKEN_EXPIRED" && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return privateAPI(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await publicAPI.post("/auth/refresh");
        const newToken = data.data.accessToken;

        store.dispatch(setCredentials({ token: newToken }));
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return privateAPI(originalRequest);
      } catch (refreshError) {
        // Refresh failed (cookie expired or invalid) → force logout
        forceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default privateAPI;
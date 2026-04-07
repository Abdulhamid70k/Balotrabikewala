import axios from "axios";
import { store } from "../app/store";
import { logout, setCredentials } from "../features/auth/authSlice";

const BASE_URL = import.meta.env.VITE_API_URL || "https://balotrabikewala.onrender.com";

// ─── Public instance (no auth) ───────────────────────────────────────────────
export const publicAPI = axios.create({ baseURL: BASE_URL });

// ─── Private instance (with auth + auto-refresh) ─────────────────────────────
const privateAPI = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies (refresh token)
});

// Attach access token to every request
privateAPI.interceptors.request.use((config) => {
  const { token } = store.getState().auth;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401 TOKEN_EXPIRED
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

privateAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      !originalRequest._retry
    ) {
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
        processQueue(refreshError, null);
        store.dispatch(logout());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default privateAPI;
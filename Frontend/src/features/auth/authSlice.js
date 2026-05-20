import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const publicAPI = axios.create({ baseURL: BASE_URL, withCredentials: true });

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await publicAPI.post("/auth/login", credentials);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await publicAPI.post("/auth/logout");
    } catch {
      // Even if API call fails, clear local state
    }
  }
);

const clearAuth = (state) => {
  state.user    = null;
  state.token   = null;
  state.loading = false;   // ← loader stuck nahi hoga
  state.error   = null;
  localStorage.removeItem("user");
  localStorage.removeItem("token");
};

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user:    JSON.parse(localStorage.getItem("user"))  || null,
    token:   localStorage.getItem("token")             || null,
    loading: false,
    error:   null,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.token = action.payload.token;
      if (state.user) {
        state.user = { ...state.user, accessToken: action.payload.token };
        localStorage.setItem("user", JSON.stringify(state.user));
      }
      localStorage.setItem("token", action.payload.token);
    },
    // Called directly from api.js interceptor on 401 / refresh failure
    logout: clearAuth,
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user    = action.payload;
        state.token   = action.payload.accessToken;
        localStorage.setItem("user",  JSON.stringify(action.payload));
        localStorage.setItem("token", action.payload.accessToken);
      })
      .addCase(loginUser.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(logoutUser.pending,   (state) => { state.loading = true; })
      .addCase(logoutUser.fulfilled, clearAuth)
      .addCase(logoutUser.rejected,  clearAuth);  // error pe bhi clear karo
  },
});

export const { setCredentials, logout, clearError } = authSlice.actions;
export default authSlice.reducer;

export const registerUser      = () => () => {};
export const selectCurrentUser = (state) => state.auth.user;
export const selectToken       = (state) => state.auth.token;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError   = (state) => state.auth.error;
export const selectIsAdmin     = (state) => state.auth.user?.role === "admin";
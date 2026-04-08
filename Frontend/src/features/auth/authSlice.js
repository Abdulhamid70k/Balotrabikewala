import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { publicAPI } from "../../services/api";



export const loginUser = createAsyncThunk(
  "/api/auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await publicAPI.post("/api/auth/login", credentials);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "/api/auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const { default: api } = await import("../../services/api");
      await api.post("/api/auth/logout");
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

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
      localStorage.setItem("token", action.payload.token);
    },
    logout: (state) => {
      state.user  = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user    = action.payload;
        state.token   = action.payload.accessToken;
        localStorage.setItem("user",  JSON.stringify(action.payload));
        localStorage.setItem("token", action.payload.accessToken);
      })
      .addCase(registerUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(loginUser.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user    = action.payload;
        state.token   = action.payload.accessToken;
        localStorage.setItem("user",  JSON.stringify(action.payload));
        localStorage.setItem("token", action.payload.accessToken);
      })
      .addCase(loginUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(logoutUser.fulfilled, (state) => {
        state.user  = null;
        state.token = null;
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      });
  },
});

export const { setCredentials, logout, clearError } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectToken       = (state) => state.auth.token;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError   = (state) => state.auth.error;
export const selectIsAdmin     = (state) => state.auth.user?.role === "admin";
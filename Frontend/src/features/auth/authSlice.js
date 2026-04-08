import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { publicAPI } from "../../services/api";

export const loginUser = createAsyncThunk(
  "auth/login",
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
  "auth/logout",
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
    user: JSON.parse(localStorage.getItem("user")) || null,
    token: localStorage.getItem("token") || null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.token = action.payload.accessToken;

        localStorage.setItem("user", JSON.stringify(action.payload));
        localStorage.setItem("token", action.payload.accessToken);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // LOGOUT
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchBikes = createAsyncThunk(
  "bikes/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams(params).toString();
      const { data } = await api.get(`/bikes?${query}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch bikes");
    }
  }
);

export const fetchBike = createAsyncThunk(
  "bikes/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/bikes/${id}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch bike");
    }
  }
);

export const createBike = createAsyncThunk(
  "bikes/create",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/bikes", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create bike");
    }
  }
);

export const updateBike = createAsyncThunk(
  "bikes/update",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/bikes/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update bike");
    }
  }
);

export const deleteBike = createAsyncThunk(
  "bikes/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/bikes/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete bike");
    }
  }
);

export const fetchStats = createAsyncThunk(
  "bikes/stats",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/bikes/stats");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch stats");
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const bikeSlice = createSlice({
  name: "bikes",
  initialState: {
    bikes: [],
    currentBike: null,
    stats: null,
    pagination: { page: 1, limit: 10, total: 0, pages: 1 },
    loading: false,
    statsLoading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearBikeMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    clearCurrentBike: (state) => {
      state.currentBike = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all
    builder
      .addCase(fetchBikes.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchBikes.fulfilled, (state, action) => {
        state.loading = false;
        state.bikes = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchBikes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch one
    builder
      .addCase(fetchBike.pending, (state) => { state.loading = true; })
      .addCase(fetchBike.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBike = action.payload;
      })
      .addCase(fetchBike.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create
    builder
      .addCase(createBike.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createBike.fulfilled, (state, action) => {
        state.loading = false;
        state.bikes.unshift(action.payload);
        state.successMessage = "Bike added successfully!";
      })
      .addCase(createBike.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update
    builder
      .addCase(updateBike.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateBike.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.bikes.findIndex((b) => b._id === action.payload._id);
        if (idx !== -1) state.bikes[idx] = action.payload;
        state.currentBike = action.payload;
        state.successMessage = "Bike updated successfully!";
      })
      .addCase(updateBike.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete
    builder
      .addCase(deleteBike.fulfilled, (state, action) => {
        state.bikes = state.bikes.filter((b) => b._id !== action.payload);
        state.successMessage = "Bike deleted successfully!";
      })
      .addCase(deleteBike.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Stats
    builder
      .addCase(fetchStats.pending, (state) => { state.statsLoading = true; })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchStats.rejected, (state) => { state.statsLoading = false; });
  },
});

export const { clearBikeMessages, clearCurrentBike } = bikeSlice.actions;
export default bikeSlice.reducer;

export const selectBikes = (state) => state.bikes.bikes;
export const selectCurrentBike = (state) => state.bikes.currentBike;
export const selectBikeStats = (state) => state.bikes.stats;
export const selectBikeLoading = (state) => state.bikes.loading;
export const selectPagination = (state) => state.bikes.pagination;
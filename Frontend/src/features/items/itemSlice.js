import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchItems = createAsyncThunk(
  "items/fetchAll",
  async (q = "", { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/items${q ? `?q=${q}` : ""}`);
      // Always return array
      return Array.isArray(data.data) ? data.data : [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Fetch failed");
    }
  }
);

export const createItem = createAsyncThunk(
  "items/create",
  async (body, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/items", body);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Create failed");
    }
  }
);

export const updateItem = createAsyncThunk(
  "items/update",
  async ({ id, body }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/items/${id}`, body);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Update failed");
    }
  }
);

export const deleteItem = createAsyncThunk(
  "items/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/items/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Delete failed");
    }
  }
);

const itemSlice = createSlice({
  name: "items",
  initialState: {
    items:   [],
    loading: false,
    error:   null,
  },
  reducers: {
    clearItems: (state) => { state.items = []; },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchItems.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        // Guard against undefined/null payload
        state.items = action.payload ?? [];
      })
      .addCase(fetchItems.rejected,  (state, action) => {
        state.loading = false;
        state.error   = action.payload;
        // Don't clear existing items on error
      })

      // Create — prepend to list
      .addCase(createItem.fulfilled, (state, action) => {
        if (action.payload) {
          state.items = [action.payload, ...state.items];
        }
      })

      // Update — replace in list
      .addCase(updateItem.fulfilled, (state, action) => {
        if (action.payload) {
          const idx = state.items.findIndex((i) => i._id === action.payload._id);
          if (idx !== -1) state.items[idx] = action.payload;
        }
      })

      // Delete — remove from list
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i._id !== action.payload);
      });
  },
});

export const { clearItems } = itemSlice.actions;
export default itemSlice.reducer;

export const selectItems        = (state) => state.items.items;
export const selectItemsLoading = (state) => state.items.loading;
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchItems = createAsyncThunk("items/fetchAll", async (q = "", { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/items${q ? `?q=${q}` : ""}`);
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const createItem = createAsyncThunk("items/create", async (body, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/items", body);
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const deleteItem = createAsyncThunk("items/delete", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/items/${id}`);
    return id;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const itemSlice = createSlice({
  name: "items",
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchItems.pending,   (s) => { s.loading = true; })
     .addCase(fetchItems.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
     .addCase(fetchItems.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(createItem.fulfilled, (s, a) => { s.items = [a.payload, ...s.items]; })
     .addCase(deleteItem.fulfilled, (s, a) => { s.items = s.items.filter(i => i._id !== a.payload); });
  },
});

export default itemSlice.reducer;
export const selectItems = (s) => s.items.items;
export const selectItemsLoading = (s) => s.items.loading;
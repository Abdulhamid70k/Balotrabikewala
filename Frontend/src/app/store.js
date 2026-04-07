import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import bikeReducer from "../features/bikes/bikeSlice";
import itemReducer  from "../features/items/itemSlice";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    bikes: bikeReducer,
    items: itemReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["auth/login/fulfilled"],
      },
    }),
});
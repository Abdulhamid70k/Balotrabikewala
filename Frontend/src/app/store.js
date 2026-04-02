import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import bikeReducer from "../features/bikes/bikesSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    bikes: bikeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["auth/login/fulfilled"],
      },
    }),
});
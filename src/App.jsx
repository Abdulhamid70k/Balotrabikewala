import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "./features/auth/authSlice";

import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import StockList from "./pages/StockList";
import BikeForm from "./pages/BikeForm";
import BikeDetail from "./pages/BikeDetails";
import Reports from "./pages/Reports";
import AdminUsers from "./pages/AdminUsers";
import NotFound from "./pages/NotFound";

export default function App() {
  const user = useSelector(selectCurrentUser);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />

      {/* Protected routes inside Layout */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/stock" element={<StockList />} />
          <Route path="/stock/add" element={<BikeForm />} />
          <Route path="/stock/:id" element={<BikeDetail />} />
          <Route path="/stock/:id/edit" element={<BikeForm />} />
          <Route path="/reports" element={<Reports />} />

          {/* Admin only */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
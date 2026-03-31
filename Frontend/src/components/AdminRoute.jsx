import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { selectIsAdmin } from "../features/auth/authSlice";

export default function AdminRoute() {
  const isAdmin = useSelector(selectIsAdmin);
  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
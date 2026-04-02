import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { selectCurrentUser } from "../features/auth/authSlice";

export default function PrivateRoute() {
  const user = useSelector(selectCurrentUser);
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
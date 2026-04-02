import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser, selectCurrentUser, selectIsAdmin } from "../features/auth/authSlice";
import toast from "react-hot-toast";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/stock",     label: "Stock",     icon: "🏍️" },
  { to: "/reports",   label: "Reports",   icon: "📋" },
];

export default function Sidebar({ open, onClose }) {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const user      = useSelector(selectCurrentUser);
  const isAdmin   = useSelector(selectIsAdmin);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full w-60 bg-slate-900 flex flex-col z-50
        transition-transform duration-300
        ${open ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        md:translate-x-0
      `}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <span className="text-3xl">🏍️</span>
        <div>
          <div className="font-display text-lg font-bold text-white">BikeResell</div>
          <div className="text-[11px] font-semibold text-orange-400 uppercase tracking-wide">Pro Manager</div>
        </div>
      </div>

      {/* User card */}
      <div className="mx-3 mt-3 mb-2 flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-100 truncate">{user?.name}</div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isAdmin ? "bg-orange-500/20 text-orange-400" : "bg-slate-700 text-slate-400"}`}>
            {isAdmin ? "Admin" : "User"}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-2">Main Menu</p>
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
              ${isActive
                ? "bg-orange-500/15 text-orange-400 font-semibold"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-100"}`
            }
          >
            <span className="text-base w-5 text-center">{icon}</span>
            {label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 pt-4 pb-2">Admin</p>
            <NavLink
              to="/admin/users"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive ? "bg-orange-500/15 text-orange-400 font-semibold" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"}`
              }
            >
              <span className="text-base w-5 text-center">👥</span>
              Manage Users
            </NavLink>
          </>
        )}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="mx-3 mb-5 flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all"
      >
        <span>🚪</span> Logout
      </button>
    </aside>
  );
}
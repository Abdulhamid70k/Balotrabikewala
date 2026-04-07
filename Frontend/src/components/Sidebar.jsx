import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LayoutDashboard, Bike, PackageSearch, BarChart3,
  LogOut, ChevronRight,
} from "lucide-react";
import { logoutUser, selectCurrentUser } from "../features/auth/authSlice";
import toast from "react-hot-toast";

const NAV = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/stock",     label: "Stock",     Icon: Bike },
  { to: "/items",     label: "Items",     Icon: PackageSearch },
  { to: "/reports",   label: "Reports",   Icon: BarChart3 },
];

function NavItem({ to, label, Icon, onClick }) {
  return (
    <NavLink to={to} onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 group
         ${isActive
           ? "bg-orange-500/15 text-orange-500 font-semibold"
           : "text-slate-400 hover:bg-white/5 hover:text-white"}`
      }>
      {({ isActive }) => (
        <>
          <Icon size={18} className={isActive ? "text-orange-500" : "text-slate-500 group-hover:text-slate-300"} />
          <span className="flex-1">{label}</span>
          {isActive && <ChevronRight size={14} className="text-orange-400" />}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ open, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user     = useSelector(selectCurrentUser);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success("Logged out!");
    navigate("/login");
  };

  return (
    <aside className={`
      fixed top-0 left-0 h-full w-60 bg-slate-900 flex flex-col z-50
      transition-transform duration-300 ease-in-out
      ${open ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      md:translate-x-0
    `}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
        <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Bike size={20} className="text-white" />
        </div>
        <div>
          <div className="font-display font-bold text-white text-base leading-tight">BikeResell</div>
          <div className="text-orange-400 text-[10px] font-semibold uppercase tracking-wider">Pro Manager</div>
        </div>
      </div>

      {/* User card */}
      <div className="mx-3 mt-3 flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-slate-100 text-sm font-semibold truncate leading-tight">{user?.name}</div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Admin</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2 mb-2">Menu</p>
        {NAV.map((item) => <NavItem key={item.to} {...item} onClick={onClose} />)}
      </nav>

      {/* Logout */}
      <button onClick={handleLogout}
        className="mx-3 mb-5 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all">
        <LogOut size={17} />
        <span>Logout</span>
      </button>
    </aside>
  );
}
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Bike, PackageSearch,
  BarChart3, Plus,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { to: "/dashboard", label: "Home",    Icon: LayoutDashboard },
  { to: "/stock",     label: "Stock",   Icon: Bike },
  null, // center FAB placeholder
  { to: "/items",     label: "Items",   Icon: PackageSearch },
  { to: "/reports",   label: "Reports", Icon: BarChart3 },
];

// Quick Action Menu
function QuickMenu({ open, onClose }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 w-72">
        {[
          { to: "/stock/add",     emoji: "🛒", label: "Purchase Entry",  color: "bg-blue-500" },
          { to: "/stock/service", emoji: "🔧", label: "Service Entry",   color: "bg-purple-500" },
          { to: "/sale",          emoji: "🤝", label: "Sale Entry",      color: "bg-green-500" },
        ].map(({ to, emoji, label, color }) => (
          <NavLink key={to} to={to} onClick={onClose}
            className={`flex items-center gap-3 w-full px-5 py-3.5 ${color} text-white rounded-2xl shadow-lg font-semibold text-sm transition-transform active:scale-95`}>
            <span className="text-xl">{emoji}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </>
  );
}

export default function BottomNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <>
      <QuickMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <nav className="fixed bottom-0 left-0 right-0 z-30 max-w-2xl mx-auto">
        <div className="bg-white border-t border-slate-100 shadow-lg px-2 pb-safe">
          <div className="flex items-center justify-around h-16">
            {NAV.map((item, i) =>
              item === null ? (
                /* Center FAB */
                <button key="fab" onClick={() => setMenuOpen(o => !o)}
                  className={`w-14 h-14 -mt-5 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 ${
                    menuOpen
                      ? "bg-slate-800 rotate-45 scale-110"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}>
                  <Plus size={24} className="text-white" />
                </button>
              ) : (
                <NavLink key={item.to} to={item.to}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
                      isActive
                        ? "text-orange-500"
                        : "text-slate-400 hover:text-slate-600"
                    }`
                  }>
                  {({ isActive }) => (
                    <>
                      <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-orange-50" : ""}`}>
                        <item.Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                      </div>
                      <span className="text-[10px] font-semibold">{item.label}</span>
                    </>
                  )}
                </NavLink>
              )
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
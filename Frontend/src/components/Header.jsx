import { useLocation, Link } from "react-router-dom";
import { Menu, Plus } from "lucide-react";

const TITLES = {
  "/dashboard":   { title: "Dashboard",     sub: "Business overview" },
  "/stock":       { title: "Bike Stock",    sub: "Manage your inventory" },
  "/stock/add":   { title: "Add Bike",      sub: "Purchase entry" },
  "/items":       { title: "Items Master",  sub: "Bike names & makes" },
  "/reports":     { title: "Reports",       sub: "Print & export" },
  "/admin/users": { title: "Users",         sub: "Admin panel" },
};

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation();
  const isEdit = pathname.includes("/edit");
  const info = isEdit
    ? { title: "Edit Bike", sub: "Update details" }
    : (TITLES[pathname] || TITLES[pathname.replace(/\/reports\/.*/, "/reports")] || { title: "BikeResell Pro", sub: "" });

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Menu">
          <Menu size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="font-display font-bold text-slate-900 text-base leading-tight">{info.title}</h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">{info.sub}</p>
        </div>
      </div>

      {pathname === "/stock" && (
        <Link to="/stock/add"
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white pl-3 pr-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <Plus size={16} /> Add Bike
        </Link>
      )}
      {pathname === "/items" && (
        <button id="add-item-btn"
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white pl-3 pr-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          onClick={() => document.dispatchEvent(new CustomEvent("openAddItem"))}>
          <Plus size={16} /> Add Item
        </button>
      )}
    </header>
  );
}
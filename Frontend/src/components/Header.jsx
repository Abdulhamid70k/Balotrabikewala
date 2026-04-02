import { useLocation, Link } from "react-router-dom";

const PAGE_TITLES = {
  "/dashboard":   { title: "Dashboard",     sub: "Business overview" },
  "/stock":       { title: "Bike Stock",    sub: "Manage your inventory" },
  "/stock/add":   { title: "Add New Bike",  sub: "Add a bike to stock" },
  "/reports":     { title: "Reports",       sub: "Profit & loss analysis" },
  "/admin/users": { title: "Manage Users",  sub: "Admin panel" },
};

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation();
  const isEdit = pathname.includes("/edit");
  const info = isEdit
    ? { title: "Edit Bike", sub: "Update bike details" }
    : (PAGE_TITLES[pathname] || { title: "BikeResell Pro", sub: "" });

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger - mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden flex flex-col gap-1.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <span className="block w-5 h-0.5 bg-slate-700 rounded" />
          <span className="block w-5 h-0.5 bg-slate-700 rounded" />
          <span className="block w-5 h-0.5 bg-slate-700 rounded" />
        </button>

        <div>
          <h1 className="font-display text-lg font-bold text-slate-900 leading-tight">{info.title}</h1>
          {info.sub && <p className="text-xs text-slate-400 hidden md:block">{info.sub}</p>}
        </div>
      </div>

      {pathname === "/stock" && (
        <Link
          to="/stock/add"
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <span>+</span> Add Bike
        </Link>
      )}
    </header>
  );
}
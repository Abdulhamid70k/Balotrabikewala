import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../features/auth/authSlice";
import LOGO from "../assets/logo.png";
const PAGE_CONFIG = {
  "/dashboard":     { title: "Dashboard",      back: false },
  "/stock":         { title: "Stock",          back: false },
  "/stock/add":     { title: "Purchase Entry", back: true  },
  "/stock/service": { title: "Service Entry",  back: true  },
  "/items":         { title: "Items Master",   back: false },
  "/reports":       { title: "Reports",        back: false },
  "/sale":          { title: "Sale Entry",     back: true  },
};

export default function Header() {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const user         = useSelector(selectCurrentUser);

  const isEdit  = pathname.includes("/edit");
  const isSell  = pathname.includes("/sell");
  const isDetail = pathname.match(/^\/stock\/[a-f0-9]{24}$/) && !isEdit && !isSell;

  const config = isEdit   ? { title: "Edit Bike",    back: true } :
                 isSell   ? { title: "Sale Entry",   back: true } :
                 isDetail ? { title: "Bike Details", back: true } :
                 PAGE_CONFIG[pathname] || { title: "BikeResell Pro", back: false };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          {config.back ? (
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft size={17} className="text-slate-600" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center">
              <img
                src={LOGO}  
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <span className="font-display font-bold text-slate-900 text-base">{config.title}</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {!config.back && (
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-1.5">
              <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-bold">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </div>
              <span className="text-xs font-semibold text-slate-600">{user?.name?.split(" ")[0] || "Admin"}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
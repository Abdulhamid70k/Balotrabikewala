import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Search, ShoppingCart } from "lucide-react";
import { fetchBikes, selectBikes, selectBikeLoading } from "../features/bikes/bikeSlice";
import { Spinner } from "../components/UI";

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

export default function SaleEntry() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const bikes    = useSelector(selectBikes);
  const loading  = useSelector(selectBikeLoading);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchBikes({ status: "in_stock", limit: 100 }));
  }, [dispatch]);

  const filtered = bikes.filter((b) =>
    !search ||
    b.bikeName?.toLowerCase().includes(search.toLowerCase()) ||
    b.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
    b.bikeMake?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-4 py-4 space-y-4 pb-10">

      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center">
            <ShoppingCart size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-display font-bold text-white text-lg">Sale Entry</h2>
            <p className="text-slate-400 text-xs">Konsi bike bechni hai? Select karo</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-200 text-sm outline-none focus:border-green-400 focus:ring-4 focus:ring-green-50 bg-white transition-all"
          placeholder="Bike name, make ya reg number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {/* Bike list */}
      {loading ? (
        <Spinner center size="lg" />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <ShoppingCart size={40} className="mb-3 text-slate-200" />
          <p className="text-sm font-medium">
            {bikes.length === 0 ? "Stock mein koi bike nahi hai" : "Koi bike nahi mili"}
          </p>
          {bikes.length === 0 && (
            <p className="text-xs text-slate-300 mt-1">Pehle purchase entry karo</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 font-medium px-1">{filtered.length} bike(s) available</p>
          {filtered.map((b) => (
            <button
              key={b._id}
              onClick={() => navigate(`/stock/${b._id}/sell`)}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-slate-100 hover:border-green-300 hover:bg-green-50 active:scale-[0.99] transition-all text-left"
            >
              {/* Bike icon */}
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl flex-shrink-0">
                🏍️
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 text-sm truncate">{b.bikeName}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {[b.bikeMake, b.year, b.color].filter(Boolean).join(" • ")}
                </div>
                {b.registrationNumber && (
                  <div className="text-xs font-mono text-slate-300 mt-0.5">{b.registrationNumber}</div>
                )}
              </div>

              {/* Price + arrow */}
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-slate-400">Buy price</div>
                <div className="font-bold text-slate-700 text-sm">{fmt(b.purchase?.buyPrice)}</div>
                <div className="text-green-500 text-xs font-bold mt-1">Sell →</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Pencil, Trash2, Eye, Plus, Bike, ShoppingCart } from "lucide-react";
import {
  fetchBikes, deleteBike,
  selectBikes, selectBikeLoading, selectPagination,
} from "../features/bikes/bikeSlice";
import { selectIsAdmin } from "../features/auth/authSlice";
import { StatusBadge, Spinner, EmptyState, ConfirmDialog } from "../components/UI";
import toast from "react-hot-toast";

const fmt  = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

// Default: only show in_stock and pending — sold bikes sirf Sales report mein
const STATUS_OPTS = [
  { value: "in_stock",        label: "Stock Mein" },
  { value: "pending_arrival", label: "Aani Baaki" },
];

export default function StockList() {
  const dispatch   = useDispatch();
  const bikes      = useSelector(selectBikes);
  const loading    = useSelector(selectBikeLoading);
  const pagination = useSelector(selectPagination);
  const isAdmin    = useSelector(selectIsAdmin);
  const [searchParams, setSearchParams] = useSearchParams();

  const [search,   setSearch]   = useState(searchParams.get("search") || "");
  const [status,   setStatus]   = useState(searchParams.get("status") || "in_stock");
  const [sortBy,   setSortBy]   = useState("-createdAt");
  const [page,     setPage]     = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    const p = { page, limit: 20, sortBy };
    // Never show sold bikes in stock list
    p.status = status || "in_stock";
    if (search) p.search = search;
    dispatch(fetchBikes(p));
  }, [dispatch, page, sortBy, status, search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    setDeleting(true);
    const r = await dispatch(deleteBike(deleteId));
    if (!r.error) toast.success("Bike delete ho gayi!");
    else toast.error("Delete nahi ho saka");
    setDeleting(false);
    setDeleteId(null);
    load();
  };

  const selCls = "px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-orange-400 cursor-pointer";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
            placeholder="Bike ya seller search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 text-xs">✕</button>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {STATUS_OPTS.map((o) => (
            <button key={o.value} onClick={() => { setStatus(o.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                status === o.value ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              {o.label}
            </button>
          ))}
        </div>

        <select className={selCls} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="-createdAt">Naye pehle</option>
          <option value="createdAt">Purane pehle</option>
          <option value="-purchase.buyPrice">Buy price ↓</option>
          <option value="purchase.buyPrice">Buy price ↑</option>
        </select>
      </div>

      {!loading && (
        <p className="text-xs text-slate-400 font-medium">{pagination.total} bikes</p>
      )}

      {/* Table */}
      {loading ? <Spinner center size="lg" /> : bikes.length === 0 ? (
        <EmptyState
          icon={<Bike size={40} className="text-slate-200" />}
          title={status === "pending_arrival" ? "Koi pending bike nahi" : "Stock empty hai"}
          message="Nai bike add karo"
          action={
            <Link to="/stock/add" className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
              <Plus size={15} /> Add Bike
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Bike", "Reg. No.", "Year", "Status", "Buy Price", "Service", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bikes.map((b, i) => (
                  <tr key={b._id} className={`border-b border-slate-50 hover:bg-orange-50/30 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/30"}`}>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">{b.bikeName}</div>
                      <div className="text-xs text-slate-400">{b.bikeMake || ""}</div>
                      {b.purchase?.buyFrom && <div className="text-xs text-slate-300">📍 {b.purchase.buyFrom}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{b.registrationNumber || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{b.year || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{fmt(b.purchase?.buyPrice)}</td>
                    <td className="px-4 py-3 text-slate-500">{fmt(b.service?.totalCost)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* SELL — most prominent, only for in_stock */}
                        {b.status === "in_stock" && (
                          <Link to={`/stock/${b._id}/sell`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-colors">
                            <ShoppingCart size={12} /> Sell
                          </Link>
                        )}
                        <Link to={`/stock/${b._id}`}
                          className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors" title="View">
                          <Eye size={14} />
                        </Link>
                        <Link to={`/stock/${b._id}/edit`}
                          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Pencil size={14} />
                        </Link>
                        {isAdmin && (
                          <button onClick={() => setDeleteId(b._id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2 flex-wrap">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-500 hover:border-orange-300 disabled:opacity-40 transition-colors">
            ← Pehle
          </button>
          {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setPage(n)}
              className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${n === page ? "bg-orange-500 text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-orange-300"}`}>
              {n}
            </button>
          ))}
          <button disabled={page === pagination.pages} onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-500 hover:border-orange-300 disabled:opacity-40 transition-colors">
            Agle →
          </button>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Bike Delete Karo?"
          message="Ye action undo nahi hoga."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, Pencil, Trash2, Eye, Plus, Bike } from "lucide-react";
import {
  fetchBikes, deleteBike,
  selectBikes, selectBikeLoading, selectPagination,
} from "../features/bikes/bikeSlice";
import { selectIsAdmin } from "../features/auth/authSlice";
import { StatusBadge, Spinner, EmptyState, ConfirmDialog } from "../components/UI";
import toast from "react-hot-toast";

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const fmtD = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";

const STATUS_OPTS = [
  { value: "",                label: "All Status" },
  { value: "in_stock",        label: "Stock Mein" },
  { value: "pending_arrival", label: "Aani Baaki" },
  { value: "sold",            label: "Bech Di" },
];

export default function StockList() {
  const dispatch   = useDispatch();
  const bikes      = useSelector(selectBikes);
  const loading    = useSelector(selectBikeLoading);
  const pagination = useSelector(selectPagination);
  const isAdmin    = useSelector(selectIsAdmin);
  const [searchParams, setSearchParams] = useSearchParams();

  const [search,   setSearch]   = useState(searchParams.get("search") || "");
  const [status,   setStatus]   = useState(searchParams.get("status") || "");
  const [sortBy,   setSortBy]   = useState("-createdAt");
  const [page,     setPage]     = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [view,     setView]     = useState("table"); // table | card

  const load = useCallback(() => {
    const p = { page, limit: 15, sortBy };
    if (status) p.status = status;
    if (search) p.search = search;
    dispatch(fetchBikes(p));
  }, [dispatch, page, sortBy, status, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const p = {};
    if (status) p.status = status;
    if (search) p.search = search;
    setSearchParams(p, { replace: true });
  }, [status, search, setSearchParams]);

  const handleDelete = async () => {
    setDeleting(true);
    const r = await dispatch(deleteBike(deleteId));
    if (!r.error) toast.success("Bike delete ho gayi!");
    else toast.error("Delete nahi ho saka");
    setDeleting(false);
    setDeleteId(null);
    load();
  };

  const profit = (b) => b.status !== "sold" ? null
    : (b.sale?.sellPrice||0) - (b.purchase?.buyPrice||0) - (b.service?.totalCost||0) - (b.rc?.charge||0);

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
        <select className={selCls} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className={selCls} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="-createdAt">Naye pehle</option>
          <option value="createdAt">Purane pehle</option>
          <option value="-purchase.buyPrice">Buy price ↓</option>
          <option value="purchase.buyPrice">Buy price ↑</option>
          <option value="-sale.sellDate">Sell date ↓</option>
        </select>
        {/* View toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {["table","card"].map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === v ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {v === "table" ? "☰" : "⊞"}
            </button>
          ))}
        </div>
      </div>

      {!loading && (
        <p className="text-xs text-slate-400 font-medium">{pagination.total} bikes mili</p>
      )}

      {/* Content */}
      {loading ? <Spinner center size="lg" /> : bikes.length === 0 ? (
        <EmptyState icon={<Bike size={40} className="text-slate-200" />} title="Koi bike nahi mili"
          message="Filter change karo ya nai bike add karo"
          action={<Link to="/stock/add" className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"><Plus size={15} /> Add Bike</Link>} />
      ) : view === "table" ? (
        /* ── TABLE VIEW ─── */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Bike","Year","Status","Buy Price","Sell Price","Customer","P&L","Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bikes.map((b, i) => {
                  const p      = profit(b);
                  const hasDue = Number(b.sale?.cash?.amountDue) > 0;
                  return (
                    <tr key={b._id} className={`border-b border-slate-50 hover:bg-orange-50/40 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/30"}`}>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800 text-sm">{b.bikeName}</div>
                        <div className="text-xs text-slate-400">{b.bikeMake || ""} {b.registrationNumber ? `• ${b.registrationNumber}` : ""}</div>
                        {hasDue && <span className="text-[10px] text-red-500 font-bold">DUE: {fmt(b.sale?.cash?.amountDue)}</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{b.year || "—"}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{fmt(b.purchase?.buyPrice)}</td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{b.sale?.sellPrice ? fmt(b.sale.sellPrice) : "—"}</td>
                      <td className="px-4 py-3">
                        {b.sale?.customer?.name ? (
                          <div>
                            <div className="text-xs font-semibold text-slate-700">{b.sale.customer.name}</div>
                            <div className="text-xs text-slate-400">{b.sale.customer.mobile || ""}</div>
                          </div>
                        ) : "—"}
                      </td>
                      <td className={`px-4 py-3 font-bold text-sm ${p === null ? "text-slate-300" : p >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {p === null ? "—" : fmt(p)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link to={`/stock/${b._id}`} className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                            <Eye size={14} />
                          </Link>
                          <Link to={`/stock/${b._id}/edit`} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                            <Pencil size={14} />
                          </Link>
                          {isAdmin && (
                            <button onClick={() => setDeleteId(b._id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── CARD VIEW ─── */
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {bikes.map((b) => {
            const p      = profit(b);
            const hasDue = Number(b.sale?.cash?.amountDue) > 0;
            return (
              <div key={b._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col">
                <div className="flex items-start justify-between p-4 pb-3">
                  <div>
                    <h3 className="font-display font-bold text-slate-900">{b.bikeName}</h3>
                    <p className="text-xs text-slate-400">{b.bikeMake || ""}{b.year ? ` • ${b.year}` : ""}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                <div className="grid grid-cols-3 divide-x divide-slate-100 border-y border-slate-100">
                  {[
                    { label: "Khareed", val: fmt(b.purchase?.buyPrice) },
                    { label: "Service", val: fmt(b.service?.totalCost) },
                    b.status === "sold"
                      ? { label: "Profit", val: fmt(p), cls: p >= 0 ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50" }
                      : { label: "RC", val: b.rc?.transferred ? "Yes" : "No" },
                  ].map((cell, i) => (
                    <div key={i} className={`px-3 py-2 ${cell.cls || "bg-slate-50"}`}>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">{cell.label}</div>
                      <div className={`text-sm font-bold mt-0.5 ${cell.cls ? "" : "text-slate-800"}`}>{cell.val}</div>
                    </div>
                  ))}
                </div>

                <div className="px-4 py-2 space-y-1">
                  {b.sale?.customer?.name && (
                    <p className="text-xs text-slate-500">👤 {b.sale.customer.name} {b.sale.customer.mobile ? `• ${b.sale.customer.mobile}` : ""}</p>
                  )}
                  {hasDue && (
                    <p className="text-xs text-red-500 font-semibold">⚠️ Due: {fmt(b.sale?.cash?.amountDue)}</p>
                  )}
                </div>

                <div className="flex gap-2 p-3 mt-auto border-t border-slate-50">
                  <Link to={`/stock/${b._id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-colors">
                    <Eye size={13} /> View
                  </Link>
                  <Link to={`/stock/${b._id}/edit`} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-xs font-semibold transition-colors">
                    <Pencil size={13} /> Edit
                  </Link>
                  {isAdmin && (
                    <button onClick={() => setDeleteId(b._id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-xs transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2 flex-wrap">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-500 hover:border-orange-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            ← Pehle
          </button>
          {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setPage(n)}
              className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${n === page ? "bg-orange-500 text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-orange-300"}`}>
              {n}
            </button>
          ))}
          <button disabled={page === pagination.pages} onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-500 hover:border-orange-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Agle →
          </button>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Bike Delete Karo?"
          message="Ye action undo nahi hoga. Bike permanently delete ho jayegi."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
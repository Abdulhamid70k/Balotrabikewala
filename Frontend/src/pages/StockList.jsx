import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import {
  fetchBikes, deleteBike,
  selectBikes, selectBikeLoading, selectPagination,
} from "../features/bikes/bikeSlice";
import { selectIsAdmin } from "../features/auth/authSlice";
import { StatusBadge, Spinner, EmptyState, ConfirmDialog } from "../components/UI";
import toast from "react-hot-toast";

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

const STATUS_OPTS = [
  { value: "",                label: "Sabhi Status" },
  { value: "in_stock",        label: "Stock Mein" },
  { value: "pending_arrival", label: "Aani Baaki" },
  { value: "sold",            label: "Bech Di" },
];

const sel = "px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:border-orange-400 cursor-pointer transition-colors";

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

  const load = useCallback(() => {
    const p = { page, limit: 10, sortBy };
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

  const profit = (b) =>
    b.status !== "sold" ? null
    : (b.sale?.sellPrice || 0) - (b.purchase?.buyPrice || 0)
      - (b.service?.totalCost || 0) - (b.rc?.charge || 0);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">🔍</span>
          <input
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
            placeholder="Model ya seller search karo..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 text-xs">✕</button>
          )}
        </div>
        <select className={sel} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className={sel} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="-createdAt">Naye pehle</option>
          <option value="createdAt">Purane pehle</option>
          <option value="-purchase.buyPrice">Buy price ↓</option>
          <option value="purchase.buyPrice">Buy price ↑</option>
        </select>
      </div>

      {!loading && (
        <p className="text-xs text-slate-400 font-medium">
          {pagination.total} bike{pagination.total !== 1 ? "s" : ""} mili
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <Spinner center size="lg" />
      ) : bikes.length === 0 ? (
        <EmptyState
          icon="🏍️"
          title="Koi bike nahi mili"
          message="Filter change karo ya nai bike add karo"
          action={
            <Link to="/stock/add"
              className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              + Add Bike
            </Link>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {bikes.map((b) => {
            const p      = profit(b);
            const hasDue = Number(b.sale?.cash?.amountDue) > 0;
            return (
              <div key={b._id}
                className="bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all flex flex-col overflow-hidden">
                {/* Image */}
                {b.images?.length > 0 && (
                  <img src={b.images[0].url} alt={b.model} className="w-full h-40 object-cover" />
                )}

                {/* Head */}
                <div className="flex items-start justify-between px-4 pt-4 pb-2">
                  <div>
                    <h3 className="font-display font-bold text-slate-900 leading-tight">{b.model}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {b.year}{b.color ? ` • ${b.color}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                {/* Price grid */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 border-y border-slate-100">
                  <div className="px-3 py-2 bg-slate-50">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">Khareed</div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">{fmt(b.purchase?.buyPrice)}</div>
                  </div>
                  <div className="px-3 py-2 bg-slate-50">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">Service</div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">{fmt(b.service?.totalCost)}</div>
                  </div>
                  {b.status === "sold" ? (
                    <div className={`px-3 py-2 ${p >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">Profit</div>
                      <div className={`text-sm font-bold mt-0.5 ${p >= 0 ? "text-green-600" : "text-red-500"}`}>{fmt(p)}</div>
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-slate-50">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">RC</div>
                      <div className="text-sm font-bold text-slate-800 mt-0.5">
                        {b.rc?.transferred ? fmt(b.rc.charge) : "Nahi"}
                      </div>
                    </div>
                  )}
                </div>

                {/* Alerts */}
                <div className="px-4 pt-2 space-y-1.5">
                  {hasDue && (
                    <div className="text-xs bg-red-50 border border-red-100 text-red-700 px-3 py-2 rounded-lg">
                      ⚠️ Due: <strong>{fmt(b.sale?.cash?.amountDue)}</strong>
                      {b.sale?.cash?.dueDate &&
                        ` — ${new Date(b.sale.cash.dueDate).toLocaleDateString("en-IN")}`}
                    </div>
                  )}
                  {b.sale?.paymentType === "finance" && b.sale?.finance?.companyName && (
                    <div className="text-xs bg-blue-50 border border-blue-100 text-blue-700 px-3 py-2 rounded-lg">
                      🏦 {b.sale.finance.companyName} — {fmt(b.sale.finance.emiAmount)}/mo × {b.sale.finance.emiMonths}m
                    </div>
                  )}
                  {b.purchase?.buyFrom && (
                    <p className="text-xs text-slate-400">📍 {b.purchase.buyFrom}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 px-4 py-3 mt-auto">
                  <Link to={`/stock/${b._id}`}
                    className="flex-1 text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors">
                    View
                  </Link>
                  <Link to={`/stock/${b._id}/edit`}
                    className="flex-1 text-center py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold transition-colors">
                    ✏️ Edit
                  </Link>
                  {isAdmin && (
                    <button onClick={() => setDeleteId(b._id)}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs transition-colors">
                      🗑️
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
            className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-500 hover:border-orange-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            ← Pehle
          </button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setPage(n)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                n === page
                  ? "bg-orange-500 text-white"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-orange-300"
              }`}>{n}</button>
          ))}
          <button disabled={page === pagination.pages} onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-500 hover:border-orange-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Agle →
          </button>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Bike Delete Karo?"
          message="Ye action undo nahi hoga. Bike aur sari images permanently delete ho jayengi."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
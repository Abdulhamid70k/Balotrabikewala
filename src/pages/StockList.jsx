import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import {
  fetchBikes, deleteBike,
  selectBikes, selectBikeLoading, selectPagination,
  clearBikeMessages,
} from "../features/bikes/bikesslice";
import { selectIsAdmin } from "../features/auth/authSlice";
import { StatusBadge, Spinner, EmptyState, ConfirmDialog } from "../components/UI";
import toast from "react-hot-toast";
import styles from "./StockList.module.css";

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

const STATUS_OPTIONS = [
  { value: "",                label: "Sabhi Status" },
  { value: "in_stock",        label: "Stock Mein" },
  { value: "pending_arrival", label: "Aani Baaki" },
  { value: "sold",            label: "Bech Di" },
];

const SORT_OPTIONS = [
  { value: "-createdAt",       label: "Naye pehle" },
  { value: "createdAt",        label: "Purane pehle" },
  { value: "-purchase.buyPrice", label: "Buy price ↓" },
  { value: "purchase.buyPrice",  label: "Buy price ↑" },
  { value: "-sale.sellPrice",    label: "Sell price ↓" },
];

export default function StockList() {
  const dispatch = useDispatch();
  const bikes    = useSelector(selectBikes);
  const loading  = useSelector(selectBikeLoading);
  const pagination = useSelector(selectPagination);
  const isAdmin  = useSelector(selectIsAdmin);
  const [searchParams, setSearchParams] = useSearchParams();

  const [search,  setSearch]  = useState(searchParams.get("search") || "");
  const [status,  setStatus]  = useState(searchParams.get("status") || "");
  const [sortBy,  setSortBy]  = useState("-createdAt");
  const [page,    setPage]    = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    const params = { page, limit: 10, sortBy };
    if (status) params.status = status;
    if (search) params.search = search;
    dispatch(fetchBikes(params));
  }, [dispatch, page, sortBy, status, search]);

  useEffect(() => { load(); }, [load]);

  // Sync URL params
  useEffect(() => {
    const p = {};
    if (status) p.status = status;
    if (search) p.search = search;
    setSearchParams(p, { replace: true });
  }, [status, search, setSearchParams]);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await dispatch(deleteBike(deleteId));
    if (!result.error) {
      toast.success("Bike delete ho gayi!");
    } else {
      toast.error("Delete nahi ho saka");
    }
    setDeleting(false);
    setDeleteId(null);
    load();
  };

  const profit = (b) => {
    if (b.status !== "sold") return null;
    return (b.sale?.sellPrice || 0) - (b.purchase?.buyPrice || 0) -
           (b.service?.totalCost || 0) - (b.rc?.charge || 0);
  };

  return (
    <div className={styles.page}>
      {/* Filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Model ya seller search karo..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        <div className={styles.filters}>
          <select className={styles.select} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className={styles.select} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Count */}
      {!loading && (
        <p className={styles.count}>
          {pagination.total} bike{pagination.total !== 1 ? "s" : ""} mili
          {status ? ` (${STATUS_OPTIONS.find(o => o.value === status)?.label})` : ""}
        </p>
      )}

      {/* List */}
      {loading ? (
        <Spinner center size="lg" />
      ) : bikes.length === 0 ? (
        <EmptyState
          icon="🏍️"
          title="Koi bike nahi mili"
          message="Filter change karo ya nai bike add karo"
          action={<Link to="/stock/add" className={styles.addBtn}>+ Add Bike</Link>}
        />
      ) : (
        <div className={styles.grid}>
          {bikes.map((b) => {
            const p = profit(b);
            const hasDue = Number(b.sale?.cash?.amountDue) > 0;
            return (
              <div key={b._id} className={styles.card}>
                {/* Card Header */}
                <div className={styles.cardHead}>
                  <div>
                    <h3 className={styles.model}>{b.model}</h3>
                    <span className={styles.meta}>{b.year}{b.color ? ` • ${b.color}` : ""}</span>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                {/* Image strip */}
                {b.images?.length > 0 && (
                  <img src={b.images[0].url} alt={b.model} className={styles.cardImg} />
                )}

                {/* Price Grid */}
                <div className={styles.priceGrid}>
                  <div className={styles.priceBox}>
                    <span className={styles.priceLabel}>Khareed</span>
                    <span className={styles.priceVal}>{fmt(b.purchase?.buyPrice)}</span>
                  </div>
                  <div className={styles.priceBox}>
                    <span className={styles.priceLabel}>Service</span>
                    <span className={styles.priceVal}>{fmt(b.service?.totalCost)}</span>
                  </div>
                  {b.status === "sold" ? (
                    <div className={`${styles.priceBox} ${p >= 0 ? styles.profitBox : styles.lossBox}`}>
                      <span className={styles.priceLabel}>Profit</span>
                      <span className={`${styles.priceVal} ${p >= 0 ? styles.profitText : styles.lossText}`}>
                        {fmt(p)}
                      </span>
                    </div>
                  ) : (
                    <div className={styles.priceBox}>
                      <span className={styles.priceLabel}>RC Transfer</span>
                      <span className={styles.priceVal}>{b.rc?.transferred ? fmt(b.rc.charge) : "Nahi"}</span>
                    </div>
                  )}
                </div>

                {/* Due Alert */}
                {hasDue && (
                  <div className={styles.dueAlert}>
                    ⚠️ Due Baaki: <strong>{fmt(b.sale?.cash?.amountDue)}</strong>
                    {b.sale?.cash?.dueDate && (
                      <span> — {new Date(b.sale.cash.dueDate).toLocaleDateString("en-IN")}</span>
                    )}
                  </div>
                )}

                {/* Finance tag */}
                {b.sale?.paymentType === "finance" && b.sale?.finance?.companyName && (
                  <div className={styles.financeTag}>
                    🏦 {b.sale.finance.companyName} — {fmt(b.sale.finance.emiAmount)}/month × {b.sale.finance.emiMonths} months
                  </div>
                )}

                {/* Seller */}
                {b.purchase?.buyFrom && (
                  <p className={styles.seller}>📍 Khareed: {b.purchase.buyFrom}</p>
                )}

                {/* Actions */}
                <div className={styles.actions}>
                  <Link to={`/stock/${b._id}`} className={styles.btnView}>View</Link>
                  <Link to={`/stock/${b._id}/edit`} className={styles.btnEdit}>✏️ Edit</Link>
                  {isAdmin && (
                    <button className={styles.btnDel} onClick={() => setDeleteId(b._id)}>🗑️</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >← Pehle</button>

          {Array.from({ length: pagination.pages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === pagination.pages || Math.abs(p - page) <= 1)
            .reduce((acc, p, i, arr) => {
              if (i > 0 && p - arr[i-1] > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span key={`dot-${i}`} className={styles.pageDot}>…</span>
              ) : (
                <button
                  key={p}
                  className={`${styles.pageBtn} ${p === page ? styles.pageActive : ""}`}
                  onClick={() => setPage(p)}
                >{p}</button>
              )
            )}

          <button
            className={styles.pageBtn}
            disabled={page === pagination.pages}
            onClick={() => setPage(page + 1)}
          >Agle →</button>
        </div>
      )}

      {/* Confirm Delete */}
      {deleteId && (
        <ConfirmDialog
          title="Bike Delete Karo?"
          message="Ye action undo nahi ho sakta. Bike aur uski sari images delete ho jayengi."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
import { useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchBike, deleteBike, selectCurrentBike, selectBikeLoading } from "../features/bikes/bikesslice";
import { selectIsAdmin } from "../features/auth/authSlice";
import { StatusBadge, Spinner } from "../components/UI";
import toast from "react-hot-toast";
import styles from "./BikeDetails.Module.css";

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function BikeDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const bike = useSelector(selectCurrentBike);
  const loading = useSelector(selectBikeLoading);
  const isAdmin = useSelector(selectIsAdmin);

  useEffect(() => { dispatch(fetchBike(id)); }, [id, dispatch]);

  const handleDelete = async () => {
    if (!confirm("Is bike ko permanently delete karna chahte ho?")) return;
    const result = await dispatch(deleteBike(id));
    if (!result.error) {
      toast.success("Bike delete ho gayi");
      navigate("/stock");
    } else {
      toast.error("Delete nahi ho saka");
    }
  };

  const handlePrint = () => window.print();

  if (loading) return <Spinner center size="lg" />;
  if (!bike) return <div style={{ padding: 32, color: "var(--text-muted)" }}>Bike nahi mili.</div>;

  const profit = bike.status === "sold"
    ? (bike.sale?.sellPrice || 0) - (bike.purchase?.buyPrice || 0) -
      (bike.service?.totalCost || 0) - (bike.rc?.charge || 0)
    : null;

  const hasDue = Number(bike.sale?.cash?.amountDue) > 0;

  return (
    <div className={styles.page}>
      {/* ── Header ────────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <h2 className={styles.bikeName}>{bike.model}</h2>
          <div className={styles.bikeMeta}>
            {bike.year && <span>{bike.year}</span>}
            {bike.color && <span>• {bike.color}</span>}
            {bike.registrationNumber && <span>• {bike.registrationNumber}</span>}
          </div>
        </div>
        <div className={styles.topRight}>
          <StatusBadge status={bike.status} />
          <button className={styles.printBtn} onClick={handlePrint}>🖨️ Print</button>
          <Link to={`/stock/${id}/edit`} className={styles.editBtn}>✏️ Edit</Link>
          {isAdmin && (
            <button className={styles.deleteBtn} onClick={handleDelete}>🗑️ Delete</button>
          )}
        </div>
      </div>

      {/* ── Images ────────────────────────────────────────────── */}
      {bike.images?.length > 0 && (
        <div className={styles.imgStrip}>
          {bike.images.map((img) => (
            <img key={img.public_id} src={img.url} alt={bike.model} className={styles.img} />
          ))}
        </div>
      )}

      {/* ── Profit Summary (if sold) ───────────────────────────── */}
      {profit !== null && (
        <div className={`${styles.profitBanner} ${profit >= 0 ? styles.profitGreen : styles.profitRed}`}>
          <div>
            <div className={styles.profitLabel}>Net Profit / Loss</div>
            <div className={styles.profitValue}>{fmt(profit)}</div>
          </div>
          <div className={styles.profitBreakdown}>
            <span>Sell {fmt(bike.sale?.sellPrice)}</span>
            <span>− Buy {fmt(bike.purchase?.buyPrice)}</span>
            <span>− Service {fmt(bike.service?.totalCost)}</span>
            {bike.rc?.transferred && <span>− RC {fmt(bike.rc?.charge)}</span>}
          </div>
        </div>
      )}

      {/* ── Due Alert ─────────────────────────────────────────── */}
      {hasDue && (
        <div className={styles.dueAlert}>
          ⚠️ <strong>Due Baaki: {fmt(bike.sale?.cash?.amountDue)}</strong>
          {bike.sale?.cash?.dueDate && ` — ${fmtDate(bike.sale.cash.dueDate)} tak dena hai`}
          {new Date(bike.sale?.cash?.dueDate) < new Date() && (
            <span className={styles.overdueTag}>OVERDUE</span>
          )}
        </div>
      )}

      {/* ── Detail Grid ───────────────────────────────────────── */}
      <div className={styles.detailGrid}>
        {/* Purchase */}
        <div className={styles.card}>
          <h4 className={styles.cardTitle}>🛒 Purchase Details</h4>
          <Row label="Seller" value={bike.purchase?.buyFrom || "—"} />
          <Row label="Kharidne ki Tarikh" value={fmtDate(bike.purchase?.buyDate)} />
          <Row label="Buy Price" value={fmt(bike.purchase?.buyPrice)} highlight />
        </div>

        {/* Service */}
        <div className={styles.card}>
          <h4 className={styles.cardTitle}>🔧 Service Details</h4>
          {bike.service?.items?.length > 0 ? (
            bike.service.items.map((item, i) => (
              <Row key={i} label={item.name} value={`₹${Number(item.cost).toLocaleString("en-IN")}`} />
            ))
          ) : (
            <p className={styles.emptyNote}>Koi service items nahi</p>
          )}
          <Row label="Total Service Kharcha" value={fmt(bike.service?.totalCost)} highlight />
          {bike.service?.notes && <Row label="Notes" value={bike.service.notes} />}
        </div>

        {/* RC */}
        <div className={styles.card}>
          <h4 className={styles.cardTitle}>📄 RC Transfer</h4>
          <Row label="RC Transfer" value={bike.rc?.transferred ? "Haan ✅" : "Nahi ❌"} />
          {bike.rc?.transferred && (
            <>
              <Row label="Transfer Charge" value={fmt(bike.rc?.charge)} highlight />
              <Row label="Transfer Date" value={fmtDate(bike.rc?.transferDate)} />
            </>
          )}
        </div>

        {/* Sale (if sold) */}
        {bike.status === "sold" && (
          <div className={styles.card}>
            <h4 className={styles.cardTitle}>🤝 Sale Details</h4>
            <Row label="Sell Price" value={fmt(bike.sale?.sellPrice)} highlight />
            <Row label="Sell Date" value={fmtDate(bike.sale?.sellDate)} />
            <Row label="Payment Type" value={bike.sale?.paymentType === "finance" ? "Finance 🏦" : "Cash 💵"} />

            {bike.sale?.paymentType === "cash" ? (
              <>
                <Row label="Cash Mila" value={fmt(bike.sale?.cash?.amountPaid)} />
                <Row label="Due Baaki" value={fmt(bike.sale?.cash?.amountDue)} />
                {hasDue && <Row label="Due Date" value={fmtDate(bike.sale?.cash?.dueDate)} />}
              </>
            ) : (
              <>
                <Row label="Finance Company" value={bike.sale?.finance?.companyName || "—"} />
                <Row label="Finance Amount" value={fmt(bike.sale?.finance?.financeAmount)} />
                <Row label="EMI" value={`${fmt(bike.sale?.finance?.emiAmount)} × ${bike.sale?.finance?.emiMonths} months`} />
                <Row label="EMI Start" value={fmtDate(bike.sale?.finance?.startDate)} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      {bike.notes && (
        <div className={styles.notesCard}>
          <h4 className={styles.cardTitle}>📝 Notes</h4>
          <p className={styles.notesText}>{bike.notes}</p>
        </div>
      )}

      {/* ── PRINT VIEW (only visible when printing) ─────────── */}
      <div className={styles.printOnly}>
        <div className={styles.printHeader}>
          <div className={styles.printBrand}>🏍️ BikeResell Pro — Bike Report</div>
          <div>Print Date: {new Date().toLocaleDateString("en-IN")}</div>
        </div>
        <h2>{bike.model} {bike.year ? `(${bike.year})` : ""}</h2>
        <p>{bike.color} {bike.registrationNumber ? `• ${bike.registrationNumber}` : ""}</p>
        <table className={styles.printTable}>
          <tbody>
            {[
              ["Status", bike.status === "in_stock" ? "Stock Mein" : bike.status === "pending_arrival" ? "Aani Baaki" : "Bech Di"],
              ["Seller", bike.purchase?.buyFrom || "—"],
              ["Buy Date", fmtDate(bike.purchase?.buyDate)],
              ["Buy Price", fmt(bike.purchase?.buyPrice)],
              ["Service Cost", fmt(bike.service?.totalCost)],
              ["RC Transfer", bike.rc?.transferred ? `Haan — ${fmt(bike.rc?.charge)}` : "Nahi"],
              ["Sell Price", fmt(bike.sale?.sellPrice)],
              ["Sell Date", fmtDate(bike.sale?.sellDate)],
              ["Payment", bike.sale?.paymentType === "finance" ? `Finance — ${bike.sale?.finance?.companyName}` : "Cash"],
              ...(bike.sale?.paymentType === "cash" ? [
                ["Cash Mila", fmt(bike.sale?.cash?.amountPaid)],
                ["Due Baaki", fmt(bike.sale?.cash?.amountDue)],
              ] : [
                ["Finance Amount", fmt(bike.sale?.finance?.financeAmount)],
                ["EMI", `${fmt(bike.sale?.finance?.emiAmount)} × ${bike.sale?.finance?.emiMonths} months`],
              ]),
              ...(profit !== null ? [["Net Profit/Loss", fmt(profit)]] : []),
            ].map(([k, v]) => (
              <tr key={k}><td className={styles.printKey}>{k}</td><td>{v}</td></tr>
            ))}
          </tbody>
        </table>
        {bike.notes && <p style={{ marginTop: 12, fontSize: 12 }}><strong>Notes:</strong> {bike.notes}</p>}
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={`${styles.rowValue} ${highlight ? styles.rowHighlight : ""}`}>{value}</span>
    </div>
  );
}
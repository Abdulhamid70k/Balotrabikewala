import styles from "./UI.module.css";

/* ─── StatCard ───────────────────────────────────────────────────────────────── */
export function StatCard({ label, value, icon, color = "brand", trend }) {
  return (
    <div className={`${styles.statCard} ${styles[color]}`}>
      <div className={styles.statTop}>
        <span className={styles.statIcon}>{icon}</span>
        {trend !== undefined && (
          <span className={`${styles.trend} ${trend >= 0 ? styles.up : styles.down}`}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

/* ─── Badge ─────────────────────────────────────────────────────────────────── */
const STATUS_MAP = {
  in_stock:        { label: "Stock Mein",  color: "info" },
  pending_arrival: { label: "Aani Baaki",  color: "warning" },
  sold:            { label: "Bech Di",     color: "success" },
};

export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, color: "default" };
  return <span className={`${styles.badge} ${styles[s.color]}`}>{s.label}</span>;
}

export function RoleBadge({ role }) {
  return (
    <span className={`${styles.badge} ${role === "admin" ? styles.brand : styles.default}`}>
      {role}
    </span>
  );
}

/* ─── Spinner ────────────────────────────────────────────────────────────────── */
export function Spinner({ size = "md", center = false }) {
  return (
    <div className={center ? styles.spinnerCenter : ""}>
      <div className={`${styles.spinner} ${styles[`spinner_${size}`]}`} />
    </div>
  );
}

/* ─── Empty state ────────────────────────────────────────────────────────────── */
export function EmptyState({ icon = "🏍️", title, message, action }) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>{icon}</span>
      <h3 className={styles.emptyTitle}>{title}</h3>
      {message && <p className={styles.emptyMsg}>{message}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

/* ─── Card ───────────────────────────────────────────────────────────────────── */
export function Card({ children, className = "", padding = true }) {
  return (
    <div className={`${styles.card} ${padding ? styles.cardPadded : ""} ${className}`}>
      {children}
    </div>
  );
}

/* ─── Section Header ─────────────────────────────────────────────────────────── */
export function SectionHeader({ title, children }) {
  return (
    <div className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children && <div>{children}</div>}
    </div>
  );
}

/* ─── Confirm Dialog ─────────────────────────────────────────────────────────── */
export function ConfirmDialog({ title, message, onConfirm, onCancel, loading }) {
  return (
    <div className={styles.dialogBackdrop}>
      <div className={styles.dialog}>
        <h3 className={styles.dialogTitle}>{title}</h3>
        <p className={styles.dialogMsg}>{message}</p>
        <div className={styles.dialogActions}>
          <button className={styles.btnGhost} onClick={onCancel} disabled={loading}>Cancel</button>
          <button className={styles.btnDanger} onClick={onConfirm} disabled={loading}>
            {loading ? <Spinner size="sm" /> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
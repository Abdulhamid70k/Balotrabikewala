/* ─── StatCard ─────────────────────────────────────────────────── */
export function StatCard({ label, value, icon, color = "brand" }) {
  const border = {
    brand:   "border-t-orange-500",
    success: "border-t-green-500",
    warning: "border-t-amber-500",
    danger:  "border-t-red-500",
    info:    "border-t-blue-500",
  }[color] || "border-t-orange-500";

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 border-t-4 ${border} p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all`}>
      <div className="text-3xl mb-3">{icon}</div>
      <div className="font-display text-2xl font-bold text-slate-900 leading-none mb-1">{value}</div>
      <div className="text-sm text-slate-400 font-medium">{label}</div>
    </div>
  );
}

/* ─── StatusBadge ───────────────────────────────────────────────── */
const STATUS = {
  in_stock:        { label: "Stock Mein",  cls: "bg-blue-50 text-blue-700" },
  pending_arrival: { label: "Aani Baaki",  cls: "bg-amber-50 text-amber-700" },
  sold:            { label: "Bech Di",     cls: "bg-green-50 text-green-700" },
};

export function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, cls: "bg-slate-100 text-slate-600" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${s.cls}`}>
      {s.label}
    </span>
  );
}

export function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold
      ${role === "admin" ? "bg-orange-50 text-orange-700" : "bg-slate-100 text-slate-600"}`}>
      {role}
    </span>
  );
}

/* ─── Spinner ───────────────────────────────────────────────────── */
export function Spinner({ size = "md", center = false }) {
  const sz = { sm: "w-4 h-4 border-2", md: "w-8 h-8 border-2", lg: "w-12 h-12 border-3" }[size];
  const el = <div className={`${sz} rounded-full border-slate-200 border-t-orange-500 animate-spin`} />;
  return center ? <div className="flex justify-center items-center py-16">{el}</div> : el;
}

/* ─── EmptyState ────────────────────────────────────────────────── */
export function EmptyState({ icon = "🏍️", title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <span className="text-5xl mb-4 opacity-60">{icon}</span>
      <h3 className="font-display text-lg font-semibold text-slate-700 mb-2">{title}</h3>
      {message && <p className="text-sm text-slate-400 max-w-xs">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ─── Card ──────────────────────────────────────────────────────── */
export function Card({ children, className = "", padding = true }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${padding ? "p-5 md:p-6" : ""} ${className}`}>
      {children}
    </div>
  );
}

/* ─── SectionHeader ─────────────────────────────────────────────── */
export function SectionHeader({ title, children }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="font-display text-lg font-bold text-slate-900">{title}</h2>
      {children && <div>{children}</div>}
    </div>
  );
}

/* ─── ConfirmDialog ─────────────────────────────────────────────── */
export function ConfirmDialog({ title, message, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm animate-in fade-in zoom-in-95">
        <h3 className="font-display text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Spinner size="sm" /> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
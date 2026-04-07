import { X } from "lucide-react";

/* ─── StatCard (simple) ────────────────────────────────────────── */
export function StatCard({ label, value, icon, color = "brand" }) {
  const top = { brand:"border-t-orange-500", success:"border-t-green-500", warning:"border-t-amber-500", danger:"border-t-red-500", info:"border-t-blue-500" }[color];
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all p-5 border-t-4 ${top}`}>
      <div className="text-3xl mb-3">{icon}</div>
      <div className="font-display font-bold text-2xl text-slate-900 leading-none mb-1">{value}</div>
      <div className="text-xs text-slate-400 font-medium">{label}</div>
    </div>
  );
}

/* ─── StatusBadge ──────────────────────────────────────────────── */
const STATUS_MAP = {
  in_stock:        { label: "Stock Mein",  cls: "bg-blue-50 text-blue-700" },
  pending_arrival: { label: "Aani Baaki",  cls: "bg-amber-50 text-amber-700" },
  sold:            { label: "Bech Di",     cls: "bg-green-50 text-green-700" },
};
export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, cls: "bg-slate-100 text-slate-600" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${s.cls}`}>
      {s.label}
    </span>
  );
}

export function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${role === "admin" ? "bg-orange-50 text-orange-700" : "bg-slate-100 text-slate-500"}`}>
      {role}
    </span>
  );
}

/* ─── Spinner ──────────────────────────────────────────────────── */
const SIZES = { sm:"w-4 h-4 border-2", md:"w-8 h-8 border-2", lg:"w-12 h-12 border-[3px]" };
export function Spinner({ size = "md", center = false }) {
  const el = <div className={`${SIZES[size]} border-slate-200 border-t-orange-500 rounded-full animate-spin`} />;
  return center ? <div className="flex items-center justify-center py-16">{el}</div> : el;
}

/* ─── EmptyState ───────────────────────────────────────────────── */
export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="mb-4 opacity-50">{icon}</div>
      <h3 className="font-display font-semibold text-lg text-slate-700 mb-1">{title}</h3>
      {message && <p className="text-sm text-slate-400 max-w-xs">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ─── Card ─────────────────────────────────────────────────────── */
export function Card({ children, className = "", padding = true }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${padding ? "p-5" : ""} ${className}`}>
      {children}
    </div>
  );
}

/* ─── SectionHeader ────────────────────────────────────────────── */
export function SectionHeader({ title, children }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-display font-bold text-base text-slate-900">{title}</h2>
      {children && <div>{children}</div>}
    </div>
  );
}

/* ─── ConfirmDialog ────────────────────────────────────────────── */
export function ConfirmDialog({ title, message, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-display font-bold text-lg text-slate-900">{title}</h3>
          <button onClick={onCancel} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center gap-2">
            {loading ? <Spinner size="sm" /> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
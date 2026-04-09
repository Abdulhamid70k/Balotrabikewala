import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Pencil, Trash2, Printer, ArrowLeft, IndianRupee, User, Phone, MapPin, CreditCard, Calendar, ShoppingCart } from "lucide-react";
import { fetchBike, deleteBike, selectCurrentBike, selectBikeLoading } from "../features/bikes/bikeSlice";
import { selectIsAdmin } from "../features/auth/authSlice";
import { StatusBadge, Spinner } from "../components/UI";
import toast from "react-hot-toast";

const fmt  = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const fmtD = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function Row({ label, value, icon: Icon, highlight }) {
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-slate-50 last:border-0 gap-3">
      <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
        {Icon && <Icon size={13} className="flex-shrink-0" />}
        {label}
      </div>
      <span className={`text-sm text-right ${highlight ? "font-bold text-orange-700 text-base" : "font-semibold text-slate-800"}`}>
        {value}
      </span>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h4 className="font-display font-bold text-sm text-orange-700 mb-3 pb-2 border-b-2 border-orange-100">{title}</h4>
      {children}
    </div>
  );
}

export default function BikeDetail() {
  const { id }   = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const bike     = useSelector(selectCurrentBike);
  const loading  = useSelector(selectBikeLoading);
  const isAdmin  = useSelector(selectIsAdmin);

  useEffect(() => { dispatch(fetchBike(id)); }, [id, dispatch]);

  const handleDelete = async () => {
    if (!confirm("Is bike ko permanently delete karna chahte ho?")) return;
    const r = await dispatch(deleteBike(id));
    if (!r.error) { toast.success("Bike delete ho gayi"); navigate("/stock"); }
    else toast.error("Delete nahi ho saka");
  };

  if (loading) return <Spinner center size="lg" />;
  if (!bike)   return <div className="p-8 text-slate-400">Bike nahi mili.</div>;

  const profit = bike.status === "sold"
    ? (bike.sale?.sellPrice || 0) - (bike.purchase?.buyPrice || 0)
      - (bike.service?.totalCost || 0) - (bike.rc?.charge || 0)
    : null;
  const hasDue    = Number(bike.sale?.cash?.amountDue) > 0;
  const isOverdue = hasDue && bike.sale?.cash?.dueDate && new Date(bike.sale.cash.dueDate) < new Date();

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Top bar */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft size={18} className="text-slate-500" />
            </button>
            <h2 className="font-display font-extrabold text-2xl text-slate-900">{bike.bikeName}</h2>
            <StatusBadge status={bike.status} />
          </div>
          <p className="text-sm text-slate-400 ml-9">
            {[bike.bikeMake, bike.year, bike.color, bike.registrationNumber].filter(Boolean).join(" • ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-colors">
            <Printer size={15} /> Print
          </button>
          {bike.status === "in_stock" && (
            <Link to={`/stock/${id}/sell`}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
              <ShoppingCart size={15} /> Sell Karo
            </Link>
          )}
          <Link to={`/stock/${id}/edit`}
            className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-sm font-semibold transition-colors">
            <Pencil size={15} /> Edit
          </Link>
          {isAdmin && (
            <button onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-sm font-semibold transition-colors">
              <Trash2 size={15} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Profit banner */}
      {profit !== null && (
        <div className={`rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 ${profit >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-1">Net Profit / Loss</p>
            <p className={`font-display font-extrabold text-3xl ${profit >= 0 ? "text-green-600" : "text-red-500"}`}>{fmt(profit)}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-500 font-medium">
            <span>Sell {fmt(bike.sale?.sellPrice)}</span>
            <span>− Buy {fmt(bike.purchase?.buyPrice)}</span>
            <span>− Service {fmt(bike.service?.totalCost)}</span>
            {bike.rc?.transferred && <span>− RC {fmt(bike.rc?.charge)}</span>}
          </div>
        </div>
      )}

      {/* Due alert */}
      {hasDue && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3 flex flex-wrap items-center gap-3">
          <span className="text-red-700 text-sm font-semibold">
            ⚠️ Due Baaki: {fmt(bike.sale?.cash?.amountDue)}
            {bike.sale?.cash?.dueDate && ` — ${fmtD(bike.sale.cash.dueDate)} tak`}
          </span>
          {bike.sale?.cash?.dueNote && (
            <span className="text-xs text-red-500 italic">"{bike.sale.cash.dueNote}"</span>
          )}
          {isOverdue && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">OVERDUE</span>}
        </div>
      )}

      {/* Info cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <InfoCard title="🛒 Purchase Details">
          {bike.purchase?.voucherNumber && <Row label="Voucher No." value={bike.purchase.voucherNumber} />}
          <Row label="Seller"    value={bike.purchase?.buyFrom || "—"} />
          <Row label="Buy Date"  value={fmtD(bike.purchase?.buyDate)} />
          <Row label="Buy Price" value={fmt(bike.purchase?.buyPrice)} highlight />
        </InfoCard>

        <InfoCard title="🔧 Service Details">
          {bike.service?.items?.length > 0
            ? bike.service.items.map((item, i) => <Row key={i} label={item.name} value={`₹${Number(item.cost).toLocaleString("en-IN")}`} />)
            : <p className="text-sm text-slate-400">Koi service items nahi</p>}
          <Row label="Total Service" value={fmt(bike.service?.totalCost)} highlight />
        </InfoCard>

        <InfoCard title="📄 RC Transfer">
          <Row label="RC Transfer" value={bike.rc?.transferred ? "✅ Haan" : "❌ Nahi"} />
          {bike.rc?.transferred && (
            <>
              <Row label="Charge"        value={fmt(bike.rc?.charge)} highlight />
              <Row label="Transfer Date" value={fmtD(bike.rc?.transferDate)} />
            </>
          )}
        </InfoCard>

        {bike.status === "sold" && (
          <InfoCard title="👤 Customer">
            <Row label="Name"    value={bike.sale?.customer?.name    || "—"} icon={User}    />
            <Row label="Mobile"  value={bike.sale?.customer?.mobile  || "—"} icon={Phone}   />
            <Row label="Address" value={bike.sale?.customer?.address || "—"} icon={MapPin}  />
          </InfoCard>
        )}

        {bike.status === "sold" && (
          <InfoCard title="🤝 Sale Voucher">
            {bike.sale?.voucherNumber && <Row label="Voucher No." value={bike.sale.voucherNumber} />}
            <Row label="Sell Price"   value={fmt(bike.sale?.sellPrice)} highlight />
            <Row label="Sell Date"    value={fmtD(bike.sale?.sellDate)} icon={Calendar} />
            <Row label="Payment"      value={bike.sale?.paymentType === "finance" ? "Finance 🏦" : "Cash 💵"} icon={CreditCard} />
            {bike.sale?.paymentType === "cash" ? (
              <>
                <Row label="Cash Mila"  value={fmt(bike.sale?.cash?.amountPaid)} />
                <Row label="Due Baaki"  value={fmt(bike.sale?.cash?.amountDue)} />
                {hasDue && (
                  <>
                    <Row label="Due Date"  value={fmtD(bike.sale?.cash?.dueDate)} />
                    {bike.sale?.cash?.dueNote && <Row label="Due Note" value={bike.sale.cash.dueNote} />}
                  </>
                )}
              </>
            ) : (
              <>
                <Row label="Company"        value={bike.sale?.finance?.companyName || "—"} />
                <Row label="Finance Amount" value={fmt(bike.sale?.finance?.financeAmount)} />
                <Row label="EMI"            value={`${fmt(bike.sale?.finance?.emiAmount)} × ${bike.sale?.finance?.emiMonths} months`} />
              </>
            )}
          </InfoCard>
        )}
      </div>

      {bike.notes && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h4 className="font-display font-bold text-sm text-orange-700 mb-2">📝 Notes</h4>
          <p className="text-sm text-slate-500 leading-relaxed">{bike.notes}</p>
        </div>
      )}

      {/* ─── PRINT VOUCHER ──────────────────────────────────── */}
      <div className="hidden print:block">
        <style>{`
          @media print {
            body > *:not(.print-voucher) { display: none !important; }
          }
        `}</style>
        <div style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", maxWidth: "600px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ borderBottom: "3px solid #f97316", paddingBottom: "10px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "20px", fontWeight: "800", color: "#f97316" }}>🏍️ BikeResell Pro</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#333", marginTop: "2px" }}>
                  {bike.status === "sold" ? "SALE VOUCHER" : "PURCHASE VOUCHER"}
                </div>
              </div>
              <div style={{ textAlign: "right", color: "#666" }}>
                <div>Date: {new Date().toLocaleDateString("en-IN")}</div>
                {bike.sale?.voucherNumber && <div style={{ fontWeight: "700" }}>Voucher: {bike.sale.voucherNumber}</div>}
                {bike.purchase?.voucherNumber && <div>Purchase Ref: {bike.purchase.voucherNumber}</div>}
              </div>
            </div>
          </div>

          {/* Bike info */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "12px" }}>
            <tbody>
              {[
                ["Bike Name",     bike.bikeName],
                ["Make / Model",  bike.bikeMake || "—"],
                ["Year",          bike.year || "—"],
                ["Color",         bike.color || "—"],
                ["Reg. Number",   bike.registrationNumber || "—"],
                bike.status === "sold" ? ["Customer",  bike.sale?.customer?.name || "—"] : null,
                bike.status === "sold" ? ["Mobile",    bike.sale?.customer?.mobile || "—"] : null,
                bike.status === "sold" ? ["Address",   bike.sale?.customer?.address || "—"] : null,
                ["Buy From",      bike.purchase?.buyFrom || "—"],
                ["Buy Date",      fmtD(bike.purchase?.buyDate)],
                ["Buy Price",     fmt(bike.purchase?.buyPrice)],
                ["Service Cost",  fmt(bike.service?.totalCost)],
                ["RC Transfer",   bike.rc?.transferred ? `Yes — ${fmt(bike.rc?.charge)}` : "No"],
                bike.status === "sold" ? ["Sell Date",   fmtD(bike.sale?.sellDate)] : null,
                bike.status === "sold" ? ["Sell Price",  fmt(bike.sale?.sellPrice)] : null,
                bike.status === "sold" ? ["Payment",     bike.sale?.paymentType === "finance" ? `Finance — ${bike.sale?.finance?.companyName}` : "Cash"] : null,
                (bike.status === "sold" && bike.sale?.paymentType === "cash") ? ["Cash Paid", fmt(bike.sale?.cash?.amountPaid)] : null,
                (bike.status === "sold" && hasDue) ? ["Due Amount", fmt(bike.sale?.cash?.amountDue)] : null,
                (bike.status === "sold" && hasDue) ? ["Due Date",   fmtD(bike.sale?.cash?.dueDate)] : null,
                profit !== null ? ["NET PROFIT / LOSS", fmt(profit)] : null,
              ].filter(Boolean).map(([k, v]) => (
                <tr key={k} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "5px 8px", fontWeight: "600", color: "#666", width: "40%" }}>{k}</td>
                  <td style={{ padding: "5px 8px", fontWeight: k === "NET PROFIT / LOSS" ? "800" : "500", color: k === "NET PROFIT / LOSS" ? (profit >= 0 ? "green" : "red") : "#333" }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: "1px dashed #ccc", paddingTop: "10px", display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ borderTop: "1px solid #333", marginTop: "30px", paddingTop: "4px", width: "120px", fontSize: "11px" }}>Buyer Signature</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ borderTop: "1px solid #333", marginTop: "30px", paddingTop: "4px", width: "120px", fontSize: "11px" }}>Seller Signature</div>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: "12px", fontSize: "10px", color: "#999" }}>
            BikeResell Pro — {new Date().toLocaleDateString("en-IN")} {new Date().toLocaleTimeString("en-IN")}
          </div>
        </div>
      </div>
    </div>
  );
}
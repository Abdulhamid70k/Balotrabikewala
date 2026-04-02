import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchBike, deleteBike, selectCurrentBike, selectBikeLoading } from "../features/bikes/bikeSlice";
import { selectIsAdmin } from "../features/auth/authSlice";
import { StatusBadge, Spinner } from "../components/UI";
import toast from "react-hot-toast";

const fmt     = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0 gap-3">
      <span className="text-sm text-slate-400 font-medium">{label}</span>
      <span className={`text-sm text-right ${bold ? "font-bold text-orange-700 text-base" : "font-semibold text-slate-800"}`}>{value}</span>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
      <h4 className="font-display font-bold text-sm text-orange-700 mb-3 pb-2.5 border-b-2 border-orange-100">{title}</h4>
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
    ? (bike.sale?.sellPrice || 0) - (bike.purchase?.buyPrice || 0) - (bike.service?.totalCost || 0) - (bike.rc?.charge || 0)
    : null;
  const hasDue = Number(bike.sale?.cash?.amountDue) > 0;
  const isOverdue = hasDue && bike.sale?.cash?.dueDate && new Date(bike.sale.cash.dueDate) < new Date();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-display font-extrabold text-2xl text-slate-900">{bike.model}</h2>
            <StatusBadge status={bike.status} />
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {[bike.year, bike.color, bike.registrationNumber].filter(Boolean).join(" • ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => window.print()} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-colors">🖨️ Print</button>
          <Link to={`/stock/${id}/edit`} className="px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-sm font-semibold transition-colors">✏️ Edit</Link>
          {isAdmin && (
            <button onClick={handleDelete} className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-sm font-semibold transition-colors">🗑️ Delete</button>
          )}
        </div>
      </div>

      {/* Images */}
      {bike.images?.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {bike.images.map((img) => (
            <img key={img.public_id} src={img.url} alt={bike.model}
              className="w-48 h-36 object-cover rounded-2xl border border-slate-100 flex-shrink-0" />
          ))}
        </div>
      )}

      {/* Profit banner */}
      {profit !== null && (
        <div className={`rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 ${profit >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-1">Net Profit / Loss</p>
            <p className={`font-display font-extrabold text-3xl ${profit >= 0 ? "text-green-600" : "text-red-500"}`}>
              {fmt(profit)}
            </p>
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
            {bike.sale?.cash?.dueDate && ` — ${fmtDate(bike.sale.cash.dueDate)} tak`}
          </span>
          {isOverdue && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">OVERDUE</span>
          )}
        </div>
      )}

      {/* Info cards grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        <InfoCard title="🛒 Purchase Details">
          <Row label="Seller"    value={bike.purchase?.buyFrom || "—"} />
          <Row label="Buy Date"  value={fmtDate(bike.purchase?.buyDate)} />
          <Row label="Buy Price" value={fmt(bike.purchase?.buyPrice)} bold />
        </InfoCard>

        <InfoCard title="🔧 Service Details">
          {bike.service?.items?.length > 0
            ? bike.service.items.map((item, i) => <Row key={i} label={item.name} value={`₹${Number(item.cost).toLocaleString("en-IN")}`} />)
            : <p className="text-sm text-slate-400">Koi service items nahi</p>}
          <Row label="Total Service" value={fmt(bike.service?.totalCost)} bold />
          {bike.service?.notes && <Row label="Notes" value={bike.service.notes} />}
        </InfoCard>

        <InfoCard title="📄 RC Transfer">
          <Row label="RC Transfer" value={bike.rc?.transferred ? "Haan ✅" : "Nahi ❌"} />
          {bike.rc?.transferred && (
            <>
              <Row label="Charge"        value={fmt(bike.rc?.charge)} bold />
              <Row label="Transfer Date" value={fmtDate(bike.rc?.transferDate)} />
            </>
          )}
        </InfoCard>

        {bike.status === "sold" && (
          <InfoCard title="🤝 Sale Details">
            <Row label="Sell Price"    value={fmt(bike.sale?.sellPrice)} bold />
            <Row label="Sell Date"     value={fmtDate(bike.sale?.sellDate)} />
            <Row label="Payment Type"  value={bike.sale?.paymentType === "finance" ? "Finance 🏦" : "Cash 💵"} />
            {bike.sale?.paymentType === "cash" ? (
              <>
                <Row label="Cash Mila"  value={fmt(bike.sale?.cash?.amountPaid)} />
                <Row label="Due Baaki"  value={fmt(bike.sale?.cash?.amountDue)} />
                {hasDue && <Row label="Due Date" value={fmtDate(bike.sale?.cash?.dueDate)} />}
              </>
            ) : (
              <>
                <Row label="Company"        value={bike.sale?.finance?.companyName || "—"} />
                <Row label="Finance Amount" value={fmt(bike.sale?.finance?.financeAmount)} />
                <Row label="EMI"            value={`${fmt(bike.sale?.finance?.emiAmount)} × ${bike.sale?.finance?.emiMonths} months`} />
                <Row label="EMI Start"      value={fmtDate(bike.sale?.finance?.startDate)} />
              </>
            )}
          </InfoCard>
        )}
      </div>

      {bike.notes && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
          <h4 className="font-display font-bold text-sm text-orange-700 mb-2">📝 Notes</h4>
          <p className="text-sm text-slate-500 leading-relaxed">{bike.notes}</p>
        </div>
      )}

      {/* Print-only view */}
      <div className="hidden print:block">
        <div className="flex justify-between text-xs text-gray-500 mb-3 border-b-2 border-orange-500 pb-2">
          <span className="text-orange-500 font-bold text-base">🏍️ BikeResell Pro — Bike Report</span>
          <span>Print Date: {new Date().toLocaleDateString("en-IN")}</span>
        </div>
        <h2 className="text-xl font-bold">{bike.model} {bike.year ? `(${bike.year})` : ""}</h2>
        <p className="text-sm text-gray-500 mb-3">{bike.color} {bike.registrationNumber ? `• ${bike.registrationNumber}` : ""}</p>
        <table className="w-full text-sm border-collapse">
          <tbody>
            {[
              ["Status", bike.status === "in_stock" ? "Stock Mein" : bike.status === "pending_arrival" ? "Aani Baaki" : "Bech Di"],
              ["Buy From", bike.purchase?.buyFrom || "—"],
              ["Buy Date", fmtDate(bike.purchase?.buyDate)],
              ["Buy Price", fmt(bike.purchase?.buyPrice)],
              ["Service Cost", fmt(bike.service?.totalCost)],
              ["RC Transfer", bike.rc?.transferred ? `Haan — ${fmt(bike.rc?.charge)}` : "Nahi"],
              ["Sell Price", fmt(bike.sale?.sellPrice)],
              ["Sell Date", fmtDate(bike.sale?.sellDate)],
              ...(profit !== null ? [["Net Profit/Loss", fmt(profit)]] : []),
            ].map(([k, v]) => (
              <tr key={k} className="border-b border-gray-200">
                <td className="py-2 pr-4 font-semibold text-gray-500 w-[45%]">{k}</td>
                <td className="py-2">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {bike.notes && <p className="mt-3 text-xs"><strong>Notes:</strong> {bike.notes}</p>}
      </div>
    </div>
  );
}
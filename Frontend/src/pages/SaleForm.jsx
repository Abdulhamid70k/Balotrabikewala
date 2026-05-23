import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Save, X, User, Phone, MapPin, Hash, IndianRupee, Plus, Trash2, Pencil } from "lucide-react";
import {
  fetchBike, updateBike,
  selectCurrentBike, selectBikeLoading,
  clearBikeMessages, clearCurrentBike,
} from "../features/bikes/bikeSlice";
import { Spinner } from "../components/UI";
import DateInput from "../components/DateInput";
import toast from "react-hot-toast";

const inp = (err = false) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-900 outline-none transition-all
   focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-50
   ${err ? "border-red-400" : "border-slate-200"}`;

function Field({ label, error, required, icon: Icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
        {Icon && <Icon size={12} />}
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="font-display font-bold text-sm text-orange-700 mb-4 pb-2.5 border-b-2 border-orange-100">
        {title}
      </h3>
      {children}
    </div>
  );
}

const EMPTY_SALE = {
  voucherNumber: "",
  sellPrice: "",
  sellDate: new Date().toISOString().split("T")[0],
  customer: { name: "", mobile: "", address: "" },
  cash: { amountPaid: "", amountDue: "", dueDate: "", dueNote: "" },
};

export default function SaleForm() {
  const { id }    = useParams();
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const loading   = useSelector(selectBikeLoading);
  const bike      = useSelector(selectCurrentBike);

  const [sale,         setSale]         = useState(EMPTY_SALE);
  const [errors,       setErrors]       = useState({});
  const [svcItems,     setSvcItems]     = useState([]);
  const [svcName,      setSvcName]      = useState("");
  const [svcCost,      setSvcCost]      = useState("");
  const [rcTransferred, setRcTransferred] = useState(false);

  // isEdit = bike already sold hai
  const isEdit = bike?.status === "sold";

  useEffect(() => {
    dispatch(fetchBike(id));
    return () => dispatch(clearCurrentBike());
  }, [id, dispatch]);

  // Agar bike sold hai toh existing data pre-fill karo
  useEffect(() => {
    if (!bike) return;

    if (bike.status === "sold") {
      // Pre-fill existing sale data for editing
      const s = bike.sale || {};
      setSale({
        voucherNumber: s.voucherNumber || "",
        sellPrice:     s.sellPrice     || "",
        sellDate:      s.sellDate ? new Date(s.sellDate).toISOString().split("T")[0] : "",
        customer: {
          name:    s.customer?.name    || "",
          mobile:  s.customer?.mobile  || "",
          address: s.customer?.address || "",
        },
        cash: {
          amountPaid: s.cash?.amountPaid || "",
          amountDue:  s.cash?.amountDue  || "",
          dueDate:    s.cash?.dueDate ? new Date(s.cash.dueDate).toISOString().split("T")[0] : "",
          dueNote:    s.cash?.dueNote    || "",
        },
      });
      setSvcItems(bike.service?.items || []);
      setRcTransferred(bike.rc?.transferred || false);
    }
  }, [bike]);

  const setField = (path, value) => {
    setSale((prev) => {
      const keys    = path.split(".");
      const updated = { ...prev };
      let cur = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return updated;
    });
    if (errors[path]) setErrors((p) => { const n = { ...p }; delete n[path]; return n; });
  };

  const addSvc = () => {
    if (!svcName.trim()) return;
    setSvcItems((prev) => [...prev, { name: svcName.trim(), cost: Number(svcCost) || 0 }]);
    setSvcName(""); setSvcCost("");
  };
  const removeSvc = (i) => setSvcItems((prev) => prev.filter((_, idx) => idx !== i));
  const svcTotal = svcItems.reduce((s, i) => s + i.cost, 0);

  const validate = () => {
    const e = {};
    if (!sale.sellPrice)       e.sellPrice         = "Sell price zaroori hai";
    if (!sale.customer.name)   e["customer.name"]  = "Customer naam zaroori hai";
    if (!sale.customer.mobile) e["customer.mobile"]= "Mobile number zaroori hai";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error("Zaroori fields fill karo"); return; }

    const payload = {
      status: "sold",
      service: { items: svcItems, totalCost: svcTotal },
      rc: { transferred: rcTransferred },
      sale: {
        voucherNumber: sale.voucherNumber,
        sellPrice:     Number(sale.sellPrice),
        sellDate:      sale.sellDate,
        paymentType:   "cash",
        customer:      sale.customer,
        cash: {
          amountPaid: Number(sale.cash.amountPaid) || 0,
          amountDue:  Number(sale.cash.amountDue)  || 0,
          dueDate:    sale.cash.dueDate  || undefined,
          dueNote:    sale.cash.dueNote  || "",
        },
      },
    };

    const result = await dispatch(updateBike({ id, formData: payload }));
    if (!result.error) {
      toast.success(isEdit ? "Sale update ho gayi! ✅" : "Sale entry ho gayi! 🎉");
      dispatch(clearBikeMessages());
      // FIX 2: sale complete hone ke baad /sale (entry list) pe jao, detail pe nahi
      navigate("/sale");
    } else {
      toast.error(result.payload || "Kuch error aaya");
    }
  };

  if (loading && !bike) return <Spinner center size="lg" />;
  if (!bike) return null;

  const hasDue = Number(sale.cash.amountDue) > 0;
  const profit = Number(sale.sellPrice || 0) - (bike.purchase?.buyPrice || 0) - svcTotal;

  return (
    <div className="max-w-2xl space-y-4 pb-10">

      {/* Bike info banner */}
      <div className={`rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 ${isEdit ? "bg-amber-900" : "bg-slate-900"}`}>
        <div>
          <p className="text-slate-400 text-xs mb-0.5">
            {isEdit ? "✏️ Sale Edit Mode" : "Sale Entry For"}
          </p>
          <h2 className="font-display font-bold text-white text-xl">{bike.bikeName}</h2>
          <p className="text-slate-400 text-sm">
            {[bike.bikeMake, bike.year, bike.color].filter(Boolean).join(" • ")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-xs">Purchase Price</p>
          <p className="text-orange-400 font-bold text-lg">
            ₹{Number(bike.purchase?.buyPrice || 0).toLocaleString("en-IN")}
          </p>
          {sale.sellPrice && (
            <>
              <p className="text-slate-400 text-xs mt-1">
                {isEdit ? "Updated Profit" : "Expected Profit"}
              </p>
              <p className={`font-bold text-lg ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                ₹{profit.toLocaleString("en-IN")}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Edit mode warning */}
      {isEdit && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Pencil size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 font-medium">
            Ye bike pehle se sold hai. Yahan changes karoge toh sale ki details update ho jaayegi.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">

        {/* ── Customer Details ──────────────────────────────── */}
        <Section title="👤 Customer Details">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Customer Name" required error={errors["customer.name"]} icon={User}>
              <input className={inp(!!errors["customer.name"])}
                value={sale.customer.name}
                onChange={(e) => setField("customer.name", e.target.value)}
                placeholder="Rahul Sharma" />
            </Field>
            <Field label="Mobile Number" required error={errors["customer.mobile"]} icon={Phone}>
              <input className={inp(!!errors["customer.mobile"])}
                type="tel"
                value={sale.customer.mobile}
                onChange={(e) => setField("customer.mobile", e.target.value)}
                placeholder="98765 43210" />
            </Field>
            <Field label="Address" icon={MapPin}>
              <input className={inp()}
                value={sale.customer.address}
                onChange={(e) => setField("customer.address", e.target.value)}
                placeholder="City, Area..." />
            </Field>
          </div>
        </Section>

        {/* ── Service Details ───────────────────────────────── */}
        <Section title="🔧 Service Details">
          <p className="text-xs text-slate-400 -mt-2 mb-3">Sale se pehle ki gayi service yahan daalo</p>
          <div className="flex gap-2 mb-3">
            <input className={`${inp()} flex-[2]`} value={svcName}
              onChange={(e) => setSvcName(e.target.value)}
              placeholder="Item name (Engine oil, Tyre...)"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSvc())} />
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
              <input className={`${inp()} pl-7`} type="number" value={svcCost}
                onChange={(e) => setSvcCost(e.target.value)} placeholder="Cost" />
            </div>
            <button type="button" onClick={addSvc}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-colors">
              <Plus size={16} />
            </button>
          </div>

          {svcItems.length > 0 && (
            <div className="border border-slate-100 rounded-xl overflow-hidden mb-3">
              {svcItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100 last:border-0 text-sm">
                  <span className="text-slate-700">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-500">₹{item.cost.toLocaleString("en-IN")}</span>
                    <button type="button" onClick={() => removeSvc(i)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="px-4 py-2 bg-orange-50 flex justify-between items-center">
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">Total Service</span>
                <span className="font-bold text-orange-700">₹{svcTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}
        </Section>

        {/* ── RC Transfer ───────────────────────────────────── */}
        <Section title="📄 RC Transfer">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={rcTransferred}
                onChange={(e) => setRcTransferred(e.target.checked)}
                className="w-4 h-4 accent-orange-500" />
              <span className="text-sm font-medium text-slate-700">RC Transfer ki gayi</span>
            </label>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${rcTransferred ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
              {rcTransferred ? "✅ Yes" : "❌ No"}
            </span>
          </div>
        </Section>

        {/* ── Sale Details ──────────────────────────────────── */}
        <Section title="🤝 Sale Details">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Voucher Number" icon={Hash}>
              <input className={inp()} value={sale.voucherNumber}
                onChange={(e) => setField("voucherNumber", e.target.value)}
                placeholder="SAL-001" />
            </Field>
            <Field label="Sell Price (₹)" required error={errors.sellPrice} icon={IndianRupee}>
              <input className={inp(!!errors.sellPrice)} type="number"
                value={sale.sellPrice}
                onChange={(e) => setField("sellPrice", e.target.value)}
                placeholder="0" />
            </Field>
            <Field label="Sale Date">
              <DateInput
                value={sale.sellDate}
                onChange={(iso) => setField("sellDate", iso)}
                className={inp()}
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Field label="Cash Mila (₹)">
              <input className={inp()} type="number"
                value={sale.cash.amountPaid}
                onChange={(e) => setField("cash.amountPaid", e.target.value)}
                placeholder="0" />
            </Field>
            <Field label="Due Baaki (₹)">
              <input className={inp()} type="number"
                value={sale.cash.amountDue}
                onChange={(e) => setField("cash.amountDue", e.target.value)}
                placeholder="0" />
            </Field>
            {hasDue && (
              <>
                <Field label="Due Payment Date">
                  <DateInput
                    value={sale.cash.dueDate}
                    onChange={(iso) => setField("cash.dueDate", iso)}
                    className={inp()}
                  />
                </Field>
                <Field label="Due Note (kab dega?)">
                  <input className={inp()} value={sale.cash.dueNote}
                    onChange={(e) => setField("cash.dueNote", e.target.value)}
                    placeholder="e.g. Next month salary ke baad" />
                </Field>
              </>
            )}
          </div>
        </Section>

        {/* ── Submit ────────────────────────────────────────── */}
        <div className="flex gap-3 justify-end pt-1">
          <button type="button" onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-colors">
            <X size={15} /> Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-8 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all min-w-[150px] justify-center">
            {loading ? <Spinner size="sm" /> : (
              <><Save size={15} /> {isEdit ? "Sale Update Karo" : "Sale Complete Karo"}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
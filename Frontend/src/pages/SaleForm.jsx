import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Save, X, User, Phone, MapPin, CreditCard, Hash, IndianRupee } from "lucide-react";
import {
  fetchBike, updateBike,
  selectCurrentBike, selectBikeLoading,
  clearBikeMessages, clearCurrentBike,
} from "../features/bikes/bikeSlice";
import { Spinner } from "../components/UI";
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

function RadioPill({ label, value, current, onChange }) {
  const active = current === value;
  return (
    <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-semibold select-none
      ${active
        ? "border-orange-400 bg-orange-50 text-orange-700"
        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-orange-200"}`}>
      <input type="radio" value={value} checked={active} onChange={() => onChange(value)} className="hidden" />
      {label}
    </label>
  );
}

const INIT_SALE = {
  voucherNumber: "",
  sellPrice: "",
  sellDate: new Date().toISOString().split("T")[0],
  paymentType: "cash",
  customer: { name: "", mobile: "", address: "" },
  cash: { amountPaid: "", amountDue: "", dueDate: "", dueNote: "" },
  finance: { companyName: "", financeAmount: "", emiAmount: "", emiMonths: "", startDate: "" },
};

export default function SaleForm() {
  const { id }   = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading  = useSelector(selectBikeLoading);
  const bike     = useSelector(selectCurrentBike);

  const [sale,   setSale]   = useState(INIT_SALE);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchBike(id));
    return () => dispatch(clearCurrentBike());
  }, [id, dispatch]);

  const setField = (path, value) => {
    setSale((prev) => {
      const keys  = path.split(".");
      const updated = { ...prev };
      let cur = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return updated;
    });
    // Clear error
    if (errors[path]) setErrors((p) => { const n = { ...p }; delete n[path]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!sale.sellPrice)          e.sellPrice         = "Sell price zaroori hai";
    if (!sale.customer.name)      e["customer.name"]  = "Customer naam zaroori hai";
    if (!sale.customer.mobile)    e["customer.mobile"]= "Mobile number zaroori hai";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error("Zaroori fields fill karo"); return; }

    const payload = {
      status: "sold",
      sale: {
        voucherNumber: sale.voucherNumber,
        sellPrice:     Number(sale.sellPrice),
        sellDate:      sale.sellDate,
        paymentType:   sale.paymentType,
        customer:      sale.customer,
        cash: sale.paymentType === "cash" ? {
          amountPaid: Number(sale.cash.amountPaid) || 0,
          amountDue:  Number(sale.cash.amountDue)  || 0,
          dueDate:    sale.cash.dueDate  || undefined,
          dueNote:    sale.cash.dueNote  || "",
        } : undefined,
        finance: sale.paymentType === "finance" ? {
          companyName:   sale.finance.companyName,
          financeAmount: Number(sale.finance.financeAmount) || 0,
          emiAmount:     Number(sale.finance.emiAmount)     || 0,
          emiMonths:     Number(sale.finance.emiMonths)     || 0,
          startDate:     sale.finance.startDate || undefined,
        } : undefined,
      },
    };

    const result = await dispatch(updateBike({ id, formData: payload }));
    if (!result.error) {
      toast.success("Sale entry ho gayi!");
      dispatch(clearBikeMessages());
      navigate(`/stock/${id}`);
    } else {
      toast.error(result.payload || "Kuch error aaya");
    }
  };

  if (loading && !bike) return <Spinner center size="lg" />;

  const isFinance = sale.paymentType === "finance";
  const hasDue    = Number(sale.cash.amountDue) > 0;
  const profit    = bike
    ? Number(sale.sellPrice || 0) - (bike.purchase?.buyPrice || 0) - (bike.service?.totalCost || 0) - (bike.rc?.charge || 0)
    : 0;

  return (
    <div className="max-w-2xl space-y-4 pb-10">

      {/* Bike info banner */}
      {bike && (
        <div className="bg-slate-900 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-slate-400 text-xs mb-0.5">Sale Entry For</p>
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
                <p className="text-slate-400 text-xs mt-1">Expected Profit</p>
                <p className={`font-bold text-lg ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                  ₹{profit.toLocaleString("en-IN")}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">

        {/* Customer Details */}
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

        {/* Sale Voucher */}
        <Section title="🤝 Sale Details">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Voucher Number" icon={Hash}>
              <input className={inp()}
                value={sale.voucherNumber}
                onChange={(e) => setField("voucherNumber", e.target.value)}
                placeholder="SAL-001" />
            </Field>
            <Field label="Sell Price (₹)" required error={errors.sellPrice} icon={IndianRupee}>
              <input className={inp(!!errors.sellPrice)}
                type="number"
                value={sale.sellPrice}
                onChange={(e) => setField("sellPrice", e.target.value)}
                placeholder="0" />
            </Field>
            <Field label="Sale Date">
              <input className={inp()}
                type="date"
                value={sale.sellDate}
                onChange={(e) => setField("sellDate", e.target.value)} />
            </Field>
          </div>

          {/* Payment type */}
          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-500 mb-2">Payment Type</label>
            <div className="flex gap-2">
              <RadioPill label="💵 Cash"    value="cash"    current={sale.paymentType} onChange={(v) => setField("paymentType", v)} />
              <RadioPill label="🏦 Finance" value="finance" current={sale.paymentType} onChange={(v) => setField("paymentType", v)} />
            </div>
          </div>

          {/* Cash fields */}
          {!isFinance && (
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
                    <input className={inp()} type="date"
                      value={sale.cash.dueDate}
                      onChange={(e) => setField("cash.dueDate", e.target.value)} />
                  </Field>
                  <Field label="Due Note (kab dega?)">
                    <input className={inp()}
                      value={sale.cash.dueNote}
                      onChange={(e) => setField("cash.dueNote", e.target.value)}
                      placeholder="e.g. Next month salary ke baad" />
                  </Field>
                </>
              )}
            </div>
          )}

          {/* Finance fields */}
          {isFinance && (
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              {[
                { path: "finance.companyName",   label: "Finance Company",    type: "text",   ph: "Bajaj Finance, HDFC..." },
                { path: "finance.financeAmount", label: "Finance Amount (₹)", type: "number", ph: "0" },
                { path: "finance.emiAmount",     label: "EMI Amount (₹/mo)",  type: "number", ph: "0" },
                { path: "finance.emiMonths",     label: "EMI Months",         type: "number", ph: "12" },
                { path: "finance.startDate",     label: "EMI Start Date",     type: "date",   ph: "" },
              ].map(({ path, label, type, ph }) => (
                <Field key={path} label={label}>
                  <input className={inp()} type={type}
                    value={path.split(".").reduce((o, k) => o?.[k], sale)}
                    onChange={(e) => setField(path, e.target.value)}
                    placeholder={ph} />
                </Field>
              ))}
            </div>
          )}
        </Section>

        {/* Submit */}
        <div className="flex gap-3 justify-end pt-1">
          <button type="button" onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-colors">
            <X size={15} /> Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-8 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all min-w-[150px] justify-center">
            {loading ? <Spinner size="sm" /> : <><Save size={15} /> Sale Complete Karo</>}
          </button>
        </div>
      </form>
    </div>
  );
}
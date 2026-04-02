import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  createBike, updateBike, fetchBike,
  selectCurrentBike, selectBikeLoading, clearBikeMessages, clearCurrentBike,
} from "../features/bikes/bikesSlice";
import { Spinner } from "../components/UI";
import toast from "react-hot-toast";

/* ─── Flatten / nest helpers ─────────────────────────────────── */
const flatten = (obj, prefix = "") =>
  Object.keys(obj).reduce((acc, k) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === "object" && obj[k] !== null && !Array.isArray(obj[k]) && !(obj[k] instanceof Date))
      Object.assign(acc, flatten(obj[k], key));
    else acc[key] = obj[k] ?? "";
    return acc;
  }, {});

const nest = (flat) => {
  const result = {};
  for (const [key, val] of Object.entries(flat)) {
    const parts = key.split(".");
    let cur = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
  }
  return result;
};

const INIT = {
  model: "", year: "", color: "", registrationNumber: "", status: "in_stock",
  "purchase.buyFrom": "", "purchase.buyDate": "", "purchase.buyPrice": "",
  "service.totalCost": "", "service.notes": "",
  "rc.transferred": false, "rc.charge": "", "rc.transferDate": "",
  "sale.sellPrice": "", "sale.sellDate": "", "sale.paymentType": "cash",
  "sale.cash.amountPaid": "", "sale.cash.amountDue": "", "sale.cash.dueDate": "",
  "sale.finance.companyName": "", "sale.finance.financeAmount": "",
  "sale.finance.emiAmount": "", "sale.finance.emiMonths": "", "sale.finance.startDate": "",
  notes: "",
};

/* ─── Reusable primitives ────────────────────────────────────── */
const inp = (err = false) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-900 outline-none transition-all
   focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-50
   ${err ? "border-red-400" : "border-slate-200"}`;

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
    </div>
  );
}

function RadioCard({ label, value, current, onChange }) {
  const active = current === value;
  return (
    <label className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-semibold select-none
      ${active
        ? "border-orange-400 bg-orange-50 text-orange-700"
        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-orange-200 hover:bg-orange-50/40"}`}>
      <input type="radio" value={value} checked={active} onChange={() => onChange(value)} className="hidden" />
      {label}
    </label>
  );
}

const sec  = "bg-white rounded-2xl border border-slate-100 shadow-card p-5 md:p-6";
const secT = "font-display font-bold text-sm text-orange-700 mb-4 pb-2.5 border-b-2 border-orange-100";

export default function BikeForm() {
  const { id }   = useParams();
  const isEdit   = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading  = useSelector(selectBikeLoading);
  const current  = useSelector(selectCurrentBike);
  const fileRef  = useRef();

  const [form,         setForm]        = useState(INIT);
  const [svcItems,     setSvcItems]    = useState([]);
  const [svcName,      setSvcName]     = useState("");
  const [svcCost,      setSvcCost]     = useState("");
  const [newImgs,      setNewImgs]     = useState([]);
  const [previews,     setPreviews]    = useState([]);
  const [existingImgs, setExistingImgs]= useState([]);
  const [errors,       setErrors]      = useState({});

  useEffect(() => {
    if (isEdit) dispatch(fetchBike(id));
    return () => dispatch(clearCurrentBike());
  }, [id, isEdit, dispatch]);

  useEffect(() => {
    if (isEdit && current) {
      const flat = flatten(current);
      ["purchase.buyDate","sale.sellDate","sale.cash.dueDate","rc.transferDate","sale.finance.startDate"]
        .forEach((k) => { if (flat[k]) flat[k] = new Date(flat[k]).toISOString().split("T")[0]; });
      setForm((p) => ({ ...p, ...flat }));
      setSvcItems(current.service?.items || []);
      setExistingImgs(current.images || []);
    }
  }, [current, isEdit]);

  const set = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => { const n = { ...p }; delete n[k]; return n; });
  };

  const addSvc = () => {
    if (!svcName.trim()) return;
    const updated = [...svcItems, { name: svcName.trim(), cost: Number(svcCost) || 0 }];
    setSvcItems(updated);
    setForm((p) => ({ ...p, "service.totalCost": updated.reduce((s, i) => s + i.cost, 0) }));
    setSvcName(""); setSvcCost("");
  };

  const removeSvc = (i) => {
    const updated = svcItems.filter((_, idx) => idx !== i);
    setSvcItems(updated);
    setForm((p) => ({ ...p, "service.totalCost": updated.reduce((s, x) => s + x.cost, 0) }));
  };

  const handleImgs = (e) => {
    const files = Array.from(e.target.files);
    if (newImgs.length + files.length > 5) { toast.error("Max 5 images"); return; }
    setNewImgs((p) => [...p, ...files]);
    setPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const validate = () => {
    const e = {};
    if (!form.model.trim()) e.model = "Model zaroori hai";
    if (!form["purchase.buyPrice"]) e["purchase.buyPrice"] = "Buy price zaroori hai";
    if (form.status === "sold" && !form["sale.sellPrice"]) e["sale.sellPrice"] = "Sell price zaroori hai";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error("Form mein errors hain"); return; }
    const nested = nest(form);
    nested.service = { ...nested.service, items: svcItems };
    const fd = new FormData();
    fd.append("data", JSON.stringify(nested));
    newImgs.forEach((img) => fd.append("images", img));
    const result = await dispatch(isEdit ? updateBike({ id, formData: fd }) : createBike(fd));
    if (!result.error) {
      toast.success(isEdit ? "Bike update ho gayi!" : "Bike add ho gayi!");
      dispatch(clearBikeMessages());
      navigate("/stock");
    } else {
      toast.error(result.payload || "Kuch error aaya");
    }
  };

  if (isEdit && loading && !current) return <Spinner center size="lg" />;

  const isSold    = form.status === "sold";
  const isFinance = form["sale.paymentType"] === "finance";
  const hasDue    = Number(form["sale.cash.amountDue"]) > 0;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 pb-10">

      {/* Bike Info */}
      <div className={sec}>
        <h3 className={secT}>🏍️ Bike Information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Model *" error={errors.model}>
            <input className={inp(!!errors.model)} value={form.model} onChange={set("model")} placeholder="Splendor Plus, Pulsar 150..." />
          </Field>
          <Field label="Year">
            <input className={inp()} type="number" value={form.year} onChange={set("year")} placeholder="2019" />
          </Field>
          <Field label="Color">
            <input className={inp()} value={form.color} onChange={set("color")} placeholder="Black, Red..." />
          </Field>
          <Field label="Registration Number">
            <input className={inp()} value={form.registrationNumber} onChange={set("registrationNumber")} placeholder="RJ 14 AB 1234" />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { value: "in_stock",        label: "🏍️ Stock Mein" },
            { value: "pending_arrival", label: "⏳ Aani Baaki" },
            { value: "sold",            label: "✅ Bech Di" },
          ].map((s) => (
            <RadioCard key={s.value} {...s} current={form.status} onChange={(v) => setForm((p) => ({ ...p, status: v }))} />
          ))}
        </div>
      </div>

      {/* Purchase */}
      <div className={sec}>
        <h3 className={secT}>🛒 Purchase Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Kahan se kharidi">
            <input className={inp()} value={form["purchase.buyFrom"]} onChange={set("purchase.buyFrom")} placeholder="Seller / jagah" />
          </Field>
          <Field label="Kharidne ki Tarikh">
            <input className={inp()} type="date" value={form["purchase.buyDate"]} onChange={set("purchase.buyDate")} />
          </Field>
          <Field label="Buy Price (₹) *" error={errors["purchase.buyPrice"]}>
            <input className={inp(!!errors["purchase.buyPrice"])} type="number" value={form["purchase.buyPrice"]} onChange={set("purchase.buyPrice")} placeholder="0" />
          </Field>
        </div>
      </div>

      {/* Service */}
      <div className={sec}>
        <h3 className={secT}>🔧 Service Details</h3>
        <div className="flex gap-2 mb-3 flex-wrap">
          <input className={`${inp()} flex-2 min-w-35`} value={svcName} onChange={(e) => setSvcName(e.target.value)}
            placeholder="Service item (Engine oil...)" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSvc())} />
          <input className={`${inp()} flex-1 min-w-22.5`} type="number" value={svcCost} onChange={(e) => setSvcCost(e.target.value)} placeholder="Cost (₹)" />
          <button type="button" onClick={addSvc}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors whitespace-nowrap">
            + Add
          </button>
        </div>
        {svcItems.length > 0 && (
          <div className="border border-slate-100 rounded-xl overflow-hidden mb-4">
            {svcItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100 last:border-0 text-sm">
                <span className="text-slate-700">🔧 {item.name}</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-500">₹{item.cost.toLocaleString("en-IN")}</span>
                  <button type="button" onClick={() => removeSvc(i)} className="text-red-400 hover:text-red-600">✕</button>
                </div>
              </div>
            ))}
            <div className="px-4 py-2 bg-orange-50 text-sm font-semibold text-orange-700">
              Total: ₹{svcItems.reduce((s, i) => s + i.cost, 0).toLocaleString("en-IN")}
            </div>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Total Service Cost (₹)">
            <input className={inp()} type="number" value={form["service.totalCost"]} onChange={set("service.totalCost")} placeholder="0" />
          </Field>
          <Field label="Notes">
            <input className={inp()} value={form["service.notes"]} onChange={set("service.notes")} placeholder="Optional..." />
          </Field>
        </div>
      </div>

      {/* RC Transfer */}
      <div className={sec}>
        <h3 className={secT}>📄 RC Transfer</h3>
        <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-slate-700">
          <input type="checkbox" checked={form["rc.transferred"]} onChange={set("rc.transferred")} className="w-4 h-4 accent-orange-500 cursor-pointer" />
          RC Transfer ki gayi hai
        </label>
        {form["rc.transferred"] && (
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Field label="RC Charge (₹)">
              <input className={inp()} type="number" value={form["rc.charge"]} onChange={set("rc.charge")} placeholder="0" />
            </Field>
            <Field label="Transfer Date">
              <input className={inp()} type="date" value={form["rc.transferDate"]} onChange={set("rc.transferDate")} />
            </Field>
          </div>
        )}
      </div>

      {/* Sale Details */}
      {isSold && (
        <div className={sec}>
          <h3 className={secT}>🤝 Sale Details</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Sell Price (₹) *" error={errors["sale.sellPrice"]}>
              <input className={inp(!!errors["sale.sellPrice"])} type="number" value={form["sale.sellPrice"]} onChange={set("sale.sellPrice")} placeholder="0" />
            </Field>
            <Field label="Sell Date">
              <input className={inp()} type="date" value={form["sale.sellDate"]} onChange={set("sale.sellDate")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
            <RadioCard value="cash"    label="💵 Cash"    current={form["sale.paymentType"]} onChange={(v) => setForm((p) => ({ ...p, "sale.paymentType": v }))} />
            <RadioCard value="finance" label="🏦 Finance" current={form["sale.paymentType"]} onChange={(v) => setForm((p) => ({ ...p, "sale.paymentType": v }))} />
          </div>

          {!isFinance && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Cash Mila (₹)">
                <input className={inp()} type="number" value={form["sale.cash.amountPaid"]} onChange={set("sale.cash.amountPaid")} placeholder="0" />
              </Field>
              <Field label="Due Baaki (₹)">
                <input className={inp()} type="number" value={form["sale.cash.amountDue"]} onChange={set("sale.cash.amountDue")} placeholder="0" />
              </Field>
              {hasDue && (
                <Field label="Due Date">
                  <input className={inp()} type="date" value={form["sale.cash.dueDate"]} onChange={set("sale.cash.dueDate")} />
                </Field>
              )}
            </div>
          )}
          {isFinance && (
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { k: "sale.finance.companyName",  label: "Finance Company",    type: "text",   ph: "Bajaj, HDFC..." },
                { k: "sale.finance.financeAmount", label: "Finance Amount (₹)", type: "number", ph: "0" },
                { k: "sale.finance.emiAmount",     label: "EMI Amount (₹/mo)",  type: "number", ph: "0" },
                { k: "sale.finance.emiMonths",     label: "EMI Months",         type: "number", ph: "12" },
                { k: "sale.finance.startDate",     label: "EMI Start Date",     type: "date",   ph: "" },
              ].map(({ k, label, type, ph }) => (
                <Field key={k} label={label}>
                  <input className={inp()} type={type} value={form[k]} onChange={set(k)} placeholder={ph} />
                </Field>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Photos */}
      <div className={sec}>
        <h3 className={secT}>📸 Bike Photos</h3>
        <div className="flex flex-wrap gap-3 mb-2">
          {existingImgs.map((img) => (
            <div key={img.public_id} className="relative w-24 h-20 rounded-xl overflow-hidden border-2 border-slate-200">
              <img src={img.url} alt="saved" className="w-full h-full object-cover" />
              <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] font-bold text-center py-0.5">Saved</span>
            </div>
          ))}
          {previews.map((src, i) => (
            <div key={i} className="relative w-24 h-20 rounded-xl overflow-hidden border-2 border-orange-200">
              <img src={src} alt="preview" className="w-full h-full object-cover" />
              <button type="button"
                onClick={() => { URL.revokeObjectURL(src); setNewImgs((p) => p.filter((_,idx) => idx !== i)); setPreviews((p) => p.filter((_,idx) => idx !== i)); }}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-600">✕</button>
            </div>
          ))}
          {newImgs.length + existingImgs.length < 5 && (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-24 h-20 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:border-orange-400 hover:bg-orange-50 transition-all flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-orange-500">
              <span className="text-2xl">📷</span>
              <span className="text-[10px] font-semibold">Add Photo</span>
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400">Max 5 images · 5MB each · JPG/PNG/WebP</p>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImgs} />
      </div>

      {/* Notes */}
      <div className={sec}>
        <h3 className={secT}>📝 Notes</h3>
        <textarea className={`${inp()} resize-y`} value={form.notes} onChange={set("notes")} rows={3} placeholder="Koi bhi extra information..." />
      </div>

      {/* Submit */}
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={() => navigate(-1)}
          className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="px-8 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:opacity-60 text-white font-bold text-sm transition-all flex items-center gap-2 min-w-37.5 justify-center">
          {loading ? <Spinner size="sm" /> : isEdit ? "💾 Update Bike" : "➕ Bike Add Karo"}
        </button>
      </div>
    </form>
  );
}
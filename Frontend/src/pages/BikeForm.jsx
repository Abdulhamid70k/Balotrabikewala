import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Save, X } from "lucide-react";
import {
  createBike, updateBike, fetchBike,
  selectCurrentBike, selectBikeLoading, clearBikeMessages, clearCurrentBike,
} from "../features/bikes/bikeSlice";
import { Spinner } from "../components/UI";
import BikeNameInput from "../components/BikeNameInput";
import toast from "react-hot-toast";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => currentYear - i);

const inp = (err = false) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-900 outline-none transition-all focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-50 ${err ? "border-red-400" : "border-slate-200"}`;

function Field({ label, error, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="font-display font-bold text-sm text-orange-700 mb-4 pb-2.5 border-b-2 border-orange-100">{title}</h3>
      {children}
    </div>
  );
}

function RadioPill({ label, value, current, onChange }) {
  const active = current === value;
  return (
    <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-semibold select-none
      ${active ? "border-orange-400 bg-orange-50 text-orange-700" : "border-slate-200 bg-slate-50 text-slate-500 hover:border-orange-200"}`}>
      <input type="radio" value={value} checked={active} onChange={() => onChange(value)} className="hidden" />
      {label}
    </label>
  );
}

// Purchase form mein sirf yeh fields hain — RC aur Service nahi
const INIT = {
  bikeName: "", bikeMake: "", bikeBrand: "", item: "",
  year: "", color: "", registrationNumber: "", status: "in_stock",
  "purchase.voucherNumber": "", "purchase.buyFrom": "", "purchase.buyDate": "", "purchase.buyPrice": "",
  notes: "",
};

const flatten = (obj, prefix = "") =>
  Object.keys(obj).reduce((acc, k) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === "object" && obj[k] !== null && !Array.isArray(obj[k]) && !(obj[k] instanceof Date))
      Object.assign(acc, flatten(obj[k], key));
    else acc[key] = obj[k] ?? "";
    return acc;
  }, {});

const nest = (flat) => {
  const res = {};
  for (const [key, val] of Object.entries(flat)) {
    const parts = key.split(".");
    let cur = res;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
  }
  return res;
};

export default function BikeForm() {
  const { id }   = useParams();
  const isEdit   = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading  = useSelector(selectBikeLoading);
  const current  = useSelector(selectCurrentBike);

  const [form,   setForm]   = useState(INIT);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) dispatch(fetchBike(id));
    return () => dispatch(clearCurrentBike());
  }, [id, isEdit, dispatch]);

  useEffect(() => {
    if (isEdit && current) {
      const flat = flatten(current);
      if (flat["purchase.buyDate"]) flat["purchase.buyDate"] = new Date(flat["purchase.buyDate"]).toISOString().split("T")[0];
      setForm((p) => ({ ...p, ...flat }));
    }
  }, [current, isEdit]);

  const set = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors((p) => { const n = { ...p }; delete n[k]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!form.bikeName.trim())      e.bikeName             = "Bike name zaroori hai";
    if (!form["purchase.buyPrice"]) e["purchase.buyPrice"] = "Buy price zaroori hai";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error("Form mein errors hain"); return; }

    const nested = nest(form);

    const result = await dispatch(isEdit ? updateBike({ id, formData: nested }) : createBike(nested));
    if (!result.error) {
      toast.success(isEdit ? "Bike update ho gayi!" : "Bike add ho gayi!");
      dispatch(clearBikeMessages());
      navigate("/stock");
    } else {
      toast.error(result.payload || "Kuch error aaya");
    }
  };

  if (isEdit && loading && !current) return <Spinner center size="lg" />;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 pb-10 max-w-3xl">

      {/* ── Bike Identity ─────────────────────────────────────── */}
      <Section title="🏍️ Bike Details">
        <div className="space-y-4">
          <Field label="Bike Name" required error={errors.bikeName}>
            <BikeNameInput
              value={form.bikeName}
              onChange={({ bikeName, bikeMake, bikeBrand, item }) =>
                setForm((p) => ({ ...p, bikeName, bikeMake, bikeBrand, item }))
              }
            />
            {form.bikeName && (
              <p className="text-xs text-slate-400 mt-1">
                Selected: <span className="text-orange-600 font-semibold">{form.bikeName}</span>
                {form.bikeMake ? ` — ${form.bikeMake}` : ""}
              </p>
            )}
          </Field>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Year">
              <select className={inp()} value={form.year} onChange={set("year")}>
                <option value="">Select year</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
            <Field label="Color">
              <input className={inp()} value={form.color} onChange={set("color")} placeholder="Black, Red..." />
            </Field>
            <Field label="Reg. Number">
              <input className={inp()} value={form.registrationNumber} onChange={set("registrationNumber")} placeholder="RJ14AB1234" />
            </Field>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Status</label>
            <div className="flex gap-2">
              {[
                { value: "in_stock",        label: "🏍️ Stock Mein" },
                { value: "pending_arrival", label: "⏳ Aani Baaki" },
              ].map((s) => (
                <RadioPill key={s.value} {...s} current={form.status} onChange={(v) => setForm((p) => ({ ...p, status: v }))} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Purchase Details ──────────────────────────────────── */}
      <Section title="🛒 Purchase Details">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Voucher Number">
            <input className={inp()} value={form["purchase.voucherNumber"]} onChange={set("purchase.voucherNumber")} placeholder="PUR-001" />
          </Field>
          <Field label="Kahan se kharidi">
            <input className={inp()} value={form["purchase.buyFrom"]} onChange={set("purchase.buyFrom")} placeholder="Seller / Dealer" />
          </Field>
          <Field label="Purchase Date">
            <input className={inp()} type="date" value={form["purchase.buyDate"]} onChange={set("purchase.buyDate")} />
          </Field>
          <Field label="Buy Price (₹)" required error={errors["purchase.buyPrice"]}>
            <input className={inp(!!errors["purchase.buyPrice"])} type="number" value={form["purchase.buyPrice"]} onChange={set("purchase.buyPrice")} placeholder="0" />
          </Field>
        </div>
      </Section>

      {/* ── Notes ─────────────────────────────────────────────── */}
      <Section title="📝 Notes">
        <textarea className={`${inp()} resize-y`} value={form.notes} onChange={set("notes")} rows={2} placeholder="Extra information..." />
      </Section>

      {/* ── Submit ────────────────────────────────────────────── */}
      <div className="flex gap-3 justify-end pt-1">
        <button type="button" onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-colors">
          <X size={15} /> Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-7 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all min-w-[140px] justify-center">
          {loading ? <Spinner size="sm" /> : <><Save size={15} /> {isEdit ? "Update" : "Save Bike"}</>}
        </button>
      </div>
    </form>
  );
}
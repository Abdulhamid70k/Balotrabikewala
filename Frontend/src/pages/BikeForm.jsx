import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Save, X, Plus, Trash2 } from "lucide-react";
import {
  createBike, updateBike, fetchBike,
  selectCurrentBike, selectBikeLoading, clearBikeMessages, clearCurrentBike,
} from "../features/bikes/bikeSlice";
import { Spinner } from "../components/UI";
import BikeNameInput from "../components/BikeNameInput";
import toast from "react-hot-toast";

// Year dropdown options
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

const INIT = {
  bikeName: "", bikeMake: "", bikeBrand: "", item: "",
  year: "", color: "", registrationNumber: "", status: "in_stock",
  "purchase.voucherNumber": "", "purchase.buyFrom": "", "purchase.buyDate": "", "purchase.buyPrice": "",
  "service.totalCost": "", "service.notes": "",
  "sale.voucherNumber": "", "sale.sellPrice": "", "sale.sellDate": "", "sale.paymentType": "cash",
  "sale.customer.name": "", "sale.customer.mobile": "", "sale.customer.address": "",
  "sale.cash.amountPaid": "", "sale.cash.amountDue": "", "sale.cash.dueDate": "", "sale.cash.dueNote": "",
  "sale.finance.companyName": "", "sale.finance.financeAmount": "",
  "sale.finance.emiAmount": "", "sale.finance.emiMonths": "", "sale.finance.startDate": "",
  notes: "",
  images: [],
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

  const [form,     setForm]     = useState(INIT);
  const [svcItems, setSvcItems] = useState([]);
  const [svcName,  setSvcName]  = useState("");
  const [svcCost,  setSvcCost]  = useState("");
  const [errors,   setErrors]   = useState({});

  useEffect(() => {
    if (isEdit) dispatch(fetchBike(id));
    return () => dispatch(clearCurrentBike());
  }, [id, isEdit, dispatch]);

  useEffect(() => {
    if (isEdit && current) {
      const flat = flatten(current);
      const DATE_KEYS = ["purchase.buyDate","sale.sellDate","sale.cash.dueDate","sale.finance.startDate"];
      DATE_KEYS.forEach((k) => { if (flat[k]) flat[k] = new Date(flat[k]).toISOString().split("T")[0]; });
      setForm((p) => ({ ...p, ...flat }));
      setSvcItems(current.service?.items || []);
      setImgList(current.images || []);
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

  const validate = () => {
    const e = {};
    if (!form.bikeName.trim())          e.bikeName             = "Bike name zaroori hai";
    if (!form["purchase.buyPrice"])     e["purchase.buyPrice"] = "Buy price zaroori hai";
    if (form.status === "sold") {
      if (!form["sale.sellPrice"])      e["sale.sellPrice"]    = "Sell price zaroori hai";
      if (!form["sale.customer.name"])  e["sale.customer.name"]= "Customer name zaroori hai";
      if (!form["sale.customer.mobile"]) e["sale.customer.mobile"] = "Mobile number zaroori hai";
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error("Form mein errors hain"); return; }

    const nested = nest(form);
    nested.service = { ...nested.service, items: svcItems };
    nested.images = imgList;

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

  const isSold    = form.status === "sold";
  const isFinance = form["sale.paymentType"] === "finance";
  const hasDue    = Number(form["sale.cash.amountDue"]) > 0;

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

          {/* Status pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Status</label>
            <div className="flex gap-2">
              {[
                { value: "in_stock",        label: "🏍️ Stock Mein" },
                { value: "pending_arrival", label: "⏳ Aani Baaki" },
                { value: "sold",            label: "✅ Bech Di" },
              ].map((s) => (
                <RadioPill key={s.value} {...s} current={form.status} onChange={(v) => setForm((p) => ({ ...p, status: v }))} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Purchase Voucher ──────────────────────────────────── */}
      <Section title="🛒 Purchase Voucher">
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

      {/* ── Service ───────────────────────────────────────────── */}
      <Section title="🔧 Service Details">
        <div className="flex gap-2 mb-3 flex-wrap">
          <input className={`${inp()} flex-[2] min-w-[130px]`} value={svcName} onChange={(e) => setSvcName(e.target.value)}
            placeholder="Service item" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSvc())} />
          <input className={`${inp()} flex-1 min-w-[80px]`} type="number" value={svcCost} onChange={(e) => setSvcCost(e.target.value)} placeholder="Cost (₹)" />
          <button type="button" onClick={addSvc}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors">
            <Plus size={14} /> Add
          </button>
        </div>

        {svcItems.length > 0 && (
          <div className="border border-slate-100 rounded-xl overflow-hidden mb-4">
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
            <div className="px-4 py-2 bg-orange-50 text-sm font-semibold text-orange-700">
              Total: ₹{svcItems.reduce((s, i) => s + i.cost, 0).toLocaleString("en-IN")}
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Total Service Cost (₹)">
            <input className={inp()} type="number" value={form["service.totalCost"]} onChange={set("service.totalCost")} placeholder="0" />
          </Field>
          <Field label="Service Notes">
            <input className={inp()} value={form["service.notes"]} onChange={set("service.notes")} placeholder="Optional..." />
          </Field>
        </div>
      </Section>



      {/* ── Sale Voucher (only if sold) ───────────────────────── */}
      {isSold && (
        <>
          <Section title="👤 Customer Details">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Customer Name" required error={errors["sale.customer.name"]}>
                <input className={inp(!!errors["sale.customer.name"])} value={form["sale.customer.name"]} onChange={set("sale.customer.name")} placeholder="Rahul Sharma" />
              </Field>
              <Field label="Mobile Number" required error={errors["sale.customer.mobile"]}>
                <input className={inp(!!errors["sale.customer.mobile"])} type="tel" value={form["sale.customer.mobile"]} onChange={set("sale.customer.mobile")} placeholder="98765 43210" />
              </Field>
              <Field label="Address">
                <input className={inp()} value={form["sale.customer.address"]} onChange={set("sale.customer.address")} placeholder="City, Area..." />
              </Field>
            </div>
          </Section>

          <Section title="🤝 Sale Voucher">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Voucher Number">
                <input className={inp()} value={form["sale.voucherNumber"]} onChange={set("sale.voucherNumber")} placeholder="SAL-001" />
              </Field>
              <Field label="Sell Price (₹)" required error={errors["sale.sellPrice"]}>
                <input className={inp(!!errors["sale.sellPrice"])} type="number" value={form["sale.sellPrice"]} onChange={set("sale.sellPrice")} placeholder="0" />
              </Field>
              <Field label="Sell Date">
                <input className={inp()} type="date" value={form["sale.sellDate"]} onChange={set("sale.sellDate")} />
              </Field>
            </div>

            <div className="flex gap-2 mt-4">
              {[{ value: "cash", label: "💵 Cash" }, { value: "finance", label: "🏦 Finance" }].map((o) => (
                <RadioPill key={o.value} {...o} current={form["sale.paymentType"]} onChange={(v) => setForm((p) => ({ ...p, "sale.paymentType": v }))} />
              ))}
            </div>

            {!isFinance && (
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <Field label="Cash Mila (₹)">
                  <input className={inp()} type="number" value={form["sale.cash.amountPaid"]} onChange={set("sale.cash.amountPaid")} placeholder="0" />
                </Field>
                <Field label="Due Baaki (₹)">
                  <input className={inp()} type="number" value={form["sale.cash.amountDue"]} onChange={set("sale.cash.amountDue")} placeholder="0" />
                </Field>
                {hasDue && (
                  <>
                    <Field label="Due Payment Date">
                      <input className={inp()} type="date" value={form["sale.cash.dueDate"]} onChange={set("sale.cash.dueDate")} />
                    </Field>
                    <Field label="Due Note (kab dega?)">
                      <input className={inp()} value={form["sale.cash.dueNote"]} onChange={set("sale.cash.dueNote")} placeholder="e.g. Next month salary ke baad" />
                    </Field>
                  </>
                )}
              </div>
            )}

            {isFinance && (
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                {[
                  { k: "sale.finance.companyName",  label: "Finance Company",    type: "text",   ph: "Bajaj Finance, HDFC..." },
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
          </Section>
        </>
      )}

      {/* ── Images ───────────────────────────────────────────────── */}
      <Section title="📸 Bike Photos (URL se add karo)">
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input className={inp()} value={imgUrl} onChange={e => setImgUrl(e.target.value)}
            placeholder="Image URL paste karo (Google Drive, Cloudinary, etc.)" style={{ flex: 1 }} />
          <button type="button"
            onClick={() => { if (!imgUrl.trim()) return; setImgList(p => [...p, { url: imgUrl.trim(), public_id: Date.now().toString() }]); setImgUrl(""); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors whitespace-nowrap">
            + Add
          </button>
        </div>
        {imgList.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {imgList.map((img, i) => (
              <div key={i} className="relative">
                <img src={img.url} alt="bike" className="w-24 h-20 object-cover rounded-xl border-2 border-slate-200" onError={e => e.target.src = "https://via.placeholder.com/96x80?text=🏍️"} />
                <button type="button" onClick={() => setImgList(p => p.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">✕</button>
              </div>
            ))}
          </div>
        )}
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
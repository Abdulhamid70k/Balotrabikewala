import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Save, X, Plus, Trash2, Camera } from "lucide-react";
import { createBike, selectBikeLoading, clearBikeMessages } from "../features/bikes/bikeSlice";
import { Spinner } from "../components/UI";
import BikeNameInput from "../components/BikeNameInput";
import toast from "react-hot-toast";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 25 }, (_, i) => currentYear - i);

const inp = (err = false) =>
  `w-full px-4 py-3 rounded-2xl border-2 text-sm bg-white text-slate-900 outline-none transition-all
   focus:border-orange-400 focus:ring-4 focus:ring-orange-50
   ${err ? "border-red-400 bg-red-50" : "border-slate-200"}`;

function Field({ label, error, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs font-medium flex items-center gap-1">⚠ {error}</p>}
    </div>
  );
}

function Card({ title, emoji, children }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-50">
        <span className="text-xl">{emoji}</span>
        <h3 className="font-display font-bold text-slate-800 text-base">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

export default function PurchaseForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading  = useSelector(selectBikeLoading);
  const fileRef  = useRef();

  const [bikeName,  setBikeName]  = useState("");
  const [bikeMake,  setBikeMake]  = useState("");
  const [bikeBrand, setBikeBrand] = useState("");
  const [itemId,    setItemId]    = useState("");
  const [year,      setYear]      = useState("");
  const [color,     setColor]     = useState("");
  const [status,    setStatus]    = useState("in_stock");

  const [voucherNo, setVoucherNo] = useState("");
  const [buyFrom,   setBuyFrom]   = useState("");
  const [buyDate,   setBuyDate]   = useState(new Date().toISOString().split("T")[0]);
  const [buyPrice,  setBuyPrice]  = useState("");

  const [svcItems,  setSvcItems]  = useState([]);
  const [svcName,   setSvcName]   = useState("");
  const [svcCost,   setSvcCost]   = useState("");
  const [svcTotal,  setSvcTotal]  = useState("");
  const [svcNotes,  setSvcNotes]  = useState("");

  const [newFiles,  setNewFiles]  = useState([]);
  const [previews,  setPreviews]  = useState([]);

  const [errors,    setErrors]    = useState({});

  const addSvc = () => {
    if (!svcName.trim()) return;
    const updated = [...svcItems, { name: svcName.trim(), cost: Number(svcCost) || 0 }];
    setSvcItems(updated);
    setSvcTotal(updated.reduce((s, i) => s + i.cost, 0));
    setSvcName(""); setSvcCost("");
  };

  const removeSvc = (i) => {
    const updated = svcItems.filter((_, idx) => idx !== i);
    setSvcItems(updated);
    setSvcTotal(updated.reduce((s, x) => s + x.cost, 0));
  };

  const handleImgs = (e) => {
    const files = Array.from(e.target.files);
    if (newFiles.length + files.length > 5) { toast.error("Max 5 photos"); return; }
    setNewFiles(p => [...p, ...files]);
    setPreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
  };

  const validate = () => {
    const e = {};
    if (!bikeName.trim()) e.bikeName = "Bike naam zaroori hai";
    if (!buyPrice)        e.buyPrice = "Purchase price zaroori hai";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error("Zaroori fields fill karo"); return; }

    const data = {
      bikeName, bikeMake, bikeBrand,
      item: itemId || undefined,
      year: year || undefined,
      color: color || undefined,
      status,
      purchase: {
        voucherNumber: voucherNo,
        buyFrom, buyDate,
        buyPrice: Number(buyPrice),
      },
      service: {
        items: svcItems,
        totalCost: Number(svcTotal) || svcItems.reduce((s, i) => s + i.cost, 0),
        notes: svcNotes,
      },
    };

    const fd = new FormData();
    fd.append("data", JSON.stringify(data));
    newFiles.forEach(f => fd.append("images", f));

    const result = await dispatch(createBike(fd));
    if (!result.error) {
      toast.success("Purchase entry ho gayi! 🎉");
      dispatch(clearBikeMessages());
      navigate("/stock");
    } else {
      toast.error(result.payload || "Error aaya");
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="px-4 py-4 space-y-4 pb-10">

      {/* Bike Details */}
      <Card title="Bike Details" emoji="🏍️">
        <Field label="Bike Name" required error={errors.bikeName}>
          <BikeNameInput
            value={bikeName}
            onChange={({ bikeName: n, bikeMake: m, bikeBrand: b, item: id }) => {
              setBikeName(n); setBikeMake(m); setBikeBrand(b); setItemId(id || "");
            }}
          />
          {bikeName && (
            <p className="text-xs text-orange-600 font-semibold mt-1">✓ {bikeName} {bikeMake ? `— ${bikeMake}` : ""}</p>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Year">
            <select className={inp()} value={year} onChange={e => setYear(e.target.value)}>
              <option value="">Select</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
          <Field label="Color">
            <input className={inp()} value={color} onChange={e => setColor(e.target.value)} placeholder="Black, Red..." />
          </Field>
        </div>

        {/* Status */}
        <Field label="Availability">
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: "in_stock",        label: "Stock Mein",  emoji: "✅" },
              { v: "pending_arrival", label: "Aani Baaki",  emoji: "⏳" },
            ].map(({ v, label, emoji }) => (
              <label key={v} className={`flex items-center gap-2 p-3 rounded-2xl border-2 cursor-pointer transition-all ${status === v ? "border-orange-400 bg-orange-50" : "border-slate-200 bg-slate-50"}`}>
                <input type="radio" name="status" value={v} checked={status === v} onChange={() => setStatus(v)} className="hidden" />
                <span>{emoji}</span>
                <span className={`text-sm font-semibold ${status === v ? "text-orange-700" : "text-slate-500"}`}>{label}</span>
              </label>
            ))}
          </div>
        </Field>
      </Card>

      {/* Purchase Details */}
      <Card title="Purchase Details" emoji="🛒">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Voucher No.">
            <input className={inp()} value={voucherNo} onChange={e => setVoucherNo(e.target.value)} placeholder="PUR-001" />
          </Field>
          <Field label="Purchase Date">
            <input className={inp()} type="date" value={buyDate} onChange={e => setBuyDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Seller / Source">
          <input className={inp()} value={buyFrom} onChange={e => setBuyFrom(e.target.value)} placeholder="Seller ka naam ya jagah" />
        </Field>
        <Field label="Purchase Price (₹)" required error={errors.buyPrice}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
            <input className={`${inp(!!errors.buyPrice)} pl-8`} type="number" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="0" />
          </div>
        </Field>
      </Card>

      {/* Service (optional at purchase time) */}
      <Card title="Service Details" emoji="🔧">
        <p className="text-xs text-slate-400 -mt-1">Optional — purchase ke time service ki ho toh fill karo</p>
        <div className="flex gap-2">
          <input className={`${inp()} flex-[2]`} value={svcName} onChange={e => setSvcName(e.target.value)}
            placeholder="Engine oil, Tyre..." onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSvc())} />
          <input className={`${inp()} flex-1`} type="number" value={svcCost} onChange={e => setSvcCost(e.target.value)} placeholder="₹" />
          <button type="button" onClick={addSvc} className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-sm transition-colors">+</button>
        </div>

        {svcItems.length > 0 && (
          <div className="border-2 border-slate-100 rounded-2xl overflow-hidden">
            {svcItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-700 font-medium">{item.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-500">₹{item.cost.toLocaleString("en-IN")}</span>
                  <button type="button" onClick={() => removeSvc(i)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
            <div className="px-4 py-2.5 bg-orange-50 flex justify-between items-center">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">Total</span>
              <span className="font-bold text-orange-700">₹{svcItems.reduce((s, i) => s + i.cost, 0).toLocaleString("en-IN")}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Total Service Cost (₹)">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input className={`${inp()} pl-8`} type="number" value={svcTotal} onChange={e => setSvcTotal(e.target.value)} placeholder="0" />
            </div>
          </Field>
          <Field label="Notes">
            <input className={inp()} value={svcNotes} onChange={e => setSvcNotes(e.target.value)} placeholder="Optional..." />
          </Field>
        </div>
      </Card>

      {/* Photos */}
      <Card title="Bike Photos" emoji="📸">
        <div className="flex flex-wrap gap-3">
          {previews.map((src, i) => (
            <div key={i} className="relative w-24 h-20 rounded-2xl overflow-hidden border-2 border-orange-200">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => { URL.revokeObjectURL(src); setNewFiles(p => p.filter((_, idx) => idx !== i)); setPreviews(p => p.filter((_, idx) => idx !== i)); }}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">✕</button>
            </div>
          ))}
          {newFiles.length < 5 && (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-24 h-20 border-2 border-dashed border-orange-200 rounded-2xl flex flex-col items-center justify-center gap-1 text-orange-400 hover:bg-orange-50 transition-colors">
              <Camera size={20} />
              <span className="text-[10px] font-semibold">Add Photo</span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImgs} />
        <p className="text-xs text-slate-400">Max 5 · 5MB each</p>
      </Card>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-3.5 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl text-sm font-bold transition-colors hover:bg-slate-50">
          <X size={16} /> Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-orange-200">
          {loading ? <Spinner size="sm" /> : <><Save size={16} /> Purchase Save Karo</>}
        </button>
      </div>
    </form>
  );
}
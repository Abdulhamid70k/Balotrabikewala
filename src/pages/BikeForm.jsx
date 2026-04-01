import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  createBike, updateBike, fetchBike,
  selectCurrentBike, selectBikeLoading, clearBikeMessages, clearCurrentBike,
} from "../features/bikes/bikesslice";
import { Spinner } from "../components/UI";
import toast from "react-hot-toast";
import styles from "./BikeForm.module.css";

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

// Flatten nested object for form fields
const flatten = (obj, prefix = "") =>
  Object.keys(obj).reduce((acc, k) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === "object" && obj[k] !== null && !Array.isArray(obj[k]) && !(obj[k] instanceof Date))
      Object.assign(acc, flatten(obj[k], key));
    else acc[key] = obj[k] ?? "";
    return acc;
  }, {});

// Convert flat form values → nested object for API
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

export default function BikeForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectBikeLoading);
  const currentBike = useSelector(selectCurrentBike);

  const [form, setForm] = useState(INIT);
  const [serviceItems, setServiceItems] = useState([]);
  const [serviceInput, setServiceInput] = useState("");
  const [serviceCostInput, setServiceCostInput] = useState("");
  const [images, setImages] = useState([]);     // File objects (new uploads)
  const [previews, setPreviews] = useState([]); // preview URLs
  const [existingImgs, setExistingImgs] = useState([]); // already uploaded
  const [errors, setErrors] = useState({});
  const fileRef = useRef();

  // Load bike for edit
  useEffect(() => {
    if (isEdit) dispatch(fetchBike(id));
    return () => dispatch(clearCurrentBike());
  }, [id, isEdit, dispatch]);

  useEffect(() => {
    if (isEdit && currentBike) {
      const flat = flatten(currentBike);
      // Format dates
      ["purchase.buyDate","sale.sellDate","sale.cash.dueDate","rc.transferDate","sale.finance.startDate"]
        .forEach((k) => {
          if (flat[k]) flat[k] = new Date(flat[k]).toISOString().split("T")[0];
        });
      setForm((prev) => ({ ...prev, ...flat }));
      setServiceItems(currentBike.service?.items || []);
      setExistingImgs(currentBike.images || []);
    }
  }, [currentBike, isEdit]);

  const set = (k) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [k]: val }));
    if (errors[k]) setErrors((prev) => { const n = { ...prev }; delete n[k]; return n; });
  };

  const addServiceItem = () => {
    if (!serviceInput.trim()) return;
    setServiceItems((prev) => [
      ...prev,
      { name: serviceInput.trim(), cost: Number(serviceCostInput) || 0 },
    ]);
    // Auto-sum service total
    const total = serviceItems.reduce((s, i) => s + i.cost, 0) + (Number(serviceCostInput) || 0);
    setForm((prev) => ({ ...prev, "service.totalCost": total }));
    setServiceInput("");
    setServiceCostInput("");
  };

  const removeServiceItem = (idx) => {
    const updated = serviceItems.filter((_, i) => i !== idx);
    setServiceItems(updated);
    const total = updated.reduce((s, i) => s + i.cost, 0);
    setForm((prev) => ({ ...prev, "service.totalCost": total }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) { toast.error("Max 5 images allowed"); return; }
    setImages((prev) => [...prev, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeNewImage = (idx) => {
    URL.revokeObjectURL(previews[idx]);
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
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
    nested.service = { ...nested.service, items: serviceItems };

    const formData = new FormData();
    // Append nested JSON as string, server parses it
    formData.append("data", JSON.stringify(nested));
    images.forEach((img) => formData.append("images", img));

    const action = isEdit
      ? updateBike({ id, formData })
      : createBike(formData);

    const result = await dispatch(action);

    if (!result.error) {
      toast.success(isEdit ? "Bike update ho gayi!" : "Bike add ho gayi!");
      dispatch(clearBikeMessages());
      navigate("/stock");
    } else {
      toast.error(result.payload || "Kuch error aaya");
    }
  };

  if (isEdit && loading && !currentBike) return <Spinner center size="lg" />;

  const isSold = form.status === "sold";
  const isFinance = form["sale.paymentType"] === "finance";
  const hasDue = Number(form["sale.cash.amountDue"]) > 0;

  return (
    <form onSubmit={handleSubmit} className={styles.page} noValidate>

      {/* ── Bike Info ─────────────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>🏍️ Bike Information</h3>
        <div className={styles.grid2}>
          <Field label="Model *" error={errors.model}>
            <input className={inp(errors.model)} value={form.model} onChange={set("model")} placeholder="Splendor Plus, Pulsar 150..." />
          </Field>
          <Field label="Year">
            <input className={styles.input} type="number" value={form.year} onChange={set("year")} placeholder="2019" min="1990" max={new Date().getFullYear()} />
          </Field>
          <Field label="Color">
            <input className={styles.input} value={form.color} onChange={set("color")} placeholder="Black, Red, Blue..." />
          </Field>
          <Field label="Registration Number">
            <input className={styles.input} value={form.registrationNumber} onChange={set("registrationNumber")} placeholder="RJ 14 AB 1234" />
          </Field>
        </div>
        <div className={styles.grid3} style={{ marginTop: 12 }}>
          {["in_stock","pending_arrival","sold"].map((s) => (
            <label key={s} className={`${styles.radioCard} ${form.status === s ? styles.radioActive : ""}`}>
              <input type="radio" name="status" value={s} checked={form.status === s} onChange={set("status")} style={{ display: "none" }} />
              <span className={styles.radioIcon}>{s === "in_stock" ? "🏍️" : s === "pending_arrival" ? "⏳" : "✅"}</span>
              <span>{s === "in_stock" ? "Stock Mein" : s === "pending_arrival" ? "Aani Baaki" : "Bech Di"}</span>
            </label>
          ))}
        </div>
      </section>

      {/* ── Purchase Details ──────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>🛒 Purchase Details</h3>
        <div className={styles.grid2}>
          <Field label="Kahan se kharidi">
            <input className={styles.input} value={form["purchase.buyFrom"]} onChange={set("purchase.buyFrom")} placeholder="Seller ka naam / jagah" />
          </Field>
          <Field label="Kharidne ki Tarikh">
            <input className={styles.input} type="date" value={form["purchase.buyDate"]} onChange={set("purchase.buyDate")} />
          </Field>
          <Field label="Kharidne ki Kimat (₹) *" error={errors["purchase.buyPrice"]}>
            <input className={inp(errors["purchase.buyPrice"])} type="number" value={form["purchase.buyPrice"]} onChange={set("purchase.buyPrice")} placeholder="0" min="0" />
          </Field>
        </div>
      </section>

      {/* ── Service Details ───────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>🔧 Service Details</h3>
        <div className={styles.serviceAdd}>
          <input
            className={styles.input}
            value={serviceInput}
            onChange={(e) => setServiceInput(e.target.value)}
            placeholder="Service item (e.g. Engine oil)"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addServiceItem())}
            style={{ flex: 2 }}
          />
          <input
            className={styles.input}
            type="number"
            value={serviceCostInput}
            onChange={(e) => setServiceCostInput(e.target.value)}
            placeholder="Cost (₹)"
            style={{ flex: 1 }}
          />
          <button type="button" className={styles.addItemBtn} onClick={addServiceItem}>+ Add</button>
        </div>

        {serviceItems.length > 0 && (
          <div className={styles.serviceList}>
            {serviceItems.map((item, i) => (
              <div key={i} className={styles.serviceItem}>
                <span>🔧 {item.name}</span>
                <span className={styles.serviceItemCost}>₹{Number(item.cost).toLocaleString("en-IN")}</span>
                <button type="button" className={styles.removeBtn} onClick={() => removeServiceItem(i)}>✕</button>
              </div>
            ))}
            <div className={styles.serviceTotal}>
              Total: <strong>₹{serviceItems.reduce((s,i) => s + i.cost, 0).toLocaleString("en-IN")}</strong>
            </div>
          </div>
        )}

        <div className={styles.grid2} style={{ marginTop: 12 }}>
          <Field label="Total Service Kharcha (₹)">
            <input className={styles.input} type="number" value={form["service.totalCost"]} onChange={set("service.totalCost")} placeholder="0" />
          </Field>
          <Field label="Service Notes">
            <input className={styles.input} value={form["service.notes"]} onChange={set("service.notes")} placeholder="Additional notes..." />
          </Field>
        </div>
      </section>

      {/* ── RC Transfer ───────────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>📄 RC Transfer</h3>
        <label className={styles.checkLabel}>
          <input type="checkbox" checked={form["rc.transferred"]} onChange={set("rc.transferred")} className={styles.checkbox} />
          RC Transfer ki gayi hai
        </label>
        {form["rc.transferred"] && (
          <div className={styles.grid2} style={{ marginTop: 12 }}>
            <Field label="RC Transfer Charge (₹)">
              <input className={styles.input} type="number" value={form["rc.charge"]} onChange={set("rc.charge")} placeholder="0" />
            </Field>
            <Field label="Transfer Date">
              <input className={styles.input} type="date" value={form["rc.transferDate"]} onChange={set("rc.transferDate")} />
            </Field>
          </div>
        )}
      </section>

      {/* ── Sale Details (only if sold) ───────────────────────── */}
      {isSold && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>🤝 Sale Details</h3>
          <div className={styles.grid2}>
            <Field label="Sell Kimat (₹) *" error={errors["sale.sellPrice"]}>
              <input className={inp(errors["sale.sellPrice"])} type="number" value={form["sale.sellPrice"]} onChange={set("sale.sellPrice")} placeholder="0" />
            </Field>
            <Field label="Sell ki Tarikh">
              <input className={styles.input} type="date" value={form["sale.sellDate"]} onChange={set("sale.sellDate")} />
            </Field>
          </div>

          <div className={styles.grid2} style={{ marginTop: 12 }}>
            {["cash","finance"].map((t) => (
              <label key={t} className={`${styles.radioCard} ${form["sale.paymentType"] === t ? styles.radioActive : ""}`}>
                <input type="radio" name="paymentType" value={t} checked={form["sale.paymentType"] === t} onChange={set("sale.paymentType")} style={{ display: "none" }} />
                <span>{t === "cash" ? "💵 Cash" : "🏦 Finance"}</span>
              </label>
            ))}
          </div>

          {/* Cash Payment */}
          {!isFinance && (
            <div className={styles.grid2} style={{ marginTop: 14 }}>
              <Field label="Cash Mila (₹)">
                <input className={styles.input} type="number" value={form["sale.cash.amountPaid"]} onChange={set("sale.cash.amountPaid")} placeholder="0" />
              </Field>
              <Field label="Due Baaki (₹)">
                <input className={styles.input} type="number" value={form["sale.cash.amountDue"]} onChange={set("sale.cash.amountDue")} placeholder="0" />
              </Field>
              {hasDue && (
                <Field label="Due Date">
                  <input className={styles.input} type="date" value={form["sale.cash.dueDate"]} onChange={set("sale.cash.dueDate")} />
                </Field>
              )}
            </div>
          )}

          {/* Finance Payment */}
          {isFinance && (
            <div className={styles.grid2} style={{ marginTop: 14 }}>
              <Field label="Finance Company">
                <input className={styles.input} value={form["sale.finance.companyName"]} onChange={set("sale.finance.companyName")} placeholder="Bajaj, HDFC, etc." />
              </Field>
              <Field label="Finance Amount (₹)">
                <input className={styles.input} type="number" value={form["sale.finance.financeAmount"]} onChange={set("sale.finance.financeAmount")} placeholder="0" />
              </Field>
              <Field label="EMI Amount (₹/month)">
                <input className={styles.input} type="number" value={form["sale.finance.emiAmount"]} onChange={set("sale.finance.emiAmount")} placeholder="0" />
              </Field>
              <Field label="EMI Months">
                <input className={styles.input} type="number" value={form["sale.finance.emiMonths"]} onChange={set("sale.finance.emiMonths")} placeholder="12" />
              </Field>
              <Field label="EMI Start Date">
                <input className={styles.input} type="date" value={form["sale.finance.startDate"]} onChange={set("sale.finance.startDate")} />
              </Field>
            </div>
          )}
        </section>
      )}

      {/* ── Images ───────────────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>📸 Bike Photos</h3>
        <div className={styles.imageGrid}>
          {/* Existing images */}
          {existingImgs.map((img) => (
            <div key={img.public_id} className={styles.imgThumb}>
              <img src={img.url} alt="bike" />
              <span className={styles.existingTag}>Saved</span>
            </div>
          ))}
          {/* New previews */}
          {previews.map((src, i) => (
            <div key={i} className={styles.imgThumb}>
              <img src={src} alt="preview" />
              <button type="button" className={styles.imgRemove} onClick={() => removeNewImage(i)}>✕</button>
            </div>
          ))}
          {/* Upload button */}
          {images.length + existingImgs.length < 5 && (
            <button type="button" className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
              <span>📷</span>
              <span>Photo Add Karo</span>
              <span className={styles.uploadSub}>Max 5 images, 5MB each</span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageChange} />
      </section>

      {/* ── Notes ────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>📝 Additional Notes</h3>
        <textarea
          className={styles.textarea}
          value={form.notes}
          onChange={set("notes")}
          rows={3}
          placeholder="Koi bhi extra information jo track karni ho..."
        />
      </section>

      {/* ── Submit ───────────────────────────────────────────── */}
      <div className={styles.submitRow}>
        <button type="button" className={styles.cancelBtn} onClick={() => navigate(-1)}>Cancel</button>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? <Spinner size="sm" /> : isEdit ? "💾 Update Bike" : "➕ Bike Add Karo"}
        </button>
      </div>
    </form>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────── */
function Field({ label, error, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 5 }}>
        {label}
      </label>
      {children}
      {error && <span style={{ display: "block", fontSize: 12, color: "var(--danger)", marginTop: 3, fontWeight: 500 }}>{error}</span>}
    </div>
  );
}

function inp(err) {
  return `${styles.input} ${err ? styles.inputError : ""}`;
}
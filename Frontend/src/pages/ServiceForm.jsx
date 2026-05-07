import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Save, X, Trash2, Search } from "lucide-react";
import { fetchBikes, updateBike, selectBikes, selectBikeLoading, clearBikeMessages } from "../features/bikes/bikeSlice";
import { Spinner } from "../components/UI";
import toast from "react-hot-toast";

const inp = (err = false) =>
  `w-full px-4 py-3 rounded-2xl border-2 text-sm bg-white text-slate-900 outline-none transition-all
   focus:border-purple-400 focus:ring-4 focus:ring-purple-50
   ${err ? "border-red-400 bg-red-50" : "border-slate-200"}`;

function Card({ title, emoji, children, accent = "purple" }) {
  const colors = {
    purple: "border-purple-100",
    orange: "border-orange-100",
  };
  return (
    <div className={`bg-white rounded-3xl shadow-sm border ${colors[accent]} overflow-hidden`}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-50">
        <span className="text-xl">{emoji}</span>
        <h3 className="font-display font-bold text-slate-800 text-base">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

export default function ServiceForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const bikes    = useSelector(selectBikes);
  const loading  = useSelector(selectBikeLoading);

  const [search,     setSearch]     = useState("");
  const [selected,   setSelected]   = useState(null);
  const [svcItems,   setSvcItems]   = useState([]);
  const [svcName,    setSvcName]    = useState("");
  const [svcCost,    setSvcCost]    = useState("");
  const [svcTotal,   setSvcTotal]   = useState("");
  const [svcNotes,   setSvcNotes]   = useState("");
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    dispatch(fetchBikes({ status: "in_stock", limit: 100 }));
  }, [dispatch]);

  // Pre-load existing service items when bike selected
  useEffect(() => {
    if (selected) {
      setSvcItems(selected.service?.items || []);
      setSvcTotal(selected.service?.totalCost || "");
      setSvcNotes(selected.service?.notes || "");
    }
  }, [selected]);

  const filteredBikes = bikes.filter(b =>
    !search ||
    b.bikeName?.toLowerCase().includes(search.toLowerCase()) ||
    b.registrationNumber?.toLowerCase().includes(search.toLowerCase())
  );

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) { toast.error("Pehle bike select karo"); return; }

    setSaving(true);
    const payload = {
      service: {
        items:     svcItems,
        totalCost: Number(svcTotal) || svcItems.reduce((s, i) => s + i.cost, 0),
        notes:     svcNotes,
      },
    };

    const result = await dispatch(updateBike({ id: selected._id, formData: payload }));
    if (!result.error) {
      toast.success("Service entry save ho gayi! 🔧");
      dispatch(clearBikeMessages());
      navigate("/stock");
    } else {
      toast.error(result.payload || "Error aaya");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="px-4 py-4 space-y-4 pb-10">

      {/* Select Bike */}
      <Card title="Bike Select Karo" emoji="🏍️" accent="purple">
        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-200 text-sm outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 bg-white"
            placeholder="Bike name ya reg number search karo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto">
          {filteredBikes.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-4">Koi bike nahi mili</p>
          ) : filteredBikes.map(b => (
            <button key={b._id} type="button" onClick={() => setSelected(b)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
                selected?._id === b._id
                  ? "border-purple-400 bg-purple-50"
                  : "border-slate-100 bg-slate-50 hover:border-purple-200"
              }`}>
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl flex-shrink-0">
                🏍️
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 text-sm truncate">{b.bikeName}</div>
                <div className="text-xs text-slate-400">
                  {b.year}{b.color ? ` • ${b.color}` : ""}
                  {b.registrationNumber ? ` • ${b.registrationNumber}` : ""}
                </div>
              </div>
              {selected?._id === b._id && (
                <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[10px] font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Service Items */}
      {selected && (
        <Card title="Service Items" emoji="🔧" accent="purple">
          <div className="flex gap-2">
            <input className={`${inp()} flex-[2]`} value={svcName} onChange={e => setSvcName(e.target.value)}
              placeholder="Item name (Engine oil, Tyre...)"
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSvc())} />
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
              <input className={`${inp()} pl-7`} type="number" value={svcCost} onChange={e => setSvcCost(e.target.value)} placeholder="Cost" />
            </div>
            <button type="button" onClick={addSvc} className="px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl font-bold text-sm transition-colors">+</button>
          </div>

          {svcItems.length > 0 && (
            <div className="border-2 border-slate-100 rounded-2xl overflow-hidden">
              {svcItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0 bg-white">
                  <span className="text-sm text-slate-700 font-medium">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-600">₹{item.cost.toLocaleString("en-IN")}</span>
                    <button type="button" onClick={() => removeSvc(i)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="px-4 py-2.5 bg-purple-50 flex justify-between items-center">
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">Total</span>
                <span className="font-bold text-purple-700">₹{svcItems.reduce((s, i) => s + i.cost, 0).toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Total Cost (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input className={`${inp()} pl-8`} type="number" value={svcTotal} onChange={e => setSvcTotal(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Notes</label>
              <input className={inp()} value={svcNotes} onChange={e => setSvcNotes(e.target.value)} placeholder="Optional..." />
            </div>
          </div>
        </Card>
      )}

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-3.5 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-colors">
          <X size={16} /> Cancel
        </button>
        <button type="submit" disabled={saving || !selected}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-purple-500 hover:bg-purple-600 active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-purple-200">
          {saving ? <Spinner size="sm" /> : <><Save size={16} /> Service Save Karo</>}
        </button>
      </div>
    </form>
  );
}
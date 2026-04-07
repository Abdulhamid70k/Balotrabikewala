import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchItems, createItem, deleteItem, selectItems, selectItemsLoading } from "../features/items/itemSlice";
import { Pencil, Trash2, Plus, Bike } from "lucide-react";
import { Spinner, Card, SectionHeader } from "../components/UI";
import toast from "react-hot-toast";

export default function ItemsMaster() {
  const dispatch = useDispatch();
  const items    = useSelector(selectItems);
  const loading  = useSelector(selectItemsLoading);

  const [form,    setForm]    = useState({ name: "", make: "", brand: "" });
  const [search,  setSearch]  = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    dispatch(fetchItems());
    // Header button event
    const handler = () => setShowAdd(true);
    document.addEventListener("openAddItem", handler);
    return () => document.removeEventListener("openAddItem", handler);
  }, [dispatch]);

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.make?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Bike name zaroori hai"); return; }
    setSaving(true);
    const r = await dispatch(createItem(form));
    if (!r.error) {
      toast.success("Item add ho gaya!");
      setForm({ name: "", make: "", brand: "" });
      setShowAdd(false);
    } else {
      toast.error(r.payload || "Error aaya");
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Is item ko delete karna chahte ho?")) return;
    const r = await dispatch(deleteItem(id));
    if (!r.error) toast.success("Item delete ho gaya");
    else toast.error("Delete nahi ho saka");
  };

  return (
    <div className="space-y-4">
      {/* Add Form */}
      {showAdd && (
        <Card>
          <SectionHeader title="Naya Bike Item Add Karo" />
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Bike Name *</label>
                <input
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-50"
                  placeholder="e.g. Splendor Plus"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Make / Model</label>
                <input
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-50"
                  placeholder="e.g. Hero Splendor"
                  value={form.make}
                  onChange={(e) => setForm({ ...form, make: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Brand</label>
                <input
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-50"
                  placeholder="e.g. Hero, Honda, Bajaj"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowAdd(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60">
                {saving ? <Spinner size="sm" /> : <><Plus size={15} /> Save Item</>}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Search + Table */}
      <Card padding={false}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display font-bold text-slate-900 text-base">Items Master</h2>
            <p className="text-xs text-slate-400 mt-0.5">{items.length} items registered</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-400 w-44"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {!showAdd && (
              <button onClick={() => setShowAdd(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors">
                <Plus size={15} /> Add
              </button>
            )}
          </div>
        </div>

        {loading ? <Spinner center /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Bike Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Make</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Brand</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                    <Bike size={32} className="mx-auto mb-2 text-slate-200" />
                    Koi item nahi mila. Pehle item add karo.
                  </td></tr>
                ) : filtered.map((item, i) => (
                  <tr key={item._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="px-4 py-3 text-slate-500">{item.make || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{item.brand || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(item._id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
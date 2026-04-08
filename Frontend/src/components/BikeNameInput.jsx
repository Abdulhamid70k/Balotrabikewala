import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchItems, createItem, selectItems } from "../features/items/itemSlice";
import { Search, Plus, Check } from "lucide-react";

export default function BikeNameInput({ value, onChange, placeholder = "Bike name search karo..." }) {
  const dispatch = useDispatch();
  const allItems = useSelector(selectItems);
  const [query,   setQuery]   = useState(value || "");
  const [open,    setOpen]    = useState(false);
  const [adding,  setAdding]  = useState(false);
  const [newName, setNewName] = useState("");
  const [newMake, setNewMake] = useState("");
  const ref = useRef();

  useEffect(() => { dispatch(fetchItems()); }, [dispatch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = (allItems || []).filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.make?.toLowerCase().includes(query.toLowerCase()) ||
    item.brand?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  const handleSelect = (item) => {
    setQuery(item.name);
    setOpen(false);
    onChange({ bikeName: item.name, bikeMake: item.make || "", bikeBrand: item.brand || "", item: item._id });
  };

  const handleAddNew = async () => {
    if (!newName.trim()) return;
    const result = await dispatch(createItem({ name: newName.trim(), make: newMake.trim() }));
    if (!result.error) {
      handleSelect(result.payload);
      setAdding(false);
      setNewName(""); setNewMake("");
    }
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <button key={item._id} type="button" onClick={() => handleSelect(item)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-orange-50 transition-colors text-left">
                <div>
                  <div className="text-sm font-semibold text-slate-800">{item.name}</div>
                  {item.make && <div className="text-xs text-slate-400">{item.make} {item.brand ? `• ${item.brand}` : ""}</div>}
                </div>
                {query === item.name && <Check size={14} className="text-orange-500" />}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-slate-400">
              "{query}" nahi mila
            </div>
          )}

          {/* Add new option */}
          {!adding ? (
            <button type="button" onClick={() => { setAdding(true); setNewName(query); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-orange-500 hover:bg-orange-50 border-t border-slate-100 text-sm font-semibold transition-colors">
              <Plus size={15} /> Naya item add karo
            </button>
          ) : (
            <div className="p-3 border-t border-slate-100 space-y-2">
              <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-orange-400"
                placeholder="Bike name *" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
              <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-orange-400"
                placeholder="Make (e.g. Splendor Plus)" value={newMake} onChange={(e) => setNewMake(e.target.value)} />
              <div className="flex gap-2">
                <button type="button" onClick={handleAddNew}
                  className="flex-1 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors">
                  Add
                </button>
                <button type="button" onClick={() => setAdding(false)}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
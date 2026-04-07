// AdminUsers.jsx
import { useEffect, useState } from "react";
import { UserCheck, UserX, Users } from "lucide-react";
import api from "../services/api";
import { RoleBadge, Spinner, Card, SectionHeader } from "../components/UI";
import toast from "react-hot-toast";

export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/users");
      setUsers(data.data);
    } catch { toast.error("Users load nahi hue"); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (id) => {
    try {
      const { data } = await api.patch(`/users/${id}/toggle`);
      setUsers((p) => p.map((u) => u._id === id ? { ...u, isActive: data.data.isActive } : u));
      toast.success(data.message);
    } catch { toast.error("Update nahi ho saka"); }
  };

  if (loading) return <Spinner center size="lg" />;

  return (
    <Card padding={false}>
      <div className="p-5 border-b border-slate-100">
        <SectionHeader title={`Users (${users.length})`} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["User","Role","Joined","Status","Action"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-slate-800">{u.name}</div>
                  <div className="text-xs text-slate-400">{u.email}</div>
                </td>
                <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                <td className="px-5 py-3.5 text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-5 py-3.5">
                  <div className={`flex items-center gap-1.5 text-xs font-bold ${u.isActive ? "text-green-600" : "text-red-400"}`}>
                    {u.isActive ? <UserCheck size={13} /> : <UserX size={13} />}
                    {u.isActive ? "Active" : "Inactive"}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <button onClick={() => toggle(u._id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      u.isActive ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}>
                    {u.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
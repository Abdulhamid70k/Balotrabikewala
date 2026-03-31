// ─── AdminUsers.jsx ──────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import api from "../services/api";
import { RoleBadge, Spinner, Card, SectionHeader } from "../components/UI";
import toast from "react-hot-toast";
import styles from "./AdminUsers.module.css";

export function AdminUsers() {
  const [users, setUsers]     = useState([]);
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
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isActive: data.data.isActive } : u));
      toast.success(data.message);
    } catch { toast.error("Update nahi ho saka"); }
  };

  if (loading) return <Spinner center size="lg" />;

  return (
    <div>
      <Card>
        <SectionHeader title={`👥 All Users (${users.length})`} />
        <div className={styles.table}>
          <div className={styles.head}>
            <span>User</span><span>Role</span><span>Joined</span><span>Status</span><span>Action</span>
          </div>
          {users.map((u) => (
            <div key={u._id} className={styles.row}>
              <div>
                <div className={styles.name}>{u.name}</div>
                <div className={styles.email}>{u.email}</div>
              </div>
              <RoleBadge role={u.role} />
              <span className={styles.date}>{new Date(u.createdAt).toLocaleDateString("en-IN")}</span>
              <span className={`${styles.status} ${u.isActive ? styles.active : styles.inactive}`}>
                {u.isActive ? "Active" : "Inactive"}
              </span>
              <button
                className={`${styles.toggleBtn} ${u.isActive ? styles.deactivate : styles.activate}`}
                onClick={() => toggle(u._id)}
              >
                {u.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default AdminUsers;
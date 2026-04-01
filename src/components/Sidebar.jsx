import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser, selectCurrentUser, selectIsAdmin } from "../features/auth/authSlice";
import toast from "react-hot-toast";
import styles from "./Sidebar.module.css";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/stock",     label: "Stock",     icon: "🏍️" },
  { to: "/reports",   label: "Reports",   icon: "📋" },
];

export default function Sidebar({ open, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const isAdmin = useSelector(selectIsAdmin);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <aside className={`${styles.sidebar} ${open ? styles.open : ""}`}>
      {/* Brand */}
      <div className={styles.brand}>
        <span className={styles.brandIcon}>🏍️</span>
        <div>
          <div className={styles.brandName}>BikeResell</div>
          <div className={styles.brandSub}>Pro Manager</div>
        </div>
      </div>

      {/* User info */}
      <div className={styles.userCard}>
        <div className={styles.avatar}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{user?.name}</div>
          <span className={`${styles.roleBadge} ${isAdmin ? styles.admin : styles.user}`}>
            {isAdmin ? "Admin" : "User"}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <p className={styles.navLabel}>Main Menu</p>
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ""}`
            }
          >
            <span className={styles.navIcon}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <p className={styles.navLabel} style={{ marginTop: 16 }}>Admin</p>
            <NavLink
              to="/admin/users"
              onClick={onClose}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ""}`
              }
            >
              <span className={styles.navIcon}>👥</span>
              <span>Manage Users</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Logout */}
      <button className={styles.logoutBtn} onClick={handleLogout}>
        <span>🚪</span>
        <span>Logout</span>
      </button>
    </aside>
  );
}
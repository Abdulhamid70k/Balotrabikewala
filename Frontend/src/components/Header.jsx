import { useLocation, Link } from "react-router-dom";
import styles from "./Header.module.css";

const PAGE_TITLES = {
  "/dashboard":    { title: "Dashboard",       sub: "Business overview" },
  "/stock":        { title: "Bike Stock",       sub: "Manage your inventory" },
  "/stock/add":    { title: "Add New Bike",     sub: "Add a bike to your stock" },
  "/reports":      { title: "Reports",          sub: "Profit & loss analysis" },
  "/admin/users":  { title: "Manage Users",     sub: "Admin panel" },
};

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation();
  const isEditPage = pathname.includes("/edit");
  const info = isEditPage
    ? { title: "Edit Bike", sub: "Update bike details" }
    : (PAGE_TITLES[pathname] || { title: "BikeResell Pro", sub: "" });

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuClick} aria-label="Open menu">
          <span /><span /><span />
        </button>
        <div>
          <h1 className={styles.title}>{info.title}</h1>
          {info.sub && <p className={styles.sub}>{info.sub}</p>}
        </div>
      </div>

      <div className={styles.right}>
        {pathname === "/stock" && (
          <Link to="/stock/add" className={styles.addBtn}>
            <span>+</span> Add Bike
          </Link>
        )}
      </div>
    </header>
  );
}
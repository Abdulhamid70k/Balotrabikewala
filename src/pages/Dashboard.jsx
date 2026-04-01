import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchStats, fetchBikes, selectBikeStats, selectBikes } from "../features/bikes/bikesslice";
import { selectCurrentUser } from "../features/auth/authSlice";
import { StatCard, StatusBadge, Spinner, Card, SectionHeader } from "../components/UI";
import styles from "./Dashboard.module.css";

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Dashboard() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const stats = useSelector(selectBikeStats);
  const bikes = useSelector(selectBikes);

  useEffect(() => {
    dispatch(fetchStats());
    dispatch(fetchBikes({ limit: 5, sortBy: "-createdAt" }));
  }, [dispatch]);

  if (!stats) return <Spinner center size="lg" />;

  // Parse status breakdown
  const byStatus = {};
  stats.statusBreakdown?.forEach((s) => { byStatus[s._id] = s; });

  const soldData    = byStatus["sold"]            || {};
  const stockData   = byStatus["in_stock"]        || {};
  const pendingData = byStatus["pending_arrival"] || {};

  const totalProfit =
    (soldData.totalSellPrice || 0) -
    (soldData.totalBuyPrice  || 0) -
    (soldData.totalServiceCost || 0) -
    (soldData.totalRcCharge  || 0);

  const dueBikes = bikes.filter((b) => Number(b.sale?.cash?.amountDue) > 0);
  const totalDue = dueBikes.reduce((s, b) => s + Number(b.sale?.cash?.amountDue || 0), 0);

  return (
    <div className={styles.page}>
      {/* Welcome */}
      <div className={styles.welcome}>
        <h2>Namaste, {user?.name?.split(" ")[0]} 👋</h2>
        <p>Aaj ka business overview dekho</p>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <StatCard icon="💰" label="Total Profit (Sold)"   value={fmt(totalProfit)} color={totalProfit >= 0 ? "success" : "danger"} />
        <StatCard icon="🏍️" label="Stock Mein"             value={`${stockData.count || 0} Bikes`} color="info" />
        <StatCard icon="✅" label="Bech Di"                value={`${soldData.count || 0} Bikes`} color="brand" />
        <StatCard icon="⏳" label="Total Due Baaki"        value={fmt(totalDue)} color="warning" />
      </div>

      <div className={styles.grid2}>
        {/* Monthly Sales */}
        <Card>
          <SectionHeader title="Monthly Sales (Last 6 months)" />
          {!stats.monthly?.length ? (
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Abhi koi sales data nahi.</p>
          ) : (
            <div className={styles.monthlyList}>
              {stats.monthly.map((m) => (
                <div key={`${m._id.year}-${m._id.month}`} className={styles.monthRow}>
                  <div className={styles.monthName}>{MONTHS[m._id.month - 1]} {m._id.year}</div>
                  <div className={styles.monthBars}>
                    <div className={styles.barWrap}>
                      <div className={styles.barLabel}>{m.count} bikes</div>
                      <div className={styles.barTrack}>
                        <div className={styles.barFillBlue} style={{ width: `${Math.min((m.revenue / 200000) * 100, 100)}%` }} />
                      </div>
                      <div className={styles.barValue}>{fmt(m.revenue)}</div>
                    </div>
                    <div className={styles.barWrap}>
                      <div className={styles.barLabel}>Profit</div>
                      <div className={styles.barTrack}>
                        <div
                          className={m.profit >= 0 ? styles.barFillGreen : styles.barFillRed}
                          style={{ width: `${Math.min((Math.abs(m.profit) / 50000) * 100, 100)}%` }}
                        />
                      </div>
                      <div className={styles.barValue} style={{ color: m.profit >= 0 ? "var(--success)" : "var(--danger)" }}>
                        {fmt(m.profit)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Info Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Pending Arrival */}
          {pendingData.count > 0 && (
            <Card>
              <SectionHeader title={`⏳ Aani Baaki (${pendingData.count})`} />
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                {pendingData.count} bike(s) purchase ki hain lekin abhi aayi nahi hain.
              </p>
              <Link to="/stock?status=pending_arrival" className={styles.viewLink}>Stock dekho →</Link>
            </Card>
          )}

          {/* Due Payments */}
          <Card>
            <SectionHeader title="🔴 Due Payments" />
            {dueBikes.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>✅ Koi due payment nahi!</p>
            ) : (
              <>
                <div className={styles.dueList}>
                  {dueBikes.slice(0, 3).map((b) => (
                    <Link to={`/stock/${b._id}`} key={b._id} className={styles.dueItem}>
                      <div>
                        <div className={styles.dueName}>{b.model}</div>
                        {b.sale?.cash?.dueDate && (
                          <div className={styles.dueDate}>
                            Due: {new Date(b.sale.cash.dueDate).toLocaleDateString("en-IN")}
                          </div>
                        )}
                      </div>
                      <div className={styles.dueAmount}>{fmt(b.sale?.cash?.amountDue)}</div>
                    </Link>
                  ))}
                </div>
                {dueBikes.length > 3 && (
                  <Link to="/stock" className={styles.viewLink}>+{dueBikes.length - 3} aur →</Link>
                )}
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Recent Stock */}
      <Card style={{ marginTop: 0 }}>
        <SectionHeader title="Recent Stock">
          <Link to="/stock" className={styles.viewLink}>Sab dekho →</Link>
        </SectionHeader>
        <div className={styles.recentTable}>
          <div className={styles.tableHead}>
            <span>Model</span><span>Status</span><span>Buy Price</span><span>Sell Price</span><span>Profit</span>
          </div>
          {bikes.map((b) => {
            const p = b.status === "sold"
              ? (b.sale?.sellPrice || 0) - (b.purchase?.buyPrice || 0) - (b.service?.totalCost || 0) - (b.rc?.charge || 0)
              : null;
            return (
              <Link to={`/stock/${b._id}`} key={b._id} className={styles.tableRow}>
                <span className={styles.modelCell}>
                  <span className={styles.modelName}>{b.model}</span>
                  <span className={styles.modelYear}>{b.year || ""}</span>
                </span>
                <StatusBadge status={b.status} />
                <span>{fmt(b.purchase?.buyPrice)}</span>
                <span>{b.sale?.sellPrice ? fmt(b.sale.sellPrice) : "—"}</span>
                <span style={{ color: p === null ? "var(--text-muted)" : p >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
                  {p === null ? "—" : fmt(p)}
                </span>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStats, fetchBikes, selectBikeStats, selectBikes } from "../features/bikes/bikesslice";
import { Spinner, Card, SectionHeader } from "../components/UI";
import styles from "./Reports.module.css";

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Reports() {
  const dispatch = useDispatch();
  const stats = useSelector(selectBikeStats);
  const bikes = useSelector(selectBikes);

  useEffect(() => {
    dispatch(fetchStats());
    dispatch(fetchBikes({ limit: 100, status: "sold", sortBy: "-sale.sellDate" }));
  }, [dispatch]);

  if (!stats) return <Spinner center size="lg" />;

  const byStatus = {};
  stats.statusBreakdown?.forEach((s) => { byStatus[s._id] = s; });
  const sold = byStatus["sold"] || {};

  const totalProfit =
    (sold.totalSellPrice || 0) - (sold.totalBuyPrice || 0) -
    (sold.totalServiceCost || 0) - (sold.totalRcCharge || 0);

  const soldBikes = bikes.filter((b) => b.status === "sold");
  const bikeProfits = soldBikes.map((b) => ({
    ...b,
    profit:
      (b.sale?.sellPrice || 0) - (b.purchase?.buyPrice || 0) -
      (b.service?.totalCost || 0) - (b.rc?.charge || 0),
  }));

  const maxProfit = Math.max(...bikeProfits.map((b) => Math.abs(b.profit)), 1);

  return (
    <div className={styles.page}>

      {/* ── Overall Summary ──────────────────────────────────── */}
      <div className={styles.summaryGrid}>
        {[
          { label: "Total Revenue",      value: fmt(sold.totalSellPrice),  icon: "💰", color: "brand" },
          { label: "Total Buy Cost",      value: fmt(sold.totalBuyPrice),   icon: "🛒", color: "info" },
          { label: "Total Service Cost",  value: fmt(sold.totalServiceCost),icon: "🔧", color: "warning" },
          { label: "Net Profit/Loss",     value: fmt(totalProfit),          icon: totalProfit >= 0 ? "📈" : "📉", color: totalProfit >= 0 ? "success" : "danger" },
        ].map((s) => (
          <div key={s.label} className={`${styles.summCard} ${styles[s.color]}`}>
            <span className={styles.summIcon}>{s.icon}</span>
            <div className={styles.summValue}>{s.value}</div>
            <div className={styles.summLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Monthly Chart ─────────────────────────────────────── */}
      {stats.monthly?.length > 0 && (
        <Card>
          <SectionHeader title="📅 Monthly Performance" />
          <div className={styles.chartArea}>
            {stats.monthly.map((m) => {
              const maxRev = Math.max(...stats.monthly.map((x) => x.revenue), 1);
              return (
                <div key={`${m._id.year}-${m._id.month}`} className={styles.chartCol}>
                  <div className={styles.chartBars}>
                    <div className={styles.barRevWrap} title={`Revenue: ${fmt(m.revenue)}`}>
                      <div className={styles.barRev} style={{ height: `${(m.revenue / maxRev) * 100}%` }} />
                    </div>
                    <div className={styles.barProfWrap} title={`Profit: ${fmt(m.profit)}`}>
                      <div
                        className={m.profit >= 0 ? styles.barProfit : styles.barLoss}
                        style={{ height: `${(Math.abs(m.profit) / maxRev) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className={styles.chartLabel}>{MONTHS[m._id.month - 1]}</div>
                  <div className={styles.chartCount}>{m.count}</div>
                </div>
              );
            })}
          </div>
          <div className={styles.chartLegend}>
            <span className={styles.legBlue}>Revenue</span>
            <span className={styles.legGreen}>Profit</span>
          </div>

          {/* Monthly Table */}
          <div className={styles.monthTable}>
            <div className={styles.monthHead}>
              <span>Month</span><span>Bikes</span><span>Revenue</span><span>Profit/Loss</span>
            </div>
            {[...stats.monthly].reverse().map((m) => (
              <div key={`t-${m._id.year}-${m._id.month}`} className={styles.monthRow}>
                <span className={styles.monthName}>{MONTHS[m._id.month - 1]} {m._id.year}</span>
                <span>{m.count}</span>
                <span>{fmt(m.revenue)}</span>
                <span style={{ color: m.profit >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 700 }}>
                  {fmt(m.profit)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Individual Bike P&L ────────────────────────────────── */}
      <Card>
        <SectionHeader title="📋 Individual Bike Profit/Loss">
          <button className={styles.printBtn} onClick={() => window.print()}>🖨️ Print Report</button>
        </SectionHeader>

        {soldBikes.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Abhi koi bike nahi bachi.</p>
        ) : (
          <div className={styles.bikeTable}>
            <div className={styles.bikeHead}>
              <span>Bike</span><span>Buy</span><span>Service</span><span>Sell</span><span>Profit</span><span>Bar</span>
            </div>
            {bikeProfits.map((b) => (
              <div key={b._id} className={styles.bikeRow}>
                <div>
                  <div className={styles.bikeName}>{b.model}</div>
                  <div className={styles.bikeSub}>{b.year} {b.purchase?.buyFrom ? `• ${b.purchase.buyFrom}` : ""}</div>
                </div>
                <span>{fmt(b.purchase?.buyPrice)}</span>
                <span>{fmt(b.service?.totalCost)}</span>
                <span>{fmt(b.sale?.sellPrice)}</span>
                <span style={{ color: b.profit >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 700 }}>
                  {fmt(b.profit)}
                </span>
                <div className={styles.miniBarTrack}>
                  <div
                    className={b.profit >= 0 ? styles.miniBarPos : styles.miniBarNeg}
                    style={{ width: `${(Math.abs(b.profit) / maxProfit) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchStats, fetchBikes, selectBikeStats, selectBikes } from "../features/bikes/bikesSlice";
import { selectCurrentUser } from "../features/auth/authSlice";
import { StatCard, StatusBadge, Spinner, Card, SectionHeader } from "../components/UI";

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Dashboard() {
  const dispatch = useDispatch();
  const user  = useSelector(selectCurrentUser);
  const stats = useSelector(selectBikeStats);
  const bikes = useSelector(selectBikes);

  useEffect(() => {
    dispatch(fetchStats());
    dispatch(fetchBikes({ limit: 5, sortBy: "-createdAt" }));
  }, [dispatch]);

  if (!stats) return <Spinner center size="lg" />;

  const byStatus = {};
  stats.statusBreakdown?.forEach((s) => { byStatus[s._id] = s; });
  const sold    = byStatus["sold"]            || {};
  const stock   = byStatus["in_stock"]        || {};
  const pending = byStatus["pending_arrival"] || {};

  const totalProfit =
    (sold.totalSellPrice   || 0) - (sold.totalBuyPrice     || 0) -
    (sold.totalServiceCost || 0) - (sold.totalRcCharge     || 0);

  const dueBikes = bikes.filter((b) => Number(b.sale?.cash?.amountDue) > 0);
  const totalDue = dueBikes.reduce((s, b) => s + Number(b.sale?.cash?.amountDue || 0), 0);

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div>
        <h2 className="font-display font-bold text-2xl text-slate-900">
          Namaste, {user?.name?.split(" ")[0]} 👋
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">Aaj ka business overview dekho</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💰" label="Total Profit"  value={fmt(totalProfit)}          color={totalProfit >= 0 ? "success" : "danger"} />
        <StatCard icon="🏍️" label="Stock Mein"    value={`${stock.count   || 0} Bikes`} color="info" />
        <StatCard icon="✅" label="Bech Di"        value={`${sold.count    || 0} Bikes`} color="brand" />
        <StatCard icon="⏳" label="Due Baaki"      value={fmt(totalDue)}             color="warning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Monthly summary */}
        <Card>
          <SectionHeader title="Monthly Sales" />
          {!stats.monthly?.length ? (
            <p className="text-sm text-slate-400">Abhi koi data nahi.</p>
          ) : (
            <div className="space-y-4">
              {stats.monthly.map((m) => (
                <div key={`${m._id.year}-${m._id.month}`} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-400 w-8 shrink-0">
                    {MONTHS[m._id.month - 1]}
                  </span>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min((m.revenue / 200000) * 100, 100)}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 w-20 text-right">{fmt(m.revenue)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${m.profit >= 0 ? "bg-green-400" : "bg-red-400"}`}
                          style={{ width: `${Math.min((Math.abs(m.profit) / 50000) * 100, 100)}%` }} />
                      </div>
                      <span className={`text-xs font-semibold w-20 text-right ${m.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {fmt(m.profit)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-300 w-6 text-right">{m.count}x</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          {/* Aani Baaki */}
          {pending.count > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-500 font-bold text-sm">⏳ Aani Baaki ({pending.count})</span>
              </div>
              <p className="text-xs text-slate-500">{pending.count} bike(s) order ki hain, aayi nahi hain.</p>
              <Link to="/stock?status=pending_arrival" className="text-xs text-orange-500 font-semibold mt-2 inline-block hover:underline">
                Stock dekho →
              </Link>
            </Card>
          )}

          {/* Due Payments */}
          <Card>
            <SectionHeader title="🔴 Due Payments" />
            {dueBikes.length === 0 ? (
              <p className="text-sm text-slate-400">✅ Koi due payment nahi!</p>
            ) : (
              <div className="space-y-2">
                {dueBikes.slice(0, 4).map((b) => (
                  <Link key={b._id} to={`/stock/${b._id}`}
                    className="flex justify-between items-center p-3 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{b.model}</div>
                      {b.sale?.cash?.dueDate && (
                        <div className="text-xs text-red-500 mt-0.5">
                          Due: {new Date(b.sale.cash.dueDate).toLocaleDateString("en-IN")}
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-bold text-red-500">{fmt(b.sale?.cash?.amountDue)}</div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent stock table */}
      <Card padding={false}>
        <div className="p-5 pb-0">
          <SectionHeader title="Recent Stock">
            <Link to="/stock" className="text-xs text-orange-500 font-semibold hover:underline">Sab dekho →</Link>
          </SectionHeader>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["Model","Status","Buy Price","Sell Price","Profit"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bikes.map((b) => {
                const p = b.status === "sold"
                  ? (b.sale?.sellPrice || 0) - (b.purchase?.buyPrice || 0)
                    - (b.service?.totalCost || 0) - (b.rc?.charge || 0)
                  : null;
                return (
                  <tr key={b._id}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/stock/${b._id}`}>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">{b.model}</div>
                      <div className="text-xs text-slate-400">{b.year || ""}</div>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={b.status} /></td>
                    <td className="px-5 py-3.5 text-slate-600">{fmt(b.purchase?.buyPrice)}</td>
                    <td className="px-5 py-3.5 text-slate-600">{b.sale?.sellPrice ? fmt(b.sale.sellPrice) : "—"}</td>
                    <td className={`px-5 py-3.5 font-bold ${p === null ? "text-slate-300" : p >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {p === null ? "—" : fmt(p)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
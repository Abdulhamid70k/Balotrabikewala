import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  TrendingUp, Bike, CheckCircle2, AlertCircle,
  Clock, ArrowRight, Plus,
} from "lucide-react";
import { fetchStats, fetchBikes, selectBikeStats, selectBikes } from "../features/bikes/bikeSlice";
import { selectCurrentUser } from "../features/auth/authSlice";
import { Spinner, Card, SectionHeader, StatusBadge } from "../components/UI";

const fmt   = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const fmtD  = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function StatCard({ label, value, Icon, color, sub }) {
  const colors = {
    orange: "border-t-orange-500 [&_.icon]:bg-orange-100 [&_.icon]:text-orange-600",
    blue:   "border-t-blue-500   [&_.icon]:bg-blue-100   [&_.icon]:text-blue-600",
    green:  "border-t-green-500  [&_.icon]:bg-green-100  [&_.icon]:text-green-600",
    red:    "border-t-red-500    [&_.icon]:bg-red-100    [&_.icon]:text-red-600",
    amber:  "border-t-amber-500  [&_.icon]:bg-amber-100  [&_.icon]:text-amber-600",
  };
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-4 border-t-4 ${colors[color] || colors.orange} hover:-translate-y-0.5 hover:shadow-md transition-all`}>
      <div className="flex items-start justify-between mb-3">
        <div className="icon p-2 rounded-xl">
          <Icon size={20} />
        </div>
      </div>
      <div className="font-display font-bold text-2xl text-slate-900 leading-none">{value}</div>
      <div className="text-xs text-slate-400 font-medium mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-300 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const user  = useSelector(selectCurrentUser);
  const stats = useSelector(selectBikeStats);
  const bikes = useSelector(selectBikes);

  useEffect(() => {
    dispatch(fetchStats());
    dispatch(fetchBikes({ limit: 6, sortBy: "-createdAt" }));
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-900">
            Namaste, {user?.name?.split(" ")[0]} 👋
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Aaj ka business overview</p>
        </div>
        <Link to="/stock/add"
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <Plus size={16} /> Add Bike
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard Icon={TrendingUp} label="Total Profit"  value={fmt(totalProfit)}         color={totalProfit >= 0 ? "green" : "red"} />
        <StatCard Icon={Bike}       label="Stock Mein"    value={`${stock.count   || 0}`}  color="blue"   sub="bikes available" />
        <StatCard Icon={CheckCircle2} label="Bech Di"     value={`${sold.count    || 0}`}  color="orange" sub="bikes sold" />
        <StatCard Icon={AlertCircle}  label="Due Baaki"   value={fmt(totalDue)}            color="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Monthly bars */}
        <Card className="lg:col-span-2">
          <SectionHeader title="Monthly Sales" />
          {!stats.monthly?.length ? (
            <p className="text-sm text-slate-400 py-4">Abhi koi data nahi.</p>
          ) : (
            <div className="space-y-3">
              {stats.monthly.map((m) => {
                const maxRev = Math.max(...stats.monthly.map((x) => x.revenue), 1);
                return (
                  <div key={`${m._id.year}-${m._id.month}`} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-400 w-8 flex-shrink-0">
                      {MONTHS[m._id.month - 1]}
                    </span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full transition-all"
                            style={{ width: `${Math.min((m.revenue / maxRev) * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-20 text-right font-medium">{fmt(m.revenue)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${m.profit >= 0 ? "bg-green-400" : "bg-red-400"}`}
                            style={{ width: `${Math.min((Math.abs(m.profit) / maxRev) * 100, 100)}%` }} />
                        </div>
                        <span className={`text-xs font-bold w-20 text-right ${m.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {fmt(m.profit)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-300 w-6 text-right">{m.count}x</span>
                  </div>
                );
              })}
            </div>
          )}
          <Link to="/reports/monthly" className="flex items-center gap-1 text-xs text-orange-500 font-semibold mt-4 hover:underline">
            Full report dekho <ArrowRight size={12} />
          </Link>
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          {/* Pending */}
          {pending.count > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={15} className="text-amber-500" />
                <span className="text-sm font-bold text-amber-700">Aani Baaki ({pending.count})</span>
              </div>
              <p className="text-xs text-slate-500">{pending.count} bike(s) abhi aayi nahi hain.</p>
              <Link to="/stock?status=pending_arrival"
                className="flex items-center gap-1 text-xs text-orange-500 font-semibold mt-2 hover:underline">
                Dekho <ArrowRight size={11} />
              </Link>
            </Card>
          )}

          {/* Due payments */}
          <Card>
            <SectionHeader title="Due Payments" />
            {dueBikes.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <CheckCircle2 size={16} /> Koi due nahi!
              </div>
            ) : (
              <div className="space-y-2">
                {dueBikes.slice(0, 3).map((b) => {
                  const overdue = b.sale?.cash?.dueDate && new Date(b.sale.cash.dueDate) < new Date();
                  return (
                    <Link key={b._id} to={`/stock/${b._id}`}
                      className="flex justify-between items-center p-2.5 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors">
                      <div>
                        <div className="text-xs font-bold text-slate-800">{b.bikeName}</div>
                        <div className="text-xs text-slate-500">{b.sale?.customer?.name || "—"}</div>
                        {overdue && <span className="text-[10px] text-red-600 font-bold">OVERDUE</span>}
                      </div>
                      <div className="text-sm font-bold text-red-500">{fmt(b.sale?.cash?.amountDue)}</div>
                    </Link>
                  );
                })}
                <Link to="/reports/due"
                  className="flex items-center gap-1 text-xs text-orange-500 font-semibold mt-1 hover:underline">
                  Sab due dekho <ArrowRight size={11} />
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent stock table */}
      <Card padding={false}>
        <div className="p-4 border-b border-slate-100">
          <SectionHeader title="Recent Entries">
            <Link to="/stock" className="text-xs text-orange-500 font-semibold hover:underline flex items-center gap-1">
              Sab dekho <ArrowRight size={12} />
            </Link>
          </SectionHeader>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Bike","Status","Buy Price","Sell Price","Profit/Loss"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bikes.map((b) => {
                const p = b.status === "sold"
                  ? (b.sale?.sellPrice||0) - (b.purchase?.buyPrice||0) - (b.service?.totalCost||0) - (b.rc?.charge||0)
                  : null;
                return (
                  <tr key={b._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/stock/${b._id}`}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 text-sm">{b.bikeName}</div>
                      <div className="text-xs text-slate-400">{b.year}{b.bikeMake ? ` • ${b.bikeMake}` : ""}</div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 text-slate-600 text-sm">{fmt(b.purchase?.buyPrice)}</td>
                    <td className="px-4 py-3 text-slate-600 text-sm">{b.sale?.sellPrice ? fmt(b.sale.sellPrice) : "—"}</td>
                    <td className={`px-4 py-3 text-sm font-bold ${p === null ? "text-slate-300" : p >= 0 ? "text-green-600" : "text-red-500"}`}>
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
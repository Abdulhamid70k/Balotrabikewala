// Reports.jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStats, fetchBikes, selectBikeStats, selectBikes } from "../features/bikes/bikeSlice";
import { Spinner, Card, SectionHeader } from "../components/UI";

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
    profit: (b.sale?.sellPrice || 0) - (b.purchase?.buyPrice || 0) - (b.service?.totalCost || 0) - (b.rc?.charge || 0),
  }));
  const maxProfit = Math.max(...bikeProfits.map((b) => Math.abs(b.profit)), 1);

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue",     value: fmt(sold.totalSellPrice),  icon: "💰", color: "brand" },
          { label: "Total Buy Cost",    value: fmt(sold.totalBuyPrice),   icon: "🛒", color: "info" },
          { label: "Total Service",     value: fmt(sold.totalServiceCost),icon: "🔧", color: "warning" },
          { label: "Net Profit/Loss",   value: fmt(totalProfit),          icon: totalProfit >= 0 ? "📈" : "📉", color: totalProfit >= 0 ? "success" : "danger" },
        ].map((s) => {
          const borderColor = { brand: "border-t-orange-500", info: "border-t-blue-500", warning: "border-t-amber-500", success: "border-t-green-500", danger: "border-t-red-500" }[s.color];
          return (
            <div key={s.label} className={`bg-white rounded-2xl border border-slate-100 shadow-card p-5 border-t-4 ${borderColor}`}>
              <span className="text-2xl block mb-2">{s.icon}</span>
              <div className="font-display font-bold text-2xl text-slate-900 leading-none mb-1">{s.value}</div>
              <div className="text-xs text-slate-400 font-medium">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Monthly Performance */}
      {stats.monthly?.length > 0 && (
        <Card>
          <SectionHeader title="📅 Monthly Performance" />

          {/* Bar chart */}
          <div className="flex items-end gap-3 h-36 mb-4 overflow-x-auto pb-1">
            {stats.monthly.map((m) => {
              const maxRev = Math.max(...stats.monthly.map((x) => x.revenue), 1);
              return (
                <div key={`${m._id.year}-${m._id.month}`} className="flex flex-col items-center gap-1 min-w-[40px] flex-1">
                  <div className="flex items-end gap-1 h-24">
                    <div className="w-4 bg-blue-200 rounded-t transition-all" style={{ height: `${(m.revenue / maxRev) * 96}px` }} title={`Revenue: ${fmt(m.revenue)}`} />
                    <div className={`w-4 rounded-t transition-all ${m.profit >= 0 ? "bg-green-400" : "bg-red-400"}`}
                      style={{ height: `${(Math.abs(m.profit) / maxRev) * 96}px` }} title={`Profit: ${fmt(m.profit)}`} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{MONTHS[m._id.month - 1]}</span>
                  <span className="text-[9px] text-slate-300 bg-slate-100 rounded-full px-1.5">{m.count}</span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 text-xs font-semibold mb-5">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-200" /> Revenue</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-400" /> Profit</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400" /> Loss</span>
          </div>

          {/* Monthly table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Month","Bikes","Revenue","Profit/Loss"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-2 px-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...stats.monthly].reverse().map((m) => (
                  <tr key={`${m._id.year}-${m._id.month}`} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 px-3 font-semibold">{MONTHS[m._id.month - 1]} {m._id.year}</td>
                    <td className="py-3 px-3 text-slate-500">{m.count}</td>
                    <td className="py-3 px-3 text-slate-600">{fmt(m.revenue)}</td>
                    <td className={`py-3 px-3 font-bold ${m.profit >= 0 ? "text-green-600" : "text-red-500"}`}>{fmt(m.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Individual Bike P&L */}
      <Card>
        <SectionHeader title="📋 Individual Bike P&L">
          <button onClick={() => window.print()} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors print:hidden">
            🖨️ Print Report
          </button>
        </SectionHeader>
        {soldBikes.length === 0 ? (
          <p className="text-sm text-slate-400">Abhi koi bike nahi bachi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Bike","Buy","Service","Sell","Profit",""].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-2 px-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bikeProfits.map((b) => (
                  <tr key={b._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{b.model}</div>
                      <div className="text-xs text-slate-400">{b.year}{b.purchase?.buyFrom ? ` • ${b.purchase.buyFrom}` : ""}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{fmt(b.purchase?.buyPrice)}</td>
                    <td className="py-3 px-3 text-slate-600">{fmt(b.service?.totalCost)}</td>
                    <td className="py-3 px-3 text-slate-600">{fmt(b.sale?.sellPrice)}</td>
                    <td className={`py-3 px-3 font-bold ${b.profit >= 0 ? "text-green-600" : "text-red-500"}`}>{fmt(b.profit)}</td>
                    <td className="py-3 px-3">
                      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${b.profit >= 0 ? "bg-green-400" : "bg-red-400"}`}
                          style={{ width: `${(Math.abs(b.profit) / maxProfit) * 100}%` }} />
                      </div>
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
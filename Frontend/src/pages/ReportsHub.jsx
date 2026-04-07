import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  BarChart3, ShoppingCart, Tag, Package,
  Clock, AlertCircle, TrendingUp, Calendar,
  Printer, FileSpreadsheet, ChevronDown,
} from "lucide-react";
import api from "../services/api";
import { Spinner } from "../components/UI";

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const fmtD = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const REPORT_TYPES = [
  { id: "stock",    label: "Stock Report",    Icon: Package,    color: "blue" },
  { id: "purchase", label: "Purchase Report", Icon: ShoppingCart, color: "amber" },
  { id: "sale",     label: "Sale Report",     Icon: Tag,        color: "green" },
  { id: "due",      label: "Due Report",      Icon: AlertCircle, color: "red" },
  { id: "pending",  label: "Pending Arrival", Icon: Clock,      color: "purple" },
  { id: "monthly",  label: "Monthly P&L",     Icon: BarChart3,  color: "teal" },
  { id: "yearly",   label: "Yearly P&L",      Icon: TrendingUp, color: "orange" },
];

const COLOR_MAP = {
  blue:   "bg-blue-50 text-blue-700 border-blue-200",
  amber:  "bg-amber-50 text-amber-700 border-amber-200",
  green:  "bg-green-50 text-green-700 border-green-200",
  red:    "bg-red-50 text-red-700 border-red-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  teal:   "bg-teal-50 text-teal-700 border-teal-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
};

const currentYear = new Date().getFullYear();
const YEARS_LIST   = Array.from({ length: 5 }, (_, i) => currentYear - i);

// ─── Excel export ─────────────────────────────────────────────────
function exportToCSV(data, filename, columns) {
  const header = columns.map((c) => c.label).join(",");
  const rows = data.map((row) =>
    columns.map((c) => {
      const v = c.fn(row);
      return typeof v === "string" && v.includes(",") ? `"${v}"` : v;
    }).join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename + ".csv"; a.click();
  URL.revokeObjectURL(url);
}

// ─── Column definitions per report type ──────────────────────────
const COLUMNS = {
  stock: [
    { label: "Bike Name",    fn: (b) => b.bikeName },
    { label: "Make",         fn: (b) => b.bikeMake || "" },
    { label: "Year",         fn: (b) => b.year || "" },
    { label: "Color",        fn: (b) => b.color || "" },
    { label: "Reg No.",      fn: (b) => b.registrationNumber || "" },
    { label: "Buy From",     fn: (b) => b.purchase?.buyFrom || "" },
    { label: "Buy Price",    fn: (b) => b.purchase?.buyPrice || 0 },
    { label: "Service Cost", fn: (b) => b.service?.totalCost || 0 },
  ],
  purchase: [
    { label: "Voucher No.",  fn: (b) => b.purchase?.voucherNumber || "" },
    { label: "Bike Name",    fn: (b) => b.bikeName },
    { label: "Make",         fn: (b) => b.bikeMake || "" },
    { label: "Year",         fn: (b) => b.year || "" },
    { label: "Reg No.",      fn: (b) => b.registrationNumber || "" },
    { label: "Buy From",     fn: (b) => b.purchase?.buyFrom || "" },
    { label: "Buy Date",     fn: (b) => fmtD(b.purchase?.buyDate) },
    { label: "Buy Price",    fn: (b) => b.purchase?.buyPrice || 0 },
    { label: "Service Cost", fn: (b) => b.service?.totalCost || 0 },
    { label: "RC Charge",    fn: (b) => b.rc?.charge || 0 },
    { label: "Status",       fn: (b) => b.status === "sold" ? "Sold" : b.status === "in_stock" ? "In Stock" : "Pending" },
  ],
  sale: [
    { label: "Sale Voucher", fn: (b) => b.sale?.voucherNumber || "" },
    { label: "Bike Name",    fn: (b) => b.bikeName },
    { label: "Make",         fn: (b) => b.bikeMake || "" },
    { label: "Year",         fn: (b) => b.year || "" },
    { label: "Customer",     fn: (b) => b.sale?.customer?.name || "" },
    { label: "Mobile",       fn: (b) => b.sale?.customer?.mobile || "" },
    { label: "Sell Date",    fn: (b) => fmtD(b.sale?.sellDate) },
    { label: "Buy Price",    fn: (b) => b.purchase?.buyPrice || 0 },
    { label: "Sell Price",   fn: (b) => b.sale?.sellPrice || 0 },
    { label: "Profit",       fn: (b) => (b.sale?.sellPrice||0)-(b.purchase?.buyPrice||0)-(b.service?.totalCost||0)-(b.rc?.charge||0) },
    { label: "Payment",      fn: (b) => b.sale?.paymentType === "finance" ? "Finance" : "Cash" },
    { label: "Due Amount",   fn: (b) => b.sale?.cash?.amountDue || 0 },
  ],
  due: [
    { label: "Customer",     fn: (b) => b.sale?.customer?.name || "" },
    { label: "Mobile",       fn: (b) => b.sale?.customer?.mobile || "" },
    { label: "Address",      fn: (b) => b.sale?.customer?.address || "" },
    { label: "Bike Name",    fn: (b) => b.bikeName },
    { label: "Sell Date",    fn: (b) => fmtD(b.sale?.sellDate) },
    { label: "Sell Price",   fn: (b) => b.sale?.sellPrice || 0 },
    { label: "Paid",         fn: (b) => b.sale?.cash?.amountPaid || 0 },
    { label: "Due Amount",   fn: (b) => b.sale?.cash?.amountDue || 0 },
    { label: "Due Date",     fn: (b) => fmtD(b.sale?.cash?.dueDate) },
    { label: "Due Note",     fn: (b) => b.sale?.cash?.dueNote || "" },
  ],
  pending: [
    { label: "Bike Name",    fn: (b) => b.bikeName },
    { label: "Make",         fn: (b) => b.bikeMake || "" },
    { label: "Year",         fn: (b) => b.year || "" },
    { label: "Buy From",     fn: (b) => b.purchase?.buyFrom || "" },
    { label: "Buy Date",     fn: (b) => fmtD(b.purchase?.buyDate) },
    { label: "Buy Price",    fn: (b) => b.purchase?.buyPrice || 0 },
  ],
  monthly: [
    { label: "Voucher",      fn: (b) => b.sale?.voucherNumber || "" },
    { label: "Bike Name",    fn: (b) => b.bikeName },
    { label: "Customer",     fn: (b) => b.sale?.customer?.name || "" },
    { label: "Mobile",       fn: (b) => b.sale?.customer?.mobile || "" },
    { label: "Sell Date",    fn: (b) => fmtD(b.sale?.sellDate) },
    { label: "Buy Price",    fn: (b) => b.purchase?.buyPrice || 0 },
    { label: "Service",      fn: (b) => b.service?.totalCost || 0 },
    { label: "Sell Price",   fn: (b) => b.sale?.sellPrice || 0 },
    { label: "Profit",       fn: (b) => (b.sale?.sellPrice||0)-(b.purchase?.buyPrice||0)-(b.service?.totalCost||0)-(b.rc?.charge||0) },
  ],
  yearly: [
    { label: "Month",        fn: (b) => fmtD(b.sale?.sellDate)?.split(" ").slice(1).join(" ") || "" },
    { label: "Voucher",      fn: (b) => b.sale?.voucherNumber || "" },
    { label: "Bike Name",    fn: (b) => b.bikeName },
    { label: "Customer",     fn: (b) => b.sale?.customer?.name || "" },
    { label: "Sell Price",   fn: (b) => b.sale?.sellPrice || 0 },
    { label: "Buy Price",    fn: (b) => b.purchase?.buyPrice || 0 },
    { label: "Profit",       fn: (b) => (b.sale?.sellPrice||0)-(b.purchase?.buyPrice||0)-(b.service?.totalCost||0)-(b.rc?.charge||0) },
  ],
};

// ─── Table renderer ──────────────────────────────────────────────
function ReportTable({ data, type }) {
  const cols = COLUMNS[type] || COLUMNS.stock;

  const totals = {};
  ["Buy Price","Sell Price","Service Cost","Service","Profit","RC Charge","Due Amount","Paid"].forEach((k) => {
    const col = cols.find((c) => c.label === k);
    if (col) totals[k] = data.reduce((s, row) => s + Number(col.fn(row) || 0), 0);
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse print-table" id="report-table">
        <thead>
          <tr className="bg-slate-800 text-white print:bg-gray-100 print:text-black">
            <th className="px-3 py-2.5 text-left font-semibold">#</th>
            {cols.map((c) => (
              <th key={c.label} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const profit = (row.sale?.sellPrice||0)-(row.purchase?.buyPrice||0)-(row.service?.totalCost||0)-(row.rc?.charge||0);
            return (
              <tr key={row._id} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-orange-50 transition-colors`}>
                <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                {cols.map((c) => {
                  const v = c.fn(row);
                  const isProfit = c.label === "Profit";
                  const isDue    = c.label === "Due Amount" && Number(v) > 0;
                  return (
                    <td key={c.label} className={`px-3 py-2 ${isProfit ? (Number(v) >= 0 ? "text-green-600 font-bold" : "text-red-500 font-bold") : ""} ${isDue ? "text-red-500 font-semibold" : ""}`}>
                      {typeof v === "number" ? fmt(v) : (v || "—")}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        {Object.keys(totals).length > 0 && (
          <tfoot>
            <tr className="bg-orange-50 border-t-2 border-orange-200 font-bold">
              <td className="px-3 py-2.5 text-orange-700" colSpan={2}>TOTAL ({data.length} bikes)</td>
              {cols.slice(1).map((c) => (
                <td key={c.label} className={`px-3 py-2.5 ${totals[c.label] !== undefined ? "text-orange-700" : ""}`}>
                  {totals[c.label] !== undefined ? fmt(totals[c.label]) : ""}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export default function ReportsHub() {
  const { type: typeParam } = useParams();
  const navigate = useNavigate();

  const [activeType, setActiveType] = useState(typeParam || "stock");
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [filters,    setFilters]    = useState({ from: "", to: "", year: String(currentYear), month: "" });

  const loadReport = async (type = activeType, f = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type });
      if (f.from)  params.append("from",  f.from);
      if (f.to)    params.append("to",    f.to);
      if (type === "monthly" || type === "yearly") {
        if (f.year)  params.append("year",  f.year);
        if (type === "monthly" && f.month) params.append("month", f.month);
      }
      const { data: res } = await api.get(`/bikes/report?${params}`);
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (typeParam) setActiveType(typeParam);
  }, [typeParam]);

  useEffect(() => {
    loadReport(activeType, filters);
  }, [activeType]);

  const handleTypeChange = (t) => {
    setActiveType(t);
    navigate(`/reports/${t}`, { replace: true });
  };

  const handleFilter = (e) => {
    e.preventDefault();
    loadReport(activeType, filters);
  };

  const handlePrint = () => {
    const rpt = REPORT_TYPES.find((r) => r.id === activeType);
    document.title = `${rpt?.label || "Report"} — BikeResell Pro`;
    window.print();
  };

  const handleExcel = () => {
    const cols = COLUMNS[activeType] || COLUMNS.stock;
    const rpt  = REPORT_TYPES.find((r) => r.id === activeType);
    exportToCSV(data, `${rpt?.label || "Report"}_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}`, cols);
  };

  const rptInfo = REPORT_TYPES.find((r) => r.id === activeType);
  const totalProfit = data.reduce((s, b) =>
    s + ((b.sale?.sellPrice||0)-(b.purchase?.buyPrice||0)-(b.service?.totalCost||0)-(b.rc?.charge||0)), 0);
  const totalRevenue = data.reduce((s, b) => s + (b.sale?.sellPrice || 0), 0);
  const totalDue     = data.reduce((s, b) => s + (b.sale?.cash?.amountDue || 0), 0);

  return (
    <div className="space-y-4">
      {/* Report type tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 print:hidden">
        {REPORT_TYPES.map(({ id, label, Icon, color }) => (
          <button key={id} onClick={() => handleTypeChange(id)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all
              ${activeType === id
                ? `${COLOR_MAP[color]} border-current shadow-sm`
                : "bg-white border-slate-200 text-slate-500 hover:border-orange-200 hover:bg-orange-50"}`}>
            <Icon size={18} />
            <span className="text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <form onSubmit={handleFilter} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 print:hidden">
        <div className="flex flex-wrap gap-3 items-end">
          {(activeType === "monthly" || activeType === "yearly") ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Year</label>
                <select className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-400"
                  value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })}>
                  {YEARS_LIST.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {activeType === "monthly" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Month</label>
                  <select className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-400"
                    value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })}>
                    <option value="">All Months</option>
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">From Date</label>
                <input type="date" className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-400"
                  value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">To Date</label>
                <input type="date" className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-400"
                  value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
              </div>
            </>
          )}
          <button type="submit" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors">
            Apply
          </button>
          <button type="button" onClick={() => { setFilters({ from:"",to:"",year:String(currentYear),month:"" }); loadReport(activeType,{ from:"",to:"",year:String(currentYear),month:"" }); }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-colors">
            Reset
          </button>
        </div>
      </form>

      {/* Report header + actions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3 print:hidden">
          <div>
            <h2 className="font-display font-bold text-slate-900 text-base">{rptInfo?.label}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{data.length} records</p>
          </div>

          {/* Summary chips */}
          <div className="flex flex-wrap gap-2">
            {(activeType === "sale" || activeType === "monthly" || activeType === "yearly") && (
              <>
                <span className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-lg">
                  Revenue: {fmt(totalRevenue)}
                </span>
                <span className={`px-3 py-1.5 border text-xs font-semibold rounded-lg ${totalProfit >= 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>
                  P&L: {fmt(totalProfit)}
                </span>
              </>
            )}
            {activeType === "due" && totalDue > 0 && (
              <span className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg">
                Total Due: {fmt(totalDue)}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
              <Printer size={15} /> Print
            </button>
            <button onClick={handleExcel}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors">
              <FileSpreadsheet size={15} /> Excel
            </button>
          </div>
        </div>

        {/* Print header (only visible in print) */}
        <div className="hidden print:block p-4 border-b">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-lg font-bold text-orange-600">🏍️ BikeResell Pro</div>
              <div className="text-sm font-semibold">{rptInfo?.label}</div>
            </div>
            <div className="text-xs text-gray-500">
              Print Date: {new Date().toLocaleDateString("en-IN")}<br />
              Total Records: {data.length}
            </div>
          </div>
        </div>

        {loading ? (
          <Spinner center size="lg" />
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <BarChart3 size={40} className="mb-3 text-slate-200" />
            <p className="text-sm">Is period mein koi data nahi mila</p>
          </div>
        ) : (
          <ReportTable data={data} type={activeType} />
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, EyeOff, Bike, BarChart3, Wrench, IndianRupee } from "lucide-react";
import { loginUser, selectAuthLoading, selectAuthError, clearError } from "../features/auth/authSlice";
import { Spinner } from "../components/UI";
import toast from "react-hot-toast";

const inp = (err) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-slate-50 outline-none transition-all
   focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100
   ${err ? "border-red-400" : "border-slate-200"}`;

export default function Login() {
  const dispatch = useDispatch();
  const loading  = useSelector(selectAuthLoading);
  const error    = useSelector(selectAuthError);

  const [form, setForm] = useState({ username: "", password: "" });
  const [show, setShow] = useState(false);
  const [errs, setErrs] = useState({});

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const validate = () => {
    const e = {};
    if (!form.username) e.username = "Username zaroori hai";
    if (!form.password) e.password = "Password zaroori hai";
    setErrs(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    dispatch(loginUser(form));
  };

  const features = [
    { Icon: Bike,          text: "Purchase & Sale Vouchers" },
    { Icon: BarChart3,     text: "8 Types of Reports" },
    { Icon: IndianRupee,   text: "Profit / Loss Tracking" },
    { Icon: Wrench,        text: "Service Management" },
  ];

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left panel */}
      <div className="hidden md:flex flex-col justify-center bg-slate-900 px-12 py-16">
        <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center mb-6">
          <Bike size={26} className="text-white" />
        </div>
        <h1 className="font-display font-extrabold text-white text-4xl mb-3 leading-tight">
          BikeResell<br />Pro
        </h1>
        <p className="text-slate-400 text-base leading-relaxed mb-8">
          Old bike reselling ka complete business management — kharidna, service, bechna, reports sab ek jagah.
        </p>
        <div className="space-y-3">
          {features.map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-3">
              <Icon size={16} className="text-orange-400 flex-shrink-0" />
              <span className="text-slate-300 text-sm font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center bg-slate-50 px-5 py-12">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="flex items-center gap-3 mb-8 md:hidden">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <Bike size={22} className="text-white" />
            </div>
            <div className="font-display font-bold text-slate-900 text-xl">BikeResell Pro</div>
          </div>

          <h2 className="font-display font-bold text-slate-900 text-2xl mb-1">Welcome!</h2>
          <p className="text-slate-500 text-sm mb-7">Please Login To Your Account</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Username</label>
              <input
                className={inp(errs.username)}
                type="text"
                placeholder="admin username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoComplete="username"
              />
              {errs.username && <p className="text-red-500 text-xs mt-1 font-medium">{errs.username}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Password</label>
              <div className="relative">
                <input
                  className={inp(errs.password)}
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errs.password && <p className="text-red-500 text-xs mt-1 font-medium">{errs.password}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 mt-2">
              {loading ? <Spinner size="sm" /> : "Login "}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
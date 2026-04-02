import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, selectAuthLoading, selectAuthError, clearError } from "../features/auth/authSlice";
import { Spinner } from "../components/UI";
import toast from "react-hot-toast";

export default function Login() {
  const dispatch = useDispatch();
  const loading  = useSelector(selectAuthLoading);
  const error    = useSelector(selectAuthError);

  const [form, setForm]       = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]   = useState({});

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const validate = () => {
    const e = {};
    if (!form.email)                          e.email    = "Email zaroori hai";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email  = "Valid email daalo";
    if (!form.password)                       e.password = "Password zaroori hai";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) dispatch(loginUser(form));
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left panel */}
      <div className="hidden md:flex flex-col justify-center px-12 bg-slate-900">
        <span className="text-5xl mb-5">🏍️</span>
        <h1 className="font-display text-4xl font-extrabold text-white mb-3">BikeResell Pro</h1>
        <p className="text-slate-400 text-base leading-relaxed mb-8">
          Apne old bike business ko smartly manage karo — buying, servicing, selling aur profit tracking sab ek jagah.
        </p>
        <div className="space-y-3">
          {["📊 Real-time Dashboard", "🔧 Service Tracking", "💰 Profit Reports", "🏦 Finance Management"].map(f => (
            <div key={f} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 font-medium">
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-slate-900">Wapas aao! 👋</h2>
            <p className="text-slate-500 text-sm mt-1">Apne account mein login karo</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="aap@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm outline-none transition-all
                  ${errors.email ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"}`}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1 font-medium">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className={`w-full px-4 py-2.5 pr-11 bg-white border rounded-xl text-sm outline-none transition-all
                    ${errors.password ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"}`}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base text-slate-400 hover:text-slate-600">
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1 font-medium">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Spinner size="sm" /> : "Login Karo"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Account nahi hai?{" "}
            <Link to="/register" className="text-orange-500 font-semibold hover:underline">Register karo</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
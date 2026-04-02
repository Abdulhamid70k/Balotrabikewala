import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, selectAuthLoading, selectAuthError, clearError } from "../features/auth/authSlice";
import { Spinner } from "../components/UI";
import toast from "react-hot-toast";

export default function Register() {
  const dispatch = useDispatch();
  const loading  = useSelector(selectAuthLoading);
  const error    = useSelector(selectAuthError);
  const [form, setForm]         = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]     = useState({});

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())                      e.name    = "Naam zaroori hai";
    if (!form.email)                            e.email   = "Email zaroori hai";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email   = "Valid email daalo";
    if (!form.password)                         e.password = "Password zaroori hai";
    else if (form.password.length < 6)          e.password = "Min 6 characters chahiye";
    if (form.password !== form.confirm)         e.confirm  = "Passwords match nahi karte";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (validate()) dispatch(registerUser({ name: form.name, email: form.email, password: form.password }));
  };

  const inputCls = err =>
    `w-full px-4 py-2.5 bg-white border rounded-xl text-sm outline-none transition-all
    ${err ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"}`;

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-center px-12 bg-slate-900">
        <span className="text-5xl mb-5">🏍️</span>
        <h1 className="font-display text-4xl font-extrabold text-white mb-3">BikeResell Pro</h1>
        <p className="text-slate-400 text-base leading-relaxed mb-8">Free mein register karo aur apna bike reselling business organize karna shuru karo.</p>
        <div className="space-y-3">
          {["✅ Free forever", "📱 Mobile friendly", "🔒 Secure & private", "📈 Real-time reports"].map(f => (
            <div key={f} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 font-medium">{f}</div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-slate-900">Account banao 🚀</h2>
            <p className="text-slate-500 text-sm mt-1">Apna business track karna shuru karo</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {[
              { key: "name",  label: "Aapka Naam",    type: "text",  ph: "Rahul Sharma" },
              { key: "email", label: "Email Address", type: "email", ph: "rahul@example.com" },
            ].map(({ key, label, type, ph }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
                <input type={type} placeholder={ph} value={form[key]} onChange={set(key)} className={inputCls(errors[key])} />
                {errors[key] && <p className="text-xs text-red-500 mt-1 font-medium">{errors[key]}</p>}
              </div>
            ))}

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={set("password")}
                  className={inputCls(errors.password) + " pr-11"} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base text-slate-400">
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1 font-medium">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Password Confirm Karo</label>
              <input type="password" placeholder="••••••••" value={form.confirm} onChange={set("confirm")} className={inputCls(errors.confirm)} />
              {errors.confirm && <p className="text-xs text-red-500 mt-1 font-medium">{errors.confirm}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 mt-2">
              {loading ? <Spinner size="sm" /> : "Register Karo"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Pehle se account hai?{" "}
            <Link to="/login" className="text-orange-500 font-semibold hover:underline">Login karo</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, selectAuthLoading, selectAuthError, clearError } from "../features/auth/authSlice";
import toast from "react-hot-toast";
import styles from "./Auth.module.css";

export default function Register() {
  const dispatch = useDispatch();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const validate = () => {
    const e = {};
    if (!form.name.trim())                        e.name    = "Naam zaroori hai";
    if (!form.email)                              e.email   = "Email zaroori hai";
    else if (!/\S+@\S+\.\S+/.test(form.email))   e.email   = "Valid email daalo";
    if (!form.password)                           e.password = "Password zaroori hai";
    else if (form.password.length < 6)            e.password = "Minimum 6 characters chahiye";
    if (form.password !== form.confirmPassword)   e.confirmPassword = "Passwords match nahi karte";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    dispatch(registerUser({ name: form.name, email: form.email, password: form.password }));
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className={styles.page}>
      <div className={styles.leftPanel}>
        <div className={styles.brandBox}>
          <span className={styles.brandEmoji}>🏍️</span>
          <h1 className={styles.brandTitle}>BikeResell Pro</h1>
          <p className={styles.brandDesc}>
            Free mein register karo aur apna bike reselling business organize karna shuru karo.
          </p>
          <div className={styles.features}>
            {["✅ Free forever", "📱 Mobile friendly", "🔒 Secure & private", "📈 Real-time reports"].map(f => (
              <div key={f} className={styles.featureItem}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formBox}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Account banao 🚀</h2>
            <p className={styles.formSub}>Apna business track karna shuru karo</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {[
              { key: "name",    label: "Aapka Naam",       type: "text",     ph: "Rahul Sharma" },
              { key: "email",   label: "Email Address",    type: "email",    ph: "rahul@example.com" },
            ].map(({ key, label, type, ph }) => (
              <div className={styles.field} key={key}>
                <label className={styles.label}>{label}</label>
                <input
                  className={`${styles.input} ${errors[key] ? styles.inputError : ""}`}
                  type={type}
                  placeholder={ph}
                  value={form[key]}
                  onChange={set(key)}
                  autoComplete={key}
                />
                {errors[key] && <span className={styles.errMsg}>{errors[key]}</span>}
              </div>
            ))}

            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputWrap}>
                <input
                  className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set("password")}
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.password && <span className={styles.errMsg}>{errors.password}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Password Confirm Karo</label>
              <input
                className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
              />
              {errors.confirmPassword && <span className={styles.errMsg}>{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.btnSpinner} /> : "Register Karo"}
            </button>
          </form>

          <p className={styles.switchText}>
            Pehle se account hai?{" "}
            <Link to="/login" className={styles.switchLink}>Login karo</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, selectAuthLoading, selectAuthError, clearError } from "../features/auth/authSlice";
import toast from "react-hot-toast";
import styles from "./Auth.module.css";

export default function Login() {
  const dispatch = useDispatch();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const validate = () => {
    const e = {};
    if (!form.email)                         e.email    = "Email zaroori hai";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email daalo";
    if (!form.password)                      e.password = "Password zaroori hai";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    dispatch(loginUser(form));
  };

  return (
    <div className={styles.page}>
      <div className={styles.leftPanel}>
        <div className={styles.brandBox}>
          <span className={styles.brandEmoji}>🏍️</span>
          <h1 className={styles.brandTitle}>BikeResell Pro</h1>
          <p className={styles.brandDesc}>
            Apne old bike business ko smartly manage karo — buying, servicing, selling aur
            profit tracking sab ek jagah.
          </p>
          <div className={styles.features}>
            {["📊 Real-time Dashboard", "🔧 Service Tracking", "💰 Profit Reports", "🏦 Finance Management"].map(f => (
              <div key={f} className={styles.featureItem}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formBox}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Wapas aao! 👋</h2>
            <p className={styles.formSub}>Apne account mein login karo</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label}>Email Address</label>
              <input
                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                type="email"
                placeholder="aap@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
              {errors.email && <span className={styles.errMsg}>{errors.email}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputWrap}>
                <input
                  className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.password && <span className={styles.errMsg}>{errors.password}</span>}
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.btnSpinner} /> : "Login Karo"}
            </button>
          </form>

          <p className={styles.switchText}>
            Account nahi hai?{" "}
            <Link to="/register" className={styles.switchLink}>Register karo</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
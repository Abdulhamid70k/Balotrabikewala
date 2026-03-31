import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "100vh", textAlign: "center", padding: 24 }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🏍️</div>
      <h1 style={{ fontSize: 48, fontFamily: "'Sora',sans-serif", fontWeight: 800, color: "var(--brand)" }}>404</h1>
      <p style={{ fontSize: 18, color: "var(--text-secondary)", marginBottom: 24 }}>
        Ye page nahi mila. Shayad galat raste pe aagaye!
      </p>
      <Link to="/dashboard" style={{
        background: "var(--brand)", color: "#fff",
        padding: "12px 28px", borderRadius: "var(--radius-sm)",
        fontWeight: 700, fontSize: 15,
      }}>
        Dashboard pe wapas jao →
      </Link>
    </div>
  );
}
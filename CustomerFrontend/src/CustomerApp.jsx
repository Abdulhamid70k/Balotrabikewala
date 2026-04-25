import { useState, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const fetchPublic = async (path) => {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

// ─── Status badge ────────────────────────────────────────────────
function StatusPill({ status }) {
  if (status === "in_stock")
    return <span style={{ background: "#e8f5e9", color: "#2e7d32", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>● Available</span>;
  if (status === "pending_arrival")
    return <span style={{ background: "#fff8e1", color: "#f57c00", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>⏳ Coming Soon</span>;
  return null;
}

// ─── Bike Card ───────────────────────────────────────────────────
function BikeCard({ bike, onClick }) {
  return (
    <div onClick={() => onClick(bike)} style={{
      background: "#fff", borderRadius: 16, padding: 16,
      boxShadow: "0 2px 12px rgba(0,0,0,0.08)", cursor: "pointer",
      border: "1px solid #f0f0f0", transition: "transform 0.15s, box-shadow 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)"; }}
    >
      {/* Bike icon placeholder */}
      <div style={{ background: "linear-gradient(135deg, #e8f4ff 0%, #dceeff 100%)", borderRadius: 12, height: 100, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 48 }}>
        🏍️
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", lineHeight: 1.3, flex: 1 }}>{bike.bikeName}</div>
        <StatusPill status={bike.status} />
      </div>
      {bike.bikeMake && <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{bike.bikeMake}</div>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {bike.year && <span style={{ background: "#f5f5f5", borderRadius: 6, padding: "2px 8px", fontSize: 12, color: "#555" }}>{bike.year}</span>}
        {bike.color && <span style={{ background: "#f5f5f5", borderRadius: 6, padding: "2px 8px", fontSize: 12, color: "#555" }}>{bike.color}</span>}
        {bike.registrationNumber && <span style={{ background: "#eef2ff", borderRadius: 6, padding: "2px 8px", fontSize: 12, color: "#3949ab", fontWeight: 600, fontFamily: "monospace" }}>{bike.registrationNumber}</span>}
      </div>
    </div>
  );
}

// ─── Bike Detail Modal ───────────────────────────────────────────
function BikeDetailModal({ bike, onClose }) {
  if (!bike) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: "24px 24px 0 0", padding: "0 0 32px", width: "100%", maxWidth: 480,
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 8px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#ddd" }} />
        </div>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #e8f4ff, #dceeff)", margin: "0 16px", borderRadius: 16, height: 140, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72, marginBottom: 16 }}>
          🏍️
        </div>

        <div style={{ padding: "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>{bike.bikeName}</h2>
            <StatusPill status={bike.status} />
          </div>
          {bike.bikeMake && <p style={{ color: "#888", margin: "4px 0 16px", fontSize: 14 }}>{bike.bikeMake}</p>}

          {/* Details grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Year", value: bike.year },
              { label: "Color", value: bike.color },
              { label: "Reg. Number", value: bike.registrationNumber },
            ].filter(d => d.value).map(({ label, value }) => (
              <div key={label} style={{ background: "#f8f9fa", borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", fontFamily: label === "Reg. Number" ? "monospace" : "inherit" }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Service items (show as features, no price) */}
          {bike.service?.items?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 8 }}>✅ Recently Serviced</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {bike.service.items.map((item, i) => (
                  <span key={i} style={{ background: "#e8f5e9", color: "#2e7d32", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 500 }}>
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* RC Transfer */}
          {bike.rc?.transferred && (
            <div style={{ background: "#e8f5e9", borderRadius: 12, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>📄</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#2e7d32" }}>RC Transfer Available</div>
                <div style={{ fontSize: 12, color: "#555" }}>Documents ready for transfer</div>
              </div>
            </div>
          )}

          {/* CTA */}
          <div style={{ background: "linear-gradient(135deg, #1565c0, #1976d2)", borderRadius: 14, padding: "14px 20px", textAlign: "center", cursor: "pointer" }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>📞 Enquire Now</div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 }}>Visit our showroom for price details</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Registration Search Result ──────────────────────────────────
function RegSearchResult({ bike, onClose }) {
  if (!bike) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: 20, width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏍️</div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1a1a1a" }}>{bike.bikeName}</h3>
          {bike.bikeMake && <p style={{ color: "#888", margin: "4px 0 0", fontSize: 13 }}>{bike.bikeMake}</p>}
        </div>

        <div style={{ background: "#f8f9fa", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          {[
            ["Registration No.", bike.registrationNumber, true],
            ["Year", bike.year],
            ["Color", bike.color],
            ["Status", bike.status === "in_stock" ? "✅ Available in Stock" : bike.status === "pending_arrival" ? "⏳ Coming Soon" : "Sold"],
          ].filter(([, v]) => v).map(([label, value, mono]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #eee" }}>
              <span style={{ fontSize: 13, color: "#888" }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", fontFamily: mono ? "monospace" : "inherit" }}>{value}</span>
            </div>
          ))}
        </div>

        {bike.service?.items?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#555", margin: "0 0 8px" }}>✅ Serviced Items</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {bike.service.items.map((item, i) => (
                <span key={i} style={{ background: "#e8f5e9", color: "#2e7d32", borderRadius: 8, padding: "3px 8px", fontSize: 12 }}>{item.name}</span>
              ))}
            </div>
          </div>
        )}

        <button onClick={onClose} style={{ width: "100%", background: "#1565c0", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────
export default function CustomerApp() {
  const [bikes,       setBikes]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [regQuery,    setRegQuery]    = useState("");
  const [regResult,   setRegResult]   = useState(null);
  const [regLoading,  setRegLoading]  = useState(false);
  const [regError,    setRegError]    = useState("");
  const [selectedBike, setSelectedBike] = useState(null);
  const [activeTab,   setActiveTab]   = useState("home");
  const [filter,      setFilter]      = useState("in_stock");

  useEffect(() => {
    loadBikes();
  }, []);

  const loadBikes = async () => {
    try {
      setLoading(true);
      // Public endpoint — no auth needed (we'll create this)
      const data = await fetchPublic("/public/bikes");
      setBikes(data.data || []);
    } catch {
      setBikes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegSearch = async () => {
    if (!regQuery.trim()) return;
    setRegLoading(true);
    setRegError("");
    setRegResult(null);
    try {
      const data = await fetchPublic(`/public/bikes/search?reg=${encodeURIComponent(regQuery.trim().toUpperCase())}`);
      if (data.data) {
        setRegResult(data.data);
      } else {
        setRegError("Koi bike nahi mili is registration number se");
      }
    } catch {
      setRegError("Koi bike nahi mili is registration number se");
    } finally {
      setRegLoading(false);
    }
  };

  const filteredBikes = bikes.filter(b =>
    filter === "all" ? b.status !== "sold" : b.status === filter
  );

  const availableCount = bikes.filter(b => b.status === "in_stock").length;
  const comingCount    = bikes.filter(b => b.status === "pending_arrival").length;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#f5f7fa", position: "relative", fontFamily: "'Segoe UI', sans-serif", paddingBottom: 80 }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(160deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%)", padding: "20px 20px 40px", position: "relative", overflow: "hidden" }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", top: 20, right: 20, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, position: "relative" }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginBottom: 2 }}>Welcome to</div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 20, lineHeight: 1.2 }}>Balotra Bikewala</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16 }}>🏍️</span>
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>My Garage</span>
          </div>
        </div>

        {/* Registration Search */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "4px 4px 4px 14px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
            <div style={{ background: "#1565c0", borderRadius: 6, padding: "3px 6px", fontSize: 10, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>IND</div>
            <input
              style={{ border: "none", outline: "none", fontSize: 16, fontWeight: 700, flex: 1, color: "#1a1a1a", fontFamily: "monospace", letterSpacing: 2, background: "transparent" }}
              placeholder="RJ 25 AB 1234"
              value={regQuery}
              onChange={e => { setRegQuery(e.target.value.toUpperCase()); setRegError(""); }}
              onKeyDown={e => e.key === "Enter" && handleRegSearch()}
            />
          </div>
          <button onClick={handleRegSearch} disabled={regLoading}
            style={{ background: "#1565c0", border: "none", borderRadius: 12, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {regLoading
              ? <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              : <span style={{ fontSize: 18, color: "#fff" }}>🔍</span>}
          </button>
        </div>
        {regError && <p style={{ color: "rgba(255,200,200,1)", fontSize: 12, margin: "8px 4px 0", fontWeight: 500 }}>{regError}</p>}
      </div>

      {/* ── Quick Stats ────────────────────────────────────────── */}
      <div style={{ margin: "-20px 16px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, position: "relative", zIndex: 10 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#e8f5e9", borderRadius: 10, padding: 8, fontSize: 20 }}>✅</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>{availableCount}</div>
            <div style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>Available Now</div>
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#fff8e1", borderRadius: 10, padding: 8, fontSize: 20 }}>⏳</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>{comingCount}</div>
            <div style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>Coming Soon</div>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div style={{ padding: "0 16px" }}>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[
            { id: "in_stock",        label: "Available" },
            { id: "pending_arrival", label: "Coming Soon" },
            { id: "all",             label: "All" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setFilter(tab.id)}
              style={{ padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, transition: "all 0.15s",
                background: filter === tab.id ? "#1565c0" : "#fff",
                color:      filter === tab.id ? "#fff"    : "#555",
                boxShadow:  filter === tab.id ? "0 2px 8px rgba(21,101,192,0.3)" : "0 1px 4px rgba(0,0,0,0.08)",
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Section title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1a1a1a" }}>
            {filter === "in_stock" ? "Available Bikes" : filter === "pending_arrival" ? "Coming Soon" : "All Bikes"}
          </h2>
          <span style={{ fontSize: 12, color: "#888", background: "#f0f0f0", borderRadius: 10, padding: "3px 8px" }}>
            {filteredBikes.length} bikes
          </span>
        </div>

        {/* Bike grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#888" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏍️</div>
            <div>Bikes load ho rahi hain...</div>
          </div>
        ) : filteredBikes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#888" }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🏍️</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Koi bike nahi mili</div>
            <div style={{ fontSize: 13 }}>Jald hi nai bikes aayengi</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {filteredBikes.map(bike => (
              <BikeCard key={bike._id} bike={bike} onClick={setSelectedBike} />
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom Nav ──────────────────────────────────────────── */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: "1px solid #eee", display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom)" }}>
        {[
          { id: "home",     icon: "🏠", label: "Home" },
          { id: "bikes",    icon: "🏍️", label: "Bikes" },
          { id: "about",    icon: "ℹ️",  label: "About" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 0 8px", border: "none", background: "transparent", cursor: "pointer" }}>
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: activeTab === tab.id ? "#1565c0" : "#aaa" }}>{tab.label}</span>
            {activeTab === tab.id && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#1565c0" }} />}
          </button>
        ))}
      </div>

      {/* Modals */}
      <BikeDetailModal bike={selectedBike} onClose={() => setSelectedBike(null)} />
      <RegSearchResult bike={regResult} onClose={() => setRegResult(null)} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
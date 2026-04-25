import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const fetchPublic = async (path) => {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error("Failed");
  return res.json();
};

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='%23e8f0fe'/%3E%3Ctext x='100' y='80' font-size='48' text-anchor='middle' dominant-baseline='middle'%3E%F0%9F%8F%8D%EF%B8%8F%3C/text%3E%3C/svg%3E";

// ─── Status Pill ─────────────────────────────────────────────────
function StatusPill({ status }) {
  if (status === "in_stock")
    return <span style={{ background: "#e8f5e9", color: "#2e7d32", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>● Available</span>;
  return null;
}

// ─── Bike Detail Modal ────────────────────────────────────────────
function BikeModal({ bike, onClose }) {
  const [imgIdx, setImgIdx] = useState(0);
  if (!bike) return null;

  const hasImages = bike.images?.length > 0;
  const imgs = hasImages ? bike.images : [{ url: PLACEHOLDER }];

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 500, maxHeight: "92vh", overflowY: "auto" }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#ddd" }} />
        </div>

        {/* Image slider */}
        <div style={{ position: "relative", margin: "12px 16px 0", borderRadius: 16, overflow: "hidden", height: 220, background: "#f0f4f8" }}>
          <img
            src={imgs[imgIdx]?.url || PLACEHOLDER}
            alt={bike.bikeName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { e.target.src = PLACEHOLDER; }}
          />
          {imgs.length > 1 && (
            <>
              <button onClick={() => setImgIdx(i => Math.max(i - 1, 0))}
                style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                ‹
              </button>
              <button onClick={() => setImgIdx(i => Math.min(i + 1, imgs.length - 1))}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                ›
              </button>
              <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4 }}>
                {imgs.map((_, i) => (
                  <div key={i} onClick={() => setImgIdx(i)} style={{ width: i === imgIdx ? 16 : 6, height: 6, borderRadius: 3, background: i === imgIdx ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.2s" }} />
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ padding: "16px 20px 32px" }}>
          {/* Name + Status */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>{bike.bikeName}</h2>
              {bike.bikeMake && <p style={{ margin: "2px 0 0", color: "#888", fontSize: 13 }}>{bike.bikeMake}</p>}
            </div>
            <StatusPill status={bike.status} />
          </div>

          {/* Price */}
          {bike.sale?.sellPrice > 0 && (
            <div style={{ background: "linear-gradient(135deg, #e3f2fd, #bbdefb)", borderRadius: 14, padding: "14px 18px", margin: "14px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 12, color: "#1565c0", fontWeight: 600, marginBottom: 2 }}>Selling Price</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#0d47a1" }}>{fmt(bike.sale.sellPrice)}</div>
              </div>
              <div style={{ fontSize: 32 }}>💰</div>
            </div>
          )}

          {/* Details grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Year",      value: bike.year },
              { label: "Color",     value: bike.color },
              { label: "Reg. No.",  value: bike.registrationNumber, mono: true },
              { label: "Brand",     value: bike.bikeBrand || bike.bikeMake },
            ].filter(d => d.value).map(({ label, value, mono }) => (
              <div key={label} style={{ background: "#f8f9fa", borderRadius: 12, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", fontFamily: mono ? "monospace" : "inherit" }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Service items */}
          {bike.service?.items?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 8 }}>✅ Recently Serviced</div>
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
            <div style={{ background: "#e8f5e9", borderRadius: 12, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 20 }}>📄</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#2e7d32" }}>RC Transfer Ready</div>
                <div style={{ fontSize: 12, color: "#666" }}>Documents taiyaar hain</div>
              </div>
            </div>
          )}

          {/* CTA */}
          <a href="tel:+91XXXXXXXXXX"
            style={{ display: "block", background: "#1565c0", borderRadius: 14, padding: "14px", textAlign: "center", textDecoration: "none" }}>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>📞 Call Now for Enquiry</div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 }}>Balotra Bikewala</div>
          </a>

          <button onClick={onClose}
            style={{ width: "100%", marginTop: 10, background: "#f5f5f5", border: "none", borderRadius: 14, padding: "12px", fontWeight: 700, fontSize: 14, color: "#555", cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reg Search Result ────────────────────────────────────────────
function RegResult({ bike, onClose }) {
  if (!bike) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: 20, width: "100%", maxWidth: 380 }}>
        {bike.images?.[0]?.url && (
          <img src={bike.images[0].url} alt={bike.bikeName} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 14, marginBottom: 14 }} onError={e => e.target.style.display = "none"} />
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{bike.bikeName}</h3>
            {bike.bikeMake && <p style={{ margin: "2px 0 0", color: "#888", fontSize: 13 }}>{bike.bikeMake}</p>}
          </div>
          <StatusPill status={bike.status} />
        </div>

        {bike.sale?.sellPrice > 0 && (
          <div style={{ background: "#e3f2fd", borderRadius: 12, padding: "12px 16px", marginBottom: 14, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#1565c0", fontWeight: 600 }}>Selling Price</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#0d47a1" }}>{fmt(bike.sale.sellPrice)}</div>
          </div>
        )}

        <div style={{ background: "#f8f9fa", borderRadius: 12, padding: 14, marginBottom: 14 }}>
          {[
            ["Reg. Number", bike.registrationNumber, true],
            ["Year",        bike.year],
            ["Color",       bike.color],
          ].filter(([, v]) => v).map(([label, value, mono]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #eee" }}>
              <span style={{ fontSize: 13, color: "#888" }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", fontFamily: mono ? "monospace" : "inherit" }}>{value}</span>
            </div>
          ))}
        </div>

        <button onClick={onClose} style={{ width: "100%", background: "#1565c0", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Bike Card ────────────────────────────────────────────────────
function BikeCard({ bike, onClick }) {
  const imgUrl = bike.images?.[0]?.url;
  return (
    <div onClick={() => onClick(bike)} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", cursor: "pointer", border: "1px solid #f0f0f0", transition: "transform 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
      onMouseLeave={e => e.currentTarget.style.transform = "none"}>
      {/* Image */}
      <div style={{ height: 130, background: "#e8f0fe", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {imgUrl ? (
          <img src={imgUrl} alt={bike.bikeName} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display="none"; e.target.parentNode.innerHTML = '<div style="font-size:48px">🏍️</div>'; }} />
        ) : (
          <span style={{ fontSize: 48 }}>🏍️</span>
        )}
      </div>

      <div style={{ padding: "12px 12px 10px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{bike.bikeName}</div>
        {bike.bikeMake && <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>{bike.bikeMake}</div>}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
          {bike.year && <span style={{ background: "#f5f5f5", borderRadius: 5, padding: "2px 6px", fontSize: 10, color: "#555", fontWeight: 600 }}>{bike.year}</span>}
          {bike.color && <span style={{ background: "#f5f5f5", borderRadius: 5, padding: "2px 6px", fontSize: 10, color: "#555" }}>{bike.color}</span>}
          {bike.registrationNumber && <span style={{ background: "#eef2ff", borderRadius: 5, padding: "2px 6px", fontSize: 10, color: "#3949ab", fontWeight: 700, fontFamily: "monospace" }}>{bike.registrationNumber}</span>}
        </div>

        {/* Price */}
        {bike.sale?.sellPrice > 0 ? (
          <div style={{ fontWeight: 900, fontSize: 16, color: "#1565c0" }}>{fmt(bike.sale.sellPrice)}</div>
        ) : (
          <div style={{ fontSize: 12, color: "#aaa", fontStyle: "italic" }}>Price on enquiry</div>
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────
export default function CustomerApp() {
  const [bikes,       setBikes]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [regQuery,    setRegQuery]    = useState("");
  const [regResult,   setRegResult]   = useState(null);
  const [regLoading,  setRegLoading]  = useState(false);
  const [regError,    setRegError]    = useState("");
  const [selected,    setSelected]    = useState(null);

  useEffect(() => {
    fetchPublic("/public/bikes")
      .then(d => setBikes(d.data || []))
      .catch(() => setBikes([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRegSearch = async () => {
    if (!regQuery.trim()) return;
    setRegLoading(true); setRegError(""); setRegResult(null);
    try {
      const d = await fetchPublic(`/public/bikes/search?reg=${encodeURIComponent(regQuery.trim().toUpperCase())}`);
      setRegResult(d.data);
    } catch {
      setRegError("Koi bike nahi mili is number se");
    } finally {
      setRegLoading(false);
    }
  };

  const filtered = bikes.filter(b =>
    !search ||
    b.bikeName?.toLowerCase().includes(search.toLowerCase()) ||
    b.bikeMake?.toLowerCase().includes(search.toLowerCase()) ||
    b.registrationNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", minHeight: "100vh", background: "#f5f7fa", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(160deg, #0d47a1, #1976d2)", padding: "20px 20px 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", top: 40, right: 40, width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

        <div style={{ marginBottom: 18, position: "relative" }}>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Welcome to</div>
          <div style={{ color: "#fff", fontWeight: 900, fontSize: 22 }}>Balotra Bikewala</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Quality Old Bikes at Best Price</div>
        </div>

        {/* Reg Search */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "5px 5px 5px 14px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
          <div style={{ background: "#1565c0", borderRadius: 6, padding: "3px 7px", fontSize: 10, fontWeight: 800, color: "#fff", letterSpacing: 0.5, flexShrink: 0 }}>IND</div>
          <input
            style={{ border: "none", outline: "none", fontSize: 15, fontWeight: 700, flex: 1, color: "#1a1a1a", fontFamily: "monospace", letterSpacing: 2, background: "transparent", minWidth: 0 }}
            placeholder="RJ 25 AB 1234"
            value={regQuery}
            onChange={e => { setRegQuery(e.target.value.toUpperCase()); setRegError(""); }}
            onKeyDown={e => e.key === "Enter" && handleRegSearch()}
          />
          <button onClick={handleRegSearch} disabled={regLoading}
            style={{ background: "#1565c0", border: "none", borderRadius: 10, padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {regLoading
              ? <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              : <span style={{ fontSize: 18, color: "#fff" }}>🔍</span>}
          </button>
        </div>
        {regError && <p style={{ color: "#ffcccc", fontSize: 12, margin: "8px 4px 0", fontWeight: 500 }}>{regError}</p>}
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div style={{ padding: "16px" }}>

        {/* Search + Count */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
          <input
            style={{ flex: 1, border: "1.5px solid #e0e0e0", borderRadius: 12, padding: "9px 14px", fontSize: 13, outline: "none", background: "#fff" }}
            placeholder="🔍 Bike name, model ya reg search karo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 18 }}>✕</button>}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1a1a1a" }}>Available Bikes</h2>
          <span style={{ background: "#e8f0fe", color: "#1565c0", borderRadius: 10, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
            {filtered.length} bikes
          </span>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏍️</div>
            <div style={{ color: "#888", fontSize: 14 }}>Bikes load ho rahi hain...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>😔</div>
            <div style={{ fontWeight: 700, color: "#333", marginBottom: 4 }}>Koi bike nahi mili</div>
            <div style={{ color: "#888", fontSize: 13 }}>Jald hi nai bikes aayengi</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {filtered.map(bike => (
              <BikeCard key={bike._id} bike={bike} onClick={setSelected} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <BikeModal  bike={selected}   onClose={() => setSelected(null)} />
      <RegResult  bike={regResult}  onClose={() => setRegResult(null)} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>
    </div>
  );
}
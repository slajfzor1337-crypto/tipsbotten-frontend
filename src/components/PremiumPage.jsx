import { useState, useEffect } from "react";
import { AFFILIATES } from "../affiliates.js";

const SERVER_URL = "https://edgebot-server-v2-production.up.railway.app";
const PUBLISHABLE_KEY = "pk_test_51TLsCNE3zl6Hyj1FTqAkpoeyTOmEXZ5vr3sSi6uJkkTg1glJExA1RsbgzggHyVhmERtl3roVcAqYA8P5n1Hfpqae00WtfdFtzs";

const FEATURES = [
  { icon: "🎯", title: "AI Predictions", desc: "Fullständig matchanalys med confidence-rating" },
  { icon: "🏆", title: "Acca-byggare", desc: "Automatiska kombinationstips" },
  { icon: "⚡", title: "Tidiga tips", desc: "24h innan gratis-användare" },
  { icon: "💬", title: "Obegränsad AI Bot", desc: "Fråga om vilken match som helst" },
  { icon: "📊", title: "10+ spelbolag", desc: "Full oddsanalys i realtid" },
  { icon: "🚫", title: "Reklamfritt", desc: "Helt utan distraktioner" },
];

const COMPARE = [
  ["Dagliga speltips", "✓", "✓", true, true],
  ["AI Bot", "3/dag", "✓", false, true],
  ["AI Predictions", "✗", "✓", false, true],
  ["Acca-byggare", "✗", "✓", false, true],
  ["Tidiga tips", "✗", "✓", false, true],
  ["Reklamfritt", "✗", "✓", false, true],
];

export default function PremiumPage({ onUnlock }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const premiumParam = params.get("premium");
    if (premiumParam === "true" || sessionId) {
      setVerifying(true);
      if (sessionId) {
        fetch(`${SERVER_URL}/api/verify-session?sessionId=${sessionId}`)
          .then(r => r.json())
          .then(data => {
            if (data.isPremium) { localStorage.setItem("tipsbotten_premium", "true"); onUnlock(); }
            setVerifying(false);
          }).catch(() => setVerifying(false));
      } else {
        localStorage.setItem("tipsbotten_premium", "true");
        onUnlock();
        setVerifying(false);
      }
    }
  }, []);

  const handleCheckout = async () => {
    setLoading(true);
    setError("");
    try {
      const currentUrl = window.location.origin + window.location.pathname;
      const res = await fetch(`${SERVER_URL}/api/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          successUrl: `${currentUrl}?premium=true&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${currentUrl}?premium=false`,
        }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { setError(data.error || "Något gick fel. Försök igen."); }
    } catch (e) {
      setError("Kunde inte ansluta till betalningssidan. Försök igen.");
    }
    setLoading(false);
  };

  if (verifying) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Verifierar betalning...</div>
        <p style={{ color: "#666" }}>Ett ögonblick, vi aktiverar ditt Premium-konto.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

      {/* Hero — 2 column */}
      <div style={{
        background: "#111",
        border: "1px solid #1f1f1f",
        borderRadius: 8,
        overflow: "hidden",
        marginBottom: 24,
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          {/* Left — price + CTA */}
          <div style={{ padding: "32px 28px", borderRight: "1px solid #1f1f1f" }}>
            <div style={{
              display: "inline-block",
              background: "rgba(255,214,0,0.1)",
              border: "1px solid rgba(255,214,0,0.3)",
              color: "#ffd600",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "4px 12px",
              borderRadius: 3,
              marginBottom: 16,
            }}>⭐ Tipsbotten Premium</div>

            <div style={{ fontFamily: "var(--font)", fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 10 }}>
              Spela <span style={{ color: "#ffd600" }}>smartare</span>.<br />Vinn mer.
            </div>

            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, marginBottom: 20 }}>
              Få tillgång till alla AI-verktyg, tidiga tips och obegränsad analys — för priset av en kaffe i veckan.
            </p>

            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 52, fontWeight: 900, color: "#ffd600", lineHeight: 1 }}>99 kr</div>
              <div style={{ fontSize: 13, color: "#555" }}>/ månad</div>
            </div>

            {error && <div style={{ padding: "10px 14px", background: "rgba(244,67,54,0.08)", border: "1px solid rgba(244,67,54,0.2)", borderRadius: 4, fontSize: 12, color: "#f44336", marginBottom: 14 }}>{error}</div>}

            <button onClick={handleCheckout} disabled={loading} style={{
              width: "100%",
              background: "#ffd600",
              color: "#000",
              fontSize: 14,
              fontWeight: 800,
              padding: "14px",
              border: "none",
              borderRadius: 5,
              cursor: loading ? "not-allowed" : "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontFamily: "var(--font)",
              opacity: loading ? 0.7 : 1,
              marginBottom: 8,
            }}>
              {loading ? "Laddar..." : "Börja med Premium nu →"}
            </button>
            <div style={{ fontSize: 10, color: "#444", textAlign: "center" }}>
              🔒 Säker betalning via Stripe · Inga bindningstider · Avsluta när som helst
            </div>
          </div>

          {/* Right — feature grid */}
          <div style={{ padding: "32px 28px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#444", marginBottom: 14 }}>
              Allt som ingår
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {FEATURES.map(f => (
                <div key={f.title} style={{
                  background: "#161616",
                  border: "1px solid #1f1f1f",
                  borderRadius: 6,
                  padding: "12px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}>
                  <div style={{
                    width: 32, height: 32,
                    background: "rgba(0,200,83,0.08)",
                    borderRadius: 6,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, flexShrink: 0,
                  }}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{f.title}</div>
                    <div style={{ fontSize: 10, color: "#555", lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comparison table */}
        <div style={{ padding: "20px 28px", borderTop: "1px solid #1f1f1f", background: "#0d0d0d" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#444", marginBottom: 12 }}>
            Gratis vs Premium
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", gap: 8 }}>
            <div />
            <div style={{ fontSize: 10, fontWeight: 700, textAlign: "center", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", paddingBottom: 8, borderBottom: "1px solid #1f1f1f" }}>Gratis</div>
            <div style={{ fontSize: 10, fontWeight: 700, textAlign: "center", color: "#ffd600", textTransform: "uppercase", letterSpacing: "0.06em", paddingBottom: 8, borderBottom: "1px solid #1f1f1f" }}>⭐ Premium</div>
            {COMPARE.map(([name, free, prem]) => (
              <>
                <div key={name} style={{ fontSize: 12, color: "#888", padding: "7px 0", borderBottom: "1px solid #161616" }}>{name}</div>
                <div style={{ textAlign: "center", fontSize: free === "✓" ? 14 : 11, color: free === "✓" ? "#00c853" : free === "✗" ? "#333" : "#ffd600", fontWeight: 700, padding: "7px 0", borderBottom: "1px solid #161616" }}>{free}</div>
                <div style={{ textAlign: "center", fontSize: 14, color: "#00c853", fontWeight: 700, padding: "7px 0", borderBottom: "1px solid #161616" }}>{prem}</div>
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Bookmaker section — BIGGER */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#444", marginBottom: 14 }}>
          Rekommenderade spelbolag — Exklusiva välkomsterbjudanden
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {AFFILIATES.map(bk => (
            <a key={bk.name} href={bk.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <div style={{
                background: "#111",
                border: "1px solid #1f1f1f",
                borderRadius: 8,
                padding: "20px 16px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#00c853"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1f1f1f"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 6 }}>{bk.name}</div>
                <div style={{ fontSize: 13, color: "#00c853", fontWeight: 600, marginBottom: 14 }}>{bk.offer}</div>
                <div style={{
                  display: "block",
                  width: "100%",
                  padding: "10px",
                  background: "#00c853",
                  color: "#000",
                  fontWeight: 800,
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  borderRadius: 4,
                  border: "none",
                  cursor: "pointer",
                }}>Hämta bonus →</div>
              </div>
            </a>
          ))}
        </div>
        <p style={{ fontSize: 10, color: "#333", textAlign: "center", marginTop: 10 }}>
          * Tipsbotten kan få ersättning via affiliatelänkar. 18+ · Spela ansvarsfullt · Villkor gäller hos respektive spelbolag
        </p>
      </div>

      <div style={{ padding: "12px 16px", background: "rgba(255,152,0,0.05)", border: "1px solid rgba(255,152,0,0.15)", borderRadius: 6, fontSize: 12, color: "#666", lineHeight: 1.7 }}>
        ⚠️ Spel kan vara beroendeframkallande. Spela ansvarsfullt och bara med pengar du har råd att förlora. Stödlinjen: 020-819 100 · spelpaus.se · 18+
      </div>
    </div>
  );
}

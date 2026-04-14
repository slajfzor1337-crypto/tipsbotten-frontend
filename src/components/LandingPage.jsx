import { useState, useEffect } from "react";
import { AFFILIATES } from "../affiliates.js";

const SERVER_URL = "https://edgebot-server-v2-production.up.railway.app";

const SPORT_FILTERS = [
  { key: "all", label: "Alla" },
  { key: "soccer_epl", label: "Premier League" },
  { key: "soccer_spain_la_liga", label: "La Liga" },
  { key: "soccer_italy_serie_a", label: "Serie A" },
  { key: "soccer_germany_bundesliga", label: "Bundesliga" },
  { key: "basketball_nba", label: "NBA" },
  { key: "icehockey_nhl", label: "NHL" },
];

function TipCard({ bet, featured, onNamarginalate }) {
  const fördel = bet.bestBet?.fördel || 0;
  const fördelLabel = fördel >= 6 ? "🔥 Starkt tips" : fördel >= 3 ? "✅ Bra spel" : "⚡ Möjligt spel";

  return (
    <div className={`tip-card ${featured ? "featured" : ""}`} onClick={() => onNamarginalate("value")}>
      <div className="tip-card-header">
        <div className="tip-card-tag">
          {bet.sport} · {fördelLabel}
        </div>
        <div className="tip-card-match">
          {bet.homeTeam} – {bet.awayTeam}
        </div>
        <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
          {new Date(bet.commenceTime).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "short" })}
        </div>
      </div>
      <div className="tip-card-body">
        <div className="tip-row">
          <span className="tip-label">Spel</span>
          <span className="tip-value accent">{bet.bestBet?.name}</span>
        </div>
        <div className="tip-row">
          <span className="tip-label">Spelbolag</span>
          <span className="tip-value">{bet.bestBet?.bestBookmaker}</span>
        </div>
        <div className="tip-row">
          <span className="tip-label">Fördel</span>
          <span className="tip-value accent">+{bet.bestBet?.fördel}% fördel</span>
        </div>
        <div className="tip-odds-row">
          <div>
            <div className="tip-units">Kelly-insats</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>${bet.bestBet?.stake?.toFixed(2)}</div>
          </div>
          <div className="tip-odds">{bet.bestBet?.decimal?.toFixed(2)}</div>
        </div>
      </div>
      <button className="tip-btn" onClick={(e) => { e.stopPropagation(); onNamarginalate("chat"); }}>
        Analysera →
      </button>
    </div>
  );
}

function EmptyTipCard() {
  return (
    <div className="tip-card" style={{ opacity: 0.4 }}>
      <div className="tip-card-header" style={{ height: 100 }} />
      <div className="tip-card-body">
        <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: 12 }}>
          Laddar tips...
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onNamarginalate }) {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSport, setActiveSport] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAllTips();
  }, []);

  const fetchAllTips = async () => {
    setLoading(true);
    setError("");
    const sports = ["soccer_epl", "soccer_spain_la_liga", "soccer_germany_bundesliga", "basketball_nba", "icehockey_nhl"];
    const allBets = [];
    for (const sport of sports) {
      try {
        const res = await fetch(`${SERVER_URL}/api/bets?sport=${sport}&market=h2h&minFördel=1`);
        if (res.ok) {
          const data = await res.json();
          allBets.push(...(data.bets || []).slice(0, 3).map(b => ({ ...b, sportKey: sport })));
        }
      } catch (e) {}
    }
    allBets.sort((a, b) => b.bestBet.fördel - a.bestBet.fördel);
    setTips(allBets);
    setLoading(false);
    if (!allBets.length) setError("Inga tips tillgängliga just nu. Försök igen senare.");
  };

  const filtered = activeSport === "all" ? tips : tips.filter(t => t.sportKey === activeSport);

  return (
    <div>
      {/* Hero */}
      <div className="hero-banner">
        <div className="hero-badge">🎯 AI-Driven Speltipsanalys</div>
        <h1 className="hero-title">
          SENASTE<br /><span className="highlight">SPELTIPS</span>
        </h1>
        <p className="hero-sub">
          Tipsbotten analyserar liveodds från 10+ spelbolag och hittar matematiska bra spel — gratis, i realtid.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={() => onNamarginalate("chat")}>
            🤖 AI Chat — Dagens bästa spel
          </button>
          <button className="btn btn-lg" onClick={() => onNamarginalate("predictions")}>
            🎯 AI Predictions →
          </button>
        </div>
        <div className="hero-stats">
          {[
            { num: "10+", label: "Spelbolag" },
            { num: "Live", label: "Realtidsodds" },
            { num: "3", label: "Marknader" },
            { num: "Gratis", label: "Alltid" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div className="hero-stat-num">{s.num}</div>
              <div className="hero-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips feed */}
      <div className="page-content">
        {/* Sport filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {SPORT_FILTERS.map(f => (
            <button key={f.key}
              onClick={() => setActiveSport(f.key)}
              style={{
                padding: "7px 16px",
                background: activeSport === f.key ? "var(--accent)" : "var(--surface)",
                color: activeSport === f.key ? "#000" : "#aaa",
                border: `1px solid ${activeSport === f.key ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                transition: "all 0.15s",
                fontFamily: "var(--font)",
              }}>
              {f.label}
            </button>
          ))}
          <button onClick={fetchAllTips}
            style={{ padding: "7px 16px", background: "transparent", color: "#666", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "var(--font)", fontWeight: 600 }}>
            ↻ Uppdatera
          </button>
        </div>

        <div className="section-header">
          <div className="section-title-text">
            Senaste <span>Speltips</span>
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>
            {filtered.length} tips hittade
          </div>
        </div>

        {error && (
          <div className="alert-error" style={{ marginBottom: 20 }}>
            {error} — <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={fetchAllTips}>Försök igen</span>
          </div>
        )}

        {loading ? (
          <div className="tips-grid">
            {[1, 2, 3, 4, 5, 6].map(i => <EmptyTipCard key={i} />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="tips-grid">
            {filtered.map((bet, i) => (
              <TipCard key={bet.id} bet={bet} featured={i === 0} onNamarginalate={onNamarginalate} />
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Inga tips för denna sport just nu</div>
            <div style={{ fontSize: 13, color: "#666" }}>Välj en annan sport eller kom tillbaka senare</div>
          </div>
        )}

        {/* Bookmaker affiliate banners */}
        <div className="section-header" style={{ marginTop: 48 }}>
          <div className="section-title-text">Rekommenderade <span>Spelbolag</span></div>
          <div style={{ fontSize: 12, color: "#666" }}>Exklusiva välkomsterbjudanden</div>
        </div>
        <div className="bookie-grid" style={{ marginBottom: 40 }}>
          {AFFILIATES.map(bk => (
            <a key={bk.name} className="bookie-card" href={bk.url} target="_blank" rel="noopener noreferrer">
              <div className="bookie-name" style={{ color: bk.textColor }}>{bk.name}</div>
              <div className="bookie-offer">{bk.offer}</div>
              <button className="bookie-btn">Hämta bonus →</button>
            </a>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#555", textAlign: "center", marginBottom: 40 }}>
          * Tipsbotten kan få ersättning via affiliatelänkar. 18+ · Spela ansvarsfullt · Villkor gäller
        </p>

        {/* How it works */}
        <div className="section-header" style={{ marginTop: 48 }}>
          <div className="section-title-text">Hur det <span>fungerar</span></div>
        </div>
        <div className="grid-3" style={{ marginBottom: 40 }}>
          {[
            { icon: "📡", title: "Hämtar liveodds", desc: "Vi hämtar realtidsodds från Bet365, Pinnacle, Unibet, William Hill och fler." },
            { icon: "🧮", title: "Tar bort marginalen", desc: "Varje spelbolags marginal (marginal) tas bort för att visa det verkliga sannolikhetsvärdet." },
            { icon: "⚡", title: "Hittar fördelen", desc: "Tips med positiv fördel visas här — matcher där odds är bättre än vad marknaden säger." },
          ].map(item => (
            <div key={item.title} className="card">
              <div style={{ fontSize: 32, marginBottom: 12 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{item.title}</div>
              <p style={{ fontSize: 13, color: "#888", lineHeight: 1.7 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="disclaimer">
          ⚠️ Spela ansvarsfullt. Tipsbotten är ett analysverktyg — inte en garanti för vinst. Spela bara det du har råd att förlora. Stödlinjen: 020-819 100 · spelpaus.se
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { AFFILIATES } from "../affiliates.js";

const SERVER_URL = "https://edgebot-server-v2-production.up.railway.app";
const USE_TEST_DATA = true; // Set to false when API is working

const TEST_TIPS = [
  { id: "1", sport: "Premier League", sportKey: "soccer_epl", homeTeam: "Arsenal", awayTeam: "Chelsea", commenceTime: new Date(Date.now() + 3600000*5).toISOString(), bestBet: { name: "Arsenal vinner", bestBookmaker: "Bet365", decimal: 2.40, edge: 8.2, stake: 82 }, bookmakerCount: 8, vig: 4.2 },
  { id: "2", sport: "La Liga", sportKey: "soccer_spain_la_liga", homeTeam: "Real Madrid", awayTeam: "Barcelona", commenceTime: new Date(Date.now() + 3600000*8).toISOString(), bestBet: { name: "Real Madrid vinner", bestBookmaker: "Unibet", decimal: 1.85, edge: 5.7, stake: 55 }, bookmakerCount: 7, vig: 5.1 },
  { id: "3", sport: "NBA", sportKey: "basketball_nba", homeTeam: "LA Lakers", awayTeam: "Boston Celtics", commenceTime: new Date(Date.now() + 3600000*12).toISOString(), bestBet: { name: "Over 218.5", bestBookmaker: "Betsson", decimal: 1.95, edge: 4.3, stake: 43 }, bookmakerCount: 6, vig: 4.8 },
  { id: "4", sport: "Bundesliga", sportKey: "soccer_germany_bundesliga", homeTeam: "Bayern München", awayTeam: "Borussia Dortmund", commenceTime: new Date(Date.now() + 3600000*24).toISOString(), bestBet: { name: "Bayern vinner", bestBookmaker: "Betway", decimal: 1.70, edge: 4.1, stake: 38 }, bookmakerCount: 9, vig: 3.9 },
  { id: "5", sport: "Champions League", sportKey: "soccer_uefa_champs_league", homeTeam: "PSG", awayTeam: "Manchester City", commenceTime: new Date(Date.now() + 3600000*30).toISOString(), bestBet: { name: "Oavgjort", bestBookmaker: "Bet365", decimal: 3.60, edge: 6.8, stake: 28 }, bookmakerCount: 10, vig: 5.5 },
  { id: "6", sport: "NHL", sportKey: "icehockey_nhl", homeTeam: "Toronto Maple Leafs", awayTeam: "Montreal Canadiens", commenceTime: new Date(Date.now() + 3600000*18).toISOString(), bestBet: { name: "Toronto vinner", bestBookmaker: "Unibet", decimal: 2.10, edge: 3.5, stake: 31 }, bookmakerCount: 5, vig: 4.4 },
];



const SPORT_FILTERS = [
  { key: "all", label: "Alla" },
  { key: "soccer_epl", label: "Premier League" },
  { key: "soccer_spain_la_liga", label: "La Liga" },
  { key: "soccer_italy_serie_a", label: "Serie A" },
  { key: "soccer_germany_bundesliga", label: "Bundesliga" },
  { key: "soccer_uefa_champs_league", label: "Champions League" },
  { key: "basketball_nba", label: "NBA" },
  { key: "icehockey_nhl", label: "NHL" },
];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" }) +
    " · " + d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

function edgeBadge(edge) {
  if (edge >= 7) return { text: "Starkt tips", cls: "value" };
  if (edge >= 4) return { text: "Bra värde", cls: "win" };
  return { text: "Möjligt tips", cls: "pending" };
}

export default function NewLandingPage({ onNavigate }) {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSport, setActiveSport] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => { fetchTips(); }, []);

  const fetchTips = async () => {
    setLoading(true);
    setError("");
    if (USE_TEST_DATA) {
      setTimeout(() => { setTips(TEST_TIPS); setLoading(false); }, 600);
      return;
    }
    const sports = ["soccer_epl", "soccer_spain_la_liga", "soccer_germany_bundesliga", "soccer_uefa_champs_league", "basketball_nba", "icehockey_nhl"];
    const allBets = [];
    for (const sport of sports) {
      try {
        const res = await fetch(`${SERVER_URL}/api/bets?sport=${sport}&market=h2h&minEdge=1`);
        if (res.ok) {
          const data = await res.json();
          allBets.push(...(data.bets || []).slice(0, 3).map(b => ({ ...b, sportKey: sport })));
        }
      } catch (e) {}
    }
    allBets.sort((a, b) => b.bestBet.edge - a.bestBet.edge);
    setTips(allBets);
    setLoading(false);
    if (!allBets.length) setError("Inga tips tillgängliga just nu. Försök igen senare.");
  };

  const filtered = activeSport === "all" ? tips : tips.filter(t => t.sportKey === activeSport);
  const featured = filtered[0];
  const rest = filtered.slice(1, 4);

  return (
    <div>
      {/* Old-style hero banner */}
      <div style={{
        background: "linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #091420 100%)",
        padding: "clamp(32px, 6vw, 56px) clamp(16px, 5vw, 40px) clamp(32px, 5vw, 48px)",
        textAlign: "center",
        borderBottom: "2px solid var(--accent)",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.03,
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }} />
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 14px",
          background: "rgba(0,200,83,0.1)",
          border: "1px solid rgba(0,200,83,0.3)",
          borderRadius: 100,
          fontSize: 11, fontWeight: 700, color: "var(--accent)",
          textTransform: "uppercase", letterSpacing: "0.1em",
          marginBottom: 20, position: "relative",
        }}>
          🎯 AI-Driven Speltipsanalys
        </div>
        <h1 style={{
          fontFamily: "var(--font)",
          fontSize: "clamp(48px, 8vw, 88px)",
          fontWeight: 900,
          lineHeight: 1,
          color: "#fff",
          marginBottom: 16,
          letterSpacing: "-0.02em",
          position: "relative",
        }}>
          SENASTE<br />
          <span style={{ color: "var(--accent)" }}>SPELTIPS</span>
        </h1>
        <p style={{
          fontSize: 16, color: "#aaa", maxWidth: 520,
          margin: "0 auto 32px", lineHeight: 1.7, position: "relative",
        }}>
          Tipsbotten analyserar liveodds från 10+ spelbolag och hittar matematiska bra spel — gratis, i realtid.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", position: "relative" }}>
          <button onClick={() => onNavigate("bot")} style={{
            background: "var(--accent)", color: "#000",
            fontSize: 14, fontWeight: 800, padding: "13px 28px",
            border: "none", borderRadius: 6, cursor: "pointer",
            textTransform: "uppercase", letterSpacing: "0.08em",
            fontFamily: "var(--font)",
          }}>
            🤖 AI Chat — Dagens bästa spel
          </button>
          <button onClick={() => onNavigate("predictions")} style={{
            background: "transparent", color: "#fff",
            fontSize: 14, fontWeight: 700, padding: "13px 28px",
            border: "1px solid #333", borderRadius: 6, cursor: "pointer",
            textTransform: "uppercase", letterSpacing: "0.08em",
            fontFamily: "var(--font)",
          }}>
            🎯 AI Predictions →
          </button>
        </div>
        <div style={{
          display: "flex", justifyContent: "center", gap: "clamp(16px, 5vw, 48px)",
          flexWrap: "wrap",
          marginTop: 40, paddingTop: 32,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          position: "relative",
        }}>
          {[["10+", "Spelbolag"], ["Live", "Realtidsodds"], ["3", "Marknader"], ["Gratis", "Alltid"]].map(([num, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font)", fontSize: 28, fontWeight: 900, color: "var(--accent)", lineHeight: 1, marginBottom: 4 }}>{num}</div>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sport filters */}
      <div className="sport-filters">
        {SPORT_FILTERS.map(f => (
          <button key={f.key} className={`sport-filter-btn ${activeSport === f.key ? "active" : ""}`}
            onClick={() => setActiveSport(f.key)}>
            {f.label}
          </button>
        ))}
        <button className="sport-filter-btn" style={{ marginLeft: "auto", color: "#555" }} onClick={fetchTips}>
          ↻ Uppdatera
        </button>
      </div>

      {error && (
        <div style={{ padding: "10px 24px" }}>
          <div className="alert-error3">{error}</div>
        </div>
      )}

      {/* Content grid */}
      <div className="content-grid">
        {loading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="tip-col">
                <div style={{ height: 8, background: "#1a1a1a", borderRadius: 4, width: "40%", marginBottom: 10 }} />
                <div style={{ height: 14, background: "#1a1a1a", borderRadius: 4, width: "90%", marginBottom: 6 }} />
                <div style={{ height: 14, background: "#1a1a1a", borderRadius: 4, width: "70%", marginBottom: 20 }} />
                <div style={{ height: 28, background: "#1a1a1a", borderRadius: 4, width: "30%" }} />
              </div>
            ))}
          </>
        ) : rest.length === 0 && !featured ? (
          <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", color: "#444" }}>
            Inga tips för denna sport just nu.
          </div>
        ) : (
          rest.map((bet) => {
            const badge = edgeBadge(bet.bestBet.edge);
            return (
              <div key={bet.id} className="tip-col" onClick={() => onNavigate("bot")}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div className="tip-sport-tag">{bet.sport}</div>
                  <span className={`badge3 ${badge.cls}`}>{badge.text}</span>
                </div>
                <div className="tip-match">{bet.homeTeam} vs {bet.awayTeam}</div>
                <div className="tip-pick">{bet.bestBet.name} · {bet.bestBet.bestBookmaker}</div>
                <div className="tip-divider" />
                <div className="tip-meta" style={{ fontSize: 11, color: "#555" }}>{formatDate(bet.commenceTime)}</div>
                <div className="tip-bottom" style={{ marginTop: 4 }}>
                  <div>
                    <div className="tip-odds">{bet.bestBet.decimal?.toFixed(2)}</div>
                    <div className="tip-odds-label">Decimal odds</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="tip-edge">+{bet.bestBet.edge?.toFixed(2)}%</div>
                    <div className="tip-confidence">Statistisk fördel</div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Sidebar */}
        <div className="sidebar3">
          {/* Premium box */}
          <div className="premium-box">
            <div className="premium-box-title">⭐ Premium</div>
            <div className="premium-box-desc">Obegränsad AI-analys, tidiga tips och fullständiga predictions.</div>
            <div className="premium-box-price">99 kr</div>
            <div className="premium-box-period">per månad</div>
            <button className="premium-box-btn" onClick={() => onNavigate("premium")}>Bli Premium →</button>
          </div>

          {/* Today's odds */}
          <div className="sb-block">
            <div className="sb-title">Dagens odds</div>
            {loading ? (
              <div style={{ fontSize: 11, color: "#444", fontStyle: "italic" }}>Laddar...</div>
            ) : tips.slice(0, 6).map((bet) => (
              <div key={bet.id} className="sb-item">
                <div>
                  <div className="sb-name">{bet.homeTeam} vs {bet.awayTeam}</div>
                  <div className="sb-league">{bet.bestBet.name}</div>
                </div>
                <div className="sb-val">{bet.bestBet.decimal?.toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* Bookmakers */}
          <div className="sb-block">
            <div className="sb-title">Spelbolag</div>
            {AFFILIATES.map(bk => (
              <a key={bk.name} href={bk.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <div className="sb-item" style={{ cursor: "pointer" }}>
                  <div>
                    <div className="sb-name">{bk.name}</div>
                    <div className="sb-league">{bk.offer}</div>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700 }}>Hämta →</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bookie strip */}
      <div className="bookie-strip2">
        {AFFILIATES.map(bk => (
          <a key={bk.name} className="bookie-strip2-item" href={bk.url} target="_blank" rel="noopener noreferrer">
            <div className="bookie-strip2-name">{bk.name}</div>
            <div className="bookie-strip2-offer">{bk.offer}</div>
            <button className="bookie-strip2-btn">Hämta bonus →</button>
          </a>
        ))}
      </div>

      <div style={{ padding: "12px 24px" }}>
        <div className="disclaimer3">
          ⚠️ Spela ansvarsfullt. Tipsbotten är ett analysverktyg — inte en garanti för vinst. Spela bara det du har råd att förlora. 18+ · Stödlinjen: 020-819 100 · spelpaus.se
        </div>
      </div>
    </div>
  );
}

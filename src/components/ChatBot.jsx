import { useState, useEffect, useRef } from "react";
import { getUSDtoSEK, formatSEK } from "../currency.js";

// ── CONFIG — replace with your Railway URL after deploying ──────────────────
const SERVER_URL = "https://edgebot-server-v2-production.up.railway.app";

const SPORTS = [
  { key: "soccer_epl", label: "Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { key: "soccer_spain_la_liga", label: "La Liga 🇪🇸" },
  { key: "soccer_italy_serie_a", label: "Serie A 🇮🇹" },
  { key: "soccer_germany_bundesliga", label: "Bundesliga 🇩🇪" },
  { key: "soccer_france_ligue_one", label: "Ligue 1 🇫🇷" },
  { key: "soccer_uefa_champs_league", label: "Champions League 🇪🇺" },
  { key: "americanfootball_nfl", label: "NFL 🇺🇸" },
  { key: "basketball_nba", label: "NBA 🇺🇸" },
  { key: "icehockey_nhl", label: "NHL 🇺🇸" },
  { key: "baseball_mlb", label: "MLB 🇺🇸" },
];

const QUICK_ACTIONS = [
  { label: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League bets", sport: "soccer_epl" },
  { label: "🇪🇸 La Liga bets", sport: "soccer_spain_la_liga" },
  { label: "🏀 NBA bets", sport: "basketball_nba" },
  { label: "🏒 NHL bets", sport: "icehockey_nhl" },
  { label: "⚽ Champions League", sport: "soccer_uefa_champs_league" },
  { label: "🏈 NFL bets", sport: "americanfootball_nfl" },
];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
    " at " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function fördelLabel(fördel) {
  if (fördel >= 8) return { text: "🔥 Starkt tips", color: "var(--win)" };
  if (fördel >= 5) return { text: "✅ Bra tips", color: "var(--accent)" };
  return { text: "⚡ Möjligt tips", color: "var(--accent3)" };
}

function BetCard({ bet }) {
  const [expanded, setExpanded] = useState(false);
  const label = fördelLabel(bet.bestBet.fördel);

  return (
    <div style={{
      background: "var(--surface)",
      border: `1px solid ${bet.bestBet.fördel >= 8 ? "rgba(110,231,183,0.3)" : bet.bestBet.fördel >= 5 ? "rgba(110,231,183,0.15)" : "var(--border)"}`,
      borderRadius: "var(--radius)",
      padding: "18px 20px",
      marginBottom: 10,
      transition: "all 0.2s",
    }}>
      {/* Match */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>
            {bet.homeTeam} vs {bet.awayTeam}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
            {bet.sport} · {formatDate(bet.commenceTime)}
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: label.color, flexShrink: 0, marginLeft: 12 }}>
          {label.text}
        </div>
      </div>

      {/* Best bet highlight */}
      <div style={{
        background: "rgba(110,231,183,0.06)",
        border: "1px solid rgba(110,231,183,0.15)",
        borderRadius: "var(--radius-sm)",
        padding: "14px 16px",
        marginBottom: 12,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Best bet
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: "var(--accent)", marginBottom: 2 }}>
              {bet.bestBet.name}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-dim)" }}>
              Bet at <strong style={{ color: "var(--text)" }}>{bet.bestBet.bestBookmaker}</strong>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 20, color: "var(--text)" }}>{bet.bestBet.decimal?.toFixed(2)}</div>
              <div style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase" }}>Decimal</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 20, color: "var(--accent2)" }}>{bet.bestBet.american}</div>
              <div style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase" }}>American</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 20, color: "var(--win)" }}>+{bet.bestBet.fördel}%</div>
              <div style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase" }}>Sannolikhetsfördel</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--surface2)", borderRadius: "var(--radius-xs)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Rekommenderad insats</span>
            <span style={{ fontWeight: 700, color: "var(--accent)", fontSize: 14 }}>{formatSEK(bet.bestBet.stake || 0, rate)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Möjlig vinst</span>
            <span style={{ fontWeight: 700, color: "var(--win)", fontSize: 14 }}>+${((bet.bestBet.stake || 0) * (bet.bestBet.decimal - 1)).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Total återbetalning</span>
            <span style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{formatSEK((bet.bestBet.stake || 0) * bet.bestBet.decimal, rate)}</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <span className="chip">Fair prob: {bet.bestBet.fair}%</span>
        <span className="chip">Implied: {bet.bestBet.implied}%</span>
        <span className="chip">Marginal: {bet.marginal}%</span>
        <span className="chip">{bet.bookmakerCount} books</span>
      </div>

      {/* Toggle more outcomes */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: "none", border: "none", color: "var(--text-dim)", fontSize: 12,
          cursor: "pointer", padding: 0, fontFamily: "var(--font)", fontWeight: 500,
        }}
      >
        {expanded ? "▲ Hide all outcomes" : "▼ Show all outcomes & odds"}
      </button>

      {expanded && (
        <div style={{ marginTop: 12 }}>
          {bet.bets.map((b) => (
            <div key={b.name} style={{
              padding: "10px 12px", background: "var(--surface2)", borderRadius: "var(--radius-xs)",
              marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8,
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{b.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Best at {b.bestBookmaker} · {b.numBooks} books</div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{b.decimal?.toFixed(3)}</div>
                  <div style={{ fontSize: 10, color: "var(--text-dim)" }}>Decimal</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: b.fördel > 0 ? "var(--win)" : "var(--text-dim)" }}>
                    {b.fördel > 0 ? "+" : ""}{b.fördel}%
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-dim)" }}>Fördel</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Message({ msg }) {
  if (msg.type === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <div style={{
          background: "linear-gradient(135deg, var(--accent), #34d399)",
          color: "#052e16",
          padding: "10px 16px",
          borderRadius: "18px 18px 4px 18px",
          maxWidth: "70%",
          fontSize: 14,
          fontWeight: 600,
        }}>
          {msg.text}
        </div>
      </div>
    );
  }

  if (msg.type === "bot") {
    return (
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "flex-start" }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent), var(--accent2))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, flexShrink: 0, color: "#052e16", fontWeight: 800,
        }}>⚡</div>
        <div style={{ flex: 1, maxWidth: "calc(100% - 42px)" }}>
          {msg.text && (
            <div style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              padding: "12px 16px",
              borderRadius: "4px 18px 18px 18px",
              fontSize: 14,
              lineHeight: 1.7,
              marginBottom: msg.bets ? 12 : 0,
              color: "var(--text)",
            }}>
              {msg.text}
            </div>
          )}
          {msg.bets && msg.bets.length > 0 && (
            <div>
              {msg.bets.map((bet) => <BetCard key={bet.id} bet={bet} />)}
            </div>
          )}
          {msg.bets && msg.bets.length === 0 && (
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              padding: "16px", borderRadius: "4px 18px 18px 18px",
              fontSize: 14, color: "var(--text-dim)",
            }}>
              No bra spel found right now for this league. The market may be efficient today, or there may be no upcoming fixtures. Try another league!
            </div>
          )}
        </div>
      </div>
    );
  }

  if (msg.type === "loading") {
    return (
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "flex-start" }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent), var(--accent2))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, flexShrink: 0, color: "#052e16", fontWeight: 800,
        }}>⚡</div>
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          padding: "14px 18px", borderRadius: "4px 18px 18px 18px",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{ display: "flex", gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "var(--accent)",
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
          <span style={{ fontSize: 13, color: "var(--text-dim)" }}>{msg.text}</span>
        </div>
      </div>
    );
  }

  return null;
}

export default function ChatBot({ isPremium = false, onNavigate }) {
  const [messages, setMessages] = useState([]);
  const [serverUrl, setServerUrl] = useState(SERVER_URL);
  const [serverConfigured, setServerConfigured] = useState(SERVER_URL !== "https://YOUR-RAILWAY-URL.railway.app");
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Inject bounce animation
    const style = document.createElement("style");
    style.textContent = `@keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }`;
    document.head.appendChild(style);

    if (serverConfigured) {
      // Welcome message + auto-load EPL
      setMessages([{
        type: "bot",
        text: "👋 Hej! Jag är Tipsbotten Bot — jag analyserar liveodds från 10+ spelbolag och hittar de bästa spelen åt dig. Laddar dagens bästa Premier League-tips...",
      }]);
      setTimeout(() => fetchBets("soccer_epl", "Premier League"), 800);
    }
  }, [serverConfigured]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (msg) => setMessages((m) => [...m, msg]);

  const replaceLastLoading = (newMsg) => {
    setMessages((m) => {
      const copy = [...m];
      const idx = copy.map((x) => x.type).lastIndexOf("loading");
      if (idx !== -1) copy[idx] = newMsg;
      else copy.push(newMsg);
      return copy;
    });
  };

  const [freeUsed, setFreeUsed] = useState(0);

  const fetchBets = async (sportKey, sportLabel) => {
    if (!isPremium && freeUsed >= 3) {
      addMessage({ type: "bot", text: "🔒 Du har nått gränsen för gratis sökningar idag. Uppgradera till Premium för obegränsad AI Bot-åtkomst!", bets: null });
      return;
    }
    setLoading(true);
    addMessage({ type: "loading", text: `Scanning ${sportLabel} odds across bookmakers...` });
    try {
      const url = `${serverUrl}/api/bets?sport=${sportKey}&market=h2h&minFördel=1.5`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json();
        replaceLastLoading({ type: "bot", text: `❌ Error: ${err.error || "Server issue. Make sure your server is running."}` });
        setLoading(false);
        return;
      }
      const data = await res.json();
      replaceLastLoading({
        type: "bot",
        text: data.bets.length > 0
          ? `Found ${data.bets.length} bra spel${data.bets.length > 1 ? "s" : ""} in ${sportLabel}. Here are the best opportunities right now:`
          : null,
        bets: data.bets,
      });
    } catch (e) {
      replaceLastLoading({ type: "bot", text: `❌ Could not reach the server. Make sure your Railway server is running at ${serverUrl}.` });
    }
    if (!isPremium) setFreeUsed(f => f + 1);
    setLoading(false);
  };

  const handleQuickAction = (action) => {
    if (loading) return;
    const sport = SPORTS.find((s) => s.key === action.sport);
    addMessage({ type: "user", text: action.label });
    setTimeout(() => fetchBets(action.sport, sport?.label || action.sport), 100);
  };

  const confirmServer = () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim().replace(/\/$/, "");
    setServerUrl(url);
    setServerConfigured(true);
  };

  // Server setup screen
  if (!serverConfigured) {
    return (
      <div style={{ maxWidth: 560, margin: "60px auto", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 32, marginBottom: 8 }}>
          Almost there!
        </div>
        <p style={{ color: "var(--text-dim)", marginBottom: 32, lineHeight: 1.7 }}>
          Enter your Railway server URL below. Once connected, Tipsbotten will automatically load today's best bra spel for you.
        </p>
        <div className="card" style={{ textAlign: "left" }}>
          <div className="label">Your Railway Server URL</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              className="input"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://tipsbotten-server-xxxx.railway.app"
              onKeyDown={(e) => e.key === "Enter" && confirmServer()}
            />
            <button className="btn btn-primary" onClick={confirmServer} style={{ whiteSpace: "nowrap" }}>
              Connect →
            </button>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
            Don't have a server yet? Follow the setup guide in the README included with your download.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)", minHeight: 500 }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 0 16px", borderBottom: "1px solid var(--border)", marginBottom: 20,
      }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24 }}>
            Tipsbotten <span style={{ color: "var(--accent)" }}>Chat</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Live bra spel · Updated in real time</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--win)", boxShadow: "0 0 8px var(--win)" }} />
          <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Live</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, scrollbarWidth: "thin", scrollbarColor: "var(--border) transparent" }}>
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        <div ref={bottomRef} />
      </div>

      {/* Quick action buttons */}
      <div style={{ paddingTop: 16, borderTop: "1px solid var(--border)", marginTop: 8 }}>
        <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
          Quick pick a league
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.sport}
              className="btn"
              style={{ fontSize: 12, padding: "7px 14px", opacity: loading ? 0.5 : 1 }}
              onClick={() => handleQuickAction(action)}
              disabled={loading}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

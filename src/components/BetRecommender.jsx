import { useState } from "react";

const ODDS_BASE = "https://api.the-odds-api.com/v4";

function decimalToImplied(d) { return d ? (1 / d) * 100 : null; }
function removeMarginal(probs) {
  const total = probs.reduce((s, p) => s + p, 0);
  return probs.map((p) => (p / total) * 100);
}
function kellyStake(bankroll, fairProb, decimal, frac = 0.25) {
  if (!decimal || decimal <= 1) return 0;
  const b = decimal - 1, p = fairProb / 100, q = 1 - p;
  const k = (b * p - q) / b;
  return Math.max(0, k * frac * bankroll);
}
function decimalToAmerican(d) {
  if (!d || d <= 1) return "N/A";
  if (d >= 2) return "+" + Math.round((d - 1) * 100);
  return "-" + Math.round(100 / (d - 1));
}

const SPORTS = [
  { key: "soccer_epl", label: "Premier League", country: "England" },
  { key: "soccer_spain_la_liga", label: "La Liga", country: "Spain" },
  { key: "soccer_italy_serie_a", label: "Serie A", country: "Italy" },
  { key: "soccer_germany_bundesliga", label: "Bundesliga", country: "Germany" },
  { key: "soccer_france_ligue_one", label: "Ligue 1", country: "France" },
  { key: "soccer_uefa_champs_league", label: "Champions League", country: "Europe" },
  { key: "soccer_uefa_europa_league", label: "Europa League", country: "Europe" },
  { key: "americanfootball_nfl", label: "NFL", country: "USA" },
  { key: "basketball_nba", label: "NBA", country: "USA" },
  { key: "icehockey_nhl", label: "NHL", country: "USA" },
  { key: "baseball_mlb", label: "MLB", country: "USA" },
];

const MARKETS = [
  { key: "h2h", label: "Match Winner (1X2)" },
  { key: "spreads", label: "Spread / Handicap" },
  { key: "totals", label: "Over/Under" },
];

function analyseEvent(event, marketKey, bankroll, minFördel) {
  const bookmakers = event.bookmakers || [];
  if (!bookmakers.length) return null;
  const outcomeMap = {};
  bookmakers.forEach((bk) => {
    const market = bk.markets?.find((m) => m.key === marketKey);
    if (!market) return;
    market.outcomes.forEach((o) => {
      if (!outcomeMap[o.name]) outcomeMap[o.name] = [];
      outcomeMap[o.name].push({ bookmaker: bk.title, decimal: o.price, point: o.point });
    });
  });
  const outcomeNames = Object.keys(outcomeMap);
  if (outcomeNames.length < 2) return null;
  const bestOdds = {};
  outcomeNames.forEach((name) => {
    bestOdds[name] = [...outcomeMap[name]].sort((a, b) => b.decimal - a.decimal)[0];
  });
  const avgImplied = {};
  outcomeNames.forEach((name) => {
    const odds = outcomeMap[name];
    avgImplied[name] = odds.reduce((s, o) => s + decimalToImplied(o.decimal), 0) / odds.length;
  });
  const fairProbs = removeMarginal(outcomeNames.map((n) => avgImplied[n]));
  const fairMap = {};
  outcomeNames.forEach((n, i) => { fairMap[n] = fairProbs[i]; });
  const marginal = outcomeNames.map((n) => avgImplied[n]).reduce((s, p) => s + p, 0) - 100;
  const bets = outcomeNames.map((name) => {
    const best = bestOdds[name];
    const fair = fairMap[name];
    const implied = decimalToImplied(best.decimal);
    const fördel = fair - implied;
    const stake = fördel > 0 ? kellyStake(bankroll, fair, best.decimal, 0.25) : 0;
    return { name, best, fair, implied, fördel, stake, numBooks: outcomeMap[name].length, allOdds: outcomeMap[name] };
  });
  const bestBet = bets.reduce((b, curr) => (!b || curr.fördel > b.fördel) ? curr : b, null);
  return { event, bets, bestBet, fairMap, marginal, bookmakerCount: bookmakers.length };
}

export default function BetRecommender() {
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [keyConfirmed, setKeyConfirmed] = useState(false);
  const [sport, setSport] = useState("soccer_epl");
  const [market, setMarket] = useState("h2h");
  const [bankroll, setBankroll] = useState("1000");
  const [minFördel, setMinFördel] = useState("2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [requestsRemaining, setRequestsRemaining] = useState(null);
  const [debugOutput, setDebugOutput] = useState("");
  const [debugLoading, setDebugLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const saveKey = () => {
    if (!apiKey.trim()) return;
    setSavedKey(apiKey.trim());
    setKeyConfirmed(true);
  };

  const fetchAndAnalyse = async () => {
    if (!savedKey) return;
    setLoading(true);
    setError("");
    setRecommendations([]);
    try {
      const url = `${ODDS_BASE}/sports/${sport}/odds/?apiKey=${savedKey}&regions=eu,uk,us&markets=${market}&oddsFormat=decimal`;
      const res = await fetch(url);
      const remaining = res.headers.get("x-requests-remaining");
      if (remaining) setRequestsRemaining(remaining);
      const data = await res.json();
      if (!res.ok) { setError(data.message || "API error " + res.status); setLoading(false); return; }
      if (!data.length) { setError("No upcoming fixtures found for this sport right now. Try another league."); setLoading(false); return; }
      const bank = parseFloat(bankroll) || 1000;
      const minE = parseFloat(minFördel) || 2;
      const analysed = data
        .map((event) => analyseEvent(event, market, bank, minE))
        .filter((r) => r && r.bestBet && r.bestBet.fördel >= minE && r.bookmakerCount >= 2)
        .sort((a, b) => b.bestBet.fördel - a.bestBet.fördel);
      setRecommendations(analysed);
      if (!analysed.length) setError("No bra spel found above " + minE + "% fördel. Try lowering the minimum fördel.");
    } catch (e) {
      setError("Network error: " + e.message);
    }
    setLoading(false);
  };

  const runDebug = async () => {
    if (!savedKey) return;
    setDebugLoading(true);
    setDebugOutput("Testing...\n");
    try {
      const res = await fetch(`${ODDS_BASE}/sports/?apiKey=${savedKey}`);
      const remaining = res.headers.get("x-requests-remaining");
      const data = await res.json();
      if (!res.ok) {
        setDebugOutput("Error: " + JSON.stringify(data));
      } else {
        const active = data.filter((s) => s.active).length;
        setDebugOutput(
          "API connected\nRequests remaining: " + (remaining ?? "unknown") +
          "\nActive sports: " + active +
          "\nKey is working — click Find Bästa Spel."
        );
        setRequestsRemaining(remaining);
      }
    } catch (e) {
      setDebugOutput("Connection failed: " + e.message);
    }
    setDebugLoading(false);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
      " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  const fördelColor = (e) => e >= 8 ? "win" : e >= 4 ? "accent" : "accent2";
  const confidenceBadge = (e) => {
    if (e >= 8) return { label: "STARKT TIPS", cls: "badge-win" };
    if (e >= 5) return { label: "BRA TIPS", cls: "badge-value" };
    return { label: "MARGINAL", cls: "badge-pending" };
  };

  return (
    <div>
      <div className="page-header"><div className="page-title">AI Bet <span>Recommender</span></div><div className="page-sub">Live odds from 10+ bookmakers — finds value by comparing markets in real time</div></div>

      {!keyConfirmed ? (
        <div className="card" style={{ maxWidth: 520, marginBottom: 20 }}>
          <div className="card-title">The Odds API Setup</div>
          <p style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 14, lineHeight: 1.7 }}>
            Get your free key at <span className="accent">the-odds-api.com</span> — click Get API Key.<br />
            500 free requests/month, no credit card needed.
          </p>
          <div style={{ marginBottom: 12 }}>
            <div className="label">API Key</div>
            <input className="input" type="password" value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your key here"
              onKeyDown={(e) => e.key === "Enter" && saveKey()} />
          </div>
          <button className="btn btn-primary" onClick={saveKey} style={{ width: "100%", justifyContent: "center" }}>
            Confirm & Continue
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <span className="badge badge-win">✓ API Key Active</span>
          {requestsRemaining !== null && <span className="chip">{requestsRemaining} requests left this month</span>}
          <button className="btn" style={{ fontSize: 10, padding: "3px 10px" }}
            onClick={() => { setKeyConfirmed(false); setSavedKey(""); setDebugOutput(""); }}>Change Key</button>
          <button className="btn" style={{ fontSize: 10, padding: "3px 10px" }}
            onClick={runDebug} disabled={debugLoading}>{debugLoading ? "Testing..." : "🔍 Test Connection"}</button>
          {debugOutput && (
            <div style={{ width: "100%", marginTop: 4, padding: "12px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 3 }}>
              <pre style={{ fontSize: 11, color: "var(--text-dim)", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{debugOutput}</pre>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">Settings</div>
        <div className="grid-4" style={{ marginBottom: 16 }}>
          <div style={{ gridColumn: "span 2" }}>
            <div className="label">Sport / League</div>
            <select className="input" value={sport} onChange={(e) => setSport(e.target.value)}>
              {SPORTS.map((s) => <option key={s.key} value={s.key}>{s.label} — {s.country}</option>)}
            </select>
          </div>
          <div>
            <div className="label">Market</div>
            <select className="input" value={market} onChange={(e) => setMarket(e.target.value)}>
              {MARKETS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <div className="label">Min Fördel %</div>
            <input className="input" type="number" value={minFördel} step="0.5" min="0" onChange={(e) => setMinFördel(e.target.value)} />
          </div>
        </div>
        <div style={{ marginBottom: 16, maxWidth: 200 }}>
          <div className="label">Bankroll (kr)</div>
          <input className="input" type="number" value={bankroll} onChange={(e) => setBankroll(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={fetchAndAnalyse}
          disabled={loading || !keyConfirmed}
          style={{ justifyContent: "center", padding: "12px 28px", opacity: loading ? 0.6 : 1 }}>
          {loading ? "⟳ Fetching live odds..." : "◈ HITTA BÄSTA SPEL"}
        </button>
        {error && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.25)", borderRadius: 3, fontSize: 12, color: "var(--loss)" }}>
            {error}
          </div>
        )}
      </div>

      {recommendations.length > 0 && (
        <div>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <div className="page-title" style={{ fontSize: 28 }}>VALUE BETS</div>
            <span className="badge badge-value">{recommendations.length} found</span>
          </div>
          {recommendations.map((rec) => {
            const conf = confidenceBadge(rec.bestBet.fördel);
            const isExpanded = expandedId === rec.event.id;
            return (
              <div key={rec.event.id} className="card" style={{
                marginBottom: 16,
                borderColor: rec.bestBet.fördel >= 8 ? "var(--win)" : rec.bestBet.fördel >= 4 ? "rgba(232,255,71,0.4)" : "var(--border)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                      {rec.event.home_team} <span className="dim">vs</span> {rec.event.away_team}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span className="dim" style={{ fontSize: 11 }}>{formatDate(rec.event.commence_time)}</span>
                      <span className="chip">{rec.bookmakerCount} bookmakers</span>
                      <span className="chip">Marginal: {rec.marginal.toFixed(2)}%</span>
                    </div>
                  </div>
                  <span className={`badge ${conf.cls}`}>{conf.label}</span>
                </div>

                <div className="grid-2" style={{ gap: 16 }}>
                  <div>
                    <div className="label" style={{ marginBottom: 8 }}>All Outcomes</div>
                    {rec.bets.map((bet) => {
                      const isBest = bet.name === rec.bestBet.name;
                      return (
                        <div key={bet.name} style={{
                          marginBottom: 10, padding: "10px 12px", borderRadius: 3,
                          background: isBest ? "rgba(232,255,71,0.06)" : "var(--surface2)",
                          border: `1px solid ${isBest ? "rgba(232,255,71,0.35)" : "var(--border)"}`,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                            <span style={{ fontSize: 12, fontWeight: isBest ? 600 : 400 }}>{bet.name}</span>
                            {isBest && <span className="badge badge-value" style={{ fontSize: 9 }}>BÄST ODDS</span>}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}>
                            <span className="accent">Fair: {bet.fair.toFixed(1)}%</span>
                            <span className="dim">Implied: {bet.implied.toFixed(1)}%</span>
                            <span className={fördelColor(bet.fördel)}>Fördel: {bet.fördel > 0 ? "+" : ""}{bet.fördel.toFixed(2)}%</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${bet.fair}%`, background: isBest ? "var(--accent)" : "var(--accent2)", opacity: 0.5 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <div className="label" style={{ marginBottom: 8 }}>Recommended Bet</div>
                    <div className="stat-block" style={{ marginBottom: 12 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{rec.bestBet.name}</div>
                      <div className="grid-2" style={{ gap: 8 }}>
                        <div>
                          <div className={`stat-value ${fördelColor(rec.bestBet.fördel)}`} style={{ fontSize: 22 }}>+{rec.bestBet.fördel.toFixed(2)}%</div>
                          <div className="stat-label">Fördel</div>
                        </div>
                        <div>
                          <div className="stat-value accent2" style={{ fontSize: 22 }}>{rec.bestBet.best.decimal?.toFixed(3)}</div>
                          <div className="stat-label">Best decimal odds</div>
                        </div>
                        <div>
                          <div className="stat-value" style={{ fontSize: 22 }}>{decimalToAmerican(rec.bestBet.best.decimal)}</div>
                          <div className="stat-label">American odds</div>
                        </div>
                        <div>
                          <div className="stat-value accent" style={{ fontSize: 22 }}>{rec.bestBet.stake.toFixed(2)} kr</div>
                          <div className="stat-label">Rekommenderad insats (¼)</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: "10px 12px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 3, marginBottom: 12 }}>
                      <div className="label" style={{ marginBottom: 4 }}>Best odds at</div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700 }}>{rec.bestBet.best.bookmaker}</div>
                      <div className="dim" style={{ fontSize: 11, marginTop: 2 }}>{rec.bestBet.numBooks} bookmakers offering this</div>
                    </div>
                    <button className="btn" style={{ width: "100%", justifyContent: "center", fontSize: 10 }}
                      onClick={() => setExpandedId(isExpanded ? null : rec.event.id)}>
                      {isExpanded ? "▲ Hide odds comparison" : "▼ Compare all bookmaker odds"}
                    </button>
                    {isExpanded && (
                      <div style={{ marginTop: 10 }}>
                        <table>
                          <thead><tr><th>Bookmaker</th><th>Odds</th><th>Implied</th></tr></thead>
                          <tbody>
                            {rec.bestBet.allOdds.sort((a, b) => b.decimal - a.decimal).map((o, i) => (
                              <tr key={o.bookmaker}>
                                <td style={{ fontSize: 11 }}>{i === 0 && <span className="accent">★ </span>}{o.bookmaker}</td>
                                <td className={i === 0 ? "accent" : ""} style={{ fontSize: 11, fontWeight: i === 0 ? 600 : 400 }}>{o.decimal?.toFixed(3)}</td>
                                <td className="dim" style={{ fontSize: 11 }}>{decimalToImplied(o.decimal).toFixed(1)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && recommendations.length === 0 && !error && (
        <div className="card"><div className="empty-state">Select a sport and click Find Bästa Spel</div></div>
      )}

      <div style={{ marginTop: 24, padding: "12px 16px", background: "var(--surface2)", borderRadius: 3, border: "1px solid var(--border)" }}>
        <p style={{ fontSize: 10, color: "var(--text-faint)", lineHeight: 1.7, margin: 0 }}>
          ⚠ Value is calculated by comparing the best available odds against the consensus market probability. This does not guarantee wins. Always bet within your means and verify odds before placing.
        </p>
      </div>
    </div>
  );
}

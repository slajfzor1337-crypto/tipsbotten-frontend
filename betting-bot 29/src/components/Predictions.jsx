import { useState, useEffect } from "react";
import { getUSDtoSEK, formatSEK } from "../currency.js";

const SERVER_URL = "https://tipsbotten-server-v2-production.up.railway.app";

const SPORTS = [
  { key: "soccer_epl", label: "Premier League", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { key: "soccer_spain_la_liga", label: "La Liga", emoji: "🇪🇸" },
  { key: "soccer_italy_serie_a", label: "Serie A", emoji: "🇮🇹" },
  { key: "soccer_germany_bundesliga", label: "Bundesliga", emoji: "🇩🇪" },
  { key: "soccer_france_ligue_one", label: "Ligue 1", emoji: "🇫🇷" },
  { key: "soccer_uefa_champs_league", label: "Champions League", emoji: "🇪🇺" },
  { key: "basketball_nba", label: "NBA", emoji: "🏀" },
  { key: "americanfootball_nfl", label: "NFL", emoji: "🏈" },
  { key: "icehockey_nhl", label: "NHL", emoji: "🏒" },
];

function decimalToImplied(d) { return d ? (1 / d) * 100 : 0; }
function removeMarginal(probs) {
  const total = probs.reduce((s, p) => s + p, 0);
  return probs.map((p) => (p / total) * 100);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
    " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function confidenceBar(pct) {
  const color = pct >= 70 ? "var(--win)" : pct >= 55 ? "var(--accent)" : "var(--accent3)";
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "var(--text-dim)" }}>Confidence</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function PredictionCard({ pred, onAddToAcca, inAcca }) {
  const [expanded, setExpanded] = useState(false);
  const conf = pred.confidence;
  const confColor = conf >= 70 ? "var(--win)" : conf >= 55 ? "var(--accent)" : "var(--accent3)";
  const confLabel = conf >= 70 ? "🔥 High confidence" : conf >= 55 ? "✅ Good pick" : "⚡ Speculative";

  return (
    <div style={{
      background: "var(--surface)",
      border: `1px solid ${inAcca ? "rgba(110,231,183,0.4)" : "var(--border)"}`,
      borderRadius: "var(--radius)",
      padding: "20px",
      marginBottom: 12,
      transition: "all 0.2s",
      position: "relative",
    }}>
      {inAcca && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          background: "rgba(110,231,183,0.15)", border: "1px solid rgba(110,231,183,0.3)",
          borderRadius: 100, padding: "2px 10px", fontSize: 10, fontWeight: 700, color: "var(--accent)",
        }}>✓ IN ACCA</div>
      )}

      {/* Match header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 4 }}>{formatDate(pred.commenceTime)}</div>
        <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 2 }}>
          {pred.homeTeam} <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>vs</span> {pred.awayTeam}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: confColor }}>{confLabel}</span>
      </div>

      {/* Prediction highlight */}
      <div style={{
        background: "rgba(110,231,183,0.05)",
        border: "1px solid rgba(110,231,183,0.12)",
        borderRadius: "var(--radius-sm)",
        padding: "14px 16px",
        marginBottom: 14,
      }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          AI Prediction
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "var(--accent)", marginBottom: 2 }}>{pred.pick}</div>
            <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Predicted score: <strong style={{ color: "var(--text)" }}>{pred.score}</strong></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 800, fontSize: 22, color: "var(--text)" }}>{pred.bestOdds?.toFixed(2)}</div>
            <div style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase" }}>Best odds</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>at {pred.bestBookmaker}</div>
          </div>
        </div>
        {confidenceBar(conf)}
      </div>

      {/* Key stats */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {pred.keyStats?.map((stat, i) => (
          <span key={i} className="chip" style={{ fontSize: 11 }}>{stat}</span>
        ))}
      </div>

      {/* Reasoning toggle */}
      <button onClick={() => setExpanded(!expanded)}
        style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "var(--font)", fontWeight: 500, marginBottom: expanded ? 10 : 0 }}>
        {expanded ? "▲ Hide analysis" : "▼ Show AI analysis"}
      </button>

      {expanded && (
        <div style={{ padding: "12px 14px", background: "var(--surface2)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--text-dim)", lineHeight: 1.7, marginBottom: 12 }}>
          {pred.reasoning}
        </div>
      )}

      {/* Add to acca button */}
      <button
        className={`btn ${inAcca ? "btn-danger" : "btn-primary"}`}
        style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
        onClick={() => onAddToAcca(pred)}
      >
        {inAcca ? "✕ Remove from Acca" : "+ Add to Accumulator"}
      </button>
    </div>
  );
}

function AccumulatorSlip({ legs, onRemove, onClear }) {
  if (!legs.length) return null;
  const totalOdds = legs.reduce((acc, l) => acc * l.bestOdds, 1);
  const avgConf = Math.round(legs.reduce((s, l) => s + l.confidence, 0) / legs.length);
  const [stake, setStake] = useState("10");
  const payout = (parseFloat(stake) || 0) * totalOdds;
  const profit = payout - (parseFloat(stake) || 0);
  const accaLabel = legs.length === 2 ? "Double" : legs.length === 3 ? "Treble" : `${legs.length}-fold Accumulator`;

  return (
    <div style={{
      position: "sticky", top: 80,
      background: "var(--surface)",
      border: "1px solid rgba(110,231,183,0.25)",
      borderRadius: "var(--radius)",
      padding: "20px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700 }}>
            {accaLabel} <span style={{ color: "var(--accent)" }}>Slip</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{legs.length} selection{legs.length > 1 ? "s" : ""}</div>
        </div>
        <button className="btn btn-danger" style={{ fontSize: 10, padding: "4px 10px" }} onClick={onClear}>Clear all</button>
      </div>

      {/* Legs */}
      <div style={{ marginBottom: 16 }}>
        {legs.map((leg, i) => (
          <div key={leg.id} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0", borderBottom: i < legs.length - 1 ? "1px solid var(--border)" : "none",
          }}>
            <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {leg.pick}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {leg.homeTeam} vs {leg.awayTeam}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ fontWeight: 700, color: "var(--accent2)" }}>{leg.bestOdds?.toFixed(2)}</span>
              <button onClick={() => onRemove(leg.id)}
                style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {/* Total odds */}
      <div style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "12px 14px", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Total odds</span>
          <span style={{ fontWeight: 800, fontSize: 20, color: "var(--accent)" }}>{totalOdds.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Avg confidence</span>
          <span style={{ fontWeight: 700, fontSize: 13, color: avgConf >= 65 ? "var(--win)" : "var(--accent3)" }}>{avgConf}%</span>
        </div>
      </div>

      {/* Stake calculator */}
      <div style={{ marginBottom: 14 }}>
        <div className="label">Insats (kr)</div>
        <input className="input" type="number" value={stake} onChange={(e) => setStake(e.target.value)} placeholder="10" />
        {parseFloat(stake) > 0 && (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span className="dim">Potential return</span>
              <span style={{ fontWeight: 700, color: "var(--accent2)" }}>{payout.toFixed(2)} kr</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span className="dim">Potential profit</span>
              <span style={{ fontWeight: 700, color: "var(--win)" }}>+${profit.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "10px 12px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: "var(--radius-sm)", fontSize: 11, color: "var(--text-dim)", lineHeight: 1.6 }}>
        ⚠️ Accumulators are high risk. All legs must win. Consider single bets for safer returns.
      </div>
    </div>
  );
}

export default function Predictions({ isPremium = false, onNavigate }) {
  const [sport, setSport] = useState("soccer_epl");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [accaLegs, setAccaLegs] = useState([]);
  const [generated, setGenerated] = useState(false);
  const [rate, setRate] = useState(10.3);
  useEffect(() => { getUSDtoSEK().then(r => setRate(r)); }, []);

  const generate = async () => {
    setLoading(true);
    setError("");
    setPredictions([]);
    setAccaLegs([]);
    setGenerated(false);

    try {
      // Call server which fetches odds + runs Claude AI predictions
      // Step 2: call server which handles Claude AI
      const predRes = await fetch(`${SERVER_URL}/api/predictions?sport=${sport}`);
      if (!predRes.ok) {
        const err = await predRes.json();
        setError(err.error || "Prediction error");
        setLoading(false);
        return;
      }
      const predData = await predRes.json();
      const merged = predData.predictions || [];

      // Sort by confidence
      merged.sort((a, b) => b.confidence - a.confidence);
      setPredictions(merged);

      // Auto-build best accumulator (top 3 by confidence, all above 55%)
      const accaCandidates = merged.filter((p) => p.confidence >= 55).slice(0, 4);
      setAccaLegs(accaCandidates);
      setGenerated(true);

    } catch (e) {
      setError("Error generating predictions: " + e.message);
    }
    setLoading(false);
  };

  const toggleAcca = (pred) => {
    setAccaLegs((legs) => {
      const exists = legs.find((l) => l.id === pred.id);
      if (exists) return legs.filter((l) => l.id !== pred.id);
      return [...legs, pred];
    });
  };

  const removeFromAcca = (id) => setAccaLegs((l) => l.filter((x) => x.id !== id));

  return (
    <div>
      {!isPremium && (
        <div style={{ background: "rgba(255,214,0,0.06)", border: "1px solid rgba(255,214,0,0.25)", borderRadius: "var(--radius)", padding: "32px", textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 28, marginBottom: 8, color: "var(--gold)" }}>PREMIUM FUNKTION</div>
          <p style={{ fontSize: 14, color: "#aaa", marginBottom: 20 }}>AI Predictions är exklusivt för Premium-medlemmar. Uppgradera för att få tillgång till fullständiga matchanalyser och acca-byggaren.</p>
          <button className="btn btn-primary btn-lg" onClick={() => onNavigate && onNavigate("premium")}
            style={{ background: "linear-gradient(135deg, #ffd600, #ffab00)", color: "#000" }}>
            Bli Premium — 99 kr/mån →
          </button>
        </div>
      )}
      <div className="page-header">
        <div className="page-title">AI <span>Predictions</span></div>
        <div className="page-sub">Claude AI analyses upcoming matches and builds the best accumulator for you</div>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Generate Predictions</div>
        <div className="grid-2" style={{ marginBottom: 16 }}>
          <div>
            <div className="label">Sport / League</div>
            <select className="input" value={sport} onChange={(e) => setSport(e.target.value)}>
              {SPORTS.map((s) => <option key={s.key} value={s.key}>{s.emoji} {s.label}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="btn btn-primary" onClick={generate} disabled={loading}
              style={{ width: "100%", justifyContent: "center", padding: "12px", opacity: loading ? 0.7 : 1 }}>
              {loading ? "⟳ Analysing matches..." : "★ Generate AI Predictions"}
            </button>
          </div>
        </div>
        {error && <div className="alert-error">{error}</div>}

        {/* How it works */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
          {[
            { icon: "📡", text: "Pulls live odds from 10+ bookmakers" },
            { icon: "🧠", text: "Claude AI analyses each match" },
            { icon: "🎯", text: "Picks winner + predicted score" },
            { icon: "🏆", text: "Auto-builds best accumulator" },
          ].map((item) => (
            <div key={item.text} className="chip" style={{ fontSize: 12, padding: "6px 12px" }}>
              {item.icon} {item.text}
            </div>
          ))}
        </div>
      </div>

      {generated && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
          {/* Predictions list */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>
                {predictions.length} Match Predictions
              </div>
              <span className="badge badge-value">{SPORTS.find(s => s.key === sport)?.emoji} {SPORTS.find(s => s.key === sport)?.label}</span>
            </div>
            {predictions.map((pred) => (
              <PredictionCard
                key={pred.id}
                pred={pred}
                onAddToAcca={toggleAcca}
                inAcca={!!accaLegs.find((l) => l.id === pred.id)}
              />
            ))}
          </div>

          {/* Accumulator slip */}
          <div>
            {accaLegs.length > 0 ? (
              <AccumulatorSlip
                legs={accaLegs}
                onRemove={removeFromAcca}
                onClear={() => setAccaLegs([])}
              />
            ) : (
              <div className="card" style={{ textAlign: "center", padding: 32 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎟️</div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Accumulator Slip</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
                  Click "+ Add to Accumulator" on any prediction to build your bet slip
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!generated && !loading && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <div className="empty-state-title">Ready to predict</div>
            <div className="empty-state-sub">Select a league and click Generate AI Predictions</div>
          </div>
        </div>
      )}

      <div className="disclaimer" style={{ marginTop: 24 }}>
        ⚠️ AI predictions are generated for entertainment and research purposes. They do not guarantee wins. Always bet responsibly.
      </div>
    </div>
  );
}

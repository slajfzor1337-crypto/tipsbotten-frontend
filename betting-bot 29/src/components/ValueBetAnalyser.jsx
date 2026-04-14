import { useState, useEffect } from "react";
import { getUSDtoSEK, formatSEK } from "../currency.js";

// Convert American odds to decimal
function americanToDecimal(american) {
  const n = parseFloat(american);
  if (isNaN(n)) return null;
  return n > 0 ? n / 100 + 1 : 100 / Math.abs(n) + 1;
}

// Convert decimal odds to implied probability
function decimalToImplied(decimal) {
  return decimal ? (1 / decimal) * 100 : null;
}

// Convert American odds to implied probability directly
function americanToImplied(american) {
  const n = parseFloat(american);
  if (isNaN(n)) return null;
  return n > 0 ? (100 / (n + 100)) * 100 : (Math.abs(n) / (Math.abs(n) + 100)) * 100;
}

// Remove marginal from a set of implied probabilities
function removeMarginal(probs) {
  const total = probs.reduce((s, p) => s + p, 0);
  return probs.map((p) => (p / total) * 100);
}

// insatsberäkning stake
function kelly(fördel, decimal, fraction = 1) {
  if (!decimal || decimal <= 1) return 0;
  const b = decimal - 1;
  const p = fördel / 100;
  const q = 1 - p;
  const k = (b * p - q) / b;
  return Math.max(0, k * fraction * 100);
}

const FORMAT_OPTIONS = ["American", "Decimal", "Fractional"];
const SPORTS = ["NFL", "NBA", "MLB", "NHL", "Soccer", "Tennis", "MMA", "Golf", "Other"];

function parseOdds(raw, format) {
  if (!raw) return null;
  const n = parseFloat(raw);
  if (isNaN(n)) return null;
  if (format === "American") return americanToDecimal(n);
  if (format === "Decimal") return n;
  if (format === "Fractional") {
    const parts = raw.split("/");
    if (parts.length === 2) return parseFloat(parts[0]) / parseFloat(parts[1]) + 1;
    return null;
  }
  return null;
}

function OddsInput({ label, value, onChange, format }) {
  const placeholder = format === "American" ? "+150 or -110" : format === "Decimal" ? "2.50" : "3/2";
  return (
    <div>
      <div className="label">{label}</div>
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export default function ValueBetAnalyser() {
  const [format, setFormat] = useState("American");
  const [sport, setSport] = useState("NFL");
  const [homeOdds, setHomeOdds] = useState("");
  const [awayOdds, setAwayOdds] = useState("");
  const [drawOdds, setDrawOdds] = useState("");
  const [myOdds, setMyOdds] = useState("");
  const [kellyFrac, setKellyFrac] = useState("0.25");
  const [bankroll, setBankroll] = useState("1000");
  const [betName, setBetName] = useState("");
  const [result, setResult] = useState(null);
  const [rate, setRate] = useState(10.3);
  useEffect(() => { getUSDtoSEK().then(r => setRate(r)); }, []);
  const [history, setHistory] = useState([]);
  const [hasDraw, setHasDraw] = useState(false);

  const analyse = () => {
    const dHome = parseOdds(homeOdds, format);
    const dAway = parseOdds(awayOdds, format);
    const dDraw = hasDraw ? parseOdds(drawOdds, format) : null;
    const dMy = parseOdds(myOdds, format);

    if (!dHome || !dAway || !dMy) {
      alert("Please enter valid home, away, and your odds.");
      return;
    }

    const impliedHome = decimalToImplied(dHome);
    const impliedAway = decimalToImplied(dAway);
    const impliedDraw = dDraw ? decimalToImplied(dDraw) : null;

    const rawProbs = [impliedHome, impliedAway, ...(impliedDraw ? [impliedDraw] : [])];
    const fairProbs = removeMarginal(rawProbs);
    const fairHome = fairProbs[0];
    const fairAway = fairProbs[1];
    const marginal = rawProbs.reduce((s, p) => s + p, 0) - 100;

    const myImplied = decimalToImplied(dMy);
    const fairProb = fairHome; // User is always betting on "home" / selection 1
    const fördel = fairProb - myImplied;
    const hasValue = fördel > 0;

    const kFrac = parseFloat(kellyFrac) || 0.25;
    const bank = parseFloat(bankroll) || 1000;
    const kellyPct = kelly(fairProb, dMy, kFrac);
    const kellyStake = (kellyPct / 100) * bank;

    const r = {
      betName: betName || `${sport} Bet`,
      sport,
      format,
      homeOdds,
      awayOdds,
      drawOdds: hasDraw ? drawOdds : null,
      myOdds,
      dMy,
      impliedHome,
      impliedAway,
      impliedDraw,
      fairHome,
      fairAway,
      marginal,
      myImplied,
      fairProb,
      fördel,
      hasValue,
      kellyPct,
      kellyStake,
      timestamp: new Date().toLocaleTimeString(),
    };

    setResult(r);
  };

  const addToHistory = () => {
    if (!result) return;
    setHistory((h) => [{ ...result, id: Date.now() }, ...h]);
    setResult(null);
    setBetName("");
    setHomeOdds("");
    setAwayOdds("");
    setDrawOdds("");
    setMyOdds("");
  };

  const clearHistory = () => setHistory([]);

  return (
    <div>
      <div className="page-header"><div className="page-title">Value Bet <span>Analyser</span></div><div className="page-sub">Detect fördel by comparing market implied probability vs. your assessment</div></div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Input Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="card-title">Market Odds Input</div>
            <div className="grid-2" style={{ marginBottom: 14 }}>
              <div>
                <div className="label">Odds Format</div>
                <select className="input" value={format} onChange={(e) => setFormat(e.target.value)}>
                  {FORMAT_OPTIONS.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <div className="label">Sport</div>
                <select className="input" value={sport} onChange={(e) => setSport(e.target.value)}>
                  {SPORTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div className="label">Bet / Event Name (optional)</div>
              <input className="input" value={betName} onChange={(e) => setBetName(e.target.value)} placeholder="e.g. Chiefs vs Eagles ML" />
            </div>

            <div className="grid-2" style={{ marginBottom: 14 }}>
              <OddsInput label="Team 1 / Home (market)" value={homeOdds} onChange={setHomeOdds} format={format} />
              <OddsInput label="Team 2 / Away (market)" value={awayOdds} onChange={setAwayOdds} format={format} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <input type="checkbox" id="draw" checked={hasDraw} onChange={(e) => setHasDraw(e.target.checked)}
                style={{ accentColor: "var(--accent)" }} />
              <label htmlFor="draw" style={{ fontSize: 11, color: "var(--text-dim)", cursor: "pointer" }}>Include draw outcome (soccer)</label>
            </div>

            {hasDraw && (
              <div style={{ marginBottom: 14 }}>
                <OddsInput label="Draw (market)" value={drawOdds} onChange={setDrawOdds} format={format} />
              </div>
            )}

            <hr className="divider" />
            <OddsInput label="Your odds (the bet you're considering)" value={myOdds} onChange={setMyOdds} format={format} />
          </div>

          <div className="card">
            <div className="card-title">Kelly Settings</div>
            <div className="grid-2">
              <div>
                <div className="label">Bankroll (kr)</div>
                <input className="input" type="number" value={bankroll} onChange={(e) => setBankroll(e.target.value)} />
              </div>
              <div>
                <div className="label">Kelly Fraction</div>
                <select className="input" value={kellyFrac} onChange={(e) => setKellyFrac(e.target.value)}>
                  <option value="1">Full insats (1x)</option>
                  <option value="0.5">Halv insats (0.5x)</option>
                  <option value="0.25">Kvarts insats (0.25x)</option>
                  <option value="0.1">Tenth Kelly (0.1x)</option>
                </select>
              </div>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "13px" }} onClick={analyse}>
            ◈ ANALYSE BET
          </button>
        </div>

        {/* Results Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {result ? (
            <>
              <div className="card" style={{ borderColor: result.hasValue ? "var(--accent)" : "var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div className="card-title" style={{ marginBottom: 0, borderBottom: "none", paddingBottom: 0 }}>Analysis Result</div>
                  <span className={`badge ${result.hasValue ? "badge-value" : "badge-novalue"}`}>
                    {result.hasValue ? "✓ LÖNSAMT SPEL" : "✗ EJ LÖNSAMT"}
                  </span>
                </div>

                <div className="grid-2" style={{ marginBottom: 16 }}>
                  <div className="stat-block">
                    <div className={`stat-value ${result.hasValue ? "accent" : "loss"}`}>
                      {result.fördel > 0 ? "+" : ""}{result.fördel.toFixed(2)}%
                    </div>
                    <div className="stat-label">Fördel</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-value accent2">{result.fairProb.toFixed(1)}%</div>
                    <div className="stat-label">Fair Probability (no-marginal)</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-value dim">{result.myImplied.toFixed(1)}%</div>
                    <div className="stat-label">Implied (your odds)</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-value push">{result.marginal.toFixed(2)}%</div>
                    <div className="stat-label">Book Marginal</div>
                  </div>
                </div>

                <hr className="divider" />

                <div style={{ marginBottom: 16 }}>
                  <div className="label" style={{ marginBottom: 8 }}>Probability Breakdown</div>
                  {[
                    { name: "Team 1 / Home", fair: result.fairHome, implied: result.impliedHome },
                    { name: "Team 2 / Away", fair: result.fairAway, implied: result.impliedAway },
                    ...(result.impliedDraw ? [{ name: "Draw", fair: 100 - result.fairHome - result.fairAway, implied: result.impliedDraw }] : []),
                  ].map((row) => (
                    <div key={row.name} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{row.name}</span>
                        <span style={{ fontSize: 11 }}>
                          <span className="dim">{row.implied.toFixed(1)}% implied</span>
                          {" → "}
                          <span className="accent2">{row.fair.toFixed(1)}% fair</span>
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${row.fair}%`, background: "var(--accent2)" }} />
                      </div>
                    </div>
                  ))}
                </div>

                {result.hasValue && (
                  <>
                    <hr className="divider" />
                    <div style={{ marginBottom: 4 }}>
                      <div className="label" style={{ marginBottom: 10 }}>Insatsberäkning Stake</div>
                      <div className="grid-2">
                        <div className="stat-block">
                          <div className="stat-value accent">{result.kellyPct.toFixed(2)}%</div>
                          <div className="stat-label">of bankroll</div>
                        </div>
                        <div className="stat-block">
                          <div className="stat-value accent">${result.kellyStake.toFixed(2)}</div>
                          <div className="stat-label">suggested stake</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button className="btn btn-primary" style={{ justifyContent: "center" }} onClick={addToHistory}>
                + SAVE TO HISTORY
              </button>
            </>
          ) : (
            <div className="card" style={{ flex: 1 }}>
              <div className="empty-state">
                Enter odds and click<br />Analyse Bet to see results
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="card-title" style={{ marginBottom: 0, borderBottom: "none", paddingBottom: 0 }}>
                  Saved Analyses ({history.length})
                </div>
                <button className="btn btn-danger" style={{ padding: "4px 10px", fontSize: 10 }} onClick={clearHistory}>Clear</button>
              </div>
              <hr className="divider" />
              <div className="scrollable">
                <table>
                  <thead>
                    <tr>
                      <th>Bet</th>
                      <th>Fördel</th>
                      <th>Fair Prob</th>
                      <th>Stake</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{h.betName}</div>
                          <div className="chip" style={{ marginTop: 3 }}>{h.sport}</div>
                        </td>
                        <td className={h.fördel > 0 ? "win" : "loss"}>
                          {h.fördel > 0 ? "+" : ""}{h.fördel.toFixed(2)}%
                        </td>
                        <td className="dim">{h.fairProb.toFixed(1)}%</td>
                        <td className="accent">{formatSEK(h.kellyStake, rate)}</td>
                        <td><span className={`badge ${h.hasValue ? "badge-value" : "badge-novalue"}`}>{h.hasValue ? "YES" : "NO"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

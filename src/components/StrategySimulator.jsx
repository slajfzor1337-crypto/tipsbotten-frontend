import { useState, useEffect, useMemo } from "react";
import { getUSDtoSEK, formatSEK } from "../currency.js";

function americanToDecimal(american) {
  const n = parseFloat(american);
  if (isNaN(n)) return null;
  return n > 0 ? n / 100 + 1 : 100 / Math.abs(n) + 1;
}

function kellyStake(bankroll, prob, decimal, fraction) {
  if (!decimal || decimal <= 1) return 0;
  const b = decimal - 1;
  const p = prob / 100;
  const q = 1 - p;
  const k = (b * p - q) / b;
  return Math.max(0, k * fraction * bankroll);
}

function runSimulation({ startBankroll, numBets, winProb, avgOdds, strategy, kellyFrac, flatStake, seed }) {
  const decimal = americanToDecimal(avgOdds) || 1.909;
  let bankroll = startBankroll;
  const history = [startBankroll];
  let wins = 0;
  let rng = seed || 42;

  // Simple seeded random
  function rand() {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff;
    return (rng >>> 0) / 0xffffffff;
  }

  for (let i = 0; i < numBets; i++) {
    if (bankroll <= 0) { history.push(0); continue; }

    let stake = 0;
    if (strategy === "kelly") stake = kellyStake(bankroll, winProb, decimal, kellyFrac);
    else if (strategy === "half_kelly") stake = kellyStake(bankroll, winProb, decimal, kellyFrac * 0.5);
    else if (strategy === "flat") stake = Math.min(flatStake, bankroll);
    else if (strategy === "proportional") stake = bankroll * (flatStake / 100);
    else if (strategy === "martingale") stake = Math.min(flatStake * Math.pow(2, wins === 0 ? 0 : 0), bankroll); // simplified

    stake = Math.min(stake, bankroll);
    if (stake <= 0) { history.push(bankroll); continue; }

    const won = rand() < winProb / 100;
    if (won) { bankroll += stake * (decimal - 1); wins++; }
    else { bankroll -= stake; }

    history.push(Math.max(0, bankroll));
  }

  return history;
}

function runMonteCarlo({ startBankroll, numBets, winProb, avgOdds, strategy, kellyFrac, flatStake, runs = 100 }) {
  const results = [];
  for (let i = 0; i < runs; i++) {
    const h = runSimulation({ startBankroll, numBets, winProb, avgOdds, strategy, kellyFrac, flatStake, seed: i * 31337 + 7 });
    results.push(h[h.length - 1]);
  }
  results.sort((a, b) => a - b);
  return {
    median: results[Math.floor(runs / 2)],
    p10: results[Math.floor(runs * 0.1)],
    p90: results[Math.floor(runs * 0.9)],
    bust: results.filter((r) => r <= 0).length,
    mean: results.reduce((s, r) => s + r, 0) / runs,
    results,
  };
}

const STRATEGIES = [
  { id: "kelly", label: "Full Kelly" },
  { id: "half_kelly", label: "Half Kelly" },
  { id: "flat", label: "Flat Staking ($)" },
  { id: "proportional", label: "Proportional (%)" },
];

const CHART_COLORS = {
  kelly: "#e8ff47",
  half_kelly: "#47ffc8",
  flat: "#ff6b35",
  proportional: "#a78bfa",
};

function MiniLineChart({ series, width = 500, height = 160, colors }) {
  if (!series || !series.length) return null;
  const allVals = series.flatMap((s) => s.data);
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const range = maxV - minV || 1;
  const n = series[0].data.length;

  const toX = (i) => (i / (n - 1)) * width;
  const toY = (v) => height - ((v - minV) / range) * height;

  const pathFor = (data) => {
    return data.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(" ");
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        {series.map((s) => (
          <linearGradient key={s.id} id={`grad-${s.id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={colors[s.id]} stopOpacity="0.2" />
            <stop offset="100%" stopColor={colors[s.id]} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={width} y1={height * f} y2={height * f} stroke="#2a2a32" strokeWidth="1" />
      ))}
      {series.map((s) => (
        <g key={s.id}>
          <path d={`${pathFor(s.data)} L ${toX(n - 1)} ${height} L 0 ${height} Z`} fill={`url(#grad-${s.id})`} />
          <path d={pathFor(s.data)} fill="none" stroke={colors[s.id]} strokeWidth="2" strokeLinejoin="round" />
        </g>
      ))}
      {/* Starting line */}
      <line x1="0" x2={width} y1={toY(series[0].data[0])} y2={toY(series[0].data[0])} stroke="#3a3a4e" strokeWidth="1" strokeDasharray="4,4" />
    </svg>
  );
}

function HistogramChart({ results, width = 400, height = 80 }) {
  const bins = 20;
  const min = Math.min(...results);
  const max = Math.max(...results);
  const range = max - min || 1;
  const counts = Array(bins).fill(0);
  results.forEach((r) => {
    const i = Math.min(Math.floor(((r - min) / range) * bins), bins - 1);
    counts[i]++;
  });
  const maxCount = Math.max(...counts);
  const barW = width / bins;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {counts.map((c, i) => {
        const barH = (c / maxCount) * height;
        const x = i * barW;
        const binVal = min + (i / bins) * range;
        const color = binVal >= parseFloat(results.starting || 1000) ? "#47ffc8" : "#ff4757";
        return <rect key={i} x={x + 1} y={height - barH} width={barW - 2} height={barH} fill={color} opacity="0.7" rx="1" />;
      })}
    </svg>
  );
}

export default function StrategySimulator() {
  const [config, setConfig] = useState({
    startBankroll: 1000,
    numBets: 200,
    winProb: 52,
    avgOdds: "-110",
    kellyFrac: 0.25,
    flatStake: 50,
    mcRuns: 200,
  });
  const [selectedStrategies, setSelectedStrategies] = useState(["kelly", "flat"]);
  const [simResults, setSimResults] = useState(null);
  const [activeCompare, setActiveCompare] = useState(null);

  const setField = (k, v) => setConfig((c) => ({ ...c, [k]: v }));

  const toggleStrategy = (id) => {
    setSelectedStrategies((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  };

  const run = () => {
    const results = {};
    selectedStrategies.forEach((strat) => {
      const single = runSimulation({ ...config, strategy: strat });
      const mc = runMonteCarlo({ ...config, strategy: strat, runs: config.mcRuns });
      results[strat] = { single, mc };
    });
    setSimResults(results);
    setActiveCompare(selectedStrategies[0]);
  };

  const chartSeries = useMemo(() => {
    if (!simResults) return [];
    return Object.entries(simResults).map(([id, { single }]) => ({ id, data: single }));
  }, [simResults]);

  const decimal = americanToDecimal(config.avgOdds) || 1.909;
  const impliedWinPct = (1 / decimal) * 100;
  const edge = config.winProb - impliedWinPct;
  const expectedROI = edge > 0 ? (edge / impliedWinPct) * (decimal - 1) * 100 : 0;

  return (
    <div>
      <div className="page-header"><div className="page-title">Strategy <span>Simulator</span></div><div className="page-sub">Compare staking strategies with Monte Carlo analysis</div></div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Config */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="card-title">Simulation Parameters</div>

            <div className="grid-2" style={{ marginBottom: 12 }}>
              <div>
                <div className="label">Starting Bankroll (kr)</div>
                <input className="input" type="number" value={config.startBankroll} onChange={(e) => setField("startBankroll", parseFloat(e.target.value))} />
              </div>
              <div>
                <div className="label">Number of Bets</div>
                <input className="input" type="number" value={config.numBets} onChange={(e) => setField("numBets", parseInt(e.target.value))} min="10" max="1000" />
              </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 12 }}>
              <div>
                <div className="label">Win Probability (%)</div>
                <input className="input" type="number" value={config.winProb} step="0.1" min="1" max="99"
                  onChange={(e) => setField("winProb", parseFloat(e.target.value))} />
              </div>
              <div>
                <div className="label">Average Odds (American)</div>
                <input className="input" value={config.avgOdds} onChange={(e) => setField("avgOdds", e.target.value)} placeholder="-110" />
              </div>
            </div>

            <div style={{ padding: "10px 14px", background: "var(--surface2)", borderRadius: 3, border: "1px solid var(--border)", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span className="dim" style={{ fontSize: 11 }}>Implied win % from odds</span>
                <span style={{ fontSize: 11 }}>{impliedWinPct.toFixed(1)}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="dim" style={{ fontSize: 11 }}>Edge</span>
                <span className={`${edge > 0 ? "win" : "loss"}`} style={{ fontSize: 11, fontWeight: 600 }}>
                  {edge > 0 ? "+" : ""}{edge.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 12 }}>
              <div>
                <div className="label">Kelly Fraction</div>
                <select className="input" value={config.kellyFrac} onChange={(e) => setField("kellyFrac", parseFloat(e.target.value))}>
                  <option value="1">Full (1x)</option>
                  <option value="0.5">Half (0.5x)</option>
                  <option value="0.25">Quarter (0.25x)</option>
                  <option value="0.1">Tenth (0.1x)</option>
                </select>
              </div>
              <div>
                <div className="label">Flat Stake / Prop %</div>
                <input className="input" type="number" value={config.flatStake}
                  onChange={(e) => setField("flatStake", parseFloat(e.target.value))}
                  placeholder="kr  or %" />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className="label">Monte Carlo Runs</div>
              <select className="input" value={config.mcRuns} onChange={(e) => setField("mcRuns", parseInt(e.target.value))}>
                <option value="50">50 runs (fast)</option>
                <option value="200">200 runs</option>
                <option value="500">500 runs (detailed)</option>
              </select>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Strategies to Compare</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {STRATEGIES.map((s) => (
                <div key={s.id}
                  onClick={() => toggleStrategy(s.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                    background: selectedStrategies.includes(s.id) ? "rgba(232,255,71,0.05)" : "var(--surface2)",
                    border: `1px solid ${selectedStrategies.includes(s.id) ? CHART_COLORS[s.id] : "var(--border)"}`,
                    borderRadius: 3, cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: CHART_COLORS[s.id], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, flex: 1 }}>{s.label}</span>
                  {selectedStrategies.includes(s.id) && <span style={{ color: "var(--accent)", fontSize: 10 }}>✓</span>}
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 13 }} onClick={run}>
            ◆ RUN SIMULATION
          </button>
        </div>

        {/* Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {simResults ? (
            <>
              <div className="card">
                <div className="card-title">Bankroll Over Time (Single Run)</div>
                <MiniLineChart series={chartSeries} colors={CHART_COLORS} height={180} />
                <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                  {chartSeries.map((s) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 12, height: 3, background: CHART_COLORS[s.id], borderRadius: 2 }} />
                      <span style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {STRATEGIES.find((x) => x.id === s.id)?.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategy tabs */}
              <div className="card">
                <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                  {selectedStrategies.map((id) => (
                    <button key={id} className={`btn ${activeCompare === id ? "btn-primary" : ""}`}
                      style={{ fontSize: 10, padding: "5px 12px", borderColor: activeCompare !== id ? CHART_COLORS[id] : undefined, color: activeCompare !== id ? CHART_COLORS[id] : undefined }}
                      onClick={() => setActiveCompare(id)}>
                      {STRATEGIES.find((s) => s.id === id)?.label}
                    </button>
                  ))}
                </div>

                {activeCompare && simResults[activeCompare] && (() => {
                  const mc = simResults[activeCompare].mc;
                  const finalBankroll = simResults[activeCompare].single[simResults[activeCompare].single.length - 1];
                  const pnl = finalBankroll - config.startBankroll;
                  return (
                    <div>
                      <div className="grid-2" style={{ marginBottom: 16 }}>
                        <div className="stat-block">
                          <div className={`stat-value ${finalBankroll >= config.startBankroll ? "win" : "loss"}`}>
                            ${finalBankroll.toFixed(0)}
                          </div>
                          <div className="stat-label">Final Bankroll (single run)</div>
                        </div>
                        <div className="stat-block">
                          <div className={`stat-value ${pnl >= 0 ? "accent" : "loss"}`}>
                            {pnl >= 0 ? "+" : ""}${pnl.toFixed(0)}
                          </div>
                          <div className="stat-label">P&L (single run)</div>
                        </div>
                      </div>

                      <div className="card-title" style={{ marginTop: 8 }}>Monte Carlo ({config.mcRuns} Runs)</div>
                      <div className="grid-2" style={{ marginBottom: 12 }}>
                        <div className="stat-block">
                          <div className="stat-value accent2">{mc.median.toFixed(0)} kr</div>
                          <div className="stat-label">Median outcome</div>
                        </div>
                        <div className="stat-block">
                          <div className="stat-value dim">{mc.mean.toFixed(0)} kr</div>
                          <div className="stat-label">Mean outcome</div>
                        </div>
                        <div className="stat-block">
                          <div className="stat-value win">{mc.p90.toFixed(0)} kr</div>
                          <div className="stat-label">90th percentile</div>
                        </div>
                        <div className="stat-block">
                          <div className="stat-value push">{mc.p10.toFixed(0)} kr</div>
                          <div className="stat-label">10th percentile</div>
                        </div>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span className="label" style={{ marginBottom: 0 }}>Outcome Distribution</span>
                          <span className={`${mc.bust / config.mcRuns > 0.2 ? "loss" : "dim"}`} style={{ fontSize: 10 }}>
                            Bust rate: {((mc.bust / config.mcRuns) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <HistogramChart results={mc.results} />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                          <span className="dim" style={{ fontSize: 9 }}>Worst</span>
                          <span className="dim" style={{ fontSize: 9 }}>Best</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </>
          ) : (
            <div className="card" style={{ flex: 1 }}>
              <div className="empty-state">
                Configure parameters and click<br />Run Simulation to see results
              </div>

              <hr className="divider" />
              <div style={{ padding: "0 12px" }}>
                <div className="card-title">Quick Guide</div>
                {[
                  ["Kelly Criterion", "Stakes proportionally to edge. Maximises log growth but high variance."],
                  ["Half Kelly", "More conservative. Reduces variance significantly, sacrifices some growth."],
                  ["Flat Staking", "Fixed dollar amount per bet. Simple, predictable."],
                  ["Proportional", "Fixed % of bankroll. Grows and shrinks with your roll."],
                ].map(([name, desc]) => (
                  <div key={name} style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>{name}</div>
                    <div className="dim" style={{ fontSize: 11, lineHeight: 1.5 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

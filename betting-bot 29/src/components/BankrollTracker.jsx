import { useState, useEffect, useMemo } from "react";
import { getUSDtoSEK, formatSEK } from "../currency.js";

const SPORTS = ["NFL", "NBA", "MLB", "NHL", "Soccer", "Tennis", "MMA", "Golf", "Other"];
const BET_TYPES = ["Moneyline", "Spread", "Over/Under", "Parlay", "Prop", "Futures", "Other"];
const RESULTS = ["Pending", "Win", "Loss", "Push", "Void"];

function formatPL(n) {
  if (n === 0) return "—";
  return (n > 0 ? "+" : "") + "kr " + Math.abs(n).toFixed(2);
}

function plClass(n) {
  if (n > 0) return "win";
  if (n < 0) return "loss";
  return "dim";
}

export default function BankrollTracker() {
  const [startingBankroll, setStartingBankroll] = useState("1000");
  const [bets, setBets] = useState([
    { id: 1, date: "2025-01-10", sport: "NFL", type: "Moneyline", description: "Chiefs -110", stake: 110, odds: "-110", result: "Win", pnl: 100 },
    { id: 2, date: "2025-01-12", sport: "NBA", type: "Spread", description: "Lakers +5.5", stake: 55, odds: "-110", result: "Loss", pnl: -55 },
    { id: 3, date: "2025-01-14", sport: "NFL", type: "Over/Under", description: "Bills/Dolphins O48.5", stake: 100, odds: "-110", result: "Win", pnl: 90.91 },
  ]);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    sport: "NFL",
    type: "Moneyline",
    description: "",
    stake: "",
    odds: "",
    result: "Pending",
  });

  const [editId, setEditId] = useState(null);
  const [filterSport, setFilterSport] = useState("All");
  const [filterResult, setFilterResult] = useState("All");

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function calcPnl(stake, odds, result) {
    if (result === "Pending" || result === "Void") return 0;
    if (result === "Push") return 0;
    if (result === "Loss") return -parseFloat(stake) || 0;
    const s = parseFloat(stake) || 0;
    const o = parseFloat(odds) || 0;
    if (result === "Win") {
      if (o > 0) return (s * o) / 100;
      if (o < 0) return (s * 100) / Math.abs(o);
      return s * (o - 1); // decimal
    }
    return 0;
  }

  const addBet = () => {
    if (!form.description || !form.stake) return;
    const pnl = calcPnl(form.stake, form.odds, form.result);
    if (editId !== null) {
      setBets((b) => b.map((bet) => bet.id === editId ? { ...form, id: editId, stake: parseFloat(form.stake), pnl } : bet));
      setEditId(null);
    } else {
      setBets((b) => [...b, { ...form, id: Date.now(), stake: parseFloat(form.stake), pnl }]);
    }
    setForm({ date: new Date().toISOString().split("T")[0], sport: "NFL", type: "Moneyline", description: "", stake: "", odds: "", result: "Pending" });
  };

  const startEdit = (bet) => {
    setForm({ ...bet, stake: String(bet.stake) });
    setEditId(bet.id);
  };

  const deleteBet = (id) => setBets((b) => b.filter((bet) => bet.id !== id));

  const updateResult = (id, result) => {
    setBets((b) => b.map((bet) => {
      if (bet.id !== id) return bet;
      const pnl = calcPnl(bet.stake, bet.odds, result);
      return { ...bet, result, pnl };
    }));
  };

  const filteredBets = useMemo(() => {
    return bets.filter((b) => {
      if (filterSport !== "All" && b.sport !== filterSport) return false;
      if (filterResult !== "All" && b.result !== filterResult) return false;
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [bets, filterSport, filterResult]);

  const stats = useMemo(() => {
    const settled = bets.filter((b) => b.result !== "Pending" && b.result !== "Void");
    const wins = settled.filter((b) => b.result === "Win").length;
    const losses = settled.filter((b) => b.result === "Loss").length;
    const totalStaked = settled.reduce((s, b) => s + b.stake, 0);
    const totalPnl = settled.reduce((s, b) => s + b.pnl, 0);
    const roi = totalStaked > 0 ? (totalPnl / totalStaked) * 100 : 0;
    const winRate = settled.length > 0 ? (wins / (wins + losses)) * 100 : 0;
    const currentBankroll = parseFloat(startingBankroll) + totalPnl;
    const pending = bets.filter((b) => b.result === "Pending").length;
    const pendingStake = bets.filter((b) => b.result === "Pending").reduce((s, b) => s + b.stake, 0);
    return { wins, losses, totalStaked, totalPnl, roi, winRate, currentBankroll, pending, pendingStake, settled: settled.length };
  }, [bets, startingBankroll]);

  const resultBadge = (r) => {
    if (r === "Win") return <span className="badge badge-win">WIN</span>;
    if (r === "Loss") return <span className="badge badge-loss">LOSS</span>;
    if (r === "Push") return <span className="badge badge-pending">PUSH</span>;
    if (r === "Pending") return <span className="badge badge-pending">PENDING</span>;
    return <span className="badge">{r}</span>;
  };

  return (
    <div>
      <div className="page-header"><div className="page-title">Bankroll <span>Tracker</span></div><div className="page-sub">Log bets, track performance, monitor ROI</div></div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-block">
          <div className={`stat-value ${stats.currentBankroll >= parseFloat(startingBankroll) ? "win" : "loss"}`}>
            ${stats.currentBankroll.toFixed(2)}
          </div>
          <div className="stat-label">Current Bankroll</div>
        </div>
        <div className="stat-block">
          <div className={`stat-value ${plClass(stats.totalPnl)}`}>{formatPL(stats.totalPnl)}</div>
          <div className="stat-label">Total P&L</div>
        </div>
        <div className="stat-block">
          <div className={`stat-value ${stats.roi >= 0 ? "accent2" : "loss"}`}>
            {stats.roi >= 0 ? "+" : ""}{stats.roi.toFixed(1)}%
          </div>
          <div className="stat-label">ROI</div>
        </div>
        <div className="stat-block">
          <div className="stat-value accent">{stats.winRate.toFixed(1)}%</div>
          <div className="stat-label">Win Rate ({stats.wins}W / {stats.losses}L)</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Add Bet Form */}
        <div className="card">
          <div className="card-title">{editId ? "✎ Edit Bet" : "+ Log New Bet"}</div>

          <div className="grid-2" style={{ marginBottom: 12 }}>
            <div>
              <div className="label">Starting Bankroll</div>
              <input className="input" type="number" value={startingBankroll} onChange={(e) => setStartingBankroll(e.target.value)} />
            </div>
            <div>
              <div className="label">Date</div>
              <input className="input" type="date" value={form.date} onChange={(e) => setField("date", e.target.value)} />
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 12 }}>
            <div>
              <div className="label">Sport</div>
              <select className="input" value={form.sport} onChange={(e) => setField("sport", e.target.value)}>
                {SPORTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div className="label">Bet Type</div>
              <select className="input" value={form.type} onChange={(e) => setField("type", e.target.value)}>
                {BET_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div className="label">Description / Selection</div>
            <input className="input" value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="e.g. Chiefs ML, Celtics -3.5" />
          </div>

          <div className="grid-2" style={{ marginBottom: 12 }}>
            <div>
              <div className="label">Insats (kr)</div>
              <input className="input" type="number" value={form.stake} onChange={(e) => setField("stake", e.target.value)} placeholder="100" />
            </div>
            <div>
              <div className="label">Odds (American)</div>
              <input className="input" value={form.odds} onChange={(e) => setField("odds", e.target.value)} placeholder="-110" />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div className="label">Result</div>
            <select className="input" value={form.result} onChange={(e) => setField("result", e.target.value)}>
              {RESULTS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={addBet}>
              {editId ? "✓ Update Bet" : "+ Add Bet"}
            </button>
            {editId && (
              <button className="btn" onClick={() => { setEditId(null); setForm({ date: new Date().toISOString().split("T")[0], sport: "NFL", type: "Moneyline", description: "", stake: "", odds: "", result: "Pending" }); }}>
                Cancel
              </button>
            )}
          </div>

          {stats.pending > 0 && (
            <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(255,165,2,0.07)", border: "1px solid rgba(255,165,2,0.2)", borderRadius: 3 }}>
              <span className="push">{stats.pending} pending bet{stats.pending > 1 ? "s" : ""}</span>
              <span className="dim"> · ${stats.pendingStake.toFixed(2)} i risk</span>
            </div>
          )}
        </div>

        {/* Bet Log */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="card-title" style={{ marginBottom: 0, borderBottom: "none", paddingBottom: 0 }}>
              Bet History ({filteredBets.length})
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <select className="input" style={{ width: "auto", fontSize: 10, padding: "4px 28px 4px 8px" }} value={filterSport} onChange={(e) => setFilterSport(e.target.value)}>
                <option>All</option>
                {SPORTS.map((s) => <option key={s}>{s}</option>)}
              </select>
              <select className="input" style={{ width: "auto", fontSize: 10, padding: "4px 28px 4px 8px" }} value={filterResult} onChange={(e) => setFilterResult(e.target.value)}>
                <option>All</option>
                {RESULTS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <hr className="divider" style={{ margin: "0 0 12px" }} />

          {filteredBets.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">◉</div><div className="empty-state-title">No bets logged yet</div><div className="empty-state-sub">Add your first bet using the form</div></div>
          ) : (
            <div className="scrollable" style={{ flex: 1 }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Bet</th>
                    <th>Stake</th>
                    <th>P&L</th>
                    <th>Result</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBets.map((bet) => (
                    <tr key={bet.id}>
                      <td>
                        <div className="dim" style={{ fontSize: 11 }}>{bet.date}</div>
                        <div className="chip" style={{ marginTop: 2 }}>{bet.sport}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 12 }}>{bet.description}</div>
                        <div className="dim" style={{ fontSize: 10 }}>{bet.type} · {bet.odds}</div>
                      </td>
                      <td className="dim">{bet.stake.toFixed(2)} kr</td>
                      <td className={plClass(bet.pnl)} style={{ fontWeight: 600 }}>
                        {bet.result === "Pending" ? <span className="dim">—</span> : formatPL(bet.pnl)}
                      </td>
                      <td>
                        {bet.result === "Pending" ? (
                          <select
                            className="input"
                            style={{ fontSize: 10, padding: "3px 24px 3px 6px", width: "auto" }}
                            value={bet.result}
                            onChange={(e) => updateResult(bet.id, e.target.value)}
                          >
                            {RESULTS.map((r) => <option key={r}>{r}</option>)}
                          </select>
                        ) : resultBadge(bet.result)}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn" style={{ padding: "3px 8px", fontSize: 10 }} onClick={() => startEdit(bet)}>✎</button>
                          <button className="btn btn-danger" style={{ padding: "3px 8px", fontSize: 10 }} onClick={() => deleteBet(bet.id)}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Performance by Sport */}
      {bets.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-title">Performance by Sport</div>
          <div className="grid-3">
            {SPORTS.filter((s) => bets.some((b) => b.sport === s)).map((sport) => {
              const sportBets = bets.filter((b) => b.sport === sport && b.result !== "Pending" && b.result !== "Void");
              if (!sportBets.length) return null;
              const pnl = sportBets.reduce((s, b) => s + b.pnl, 0);
              const wins = sportBets.filter((b) => b.result === "Win").length;
              const staked = sportBets.reduce((s, b) => s + b.stake, 0);
              const roi = staked > 0 ? (pnl / staked) * 100 : 0;
              return (
                <div key={sport} className="stat-block">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>{sport}</span>
                    <span className={plClass(pnl)} style={{ fontWeight: 600 }}>{formatPL(pnl)}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span className="dim" style={{ fontSize: 10 }}>{wins}/{sportBets.length} wins</span>
                    <span className={roi >= 0 ? "win" : "loss"} style={{ fontSize: 10 }}>ROI {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

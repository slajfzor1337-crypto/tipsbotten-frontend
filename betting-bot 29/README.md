# ⬡ EDGEBOT — Sports Betting Intelligence

A full-featured sports betting tool with three modules:

## Features

### ◈ Value Bet Analyser
- Enter market odds from any bookmaker (American, Decimal, or Fractional format)
- Automatic vig removal to calculate true fair probabilities
- Edge calculation: your odds vs. the fair probability
- Kelly Criterion stake suggestion with configurable fractions
- Save analyses to a session history

### ◉ Bankroll Tracker
- Log every bet with date, sport, type, odds, and stake
- Update results inline (Win / Loss / Push / Void)
- Real-time P&L, ROI, and win rate stats
- Filter by sport or result
- Performance breakdown by sport

### ◆ Strategy Simulator
- Compare up to 4 staking strategies side-by-side:
  - **Full Kelly** — maximises log growth, highest variance
  - **Half Kelly** — conservative, lower variance
  - **Flat Staking** — fixed dollar amount
  - **Proportional** — fixed % of current bankroll
- Monte Carlo simulation (50–500 runs)
- Outcome distribution histogram
- Median, mean, 10th/90th percentile results
- Bust rate analysis

---

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# → Open http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deploy

The built app is a static site (`dist/` folder after `npm run build`). You can deploy it to:
- **Vercel**: `vercel deploy`
- **Netlify**: Drag and drop `dist/` folder
- **GitHub Pages**: Push `dist/` contents to `gh-pages` branch
- **Any static host**: Serve the `dist/` folder

---

## Tech Stack
- React 18 + Vite
- Pure CSS (no component library)
- JetBrains Mono + Barlow Condensed fonts
- Zero external dependencies beyond React

---

## Notes on Odds Formats

**American**: +150 (underdog) or -110 (favourite)  
**Decimal**: 2.50 (includes stake)  
**Fractional**: 3/2 (profit / stake)

The vig removal uses the standard proportional method: each implied probability is divided by the total book percentage to get the fair probability.

---

*EDGEBOT is a decision-support tool. Always gamble responsibly.*

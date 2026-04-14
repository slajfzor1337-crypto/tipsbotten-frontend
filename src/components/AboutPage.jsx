export default function AboutPage() {
  return (
    <div>
      <div className="page-header">
        <div className="page-title">About <span>Tipsbotten</span></div>
        <div className="page-sub">Built to level the playing field between bettors and bookmakers</div>
      </div>

      {/* Mission */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Our Mission</div>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-dim)", marginBottom: 16 }}>
          Bookmakers employ entire teams of mathematicians and data scientists to set odds that guarantee them a profit.
          Tipsbotten gives individual bettors access to the same kind of analytical tools — for free.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-dim)" }}>
          We believe in transparent, data-driven betting. Not tips. Not predictions. Just mathematics.
        </p>
      </div>

      {/* How it works */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">How Tipsbotten Finds Value</div>
        <div className="grid-2" style={{ gap: 20 }}>
          {[
            {
              icon: "📡",
              title: "1. Pull live odds",
              desc: "Tipsbotten connects to The Odds API and pulls real-time odds from up to 10 major bookmakers simultaneously — Bet365, Pinnacle, Unibet, William Hill and more.",
            },
            {
              icon: "🔢",
              title: "2. Calculate consensus probability",
              desc: "By averaging the implied probabilities across all bookmakers, we get the market's collective view of what the true probability of each outcome is.",
            },
            {
              icon: "✂️",
              title: "3. Remove the marginal",
              desc: "Every bookmaker builds a margin (marginal) into their odds. Tipsbotten strips this out using proportional marginal removal to get the fair, no-margin probability.",
            },
            {
              icon: "⚡",
              title: "4. Find the fördel",
              desc: "If the best available odds imply a lower probability than the fair probability, you have an fördel. Tipsbotten flags these opportunities and ranks them by fördel size.",
            },
            {
              icon: "📐",
              title: "5. Size the bet",
              desc: "Using the Insatsberäkning — a mathematically proven staking formula — Tipsbotten calculates the optimal amount to bet based on your fördel and bankroll.",
            },
            {
              icon: "📊",
              title: "6. Track & improve",
              desc: "Log every bet in the Bankroll Tracker. Over time, your data will show you which sports, markets, and strategies are genuinely profitable for you.",
            },
          ].map((item) => (
            <div key={item.title} style={{ display: "flex", gap: 14 }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{item.title}</div>
                <p style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kelly explained */}
      <div className="card" style={{ marginBottom: 24, borderColor: "rgba(110,231,183,0.2)" }}>
        <div className="card-title">What is the Insatsberäkning?</div>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-dim)", marginBottom: 16 }}>
          The Insatsberäkning is a mathematical formula developed by John L. Kelly Jr. at Bell Labs in 1956. It calculates the optimal fraction of your bankroll to bet in order to maximise long-term growth.
        </p>
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "16px 20px", marginBottom: 16, fontFamily: "monospace", fontSize: 13, color: "var(--accent)" }}>
          Kelly % = (fördel × odds − 1) ÷ (odds − 1)
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.8, color: "var(--text-dim)" }}>
          Tipsbotten uses <strong style={{ color: "var(--text)" }}>Kvarts insats (0.25×)</strong> by default — a conservative version that significantly reduces variance while preserving most of the growth benefit.
          This is the recommended starting point for most bettors.
        </p>
      </div>

      {/* What is marginal */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">What is Marginal / Overround?</div>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-dim)", marginBottom: 14 }}>
          Marginal (also called overround or juice) is the bookmaker's built-in profit margin. If a coin flip should be 50/50,
          a bookmaker might price it at -110 / -110 in American odds — meaning you'd need to risk $110 to win $100 on either side.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-dim)" }}>
          That -110 / -110 market has an implied total of 104.7% — the extra 4.7% is the marginal. Tipsbotten removes this to show you the true fair probability.
          A typical soccer market has a marginal of 4–8%. Pinnacle is known for the lowest marginal in the industry (~2–3%).
        </p>
      </div>

      {/* Responsible gambling */}
      <div className="card" style={{ marginBottom: 24, borderColor: "rgba(251,191,36,0.2)" }}>
        <div className="card-title">⚠️ Responsible Gambling</div>
        <div className="grid-2" style={{ gap: 16 }}>
          {[
            { title: "Set a budget", desc: "Only ever bet money you can afford to lose completely. Your bankroll should be separate from living expenses." },
            { title: "Fördel ≠ guaranteed wins", desc: "Even a 5% fördel means you still lose ~47.5% of the time. Short-term variance is always significant." },
            { title: "Track everything", desc: "Use the Bankroll Tracker for every bet. If your ROI is consistently negative over 200+ bets, reassess your approach." },
            { title: "Know when to stop", desc: "If betting stops being enjoyable or affects your finances or wellbeing, please reach out for help." },
          ].map((item) => (
            <div key={item.title} style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "14px 16px" }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 5 }}>{item.title}</div>
              <p style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, fontSize: 13, color: "var(--text-dim)" }}>
          Need help? Contact <strong style={{ color: "var(--text)" }}>GamCare (gamcare.org.uk)</strong> or the{" "}
          <strong style={{ color: "var(--text)" }}>National Problem Gambling Helpline: 1-800-522-4700</strong>
        </div>
      </div>

      {/* FAQ */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Frequently Asked Questions</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            { q: "Is Tipsbotten free?", a: "Yes, completely. You just need a free API key from the-odds-api.com which gives you 500 requests per month at no cost." },
            { q: "Which bookmakers does Tipsbotten support?", a: "Tipsbotten pulls odds from Bet365, Pinnacle, Unibet, William Hill, Betfair, DraftKings, FanDuel, Bovada, Betway, Bwin and more — depending on which are available for your selected sport and region." },
            { q: "Why do I need an API key?", a: "Tipsbotten uses The Odds API to fetch real-time odds data. They provide a free tier with 500 requests/month — plenty for regular use. The key ensures fair usage of their service." },
            { q: "How accurate is the model?", a: "The value detection is mathematically sound — it accurately identifies when the best available odds exceed the fair probability. However, the fair probability itself is derived from market consensus, which reflects collective bookmaker opinion rather than ground truth." },
            { q: "Can I use Tipsbotten on mobile?", a: "Yes — the app is fully responsive and works on any screen size." },
          ].map((item) => (
            <div key={item.q}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: "var(--text)" }}>{item.q}</div>
              <p style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.7 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="disclaimer">
        Tipsbotten is an independent tool not affiliated with any bookmaker. The information provided is for educational and entertainment purposes.
        Past fördel calculations do not guarantee future profit. Please gamble responsibly.
      </div>
    </div>
  );
}

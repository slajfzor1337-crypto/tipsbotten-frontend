import { useState } from "react";
import NewLandingPage from "./components/NewLandingPage";
import ChatBot from "./components/ChatBot";
import Predictions from "./components/Predictions";
import PremiumPage from "./components/PremiumPage";
import AboutPage from "./components/AboutPage";
import "./App2.css";

const NAV = [
  { id: "home", label: "Speltips" },
  { id: "bot", label: "AI Bot" },
  { id: "predictions", label: "Predictions" },
  { id: "premium", label: "⭐ Premium", cls: "premium" },
  { id: "about", label: "Om oss" },
];

export default function App2() {
  const [activeTab, setActiveTab] = useState("home");
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem("tipsbotten_premium") === "true");

  return (
    <div className="app2">
      <header className="header2">
        <div className="logo2" onClick={() => setActiveTab("home")}>
          <svg width="28" height="32" viewBox="0 0 36 42" fill="none">
            <path d="M18 2L3 8V20C3 30 10 37 18 40C26 37 33 30 33 20V8L18 2Z" fill="none" stroke="#00c853" strokeWidth="2" strokeLinejoin="round"/>
            <text x="18" y="28" textAnchor="middle" fontSize="20" fontWeight="600" fontFamily="Arial, sans-serif" fill="#00c853">T</text>
          </svg>
          <div>
            <div className="logo2-text">TIPS<span>BOTTEN</span></div>
            <div className="logo2-tagline">TRYGGT · SMART · VINNANDE</div>
          </div>
        </div>
        <nav className="nav2">
          {NAV.map(item => (
            <button key={item.id}
              className={`nav2-btn ${item.cls || ""} ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}>
              {item.label}
            </button>
          ))}
          {!isPremium && (
            <button className="nav2-upgrade" onClick={() => setActiveTab("premium")}>
              Bli Premium →
            </button>
          )}
          {isPremium && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", background: "rgba(255,214,0,0.08)", border: "1px solid rgba(255,214,0,0.2)", padding: "5px 12px", borderRadius: 4 }}>
              ⭐ Premium
            </span>
          )}
        </nav>
      </header>

      <main style={{ flex: 1, width: "100%" }} className="main-layout">
        {activeTab === "home" && <NewLandingPage onNavigate={setActiveTab} />}
        {activeTab === "bot" && <div className="page-wrap"><ChatBot isPremium={isPremium} onNavigate={setActiveTab} /></div>}
        {activeTab === "predictions" && <div className="page-wrap"><Predictions isPremium={isPremium} onNavigate={setActiveTab} /></div>}
        {activeTab === "premium" && <PremiumPage onUnlock={() => { setIsPremium(true); setActiveTab("predictions"); }} />}
        {activeTab === "about" && <div className="page-wrap"><AboutPage /></div>}
      </main>

      <footer className="footer3">
        <div className="footer3-inner">
          <div className="footer3-grid">
            <div>
              <div className="footer3-logo">TIPS<span>BOTTEN</span></div>
              <div className="footer3-tagline">TRYGGT · SMART · VINNANDE</div>
              <p className="footer3-desc">Tipsbotten är ett gratis AI-drivet speltipsverktyg. Vi jämför odds från 10+ spelbolag och ger dig de bästa tipsen varje dag.</p>
            </div>
            <div>
              <div className="footer3-heading">Verktyg</div>
              <ul className="footer3-links">
                <li><a onClick={() => setActiveTab("home")}>Speltips</a></li>
                <li><a onClick={() => setActiveTab("bot")}>AI Bot</a></li>
                <li><a onClick={() => setActiveTab("predictions")}>Predictions</a></li>
                <li><a onClick={() => setActiveTab("premium")}>Premium</a></li>
              </ul>
            </div>
            <div>
              <div className="footer3-heading">Information</div>
              <ul className="footer3-links">
                <li><a onClick={() => setActiveTab("about")}>Om oss</a></li>
                <li><a>Ansvarsfullt spel</a></li>
                <li><a>Integritetspolicy</a></li>
              </ul>
            </div>
          </div>
          <div className="footer3-bottom">
            <div>2026 © Tipsbotten · Spela ansvarsfullt</div>
            <div className="footer3-badges">
              <span className="footer3-badge">🔞 18+</span>
              <span className="footer3-badge">Stödlinjen 020-819 100</span>
              <span className="footer3-badge">spelpaus.se</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

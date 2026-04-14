import { useState } from "react";
import LandingPage from "./components/LandingPage";
import ChatBot from "./components/ChatBot";
import Predictions from "./components/Predictions";
import AboutPage from "./components/AboutPage";
import PremiumPage from "./components/PremiumPage";
import "./App.css";

const NAV = [
  { id: "home", label: "Speltips" },
  { id: "chat", label: "AI Bot" },
  { id: "predictions", label: "Predictions" },
  { id: "premium", label: "⭐ Premium" },
  { id: "about", label: "Om oss" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem("tipsbotten_premium") === "true");

  return (
    <div className="app">
      <header className="header">
        <div className="logo" onClick={() => setActiveTab("home")}>
          <svg width="36" height="42" viewBox="0 0 36 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 2L3 8V20C3 30 10 37 18 40C26 37 33 30 33 20V8L18 2Z" fill="none" stroke="#00c853" strokeWidth="2" strokeLinejoin="round"/>
            <text x="18" y="28" textAnchor="middle" fontSize="20" fontWeight="600" fontFamily="Arial, sans-serif" fill="#00c853">T</text>
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, lineHeight: 1 }}>
            <span className="logo-text">TIPS<span>BOTTEN</span></span>
            <span style={{ fontSize: 8, letterSpacing: "0.2em", color: "#777", fontFamily: "var(--font)", fontWeight: 500, marginTop: 2 }}>TRYGGT · SMART · VINNANDE</span>
          </div>
        </div>
        <nav className="nav">
          {NAV.map((item) => (
            <button key={item.id}
              className={`nav-btn ${activeTab === item.id ? "active" : ""} ${item.id === "premium" ? "nav-btn-premium" : ""}`}
              onClick={() => setActiveTab(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isPremium ? (
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", background: "rgba(255,214,0,0.1)", border: "1px solid rgba(255,214,0,0.3)", padding: "5px 12px", borderRadius: 4 }}>
              ⭐ PREMIUM
            </span>
          ) : (
            <button className="btn btn-primary" style={{ padding: "7px 16px", fontSize: 12 }}
              onClick={() => setActiveTab("premium")}>
              Bli Premium →
            </button>
          )}
        </div>
      </header>

      <main className="main">
        {activeTab === "home" && <LandingPage onNavigate={setActiveTab} isPremium={isPremium} />}
        {activeTab === "chat" && <div className="page-content"><ChatBot isPremium={isPremium} onNavigate={setActiveTab} /></div>}
        {activeTab === "predictions" && <div className="page-content"><Predictions isPremium={isPremium} onNavigate={setActiveTab} /></div>}
        {activeTab === "premium" && <PremiumPage onUnlock={() => { setIsPremium(true); setActiveTab("predictions"); }} />}
        {activeTab === "about" && <div className="page-content"><AboutPage /></div>}
      </main>

      <footer className="footer">
        <div className="footer-grid">
          <div>
            <div className="logo">
              <svg width="30" height="36" viewBox="0 0 36 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 2L3 8V20C3 30 10 37 18 40C26 37 33 30 33 20V8L18 2Z" fill="none" stroke="#00c853" strokeWidth="2" strokeLinejoin="round"/>
                <text x="18" y="28" textAnchor="middle" fontSize="20" fontWeight="600" fontFamily="Arial, sans-serif" fill="#00c853">T</text>
              </svg>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, lineHeight: 1 }}>
                <span className="logo-text">TIPS<span>BOTTEN</span></span>
                <span style={{ fontSize: 8, letterSpacing: "0.2em", color: "#777", fontFamily: "var(--font)", fontWeight: 500, marginTop: 2 }}>TRYGGT · SMART · VINNANDE</span>
              </div>
            </div>
            <p className="footer-brand-desc">
              Tipsbotten är ett gratis AI-drivet speltipsverktyg. Vi jämför odds från 10+ spelbolag
              och ger dig de bästa tipsen — gratis, varje dag.
            </p>
          </div>
          <div>
            <div className="footer-heading">Verktyg</div>
            <ul className="footer-links">
              <li><a onClick={() => setActiveTab("home")}>Speltips</a></li>
              <li><a onClick={() => setActiveTab("chat")}>AI Bot</a></li>
              <li><a onClick={() => setActiveTab("predictions")}>Predictions</a></li>
              <li><a onClick={() => setActiveTab("premium")}>Premium</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-heading">Information</div>
            <ul className="footer-links">
              <li><a onClick={() => setActiveTab("about")}>Om oss</a></li>
              <li><a>Ansvarsfullt spel</a></li>
              <li><a>Integritetspolicy</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">2026 © Tipsbotten · Spela ansvarsfullt</div>
          <div className="footer-badges">
            <span className="footer-badge">🔞 18+</span>
            <span className="footer-badge">Stödlinjen 020-819 100</span>
            <span className="footer-badge">spelpaus.se</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

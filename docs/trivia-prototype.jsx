import { useState, useEffect, useRef, useCallback } from "react";

// ─── DESIGN TOKENS ───
const C = {
  bg: "#08080f", surface: "#111119", surfaceHi: "#1a1a26", surfaceBorder: "#252536",
  accent: "#e8b931", accentDim: "#b8922a", accentGlow: "#e8b93130",
  correct: "#22c985", correctDim: "#1a9e6a",
  danger: "#ef4444", dangerDim: "#dc2626",
  purple: "#a78bfa", blue: "#60a5fa", pink: "#f472b6", orange: "#fb923c", teal: "#2dd4bf",
  text: "#f0f0f5", textMid: "#a0a0b8", textDim: "#65657a",
  white: "#ffffff",
};
const TEAM_COLORS = [C.accent, C.blue, C.correct, C.danger, C.purple, C.pink, C.orange, C.teal];
const FONTS = `'Outfit', 'Segoe UI', sans-serif`;
const DISPLAY_FONT = `'Archivo Black', 'Impact', sans-serif`;
const MONO = `'IBM Plex Mono', 'Courier New', monospace`;

// ─── SAMPLE DATA ───
const SAMPLE_QUESTIONS = [
  { id: "q1", text: "What is the capital of Australia?", answer: "Canberra", type: "free-text", category: "Geography", difficulty: "Easy", points: 1, used: 3, lastUsed: "Mar 17" },
  { id: "q2", text: "In what year did the Berlin Wall fall?", answer: "1989", type: "free-text", category: "History", difficulty: "Easy", points: 1, used: 2, lastUsed: "Mar 10" },
  { id: "q3", text: "Which planet has the most moons?", answer: "Saturn", type: "mc", choices: ["Jupiter", "Saturn", "Uranus", "Neptune"], category: "Science", difficulty: "Medium", points: 1, used: 1, lastUsed: "Mar 3" },
  { id: "q4", text: "Who directed 'Pulp Fiction'?", answer: "Quentin Tarantino", type: "free-text", category: "Movies", difficulty: "Easy", points: 1, used: 5, lastUsed: "Mar 17" },
  { id: "q5", text: "What element has the chemical symbol 'Fe'?", answer: "Iron", type: "mc", choices: ["Iron", "Gold", "Silver", "Copper"], category: "Science", difficulty: "Easy", points: 1, used: 0, lastUsed: null },
  { id: "q6", text: "Name this mountain.", answer: "Denali", type: "free-text", category: "Geography", difficulty: "Medium", points: 1, image: true, used: 1, lastUsed: "Mar 10" },
  { id: "q7", text: "Which band released 'Abbey Road'?", answer: "The Beatles", type: "free-text", category: "Music", difficulty: "Easy", points: 1, used: 4, lastUsed: "Mar 17" },
  { id: "q8", text: "What year was the first iPhone released?", answer: "2007", type: "mc", choices: ["2005", "2006", "2007", "2008"], category: "Tech", difficulty: "Medium", points: 1, used: 0, lastUsed: null },
  { id: "q9", text: "What country has the longest coastline?", answer: "Canada", type: "free-text", category: "Geography", difficulty: "Hard", points: 2, used: 2, lastUsed: "Mar 3" },
  { id: "q10", text: "What is the powerhouse of the cell?", answer: "Mitochondria", type: "free-text", category: "Science", difficulty: "Easy", points: 1, used: 6, lastUsed: "Mar 17" },
  { id: "q11", text: "Who painted the Sistine Chapel ceiling?", answer: "Michelangelo", type: "free-text", category: "Art", difficulty: "Easy", points: 1, used: 0, lastUsed: null },
  { id: "q12", text: "How many stripes on the American flag?", answer: "13", type: "mc", choices: ["11", "12", "13", "15"], category: "History", difficulty: "Easy", points: 1, used: 3, lastUsed: "Mar 10" },
  { id: "q13", text: "How many miles is it from Seattle to Paris, as the crow flies?", answer: "4,940", type: "free-text", category: "Geography", difficulty: "Hard", points: 0, used: 1, lastUsed: "Mar 3" },
  { id: "q14", text: "Name the largest ocean on Earth.", answer: "Pacific Ocean", type: "free-text", category: "Geography", difficulty: "Easy", points: 1, used: 0, lastUsed: null },
  { id: "q15", text: "Who wrote '1984'?", answer: "George Orwell", type: "free-text", category: "Literature", difficulty: "Easy", points: 1, used: 2, lastUsed: "Mar 10" },
];

const SAMPLE_GAME = {
  id: "g1", name: "Tuesday Night Trivia — Week 12", date: "2026-04-14", status: "draft",
  rounds: [
    { id: "r1", name: "General Knowledge", type: "standard", timer: 30, revealMode: "per-question", questions: ["q1", "q2", "q3", "q4", "q5"] },
    { id: "r2", name: "Picture Round", type: "picture", timer: 30, revealMode: "end-of-round", questions: ["q6"] },
    { id: "b1", name: "Halftime Break", type: "break", timer: 600 },
    { id: "r3", name: "Science & Tech", type: "speed", timer: 10, revealMode: "per-question", questions: ["q3", "q5", "q8", "q12"] },
    { id: "r4", name: "Music, Art & Lit", type: "standard", timer: 30, revealMode: "per-question", questions: ["q4", "q7", "q11", "q15"] },
    { id: "r5", name: "The Final Question", type: "final", timer: 90, questions: ["q9"] },
    { id: "r6", name: "Tiebreaker", type: "tiebreaker", timer: 60, questions: ["q13"] },
  ],
};

const SAMPLE_TEAMS = [
  { name: "Quiz Khalifa", score: 0, color: TEAM_COLORS[0] },
  { name: "Trivia Newton John", score: 0, color: TEAM_COLORS[1] },
  { name: "The Smartinis", score: 0, color: TEAM_COLORS[2] },
  { name: "Brew Tang Clan", score: 0, color: TEAM_COLORS[3] },
  { name: "Agatha Quiztie", score: 0, color: TEAM_COLORS[4] },
];

const SAMPLE_SPONSORS = [
  { name: "Eastside Brewing Co.", color: C.accent },
  { name: "Pine Lake Pizza", color: C.correct },
  { name: "Summit Auto", color: C.blue },
];

// ─── HELPERS ───
const getQ = (id) => SAMPLE_QUESTIONS.find(q => q.id === id);
const roundIcon = (t) => ({ standard: "📋", picture: "🖼️", speed: "⚡", final: "🏆", break: "☕", tiebreaker: "🎯" }[t] || "📋");
const roundLabel = (t) => ({ standard: "Standard", picture: "Picture", speed: "Speed", final: "Final", break: "Break", tiebreaker: "Tiebreaker" }[t] || t);

// ─── SHARED COMPONENTS ───
function Btn({ children, onClick, bg = C.accent, fg = "#000", small, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? C.surfaceHi : bg, color: disabled ? C.textDim : fg,
      border: "none", borderRadius: 8, padding: small ? "6px 14px" : "10px 20px",
      fontWeight: 700, fontSize: small ? 12 : 14, cursor: disabled ? "default" : "pointer",
      fontFamily: FONTS, letterSpacing: 0.3, transition: "all .15s", opacity: disabled ? 0.5 : 1,
      ...style
    }}>{children}</button>
  );
}

function Badge({ children, color = C.textDim, bg = C.surfaceHi }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: bg, color, letterSpacing: 0.8, textTransform: "uppercase" }}>{children}</span>;
}

function Card({ children, style = {}, onClick }) {
  return <div onClick={onClick} style={{ background: C.surface, border: `1px solid ${C.surfaceBorder}`, borderRadius: 12, padding: 20, cursor: onClick ? "pointer" : "default", transition: "border-color .15s", ...style }}>{children}</div>;
}

function SponsorBar({ sponsors }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => { const t = setInterval(() => setIdx(i => (i + 1) % sponsors.length), 4000); return () => clearInterval(t); }, [sponsors.length]);
  if (!sponsors.length) return null;
  return (
    <div style={{ height: 40, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 12, color: C.textMid, letterSpacing: 0.5 }}>
      <span style={{ fontWeight: 600, fontSize: 11 }}>Sponsored by</span>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: `${sponsors[idx].color}30`, border: `1px solid ${sponsors[idx].color}50`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <span style={{ fontSize: 9, fontWeight: 900, color: sponsors[idx].color, fontFamily: MONO }}>{sponsors[idx].name.charAt(0)}</span>
      </div>
      <span style={{ fontWeight: 800, color: C.text, fontSize: 13 }}>{sponsors[idx].name}</span>
    </div>
  );
}

function TabBar({ tabs, active, onSelect }) {
  return (
    <div style={{ display: "flex", gap: 2, background: C.surfaceHi, borderRadius: 10, padding: 3 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onSelect(t.id)} style={{
          flex: 1, padding: "8px 16px", borderRadius: 8, border: "none", fontFamily: FONTS,
          fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .15s",
          background: active === t.id ? C.accent : "transparent",
          color: active === t.id ? "#000" : C.textDim,
        }}>{t.icon} {t.label}</button>
      ))}
    </div>
  );
}

// ─── TIMER HOOK ───
function useTimer(initial) {
  const [secs, setSecs] = useState(initial);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (running && secs > 0) {
      ref.current = setTimeout(() => setSecs(s => s - 1), 1000);
    } else if (secs === 0) setRunning(false);
    return () => clearTimeout(ref.current);
  }, [running, secs]);
  return {
    secs, running,
    start: () => setRunning(true),
    pause: () => setRunning(false),
    reset: (v) => { setRunning(false); setSecs(v ?? initial); },
    set: (v) => setSecs(v),
  };
}

// ═══════════════════════════════════════════════════
// SCREEN: DASHBOARD
// ═══════════════════════════════════════════════════
function DashboardScreen({ onNav }) {
  const pastGames = [
    { name: "Week 11 — St. Patrick's Special", date: "Mar 17", teams: 12, winner: "Quiz Khalifa" },
    { name: "Week 10 — General Trivia", date: "Mar 10", teams: 8, winner: "Trivia Newton John" },
    { name: "Week 9 — Movie Night Edition", date: "Mar 3", teams: 10, winner: "The Smartinis" },
  ];

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, fontFamily: DISPLAY_FONT, color: C.text, margin: 0, letterSpacing: 1 }}>TRIVIA HQ</h1>
          <p style={{ color: C.textDim, fontSize: 14, margin: "4px 0 0" }}>Your hosting dashboard</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={() => onNav("branding")} bg={C.surfaceHi} fg={C.text} small>🎨 Branding</Btn>
          <Btn onClick={() => onNav("bank")} bg={C.surfaceHi} fg={C.text} small>📚 Question Bank</Btn>
        </div>
      </div>

      <Btn onClick={() => onNav("builder")} style={{ width: "100%", padding: "16px 0", fontSize: 16, marginBottom: 32 }}>
        + Create New Game
      </Btn>

      <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: C.textDim, marginBottom: 16 }}>RECENT GAMES</h3>
      {pastGames.map((g, i) => (
        <Card key={i} style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }} onClick={() => onNav("builder")}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: C.surfaceHi, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🧠</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{g.name}</div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{g.date} · {g.teams} teams · Winner: {g.winner}</div>
          </div>
          <Badge color={C.correct} bg={`${C.correct}20`}>Completed</Badge>
        </Card>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// SCREEN: QUESTION BANK
// ═══════════════════════════════════════════════════
function QuestionBankScreen({ onNav }) {
  const [filter, setFilter] = useState("All");
  const categories = ["All", ...new Set(SAMPLE_QUESTIONS.map(q => q.category))];
  const filtered = filter === "All" ? SAMPLE_QUESTIONS : SAMPLE_QUESTIONS.filter(q => q.category === filter);

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => onNav("dashboard")} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 18, fontFamily: FONTS }}>←</button>
        <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: DISPLAY_FONT, color: C.text, margin: 0, letterSpacing: 1 }}>QUESTION BANK</h1>
        <span style={{ color: C.textDim, fontSize: 13, marginLeft: "auto" }}>{SAMPLE_QUESTIONS.length} questions</span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: "6px 14px", borderRadius: 999, border: "none", fontSize: 12, fontWeight: 700, fontFamily: FONTS, cursor: "pointer",
            background: filter === c ? C.accent : C.surfaceHi, color: filter === c ? "#000" : C.textDim,
          }}>{c}</button>
        ))}
      </div>

      <Btn bg={C.surfaceHi} fg={C.text} style={{ width: "100%", marginBottom: 16, border: `1px dashed ${C.surfaceBorder}` }}>
        + Add Question
      </Btn>

      {filtered.map((q, i) => (
        <Card key={q.id} style={{ marginBottom: 8, padding: 14, display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 600, color: C.text, fontSize: 14, marginBottom: 4 }}>{q.text}</div>
            <div style={{ fontSize: 12, color: C.correct, fontWeight: 600, marginBottom: 4 }}>A: {q.answer}</div>
            <div style={{ fontSize: 11, color: C.textDim }}>
              {q.used > 0 ? `Used ${q.used}× · Last: ${q.lastUsed}` : "Never used"}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
            <Badge>{q.category}</Badge>
            <Badge color={q.type === "mc" ? C.blue : C.purple} bg={q.type === "mc" ? `${C.blue}20` : `${C.purple}20`}>
              {q.type === "mc" ? "MC" : "Free"}
            </Badge>
            {q.image && <Badge color={C.orange} bg={`${C.orange}20`}>🖼️ Img</Badge>}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// SCREEN: BRANDING
// ═══════════════════════════════════════════════════
function BrandingScreen({ onNav }) {
  return (
    <div style={{ padding: 32, maxWidth: 600, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <button onClick={() => onNav("dashboard")} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 18, fontFamily: FONTS }}>←</button>
        <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: DISPLAY_FONT, color: C.text, margin: 0, letterSpacing: 1 }}>BRANDING</h1>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: C.textDim, margin: "0 0 16px" }}>HOST LOGO</h3>
        <div style={{ width: "100%", height: 120, borderRadius: 10, border: `2px dashed ${C.surfaceBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.textDim, fontSize: 14 }}>
          Click to upload logo
        </div>
        <p style={{ fontSize: 12, color: C.textDim, marginTop: 8 }}>Displayed on projector, team phones, and break screens. One logo per account.</p>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: C.textDim, margin: "0 0 16px" }}>COLORS</h3>
        <div style={{ display: "flex", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: C.textDim, marginBottom: 6 }}>Primary</div>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: C.accent, border: `2px solid ${C.surfaceBorder}` }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: C.textDim, marginBottom: 6 }}>Accent</div>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: C.purple, border: `2px solid ${C.surfaceBorder}` }} />
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: C.textDim, margin: "0 0 16px" }}>DEFAULT GAME TITLE</h3>
        <div style={{ background: C.surfaceHi, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 14, border: `1px solid ${C.surfaceBorder}` }}>
          Brews & Brains Trivia
        </div>
      </Card>

      <Card>
        <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: C.textDim, margin: "0 0 16px" }}>SPONSORS</h3>
        {SAMPLE_SPONSORS.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < SAMPLE_SPONSORS.length - 1 ? `1px solid ${C.surfaceBorder}` : "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${s.color}20`, border: `1px solid ${s.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: s.color, fontFamily: MONO }}>{s.name.split(" ").map(w => w[0]).join("")}</span>
            </div>
            <span style={{ flex: 1, fontWeight: 600, color: C.text, fontSize: 14 }}>{s.name}</span>
            <button style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 16 }}>×</button>
          </div>
        ))}
        <Btn bg={C.surfaceHi} fg={C.text} small style={{ marginTop: 12, width: "100%", border: `1px dashed ${C.surfaceBorder}` }}>+ Add Sponsor</Btn>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// SCREEN: GAME BUILDER
// ═══════════════════════════════════════════════════
function GameBuilderScreen({ onNav, onGoLive }) {
  const [selRound, setSelRound] = useState(0);
  const game = SAMPLE_GAME;
  const round = game.rounds[selRound];

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Left: Round list */}
      <div style={{ width: 260, background: C.surface, borderRight: `1px solid ${C.surfaceBorder}`, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 16px 8px", display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => onNav("dashboard")} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 16, fontFamily: FONTS }}>←</button>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: C.text, margin: 0, letterSpacing: 0.5 }}>GAME BUILDER</h3>
        </div>
        <div style={{ padding: "0 12px 8px" }}>
          <div style={{ fontSize: 12, color: C.textDim, padding: "4px 4px" }}>{game.name}</div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "0 8px" }}>
          {game.rounds.map((r, i) => (
            <div key={r.id} onClick={() => setSelRound(i)} style={{
              padding: "10px 12px", borderRadius: 8, marginBottom: 4, cursor: "pointer",
              background: selRound === i ? C.surfaceHi : "transparent",
              border: selRound === i ? `1px solid ${C.surfaceBorder}` : "1px solid transparent",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{roundIcon(r.type)}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: C.textDim }}>{roundLabel(r.type)} · {r.questions ? r.questions.length + "q" : r.timer / 60 + " min"}</div>
                </div>
              </div>
            </div>
          ))}
          <Btn bg={C.surfaceHi} fg={C.textDim} small style={{ width: "100%", marginTop: 8, border: `1px dashed ${C.surfaceBorder}` }}>+ Add Round</Btn>
        </div>

        <div style={{ padding: 12, borderTop: `1px solid ${C.surfaceBorder}` }}>
          <Btn onClick={onGoLive} style={{ width: "100%", padding: "12px 0", fontSize: 15 }}>
            🚀 Go Live
          </Btn>
        </div>
      </div>

      {/* Main: Round detail */}
      <div style={{ flex: 1, overflow: "auto", padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 28 }}>{roundIcon(round.type)}</span>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>{round.name}</h2>
            <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
              <Badge color={C.accent} bg={C.accentGlow}>{roundLabel(round.type)}</Badge>
              {round.type !== "break" && <Badge>{round.timer}s per question</Badge>}
              {round.type === "break" && <Badge>{round.timer / 60} min</Badge>}
              {round.revealMode && <Badge color={round.revealMode === "end-of-round" ? C.blue : C.textDim} bg={round.revealMode === "end-of-round" ? `${C.blue}20` : C.surfaceHi}>
                {round.revealMode === "end-of-round" ? "Reveal: end of round" : "Reveal: per question"}
              </Badge>}
              {round.type === "speed" && <Badge color={C.orange} bg={`${C.orange}20`}>MC only · Auto-advance</Badge>}
              {round.type === "final" && <Badge color={C.danger} bg={`${C.danger}20`}>Wager: 1 to total</Badge>}
              {round.type === "tiebreaker" && <Badge color={C.teal} bg={`${C.teal}20`}>Closest number wins</Badge>}
            </div>
          </div>
        </div>

        {round.type === "break" ? (
          <Card style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>☕</div>
            <div style={{ fontWeight: 700, color: C.text, fontSize: 16, marginBottom: 6 }}>Break — {round.timer / 60} minutes</div>
            <div style={{ color: C.textDim, fontSize: 13 }}>Projector shows countdown, scoreboard, and sponsor logos.</div>
          </Card>
        ) : round.type === "tiebreaker" ? (
          <Card style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
            <div style={{ fontWeight: 700, color: C.text, fontSize: 16, marginBottom: 6 }}>Tiebreaker — Closest Number</div>
            <div style={{ color: C.textDim, fontSize: 13, marginBottom: 16 }}>Only triggered if teams are tied after the Final Question.</div>
            {round.questions && round.questions.map((qId) => {
              const q = getQ(qId);
              if (!q) return null;
              return (
                <Card key={qId} style={{ textAlign: "left", padding: 14, marginTop: 8 }}>
                  <div style={{ fontWeight: 600, color: C.text, fontSize: 14 }}>{q.text}</div>
                  <div style={{ fontSize: 12, color: C.correct, fontWeight: 600, marginTop: 4 }}>A: {q.answer}</div>
                </Card>
              );
            })}
          </Card>
        ) : (
          <>
            {round.questions && round.questions.map((qId, i) => {
              const q = getQ(qId);
              if (!q) return null;
              return (
                <Card key={qId} style={{ marginBottom: 8, padding: 14, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: C.surfaceHi, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: C.textDim, fontFamily: MONO }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: C.text, fontSize: 14 }}>{q.text}</div>
                    <div style={{ fontSize: 12, color: C.correct, fontWeight: 600, marginTop: 2 }}>A: {q.answer}</div>
                  </div>
                  <Badge color={q.type === "mc" ? C.blue : C.purple} bg={q.type === "mc" ? `${C.blue}20` : `${C.purple}20`}>
                    {q.type === "mc" ? "MC" : "Free"}
                  </Badge>
                </Card>
              );
            })}
            <Btn bg={C.surfaceHi} fg={C.textDim} small style={{ width: "100%", marginTop: 8, border: `1px dashed ${C.surfaceBorder}` }}>
              + Add Question from Bank
            </Btn>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// SCREEN: LIVE GAME (Projector + Host Remote + Phone)
// ═══════════════════════════════════════════════════
function LiveGameScreen({ onNav }) {
  const game = SAMPLE_GAME;
  const [rIdx, setRIdx] = useState(-1);
  const [qIdx, setQIdx] = useState(0);
  const [phase, setPhase] = useState("lobby");
  const [teams, setTeams] = useState(SAMPLE_TEAMS.map(t => ({ ...t })));
  const [showAnswer, setShowAnswer] = useState(false);
  const [viewTab, setViewTab] = useState("projector");
  const [showOverlay, setShowOverlay] = useState(false);
  const [hostPanel, setHostPanel] = useState("controls");
  const [prevPhase, setPrevPhase] = useState(null);
  const [sponsorSplash, setSponsorSplash] = useState(false);
  const [endConfirm, setEndConfirm] = useState(false);
  const [hideScoreboard, setHideScoreboard] = useState(false); // game-level: hide scoreboard until game end
  const [scoreboardOverride, setScoreboardOverride] = useState(false); // host manual push
  const timer = useTimer(30);

  const round = rIdx >= 0 ? game.rounds[rIdx] : null;
  const qIds = round?.questions || [];
  const currentQ = qIds[qIdx] ? getQ(qIds[qIdx]) : null;
  const sorted = [...teams].sort((a, b) => b.score - a.score);

  const simulateScores = () => setTeams(ts => ts.map(t => ({ ...t, score: t.score + Math.floor(Math.random() * 3) })));
  const startGame = () => { setRIdx(0); setQIdx(0); setPhase("roundIntro"); };
  const beginRound = () => {
    const r = game.rounds[rIdx];
    if (r.type === "break") { setPhase("break"); timer.reset(r.timer); timer.start(); return; }
    if (r.type === "final") { setPhase("wagerWait"); return; }
    setQIdx(0); setPhase("question"); setShowAnswer(false); timer.reset(r.timer); timer.start();
  };
  const startQuestions = () => { setQIdx(0); setPhase("question"); setShowAnswer(false); timer.reset(round.timer); timer.start(); };
  const revealAnswer = () => { setShowAnswer(true); timer.pause(); simulateScores(); };
  const nextQuestion = () => {
    if (qIdx + 1 < qIds.length) { setQIdx(qIdx + 1); setShowAnswer(false); timer.reset(round.timer); timer.start(); setPhase("question"); }
    else { setPrevPhase(null); setPhase("scoreboard"); }
  };
  const nextRound = () => {
    setPrevPhase(null);
    if (rIdx + 1 < game.rounds.length) { setRIdx(rIdx + 1); setQIdx(0); setShowAnswer(false); setPhase("roundIntro"); }
    else setPhase("gameOver");
  };
  const showScoreboardFn = () => {
    if (hideScoreboard) { setScoreboardOverride(true); }
    setPrevPhase(phase); setPhase("scoreboard");
  };
  const returnFromScoreboard = () => { setPhase(prevPhase); setPrevPhase(null); setScoreboardOverride(false); };
  const adjustScore = (name, delta) => setTeams(ts => ts.map(t => t.name === name ? { ...t, score: t.score + delta } : t));
  const triggerSponsorSplash = () => { setSponsorSplash(true); setTimeout(() => setSponsorSplash(false), 6000); };
  const endGame = () => { setEndConfirm(false); setPhase("gameOver"); };

  // Speed round auto-advance: when timer hits 0, auto-reveal then auto-advance
  const speedAdvanceRef = useRef(null);
  useEffect(() => {
    if (speedAdvanceRef.current) { clearTimeout(speedAdvanceRef.current); speedAdvanceRef.current = null; }
    if (round?.type === "speed" && phase === "question") {
      if (timer.secs === 0 && !showAnswer) {
        setShowAnswer(true);
        timer.pause();
        simulateScores();
        speedAdvanceRef.current = setTimeout(() => {
          if (qIdx + 1 < qIds.length) {
            setQIdx(q => q + 1);
            setShowAnswer(false);
            timer.reset(round.timer);
            timer.start();
          } else {
            setPrevPhase(null);
            setPhase("scoreboard");
          }
        }, 2000);
      }
    }
    return () => { if (speedAdvanceRef.current) clearTimeout(speedAdvanceRef.current); };
  }, [timer.secs, round?.type, phase, showAnswer]);

  // ─── PROJECTOR VIEW (clean, full-screen) ───
  const ProjectorContent = () => {
    const bg = `radial-gradient(ellipse at 30% 20%, #1a1635 0%, ${C.bg} 70%)`;
    const pct = round ? timer.secs / round.timer : 1;

    if (phase === "lobby") return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: bg }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 40 }}>
          <div style={{ width: 80, height: 80, borderRadius: 16, background: C.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 20 }}>🧠</div>
          <h1 style={{ fontSize: 48, fontWeight: 900, fontFamily: DISPLAY_FONT, color: C.text, margin: "0 0 8px", letterSpacing: 2 }}>BREWS & BRAINS</h1>
          <p style={{ color: C.textMid, fontSize: 16, marginBottom: 32 }}>Get your team together and join on your phone!</p>
          <div style={{ background: C.surface, borderRadius: 16, padding: "20px 48px", border: `2px solid ${C.accent}`, marginBottom: 32 }}>
            <div style={{ fontSize: 12, color: C.textDim, fontWeight: 700, letterSpacing: 1.5, marginBottom: 4 }}>JOIN AT TRIVIA.APP</div>
            <div style={{ fontSize: 56, fontWeight: 900, fontFamily: MONO, color: C.accent, letterSpacing: 8 }}>ABCD</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            {teams.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: C.surfaceHi, padding: "6px 14px", borderRadius: 999 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{t.name}</span>
              </div>
            ))}
          </div>
        </div>
        <SponsorBar sponsors={SAMPLE_SPONSORS} />
      </div>
    );

    if (phase === "roundIntro") return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: bg }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <Badge color={C.accent} bg={C.accentGlow}>{roundIcon(round.type)} {roundLabel(round.type).toUpperCase()} ROUND</Badge>
          <div style={{ fontSize: 18, color: C.textDim, fontWeight: 600, margin: "12px 0 8px" }}>Round {rIdx + 1} of {game.rounds.length}</div>
          <h1 style={{ fontSize: 52, fontWeight: 900, fontFamily: DISPLAY_FONT, color: C.text, margin: 0, letterSpacing: 2 }}>{round.name.toUpperCase()}</h1>
          {round.type === "final" && <p style={{ color: C.danger, fontSize: 18, marginTop: 12 }}>🏆 Wager up to your TOTAL score!</p>}
          {round.type === "speed" && <p style={{ color: C.orange, fontSize: 18, marginTop: 12 }}>⚡ {round.timer} seconds per question — auto-advancing!</p>}
          {round.type === "tiebreaker" && <p style={{ color: C.teal, fontSize: 18, marginTop: 12 }}>🎯 Closest answer wins!</p>}
          {round.questions && <p style={{ color: C.textDim, fontSize: 15, marginTop: 8 }}>{round.questions.length} question{round.questions.length > 1 ? "s" : ""}</p>}
        </div>
        <SponsorBar sponsors={SAMPLE_SPONSORS} />
      </div>
    );

    if (phase === "wagerWait") return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: bg }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <h2 style={{ fontSize: 36, fontWeight: 900, fontFamily: DISPLAY_FONT, color: C.text, margin: "0 0 12px" }}>PLACE YOUR WAGERS</h2>
          <p style={{ color: C.textMid, fontSize: 18 }}>Wager 1 to your total score</p>
          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 8 }}>
            {teams.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 20px", background: C.surfaceHi, borderRadius: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: t.color }} />
                <span style={{ fontWeight: 700, color: C.text, fontSize: 15, width: 180, textAlign: "left" }}>{t.name}</span>
                <Badge color={C.correct} bg={`${C.correct}20`}>Wager locked ✓</Badge>
              </div>
            ))}
          </div>
        </div>
        <SponsorBar sponsors={SAMPLE_SPONSORS} />
      </div>
    );

    if (phase === "question" && currentQ) {
      const isSpeed = round.type === "speed";
      const isPicture = round.type === "picture";
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: isSpeed ? `radial-gradient(ellipse at 50% 30%, #3b1a0a 0%, ${C.bg} 70%)` : bg }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: isPicture ? 32 : 48 }}>
            <div style={{ display: "flex", gap: 12, marginBottom: isPicture ? 12 : 20 }}>
              <Badge color={C.accent} bg={C.accentGlow}>{round.name}</Badge>
              <Badge>Q{qIdx + 1}/{qIds.length}</Badge>
              <Badge color={C.purple} bg={`${C.purple}20`}>{currentQ.points} pt{currentQ.points > 1 ? "s" : ""}</Badge>
            </div>

            {/* Picture round: image first, question below */}
            {isPicture && currentQ.image && (
              <div style={{
                width: "100%", maxWidth: 600, aspectRatio: "16/10", borderRadius: 16,
                background: `linear-gradient(135deg, ${C.surfaceHi}, ${C.surface})`,
                border: `2px solid ${C.surfaceBorder}`, marginBottom: 20,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                overflow: "hidden", position: "relative",
              }}>
                {/* Mock mountain image using SVG */}
                <svg viewBox="0 0 600 375" style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
                  <defs>
                    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1a1040" />
                      <stop offset="100%" stopColor="#2d1b69" />
                    </linearGradient>
                    <linearGradient id="snow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e8e8f0" />
                      <stop offset="100%" stopColor="#9090b0" />
                    </linearGradient>
                    <linearGradient id="mtn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4a4a6a" />
                      <stop offset="100%" stopColor="#2a2a3a" />
                    </linearGradient>
                  </defs>
                  <rect width="600" height="375" fill="url(#sky)" />
                  {/* Background mountains */}
                  <polygon points="0,375 50,180 150,220 200,160 280,200 350,140 420,190 500,170 600,220 600,375" fill="#1e1e30" opacity="0.6" />
                  {/* Main peak */}
                  <polygon points="150,375 300,80 450,375" fill="url(#mtn)" />
                  {/* Snow cap */}
                  <polygon points="260,170 300,80 340,170 330,160 310,180 290,155 270,175" fill="url(#snow)" />
                  {/* Foreground ridge */}
                  <polygon points="0,375 80,280 200,320 350,270 500,310 600,260 600,375" fill="#151520" />
                  {/* Stars */}
                  {[{x:80,y:40},{x:200,y:60},{x:420,y:35},{x:520,y:70},{x:350,y:25},{x:150,y:90}].map((s,i) => (
                    <circle key={i} cx={s.x} cy={s.y} r="1.5" fill="#ffffff" opacity="0.6" />
                  ))}
                </svg>
                <div style={{ position: "absolute", bottom: 12, right: 16, background: "#000000aa", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: C.textDim, fontWeight: 600 }}>
                  🖼️ Picture Round
                </div>
              </div>
            )}

            <h1 style={{ fontSize: isPicture ? 36 : (isSpeed ? 44 : 50), fontWeight: 900, fontFamily: DISPLAY_FONT, color: C.text, margin: "0 0 24px", maxWidth: 900, lineHeight: 1.15, letterSpacing: 1 }}>{currentQ.text}</h1>
            {currentQ.type === "mc" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 700, width: "100%", marginBottom: 24 }}>
                {currentQ.choices.map((ch, i) => {
                  const isCorrect = ch === currentQ.answer;
                  return (
                    <div key={i} style={{
                      background: showAnswer ? (isCorrect ? `${C.correct}20` : `${C.danger}10`) : C.surfaceHi,
                      borderRadius: 12, padding: "16px 20px",
                      border: showAnswer ? `2px solid ${isCorrect ? C.correct : "transparent"}` : `1px solid ${C.surfaceBorder}`,
                      textAlign: "left", opacity: showAnswer && !isCorrect ? 0.4 : 1,
                    }}>
                      <span style={{ fontWeight: 800, color: showAnswer ? (isCorrect ? C.correct : C.textDim) : C.accent, marginRight: 10, fontFamily: MONO }}>{String.fromCharCode(65 + i)}</span>
                      <span style={{ fontWeight: 600, color: showAnswer ? (isCorrect ? C.correct : C.textDim) : C.text, fontSize: 18 }}>{ch}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {currentQ.type === "free-text" && showAnswer && (
              <div style={{ background: `${C.correct}15`, borderRadius: 16, padding: "24px 48px", border: `2px solid ${C.correct}40` }}>
                <div style={{ fontSize: 12, color: C.correct, fontWeight: 700, letterSpacing: 1.5, marginBottom: 4 }}>ANSWER</div>
                <div style={{ fontSize: 40, fontWeight: 900, fontFamily: DISPLAY_FONT, color: C.correct }}>{currentQ.answer}</div>
              </div>
            )}
            {!showAnswer && (
              <div style={{ position: "relative", width: 90, height: 90, marginTop: 8 }}>
                <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke={C.surfaceHi} strokeWidth="6" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={timer.secs <= 5 ? C.danger : isSpeed ? C.orange : C.accent} strokeWidth="6" strokeLinecap="round" strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 * (1 - pct)} style={{ transition: "stroke-dashoffset 1s linear" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, fontFamily: MONO, color: timer.secs <= 5 ? C.danger : C.text }}>{timer.secs}</div>
              </div>
            )}
          </div>
          <SponsorBar sponsors={SAMPLE_SPONSORS} />
        </div>
      );
    }

    if (phase === "scoreboard" || phase === "gameOver") {
      const showScores = phase === "gameOver" || !hideScoreboard || scoreboardOverride;
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: bg }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
            {phase === "gameOver" && <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>}
            <h2 style={{ fontSize: phase === "gameOver" ? 42 : 32, fontWeight: 900, fontFamily: DISPLAY_FONT, color: C.text, margin: "0 0 32px", letterSpacing: 2 }}>{phase === "gameOver" ? "FINAL STANDINGS" : "LEADERBOARD"}</h2>
            {showScores ? (
              <div style={{ width: "100%", maxWidth: 600 }}>
                {sorted.map((t, i) => (
                  <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", background: i === 0 ? `${C.accent}12` : "transparent", borderRadius: 12, marginBottom: 6, border: i === 0 ? `1px solid ${C.accent}30` : "1px solid transparent" }}>
                    <span style={{ fontSize: 24, fontWeight: 900, color: i < 3 ? [C.accent, C.textMid, C.orange][i] : C.textDim, width: 40, textAlign: "center", fontFamily: MONO }}>{i + 1}</span>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", background: t.color }} />
                    <span style={{ flex: 1, fontSize: 18, fontWeight: 700, color: C.text }}>{t.name}</span>
                    <span style={{ fontSize: 22, fontWeight: 900, fontFamily: MONO, color: i === 0 ? C.accent : C.text }}>{t.score}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🤫</div>
                <p style={{ fontSize: 22, color: C.textMid, fontWeight: 600 }}>Scores are hidden until the end!</p>
                <p style={{ fontSize: 16, color: C.textDim, marginTop: 8 }}>Keep playing — all will be revealed.</p>
              </div>
            )}
          </div>
          <SponsorBar sponsors={SAMPLE_SPONSORS} />
        </div>
      );
    }

    if (phase === "break") {
      const mins = Math.floor(timer.secs / 60); const secs = timer.secs % 60;
      const sponsorIdx = Math.floor(Date.now() / 5000) % SAMPLE_SPONSORS.length;
      const sponsor = SAMPLE_SPONSORS[sponsorIdx];
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: bg }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>☕</div>
            <h2 style={{ fontSize: 36, fontWeight: 900, fontFamily: DISPLAY_FONT, color: C.text, margin: "0 0 8px", letterSpacing: 2 }}>HALFTIME BREAK</h2>
            <p style={{ color: C.textMid, fontSize: 16, marginBottom: 24 }}>Grab a drink, we'll be back soon!</p>
            <div style={{ fontSize: 64, fontWeight: 900, fontFamily: MONO, color: C.accent }}>{mins}:{secs.toString().padStart(2, "0")}</div>

            {/* Sponsor logo */}
            <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 12, background: `${C.surface}aa`, borderRadius: 14, padding: "12px 24px", border: `1px solid ${C.surfaceBorder}` }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${sponsor.color}25`, border: `1px solid ${sponsor.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: sponsor.color, fontFamily: MONO }}>{sponsor.name.split(" ").map(w => w[0]).join("")}</span>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 10, color: C.textDim, fontWeight: 700, letterSpacing: 1 }}>SPONSORED BY</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{sponsor.name}</div>
              </div>
            </div>

            <div style={{ marginTop: 28, width: "100%", maxWidth: 400 }}>
              <div style={{ fontSize: 11, color: C.textDim, fontWeight: 700, letterSpacing: 1.5, marginBottom: 12 }}>CURRENT STANDINGS</div>
              {sorted.slice(0, 5).map((t, i) => (
                <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                  <span style={{ fontWeight: 800, fontFamily: MONO, color: C.textDim, width: 24, fontSize: 13 }}>{i + 1}</span>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color }} />
                  <span style={{ flex: 1, fontWeight: 600, color: C.text, fontSize: 14 }}>{t.name}</span>
                  <span style={{ fontWeight: 800, fontFamily: MONO, color: C.textMid, fontSize: 14 }}>{t.score}</span>
                </div>
              ))}
            </div>
          </div>
          <SponsorBar sponsors={SAMPLE_SPONSORS} />
        </div>
      );
    }
    return null;
  };

  // ─── PROJECTOR FLOATING OVERLAY ───
  const ProjectorOverlay = () => {
    if (!showOverlay) return null;
    return (
      <div style={{ position: "absolute", bottom: 48, right: 16, width: 280, background: `${C.surface}ee`, backdropFilter: "blur(12px)", border: `1px solid ${C.surfaceBorder}`, borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 8, zIndex: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.textDim, marginBottom: 2 }}>QUICK CONTROLS</div>
        {phase === "lobby" && <Btn onClick={startGame}>▶ Start Game</Btn>}
        {phase === "roundIntro" && <Btn onClick={beginRound}>Begin Round →</Btn>}
        {phase === "wagerWait" && <Btn onClick={startQuestions} bg={C.purple} fg="#fff">Lock Wagers & Start →</Btn>}
        {phase === "question" && !showAnswer && round?.type !== "speed" && (
          <>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn onClick={timer.running ? timer.pause : timer.start} bg={C.surfaceHi} fg={C.text} small style={{ flex: 1 }}>{timer.running ? "⏸" : "▶"}</Btn>
              <Btn onClick={() => timer.reset(round.timer)} bg={C.surfaceHi} fg={C.text} small style={{ flex: 1 }}>↺</Btn>
            </div>
            <Btn onClick={revealAnswer} bg={C.correct} fg="#000">Reveal Answer</Btn>
          </>
        )}
        {phase === "question" && round?.type === "speed" && (
          <div style={{ fontSize: 12, color: C.orange, fontWeight: 700, textAlign: "center", padding: 4 }}>⚡ Auto-advancing</div>
        )}
        {phase === "question" && showAnswer && round?.type !== "speed" && <Btn onClick={nextQuestion}>Next Question →</Btn>}
        {phase === "scoreboard" && prevPhase && <Btn onClick={returnFromScoreboard}>← Back to Round</Btn>}
        {phase === "scoreboard" && !prevPhase && <Btn onClick={nextRound}>{rIdx + 1 < game.rounds.length ? "Next Round →" : "Final Scores →"}</Btn>}
        {phase === "break" && <Btn onClick={nextRound}>End Break →</Btn>}
        {phase === "gameOver" && <Btn onClick={() => onNav("dashboard")}>Back to Dashboard</Btn>}
        {currentQ && <div style={{ fontSize: 12, color: C.correct, fontWeight: 700, padding: "4px 0", borderTop: `1px solid ${C.surfaceBorder}`, marginTop: 2 }}>A: {currentQ.answer}</div>}
      </div>
    );
  };

  // ─── HOST REMOTE (phone-optimized) ───
  const HostRemoteView = () => {
    const phoneFrame = { width: 340, background: C.bg, borderRadius: 28, overflow: "hidden", border: `3px solid ${C.surfaceBorder}`, display: "flex", flexDirection: "column", margin: "0 auto", height: 620 };

    return (
      <div style={phoneFrame}>
        {/* Status bar */}
        <div style={{ background: C.surface, padding: "10px 16px", borderBottom: `1px solid ${C.surfaceBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>🧠</span>
            <span style={{ fontWeight: 800, fontSize: 12, color: C.text, letterSpacing: 0.5 }}>HOST REMOTE</span>
          </div>
          <div style={{ background: C.accentGlow, borderRadius: 6, padding: "2px 8px" }}>
            <span style={{ fontSize: 12, fontWeight: 800, fontFamily: MONO, color: C.accent }}>ABCD</span>
          </div>
        </div>

        {/* Current state indicator */}
        <div style={{ padding: "10px 16px", background: C.surfaceHi, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, color: C.textDim, fontWeight: 700, letterSpacing: 1 }}>
              {phase === "lobby" ? "LOBBY" : phase === "gameOver" ? "GAME OVER" : `ROUND ${rIdx + 1}/${game.rounds.length}`}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginTop: 1 }}>
              {phase === "lobby" ? "Waiting to start" : phase === "gameOver" ? "Final standings" : round?.name}
            </div>
          </div>
          {phase === "question" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: C.textDim }}>Q{qIdx + 1}/{qIds.length}</span>
              <span style={{ fontWeight: 900, fontFamily: MONO, fontSize: 20, color: timer.secs <= 5 ? C.danger : C.accent }}>{timer.secs}</span>
            </div>
          )}
          {phase === "break" && (
            <span style={{ fontWeight: 900, fontFamily: MONO, fontSize: 18, color: C.accent }}>
              {Math.floor(timer.secs / 60)}:{(timer.secs % 60).toString().padStart(2, "0")}
            </span>
          )}
        </div>

        {/* Tab switcher for host panels */}
        <div style={{ display: "flex", background: C.surface, borderBottom: `1px solid ${C.surfaceBorder}` }}>
          {[{ id: "controls", label: "Controls" }, { id: "scores", label: "Scores" }, { id: "answers", label: "Answers" }].map(t => (
            <button key={t.id} onClick={() => setHostPanel(t.id)} style={{
              flex: 1, padding: "10px 0", border: "none", fontFamily: FONTS, fontSize: 12, fontWeight: 700, cursor: "pointer",
              background: "transparent", color: hostPanel === t.id ? C.accent : C.textDim,
              borderBottom: hostPanel === t.id ? `2px solid ${C.accent}` : "2px solid transparent",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Panel content */}
        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>

          {/* CONTROLS PANEL */}
          {hostPanel === "controls" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Cheat sheet */}
              {phase === "question" && currentQ && (
                <div style={{ background: `${C.correct}10`, borderRadius: 12, padding: 14, border: `1px solid ${C.correct}25` }}>
                  <div style={{ fontSize: 10, color: C.correct, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>ANSWER</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.correct }}>{currentQ.answer}</div>
                  {currentQ.text && <div style={{ fontSize: 12, color: C.textMid, marginTop: 6, lineHeight: 1.4 }}>{currentQ.text}</div>}
                </div>
              )}

              {/* Primary action — BIG thumb-friendly button */}
              {phase === "lobby" && <Btn onClick={startGame} style={{ padding: "18px 0", fontSize: 17, width: "100%", borderRadius: 14 }}>▶ Start Game</Btn>}
              {phase === "roundIntro" && <Btn onClick={beginRound} style={{ padding: "18px 0", fontSize: 17, width: "100%", borderRadius: 14 }}>Begin Round →</Btn>}
              {phase === "wagerWait" && <Btn onClick={startQuestions} bg={C.purple} fg="#fff" style={{ padding: "18px 0", fontSize: 17, width: "100%", borderRadius: 14 }}>Lock Wagers & Start →</Btn>}

              {phase === "question" && !showAnswer && round?.type !== "speed" && (
                <>
                  <Btn onClick={revealAnswer} bg={C.correct} fg="#000" style={{ padding: "18px 0", fontSize: 17, width: "100%", borderRadius: 14 }}>Reveal Answer</Btn>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn onClick={timer.running ? timer.pause : timer.start} bg={C.surfaceHi} fg={C.text} style={{ flex: 1, padding: "14px 0", borderRadius: 12 }}>
                      {timer.running ? "⏸ Pause" : "▶ Resume"}
                    </Btn>
                    <Btn onClick={() => timer.reset(round.timer)} bg={C.surfaceHi} fg={C.text} style={{ flex: 1, padding: "14px 0", borderRadius: 12 }}>↺ Reset</Btn>
                  </div>
                </>
              )}

              {phase === "question" && round?.type === "speed" && (
                <div style={{ background: `${C.orange}15`, borderRadius: 12, padding: 14, border: `1px solid ${C.orange}25`, textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.orange, marginBottom: 4 }}>⚡ SPEED ROUND — AUTO-ADVANCING</div>
                  <div style={{ fontSize: 12, color: C.textMid }}>
                    {showAnswer ? "Revealing answer..." : `${timer.secs}s remaining`}
                  </div>
                  <div style={{ fontSize: 11, color: C.textDim, marginTop: 4, marginBottom: 8 }}>Q{qIdx + 1} of {qIds.length}</div>
                  <Btn onClick={() => {
                    if (speedAdvanceRef.current) { clearTimeout(speedAdvanceRef.current); speedAdvanceRef.current = null; }
                    if (!showAnswer) { setShowAnswer(true); timer.pause(); simulateScores(); }
                    else { nextQuestion(); }
                  }} bg={C.surfaceHi} fg={C.text} small style={{ width: "100%" }}>
                    {showAnswer ? "Skip → Next Question" : "Skip → Reveal Now"}
                  </Btn>
                </div>
              )}

              {phase === "question" && showAnswer && round?.type !== "speed" && (
                <Btn onClick={nextQuestion} style={{ padding: "18px 0", fontSize: 17, width: "100%", borderRadius: 14 }}>
                  {qIdx + 1 < qIds.length ? `Next Question (${qIdx + 2}/${qIds.length}) →` : "Show Scoreboard →"}
                </Btn>
              )}

              {phase === "scoreboard" && prevPhase && (
                <Btn onClick={returnFromScoreboard} style={{ padding: "18px 0", fontSize: 17, width: "100%", borderRadius: 14 }}>
                  ← Back to Round
                </Btn>
              )}

              {phase === "scoreboard" && !prevPhase && (
                <Btn onClick={nextRound} style={{ padding: "18px 0", fontSize: 17, width: "100%", borderRadius: 14 }}>
                  {rIdx + 1 < game.rounds.length ? `Next: ${game.rounds[rIdx + 1].name} →` : "Final Scores →"}
                </Btn>
              )}

              {phase === "break" && (
                <Btn onClick={nextRound} style={{ padding: "18px 0", fontSize: 17, width: "100%", borderRadius: 14 }}>End Break Early →</Btn>
              )}

              {phase === "gameOver" && <Btn onClick={() => onNav("dashboard")} style={{ padding: "18px 0", fontSize: 17, width: "100%", borderRadius: 14 }}>Back to Dashboard</Btn>}

              {/* Secondary actions */}
              {phase !== "lobby" && phase !== "gameOver" && phase !== "scoreboard" && (
                <Btn onClick={showScoreboardFn} bg={C.surfaceHi} fg={C.text} style={{ padding: "14px 0", width: "100%", borderRadius: 12 }}>
                  {hideScoreboard ? "📊 Push Scoreboard (Override)" : "📊 Show Scoreboard"}
                </Btn>
              )}
              {phase !== "lobby" && phase !== "gameOver" && (
                <Btn onClick={triggerSponsorSplash} bg={C.surfaceHi} fg={C.text} style={{ padding: "14px 0", width: "100%", borderRadius: 12 }}>🏢 Sponsor Splash</Btn>
              )}

              {/* Scoreboard visibility toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: C.surfaceHi, borderRadius: 12, cursor: "pointer" }} onClick={() => setHideScoreboard(!hideScoreboard)}>
                <div style={{
                  width: 38, height: 22, borderRadius: 11, padding: 2,
                  background: hideScoreboard ? C.accent : C.surfaceBorder,
                  display: "flex", alignItems: hideScoreboard ? "center" : "center",
                  justifyContent: hideScoreboard ? "flex-end" : "flex-start",
                  transition: "all .2s",
                }}>
                  <div style={{ width: 18, height: 18, borderRadius: 9, background: C.white, transition: "all .2s" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Hide Scoreboard</div>
                  <div style={{ fontSize: 10, color: C.textDim }}>{hideScoreboard ? "Scores hidden until game end" : "Scores visible between rounds"}</div>
                </div>
              </div>

              {phase !== "lobby" && phase !== "gameOver" && !endConfirm && (
                <Btn onClick={() => setEndConfirm(true)} bg={`${C.danger}15`} fg={C.danger} style={{ padding: "12px 0", width: "100%", borderRadius: 12, border: `1px solid ${C.danger}25` }}>End Game</Btn>
              )}
              {endConfirm && (
                <div style={{ background: `${C.danger}15`, borderRadius: 12, padding: 14, border: `1px solid ${C.danger}30` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.danger, marginBottom: 8 }}>End game? This cannot be undone.</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn onClick={endGame} bg={C.danger} fg="#fff" style={{ flex: 1, borderRadius: 10 }}>Confirm End</Btn>
                    <Btn onClick={() => setEndConfirm(false)} bg={C.surfaceHi} fg={C.text} style={{ flex: 1, borderRadius: 10 }}>Cancel</Btn>
                  </div>
                </div>
              )}

              {/* Round progress */}
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 10, color: C.textDim, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>GAME PROGRESS</div>
                {game.rounds.map((r, i) => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", opacity: i < rIdx ? 0.4 : 1 }}>
                    <span style={{ fontSize: 14 }}>{roundIcon(r.type)}</span>
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: i === rIdx ? C.text : C.textMid }}>{r.name}</span>
                    {i < rIdx && <span style={{ color: C.correct, fontSize: 11 }}>✓</span>}
                    {i === rIdx && <span style={{ color: C.accent, fontSize: 11, fontWeight: 800 }}>NOW</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCORES PANEL */}
          {hostPanel === "scores" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {sorted.map((t, i) => (
                <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: C.surfaceHi, borderRadius: 12 }}>
                  <span style={{ fontWeight: 800, fontFamily: MONO, color: i < 3 ? [C.accent, C.textMid, C.orange][i] : C.textDim, width: 20, fontSize: 13 }}>{i + 1}</span>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: t.color }} />
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color: C.text }}>{t.name}</span>
                  <button onClick={() => adjustScore(t.name, -1)} style={{ width: 40, height: 40, borderRadius: 10, background: `${C.danger}15`, border: `1px solid ${C.danger}30`, color: C.danger, fontSize: 20, fontWeight: 700, cursor: "pointer", fontFamily: FONTS, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                  <span style={{ fontWeight: 900, fontFamily: MONO, fontSize: 18, color: C.accent, minWidth: 32, textAlign: "center" }}>{t.score}</span>
                  <button onClick={() => adjustScore(t.name, currentQ?.points || 1)} style={{ width: 40, height: 40, borderRadius: 10, background: `${C.correct}15`, border: `1px solid ${C.correct}30`, color: C.correct, fontSize: 20, fontWeight: 700, cursor: "pointer", fontFamily: FONTS, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                </div>
              ))}
            </div>
          )}

          {/* ANSWERS PANEL */}
          {hostPanel === "answers" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {phase === "question" && currentQ ? (
                <>
                  <div style={{ background: `${C.correct}10`, borderRadius: 8, padding: "6px 10px", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: C.correct, fontWeight: 700, letterSpacing: 1 }}>CORRECT ANSWER: </span>
                    <span style={{ fontSize: 12, color: C.correct, fontWeight: 800 }}>{currentQ.answer}</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.textDim, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>TEAM SUBMISSIONS</div>
                  {teams.map((t, i) => {
                    const submitted = showAnswer || i < 3;
                    // Realistic mock answers: some correct, some close, some wrong
                    const mockAnswers = [
                      currentQ.answer,
                      currentQ.answer.toLowerCase(),
                      currentQ.answer.slice(0, -1) + "a",
                      "I have no idea",
                      currentQ.answer,
                    ];
                    const mockAnswer = submitted ? mockAnswers[i % mockAnswers.length] : null;
                    return (
                      <div key={i} style={{ background: C.surfaceHi, borderRadius: 12, padding: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: submitted ? 8 : 0 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color }} />
                          <span style={{ flex: 1, fontWeight: 700, fontSize: 13, color: C.text }}>{t.name}</span>
                          {!submitted && <span style={{ fontSize: 11, color: C.textDim }}>waiting...</span>}
                        </div>
                        {submitted && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ flex: 1, fontSize: 13, color: C.textMid }}>"{mockAnswer}"</span>
                            <button style={{ width: 36, height: 36, borderRadius: 8, background: `${C.correct}20`, border: `1px solid ${C.correct}30`, color: C.correct, cursor: "pointer", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</button>
                            <button style={{ width: 36, height: 36, borderRadius: 8, background: `${C.danger}20`, border: `1px solid ${C.danger}30`, color: C.danger, cursor: "pointer", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✗</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                <div style={{ textAlign: "center", padding: 40, color: C.textDim, fontSize: 13 }}>
                  Answers appear here during question rounds.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom safe area */}
        <div style={{ height: 8, background: C.bg }} />
      </div>
    );
  };

  // ─── TEAM PHONE MOCK ───
  const TeamPhoneView = () => {
    const phoneFrame = { width: 280, height: 500, background: C.bg, borderRadius: 28, overflow: "hidden", border: `3px solid ${C.surfaceBorder}`, display: "flex", flexDirection: "column", margin: "0 auto" };

    if (phase === "lobby") return (
      <div style={phoneFrame}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🧠</div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>BREWS & BRAINS</h3>
          <p style={{ color: C.textDim, fontSize: 12, marginBottom: 20 }}>You're in! Waiting for host to start...</p>
          <div style={{ background: C.surfaceHi, borderRadius: 12, padding: "12px 20px", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.accent }} />
              <span style={{ fontWeight: 800, color: C.accent, fontSize: 15 }}>Quiz Khalifa</span>
            </div>
          </div>
        </div>
      </div>
    );

    {/* Round intro on phone: show next round + leaderboard */}
    if (phase === "roundIntro" && round) return (
      <div style={phoneFrame}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 20, overflow: "auto" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{roundIcon(round.type)}</div>
            <Badge color={C.accent} bg={C.accentGlow}>{roundLabel(round.type).toUpperCase()}</Badge>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: "8px 0 4px" }}>{round.name}</h3>
            <div style={{ fontSize: 12, color: C.textDim }}>
              {round.type === "speed" && "⚡ Quick fire — auto-advancing!"}
              {round.type === "picture" && "🖼️ Image-based questions"}
              {round.type === "final" && "🏆 Wager your points!"}
              {round.type === "tiebreaker" && "🎯 Closest number wins"}
              {round.type === "standard" && `${round.questions?.length || 0} questions`}
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${C.surfaceBorder}`, paddingTop: 12 }}>
            <div style={{ fontSize: 10, color: C.textDim, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
              {hideScoreboard ? "TEAMS" : "STANDINGS"}
            </div>
            {sorted.map((t, i) => (
              <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                <span style={{ fontWeight: 800, fontFamily: MONO, color: i < 3 ? [C.accent, C.textMid, C.orange][i] : C.textDim, width: 20, fontSize: 12 }}>{i + 1}</span>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color }} />
                <span style={{ flex: 1, fontWeight: 600, color: C.text, fontSize: 13, textAlign: "left" }}>{t.name}</span>
                {!hideScoreboard && <span style={{ fontWeight: 800, fontFamily: MONO, color: C.textMid, fontSize: 13 }}>{t.score}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    if (phase === "question" && currentQ) {
      const timerExpired = timer.secs === 0 && !showAnswer;
      return (
        <div style={phoneFrame}>
          <div style={{ background: C.surface, padding: "10px 16px", borderBottom: `1px solid ${C.surfaceBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Badge>{round.name}</Badge>
            <span style={{ fontWeight: 800, fontFamily: MONO, color: timer.secs <= 5 ? C.danger : C.accent, fontSize: 16 }}>{timer.secs}s</span>
          </div>
          <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", overflow: "auto" }}>
            <div style={{ fontSize: 11, color: C.textDim, fontWeight: 700, marginBottom: 6 }}>Q{qIdx + 1}/{qIds.length}</div>

            {round.type === "picture" && currentQ.image && (
              <div style={{
                width: "100%", aspectRatio: "16/10", borderRadius: 10, marginBottom: 12,
                background: `linear-gradient(135deg, ${C.surfaceHi}, ${C.surface})`,
                border: `1px solid ${C.surfaceBorder}`, position: "relative", overflow: "hidden",
              }}>
                <svg viewBox="0 0 600 375" style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
                  <defs>
                    <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1a1040" /><stop offset="100%" stopColor="#2d1b69" /></linearGradient>
                    <linearGradient id="mtn2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4a4a6a" /><stop offset="100%" stopColor="#2a2a3a" /></linearGradient>
                  </defs>
                  <rect width="600" height="375" fill="url(#sky2)" />
                  <polygon points="0,375 50,180 150,220 200,160 280,200 350,140 420,190 500,170 600,220 600,375" fill="#1e1e30" opacity="0.6" />
                  <polygon points="150,375 300,80 450,375" fill="url(#mtn2)" />
                  <polygon points="260,170 300,80 340,170 330,160 310,180 290,155 270,175" fill="#d0d0e0" />
                  <polygon points="0,375 80,280 200,320 350,270 500,310 600,260 600,375" fill="#151520" />
                </svg>
              </div>
            )}

            <div style={{ fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 16, lineHeight: 1.4 }}>{currentQ.text}</div>

            {/* Timer expired — no answer submitted */}
            {timerExpired && (
              <div style={{ background: `${C.danger}10`, borderRadius: 12, padding: 20, border: `1px solid ${C.danger}25`, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>😢</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.danger }}>No Answer Submitted</div>
                <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>Time's up!</div>
              </div>
            )}

            {/* MC: select + submit */}
            {!showAnswer && !timerExpired && currentQ.type === "mc" && (
              <div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                  {currentQ.choices.map((ch, i) => (
                    <div key={i} style={{ background: i === 1 ? `${C.accent}20` : C.surfaceHi, borderRadius: 10, padding: "12px 14px", border: i === 1 ? `2px solid ${C.accent}` : `1px solid ${C.surfaceBorder}`, cursor: "pointer" }}>
                      <span style={{ fontWeight: 800, color: i === 1 ? C.accent : C.textDim, marginRight: 8, fontFamily: MONO, fontSize: 12 }}>{String.fromCharCode(65 + i)}</span>
                      <span style={{ fontWeight: 600, color: C.text, fontSize: 14 }}>{ch}</span>
                      {i === 1 && <span style={{ float: "right", color: C.accent, fontSize: 12, fontWeight: 700 }}>✓</span>}
                    </div>
                  ))}
                </div>
                <Btn style={{ width: "100%" }}>Submit Answer</Btn>
              </div>
            )}

            {/* Free text: type + submit */}
            {!showAnswer && !timerExpired && currentQ.type === "free-text" && (
              <div>
                <div style={{ background: C.surfaceHi, borderRadius: 10, padding: "12px 14px", border: `1px solid ${C.surfaceBorder}`, color: C.textMid, fontSize: 14, marginBottom: 10 }}>Type your answer...</div>
                <Btn style={{ width: "100%" }}>Submit Answer</Btn>
              </div>
            )}

            {/* Answer revealed */}
            {showAnswer && (
              <div style={{ background: `${C.correct}15`, borderRadius: 12, padding: 16, border: `1px solid ${C.correct}30`, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.correct, fontWeight: 700, letterSpacing: 1 }}>ANSWER</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.correct, marginTop: 4 }}>{currentQ.answer}</div>
                <div style={{ marginTop: 8, fontSize: 12, color: C.textDim }}>+1 pt</div>
              </div>
            )}
          </div>
          <div style={{ background: C.surface, padding: "8px 16px", borderTop: `1px solid ${C.surfaceBorder}`, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: C.textDim }}>Your score</span>
            <span style={{ fontWeight: 800, color: C.accent, fontFamily: MONO }}>7 pts</span>
          </div>
        </div>
      );
    }

    if (phase === "wagerWait") return (
      <div style={phoneFrame}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>Final Question</h3>
          <p style={{ fontSize: 12, color: C.textDim, margin: "0 0 16px" }}>How much will you risk?</p>
          <div style={{ fontSize: 40, fontWeight: 900, fontFamily: MONO, color: C.accent, marginBottom: 8 }}>5</div>
          <div style={{ width: "80%", height: 6, background: C.surfaceHi, borderRadius: 3, position: "relative", marginBottom: 8 }}>
            <div style={{ width: "50%", height: "100%", background: C.accent, borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 12, color: C.textDim }}>1 — 7 (your score)</div>
          <Btn style={{ marginTop: 16 }}>Lock Wager</Btn>
        </div>
      </div>
    );

    {/* Break screen with timer + sponsor + scoreboard */}
    if (phase === "break") {
      const mins = Math.floor(timer.secs / 60);
      const secs = timer.secs % 60;
      const sponsor = SAMPLE_SPONSORS[0];
      return (
        <div style={phoneFrame}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: 20, textAlign: "center", overflow: "auto" }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>☕</div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>Halftime Break</h3>
            <p style={{ fontSize: 11, color: C.textDim, margin: "0 0 12px" }}>Grab a drink, we'll be back soon!</p>
            <div style={{ fontSize: 32, fontWeight: 900, fontFamily: MONO, color: C.accent, marginBottom: 14 }}>
              {mins}:{secs.toString().padStart(2, "0")}
            </div>

            {/* Sponsor logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: `${C.surface}`, borderRadius: 10, padding: "8px 14px", border: `1px solid ${C.surfaceBorder}`, marginBottom: 14, width: "100%" }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: `${sponsor.color}25`, border: `1px solid ${sponsor.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: sponsor.color, fontFamily: MONO }}>{sponsor.name.split(" ").map(w => w[0]).join("")}</span>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 9, color: C.textDim, fontWeight: 700, letterSpacing: 0.8 }}>SPONSORED BY</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{sponsor.name}</div>
              </div>
            </div>

            {/* Scoreboard */}
            <div style={{ width: "100%", borderTop: `1px solid ${C.surfaceBorder}`, paddingTop: 10 }}>
              <div style={{ fontSize: 10, color: C.textDim, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>
                {hideScoreboard ? "TEAMS" : "STANDINGS"}
              </div>
              {sorted.slice(0, 5).map((t, i) => (
                <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", width: "100%" }}>
                  <span style={{ fontWeight: 800, fontFamily: MONO, color: C.textDim, width: 20, fontSize: 12 }}>{i + 1}</span>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color }} />
                  <span style={{ flex: 1, fontWeight: 600, color: C.text, fontSize: 13, textAlign: "left" }}>{t.name}</span>
                  {!hideScoreboard && <span style={{ fontWeight: 800, fontFamily: MONO, color: C.textMid, fontSize: 13 }}>{t.score}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    {/* Sponsor splash on phone */}
    if (sponsorSplash) return (
      <div style={phoneFrame}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", background: `radial-gradient(ellipse at 50% 40%, #1a1635, ${C.bg})` }}>
          <div style={{ fontSize: 10, color: C.textDim, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>SPONSORED BY</div>
          <div style={{
            width: 80, height: 80, borderRadius: 18, marginBottom: 12,
            background: `${SAMPLE_SPONSORS[0].color}20`, border: `2px solid ${SAMPLE_SPONSORS[0].color}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: SAMPLE_SPONSORS[0].color, fontFamily: DISPLAY_FONT }}>{SAMPLE_SPONSORS[0].name.split(" ").map(w => w[0]).join("")}</span>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>{SAMPLE_SPONSORS[0].name}</h3>
        </div>
      </div>
    );

    return (
      <div style={phoneFrame}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
          {phase === "gameOver" ? (
            <>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: C.text, margin: "0 0 8px" }}>Game Over!</h3>
              {sorted.slice(0, 5).map((t, i) => (
                <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", width: "100%" }}>
                  <span style={{ fontWeight: 800, fontFamily: MONO, color: i < 3 ? [C.accent, C.textMid, C.orange][i] : C.textDim, width: 20, fontSize: 12 }}>{i + 1}</span>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color }} />
                  <span style={{ flex: 1, fontWeight: 600, color: C.text, fontSize: 13, textAlign: "left" }}>{t.name}</span>
                  <span style={{ fontWeight: 800, fontFamily: MONO, color: C.textMid, fontSize: 13 }}>{t.score}</span>
                </div>
              ))}
            </>
          ) : hideScoreboard && !scoreboardOverride ? (
            <>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🤫</div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>Scores Hidden</h3>
              <p style={{ fontSize: 12, color: C.textDim }}>All will be revealed at the end!</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: C.text, margin: "0 0 8px" }}>Standings</h3>
              {sorted.slice(0, 5).map((t, i) => (
                <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", width: "100%" }}>
                  <span style={{ fontWeight: 800, fontFamily: MONO, color: i < 3 ? [C.accent, C.textMid, C.orange][i] : C.textDim, width: 20, fontSize: 12 }}>{i + 1}</span>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color }} />
                  <span style={{ flex: 1, fontWeight: 600, color: C.text, fontSize: 13, textAlign: "left" }}>{t.name}</span>
                  <span style={{ fontWeight: 800, fontFamily: MONO, color: C.textMid, fontSize: 13 }}>{t.score}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  };

  // ─── MAIN LAYOUT ───
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Top bar with view tabs */}
      <div style={{ padding: "8px 16px", borderBottom: `1px solid ${C.surfaceBorder}`, display: "flex", alignItems: "center", gap: 12, background: C.surface }}>
        <button onClick={() => onNav("dashboard")} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 14, fontFamily: FONTS }}>←</button>
        <TabBar
          tabs={[
            { id: "projector", icon: "📺", label: "Projector" },
            { id: "remote", icon: "🎮", label: "Host Remote" },
            { id: "phone", icon: "📱", label: "Team Phone" },
          ]}
          active={viewTab} onSelect={setViewTab}
        />
        {viewTab === "projector" && (
          <button onClick={() => setShowOverlay(!showOverlay)} style={{
            marginLeft: "auto", background: showOverlay ? C.accentGlow : C.surfaceHi,
            border: `1px solid ${showOverlay ? C.accent : C.surfaceBorder}`, borderRadius: 8,
            padding: "6px 12px", cursor: "pointer", fontFamily: FONTS, fontSize: 12, fontWeight: 700,
            color: showOverlay ? C.accent : C.textDim,
          }}>
            {showOverlay ? "⚙ Controls ON" : "⚙ Controls OFF"}
          </button>
        )}
        <span style={{ marginLeft: viewTab === "projector" ? 0 : "auto", fontSize: 12, color: C.textDim }}>{teams.length} teams · Room ABCD</span>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        {viewTab === "projector" && (
          <>
            <ProjectorContent />
            <ProjectorOverlay />
            {/* Sponsor Splash Overlay */}
            {sponsorSplash && (
              <div style={{
                position: "absolute", inset: 0, zIndex: 20,
                background: `radial-gradient(ellipse at 50% 40%, #1a1635, ${C.bg})`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }} onClick={() => setSponsorSplash(false)}>
                <div style={{ fontSize: 13, color: C.textDim, fontWeight: 700, letterSpacing: 2.5, marginBottom: 24 }}>THIS ROUND BROUGHT TO YOU BY</div>
                <div style={{
                  width: 160, height: 160, borderRadius: 28, marginBottom: 24,
                  background: `linear-gradient(135deg, ${SAMPLE_SPONSORS[0].color}25, ${SAMPLE_SPONSORS[0].color}10)`,
                  border: `3px solid ${SAMPLE_SPONSORS[0].color}50`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 48, fontWeight: 900, color: SAMPLE_SPONSORS[0].color, fontFamily: DISPLAY_FONT }}>{SAMPLE_SPONSORS[0].name.split(" ").map(w => w[0]).join("")}</span>
                </div>
                <h1 style={{ fontSize: 44, fontWeight: 900, fontFamily: DISPLAY_FONT, color: C.text, letterSpacing: 2 }}>{SAMPLE_SPONSORS[0].name.toUpperCase()}</h1>
              </div>
            )}
          </>
        )}
        {viewTab === "remote" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, padding: 20 }}>
            <HostRemoteView />
          </div>
        )}
        {viewTab === "phone" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
            <TeamPhoneView />
          </div>
        )}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════
export default function TriviaPrototype() {
  const [screen, setScreen] = useState("dashboard");

  const containerStyle = {
    height: "100vh", width: "100vw", background: C.bg, color: C.text,
    fontFamily: FONTS, overflow: "hidden", display: "flex", flexDirection: "column",
  };

  return (
    <div style={containerStyle}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Archivo+Black&family=IBM+Plex+Mono:wght@500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {screen === "dashboard" && <DashboardScreen onNav={setScreen} />}
        {screen === "bank" && <QuestionBankScreen onNav={setScreen} />}
        {screen === "branding" && <BrandingScreen onNav={setScreen} />}
        {screen === "builder" && <GameBuilderScreen onNav={setScreen} onGoLive={() => setScreen("live")} />}
        {screen === "live" && <LiveGameScreen onNav={setScreen} />}
      </div>
    </div>
  );
}

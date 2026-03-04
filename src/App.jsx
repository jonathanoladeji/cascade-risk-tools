import { useState, useRef } from "react";

const API_KEY = import.meta.env.VITE_CASCADE_APP ?? "";
console.log("Key loaded:", API_KEY ? "YES" : "NO - MISSING");

// ─── DATA ─────────────────────────────────────────────────────────────────────
const RISK_CATEGORIES = [
  { id: "accident", label: "Physical Accident or Injury", icon: "🚨", color: "#E8473F", desc: "Crashes, falls, sports injuries, reckless physical behavior" },
  { id: "sti", label: "Sexual Health & STIs", icon: "⚕️", color: "#C0392B", desc: "Unprotected sex, multiple partners, not getting tested" },
  { id: "substance", label: "Substance Use & Addiction", icon: "💊", color: "#E67E22", desc: "Alcohol, drugs, prescription misuse, experimental substances" },
  { id: "violence", label: "Violence, Crime & Legal Trouble", icon: "⚖️", color: "#D4A017", desc: "Fights, illegal activity, reckless behavior with legal consequences" },
  { id: "financial", label: "Financial Ruin", icon: "📉", color: "#27AE60", desc: "Impulsive spending, gambling, bad investments, debt spiral" },
  { id: "mental", label: "Mental Health Deterioration", icon: "🧠", color: "#2980B9", desc: "Burnout, depression, anxiety spirals, isolation" },
  { id: "relational", label: "Relational Breakdown", icon: "💔", color: "#8E44AD", desc: "Damaged friendships, family estrangement, toxic relationships" },
];

const CONTEXT_QUESTIONS = [
  {
    id: "relationship",
    label: "Relationship & Intimacy",
    icon: "💛",
    question: "What best describes your current relationship situation?",
    options: [
      "Single and not actively dating",
      "Single and actively dating / on dating apps",
      "Casually seeing someone(s)",
      "In a committed relationship",
      "It's complicated / transitioning",
    ]
  },
  {
    id: "digital",
    label: "Digital Habits",
    icon: "📱",
    question: "How would you describe your relationship with digital content?",
    options: [
      "Light use — mostly practical",
      "Moderate social media, mostly connecting with people",
      "Heavy social media, I follow a lot of lifestyle/entertainment content",
      "I regularly consume sexually expressive or highly stimulating content",
      "My online life feels more real than my offline one",
    ]
  },
  {
    id: "work",
    label: "Work & Finances",
    icon: "💼",
    question: "How stable is your work and financial situation right now?",
    options: [
      "Stable income, some savings, feeling secure",
      "Stable income but living paycheck to paycheck",
      "Unstable income, ongoing financial stress",
      "Currently unemployed or between things",
      "Financially dependent on others",
    ]
  },
  {
    id: "social",
    label: "Social Life & Loneliness",
    icon: "🤝",
    question: "How connected do you feel to people around you?",
    options: [
      "Well connected — I have close friends I see regularly",
      "Some connections but I often feel like I'm on the outside",
      "Fairly isolated — most of my social life is online",
      "Very lonely, even when around people",
      "I've been deliberately pulling away from people lately",
    ]
  },
  {
    id: "spiritual",
    label: "Spiritual or Moral Framework",
    icon: "🧭",
    question: "Do you have a spiritual, religious, or personal moral framework that guides your decisions?",
    options: [
      "Yes, strongly — it actively shapes my daily choices",
      "Yes, but I don't always follow it consistently",
      "I have personal values but no formal framework",
      "I'm figuring out what I believe",
      "Not really — I tend to go with how I feel",
    ]
  },
];

const LAYERS = [
  {
    id: "individual", label: "Your Inner World", icon: "◎", color: "#E8473F",
    subtitle: "How you think about yourself and risk",
    questions: [
      { id: "risk_appetite", label: "How drawn are you to thrilling or dangerous activities?", low: "I naturally avoid them", high: "I actively seek them out" },
      { id: "identity_fusion", label: "How central is the risky behavior to who you feel you are?", low: "It's just something I do", high: "It's core to my identity" },
      { id: "optimism_bias", label: "How often do you think 'bad outcomes won't happen to me specifically'?", low: "I'm realistic about consequences", high: "I feel untouchable" },
      { id: "impulsivity", label: "How often do you act before fully thinking things through?", low: "I'm deliberate and planned", high: "I act first, think later" },
      { id: "validation_need", label: "How much do you need others' reactions to feel good about your choices?", low: "I'm confident without outside approval", high: "I rely heavily on others' reactions" },
    ]
  },
  {
    id: "social", label: "Your Social World", icon: "◉", color: "#F0882A",
    subtitle: "How your audience and relationships shape your choices",
    questions: [
      { id: "audience_reward", label: "How much does your audience (online or offline) reward bold or risky behavior?", low: "My circle values caution", high: "Boldness gets me celebrated" },
      { id: "warning_backfire", label: "When people warn you about something, how likely are you to dig in harder?", low: "I genuinely consider warnings", high: "Warnings make me more defiant" },
      { id: "peer_normalization", label: "How normalized is risky behavior in your immediate social circle?", low: "My peers actively discourage it", high: "Everyone around me does it" },
      { id: "honest_voices", label: "How many people in your life will tell you the truth even when it's uncomfortable?", low: "I have several trusted honest people", high: "Nobody really challenges me" },
    ]
  },
  {
    id: "behavioral", label: "Your Patterns", icon: "◈", color: "#D4A017",
    subtitle: "What your actual behavior looks like over time",
    questions: [
      { id: "escalation", label: "Are your risky behaviors becoming more frequent or more extreme over time?", low: "Things are stable or calming down", high: "It keeps escalating" },
      { id: "skill_gap", label: "How far does your confidence exceed your actual skill or knowledge?", low: "My skill matches my confidence", high: "I'm way more confident than skilled" },
      { id: "near_miss", label: "When you have a close call, how do you interpret it?", low: "I take it as a serious warning", high: "I treat it as proof I can handle it" },
      { id: "safety_shortcuts", label: "How often do you skip protective steps — seatbelts, protection, research, waiting?", low: "I consistently protect myself", high: "I regularly skip precautions" },
    ]
  },
  {
    id: "environmental", label: "Your Environment", icon: "◇", color: "#4A9B7F",
    subtitle: "The world around you and how it shapes risk",
    questions: [
      { id: "physical_danger", label: "How dangerous is your physical environment day-to-day?", low: "Relatively safe surroundings", high: "High-risk environment constantly" },
      { id: "cultural_norm", label: "How much does your culture or community tolerate or celebrate reckless behavior?", low: "Safety is valued where I live", high: "Recklessness is respected here" },
      { id: "digital_reward", label: "How much does your online presence reward increasingly extreme content or behavior?", low: "No significant online audience", high: "My platform rewards escalation" },
      { id: "financial_buffer", label: "How strong is your financial safety net right now?", low: "Solid savings, stable income", high: "No buffer, one crisis away from collapse" },
    ]
  },
  {
    id: "temporal", label: "Your Trajectory", icon: "◬", color: "#5B7EC9",
    subtitle: "How long this has been building and where it's heading",
    questions: [
      { id: "habituation", label: "How desensitized have you become to things that used to feel risky or wrong?", low: "I still feel the weight of risk", high: "Nothing feels dangerous anymore" },
      { id: "momentum", label: "How locked in does your current path feel — like stopping would cost you too much?", low: "I could change course easily", high: "Stopping feels impossible now" },
      { id: "trigger_events", label: "Have recent life changes (new relationship, job loss, move, grief) accelerated risky behavior?", low: "Life is relatively stable", high: "Major change is fueling recklessness" },
      { id: "pattern_duration", label: "How long has this pattern been building?", low: "It's recent and not entrenched", high: "This has been my life for years" },
    ]
  }
];

const SEARCH_RESOURCES = {
  accident: [
    { label: "Road Safety Foundation", url: "https://roadsafetyfoundation.org" },
    { label: "WHO Road Traffic Injuries", url: "https://www.who.int/news-room/fact-sheets/detail/road-traffic-injuries" },
  ],
  sti: [
    { label: "WHO Sexual Health", url: "https://www.who.int/health-topics/sexual-health" },
    { label: "Planned Parenthood STI Info", url: "https://www.plannedparenthood.org/learn/stds-diseases-infections" },
  ],
  substance: [
    { label: "SAMHSA Helpline", url: "https://www.samhsa.gov/find-help/national-helpline" },
    { label: "Narcotics Anonymous", url: "https://www.na.org" },
  ],
  violence: [
    { label: "Crisis Text Line", url: "https://www.crisistextline.org" },
    { label: "National Domestic Violence Hotline", url: "https://www.thehotline.org" },
  ],
  financial: [
    { label: "National Foundation for Credit Counseling", url: "https://www.nfcc.org" },
    { label: "Gamblers Anonymous", url: "https://www.gamblersanonymous.org" },
  ],
  mental: [
    { label: "Mental Health America", url: "https://www.mhanational.org" },
    { label: "Crisis Text Line (Text HOME to 741741)", url: "https://www.crisistextline.org" },
  ],
  relational: [
    { label: "Psychology Today — Find a Therapist", url: "https://www.psychologytoday.com/us/therapists" },
    { label: "Relate — Relationship Support", url: "https://www.relate.org.uk" },
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function totalScore(scores) {
  const allQs = LAYERS.flatMap(l => l.questions);
  const total = allQs.reduce((sum, q) => sum + (scores[q.id] || 0), 0);
  return Math.round((total / (allQs.length * 10)) * 100);
}

function layerScore(layerId, scores) {
  const layer = LAYERS.find(l => l.id === layerId);
  const total = layer.questions.reduce((s, q) => s + (scores[q.id] || 0), 0);
  return Math.round((total / (layer.questions.length * 10)) * 100);
}

function getToneLevel(score) {
  if (score <= 30) return {
    label: "Mostly steady",
    color: "#27AE60",
    emoji: "🟢",
    summary: (name) => `${name}, you're largely navigating life with awareness. A few patterns are worth keeping an eye on, but nothing here suggests you're in dangerous territory right now.`
  };
  if (score <= 55) return {
    label: "Worth paying attention to",
    color: "#D4A017",
    emoji: "🟡",
    summary: (name) => `${name}, some patterns are showing up that are worth taking seriously — not because disaster is imminent, but because the direction matters. Small adjustments now tend to be much easier than big corrections later.`
  };
  if (score <= 75) return {
    label: "Patterns compounding",
    color: "#E67E22",
    emoji: "🟠",
    summary: (name) => `${name}, several things are stacking up at the same time. That's the part worth understanding — it's not any single thing, it's the way they're reinforcing each other. This is a good moment to look honestly at the direction you're heading.`
  };
  return {
    label: "Needs honest attention",
    color: "#E8473F",
    emoji: "🔴",
    summary: (name) => `${name}, the picture across multiple areas of your life is pointing in a direction that deserves real, honest reflection. Not judgment — just a clear-eyed look at what's building and where it leads if nothing shifts.`
  };
}

function buildContextSummary(context) {
  const lines = [];
  CONTEXT_QUESTIONS.forEach(q => {
    const answer = context[q.id];
    if (answer) lines.push(`${q.label}: ${answer}`);
  });
  if (context.freetext && context.freetext.trim()) {
    lines.push(`In their own words: "${context.freetext.trim()}"`);
  }
  return lines.join("\n");
}

async function getAIAdvice(name, score, scores, selectedRisks, context, apiKey) {
  const tone = getToneLevel(score);
  const topLayers = LAYERS.map(l => ({ name: l.label, score: layerScore(l.id, scores) }))
    .sort((a, b) => b.score - a.score).slice(0, 3);
  const riskNames = selectedRisks.map(id => RISK_CATEGORIES.find(r => r.id === id)?.label).join(", ");
  const contextSummary = buildContextSummary(context);

  const prompt = `You are a trusted, perceptive friend who happens to understand human behavior deeply. You are NOT a therapist or life coach. You speak plainly, warmly, and without drama. You notice things others miss.

The person's name is ${name}. They completed a behavioral self-assessment. Their overall pattern score is ${score}/100 — described as "${tone.label}".

Their highest-activation areas are:
${topLayers.map(l => `- ${l.name}: ${l.score}%`).join("\n")}

The risk areas they identified as personally relevant: ${riskNames || "not specified"}

Their personal context:
${contextSummary || "Not provided"}

Write a personal response directly to ${name} that:

1. Opens with one grounded, observational sentence about what their overall picture looks like — no alarm, no drama, just honest observation. Calibrate the tone to a ${score}/100 score — lower scores should feel like a nudging conversation, not a warning.

2. Connects their personal context to 2-3 specific patterns showing up in their results. For example, if they mentioned dating apps and sexual content consumption alongside loneliness, name that specific connection directly — don't speak in abstractions. If they shared something specific in their own words, reference it.

3. Offers 3-4 concrete, specific things they could actually do this week — not generic advice. Make at least one involve telling a specific trusted person about one pattern before acting on it. Make the suggestions feel achievable, not overwhelming.

4. Ends with one honest, quiet observation about what staying on this path looks like — not a threat, just a real thing a good friend would say.

Tone rules:
- For scores under 35: warm, conversational, like noticing something over coffee
- For scores 35-55: direct but not alarming, like a friend who cares enough to say the real thing
- For scores 56+: honest and clear, but never catastrophizing

Keep it under 380 words. No bullet points in your response — write in flowing paragraphs like a real person talking. Use ${name}'s name naturally, not robotically. Never use phrases like "it seems like" or "you might want to consider" — say what you see.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `API error: ${response.status}`);
  }
  const data = await response.json();
  return data.content.map(b => b.text || "").join("");
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function SliderQuestion({ q, value, onChange, color }) {
  return (
    <div style={{
      background: "#0D0D10", border: `1px solid ${value ? color + "55" : "#1E1E25"}`,
      borderRadius: 6, padding: "22px 24px", transition: "border-color 0.3s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 12 }}>
        <p style={{ margin: 0, fontSize: 15, color: "#E8E4DC", lineHeight: 1.5, flex: 1 }}>{q.label}</p>
        {value && <span style={{ fontSize: 22, fontWeight: 700, color, minWidth: 30, textAlign: "right" }}>{value}</span>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#555", marginBottom: 8 }}>
        <span>← {q.low}</span><span>{q.high} →</span>
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} onClick={() => onChange(n)} style={{
            flex: 1, height: 32,
            background: value === n ? color : value && n <= value ? color + "2A" : "#161619",
            border: `1px solid ${value === n ? color : "#252528"}`,
            borderRadius: 3, cursor: "pointer",
            color: value === n ? "#000" : "#555",
            fontSize: 11, fontFamily: "inherit",
            transition: "all 0.12s", fontWeight: value === n ? 700 : 400
          }}>{n}</button>
        ))}
      </div>
    </div>
  );
}

function Screen({ children }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#080809", color: "#E8E4DC",
      fontFamily: "'Georgia', 'Times New Roman', serif", padding: "48px 20px"
    }}>
      <style>{`* { box-sizing: border-box; } input::placeholder, textarea::placeholder { color: #444; } @media print { body { background: white; color: black; } }`}</style>
      {children}
    </div>
  );
}

function Tag({ children }) {
  return <div style={{ fontSize: 11, letterSpacing: "0.25em", color: "#555", textTransform: "uppercase", marginBottom: 12 }}>{children}</div>;
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", color: "#555", marginBottom: 16 }}>{title}</h3>
      {children}
    </div>
  );
}

function Btn({ children, onClick, disabled, color = "#E8473F", textColor = "#FFF" }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? "#111" : color,
      border: `1px solid ${disabled ? "#1E1E25" : color}`,
      color: disabled ? "#333" : textColor,
      padding: "12px 24px", borderRadius: 4, cursor: disabled ? "default" : "pointer",
      fontSize: 13, fontFamily: "inherit", letterSpacing: "0.08em",
      transition: "all 0.2s", fontWeight: 600
    }}>{children}</button>
  );
}

const styles = {
  h1: { fontSize: "clamp(32px, 6vw, 52px)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.1, margin: "0 0 16px", color: "#F0EDE6" },
  h2: { fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 400, letterSpacing: "-0.01em", color: "#F0EDE6", margin: "0 0 8px" },
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState("intro");
  const [userName, setUserName] = useState("");
  const [apiKey] = useState(API_KEY);
  const [selectedRisks, setSelectedRisks] = useState([]);
  const [context, setContext] = useState({});
  const [scores, setScores] = useState({});
  const [activeLayer, setActiveLayer] = useState(0);
  const [aiAdvice, setAiAdvice] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);

  const allQs = LAYERS.flatMap(l => l.questions);
  const answered = allQs.filter(q => scores[q.id]).length;
  const allAnswered = answered === allQs.length;
  const score = totalScore(scores);
  const tone = getToneLevel(score);

  const effectiveKey = apiKey || manualKey;

  const toggleRisk = (id) => setSelectedRisks(prev =>
    prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
  );

  const setContextAnswer = (qid, val) => setContext(prev => ({ ...prev, [qid]: val }));

  const handleGenerateReport = async () => {
    setStep("results");
    if (!effectiveKey) { setShowKeyInput(true); return; }
    setAiLoading(true); setAiError("");
    try {
      const advice = await getAIAdvice(userName || "Friend", score, scores, selectedRisks, context, effectiveKey);
      setAiAdvice(advice);
    } catch (e) {
      setAiError(e.message || "Could not connect to AI. Check your API key or try again.");
    } finally { setAiLoading(false); }
  };

  const handleRetryAI = async () => {
    const key = apiKey || manualKey;
    if (!key) return;
    setAiLoading(true); setAiError(""); setShowKeyInput(false);
    try {
      const advice = await getAIAdvice(userName || "Friend", score, scores, selectedRisks, context, key);
      setAiAdvice(advice);
    } catch (e) {
      setAiError(e.message || "Still couldn't connect. Double-check your API key.");
    } finally { setAiLoading(false); }
  };

  const resetAll = () => {
    setStep("intro"); setScores({}); setSelectedRisks([]);
    setAiAdvice(""); setActiveLayer(0); setUserName("");
    setContext({}); setAiError("");
  };

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (step === "intro") return (
    <Screen>
      <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <Tag>Personal Self-Assessment</Tag>
        <h1 style={styles.h1}>The Cascade<br /><span style={{ color: "#E8473F" }}>Risk Mirror</span></h1>
        <p style={{ color: "#888", fontSize: 16, lineHeight: 1.8, marginBottom: 40 }}>
          An honest, personal look at how your habits, environment, and patterns are interacting — and where they might be taking you.
        </p>
        <div style={{ background: "#0D0D10", border: "1px solid #1E1E25", borderRadius: 8, padding: "28px 32px", marginBottom: 32, textAlign: "left" }}>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "#666", letterSpacing: "0.1em", textTransform: "uppercase" }}>What's your name?</p>
          <input value={userName} onChange={e => setUserName(e.target.value)}
            placeholder="Enter your first name"
            style={{ width: "100%", background: "#161619", border: "1px solid #2A2A30", borderRadius: 4, padding: "12px 16px", color: "#E8E4DC", fontSize: 18, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            onKeyDown={e => e.key === "Enter" && userName.trim() && setStep("context")}
          />
        </div>
        <Btn disabled={!userName.trim()} onClick={() => setStep("context")} color="#E8473F">Begin →</Btn>
        <p style={{ color: "#444", fontSize: 12, marginTop: 24, lineHeight: 1.7 }}>Your answers stay in your browser and are never stored or shared.</p>
      </div>
    </Screen>
  );

  // ── CONTEXT COLLECTION ─────────────────────────────────────────────────────
  if (step === "context") {
    const contextAnswered = CONTEXT_QUESTIONS.filter(q => context[q.id]).length;
    return (
      <Screen>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <Tag>Step 1 of 3 — Your Situation</Tag>
          <h2 style={{ ...styles.h2, marginBottom: 8 }}>
            {userName}, tell us a bit about your life right now
          </h2>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 32, lineHeight: 1.7 }}>
            This helps the AI give you specific, relevant insights rather than generic observations. The more honest you are here, the more useful your report will be.
          </p>

          {CONTEXT_QUESTIONS.map(cq => (
            <div key={cq.id} style={{ background: "#0D0D10", border: `1px solid ${context[cq.id] ? "#E8473F44" : "#1E1E25"}`, borderRadius: 8, padding: "22px 24px", marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 20 }}>{cq.icon}</span>
                <span style={{ fontSize: 15, color: "#E8E4DC" }}>{cq.question}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cq.options.map(opt => (
                  <button key={opt} onClick={() => setContextAnswer(cq.id, opt)} style={{
                    background: context[cq.id] === opt ? "#E8473F18" : "#161619",
                    border: `1px solid ${context[cq.id] === opt ? "#E8473F" : "#252528"}`,
                    borderRadius: 4, padding: "10px 14px", cursor: "pointer",
                    color: context[cq.id] === opt ? "#E8E4DC" : "#666",
                    fontSize: 13, fontFamily: "inherit", textAlign: "left",
                    transition: "all 0.15s"
                  }}>{context[cq.id] === opt ? "● " : "○ "}{opt}</button>
                ))}
              </div>
            </div>
          ))}

          {/* Free text */}
          <div style={{ background: "#0D0D10", border: "1px solid #1E1E25", borderRadius: 8, padding: "22px 24px", marginBottom: 28 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>✍️</span>
              <span style={{ fontSize: 15, color: "#E8E4DC" }}>Anything else you want the analysis to know about your situation?</span>
            </div>
            <p style={{ color: "#555", fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
              This is optional but powerful. The more specific you are — a habit you've noticed, a pattern you're concerned about, a recent change in your life — the more precise the advice will be.
            </p>
            <textarea
              value={context.freetext || ""}
              onChange={e => setContextAnswer("freetext", e.target.value)}
              placeholder="e.g. I've been spending a lot of time on dating apps and consuming a lot of sexually expressive content, which makes me crave intimacy even though I'm not in a committed relationship..."
              rows={5}
              style={{
                width: "100%", background: "#161619", border: "1px solid #2A2A30",
                borderRadius: 4, padding: "12px 16px", color: "#E8E4DC",
                fontSize: 14, fontFamily: "inherit", outline: "none",
                resize: "vertical", lineHeight: 1.6, boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Btn onClick={() => setStep("intro")} color="#1E1E25" textColor="#888">← Back</Btn>
            <Btn onClick={() => setStep("risks")} color="#E8473F">
              {contextAnswered > 0 ? "Continue →" : "Skip for now →"}
            </Btn>
          </div>
        </div>
      </Screen>
    );
  }

  // ── RISK CATEGORIES ────────────────────────────────────────────────────────
  if (step === "risks") return (
    <Screen>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <Tag>Step 2 of 3 — Your Risk Areas</Tag>
        <h2 style={{ ...styles.h2, marginBottom: 8 }}>
          Which of these feel relevant to your life right now?
        </h2>
        <p style={{ color: "#666", fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
          Select every category that honestly applies. You can choose all of them.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginBottom: 32 }}>
          {RISK_CATEGORIES.map(r => {
            const active = selectedRisks.includes(r.id);
            return (
              <button key={r.id} onClick={() => toggleRisk(r.id)} style={{
                background: active ? r.color + "18" : "#0D0D10",
                border: `2px solid ${active ? r.color : "#1E1E25"}`,
                borderRadius: 8, padding: "18px 20px", cursor: "pointer",
                textAlign: "left", transition: "all 0.2s", fontFamily: "inherit"
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{r.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: active ? r.color : "#C0BCB4", marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontSize: 12, color: "#555", lineHeight: 1.4 }}>{r.desc}</div>
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Btn onClick={() => setStep("context")} color="#1E1E25" textColor="#888">← Back</Btn>
          <Btn disabled={selectedRisks.length === 0} onClick={() => setStep("layers")} color="#E8473F">Continue →</Btn>
        </div>
      </div>
    </Screen>
  );

  // ── LAYER ASSESSMENT ───────────────────────────────────────────────────────
  if (step === "layers") {
    const layer = LAYERS[activeLayer];
    return (
      <Screen>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#555", marginBottom: 8 }}>
              <span style={{ letterSpacing: "0.1em", textTransform: "uppercase" }}>Step 3 of 3 — {userName}'s Assessment</span>
              <span>{answered}/{allQs.length} answered</span>
            </div>
            <div style={{ height: 2, background: "#1A1A1E", borderRadius: 1 }}>
              <div style={{ height: "100%", width: `${(answered / allQs.length) * 100}%`, background: "#E8473F", borderRadius: 1, transition: "width 0.4s" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 28, flexWrap: "wrap" }}>
            {LAYERS.map((l, i) => {
              const lComplete = l.questions.every(q => scores[q.id]);
              return (
                <button key={l.id} onClick={() => setActiveLayer(i)} style={{
                  background: activeLayer === i ? l.color : "transparent",
                  border: `1px solid ${activeLayer === i ? l.color : lComplete ? l.color + "66" : "#252528"}`,
                  color: activeLayer === i ? "#000" : lComplete ? l.color : "#555",
                  padding: "6px 14px", borderRadius: 3, cursor: "pointer",
                  fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
                  fontFamily: "inherit", transition: "all 0.2s"
                }}>
                  {l.icon} {l.label.split(" ")[0]} {lComplete ? "✓" : ""}
                </button>
              );
            })}
          </div>

          <div style={{ borderLeft: `3px solid ${layer.color}`, paddingLeft: 18, marginBottom: 28 }}>
            <div style={{ fontSize: 24 }}>{layer.icon}</div>
            <h2 style={{ ...styles.h2, margin: "4px 0 4px" }}>{layer.label}</h2>
            <p style={{ margin: 0, color: "#666", fontSize: 13 }}>{layer.subtitle}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
            {layer.questions.map(q => (
              <SliderQuestion key={q.id} q={q}
                value={scores[q.id]}
                onChange={val => setScores(p => ({ ...p, [q.id]: val }))}
                color={layer.color}
              />
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 20, borderTop: "1px solid #1A1A1E" }}>
            <Btn onClick={() => setActiveLayer(Math.max(0, activeLayer - 1))} disabled={activeLayer === 0} color="#1E1E25" textColor="#666">← Previous</Btn>
            {activeLayer < LAYERS.length - 1
              ? <Btn onClick={() => setActiveLayer(activeLayer + 1)} color={layer.color}>Next →</Btn>
              : allAnswered
                ? <Btn onClick={handleGenerateReport} color="#E8473F">Generate My Report →</Btn>
                : <span style={{ color: "#555", fontSize: 13, alignSelf: "center" }}>Answer all questions to continue</span>
            }
          </div>
        </div>
      </Screen>
    );
  }

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (step === "results") {
    const topLayers = LAYERS.map(l => ({ ...l, pct: layerScore(l.id, scores) })).sort((a, b) => b.pct - a.pct);
    const topRisks = selectedRisks.map(id => RISK_CATEGORIES.find(r => r.id === id));

    return (
      <Screen>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Tag>Personal Report</Tag>
          <h2 style={{ ...styles.h2, marginBottom: 4 }}>{userName}'s Cascade Risk Report</h2>
          <p style={{ color: "#555", fontSize: 13, marginBottom: 36 }}>
            {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          {/* Score card */}
          <div style={{
            background: "#0D0D10", border: `2px solid ${tone.color}`,
            borderRadius: 10, padding: "40px 32px", textAlign: "center",
            marginBottom: 28, position: "relative", overflow: "hidden"
          }}>
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 0%, ${tone.color}15, transparent 60%)`, pointerEvents: "none" }} />
            <div style={{ fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: 12 }}>Overall Pattern Score</div>
            <div style={{ fontSize: 88, fontWeight: 300, color: tone.color, lineHeight: 1, letterSpacing: "-0.04em", marginBottom: 4 }}>{score}</div>
            <div style={{ fontSize: 12, color: "#444", marginBottom: 16 }}>out of 100</div>
            <div style={{ fontSize: 20, color: "#E8E4DC", marginBottom: 20 }}>{tone.emoji} {tone.label}</div>
            <p style={{ color: "#888", fontSize: 15, lineHeight: 1.8, maxWidth: 500, margin: "0 auto", fontStyle: "italic" }}>
              {tone.summary(userName)}
            </p>
          </div>

          {/* Context snapshot */}
          {(Object.keys(context).some(k => context[k]) ) && (
            <Section title="Your Context — What Shaped This Analysis">
              <div style={{ background: "#0D0D10", border: "1px solid #1E1E25", borderRadius: 6, padding: "20px 24px" }}>
                {CONTEXT_QUESTIONS.map(cq => context[cq.id] ? (
                  <div key={cq.id} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 16, minWidth: 22 }}>{cq.icon}</span>
                    <div>
                      <span style={{ fontSize: 12, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>{cq.label} — </span>
                      <span style={{ fontSize: 13, color: "#C0BCB4" }}>{context[cq.id]}</span>
                    </div>
                  </div>
                ) : null)}
                {context.freetext && (
                  <div style={{ borderTop: "1px solid #1A1A1E", marginTop: 12, paddingTop: 12 }}>
                    <p style={{ margin: 0, fontSize: 13, color: "#888", fontStyle: "italic", lineHeight: 1.7 }}>"{context.freetext}"</p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Layer breakdown */}
          <Section title="Where Patterns Are Most Active">
            {topLayers.map(l => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 14, background: "#0D0D10", border: "1px solid #1A1A1E", borderRadius: 6, padding: "14px 18px", marginBottom: 8 }}>
                <span style={{ fontSize: 18, width: 22 }}>{l.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 14, color: "#C0BCB4" }}>{l.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: l.color }}>{l.pct}%</span>
                  </div>
                  <div style={{ height: 4, background: "#1A1A1E", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${l.pct}%`, background: l.color, borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            ))}
          </Section>

          {/* Risk areas + resources */}
          {topRisks.length > 0 && (
            <Section title="Your Identified Risk Areas">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {topRisks.map(r => (
                  <div key={r.id} style={{ background: "#0D0D10", border: `1px solid ${r.color}44`, borderRadius: 6, padding: "14px 16px" }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{r.icon}</div>
                    <div style={{ fontSize: 13, color: r.color, fontWeight: 600, marginBottom: 8 }}>{r.label}</div>
                    <div style={{ borderTop: "1px solid #1A1A1E", paddingTop: 8 }}>
                      {SEARCH_RESOURCES[r.id]?.map(res => (
                        <a key={res.url} href={res.url} target="_blank" rel="noopener noreferrer"
                          style={{ display: "block", fontSize: 11, color: "#5B7EC9", textDecoration: "none", marginBottom: 4, lineHeight: 1.4 }}>
                          → {res.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* AI Advice */}
          <Section title={`A Note for ${userName}`}>
            {showKeyInput && (
              <div style={{ background: "#0D0D10", border: "1px solid #E8473F44", borderRadius: 6, padding: 20, marginBottom: 16 }}>
                <p style={{ color: "#888", fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
                  Enter your Anthropic API key to generate personalised advice.
                  Get one at <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: "#5B7EC9" }}>console.anthropic.com</a>
                </p>
                <input type="password" placeholder="sk-ant-..." value={manualKey}
                  onChange={e => setManualKey(e.target.value)}
                  style={{ width: "100%", background: "#161619", border: "1px solid #2A2A30", borderRadius: 4, padding: "10px 14px", color: "#E8E4DC", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12 }}
                />
                <Btn onClick={handleRetryAI} disabled={!manualKey.trim()} color="#E8473F">Generate →</Btn>
              </div>
            )}

            {aiLoading && (
              <div style={{ background: "#0D0D10", border: "1px solid #1E1E25", borderRadius: 6, padding: 28, textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 12, animation: "spin 1.5s linear infinite", display: "inline-block" }}>◎</div>
                <p style={{ color: "#666", fontSize: 14, margin: 0 }}>Reading your patterns and writing something personal...</p>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {aiError && !aiLoading && (
              <div style={{ background: "#0D0D10", border: "1px solid #E8473F44", borderRadius: 6, padding: 20 }}>
                <p style={{ color: "#E8473F", fontSize: 14, margin: "0 0 12px" }}>{aiError}</p>
                <Btn onClick={() => setShowKeyInput(true)} color="#1E1E25" textColor="#888">Enter API Key</Btn>
              </div>
            )}

            {aiAdvice && !aiLoading && (
              <div style={{ background: "#0D0D10", border: "1px solid #2A2A2E", borderRadius: 6, padding: "28px 32px" }}>
                <div style={{ color: "#C8C4BC", fontSize: 16, lineHeight: 2, whiteSpace: "pre-wrap", fontStyle: "italic" }}>{aiAdvice}</div>
              </div>
            )}
          </Section>

          {/* Pause Protocol */}
          <Section title="The Pause Protocol — Before Your Next Risky Decision">
            <div style={{ background: "#0D0D10", border: "1px solid #5B7EC944", borderRadius: 6, padding: 24 }}>
              <p style={{ color: "#888", fontSize: 14, lineHeight: 1.8, margin: "0 0 16px" }}>
                The single most effective interrupt for impulsive risky behavior is <strong style={{ color: "#E8E4DC" }}>telling someone before you act</strong> — not after. Before.
              </p>
              {[
                "Name one specific person you would message before making an impulsive decision in each of your risk areas",
                "When the urge comes, say it out loud to them first — even just 'I'm thinking of doing X'",
                "Use the gap between telling them and their response to search for more information",
                "Give yourself a 48-hour rule: no major decision within 48 hours of a strong emotional state",
                "Write down the last 3 times a risky choice had an outcome you regret — keep it somewhere visible"
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 10 }}>
                  <span style={{ color: "#5B7EC9", fontWeight: 700, fontSize: 15, minWidth: 20 }}>{i + 1}.</span>
                  <span style={{ color: "#888", fontSize: 14, lineHeight: 1.6 }}>{s}</span>
                </div>
              ))}
            </div>
          </Section>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", paddingTop: 16 }}>
            <Btn onClick={resetAll} color="#1E1E25" textColor="#666">Start Over</Btn>
            <Btn onClick={() => window.print()} color="#2A2A30" textColor="#888">Print / Save PDF</Btn>
          </div>

          <p style={{ textAlign: "center", color: "#2A2A2E", fontSize: 11, marginTop: 32, lineHeight: 1.7 }}>
            This is a personal thinking tool, not a clinical assessment or substitute for professional help.<br />
            If you are in crisis, please reach out to a mental health professional or crisis line.
          </p>
        </div>
      </Screen>
    );
  }
}

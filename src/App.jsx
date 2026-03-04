import { useState, useEffect, useRef } from "react";

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
// Add your Anthropic API key here OR pass it via environment variable
// In Vercel: Settings → Environment Variables → VITE_ANTHROPIC_KEY
const API_KEY = import.meta.env.VITE_CASCADE_APP || "";

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
      { id: "cultural_norm", label: "How much does your culture or community tolerate or even celebrate reckless behavior?", low: "Safety is valued where I live", high: "Recklessness is respected here" },
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

function getRiskLevel(score) {
  if (score <= 25) return { label: "Low", color: "#27AE60", emoji: "🟢" };
  if (score <= 45) return { label: "Moderate", color: "#D4A017", emoji: "🟡" };
  if (score <= 65) return { label: "Elevated", color: "#E67E22", emoji: "🟠" };
  if (score <= 80) return { label: "High", color: "#E8473F", emoji: "🔴" };
  return { label: "Critical", color: "#C0392B", emoji: "⛔" };
}

// ─── AI ADVICE ────────────────────────────────────────────────────────────────
async function getAIAdvice(name, score, scores, selectedRisks, apiKey) {
  const riskLevel = getRiskLevel(score);
  const topLayers = LAYERS.map(l => ({ name: l.label, score: layerScore(l.id, scores) }))
    .sort((a, b) => b.score - a.score).slice(0, 3);
  const riskNames = selectedRisks.map(id => RISK_CATEGORIES.find(r => r.id === id)?.label).join(", ");

  const prompt = `You are a direct, honest life advisor — like a trusted older sibling who genuinely cares but will not sugarcoat anything. You are NOT a therapist and should NOT sound clinical.

The person's name is ${name}. They just completed a behavioral risk self-assessment.

Their overall cascade risk score is ${score}/100 — which is ${riskLevel.label} risk.

Their highest-risk layers are:
${topLayers.map(l => `- ${l.name}: ${l.score}%`).join("\n")}

The specific life risks they identified as relevant to them: ${riskNames}

Write a personalized response directly to ${name} that:
1. Opens with ONE honest sentence about what their score actually means for their life — no fluff
2. Names the 2-3 most dangerous specific patterns showing up in their results, in plain language (not psychology jargon)
3. Gives 3-5 VERY concrete, actionable steps they can take THIS WEEK — not vague advice, actual things to do. Include at least one step that involves telling a specific trusted person in their life about one risky behavior (like the space cookie example — accountability before acting)
4. Ends with one direct, honest statement about what happens if nothing changes

Keep it under 350 words. Write as if you're talking to a friend, not writing a report. Use their name at least twice. Be direct — no "it seems like" or "you might want to consider". Say what you mean.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  return data.content.map(b => b.text || "").join("");
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function SliderQuestion({ q, value, onChange, color }) {
  return (
    <div style={{
      background: "#0D0D10",
      border: `1px solid ${value ? color + "55" : "#1E1E25"}`,
      borderRadius: 6,
      padding: "22px 24px",
      transition: "border-color 0.3s"
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

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState("intro"); // intro | risks | layers | results
  const [userName, setUserName] = useState("");
  const [apiKey, setApiKey] = useState(API_KEY);
  const [selectedRisks, setSelectedRisks] = useState([]);
  const [scores, setScores] = useState({});
  const [activeLayer, setActiveLayer] = useState(0);
  const [aiAdvice, setAiAdvice] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [showApiInput, setShowApiInput] = useState(false);
  const resultsRef = useRef(null);

  const allQs = LAYERS.flatMap(l => l.questions);
  const answered = allQs.filter(q => scores[q.id]).length;
  const allAnswered = answered === allQs.length;
  const score = totalScore(scores);
  const riskLevel = getRiskLevel(score);

  const toggleRisk = (id) => setSelectedRisks(prev =>
    prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
  );

  const handleGenerateReport = async () => {
    setStep("results");
    if (!apiKey) { setShowApiInput(true); return; }
    setAiLoading(true); setAiError("");
    try {
      const advice = await getAIAdvice(userName || "Friend", score, scores, selectedRisks, apiKey);
      setAiAdvice(advice);
    } catch (e) {
      setAiError("Could not connect to AI. Check your API key or try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleRetryAI = async () => {
    if (!apiKey) return;
    setAiLoading(true); setAiError(""); setShowApiInput(false);
    try {
      const advice = await getAIAdvice(userName || "Friend", score, scores, selectedRisks, apiKey);
      setAiAdvice(advice);
    } catch (e) {
      setAiError("Still couldn't connect. Double-check your API key.");
    } finally { setAiLoading(false); }
  };

  // ── INTRO SCREEN ────────────────────────────────────────────────────────────
  if (step === "intro") return (
    <Screen>
      <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <Tag>Self-Assessment Tool</Tag>
        <h1 style={styles.h1}>The Cascade<br /><span style={{ color: "#E8473F" }}>Risk Mirror</span></h1>
        <p style={{ color: "#888", fontSize: 16, lineHeight: 1.8, marginBottom: 40 }}>
          A direct, honest look at how your daily patterns, habits, and environment are
          stacking up — and where they could be taking you.
        </p>
        <div style={{
          background: "#0D0D10", border: "1px solid #1E1E25",
          borderRadius: 8, padding: "28px 32px", marginBottom: 32, textAlign: "left"
        }}>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "#666", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            What's your name?
          </p>
          <input
            value={userName}
            onChange={e => setUserName(e.target.value)}
            placeholder="Enter your first name"
            style={{
              width: "100%", background: "#161619", border: "1px solid #2A2A30",
              borderRadius: 4, padding: "12px 16px", color: "#E8E4DC",
              fontSize: 18, fontFamily: "inherit", outline: "none",
              boxSizing: "border-box"
            }}
            onKeyDown={e => e.key === "Enter" && userName.trim() && setStep("risks")}
          />
        </div>
        <Btn
          disabled={!userName.trim()}
          onClick={() => setStep("risks")}
          color="#E8473F"
        >
          Begin Assessment →
        </Btn>
        <p style={{ color: "#444", fontSize: 12, marginTop: 24, lineHeight: 1.7 }}>
          This is a personal thinking tool, not a clinical diagnosis.<br />
          Your answers stay in your browser and are never stored.
        </p>
      </div>
    </Screen>
  );

  // ── RISK CATEGORY SCREEN ────────────────────────────────────────────────────
  if (step === "risks") return (
    <Screen>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <Tag>Step 1 of 2</Tag>
        <h2 style={{ ...styles.h2, marginBottom: 8 }}>
          {userName}, what risks feel most relevant to your life right now?
        </h2>
        <p style={{ color: "#666", fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
          Select every category that you know, honestly, applies to your current patterns. You can select all of them.
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
        <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
          <Btn onClick={() => setStep("intro")} color="#2A2A30" textColor="#888">← Back</Btn>
          <Btn
            disabled={selectedRisks.length === 0}
            onClick={() => setStep("layers")}
            color="#E8473F"
          >
            Continue to Assessment →
          </Btn>
        </div>
      </div>
    </Screen>
  );

  // ── LAYER ASSESSMENT ────────────────────────────────────────────────────────
  if (step === "layers") {
    const layer = LAYERS[activeLayer];
    const layerAnswered = layer.questions.filter(q => scores[q.id]).length;
    const layerComplete = layerAnswered === layer.questions.length;

    return (
      <Screen>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          {/* Progress */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#555", marginBottom: 8 }}>
              <span style={{ letterSpacing: "0.1em", textTransform: "uppercase" }}>Step 2 of 2 — {userName}'s Assessment</span>
              <span>{answered}/{allQs.length} answered</span>
            </div>
            <div style={{ height: 2, background: "#1A1A1E", borderRadius: 1 }}>
              <div style={{ height: "100%", width: `${(answered / allQs.length) * 100}%`, background: "#E8473F", borderRadius: 1, transition: "width 0.4s" }} />
            </div>
          </div>

          {/* Layer tabs */}
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

          {/* Layer header */}
          <div style={{ borderLeft: `3px solid ${layer.color}`, paddingLeft: 18, marginBottom: 28 }}>
            <div style={{ fontSize: 24 }}>{layer.icon}</div>
            <h2 style={{ ...styles.h2, margin: "4px 0 4px" }}>{layer.label}</h2>
            <p style={{ margin: 0, color: "#666", fontSize: 13 }}>{layer.subtitle}</p>
          </div>

          {/* Questions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
            {layer.questions.map(q => (
              <SliderQuestion
                key={q.id} q={q}
                value={scores[q.id]}
                onChange={val => setScores(p => ({ ...p, [q.id]: val }))}
                color={layer.color}
              />
            ))}
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 20, borderTop: "1px solid #1A1A1E" }}>
            <Btn onClick={() => setActiveLayer(Math.max(0, activeLayer - 1))} disabled={activeLayer === 0} color="#1E1E25" textColor="#666">← Previous</Btn>
            {activeLayer < LAYERS.length - 1
              ? <Btn onClick={() => setActiveLayer(activeLayer + 1)} color={layer.color}>Next Section →</Btn>
              : allAnswered
                ? <Btn onClick={handleGenerateReport} color="#E8473F">Generate My Report →</Btn>
                : <span style={{ color: "#555", fontSize: 13, alignSelf: "center" }}>Answer all questions to continue</span>
            }
          </div>
        </div>
      </Screen>
    );
  }

  // ── RESULTS ─────────────────────────────────────────────────────────────────
  if (step === "results") {
    const topLayers = LAYERS.map(l => ({ ...l, pct: layerScore(l.id, scores) })).sort((a, b) => b.pct - a.pct);
    const topRisks = selectedRisks.map(id => RISK_CATEGORIES.find(r => r.id === id));

    return (
      <Screen>
        <div style={{ maxWidth: 720, margin: "0 auto" }} ref={resultsRef}>
          <Tag>Personal Report</Tag>
          <h2 style={{ ...styles.h2, marginBottom: 4 }}>{userName}'s Cascade Risk Report</h2>
          <p style={{ color: "#555", fontSize: 13, marginBottom: 36 }}>Generated {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>

          {/* Score card */}
          <div style={{
            background: "#0D0D10", border: `2px solid ${riskLevel.color}`,
            borderRadius: 10, padding: "40px 32px", textAlign: "center",
            marginBottom: 28, position: "relative", overflow: "hidden"
          }}>
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 0%, ${riskLevel.color}18, transparent 60%)`, pointerEvents: "none" }} />
            <div style={{ fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: 12 }}>Overall Cascade Risk</div>
            <div style={{ fontSize: 88, fontWeight: 300, color: riskLevel.color, lineHeight: 1, letterSpacing: "-0.04em", marginBottom: 4 }}>{score}</div>
            <div style={{ fontSize: 12, color: "#444", marginBottom: 16 }}>out of 100</div>
            <div style={{ fontSize: 22, color: "#E8E4DC", marginBottom: 12 }}>{riskLevel.emoji} {riskLevel.label} Risk</div>
            <p style={{ color: "#777", fontSize: 14, lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
              {score <= 25 && `${userName}, your patterns are currently under control. The foundation is solid — the work is keeping it that way.`}
              {score > 25 && score <= 45 && `${userName}, several concerning patterns are showing up. They're not yet out of hand — but the direction matters more than the current number.`}
              {score > 45 && score <= 65 && `${userName}, multiple risk factors are compounding each other right now. This is the zone where people convince themselves everything is fine while the ground shifts under them.`}
              {score > 65 && score <= 80 && `${userName}, you have a serious convergence of risk factors across most areas of your life. This isn't about one bad habit — this is a pattern with momentum.`}
              {score > 80 && `${userName}, almost every layer of your life is signaling danger simultaneously. This level of convergence doesn't stay stable — it accelerates. Something needs to change now.`}
            </p>
          </div>

          {/* Layer breakdown */}
          <Section title="Where the Risk Is Building">
            {topLayers.map(l => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 14, background: "#0D0D10", border: "1px solid #1A1A1E", borderRadius: 6, padding: "14px 18px", marginBottom: 8 }}>
                <span style={{ fontSize: 18, width: 22 }}>{l.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 14, color: "#C0BCB4" }}>{l.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: l.color }}>{l.pct}%</span>
                  </div>
                  <div style={{ height: 4, background: "#1A1A1E", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${l.pct}%`, background: l.color, borderRadius: 2, transition: "width 1.2s ease" }} />
                  </div>
                </div>
              </div>
            ))}
          </Section>

          {/* Risk categories */}
          {topRisks.length > 0 && (
            <Section title="Your Identified Risk Areas">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {topRisks.map(r => (
                  <div key={r.id} style={{ background: "#0D0D10", border: `1px solid ${r.color}44`, borderRadius: 6, padding: "14px 16px" }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{r.icon}</div>
                    <div style={{ fontSize: 13, color: r.color, fontWeight: 600, marginBottom: 6 }}>{r.label}</div>
                    <div style={{ borderTop: "1px solid #1A1A1E", paddingTop: 10, marginTop: 4 }}>
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
          <Section title={`Direct Advice for ${userName}`}>
            {showApiInput && (
              <div style={{ background: "#0D0D10", border: "1px solid #E8473F44", borderRadius: 6, padding: 20, marginBottom: 16 }}>
                <p style={{ color: "#888", fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
                  To generate AI-powered personal advice, enter your Anthropic API key below.
                  Get one free at <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: "#5B7EC9" }}>console.anthropic.com</a>
                </p>
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  style={{
                    width: "100%", background: "#161619", border: "1px solid #2A2A30",
                    borderRadius: 4, padding: "10px 14px", color: "#E8E4DC",
                    fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12
                  }}
                />
                <Btn onClick={handleRetryAI} disabled={!apiKey.trim()} color="#E8473F">Generate AI Advice →</Btn>
              </div>
            )}

            {aiLoading && (
              <div style={{ background: "#0D0D10", border: "1px solid #1E1E25", borderRadius: 6, padding: 28, textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 12, animation: "spin 1.5s linear infinite", display: "inline-block" }}>◎</div>
                <p style={{ color: "#666", fontSize: 14, margin: 0 }}>Analyzing your patterns and generating personal advice...</p>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {aiError && !aiLoading && (
              <div style={{ background: "#0D0D10", border: "1px solid #E8473F44", borderRadius: 6, padding: 20 }}>
                <p style={{ color: "#E8473F", fontSize: 14, margin: "0 0 12px" }}>{aiError}</p>
                <Btn onClick={() => setShowApiInput(true)} color="#1E1E25" textColor="#888">Enter API Key</Btn>
              </div>
            )}

            {aiAdvice && !aiLoading && (
              <div style={{ background: "#0D0D10", border: "1px solid #E8473F33", borderRadius: 6, padding: 28 }}>
                <div style={{ color: "#C0BCB4", fontSize: 15, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{aiAdvice}</div>
              </div>
            )}
          </Section>

          {/* The stall tactic */}
          <Section title="The Pause Protocol — Before Your Next Risky Decision">
            <div style={{ background: "#0D0D10", border: "1px solid #5B7EC944", borderRadius: 6, padding: 24 }}>
              <p style={{ color: "#888", fontSize: 14, lineHeight: 1.8, margin: "0 0 16px" }}>
                Research and experience consistently show that the single most effective interrupt for impulsive risky behavior is <strong style={{ color: "#E8E4DC" }}>telling someone before you act</strong>. Not after. Before.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "Name one person right now who you would text before making an impulsive decision in each of your risk areas",
                  "When the urge comes, say it out loud to them first — even just 'I'm thinking of doing X'",
                  "Use the gap between telling them and their response to search for more information",
                  "Give yourself a 48-hour rule: no major risky decision within 48 hours of a strong emotional state",
                  "Write down the last 3 times a risky choice had a bad outcome — keep it somewhere visible"
                ].map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <span style={{ color: "#5B7EC9", fontWeight: 700, fontSize: 15, minWidth: 20 }}>{i + 1}.</span>
                    <span style={{ color: "#888", fontSize: 14, lineHeight: 1.6 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Restart */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", paddingTop: 16 }}>
            <Btn onClick={() => { setStep("intro"); setScores({}); setSelectedRisks([]); setAiAdvice(""); setActiveLayer(0); setUserName(""); }} color="#1E1E25" textColor="#666">
              Start Over
            </Btn>
            <Btn onClick={() => window.print()} color="#2A2A30" textColor="#888">
              Print / Save PDF
            </Btn>
          </div>

          <p style={{ textAlign: "center", color: "#2A2A2E", fontSize: 11, marginTop: 32, lineHeight: 1.7 }}>
            This is a personal thinking tool. It is not a clinical assessment, medical diagnosis, or substitute for professional help.<br />
            If you are in crisis, please reach out to a mental health professional or crisis line.
          </p>
        </div>
      </Screen>
    );
  }
}

// ─── LAYOUT HELPERS ───────────────────────────────────────────────────────────
function Screen({ children }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#080809", color: "#E8E4DC",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      padding: "48px 20px"
    }}>
      <style>{`
        * { box-sizing: border-box; }
        input::placeholder { color: #444; }
        @media print { body { background: white; color: black; } }
      `}</style>
      {children}
    </div>
  );
}

function Tag({ children }) {
  return (
    <div style={{ fontSize: 11, letterSpacing: "0.25em", color: "#555", textTransform: "uppercase", marginBottom: 12 }}>
      {children}
    </div>
  );
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
    }}>
      {children}
    </button>
  );
}

const styles = {
  h1: { fontSize: "clamp(32px, 6vw, 52px)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.1, margin: "0 0 16px", color: "#F0EDE6" },
  h2: { fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 400, letterSpacing: "-0.01em", color: "#F0EDE6", margin: "0 0 8px" },
};

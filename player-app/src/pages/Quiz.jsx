import React, { useMemo, useState, useEffect } from "react";

/* ----------
   Helpers for mobile + sharing
---------- */
function useIsMobile() {
  const get = () => window.matchMedia("(max-width: 640px)").matches; // Tailwind 'sm'
  const [isMobile, setIsMobile] = useState(get()); // ✅ call get()
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 640px)");
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return isMobile;
}
function encodePayload(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}

/* ----------
   Ulvareth palette
---------- */
const PALETTE = {
  aetherglass: "#3A6D8C", // primary / swords
  ringfall: "#D4A843", // accent
  shroud: "#5C3B6E", // schemers
  coal: "#2F2F2F", // text
  ash: "#9A9A9A", // borders/muted
  verdant: "#3D6B35", // seekers
  pearl: "#E6E1D3", // paper bg
  silver: "#C1CAD6", // cards
  ember: "#B6402C", // alerts/active
};

function hexToRgba(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2) || "00", 16);
  const g = parseInt(h.slice(2, 4) || "00", 16);
  const b = parseInt(h.slice(4, 6) || "00", 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ----------
   Questions (20 scenario style)
---------- */
const QUESTIONS = [
  { id: "q1", title: "Scenario: You’re ambushed on the road—arrows rain down and foes close fast. In that first heartbeat of chaos, how do you react?", options: [
    { key: "a", label: "Close ranks, raise steel, and meet the charge head-on.", points: { SW: 3, SE: 0, SC: 1 } },
    { key: "b", label: "Dash for vantage, drawing the enemy off or finding an escape route.", points: { SW: 0, SE: 3, SC: 1 } },
    { key: "c", label: "Throw out a quick trick—snare, bluff, or distraction—to tilt the fight.", points: { SW: 1, SE: 1, SC: 3 } },
    { key: "d", label: "Fall back to stabilize allies and call for a better position.", points: { SW: 1, SE: 2, SC: 1 } },
  ]},
  { id: "q2", title: "Scenario: The danger has passed and you have a few quiet hours at camp. What do you spend your time doing?", options: [
    { key: "a", label: "Drill maneuvers, sharpen weapons, and practice combat forms.", points: { SW: 3, SE: 0, SC: 1 } },
    { key: "b", label: "Map routes, study lore, and track signs of what lies ahead.", points: { SW: 0, SE: 3, SC: 1 } },
    { key: "c", label: "Mingle in town, bargain, or gather whispers and rumors.", points: { SW: 0, SE: 1, SC: 3 } },
    { key: "d", label: "Tend the party’s needs—food, repairs, and morale.", points: { SW: 1, SE: 2, SC: 1 } },
  ]},
  { id: "q3", title: "Scenario: A treasure vault sealed by iron doors and humming wards blocks your path. How do you deal with it?", options: [
    { key: "a", label: "Break the mechanism—or its guardians—by force.", points: { SW: 3, SE: 0, SC: 1 } },
    { key: "b", label: "Examine the wards and mechanisms until their secrets give way.", points: { SW: 0, SE: 3, SC: 1 } },
    { key: "c", label: "Seek the key through charm, theft, or negotiation.", points: { SW: 0, SE: 1, SC: 3 } },
    { key: "d", label: "Organize a step-by-step plan with split roles.", points: { SW: 1, SE: 2, SC: 2 } },
  ]},
  { id: "q4", title: "Scenario: The challenge ends and you’ve triumphed. Which kind of victory thrills you most?", options: [
    { key: "a", label: "A clean duel, the banner of triumph flying high.", points: { SW: 3, SE: 0, SC: 1 } },
    { key: "b", label: "A puzzle unraveled that opens a new path.", points: { SW: 0, SE: 3, SC: 1 } },
    { key: "c", label: "A rival outplayed by wit and timing.", points: { SW: 1, SE: 0, SC: 3 } },
    { key: "d", label: "The team executing a precise plan together.", points: { SW: 1, SE: 2, SC: 2 } },
  ]},
  { id: "q5", title: "Scenario: As you set out, you can only keep one essential tool forever. Which do you choose?", options: [
    { key: "a", label: "A trusted blade or sturdy shield.", points: { SW: 3, SE: 0, SC: 0 } },
    { key: "b", label: "Field journal, chalk, and notes.", points: { SW: 0, SE: 3, SC: 0 } },
    { key: "c", label: "Lockpicks, forgery kit, or disguise.", points: { SW: 0, SE: 0, SC: 3 } },
    { key: "d", label: "Bandages, brews, and rope to keep others going.", points: { SW: 1, SE: 2, SC: 1 } },
  ]},
  { id: "q6", title: "Scenario: A trap springs or a spell backfires and the pressure spikes. What do you rely on?", options: [
    { key: "a", label: "Grit, presence, and raw determination.", points: { SW: 3, SE: 0, SC: 1 } },
    { key: "b", label: "Sharp observation and patience for the opening.", points: { SW: 0, SE: 3, SC: 1 } },
    { key: "c", label: "Timing and leverage to flip the situation.", points: { SW: 1, SE: 1, SC: 3 } },
    { key: "d", label: "Support and coordination to steady the group.", points: { SW: 1, SE: 2, SC: 1 } },
  ]},
  { id: "q7", title: "Scenario: You uncover a hidden manuscript, strange relic, or forbidden tale. What’s your first response?", options: [
    { key: "a", label: "Ask who among your foes now deserves challenge.", points: { SW: 3, SE: 0, SC: 0 } },
    { key: "b", label: "Cross-reference markings and histories to find the truth.", points: { SW: 0, SE: 3, SC: 0 } },
    { key: "c", label: "Consider who benefits if you conceal this discovery.", points: { SW: 0, SE: 0, SC: 3 } },
    { key: "d", label: "Frame the knowledge into options the group can act on.", points: { SW: 1, SE: 2, SC: 2 } },
  ]},
  { id: "q8", title: "Scenario: Imagine your words engraved on your gear or remembered by allies. Which motto feels most like yours?", options: [
    { key: "a", label: "“Steel answers doubt.”", points: { SW: 3, SE: 0, SC: 0 } },
    { key: "b", label: "“Truth unlocks paths.”", points: { SW: 0, SE: 3, SC: 0 } },
    { key: "c", label: "“Leverage wins quietly.”", points: { SW: 0, SE: 0, SC: 3 } },
    { key: "d", label: "“Everyone has a role.”", points: { SW: 1, SE: 2, SC: 1 } },
  ]},
  { id: "q9", title: "Scenario: In a bustling market, a merchant hints at rare wares behind closed doors. How do you pursue the opportunity?", options: [
    { key: "a", label: "Intimidate with steel until the goods are revealed.", points: { SW: 3, SE: 0, SC: 1 } },
    { key: "b", label: "Hunt for clues—maps, markings, and whispered rumors.", points: { SW: 0, SE: 3, SC: 1 } },
    { key: "c", label: "Offer a bribe, favor, or subtle threat to win access.", points: { SW: 0, SE: 1, SC: 3 } },
    { key: "d", label: "Line up allies, ensuring everyone shares the gain.", points: { SW: 1, SE: 2, SC: 1 } },
  ]},
  { id: "q10", title: "Scenario: You must cross a ravine patrolled by enemy scouts. What’s your approach?", options: [
    { key: "a", label: "Charge through with shields up, daring them to stop you.", points: { SW: 3, SE: 0, SC: 1 } },
    { key: "b", label: "Study cliffs and patterns until you spot a hidden path.", points: { SW: 0, SE: 3, SC: 1 } },
    { key: "c", label: "Set a false trail to misdirect pursuers.", points: { SW: 1, SE: 1, SC: 3 } },
    { key: "d", label: "Assign roles—lookout, climber, rear guard—for safe passage.", points: { SW: 1, SE: 2, SC: 1 } },
  ]},
  { id: "q11", title: "Scenario: A river crossing is controlled by mercenaries demanding steep tolls. How do you deal with them?", options: [
    { key: "a", label: "Challenge the leader or force your way across.", points: { SW: 3, SE: 0, SC: 1 } },
    { key: "b", label: "Search the banks for signs of an older, forgotten ford.", points: { SW: 0, SE: 3, SC: 1 } },
    { key: "c", label: "Strike a bargain, use leverage, or bluff your way through.", points: { SW: 0, SE: 1, SC: 3 } },
    { key: "d", label: "Distract, parley, and slip past with a coordinated effort.", points: { SW: 1, SE: 2, SC: 1 } },
  ]},
  { id: "q12", title: "Scenario: A relic hums with dormant power—dangerous yet tempting. What do you do first?", options: [
    { key: "a", label: "Test its strength directly, whatever the risk.", points: { SW: 3, SE: 0, SC: 1 } },
    { key: "b", label: "Analyze inscriptions and patterns around it.", points: { SW: 0, SE: 3, SC: 1 } },
    { key: "c", label: "Consider buyers—or those who must never see it.", points: { SW: 0, SE: 1, SC: 3 } },
    { key: "d", label: "Secure it carefully with assigned protection roles.", points: { SW: 1, SE: 2, SC: 1 } },
  ]},
  { id: "q13", title: "Scenario: An ally is exposed mid-bluff before hostile nobles. What’s your move?", options: [
    { key: "a", label: "Step forward with steel—mockery won’t stand.", points: { SW: 3, SE: 0, SC: 1 } },
    { key: "b", label: "Recall law and history to back the bluff.", points: { SW: 0, SE: 3, SC: 1 } },
    { key: "c", label: "Twist the lie into a new story that redirects suspicion.", points: { SW: 1, SE: 0, SC: 3 } },
    { key: "d", label: "Smooth things over and share responsibility to keep peace.", points: { SW: 1, SE: 2, SC: 1 } },
  ]},
  { id: "q14", title: "Scenario: Night falls and the group debates tomorrow’s route. Where do you steer the discussion?", options: [
    { key: "a", label: "Toward likely battlefields where strength decides.", points: { SW: 3, SE: 0, SC: 1 } },
    { key: "b", label: "Toward landmarks and clues that might yield discoveries.", points: { SW: 0, SE: 3, SC: 1 } },
    { key: "c", label: "Toward settlements, allies, or rivals whose choices matter.", points: { SW: 0, SE: 1, SC: 3 } },
    { key: "d", label: "Toward supplies, watches, and group readiness.", points: { SW: 1, SE: 2, SC: 1 } },
  ]},
  { id: "q15", title: "Scenario: A friend is taken hostage by bandits in a fortified camp. What’s your plan?", options: [
    { key: "a", label: "Lead a direct charge to break their lines.", points: { SW: 3, SE: 0, SC: 1 } },
    { key: "b", label: "Scout defenses for weaknesses and patterns.", points: { SW: 0, SE: 3, SC: 1 } },
    { key: "c", label: "Negotiate with threats or promises, playing for time.", points: { SW: 0, SE: 1, SC: 3 } },
    { key: "d", label: "Craft diversions, signals, and timing for a clean extraction.", points: { SW: 1, SE: 2, SC: 1 } },
  ]},
  { id: "q16", title: "Scenario: A cloaked stranger offers a deal too good to be true. How do you react?", options: [
    { key: "a", label: "Demand proof, hand hovering near your weapon.", points: { SW: 3, SE: 0, SC: 1 } },
    { key: "b", label: "Study their words and body language for truth.", points: { SW: 0, SE: 3, SC: 1 } },
    { key: "c", label: "Play along to learn their hidden motive.", points: { SW: 1, SE: 1, SC: 3 } },
    { key: "d", label: "Pull the group together to weigh risks first.", points: { SW: 1, SE: 2, SC: 1 } },
  ]},
  { id: "q17", title: "Scenario: Pirates close in on your vessel under cover of fog. What’s your first move?", options: [
    { key: "a", label: "Rally arms, preparing to board or repel boarders.", points: { SW: 3, SE: 0, SC: 1 } },
    { key: "b", label: "Read currents and sails to find a clever escape.", points: { SW: 0, SE: 3, SC: 1 } },
    { key: "c", label: "Signal false surrender to set a trap.", points: { SW: 1, SE: 0, SC: 3 } },
    { key: "d", label: "Coordinate crew to man sails, arms, and lookout posts.", points: { SW: 1, SE: 2, SC: 1 } },
  ]},
  { id: "q18", title: "Scenario: Two rival factions court your support. How do you decide?", options: [
    { key: "a", label: "Side with the faction boasting the strongest warriors.", points: { SW: 3, SE: 0, SC: 1 } },
    { key: "b", label: "Study both factions’ histories, aims, and promises.", points: { SW: 0, SE: 3, SC: 1 } },
    { key: "c", label: "Play them against each other for gain.", points: { SW: 0, SE: 1, SC: 3 } },
    { key: "d", label: "Seek consensus with companions before committing.", points: { SW: 1, SE: 2, SC: 1 } },
  ]},
  { id: "q19", title: "Scenario: Mid-battle, an ally suddenly turns on the party. What’s your response?", options: [
    { key: "a", label: "Strike fast and hard to remove the traitor.", points: { SW: 3, SE: 0, SC: 1 } },
    { key: "b", label: "Look for the cause—possession, coercion, or mistake.", points: { SW: 0, SE: 3, SC: 1 } },
    { key: "c", label: "Turn the betrayal to your advantage with misdirection.", points: { SW: 1, SE: 0, SC: 3 } },
    { key: "d", label: "Contain the fight without endangering the group.", points: { SW: 1, SE: 2, SC: 1 } },
  ]},
  { id: "q20", title: "Scenario: You’re outnumbered, supplies are gone, and retreat is impossible. How do you face it?", options: [
    { key: "a", label: "With blades ready, determined to make them pay dearly.", points: { SW: 3, SE: 0, SC: 1 } },
    { key: "b", label: "With eyes sharp for any crack in the enemy formation.", points: { SW: 0, SE: 3, SC: 1 } },
    { key: "c", label: "With a scheme—fake surrender, hidden trap, or surprise ally.", points: { SW: 1, SE: 0, SC: 3 } },
    { key: "d", label: "With unity, ensuring the group holds together to the last.", points: { SW: 1, SE: 2, SC: 1 } },
  ]},
];

/* ----------
   CSV helpers
---------- */
function toCSV(rows) {
  if (!rows || !rows.length) return "";
  const heads = Object.keys(rows[0]);
  let out = heads.join(",") + "\n";
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    out += heads.map((h) => JSON.stringify(r[h] == null ? "" : r[h])).join(",") + "\n";
  }
  return out;
}
function downloadCSVFile(filename, csv) {
  const BOM = "\uFEFF";
  const data = BOM + (csv || "");
  try {
    const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 0);
    return true;
  } catch (_) {}
  try {
    const dataUrl = "data:text/csv;charset=utf-8," + encodeURIComponent(data);
    const win = window.open(dataUrl, "_blank");
    if (win) return true;
  } catch (_) {}
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(data);
      alert("CSV copied to clipboard. Paste into a file and save.");
      return true;
    }
  } catch (_) {}
  alert("Could not trigger a download. Allow popups or use the Copy CSV button.");
  return false;
}

/* ----------
   Ternary math & helpers
---------- */
function ternaryToXY(sw, se, sc, size) {
  const A = { x: 0, y: size }; // SW
  const B = { x: size, y: size }; // SE
  const C = { x: size / 2, y: 0 }; // SC
  const x = sw * A.x + se * B.x + sc * C.x;
  const y = sw * A.y + se * B.y + sc * C.y;
  return { x, y };
}
function normalize(sw, se, sc) {
  const t = sw + se + sc;
  if (t <= 0) return { sw: 1 / 3, se: 1 / 3, sc: 1 / 3 };
  return { sw: sw / t, se: se / t, sc: sc / t };
}
function triVertices(size, pad) {
  return {
    A: { x: pad, y: size - pad },
    B: { x: size - pad, y: size - pad },
    C: { x: size / 2, y: pad },
    O: { x: size / 2, y: (size * 2) / 3 }, // centroid in our coordinates
  };
}
function lerp(p, q, t) {
  return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
}
function indicatorTriangle(share, size, pad) {
  const { A, B, C, O } = triVertices(size, pad);
  const a = lerp(O, A, share.SW);
  const b = lerp(O, B, share.SE);
  const c = lerp(O, C, share.SC);
  return [a, b, c];
}

/* ----------
   Component
---------- */
export default function UlvarethQuizApp() {
  const TOTAL_QUESTIONS = QUESTIONS.length;

  // Auto-minimal on phones (initial value only; user can switch via dropdown)
  const isMobile = useIsMobile();
  const [layout, setLayout] = useState(() => (isMobile ? "minimal" : "classic")); // "classic" | "minimal"

  const [player, setPlayer] = useState("");
  const [selections, setSelections] = useState({});
  const [showTop, setShowTop] = useState(false);
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ulvareth_quiz_results");
      if (raw) {
        setSaved(JSON.parse(raw));
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toggle(qid, key) {
    setSelections((prev) => {
      const q = { ...(prev[qid] || {}) };
      q[key] = !q[key];
      return { ...prev, [qid]: q };
    });
  }
  function resetSelections() {
    setSelections({});
  }

  const totals = useMemo(() => {
    let SW = 0,
      SE = 0,
      SC = 0;
    for (const q of QUESTIONS) {
      const chosen = selections[q.id] || {};
      for (const opt of q.options) {
        if (chosen[opt.key]) {
          SW += opt.points.SW;
          SE += opt.points.SE;
          SC += opt.points.SC;
        }
      }
    }
    return { SW, SE, SC };
  }, [selections]);

  const { sw: nsw, se: nse, sc: nsc } = useMemo(
    () => normalize(totals.SW, totals.SE, totals.SC),
    [totals]
  );
  const pct = useMemo(
    () => ({ SW: Math.round(nsw * 100), SE: Math.round(nse * 100), SC: Math.round(nsc * 100) }),
    [nsw, nse, nsc]
  );

  const primary = useMemo(() => {
    const vals = [
      { k: "SW", v: pct.SW, label: "Swords", color: PALETTE.aetherglass },
      { k: "SE", v: pct.SE, label: "Seekers", color: PALETTE.verdant },
      { k: "SC", v: pct.SC, label: "Schemers", color: PALETTE.shroud },
    ].sort((a, b) => b.v - a.v);
    return { first: vals[0], second: vals[1], third: vals[2] };
  }, [pct]);

  // Progress
  const answeredCount = useMemo(() => {
    let n = 0;
    for (const q of QUESTIONS) {
      const chosen = selections[q.id] || {};
      if (Object.values(chosen).some(Boolean)) n++;
    }
    return n;
  }, [selections]);
  const remaining = TOTAL_QUESTIONS - answeredCount;
  const progressPct = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);

  function buildCSV() {
    const rows = [
      {
        Player: player || "Player",
        Primary: primary.first.label,
        Secondary: primary.second.label,
        SW_total: totals.SW,
        SE_total: totals.SE,
        SC_total: totals.SC,
        SW_pct: pct.SW,
        SE_pct: pct.SE,
        SC_pct: pct.SC,
      },
    ];
    return toCSV(rows);
  }
  function downloadCSV() {
    const csv = buildCSV();
    const safe = (player || "Player")
      .trim()
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_+|_+$/g, "");
    const name = (safe ? safe + "_" : "") + "Ulvareth_Quiz_Result.csv";
    downloadCSVFile(name, csv);
  }
  async function copyCSV() {
    const csv = buildCSV();
    try {
      await navigator.clipboard.writeText(csv);
      alert("CSV copied to clipboard.");
    } catch (_) {
      alert("Could not copy. Try Download CSV.");
    }
  }
  function saveResult() {
    const entry = {
      ts: new Date().toISOString(),
      player: player || "Player",
      primary: primary.first.label,
      secondary: primary.second.label,
      SW_total: totals.SW,
      SE_total: totals.SE,
      SC_total: totals.SC,
      SW_pct: pct.SW,
      SE_pct: pct.SE,
      SC_pct: pct.SC,
    };
    const next = [entry, ...saved].slice(0, 50);
    setSaved(next);
    try {
      localStorage.setItem("ulvareth_quiz_results", JSON.stringify(next));
    } catch (_) {}
  }
  function clearSaved() {
    if (!confirm("Clear saved results?")) return;
    setSaved([]);
    try {
      localStorage.removeItem("ulvareth_quiz_results");
    } catch (_) {}
  }

  // Send to DM: copy a URL the DM app can open to import
  function sendToDM() {
    const payload = {
      ts: new Date().toISOString(),
      player: player || "Player",
      primary: primary.first.label,
      secondary: primary.second.label,
      SW_total: totals.SW,
      SE_total: totals.SE,
      SC_total: totals.SC,
      SW_pct: pct.SW,
      SE_pct: pct.SE,
      SC_pct: pct.SC,
      selections, // raw answers
    };
    const data = encodePayload(payload);

    // Use GitHub Pages URL in prod, localhost in dev
    const isPages = typeof window !== "undefined" && /github\.io$/.test(window.location.host);
    const dmUrl = isPages
      ? `https://amonogue.github.io/ulvareth-dnd-app/gm/#/import?data=${data}`
      : `http://localhost:5174/#/import?data=${data}`;

    navigator.clipboard?.writeText(dmUrl);
    alert("Link copied! Open the GM/Admin app and paste in your browser.");
  }

  // Sidebar panels (both pinned)
  const ControlsPanel = (
    <div
      className="rounded-2xl border p-4 sticky top-2 z-20"
      style={{ borderColor: PALETTE.ash, background: "#fff" }}
    >
      <div className="grid gap-3">
        <label className="text-sm grid gap-1">
          <span>Name</span>
          <input
            value={player}
            onChange={(e) => setPlayer(e.currentTarget.value)}
            placeholder="Your name"
            className="px-3 py-2 rounded-xl border"
            style={{ borderColor: PALETTE.ash, background: "#fff" }}
          />
        </label>

        {/* Questions remaining + progress */}
        <div className="grid gap-1 text-sm">
          <div className="flex items-center justify-between">
            <span style={{ color: PALETTE.coal }}>Questions remaining</span>
            <span className="font-medium" style={{ color: PALETTE.aetherglass }}>
              {remaining} / {TOTAL_QUESTIONS}
            </span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: hexToRgba(PALETTE.silver, 0.6) }}>
            <div className="h-2 rounded-full" style={{ width: `${progressPct}%`, background: PALETTE.aetherglass }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={downloadCSV} className="px-3 py-2 rounded-xl text-white" style={{ background: PALETTE.aetherglass }}>
            Download CSV
          </button>
          <button onClick={copyCSV} className="px-3 py-2 rounded-xl text-white" style={{ background: PALETTE.shroud }}>
            Copy CSV
          </button>
          <button onClick={saveResult} className="px-3 py-2 rounded-xl text-white" style={{ background: PALETTE.verdant }}>
            Save Result
          </button>
          <button onClick={resetSelections} className="px-3 py-2 rounded-xl text-white" style={{ background: PALETTE.ember }}>
            Reset
          </button>
        </div>

        {/* NEW: Send to DM */}
        <button
          onClick={sendToDM}
          className="mt-2 w-full px-3 py-2 rounded-xl text-white"
          style={{ background: PALETTE.coal }}
        >
          Send to DM
        </button>

        <div className="text-sm grid gap-1">
          <span style={{ color: PALETTE.ash }}>Layout</span>
          <select
            value={layout}
            onChange={(e) => setLayout(e.currentTarget.value)}
            className="px-2 py-2 rounded-lg border"
            style={{ borderColor: PALETTE.ash, background: "#fff" }}
          >
            <option value="classic">Classic (Sidebar)</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>
      </div>
    </div>
  );

  const ResultsPanel = (
    <div
      className="rounded-2xl border p-4 sticky top-40 z-10"
      style={{ borderColor: PALETTE.ash, background: PALETTE.silver }}
    >
      <h4 className="font-semibold mb-2" style={{ color: PALETTE.aetherglass }}>
        Your Mix
      </h4>
      <Ternary sw={nsw} se={nse} sc={nsc} />
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-lg p-2 text-white" style={{ background: PALETTE.aetherglass }}>
          <div className="text-xs opacity-80">Swords</div>
          <div className="text-lg font-semibold">{pct.SW}%</div>
        </div>
        <div className="rounded-lg p-2 text-white" style={{ background: PALETTE.verdant }}>
          <div className="text-xs opacity-80">Seekers</div>
          <div className="text-lg font-semibold">{pct.SE}%</div>
        </div>
        <div className="rounded-lg p-2 text-white" style={{ background: PALETTE.shroud }}>
          <div className="text-xs opacity-80">Schemers</div>
          <div className="text-lg font-semibold">{pct.SC}%</div>
        </div>
      </div>
      <div className="mt-3 text-sm">
        <div>
          <b>Primary:</b> {primary.first.label}
        </div>
        <div>
          <b>Secondary:</b> {primary.second.label}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: PALETTE.pearl, color: PALETTE.coal }}>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 grid gap-4 sm:gap-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ color: PALETTE.aetherglass }}>
              Ulvareth Play Style Quiz
            </h1>
            <p className="text-sm" style={{ color: PALETTE.ash }}>
              Pick any number of answers per question. This is about play style, not correctness.
            </p>
          </div>
        </header>

        {/* Main grid */}
        {layout === "classic" ? (
          <div className="grid gap-4 sm:gap-6" style={{ gridTemplateColumns: "minmax(0,1fr) 320px" }}>
            <div className="grid gap-3">
              {QUESTIONS.map((q) => {
                const chosen = selections[q.id] || {};
                const answered = Object.values(chosen).some(Boolean);
                return (
                  <div
                    key={q.id}
                    className="rounded-2xl border p-3 sm:p-4"
                    style={{
                      borderColor: PALETTE.ash,
                      background: answered ? hexToRgba(PALETTE.silver, 0.6) : "#fff",
                    }}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="font-semibold" style={{ color: PALETTE.aetherglass }}>
                        {q.title}
                      </h3>
                    </div>
                    <div className="grid gap-2">
                      {q.options.map((opt) => {
                        const key = `${q.id}:${opt.key}`;
                        const checked = !!chosen[opt.key];
                        return (
                          <label
                            key={key}
                            className="flex items-start gap-3 rounded-2xl border p-3 cursor-pointer"
                            style={{
                              borderColor: PALETTE.ash,
                              background: checked
                                ? hexToRgba(PALETTE.pearl, 0.9)
                                : hexToRgba(PALETTE.silver, 0.4),
                            }}
                          >
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4"
                              checked={checked}
                              onChange={() => toggle(q.id, opt.key)}
                              style={{ accentColor: PALETTE.aetherglass }}
                            />
                            <span className="leading-snug">
                              <b className="opacity-80 mr-1 uppercase text-xs">{opt.key}</b> {opt.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right sidebar (both panels pinned) */}
            <aside className="flex flex-col gap-4">{ControlsPanel}{ResultsPanel}</aside>
          </div>
        ) : (
          // Minimal layout: controls + results below questions
          <div className="grid gap-4 sm:gap-6">
            <div className="grid gap-3">
              {QUESTIONS.map((q) => {
                const chosen = selections[q.id] || {};
                const answered = Object.values(chosen).some(Boolean);
                return (
                  <div
                    key={q.id}
                    className="rounded-2xl border p-3 sm:p-4"
                    style={{
                      borderColor: PALETTE.ash,
                      background: answered ? hexToRgba(PALETTE.silver, 0.6) : "#fff",
                    }}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="font-semibold" style={{ color: PALETTE.aetherglass }}>
                        {q.title}
                      </h3>
                    </div>
                    <div className="grid gap-2">
                      {q.options.map((opt) => {
                        const key = `${q.id}:${opt.key}`;
                        const checked = !!chosen[opt.key];
                        return (
                          <label
                            key={key}
                            className="flex items-start gap-3 rounded-2xl border p-3 cursor-pointer"
                            style={{
                              borderColor: PALETTE.ash,
                              background: checked
                                ? hexToRgba(PALETTE.pearl, 0.9)
                                : hexToRgba(PALETTE.silver, 0.4),
                            }}
                          >
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4"
                              checked={checked}
                              onChange={() => toggle(q.id, opt.key)}
                              style={{ accentColor: PALETTE.aetherglass }}
                            />
                            <span className="leading-snug">
                              <b className="opacity-80 mr-1 uppercase text-xs">{opt.key}</b> {opt.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {ControlsPanel}
            {ResultsPanel}
          </div>
        )}
      </div>

      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-4 right-4 px-3 py-2 rounded-xl text-white shadow-lg"
          style={{ background: PALETTE.aetherglass }}
        >
          Back to top
        </button>
      )}
    </div>
  );
}

/* ----------
   Chart component
---------- */
function Ternary(props) {
  const size = 260; // px
  const pad = 18;
  const sw = Math.max(0, Math.min(1, props.sw));
  const se = Math.max(0, Math.min(1, props.se));
  const sc = Math.max(0, Math.min(1, props.sc));

  const S = size;
  const { A, B, C, O } = triVertices(S, pad);

  // Grid: 4 inner concentric triangles
  const levels = [0.2, 0.4, 0.6, 0.8];
  const gridTris = levels.map((t) => {
    const a = lerp(O, A, t);
    const b = lerp(O, B, t);
    const c = lerp(O, C, t);
    return `${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`;
  });

  // Player indicator triangle (filled)
  const tri = indicatorTriangle({ SW: sw, SE: se, SC: sc }, S, pad);
  const triPoints = `${tri[0].x},${tri[0].y} ${tri[1].x},${tri[1].y} ${tri[2].x},${tri[2].y}`;

  return (
    <svg viewBox={`0 0 ${S} ${S}`} width="100%" height={S}>
      <defs>
        <linearGradient id="triFill" x1="0" x2="1" y1="1" y2="0">
          <stop offset="0%" stopColor={hexToRgba(PALETTE.aetherglass, 0.18)} />
          <stop offset="50%" stopColor={hexToRgba(PALETTE.verdant, 0.18)} />
          <stop offset="100%" stopColor={hexToRgba(PALETTE.shroud, 0.18)} />
        </linearGradient>
      </defs>

      {/* Outer triangle */}
      <polygon
        points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`}
        fill={hexToRgba(PALETTE.silver, 0.25)}
        stroke={PALETTE.ash}
        strokeWidth={1.5}
      />

      {/* Concentric grid */}
      {gridTris.map((p, i) => (
        <polygon key={i} points={p} fill="none" stroke={hexToRgba(PALETTE.ash, 0.55)} strokeWidth={0.8} />
      ))}

      {/* Indicator triangle */}
      <polygon points={triPoints} fill={hexToRgba(PALETTE.aetherglass, 0.22)} stroke={PALETTE.aetherglass} strokeWidth={2} />

      {/* Axis labels */}
      <text x={A.x - 36} y={A.y + 18} fontSize="12" fill={PALETTE.coal}>
        Swords
      </text>
      <text x={B.x - 42} y={B.y + 18} fontSize="12" fill={PALETTE.coal}>
        Schemers
      </text>
      <text x={C.x - 24} y={C.y - 8} fontSize="12" fill={PALETTE.coal}>
        Seekers
      </text>
    </svg>
  );
}

/* ----------
   Lightweight runtime self-tests
---------- */
(function selfTests() {
  try {
    const csv = toCSV([{ a: 1, b: 2 }]);
    console.assert(csv.startsWith("a,b\n"), "toCSV header newline");
    console.assert(csv.split("\n")[1].startsWith("1,2"), "toCSV first row");

    const csv2 = toCSV([{ a: "x,y", b: '"q"' }]);
    console.assert(csv2.includes('"x,y"'), "toCSV keeps comma inside quotes");
    console.assert(csv2.includes('"\\"q\\""'), "toCSV JSON-quotes inner quotes");

    const csv3 = toCSV([
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ]);
    console.assert(csv3.split("\n")[2].startsWith("3,4"), "toCSV second row present");
    console.assert(csv3.endsWith("\n"), "toCSV ends with a newline");

    const n = normalize(0, 0, 0);
    console.assert(
      Math.abs(n.sw - 1 / 3) < 1e-9 && Math.abs(n.se - 1 / 3) < 1e-9 && Math.abs(n.sc - 1 / 3) < 1e-9,
      "normalize handles zero totals"
    );

    const n2 = normalize(2, 1, 1);
    console.assert(
      Math.abs(n2.sw - 0.5) < 1e-9 && Math.abs(n2.se - 0.25) < 1e-9 && Math.abs(n2.sc - 0.25) < 1e-9,
      "normalize typical distribution"
    );

    const S = 100;
    const A = ternaryToXY(1, 0, 0, S),
      B = ternaryToXY(0, 1, 0, S),
      C = ternaryToXY(0, 0, 1, S);
    console.assert(A.x === 0 && A.y === S && B.x === S && B.y === S && C.x === S / 2 && C.y === 0, "ternaryToXY vertices");

    const E = ternaryToXY(1 / 3, 1 / 3, 1 / 3, S);
    console.assert(
      Math.abs(E.x - S / 2) < 1e-9 && Math.abs(E.y - (2 * S) / 3) < 1e-9,
      "ternaryToXY centroid for equal mix"
    );
  } catch (e) {
    console.error("Self-tests error", e);
  }
})();

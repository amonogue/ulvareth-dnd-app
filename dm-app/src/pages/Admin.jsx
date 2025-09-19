import React, { useMemo, useState, useEffect, useRef } from "react";

/* =========================================================================
   Ulvareth DM Admin — Tailwind-free version (pure inline styles)
   - Tabs: Admin | Inbox
   - Robust Upload button (ref -> hidden file input)
   - Drag & drop CSV, grouping, export
   - Inbox accepts payload via #/import?data=...
   ========================================================================= */

const PALETTE = {
  aetherglass: "#3A6D8C", // Swords / primary
  ringfall:   "#D4A843",  // accent
  shroud:     "#5C3B6E",  // Schemers
  coal:       "#2F2F2F",  // text
  ash:        "#9A9A9A",  // borders/muted
  verdant:    "#3D6B35",  // Seekers
  pearl:      "#E6E1D3",  // background
  silver:     "#C1CAD6",  // cards
  danger:     "#B6402C",  // alerts
};

const S = {
  page:      { minHeight: "100vh", padding: "16px", background: PALETTE.pearl, color: PALETTE.coal, boxSizing: "border-box" },
  container: { maxWidth: 1100, margin: "0 auto", display: "grid", gap: 24 },
  headerRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  h1:        { margin: 0, fontSize: 26, fontWeight: 600, color: PALETTE.aetherglass },
  sub:       { margin: 0, fontSize: 13, color: PALETTE.ash },
  tabBtn:    (active)=>({
               padding: "8px 12px", borderRadius: 10, border: `1px solid ${PALETTE.ash}`,
               background: active ? PALETTE.ringfall : "#fff", cursor: "pointer"
             }),
  card:      { background: PALETTE.silver, border: `1px solid ${PALETTE.ash}`, borderRadius: 16, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" },
  button:    { padding: "10px 16px", borderRadius: 12, border: `1px solid ${PALETTE.ringfall}`, background: PALETTE.aetherglass, color: "#fff", fontWeight: 600, cursor: "pointer" },
  buttonLite:{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${PALETTE.ash}`, background: "#fff", cursor: "pointer" },
  input:     { padding: "8px 10px", borderRadius: 10, border: `1px solid ${PALETTE.ash}`, background: "#fff" },
  badge:     (bg,fg="#fff")=>({ display: "inline-block", padding: "2px 8px", borderRadius: 999, background: bg, color: fg }),
  dashed:    (active)=>({
               border: `2px dashed ${active? PALETTE.aetherglass : PALETTE.ash}`,
               background: active ? rgba(PALETTE.pearl,0.9) : rgba(PALETTE.pearl,0.6),
               borderRadius: 16, padding: 24, textAlign: "center", cursor: "pointer", transition: "box-shadow .15s"
             }),
  partyGrid: { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" },
  partyBox:  (accent,hover)=>({
               border: `1px solid ${PALETTE.ash}`, borderLeft: `4px solid ${accent}`, borderRadius: 12,
               padding: 12, background: rgba(PALETTE.pearl,0.95),
               boxShadow: hover ? `0 0 0 3px ${rgba(accent,0.25)}` : "none"
             }),
  tableWrap: { overflowX: "auto" },
  table:     { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th:        { textAlign: "left", padding: "6px 12px 6px 0", color: PALETTE.ash, whiteSpace: "nowrap" },
  td:        { padding: "6px 12px 6px 0", borderTop: `1px solid ${PALETTE.ash}` },
  small:     { fontSize: 12, color: PALETTE.ash },
};

function rgba(hex, a){
  const h = String(hex||"").replace("#","");
  const r = parseInt(h.slice(0,2)||"00",16);
  const g = parseInt(h.slice(2,4)||"00",16);
  const b = parseInt(h.slice(4,6)||"00",16);
  return `rgba(${r},${g},${b},${a})`;
}

function catColor(cat){
  return cat === "SW" ? PALETTE.aetherglass : (cat === "SE" ? PALETTE.verdant : PALETTE.shroud);
}

/* ---------------------- CSV helpers ---------------------- */
function toCSV(rows){
  if (!rows || !rows.length) return "";
  const heads = Object.keys(rows[0]);
  let out = heads.join(",") + "\n";
  for (let i=0;i<rows.length;i++){
    const r = rows[i];
    out += heads.map(h => JSON.stringify(r[h]==null ? "" : r[h])).join(",") + "\n";
  }
  return out;
}

function downloadCSVFile(filename, csv){
  const BOM = "\uFEFF";
  const data = BOM + (csv || "");
  try{
    const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
    if (typeof window !== "undefined" && navigator && navigator.msSaveBlob){
      navigator.msSaveBlob(blob, filename);
      return true;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(()=>{ a.remove(); URL.revokeObjectURL(url); }, 0);
    return true;
  }catch(_e){}
  try{
    const dataUrl = "data:text/csv;charset=utf-8," + encodeURIComponent(data);
    const win = window.open(dataUrl, "_blank"); if (win) return true;
  }catch(_e){}
  try{
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(data);
      alert("CSV copied to clipboard. Paste into a file named "+filename+" and save.");
      return true;
    }
  }catch(_e){}
  alert("Could not trigger a download. Please allow popups or right-click > Save link as…");
  return false;
}

/* ---------------------- CSV parsing ---------------------- */
function sniffDelimiter(headerLine){
  const candidates = [",",";","\t"];
  let best = ","; let bestCount = -1;
  for (const c of candidates){
    const n = headerLine.split(c).length;
    if (n>bestCount){ bestCount = n; best = c; }
  }
  return best;
}
function parseCSV(text){
  let s = String(text||"").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (s.length && s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
  const firstLine = (s.split("\n").find(l=> l.trim().length>0) || "");
  const DELIM = sniffDelimiter(firstLine);

  const rows=[]; let row=[]; let field=""; let i=0; let inQ=false;
  while(i<s.length){
    const ch = s[i];
    if (inQ){
      if (ch === '"'){
        if (i+1<s.length && s[i+1] === '"'){ field+='"'; i+=2; continue; }
        inQ=false; i++; continue;
      }
      field+=ch; i++; continue;
    } else {
      if (ch === '"'){ inQ=true; i++; continue; }
      if (ch === DELIM){ row.push(field); field=""; i++; continue; }
      if (ch === "\n"){ row.push(field); rows.push(row); row=[]; field=""; i++; continue; }
      field+=ch; i++; continue;
    }
  }
  row.push(field); rows.push(row);

  while(rows.length && rows[0].every(v=> String(v||"").trim()==="")) rows.shift();
  while(rows.length && rows[rows.length-1].every(v=> String(v||"").trim()==="")) rows.pop();
  if (!rows.length) return [];

  const headers = rows[0].map(h=> String(h||"").trim());
  const out=[];
  for(let r=1;r<rows.length;r++){
    if (rows[r].length===1 && String(rows[r][0]||"").trim()==="") continue;
    const obj={};
    for(let c=0;c<headers.length;c++){
      const key = headers[c];
      const val = (rows[r][c]!==undefined) ? String(rows[r][c]).trim() : "";
      obj[key] = val;
    }
    out.push(obj);
  }
  return out;
}

/* ---------------------- Domain helpers ---------------------- */
function labelFor(code){ return code==='SW' ? 'Swords' : (code==='SE' ? 'Seekers' : 'Schemers'); }
function codeFor(label){
  const t=String(label||"").toLowerCase();
  if(t.includes('sword')) return 'SW';
  if(t.includes('seek'))  return 'SE';
  if(t.includes('schem')) return 'SC';
  return null;
}
function recomputePrimarySecondary(obj){
  const normKeys={}; Object.keys(obj||{}).forEach(k=> normKeys[k.toLowerCase()] = obj[k]);
  const pick = (name)=> normKeys[name.toLowerCase()];
  const num = (x)=>{ if (x==null || x==="") return 0; const v = typeof x==="string" ? parseFloat(x) : x; return isNaN(v)?0:v; };

  let sw = num(pick('SW_total') ?? pick('sw_total')),
      se = num(pick('SE_total') ?? pick('se_total')),
      sc = num(pick('SC_total') ?? pick('sc_total'));
  if (!(sw||se||sc)) { sw=num(pick('SW_pct') ?? pick('sw_pct')); se=num(pick('SE_pct') ?? pick('se_pct')); sc=num(pick('SC_pct') ?? pick('sc_pct')); }

  const providedP = codeFor(pick('Primary'));
  const providedS = codeFor(pick('Secondary'));

  const totals = { SW: sw||0, SE: se||0, SC: sc||0 };
  const priority = { SW:0, SE:1, SC:2 };
  const order = ["SW","SE","SC"].sort((a,b)=> (totals[b]-totals[a]) || (priority[a]-priority[b]));
  const primary = providedP || order[0];
  const secondary = providedS || order[1];
  return { primary, secondary, totals };
}

/* ---------------------- Sample CSVs ---------------------- */
function getSampleCSVs(){
  const balanced = `Player,SW_total,SE_total,SC_total,Primary,Secondary
Aria Swift,6,3,2,Swords,Seekers
Borin Stonehelm,5,2,4,Swords,Schemers
Cyril the Wry,1,3,6,Schemers,Seekers
"Doe, Jane",2,6,3,Seekers,Schemers
Edda Mapmaker,3,6,2,Seekers,Swords
Ilya Stormborn,7,2,1,Swords,Seekers
Kellan Tidewalker,3,5,2,Seekers,Swords
Lady Vexa Crowe,1,4,6,Schemers,Seekers
Mira Greenbough,2,6,3,Seekers,Schemers
Sir Rowan Hale,6,2,2,Swords,Seekers
`;
  const skewed = `Player,SW_total,SE_total,SC_total,Primary,Secondary
Rook Blackfletch,4,1,6,Schemers,Swords
Peregrin Quickstep,3,6,1,Seekers,Schemers
Nessa Wayfinder,4,5,1,Seekers,Swords
"Q ""The Quiet""",2,3,7,Schemers,Seekers
The Archivist,1,4,6,Schemers,Seekers
Thorn Redhand,7,1,2,Swords,Schemers
Varric Gearhand,6,2,2,Swords,Seekers
Beryl Ironsong,8,1,1,Swords,Seekers
Dain Emberfall,7,1,2,Swords,Seekers
Kara Locklore,6,1,3,Swords,Schemers
`;
  const messy = ` Player , SW_total , SE_total , SC_total , Primary , Secondary 

Ivo Stormborn,4,2,5,,
Selene Nightwhisper,1,2,7,,Seekers
Quinn Glass,3,5,2,Seekers,Schemers
Rhea Blackbarrow,5,2,3,Swords,
Orin Dawnscribe,2,6,3,,Swords
`;
  const percents = `Player,SW_pct,SE_pct,SC_pct,Primary,Secondary
Aelin Starborn,0.70,0.20,0.10,Swords,Seekers
Brax Coppervein,0.65,0.10,0.25,Swords,Schemers
Cassia Drift,0.20,0.65,0.15,Seekers,Schemers
Dorian Shade,0.10,0.25,0.65,Schemers,Seekers
Eryk Windmere,0.30,0.60,0.10,Seekers,Swords
Faye Moonfall,0.25,0.15,0.60,Schemers,Swords
Galen Mire,0.55,0.25,0.20,Swords,Seekers
Helia Dawnbreak,0.15,0.70,0.15,Seekers,Schemers
Isolde Fen,0.40,0.45,0.15,Seekers,Swords
Jax Stillwater,0.35,0.15,0.50,Schemers,Swords
Kael Nightwind,0.60,0.20,0.20,Swords,Seekers
Lyra Quicksilver,0.20,0.60,0.20,Seekers,Schemers
`;
  const overflow = (()=>{
    const rows = ["Player,SW_total,SE_total,SC_total"];
    const first=["Asha","Bryn","Corin","Dara","Evan","Finn","Gwen","Hale","Ira","Jori","Kade","Lena"];
    const last=["Ashfall","Bright","Cole","Dorn","Ever","Frost","Gale","Hearth","Ivory","Jules","Keene","Lark"];
    for(let i=0;i<24;i++){
      const f = first[i%first.length]; const l = last[Math.floor(i/first.length)%last.length];
      const sw=Math.floor(Math.random()*8), se=Math.floor(Math.random()*8), sc=Math.floor(Math.random()*8);
      rows.push(`${f} ${l},${sw},${se},${sc}`);
    }
    return rows.join("\n")+"\n";
  })();
  return { balanced, skewed, messy, percents, overflow };
}

/* ---------------------- Grouping ---------------------- */
function suggestGroups(rows, partySize){
  const size = Math.max(3, Math.min(8, partySize||5));
  const players = (rows||[]).map((r,idx)=>{ const p=recomputePrimarySecondary(r); return {
    index: idx,
    Player: r.Player||r.player||`Player ${idx+1}`,
    Primary: r.Primary? (codeFor(r.Primary)||p.primary) : p.primary,
    Secondary: r.Secondary? (codeFor(r.Secondary)||p.secondary) : p.secondary,
    totals: p.totals
  }; });
  const used={}; const pools={SW:[],SE:[],SC:[]};
  for (let i=0;i<players.length;i++) pools[players[i].Primary].push(players[i]);
  const groupCount = Math.max(1, Math.ceil(players.length/size));
  const groups = Array.from({length: groupCount}, ()=>({ name:"Balanced", members:[], need:{SW:true,SE:true,SC:true}, labelCounts:{Swords:0,Seekers:0,Schemers:0} }));
  const takeFrom = (cat)=>{ const arr=pools[cat]; if(!arr.length) return null; return arr.shift(); };
  const cats=["SW","SE","SC"];
  for (let ci=0;ci<cats.length;ci++){
    for (let gi=0;gi<groups.length;gi++){
      if (groups[gi].members.length<size){
        const p=takeFrom(cats[ci]); if(p){ groups[gi].members.push(p); groups[gi].need[cats[ci]]=false; used[p.index]=true; }
      }
    }
  }
  let remaining = players.filter(p=> !used[p.index]);
  for (let gi=0; gi<groups.length; gi++){
    while (groups[gi].members.length < size && remaining.length){
      let idx = remaining.findIndex(c=> groups[gi].need[c.Secondary]);
      if (idx<0) idx = 0;
      const chosen = remaining.splice(idx,1)[0];
      groups[gi].members.push(chosen); groups[gi].need[chosen.Secondary]=false;
    }
  }
  let gi=0; while(remaining.length){ const c=remaining.shift(); if(groups[gi].members.length<size) groups[gi].members.push(c); gi=(gi+1)%groups.length; }
  for (let g=0; g<groups.length; g++){
    const mem = groups[g].members;
    for (let m=0;m<mem.length;m++){ const lbl = labelFor(mem[m].Primary); groups[g].labelCounts[lbl]+=1; mem[m].PrimaryLabel=lbl; mem[m].SecondaryLabel=labelFor(mem[m].Secondary); mem[m].Group=g+1; mem[m].GroupName=groups[g].name+" "+(g+1); }
  }
  return groups;
}

function suggestGroupsByCategory(rows, partySize){
  const size = Math.max(3, Math.min(8, partySize||5));
  const players = (rows||[]).map((r,idx)=>{ const p=recomputePrimarySecondary(r); return {
    index: idx,
    Player: r.Player||r.player||`Player ${idx+1}`,
    Primary: r.Primary? (codeFor(r.Primary)||p.primary) : p.primary,
    Secondary: r.Secondary? (codeFor(r.Secondary)||p.secondary) : p.secondary,
    totals: p.totals
  }; });

  const maxes = players.reduce((acc,p)=>({
    SW: Math.max(acc.SW, Number(p.totals.SW)||0),
    SE: Math.max(acc.SE, Number(p.totals.SE)||0),
    SC: Math.max(acc.SC, Number(p.totals.SC)||0),
  }), {SW:1,SE:1,SC:1});
  const norm = (p, cat)=>{ const v=Number(p.totals[cat])||0; const m=maxes[cat]||1; return m? (v/m) : 0; };

  const prim={SW:[],SE:[],SC:[]}; for(let i=0;i<players.length;i++) prim[players[i].Primary].push(players[i]);

  const mkGroup = (cat,idx)=>({ name: labelFor(cat), category: cat, index: idx, members:[], labelCounts:{Swords:0,Seekers:0,Schemers:0}, secCoverage:{SW:0,SE:0,SC:0} });
  const groups=[];
  const cats=["SW","SC","SE"];
  for (let ci=0;ci<cats.length;ci++){
    const c=cats[ci]; const count=Math.max(1, Math.ceil(prim[c].length/size));
    for (let j=0;j<count;j++) groups.push(mkGroup(c,j));
  }
  const assigned=new Set();

  // Fill primaries
  for (let ci=0;ci<cats.length;ci++){
    const cat=cats[ci]; const catGroups=groups.filter(g=> g.category===cat);
    for (let gi=0; gi<catGroups.length && prim[cat].length; gi++){
      const g=catGroups[gi];
      while (g.members.length<size && prim[cat].length){
        const p=prim[cat].shift(); g.members.push(p); assigned.add(p.index);
        g.secCoverage[p.Secondary] = (g.secCoverage[p.Secondary]||0) + 1;
      }
    }
  }
  // Compact forward
  for (let ci=0;ci<cats.length;ci++){
    const cat=cats[ci]; const catGroups=groups.filter(g=> g.category===cat);
    for (let gi=0; gi<catGroups.length-1; gi++){
      const g=catGroups[gi];
      for (let gj=catGroups.length-1; gj>gi && g.members.length<size; gj--){
        const src=catGroups[gj]; if(!src.members.length) continue; const moved=src.members.shift(); g.members.push(moved);
      }
    }
  }

  let remaining = players.filter(p=> !assigned.has(p.index));
  const fitScore = (p,cat,g)=> ( (p.Secondary===cat?2.5:0) + 1.25*norm(p,cat) + (g&&g.secCoverage && g.secCoverage[p.Secondary]===0 ? 0.25 : 0) );

  for (let gi=0; gi<groups.length; gi++){
    const g=groups[gi];
    while(g.members.length<size && remaining.length){
      let best=-1, bestIdx=0;
      for (let i=0;i<remaining.length;i++){ const s=fitScore(remaining[i], g.category, g); if(s>best){ best=s; bestIdx=i; } }
      const chosen = remaining.splice(bestIdx,1)[0];
      g.members.push(chosen);
      g.secCoverage[chosen.Secondary] = (g.secCoverage[chosen.Secondary]||0) + 1;
    }
  }
  let gi2=0; while(remaining.length){
    const g=groups[gi2%groups.length];
    if (g.members.length<size){
      let best=-1, bestIdx=0;
      for (let i=0;i<remaining.length;i++){ const s=fitScore(remaining[i], g.category, g); if(s>best){ best=s; bestIdx=i; } }
      const chosen = remaining.splice(bestIdx,1)[0];
      g.members.push(chosen);
      g.secCoverage[chosen.Secondary] = (g.secCoverage[chosen.Secondary]||0) + 1;
    }
    gi2++;
  }
  for (let g=0; g<groups.length; g++){
    const grp=groups[g];
    for (let m=0;m<grp.members.length;m++){
      const mem=grp.members[m]; const lbl=labelFor(mem.Primary);
      grp.labelCounts[lbl] = (grp.labelCounts[lbl]||0) + 1;
      mem.PrimaryLabel=lbl; mem.SecondaryLabel=labelFor(mem.Secondary);
      mem.Group=g+1; mem.GroupName = grp.name + " " + ((grp.index||0)+1);
    }
  }
  return groups;
}

/* ====================== Component ====================== */
export default function UlvarethDMAdmin(){
  const [tab, setTab] = useState("admin"); // admin | inbox
  const [partySize, setPartySize] = useState(5);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [csvObjUrl, setCsvObjUrl] = useState("");
  const [csvFileName, setCsvFileName] = useState("Ulvareth_Group_Assignments.csv");
  const [lastCsvText, setLastCsvText] = useState("");

  const [inbox, setInbox] = useState([]);

  // Hidden file input (visual hide, not display:none)
  const fileRef = useRef(null);
  const pickFile = ()=> { if (fileRef.current) fileRef.current.click(); };

  // Import handler
  useEffect(() => {
    function decodePayload(str){
      try { return JSON.parse(decodeURIComponent(escape(atob(str)))); }
      catch { return null; }
    }
    const hash = window.location.hash || "";
    if (hash.startsWith("#/import")) {
      const query = hash.includes("?") ? hash.split("?")[1] : "";
      const qs = new URLSearchParams(query);
      const data = qs.get("data");
      const payload = data && decodePayload(data);
      if (payload) {
        const prev = JSON.parse(localStorage.getItem("quiz_inbox") || "[]");
        prev.unshift(payload);
        localStorage.setItem("quiz_inbox", JSON.stringify(prev));
        setInbox(prev);
      }
      setTab("inbox");
      window.location.hash = "#/inbox";
    }
  }, []);

  useEffect(() => {
    if (tab === "inbox") {
      const data = JSON.parse(localStorage.getItem("quiz_inbox") || "[]");
      setInbox(data);
    }
  }, [tab]);

  useEffect(()=>()=>{ try{ if (csvObjUrl) URL.revokeObjectURL(csvObjUrl); }catch(_e){} }, [csvObjUrl]);

  function readFileAsText(file){
    return new Promise((resolve, reject)=>{
      try{
        const reader = new FileReader();
        reader.onload = (e)=> resolve(String((e.target && e.target.result) || ""));
        reader.onerror = (e)=> reject(e);
        reader.readAsText(file);
      }catch(err){ reject(err); }
    });
  }
  function validateAndSet(csvText){
    try{
      const parsed = parseCSV(csvText);
      if (!parsed.length){ setError("We could not find any rows."); setRows([]); return; }
      const h = Object.keys(parsed[0]||{}).map(k=> k.toLowerCase());
      if (!h.includes("player")){
        setError("Missing required column: Player"); setRows([]); return;
      }
      if (!(h.includes("sw_total")||h.includes("sw_pct")) || !(h.includes("se_total")||h.includes("se_pct")) || !(h.includes("sc_total")||h.includes("sc_pct"))){
        setError("Missing SW/SE/SC totals or pct columns."); setRows([]); return;
      }
      setRows(parsed); setError(""); setStatus(`${parsed.length} players loaded.`);
    }catch(err){ setError("CSV parse error: " + String(err && err.message || err)); setRows([]); }
  }
  async function handleFiles(fileList){
    try{
      if (!fileList || !fileList.length){ setError("No file detected."); return; }
      const file = fileList[0];
      const text = await readFileAsText(file);
      validateAndSet(text);
    }catch(err){ setError(String(err)); }
  }
  function onCsvFileSelect(evt){
    const files = (evt.target && evt.target.files) || null; if(!files) return;
    handleFiles(files);
  }

  const [groupingMode, setGroupingMode] = useState("category"); // balanced | category
  const suggested = useMemo(()=> groupingMode==="category" ? suggestGroupsByCategory(rows, partySize) : suggestGroups(rows, partySize), [rows, partySize, groupingMode]);

  // Sorting
  const [sortKey, setSortKey] = useState("Player"); // Player | Primary | Secondary | SW | SE | SC
  const [sortDir, setSortDir] = useState("asc");
  const toggleSort = (k)=>{ if (k===sortKey) setSortDir(sortDir==="asc"?"desc":"asc"); else { setSortKey(k); setSortDir("asc"); } };
  const sortedRows = useMemo(()=>{
    const copy=[...rows];
    const num = (x)=>{ const v=(x==null||x==="")?0:(typeof x==="string"? parseFloat(x):x); return isNaN(v)?0:v; };
    copy.sort((ra, rb)=>{
      const a=ra, b=rb;
      const da=recomputePrimarySecondary(a); const db=recomputePrimarySecondary(b);
      let va, vb;
      switch (sortKey){
        case "Player":    va=a.Player||a.player||""; vb=b.Player||b.player||""; break;
        case "Primary":   va=labelFor(a.Primary? (codeFor(a.Primary)||da.primary) : da.primary); vb=labelFor(b.Primary? (codeFor(b.Primary)||db.primary) : db.primary); break;
        case "Secondary": va=labelFor(a.Secondary? (codeFor(a.Secondary)||da.secondary) : da.secondary); vb=labelFor(b.Secondary? (codeFor(b.Secondary)||db.secondary) : db.secondary); break;
        case "SW":        va=(a.SW_total!=null?a.SW_total:da.totals.SW); vb=(b.SW_total!=null?b.SW_total:db.totals.SW); va=num(va); vb=num(vb); break;
        case "SE":        va=(a.SE_total!=null?a.SE_total:db.totals?da.totals.SE:da.totals.SE); vb=(b.SE_total!=null?b.SE_total:db.totals.SE); va=num(va); vb=num(vb); break;
        case "SC":        va=(a.SC_total!=null?a.SC_total:da.totals.SC); vb=(b.SC_total!=null?b.SC_total:db.totals.SC); va=num(va); vb=num(vb); break;
      }
      const cmp = (typeof va==="number" && typeof vb==="number") ? (va - vb) : String(va).localeCompare(String(vb), undefined, {numeric:true,sensitivity:"base"});
      return sortDir==="asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  // Editable parties
  const [editable, setEditable] = useState(null);
  const [edited, setEdited] = useState(false);
  const [hoverGroup, setHoverGroup] = useState(null);
  const [enforceCap, setEnforceCap] = useState(false);
  useEffect(()=>{ setEditable(JSON.parse(JSON.stringify(suggested))); setEdited(false); }, [suggested]);
  const currentGroups = editable || suggested;

  function recomputeMeta(groups){
    for (let g=0; g<groups.length; g++){
      const grp=groups[g];
      grp.labelCounts={ Swords:0, Seekers:0, Schemers:0 };
      grp.secCoverage = grp.secCoverage || { SW:0, SE:0, SC:0 };
      grp.secCoverage.SW=grp.secCoverage.SE=grp.secCoverage.SC=0;
      for (let m=0;m<grp.members.length;m++){
        const mem=grp.members[m]; const lbl=labelFor(mem.Primary);
        grp.labelCounts[lbl] = (grp.labelCounts[lbl]||0) + 1;
        grp.secCoverage[mem.Secondary] = (grp.secCoverage[mem.Secondary]||0) + 1;
        mem.Group=g+1; mem.GroupName = grp.name + " " + ((grp.index||0)+1);
      }
    }
  }
  function moveMember(srcG, srcIdx, dstG){
    if (!editable) return;
    if (srcG===dstG && srcIdx==null) return;
    const copy=JSON.parse(JSON.stringify(editable));
    const from=copy[srcG], to=copy[dstG]; if(!from || !to) return;
    if (enforceCap && to.members.length>=partySize) return;
    const [m]=from.members.splice(srcIdx,1); if(!m) return;
    to.members.push(m);
    recomputeMeta(copy);
    setEditable(copy); setEdited(true);
  }
  const onDragStartMember = (e,gIdx,mIdx)=>{ e.dataTransfer.setData("text/plain", JSON.stringify({g:gIdx, m:mIdx})); e.dataTransfer.effectAllowed="move"; };
  const onDragOverGroup  = (e)=>{ e.preventDefault(); e.dataTransfer.dropEffect="move"; };
  const onDragEnterGroup = (e,gIdx)=>{ e.preventDefault(); setHoverGroup(gIdx); };
  const onDragLeaveGroup = (e,gIdx)=>{ e.preventDefault(); setHoverGroup(h=> h===gIdx? null : h); };
  const onDropOnGroup    = (e,gIdx)=>{ e.preventDefault(); try{ const data=JSON.parse(e.dataTransfer.getData("text/plain")); moveMember(data.g, data.m, gIdx); }catch(_e){} };

  function downloadGroups(){
    const src=currentGroups.filter(g=> g.members && g.members.length>0);
    const flat=[];
    for (let g=0; g<src.length; g++){
      for (let m=0; m<src[g].members.length; m++){
        const r=src[g].members[m];
        flat.push({ Player:r.Player, Primary:r.PrimaryLabel, Secondary:r.SecondaryLabel, Group:r.GroupName || (src[g].name + " " + ((src[g].index||0)+1)) });
      }
    }
    if (!flat.length){ alert("No players to export."); return; }
    const csv=toCSV(flat);
    setLastCsvText(csv);
    setCsvFileName("Ulvareth_Group_Assignments.csv");
    try{ if (csvObjUrl) URL.revokeObjectURL(csvObjUrl); }catch(_e){}
    try{
      const blob = new Blob(["\uFEFF"+csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      setCsvObjUrl(url);
    }catch(_e){}
    downloadCSVFile("Ulvareth_Group_Assignments.csv", csv);
  }

  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={S.headerRow}>
          <div>
            <h1 style={S.h1}>Ulvareth GM</h1>
            <p style={S.sub}>Admin tools, plus an inbox for imported Player quiz results.</p>
          </div>
          <div style={{ display:"flex", gap: 8 }}>
            <button onClick={()=> setTab("admin")} style={S.tabBtn(tab==="admin")}>Admin</button>
            <button onClick={()=> setTab("inbox")} style={S.tabBtn(tab==="inbox")}>Inbox</button>
          </div>
        </div>

        {tab === "inbox" ? (
          <div style={S.card}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 12 }}>
              <h2 style={{ margin:0, fontSize:20, fontWeight:600, color: PALETTE.aetherglass }}>Quiz Inbox</h2>
              <button
                onClick={()=>{
                  if (!confirm("Clear all imported quiz results?")) return;
                  localStorage.removeItem("quiz_inbox");
                  setInbox([]);
                }}
                style={{ ...S.button, background: PALETTE.danger, borderColor: PALETTE.danger }}
              >
                Clear Inbox
              </button>
            </div>

            {!inbox.length && <p style={S.small}>No results yet. Use a link from the Player app’s “Send to DM”.</p>}

            <div style={{ display:"grid", gap:12 }}>
              {inbox.map((it, idx) => (
                <div key={idx} style={{ background:"#fff", borderRadius:12, boxShadow:"0 1px 2px rgba(0,0,0,0.06)", padding:12 }}>
                  <div style={{ ...S.small, marginBottom:8, color:"#666" }}>
                    {new Date(it.ts || it.when || Date.now()).toLocaleString()}
                  </div>
                  <div style={{ display:"grid", gap:6, gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))" }}>
                    <div><b>Player:</b> {it.player || "Player"}</div>
                    <div><b>Primary:</b> {it.primary}</div>
                    <div><b>Secondary:</b> {it.secondary}</div>
                  </div>
                  <div style={{ display:"grid", gap:6, gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", marginTop:8, fontSize:14 }}>
                    <div><b>SW:</b> {it.SW_pct ?? "-"}% ({it.SW_total ?? "-"})</div>
                    <div><b>SE:</b> {it.SE_pct ?? "-"}% ({it.SE_total ?? "-"})</div>
                    <div><b>SC:</b> {it.SC_pct ?? "-"}% ({it.SC_total ?? "-"})</div>
                  </div>
                  {it.selections && (
                    <details style={{ marginTop:10 }}>
                      <summary style={{ cursor:"pointer" }}>Show raw answers</summary>
                      <pre style={{ marginTop:8, fontSize:12, overflow:"auto", background:"#f6f6f7", padding:10, borderRadius:8 }}>
{JSON.stringify(it.selections, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Controls + Upload */}
            <div style={S.card}>
              <div style={{ display:"grid", gap:12 }}>
                {/* Hidden but focusable input */}
                <input
                  ref={fileRef}
                  id="csvUpload"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={onCsvFileSelect}
                  style={{ position:"absolute", opacity:0, width:1, height:1, overflow:"hidden", pointerEvents:"none" }}
                />

                <div style={{ display:"flex", flexWrap:"wrap", gap:12, alignItems:"center" }}>
                  <button type="button" onClick={pickFile} style={S.button}>Upload CSV</button>
                  <label style={{ fontSize:13, marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
                    Party size
                    <input
                      type="number" min={3} max={8} value={partySize}
                      onChange={(e)=>{ const v=parseInt(e.target.value,10); if(!isNaN(v)) setPartySize(v); }}
                      style={{ ...S.input, width: 70 }}
                    />
                  </label>
                </div>

                <SampleDataToolbar
                  onLoad={(csv)=> validateAndSet(csv)}
                  onDownload={(name,csv)=> downloadCSVFile(`sample_${name}.csv`, csv)}
                />

                <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:8, fontSize:14 }}>
                  <span style={{ opacity:.8 }}>Grouping:</span>
                  <button
                    onClick={()=> setGroupingMode("category")}
                    style={{ ...S.buttonLite, background: (groupingMode==="category")? PALETTE.ringfall : "#fff" }}
                  >
                    By Category (SW/SC/SE)
                  </button>
                  <button
                    onClick={()=> setGroupingMode("balanced")}
                    style={{ ...S.buttonLite, background: (groupingMode==="balanced")? PALETTE.ringfall : "#fff" }}
                  >
                    Balanced Mix
                  </button>
                </div>

                <div
                  onDragEnter={(e)=>{ e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                  onDragOver={(e)=>{ e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                  onDragLeave={(e)=>{ e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                  onDrop={(e)=>{ e.preventDefault(); e.stopPropagation(); setDragActive(false); handleFiles(e.dataTransfer && e.dataTransfer.files); }}
                  onClick={pickFile}
                  style={S.dashed(dragActive)}
                >
                  <div style={{ display:"grid", gap:6 }}>
                    <div style={{ fontSize:14 }}>
                      <b>Drag & Drop CSV here</b> or <span style={{ textDecoration:"underline" }}>click to choose a file</span>
                    </div>
                    <div style={S.small}>
                      Expected columns: Player, SW_total, SE_total, SC_total (or pct columns), Primary, Secondary
                    </div>
                  </div>
                </div>

                {status && <p style={{ ...S.small, color: PALETTE.coal }}>{status}</p>}
                {error && <p style={{ fontSize:14, color: PALETTE.danger }}>Error: {error}</p>}
              </div>
            </div>

            {/* Roster Summary */}
            <div style={{ ...S.card, padding: 12 }}>
              <div style={{ display:"flex", alignItems:"center", gap: 12, flexWrap:"wrap", fontSize:13 }}>
                <h3 style={{ margin:0, fontWeight:600, color: PALETTE.aetherglass }}>Roster Summary</h3>
                {rows.length===0 ? (
                  <span style={S.small}>No players loaded.</span>
                ) : (
                  (()=>{ const counts={ Swords:0, Seekers:0, Schemers:0 }; for(let i=0;i<rows.length;i++){ const p=recomputePrimarySecondary(rows[i]).primary; counts[labelFor(p)]+=1; }
                    return (
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        <span style={{ ...S.badge("#fff", PALETTE.coal), border:`1px solid ${PALETTE.ash}` }}>Total: <b>{rows.length}</b></span>
                        <span style={S.badge(PALETTE.aetherglass)}>Swords: <b>{counts.Swords}</b></span>
                        <span style={S.badge(PALETTE.verdant)}>Seekers: <b>{counts.Seekers}</b></span>
                        <span style={S.badge(PALETTE.shroud)}>Schemers: <b>{counts.Schemers}</b></span>
                      </div>
                    ); })()
                )}
              </div>
            </div>

            {/* Suggested Parties */}
            <div style={S.card}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                <h3 style={{ margin:0, fontWeight:600, color: PALETTE.aetherglass }}>Suggested Parties</h3>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <label style={{ fontSize:12, display:"flex", alignItems:"center", gap:6 }}>
                    <input type="checkbox" checked={enforceCap} onChange={(e)=> setEnforceCap(e.currentTarget.checked)} />
                    Enforce party size cap
                  </label>
                  {edited && (
                    <button onClick={()=>{ setEditable(JSON.parse(JSON.stringify(suggested))); setEdited(false); }} style={S.buttonLite}>Reset Edits</button>
                  )}
                  <button onClick={downloadGroups} disabled={!rows.length} style={{ ...S.button, background: rows.length? PALETTE.aetherglass : PALETTE.ash, borderColor: rows.length? PALETTE.ringfall : PALETTE.ash }}>
                    Download Groups CSV
                  </button>
                </div>
              </div>

              {!!csvObjUrl && (
                <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:8, marginTop:10, fontSize:12, color: PALETTE.coal }}>
                  <a href={csvObjUrl} download={csvFileName} style={S.buttonLite}>Save Link</a>
                  <a href={csvObjUrl} target="_blank" rel="noopener" style={S.buttonLite}>Open in New Tab</a>
                  <button onClick={()=>{ try{ navigator.clipboard.writeText('\uFEFF' + (lastCsvText||'')); alert('CSV copied to clipboard. Paste into a .csv file.'); }catch(_e){} }} style={S.buttonLite}>Copy CSV</button>
                  <span style={S.small}>If download is blocked, use these.</span>
                </div>
              )}

              {(!rows.length) ? (
                <p style={S.small}>Load players to see group suggestions.</p>
              ) : (
                <div style={S.partyGrid}>
                  {currentGroups.filter(g=> g.members && g.members.length>0).map((g,i)=> {
                    const accent = g.category ? catColor(g.category) : PALETTE.ringfall;
                    return (
                      <div
                        key={i}
                        onDragEnter={(e)=> onDragEnterGroup(e,i)}
                        onDragLeave={(e)=> onDragLeaveGroup(e,i)}
                        onDragOver={onDragOverGroup}
                        onDrop={(e)=> onDropOnGroup(e,i)}
                        style={S.partyBox(accent, hoverGroup===i)}
                      >
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 8 }}>
                          <h4 style={{ margin:0, fontWeight:600, color: accent }}>{g.name} {g.index!=null ? (g.index+1) : (i+1)}</h4>
                          <span style={S.small}>S:{g.labelCounts.Swords} • E:{g.labelCounts.Seekers} • C:{g.labelCounts.Schemers}</span>
                        </div>
                        <ul style={{ listStyle:"none", padding:0, margin:0, display:"grid", gap:6, fontSize:14 }}>
                          {g.members.map((m,idx)=> (
                            <li
                              key={idx}
                              draggable
                              onDragStart={(e)=> onDragStartMember(e,i,idx)}
                              title="Drag to move between parties"
                              style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, padding:"6px 0", cursor:"move" }}
                            >
                              <span style={{ wordBreak:"break-word" }}>{m.Player}</span>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <span style={S.badge(catColor(m.Primary))}>{m.PrimaryLabel}</span>
                                <span style={S.badge(catColor(m.Secondary))}>{m.SecondaryLabel}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Roster Table */}
            <div style={S.card}>
              <h3 style={{ margin:"0 0 8px 0", fontWeight:600, color: PALETTE.aetherglass }}>Roster Table</h3>
              {rows.length===0 ? (
                <p style={S.small}>Waiting for CSV upload… Expected columns: Player, SW_total, SE_total, SC_total (or pct columns), Primary, Secondary.</p>
              ) : (
                <div style={S.tableWrap}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        {["Player","Primary","Secondary","SW","SE","SC"].map((k)=> (
                          <th key={k} style={S.th}>
                            <button type="button" onClick={()=> toggleSort(k)} style={{ background:"transparent", border:"none", padding:0, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6 }}>
                              <span>{k}</span>
                              {sortKey===k && <span>{sortDir==="asc" ? "▲" : "▼"}</span>}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((r,i)=>{ const a=recomputePrimarySecondary(r); return (
                        <tr key={i}>
                          <td style={S.td}>{r.Player || r.player || (`Player ${i+1}`)}</td>
                          <td style={S.td}>{labelFor(r.Primary? (codeFor(r.Primary)||a.primary) : a.primary)}</td>
                          <td style={S.td}>{labelFor(r.Secondary? (codeFor(r.Secondary)||a.secondary) : a.secondary)}</td>
                          <td style={S.td}>{String((r.SW_total!=null?r.SW_total:(a.totals.SW||0)))}</td>
                          <td style={S.td}>{String((r.SE_total!=null?r.SE_total:(a.totals.SE||0)))}</td>
                          <td style={S.td}>{String((r.SC_total!=null?r.SC_total:(a.totals.SC||0)))}</td>
                        </tr>
                      ); })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------- Sample Data Toolbar ---------------------- */
function SampleDataToolbar({ onLoad, onDownload }){
  const [choice, setChoice] = useState("balanced");
  const [url, setUrl] = useState("");
  const [fname, setFname] = useState("");
  const [lastText, setLastText] = useState("");
  const samples = useMemo(()=> getSampleCSVs(), []);
  useEffect(()=>()=>{ try{ if(url) URL.revokeObjectURL(url); }catch(_e){} }, [url]);

  function doDownload(name, csv){
    setFname(`sample_${name}.csv`);
    setLastText(csv);
    try{ if (url) URL.revokeObjectURL(url); }catch(_e){}
    try{
      const blob = new Blob(["\uFEFF"+csv], { type: "text/csv;charset=utf-8;" });
      const u = URL.createObjectURL(blob);
      setUrl(u);
    }catch(_e){}
    try { onDownload(name, csv); } catch(_e) {}
  }

  return (
    <div style={{ display:"grid", gap:8, fontSize:14 }}>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, alignItems:"center" }}>
        <span style={{ opacity:.8 }}>Sample data:</span>
        <select value={choice} onChange={(e)=> setChoice(e.currentTarget.value)} style={S.input}>
          <option value="balanced">Balanced</option>
          <option value="skewed">Category-Skewed</option>
          <option value="messy">Messy Headers/Blanks</option>
          <option value="percents">Percents</option>
          <option value="overflow">Overflow 24</option>
        </select>
        <button onClick={()=> onLoad(samples[choice])} style={S.buttonLite}>Load</button>
        <button onClick={()=> doDownload(choice, samples[choice])} style={S.button}>Download</button>
      </div>
      {!!url && (
        <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:8, fontSize:12, color: PALETTE.coal }}>
          <a href={url} download={fname} style={S.buttonLite}>Save Link</a>
          <a href={url} target="_blank" rel="noopener" style={S.buttonLite}>Open in New Tab</a>
          <button onClick={()=>{ try{ navigator.clipboard.writeText('\uFEFF'+lastText); alert('CSV copied to clipboard. Paste into a .csv file.'); }catch(_e){} }} style={S.buttonLite}>Copy CSV</button>
          <span style={S.small}>If your browser blocks the download, use these helpers.</span>
        </div>
      )}
    </div>
  );
}

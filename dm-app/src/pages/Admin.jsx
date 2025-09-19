import React, { useMemo, useState, useEffect } from "react";

/* ======================== Palette / helpers ======================== */
const PALETTE = {
  aetherglass: "#3A6D8C", // Swords / primary btn
  ringfall: "#D4A843",    // accent
  shroud: "#5C3B6E",      // Schemers
  coal: "#2F2F2F",        // text
  ash: "#9A9A9A",         // borders/muted
  verdant: "#3D6B35",     // Seekers
  pearl: "#E6E1D3",       // bg
  silver: "#C1CAD6",      // cards
  ember: "#B6402C",       // alerts
};

function catColor(cat){
  const base = cat === 'SW' ? PALETTE.aetherglass : (cat === 'SE' ? PALETTE.verdant : PALETTE.shroud);
  return { base };
}
function hexToRgba(hex, a){
  const h = String(hex||'').replace('#','');
  const r = parseInt(h.substring(0,2)||'00',16);
  const g = parseInt(h.substring(2,4)||'00',16);
  const b = parseInt(h.substring(4,6)||'00',16);
  return `rgba(${r},${g},${b},${a})`;
}

function toCSV(rows){
  if (!rows || !rows.length) return '';
  const heads = Object.keys(rows[0]);
  let out = heads.join(',') + '\n';
  for (let i=0;i<rows.length;i++){
    const r = rows[i];
    out += heads.map(h => JSON.stringify(r[h]==null ? '' : r[h])).join(',') + '\n';
  }
  return out;
}
function downloadCSVFile(filename, csv){
  const BOM = "\uFEFF";
  const data = BOM + (csv || '');
  try{
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    if (typeof window !== 'undefined' && navigator.msSaveBlob){
      navigator.msSaveBlob(blob, filename); // old Edge/IE
      return true;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ a.remove(); URL.revokeObjectURL(url); }, 0);
    return true;
  }catch(_e){}
  try{
    const dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(data);
    const win = window.open(dataUrl, '_blank');
    if (win) return true;
  }catch(_e){}
  try{
    if (navigator.clipboard?.writeText){
      navigator.clipboard.writeText(data);
      alert('CSV copied to clipboard. Paste into a file named '+filename+' and save.');
      return true;
    }
  }catch(_e){}
  alert('Could not trigger a download. Please allow popups or use the helper links.');
  return false;
}

/* --- CSV parsing helpers ------------------------------------------ */
function sniffDelimiter(headerLine){
  const candidates = [',',';','\t'];
  let best = ',', bestCount = -1;
  for (const c of candidates){
    const n = headerLine.split(c).length;
    if (n>bestCount){ bestCount = n; best = c; }
  }
  return best;
}
function parseCSV(text){
  let s = String(text||"").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (s.length && s.charCodeAt(0) === 0xFEFF) s = s.slice(1);

  const firstLine = (s.split("\n").find(l=> l.trim().length>0) || '');
  const DELIM = sniffDelimiter(firstLine);

  const rows = []; let row = []; let field = ""; let i=0; let inQ=false;
  while(i<s.length){
    const ch = s[i];
    if (inQ){
      if (ch==='\"'){
        if (i+1<s.length && s[i+1]==='\"'){ field+='\"'; i+=2; continue; }
        inQ=false; i++; continue;
      } else { field+=ch; i++; continue; }
    } else {
      if (ch==='\"'){ inQ=true; i++; continue; }
      if (ch===DELIM){ row.push(field); field=""; i++; continue; }
      if (ch==='\n'){ row.push(field); rows.push(row); row=[]; field=""; i++; continue; }
      field+=ch; i++; continue;
    }
  }
  row.push(field); rows.push(row);

  while(rows.length && rows[0].every(v=> String(v||'').trim()==='')) rows.shift();
  while(rows.length && rows[rows.length-1].every(v=> String(v||'').trim()==='')) rows.pop();
  if (!rows.length) return [];

  const headers = rows[0].map(h=> String(h||'').trim());
  const out = [];
  for(let r=1;r<rows.length;r++){
    if (rows[r].length===1 && String(rows[r][0]||"").trim()==="") continue;
    const obj = {};
    for(let c=0;c<headers.length;c++){
      const key = headers[c];
      const val = (rows[r][c]!==undefined) ? String(rows[r][c]).trim() : '';
      obj[key] = val;
    }
    out.push(obj);
  }
  return out;
}

function labelFor(code){ return code==='SW' ? 'Swords' : (code==='SE' ? 'Seekers' : 'Schemers'); }
function codeFor(label){
  const t=String(label||"").toLowerCase();
  if(t.includes('sword')) return 'SW';
  if(t.includes('seek'))  return 'SE';
  if(t.includes('schem')) return 'SC';
  return null;
}

function recomputePrimarySecondary(obj){
  const norm = {}; Object.keys(obj||{}).forEach(k=> norm[k.toLowerCase()] = obj[k]);
  const pick = (name)=> norm[name.toLowerCase()];
  const num = (x)=>{ if (x==null || x==='') return 0; const v = (typeof x==='string'? parseFloat(x): x); return isNaN(v)?0:v; };

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

/* ---- Sample CSVs (for quick testing) ------------------------------------ */
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

/* ---- Grouping ------------------------------------------------------------ */
function suggestGroups(rows, partySize){
  const size = Math.max(3, Math.min(8, partySize||5));
  const players = (rows||[]).map((r,idx)=>{ const p=recomputePrimarySecondary(r); return {
    index: idx,
    Player: r.Player||r.player||`Player ${idx+1}`,
    Primary: r.Primary? (codeFor(r.Primary)||p.primary) : p.primary,
    Secondary: r.Secondary? (codeFor(r.Secondary)||p.secondary) : p.secondary,
    totals: p.totals
  }; });
  const used = {}; const pools = { SW:[], SE:[], SC:[] };
  for (let i=0;i<players.length;i++){ pools[players[i].Primary].push(players[i]); }
  const groupCount = Math.max(1, Math.ceil(players.length/size));
  const groups = Array.from({length: groupCount}, ()=>({ name:"Balanced", members:[], need:{SW:true,SE:true,SC:true}, labelCounts:{Swords:0,Seekers:0,Schemers:0} }));
  const takeFrom = (cat)=>{ const arr=pools[cat]; if(!arr.length) return null; return arr.shift(); };
  const cats = ["SW","SE","SC"];
  for (let ci=0; ci<cats.length; ci++){
    for (let gi=0; gi<groups.length; gi++){
      if (groups[gi].members.length < size){ const p = takeFrom(cats[ci]); if (p){ groups[gi].members.push(p); groups[gi].need[cats[ci]] = false; used[p.index]=true; } }
    }
  }
  let remaining = players.filter(p=> !used[p.index]);
  for (let gi=0; gi<groups.length; gi++){
    while (groups[gi].members.length < size && remaining.length){
      let idx = remaining.findIndex(c=> groups[gi].need[c.Secondary]);
      if (idx<0) idx = 0;
      const chosen = remaining.splice(idx,1)[0];
      groups[gi].members.push(chosen); groups[gi].need[chosen.Secondary] = false;
    }
  }
  let gi=0; while (remaining.length){ const chosen = remaining.shift(); if (groups[gi].members.length<size){ groups[gi].members.push(chosen); } gi=(gi+1)%groups.length; }
  for (let g=0; g<groups.length; g++){
    const mem = groups[g].members;
    for (let m=0;m<mem.length;m++){ const lbl = labelFor(mem[m].Primary); groups[g].labelCounts[lbl]+=1; mem[m].PrimaryLabel = lbl; mem[m].SecondaryLabel = labelFor(mem[m].Secondary); mem[m].Group=g+1; mem[m].GroupName = groups[g].name + ' ' + (g+1); }
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
  const norm = (p, cat)=>{ const v = Number(p.totals[cat])||0; const m = maxes[cat]||1; return m? (v/m) : 0; };

  const prim = { SW:[], SE:[], SC:[] };
  for (let i=0;i<players.length;i++) prim[players[i].Primary].push(players[i]);

  const mkGroup = (cat, idx) => ({
    name: labelFor(cat), category: cat, index: idx, members: [],
    labelCounts:{Swords:0,Seekers:0,Schemers:0},
    secCoverage: { SW:0, SE:0, SC:0 },
  });
  const groups = [];

  const cats = ["SW","SC","SE"]; // UI order preference
  for (let ci=0; ci<cats.length; ci++){
    const c = cats[ci];
    const count = Math.max(1, Math.ceil(prim[c].length / size));
    for (let j=0;j<count;j++) groups.push(mkGroup(c, j));
  }

  const assigned = new Set();

  // Fill by matching primaries
  for (let ci=0; ci<cats.length; ci++){
    const cat = cats[ci];
    const catGroups = groups.filter(g=> g.category===cat);
    for (let gi=0; gi<catGroups.length && prim[cat].length; gi++){
      const g = catGroups[gi];
      while (g.members.length < size && prim[cat].length){
        const p = prim[cat].shift();
        g.members.push(p); assigned.add(p.index);
        g.secCoverage[p.Secondary] = (g.secCoverage[p.Secondary]||0) + 1;
      }
    }
  }

  // Compacting
  for (let ci=0; ci<cats.length; ci++){
    const cat = cats[ci];
    const catGroups = groups.filter(g=> g.category===cat);
    for (let gi=0; gi<catGroups.length-1; gi++){
      const g = catGroups[gi];
      for (let gj=catGroups.length-1; gj>gi && g.members.length<size; gj--){
        const src = catGroups[gj];
        if (!src.members.length) continue;
        const moved = src.members.shift();
        g.members.push(moved);
      }
    }
  }

  let remaining = players.filter(p=> !assigned.has(p.index));
  const fitScore = (p, cat, g)=>{
    const secMatch = (p.Secondary===cat) ? 1 : 0;
    const lean = norm(p, cat); // 0..1
    const coverageBonus = g && g.secCoverage ? (g.secCoverage[p.Secondary]===0 ? 0.25 : 0) : 0;
    return (2.5*secMatch) + (1.25*lean) + (coverageBonus);
  };

  for (let gi=0; gi<groups.length; gi++){
    const g = groups[gi];
    while (g.members.length < size && remaining.length){
      let bestIdx = 0; let best = -1;
      for (let i=0;i<remaining.length;i++){
        const score = fitScore(remaining[i], g.category, g);
        if (score>best){ best=score; bestIdx=i; }
      }
      const chosen = remaining.splice(bestIdx,1)[0];
      g.members.push(chosen);
      g.secCoverage[chosen.Secondary] = (g.secCoverage[chosen.Secondary]||0) + 1;
    }
  }

  let gi2=0;
  while (remaining.length){
    const g = groups[gi2%groups.length];
    if (g.members.length < size){
      let bestIdx = 0; let best = -1;
      for (let i=0;i<remaining.length;i++){
        const score = fitScore(remaining[i], g.category, g);
        if (score>best){ best=score; bestIdx=i; }
      }
      const chosen = remaining.splice(bestIdx,1)[0];
      g.members.push(chosen);
      g.secCoverage[chosen.Secondary] = (g.secCoverage[chosen.Secondary]||0) + 1;
    }
    gi2++;
  }

  for (let g=0; g<groups.length; g++){
    const grp = groups[g];
    for (let m=0;m<grp.members.length;m++){
      const mem = grp.members[m];
      const lbl = labelFor(mem.Primary);
      grp.labelCounts[lbl] = (grp.labelCounts[lbl]||0) + 1;
      mem.PrimaryLabel = lbl; mem.SecondaryLabel = labelFor(mem.Secondary);
      mem.Group = g+1; mem.GroupName = grp.name + ' ' + ( (grp.index||0) + 1 );
    }
  }
  return groups;
}

/* ======================== Main Component ======================== */
export default function UlvarethDMAdmin(){
  const [partySize, setPartySize] = useState(5);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [csvObjUrl, setCsvObjUrl] = useState("");
  const [csvFileName, setCsvFileName] = useState("Ulvareth_Group_Assignments.csv");
  const [lastCsvText, setLastCsvText] = useState("");
  const [inboxImported, setInboxImported] = useState(false);

  useEffect(()=>()=>{ try{ if (csvObjUrl) URL.revokeObjectURL(csvObjUrl); }catch(_e){} }, [csvObjUrl]);

  /* ---- Inbox import: decode ?data=... from URL ------------------ */
  useEffect(()=>{
    try{
      const url = new URL(window.location.href);
      const encoded = url.searchParams.get("data");
      if (!encoded) return;
      const json = decodeURIComponent(escape(atob(encoded)));
      const payload = JSON.parse(json);

      const row = {
        Player: payload.player,
        Primary: payload.primary,
        Secondary: payload.secondary,
        SW_total: payload.SW_total,
        SE_total: payload.SE_total,
        SC_total: payload.SC_total,
        SW_pct: payload.SW_pct,
        SE_pct: payload.SE_pct,
        SC_pct: payload.SC_pct,
      };

      setRows(r=> [...r, row]);
      setStatus("Imported 1 player from Inbox link.");
      setInboxImported(true);

      url.searchParams.delete("data");
      window.history.replaceState({}, "", url.toString());
    }catch(e){
      console.error("Inbox import error", e);
    }
  }, []);

  /* ---- File reading & validation -------------------------------- */
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

  // Validate a parsed array and setRows
  function validateRows(parsed){
    try{
      if (!parsed.length){ setError('We could not find any rows.'); return; }
      const h = Object.keys(parsed[0]||{}).map(k=> k.toLowerCase());
      if (!h.includes('player')){
        setError('Missing required column: Player'); return;
      }
      if (!(h.includes('sw_total')||h.includes('sw_pct')) ||
          !(h.includes('se_total')||h.includes('se_pct')) ||
          !(h.includes('sc_total')||h.includes('sc_pct'))){
        setError('Missing SW/SE/SC totals or pct columns.'); return;
      }
      setRows(parsed); setError(""); setStatus(`${parsed.length} players loaded.`);
    }catch(err){ setError('CSV parse error: '+ String(err?.message||err)); }
  }

  // Legacy: single text validate
  function validateAndSet(csvText){
    const parsed = parseCSV(csvText);
    validateRows(parsed);
  }

  // MULTI-FILE: picker & drag-drop both call this
  async function handleFiles(fileList){
    try{
      if (!fileList || !fileList.length){ setError('No file detected.'); return; }

      let merged = [...rows]; // keep existing roster, append new
      for (let i=0;i<fileList.length;i++){
        const file = fileList[i];
        const text = await readFileAsText(file);
        const parsed = parseCSV(text);
        if (parsed.length) merged = merged.concat(parsed);
      }

      validateRows(merged);
    }catch(err){ setError(String(err)); }
  }

  function onCsvFileSelect(evt){
    const files = evt.target.files; if(!files) return;
    handleFiles(files);
  }

  const [groupingMode, setGroupingMode] = useState('category');
  const suggested = useMemo(()=> groupingMode==='category' ? suggestGroupsByCategory(rows, partySize) : suggestGroups(rows, partySize), [rows, partySize, groupingMode]);

  /* ---- Roster table sorting ------------------------------------- */
  const [sortKey, setSortKey] = useState('Player');
  const [sortDir, setSortDir] = useState('asc');
  function toggleSort(k){
    if (k===sortKey){ setSortDir(sortDir==='asc'?'desc':'asc'); }
    else { setSortKey(k); setSortDir('asc'); }
  }
  const sortedRows = useMemo(()=>{
    const copy = [...rows];
    const num = (x)=>{ const v = (x==null||x==='')?0: (typeof x==='string'? parseFloat(x): x); return isNaN(v)?0:v; };
    copy.sort((ra, rb)=>{
      const a = ra, b = rb;
      const da = recomputePrimarySecondary(a); const db = recomputePrimarySecondary(b);
      let va, vb;
      switch (sortKey){
        case 'Player': va = a.Player||a.player||''; vb = b.Player||b.player||''; break;
        case 'Primary': va = labelFor(a.Primary? (codeFor(a.Primary)||da.primary) : da.primary); vb = labelFor(b.Primary? (codeFor(b.Primary)||db.primary) : db.primary); break;
        case 'Secondary': va = labelFor(a.Secondary? (codeFor(a.Secondary)||da.secondary) : da.secondary); vb = labelFor(b.Secondary? (codeFor(b.Secondary)||db.secondary) : db.secondary); break;
        case 'SW': va = (a.SW_total!=null?a.SW_total:da.totals.SW); vb = (b.SW_total!=null?b.SW_total:db.totals.SW); va=num(va); vb=num(vb); break;
        case 'SE': va = (a.SE_total!=null?a.SE_total:da.totals.SE); vb = (b.SE_total!=null?b.SE_total:db.totals.SE); va=num(va); vb=num(vb); break;
        case 'SC': va = (a.SC_total!=null?a.SC_total:da.totals.SC); vb = (b.SC_total!=null?b.SC_total:db.totals.SC); va=num(va); vb=num(vb); break;
      }
      const cmp = (typeof va==='number' && typeof vb==='number') ? (va - vb) : String(va).localeCompare(String(vb), undefined, {numeric:true,sensitivity:'base'});
      return sortDir==='asc' ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  /* ===== Drag & Drop editable parties ===== */
  const [editable, setEditable] = useState(null);
  const [edited, setEdited] = useState(false);
  const [hoverGroup, setHoverGroup] = useState(null);
  const [enforceCap, setEnforceCap] = useState(false);

  useEffect(()=>{ setEditable(JSON.parse(JSON.stringify(suggested))); setEdited(false); }, [suggested]);
  const currentGroups = editable || suggested;

  function recomputeMeta(groups){
    for (let g=0; g<groups.length; g++){
      const grp = groups[g];
      grp.labelCounts = { Swords:0, Seekers:0, Schemers:0 };
      grp.secCoverage = grp.secCoverage || { SW:0, SE:0, SC:0 };
      grp.secCoverage.SW = grp.secCoverage.SE = grp.secCoverage.SC = 0;
      for (let m=0; m<grp.members.length; m++){
        const mem = grp.members[m];
        const lbl = labelFor(mem.Primary);
        grp.labelCounts[lbl] = (grp.labelCounts[lbl]||0) + 1;
        grp.secCoverage[mem.Secondary] = (grp.secCoverage[mem.Secondary]||0) + 1;
        mem.Group = g+1; mem.GroupName = grp.name + ' ' + ( (grp.index||0) + 1 );
      }
    }
  }
  function moveMember(srcG, srcIdx, dstG){
    if (!editable) return;
    if (srcG===dstG && srcIdx==null) return;
    const copy = JSON.parse(JSON.stringify(editable));
    const from = copy[srcG]; const to = copy[dstG];
    if (!from || !to) return;
    if (enforceCap && to.members.length >= partySize) return;
    const [m] = from.members.splice(srcIdx,1);
    if (!m) return;
    to.members.push(m);
    recomputeMeta(copy);
    setEditable(copy); setEdited(true);
  }
  function onDragStartMember(e, gIdx, mIdx){
    e.dataTransfer.setData('text/plain', JSON.stringify({g:gIdx, m:mIdx}));
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOverGroup(e){ e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
  function onDragEnterGroup(e, gIdx){ e.preventDefault(); setHoverGroup(gIdx); }
  function onDragLeaveGroup(e, gIdx){ e.preventDefault(); setHoverGroup((h)=> (h===gIdx? null : h)); }
  function onDropOnGroup(e, gIdx){
    e.preventDefault();
    try{ const data = JSON.parse(e.dataTransfer.getData('text/plain')); moveMember(data.g, data.m, gIdx); }catch(_){}
  }

  function downloadGroups(){
    const src = currentGroups.filter((g)=> g.members && g.members.length>0);
    const flat = [];
    for(let g=0; g<src.length; g++){
      for(let m=0;m<src[g].members.length;m++){
        const r=src[g].members[m];
        flat.push({ Player:r.Player, Primary:r.PrimaryLabel, Secondary:r.SecondaryLabel, Group:r.GroupName || (src[g].name + ' ' + ( (src[g].index||0)+1 )) });
      }
    }
    if (!flat.length){ alert('No players to export.'); return; }
    const csv = toCSV(flat);
    setLastCsvText(csv);
    setCsvFileName('Ulvareth_Group_Assignments.csv');

    try{ if (csvObjUrl) URL.revokeObjectURL(csvObjUrl); }catch(_e){}
    try{
      const blob = new Blob(["\uFEFF"+csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      setCsvObjUrl(url);
    }catch(_e){}

    downloadCSVFile('Ulvareth_Group_Assignments.csv', csv);
  }

  /* ======================== Render ======================== */
  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: PALETTE.pearl, color: PALETTE.coal }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ color: PALETTE.aetherglass }}>Ulvareth DM Admin</h1>
            <p className="text-sm" style={{ color: PALETTE.ash }}>Upload one or more player CSVs, or import via Inbox link. Pick a party size (3–8), then export suggested groups.</p>
          </div>
        </header>

        {/* Controls card */}
        <div className="rounded-2xl shadow-sm p-4 border" style={{ background: PALETTE.silver, borderColor: PALETTE.ash }}>
          <div className="flex flex-col gap-3">
            {/* Hidden input */}
            <input id="csvUpload" type="file" accept=".csv,text/csv" multiple onChange={onCsvFileSelect} className="hidden" />

            {/* Row of controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <label htmlFor="csvUpload" className="px-5 py-2 rounded-xl text-white font-semibold shadow border hover:opacity-90 focus:outline-none focus:ring"
                     style={{ background: PALETTE.aetherglass, borderColor: PALETTE.ringfall, cursor:'pointer' }}>
                Upload CSV(s)
              </label>
              <label className="text-sm sm:ml-auto flex items-center gap-2">Party size
                <input type="number" min={3} max={8} value={partySize}
                  onChange={(e)=>{ const v=parseInt(e.target.value,10); if(!isNaN(v)) setPartySize(v); }}
                  className="w-20 px-2 py-1 rounded-lg border" style={{ borderColor: PALETTE.ash, background: '#ffffff' }} />
              </label>
            </div>

            {/* Sample data loader / downloader */}
            <SampleDataToolbar onLoad={(csv)=> validateAndSet(csv)}
                               onDownload={(name,csv)=> downloadCSVFile(`sample_${name}.csv`, csv)} />

            {/* Grouping mode toggle */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="opacity-80">Grouping:</span>
              <button onClick={()=> setGroupingMode('category')} className="px-3 py-1 rounded-full border"
                      style={{ background: (groupingMode==='category')? PALETTE.ringfall : hexToRgba(PALETTE.silver,0.6), borderColor: PALETTE.ash, color: PALETTE.coal }}>
                By Category (SW/SC/SE)
              </button>
              <button onClick={()=> setGroupingMode('balanced')} className="px-3 py-1 rounded-full border"
                      style={{ background: (groupingMode==='balanced')? PALETTE.ringfall : hexToRgba(PALETTE.silver,0.6), borderColor: PALETTE.ash, color: PALETTE.coal }}>
                Balanced Mix
              </button>
            </div>

            {/* Drag & drop zone (multi-file) */}
            <div
              onDragEnter={(e)=>{ e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
              onDragOver={(e)=>{ e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
              onDragLeave={(e)=>{ e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
              onDrop={(e)=>{ e.preventDefault(); e.stopPropagation(); setDragActive(false); handleFiles(e.dataTransfer && e.dataTransfer.files); }}
              onClick={()=>{ document.getElementById('csvUpload')?.click(); }}
              className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition ${dragActive? 'shadow-lg' : ''}`}
              style={{ borderColor: dragActive? PALETTE.aetherglass : PALETTE.ash, background: dragActive? hexToRgba(PALETTE.pearl, 0.9) : hexToRgba(PALETTE.pearl, 0.6) }}
            >
              <div className="space-y-1">
                <div className="text-sm">
                  <b>Drag & Drop CSVs here</b> (you can drop multiple) or <span className="underline">click to choose file(s)</span>
                </div>
                <div className="text-xs" style={{ color: PALETTE.ash }}>
                  Expected columns: Player, SW_total, SE_total, SC_total (or pct columns), Primary, Secondary
                </div>
              </div>
            </div>

            {!!inboxImported && (
              <div className="text-xs px-3 py-2 rounded-lg self-start" style={{ background: hexToRgba(PALETTE.verdant, .12), color: PALETTE.coal, border:`1px solid ${PALETTE.ash}` }}>
                Imported a player via <b>Inbox</b> link. You can keep importing more links or upload CSVs.
              </div>
            )}

            {status && <p className="text-xs" style={{ color: PALETTE.coal }}>{status}</p>}
            {error && <p className="mt-1 text-sm" style={{ color: PALETTE.ember }}>Error: {error}</p>}
          </div>
        </div>

        {/* Roster Summary */}
        <div className="rounded-xl shadow-sm p-3 border" style={{ background: PALETTE.silver, borderColor: PALETTE.ash }}>
          <div className="flex items-center gap-3 text-[13px] flex-wrap">
            <h3 className="font-semibold mr-2" style={{ color: PALETTE.aetherglass }}>Roster Summary</h3>
            {rows.length===0 ? (
              <span className="opacity-70" style={{ color: PALETTE.ash }}>No players loaded.</span>
            ) : (
              (()=>{ const counts={ Swords:0, Seekers:0, Schemers:0 }; for(let i=0;i<rows.length;i++){ const p=recomputePrimarySecondary(rows[i]).primary; counts[labelFor(p)]+=1; }
                return (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full border" style={{borderColor: PALETTE.ash}}>Total: <b>{rows.length}</b></span>
                    <span className="px-2 py-0.5 rounded-full text-white" style={{background: PALETTE.aetherglass}}>Swords: <b>{counts.Swords}</b></span>
                    <span className="px-2 py-0.5 rounded-full text-white" style={{background: PALETTE.verdant}}>Seekers: <b>{counts.Seekers}</b></span>
                    <span className="px-2 py-0.5 rounded-full text-white" style={{background: PALETTE.shroud}}>Schemers: <b>{counts.Schemers}</b></span>
                  </div>
                ); })()
            )}
          </div>
        </div>

        {/* Suggested Parties */}
        <div className="rounded-2xl shadow-sm p-4 border space-y-2" style={{ background: PALETTE.silver, borderColor: PALETTE.ash }}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-semibold" style={{ color: PALETTE.aetherglass }}>Suggested Parties</h3>
            <div className="flex items-center gap-2">
              <label className="text-xs flex items-center gap-1 mr-2">
                <input type="checkbox" checked={enforceCap} onChange={(e)=> setEnforceCap(e.currentTarget.checked)} /> Enforce party size cap
              </label>
              {edited && (
                <button onClick={()=>{ setEditable(JSON.parse(JSON.stringify(suggested))); setEdited(false); }} className="px-3 py-1 rounded-lg border" style={{borderColor: PALETTE.ash, background:'#fff'}}>Reset Edits</button>
              )}
              <button onClick={downloadGroups} className="px-3 py-2 rounded-xl text-white" style={{ background: rows.length? PALETTE.aetherglass : PALETTE.ash }} disabled={!rows.length}>Download Groups CSV</button>
            </div>
          </div>

          {!!csvObjUrl && (
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs" style={{color: PALETTE.coal}}>
              <a href={csvObjUrl} download={csvFileName} className="px-2 py-1 rounded border" style={{borderColor: PALETTE.ash, background:'#fff'}}>Save Link</a>
              <a href={csvObjUrl} target="_blank" rel="noopener" className="px-2 py-1 rounded border" style={{borderColor: PALETTE.ash, background:'#fff'}}>Open in New Tab</a>
              <button onClick={()=>{ try{ navigator.clipboard.writeText('\uFEFF' + (lastCsvText||'')); alert('CSV copied to clipboard. Paste into a .csv file.'); }catch(_e){} }} className="px-2 py-1 rounded border" style={{borderColor: PALETTE.ash, background:'#fff'}}>Copy CSV</button>
              <span className="opacity-70">If download is blocked, use these.</span>
            </div>
          )}

          {(!rows.length) ? (
            <p className="text-sm" style={{ color: PALETTE.ash }}>Load players to see group suggestions.</p>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {currentGroups.filter((g)=> g.members && g.members.length>0).map((g,i)=> {
                const accent = g.category ? catColor(g.category).base : PALETTE.ringfall;
                return (
                <div key={i}
                 onDragEnter={(e)=> onDragEnterGroup(e,i)}
                 onDragLeave={(e)=> onDragLeaveGroup(e,i)}
                 onDragOver={onDragOverGroup} onDrop={(e)=> onDropOnGroup(e,i)}
                 className="rounded-xl border p-3 border-l-4 transition-shadow"
                 style={{ borderColor: PALETTE.ash, background: hexToRgba(PALETTE.pearl, 0.95), borderLeftColor: accent, boxShadow: (hoverGroup===i? `0 0 0 3px ${hexToRgba(accent,0.25)}` : 'none') }}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold" style={{ color: accent }}>{g.name} {g.index!=null ? (g.index+1) : (i+1)}</h4>
                    <span className="text-xs" style={{ color: PALETTE.ash }}>S:{g.labelCounts.Swords} • E:{g.labelCounts.Seekers} • C:{g.labelCounts.Schemers}</span>
                  </div>
                  <ul className="text-sm space-y-1">
                    {g.members.map((m,idx)=> (
                      <li key={idx} draggable onDragStart={(e)=> onDragStartMember(e,i,idx)} className="flex items-center justify-between gap-2 cursor-move active:opacity-70">
                        <span className="whitespace-normal break-words" title={m.Player}>{m.Player}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: catColor(m.Primary).base, color: '#ffffff' }}>{m.PrimaryLabel}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ background: catColor(m.Secondary).base }}>{m.SecondaryLabel}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );})}
            </div>
          )}
        </div>

        {/* Roster Table */}
        <div className="rounded-2xl shadow-sm p-4 border" style={{ background: PALETTE.silver, borderColor: PALETTE.ash }}>
          <h3 className="font-semibold mb-2" style={{ color: PALETTE.aetherglass }}>Roster Table</h3>
          {rows.length===0 ? (
            <p className="text-sm" style={{ color: PALETTE.ash }}>Waiting for CSV upload or Inbox import… Expected columns: Player, SW_total, SE_total, SC_total (or pct columns), Primary, Secondary.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left" style={{ color: PALETTE.ash }}>
                    {['Player','Primary','Secondary','SW','SE','SC'].map((k)=> (
                      <th key={k} className="py-1 pr-3">
                        <button type="button" onClick={()=> toggleSort(k)} className="flex items-center gap-1 hover:underline">
                          <span>{k}</span>
                          {sortKey===k && (<span>{sortDir==='asc'?'▲':'▼'}</span>)}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((r,i)=>{ const a=recomputePrimarySecondary(r); return (
                    <tr key={i} className="border-t" style={{ borderColor: PALETTE.ash }}>
                      <td className="py-1 pr-3">{r.Player || r.player || (`Player ${i+1}`)}</td>
                      <td className="py-1 pr-3">{labelFor(r.Primary? (codeFor(r.Primary)||a.primary) : a.primary)}</td>
                      <td className="py-1 pr-3">{labelFor(r.Secondary? (codeFor(r.Secondary)||a.secondary) : a.secondary)}</td>
                      <td className="py-1 pr-3">{String((r.SW_total!=null?r.SW_total:(a.totals.SW||0)))}</td>
                      <td className="py-1 pr-3">{String((r.SE_total!=null?r.SE_total:(a.totals.SE||0)))}</td>
                      <td className="py-1 pr-3">{String((r.SC_total!=null?r.SC_total:(a.totals.SC||0)))}</td>
                    </tr>
                  ); })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Toolbar for sample data ------------------------------------------- */
function SampleDataToolbar(props){
  const [choice, setChoice] = useState('balanced');
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
      const blob = new Blob(["\uFEFF"+csv], { type: 'text/csv;charset=utf-8;' });
      const u = URL.createObjectURL(blob);
      setUrl(u);
    }catch(_e){}
    try { props.onDownload(name, csv); } catch(_e) {}
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <span className="opacity-80">Sample data:</span>
        <select value={choice} onChange={(e)=> setChoice(e.currentTarget.value)} className="px-2 py-1 rounded-lg border" style={{ borderColor: PALETTE.ash, background: '#fff' }}>
          <option value="balanced">Balanced</option>
          <option value="skewed">Category-Skewed</option>
          <option value="messy">Messy Headers/Blanks</option>
          <option value="percents">Percents</option>
          <option value="overflow">Overflow 24</option>
        </select>
        <button onClick={()=> props.onLoad((samples)[choice])} className="px-3 py-1 rounded-lg border" style={{ borderColor: PALETTE.ash, background:'#fff' }}>Load</button>
        <button onClick={()=> doDownload(choice, (samples)[choice])} className="px-3 py-1 rounded-xl text-white" style={{ background: PALETTE.aetherglass }}>Download</button>
      </div>
      {!!url && (
        <div className="flex flex-wrap items-center gap-2 text-xs" style={{color: PALETTE.coal}}>
          <a href={url} download={fname} className="px-2 py-1 rounded border" style={{borderColor: PALETTE.ash, background:'#fff'}}>Save Link</a>
          <a href={url} target="_blank" rel="noopener" className="px-2 py-1 rounded border" style={{borderColor: PALETTE.ash, background:'#fff'}}>Open in New Tab</a>
          <button onClick={()=>{ try{ navigator.clipboard.writeText('\uFEFF'+lastText); alert('CSV copied to clipboard. Paste into a .csv file.'); }catch(_e){} }} className="px-2 py-1 rounded border" style={{borderColor: PALETTE.ash, background:'#fff'}}>Copy CSV</button>
          <span className="opacity-70">If your browser blocks the download, use these helpers.</span>
        </div>
      )}
    </div>
  );
}

/* ---- Minimal dev checks (optional with ?test=1) ----------------------- */
(function __runDevTests(){
  try{
    const csv = 'Player; SW_total ;SE_total;SC_total\n"A";3;1;2\n"B";0;4;1\n\n';
    const rows = parseCSV(csv);
    console.assert(rows.length===2 && rows[0].Player==='A', 'parseCSV trims & sniff delim');

    const g1 = suggestGroups(rows, 3);
    const g2 = suggestGroupsByCategory(rows, 3);
    console.assert(g1.length>=1 && g1[0].members.length>=1, 'balanced grouping');
    console.assert(g2.length>=1 && g2[0].members.length>=1, 'category grouping');

    const out = toCSV([{A:1,B:"x,y",C:'"q"'}]);
    console.assert(/^A,B,C\n1,"x,y","\"q\""\n$/.test(out), 'toCSV quoting');
  }catch(e){ /* noop in production */ }
})();

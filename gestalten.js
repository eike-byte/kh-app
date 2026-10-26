/* Gestalten: Portfolioseiten, Arbeitsblätter und Elternbriefe.
   Every page is saved automatically in the encrypted document "gestalten";
   any page can also be stored as a reusable template. */
(()=>{
const gDoc=()=>D("gestalten",()=>({seiten:[],vorlagen:[]}));
const PF_LAYOUTS={
  lern:{name:"Lerngeschichte",photos:3,title:"Meine Lerngeschichte",text:"Liebe/r {Name},\n\nheute habe ich beobachtet, wie du …\n\nDabei hast du gezeigt, dass du …\n\nIch freue mich darauf, wie es weitergeht!\nDeine …"},
  kann:{name:"Das kann ich schon",photos:1,title:"Das kann ich schon!",text:"Ich kann allein meine Jacke anziehen.\nIch kann bis zehn zählen.\nIch kann meinen Namen schreiben."},
  foto:{name:"Fotoseite",photos:4,title:"Unser Ausflug",text:""},
  ich:{name:"Das bin ich",photos:1,title:"Das bin ich",text:"Ich heiße: {Name}\nIch bin {Alter} alt.\nAm liebsten spiele ich: \nAm liebsten esse ich: \nMeine Freunde sind: "}
};
const BLOCKS={
  titel:{name:"Überschrift",d:()=>({text:"Wie viele sind es?"})},
  name:{name:"Name und Datum",d:()=>({})},
  anleitung:{name:"Anleitung",d:()=>({text:"Zähle die Dinge in jeder Reihe und schreibe die Zahl in das Kästchen."})},
  zaehlen:{name:"Zählen",d:()=>({symbol:"stern",rows:4,max:6,seed:Math.floor(Math.random()*1e6)})},
  nachspuren:{name:"Nachspuren",d:()=>({text:"Mama",size:"gross"})},
  schwung:{name:"Schwungübung",d:()=>({muster:"welle",rows:3})},
  malfeld:{name:"Malfeld",d:()=>({text:"Male dein Lieblingstier.",hoehe:"gross"})},
  linien:{name:"Schreiblinien",d:()=>({rows:3})},
  ausmalen:{name:"Ausmalbild",d:()=>({motif:"bagger",text:"Male das Bild bunt aus."})}
};
const SYMBOLS={kreis:"Kreis",stern:"Stern",herz:"Herz",blume:"Blume",apfel:"Apfel",fisch:"Fisch"};
const allMotifs=()=>Object.entries(MOTIVE.NAMES).concat(MOTIVE.custom());
const motifOpts=()=>Object.fromEntries(allMotifs());
const symbolOpts=()=>Object.assign({},SYMBOLS,Object.fromEntries(allMotifs().filter(([k])=>!(k in SYMBOLS)).map(([k,v])=>["m:"+k,v])));
/* von der KI gezeichnete Motive liegen verschlüsselt im Dokument "gestalten" und werden hier angemeldet */
function syncMotive(){(gDoc().motive||[]).forEach(m=>{if(!MOTIVE.has(m.key))MOTIVE.add(m.key,m.name,m.svg)})}
const THEME_OPTS=Object.assign({"":"Kein Thema"},Object.fromEntries(Object.entries(MOTIVE.THEMES).map(([k,t])=>[k,t.name])));
const MUSTER={welle:"Wellen",zacke:"Zacken",bogen:"Girlanden",schlaufe:"Schlaufen",treppe:"Treppen"};

const seite=id=>gDoc().seiten.find(s=>s.id===id);
const cur=()=>seite(ui.gEdit);
function fillVars(t,kid,date){const k=kidById(kid);return String(t||"").replace(/\{Name\}/g,k?k.name.replace(/^Beispiel /,""):"…").replace(/\{Alter\}/g,k&&k.geb?age(k.geb,date||today()).replace(/ 0 Mon\.$/,"").replace(" J.", " Jahre").replace(" Mon."," Monate"):"…")}

/* ---------- SVG helpers for worksheets ---------- */
function rng(seed){let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function symbolSVG(kind,x,y,r){
  if(String(kind).startsWith("m:"))return `<g class="m" transform="translate(${x-r*1.25} ${y-r*1.25}) scale(${r*2.5/100})">${MOTIVE.inner(kind.slice(2),true)}</g>`;
  const st=`fill="none" stroke="#1C2633" stroke-width="2.5" stroke-linejoin="round"`;
  if(kind==="kreis")return `<circle cx="${x}" cy="${y}" r="${r}" ${st}/>`;
  if(kind==="stern"){let p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;p.push((x+rr*Math.cos(a)).toFixed(1)+","+(y+rr*Math.sin(a)).toFixed(1))}return `<polygon points="${p.join(" ")}" ${st}/>`}
  if(kind==="herz")return `<path d="M${x} ${y+r*.85} C${x-r*1.3} ${y-r*.1} ${x-r*.75} ${y-r*1.05} ${x} ${y-r*.4} C${x+r*.75} ${y-r*1.05} ${x+r*1.3} ${y-r*.1} ${x} ${y+r*.85}Z" ${st}/>`;
  if(kind==="blume"){let s="";for(let i=0;i<6;i++){const a=i*Math.PI/3;s+=`<circle cx="${(x+r*.55*Math.cos(a)).toFixed(1)}" cy="${(y+r*.55*Math.sin(a)).toFixed(1)}" r="${(r*.42).toFixed(1)}" ${st}/>`}return s+`<circle cx="${x}" cy="${y}" r="${r*.3}" fill="#fff" stroke="#1C2633" stroke-width="2.5"/>`}
  if(kind==="apfel")return `<path d="M${x} ${y-r*.55} C${x-r*1.25} ${y-r*1.1} ${x-r*1.2} ${y+r*.95} ${x} ${y+r*.9} C${x+r*1.2} ${y+r*.95} ${x+r*1.25} ${y-r*1.1} ${x} ${y-r*.55}Z M${x} ${y-r*.55} L${x+r*.2} ${y-r*1.05} M${x+r*.15} ${y-r*.85} q${r*.5} ${-r*.35} ${r*.75} ${-r*.05}" ${st}/>`;
  if(kind==="fisch")return `<path d="M${x-r} ${y} C${x-r*.4} ${y-r*.8} ${x+r*.5} ${y-r*.7} ${x+r*.7} ${y} C${x+r*.5} ${y+r*.7} ${x-r*.4} ${y+r*.8} ${x-r} ${y}Z M${x+r*.7} ${y} L${x+r*1.2} ${y-r*.55} L${x+r*1.2} ${y+r*.55}Z" ${st}/><circle cx="${x-r*.45}" cy="${y-r*.12}" r="2.5" fill="#1C2633"/>`;
  return "";
}
function schwungPath(m,w,h,y0){
  const pts=[];const step=m==="schlaufe"?60:m==="zacke"?40:m==="treppe"?40:60;let d=`M20 ${y0+h/2}`;
  if(m==="welle"){for(let x=20;x+step<=w;x+=step)d+=` q${step/4} ${-h/2} ${step/2} 0 t${step/2} 0`;}
  else if(m==="zacke"){d=`M20 ${y0+h-6}`;for(let x=20,up=true;x+step/2<=w;x+=step/2,up=!up)d+=` L${x+step/2} ${up?y0+6:y0+h-6}`;}
  else if(m==="bogen"){d=`M20 ${y0+6}`;for(let x=20;x+step<=w;x+=step)d+=` a${step/2} ${h-12} 0 0 0 ${step} 0`;}
  else if(m==="schlaufe"){d=`M20 ${y0+h-8}`;for(let x=20;x+step<=w;x+=step)d+=` c${step*.9} 0 ${step*.9} ${-(h-14)} ${step*.45} ${-(h-14)} c${-step*.45} 0 ${-step*.45} ${h-14} ${step*.55} ${h-14}`;}
  else if(m==="treppe"){d=`M20 ${y0+h-6}`;for(let x=20,up=true;x+step<=w;x+=step,up=!up)d+=` L${x} ${up?y0+6:y0+h-6} L${x+step} ${up?y0+6:y0+h-6}`;}
  return d;
}
const W=674; // inner width of an A4 page in px (794 minus margins)
function blockHTML(b){
  const p=b.p||{};
  if(b.t==="titel")return `<h1 class="ws-title">${esc(p.text)}</h1>`;
  if(b.t==="name")return `<div class="ws-name"><span>Name: ____________________________</span><span>Datum: ______________</span></div>`;
  if(b.t==="anleitung")return `<p class="ws-text">${esc(p.text)}</p>`;
  if(b.t==="zaehlen"){const R=rng(p.seed),rows=Math.max(1,Math.min(8,+p.rows||4)),max=Math.max(1,Math.min(10,+p.max||6));let s="",H=70;
    for(let i=0;i<rows;i++){const n=1+Math.floor(R()*max),y=i*H+H/2;const mot=String(p.symbol).startsWith("m:"),gap=mot?62:52;for(let j=0;j<n;j++)s+=symbolSVG(p.symbol,40+j*gap,y,mot?21:20);s+=`<rect x="${W-80}" y="${y-26}" width="52" height="52" rx="8" fill="none" stroke="#1C2633" stroke-width="2.5"/>`}
    return `<svg class="ws-svg" viewBox="0 0 ${W} ${rows*H}" width="${W}" height="${rows*H}">${s}</svg>`}
  if(b.t==="nachspuren"){const big=p.size!=="mittel",fs=big?96:64,per=big?9:15,H=big?120:84;const words=String(p.text||"").split(/\s+/).filter(Boolean);const lines=[];let l="";
    words.forEach(w=>{if((l+" "+w).trim().length>per&&l){lines.push(l);l=w}else l=(l+" "+w).trim()});if(l)lines.push(l);
    let s="";lines.forEach((ln,i)=>{const base=i*H+fs*.95;s+=`<line x1="0" x2="${W}" y1="${base}" y2="${base}" stroke="#9AA6B3" stroke-width="1.5"/><line x1="0" x2="${W}" y1="${base-fs*.5}" y2="${base-fs*.5}" stroke="#C9D1DA" stroke-width="1" stroke-dasharray="6 6"/><text x="10" y="${base}" font-family="'Baloo 2','Comic Sans MS',sans-serif" font-size="${fs}" font-weight="600" fill="none" stroke="#5A6676" stroke-width="2.2" stroke-dasharray="5 5" letter-spacing="6">${esc(ln)}</text>`});
    return `<svg class="ws-svg" viewBox="0 0 ${W} ${Math.max(1,lines.length)*H}" width="${W}" height="${Math.max(1,lines.length)*H}">${s}</svg>`}
  if(b.t==="schwung"){const rows=Math.max(1,Math.min(6,+p.rows||3)),h=70,G=26;let s="";
    for(let i=0;i<rows;i++){const y0=i*(h+G);s+=`<rect x="0" y="${y0}" width="${W}" height="${h}" rx="10" fill="none" stroke="#DCE2E8" stroke-width="1.5"/><path d="${schwungPath(p.muster,W-20,h,y0)}" fill="none" stroke="${i===0?"#1C2633":"#7C8794"}" stroke-width="${i===0?3:2.5}" stroke-dasharray="${i===0?"0":"7 7"}" stroke-linecap="round"/><circle cx="20" cy="${p.muster==="bogen"?y0+6:p.muster==="welle"?y0+h/2:y0+h-6+(p.muster==="schlaufe"?-2:0)}" r="5" fill="#E4572E"/>`}
    return `<svg class="ws-svg" viewBox="0 0 ${W} ${rows*(h+G)}" width="${W}" height="${rows*(h+G)}">${s}</svg>`}
  if(b.t==="malfeld")return `<div class="ws-mal"><p class="ws-text">${esc(p.text)}</p><div class="ws-box" style="height:${p.hoehe==="klein"?220:420}px"></div></div>`;
  if(b.t==="ausmalen")return `<div class="ws-mal"><p class="ws-text">${esc(p.text)}</p><svg class="ws-svg ws-color" viewBox="0 0 100 100" width="${W}" height="440" preserveAspectRatio="xMidYMid meet"><g class="m">${MOTIVE.inner(p.motif,true)}</g></svg></div>`;
  if(b.t==="linien"){const rows=Math.max(1,Math.min(10,+p.rows||3));let s="";for(let i=0;i<rows;i++){const y=i*60+50;s+=`<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="#5A6676" stroke-width="1.5"/><line x1="0" x2="${W}" y1="${y-22}" y2="${y-22}" stroke="#C9D1DA" stroke-width="1" stroke-dasharray="6 6"/>`}
    return `<svg class="ws-svg" viewBox="0 0 ${W} ${rows*60+10}" width="${W}" height="${rows*60+10}">${s}</svg>`}
  return "";
}

/* ---------- page renderers (fixed A4 at 794×1123 px) ---------- */
function pageMotifs(s){const own=(s.motifs||[]).filter(MOTIVE.has);if(own.length)return own;const T=MOTIVE.THEMES[s.theme];return T?T.motifs:[]}
function decoHTML(s,outline){
  const all=pageMotifs(s);if(!all.length)return "";const R=rng(s.seed||1),ms=all.slice().sort(()=>R()-.5),pick=i=>ms[i%ms.length];
  const dens=outline?1:(+s.density||2),spots=[["left:34px;top:30px",96,-8],["right:34px;top:30px",96,8],["left:30px;bottom:26px",84,-6],["right:30px;bottom:26px",84,6]];
  const n=outline?(s.type==="ab"?1:2):dens>=2?4:2;let h="";
  const use=outline&&s.type==="ab"?[spots[1]]:spots.slice(0,n);
  use.forEach(([pos,size,rot],i)=>{h+=`<div class="deco" style="${pos};width:${size}px;height:${size}px;transform:rotate(${(rot+(R()*8-4)).toFixed(1)}deg)">${MOTIVE.svg(pick(i),{size,outline})}</div>`});
  return h;
}
function motifRow(s){const ms=pageMotifs(s);if(!ms.length||(+s.density||2)<3)return "";const R=rng((s.seed||1)+7);return `<div class="pf-row">${Array.from({length:9},(_,i)=>`<span style="transform:rotate(${(R()*16-8).toFixed(0)}deg)">${MOTIVE.svg(ms[i%ms.length],{size:46})}</span>`).join("")}</div>`}
function photoSlot(s,i,cls=""){const a=(s.photos||[])[i];return `<div class="pf-photo ${cls}">${a?`<img data-asset="${a}" alt="">`:`<span>Foto ${i+1}</span>`}</div>`}
function pageHTML(s){
  if(s.type==="ab")return `<div class="a4 ws${s.theme||pageMotifs(s).length?" themed":""}">${decoHTML(s,true)}${(s.blocks||[]).map(b=>`<div class="ws-block">${blockHTML(b)}</div>`).join("")}</div>`;
  const k=kidById(s.kid),L=s.layout,title=esc(fillVars(s.title,s.kid,s.date)),text=fillVars(s.text,s.kid,s.date);
  const foot=`<div class="pf-foot"><span>${esc(k?k.name.replace(/^Beispiel /,""):"")}</span><span>${esc(fmtD(s.date||today(),{day:"numeric",month:"long",year:"numeric"}))}</span></div>`;
  let body="";
  if(L==="lern")body=`<div class="pf-grid lern">${photoSlot(s,0,"big")}${photoSlot(s,1)}${photoSlot(s,2)}</div><div class="pf-letter">${esc(text)}</div>`;
  else if(L==="kann")body=`${photoSlot(s,0,"wide")}<ul class="pf-stars">${text.split("\n").filter(x=>x.trim()).map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`;
  else if(L==="foto")body=`<div class="pf-grid four">${[0,1,2,3].map(i=>`<figure>${photoSlot(s,i)}<figcaption>${esc((s.caps||[])[i]||"")}</figcaption></figure>`).join("")}</div>${text?`<div class="pf-letter">${esc(text)}</div>`:""}`;
  else if(L==="ich")body=`<div class="pf-ich">${photoSlot(s,0,"round")}<dl>${text.split("\n").filter(x=>x.trim()).map(x=>{const i=x.indexOf(":");return i>0?`<div><dt>${esc(x.slice(0,i+1))}</dt><dd>${esc(x.slice(i+1).trim())||"&nbsp;"}</dd></div>`:`<div><dd>${esc(x)}</dd></div>`}).join("")}</dl></div>`;
  const T=MOTIVE.THEMES[s.theme],vars=T?` style="--paper-accent:${T.accent};--paper-warm:${T.warm}"`:"";
  return `<div class="a4 pf pf-${L}${T||pageMotifs(s).length?" themed":""}"${vars}>${decoHTML(s,false)}<h1 class="pf-title">${title}</h1>${motifRow(s)}${body}${foot}</div>`;
}

/* ---------- KI-Gestaltung ---------- */
const kiOn=()=>!!(window.KH_SYNC&&KH_SYNC.ki);
const KI_FEHLER={auth:"Bitte melde dich einmal ab und wieder an.",offline:"Keine Internetverbindung.",fehlt:"Die KI ist noch nicht eingerichtet (die Supabase-Funktion kh-ki fehlt).",
  kein_schluessel:"Der Anthropic-Schlüssel fehlt in Supabase.",schluessel_falsch:"Der Anthropic-Schlüssel stimmt nicht.",guthaben:"Das KI-Guthaben ist aufgebraucht.",
  zu_viele:"Gerade zu viele Anfragen. Bitte gleich noch einmal.",abgelehnt:"Diesen Wunsch wollte die KI nicht umsetzen. Formuliere ihn bitte etwas anders.",zu_lang:"Das Ergebnis wurde zu lang. Bitte den Wunsch etwas kleiner fassen."};
function kiBox(s){
  if(!kiOn())return "";
  const busy=ui.gKiBusy,m=ui.gKiMsg&&ui.gKiMsg.id===(s?s.id:"neu")?ui.gKiMsg:null;
  const ph=!s?"Zum Beispiel: Zählen bis 5 mit Dinos, dazu ein Dino zum Ausmalen":s.type==="pf"?"Zum Beispiel: Mehr Bagger, er liebt Bagger. Oder: Schreib den Text fröhlicher.":"Zum Beispiel: Mach daraus ein Blatt zum Thema Traktoren, etwas leichter.";
  return `<div class="ki-box"><label class="f"><span>✨ Mit KI gestalten</span><textarea id="${s?"g-wish":"g-wishnew"}" data-bind="gWish" placeholder="${esc(ph)}" ${busy?"disabled":""}>${esc(ui.gWish||"")}</textarea></label>
    <div class="row"><button class="btn" data-act="${s?"gKi":"gKiNew"}" ${busy?"disabled":""}>${busy?"Ich gestalte …":s?"Umsetzen":"Blatt erstellen"}</button>${m&&!m.err&&ui.gUndo&&s&&ui.gUndo.id===s.id?`<button class="btn ghost" data-act="gKiUndo">Rückgängig</button>`:""}</div>
    ${busy?`<p class="small muted" style="margin:0">Das dauert meist 20 bis 60 Sekunden.</p>`:""}
    ${m?`<p class="small" style="margin:0;color:${m.err?"var(--bad)":"var(--ok)"}">${esc(m.text)}</p>`:""}
    <p class="small muted" style="margin:0">Fotos und Namen werden nicht übertragen. Bitte schreib keine Nachnamen oder Gesundheitsdaten in den Wunsch.</p></div>`;
}
function kidAnon(kid){const k=kidById(kid);if(!k)return t=>t;const full=k.name.replace(/^Beispiel /,"").trim(),parts=full.split(/\s+/).filter(x=>x.length>1);
  const re=new RegExp([full,...parts].sort((a,b)=>b.length-a.length).map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|"),"gi");return t=>String(t||"").replace(re,"{Name}")}
function kiPayload(s,wish){
  const anon=kidAnon(s.kid),k=kidById(s.kid);
  const bib={motive:Object.fromEntries(allMotifs()),themen:Object.fromEntries(Object.entries(MOTIVE.THEMES).map(([key,t])=>[key,{name:t.name,motive:t.motifs}]))};
  const deko=(s.motifs||[]).filter(MOTIVE.has);
  const aktuell=s.type==="ab"
    ?{titel:anon(s.title),thema:s.theme||"",deko_motive:deko,bausteine:(s.blocks||[]).map(b=>{const p=b.p||{};return {typ:b.t,text:anon(p.text||""),option:String(p.symbol||p.motif||p.size||p.muster||p.hoehe||"").replace(/^m:/,""),reihen:+p.rows||0,hoechstens:+p.max||0}})}
    :{titel:anon(s.title),text:anon(s.text),bildunterschriften:s.layout==="foto"?[0,1,2,3].map(i=>anon((s.caps||[])[i]||"")):[],thema:s.theme||"",dichte:+s.density||2,deko_motive:deko};
  return {type:s.type,layout:s.layout||"",alter:k&&k.geb?age(k.geb,s.date||today()):"",wunsch:anon(wish),bibliothek:bib,aktuell};
}
const clamp=(v,a,b,d)=>{v=Math.round(+v);return isFinite(v)&&v>=a?Math.min(b,v):d};
function kiApply(s,r){
  const neu=[];(r.neue_motive||[]).slice(0,3).forEach((m,i)=>{const key="ki"+uid().replace(/[^a-z0-9]/gi,"").slice(0,10)+i,name=String(m.name||"Motiv").slice(0,40);
    if(MOTIVE.add(key,name,m.svg)){const G=gDoc();G.motive=G.motive||[];G.motive.push({key,name,svg:MOTIVE.clean(m.svg),t:Date.now()});neu[i]=key}});
  const ref=x=>{x=String(x||"").replace(/^m:/,"");const n=/^neu:(\d+)$/.exec(x);if(n)return neu[+n[1]]||null;return MOTIVE.has(x)?x:null};
  const theme=r.thema in MOTIVE.THEMES?r.thema:"";const T=MOTIVE.THEMES[theme];
  s.title=String(r.titel||s.title||"");s.theme=theme;s.motifs=(r.deko_motive||[]).map(ref).filter(Boolean).slice(0,4);s.seed=Math.floor(Math.random()*1e6);
  if(s.type==="pf"){s.text=String(r.text??s.text);s.density=clamp(r.dichte,1,3,2);if(s.layout==="foto")s.caps=[0,1,2,3].map(i=>String((r.bildunterschriften||[])[i]||""))}
  else{
    const fb=s.motifs[0]||(T&&T.motifs[0])||"bagger";
    const blocks=(r.bausteine||[]).filter(b=>BLOCKS[b.typ]).slice(0,14).map(b=>{const t=b.typ,o=String(b.option||""),text=String(b.text||"");
      if(t==="titel"||t==="anleitung")return {t,p:{text}};
      if(t==="zaehlen"){const m=o in SYMBOLS?o:ref(o);return {t,p:{symbol:o in SYMBOLS?o:m?"m:"+m:"m:"+fb,rows:clamp(b.reihen,1,8,4),max:clamp(b.hoechstens,1,10,5),seed:Math.floor(Math.random()*1e6)}}}
      if(t==="nachspuren")return {t,p:{text,size:o==="mittel"?"mittel":"gross"}};
      if(t==="schwung")return {t,p:{muster:o in MUSTER?o:"welle",rows:clamp(b.reihen,1,6,3)}};
      if(t==="malfeld")return {t,p:{text,hoehe:o==="klein"?"klein":"gross"}};
      if(t==="linien")return {t,p:{rows:clamp(b.reihen,1,10,3)}};
      if(t==="ausmalen")return {t,p:{motif:ref(o)||fb,text}};
      return {t,p:{}};
    });
    if(blocks.length)s.blocks=blocks;
  }
  s.t=Date.now();
}
async function kiRun(s,wish){
  wish=String(wish||"").trim();if(!wish){toast("Schreib zuerst deinen Wunsch auf.");return}
  if(ui.gKiBusy)return;ui.gKiBusy=true;ui.gKiMsg=null;render();
  const before=JSON.stringify(s);let res;
  try{res=await KH_SYNC.ki(kiPayload(s,wish))}catch(e){res={fehler:"fehler"}}
  ui.gKiBusy=false;
  if(res&&res.ergebnis){try{kiApply(s,res.ergebnis);ui.gUndo={id:s.id,data:before};touch("gestalten");ui.gKiMsg={id:s.id,text:String(res.ergebnis.antwort||"Fertig.")}}
    catch(e){console.warn(e);ui.gKiMsg={id:s.id,err:true,text:KI_FEHLER.fehler||"Das hat nicht geklappt. Bitte noch einmal versuchen."}}}
  else ui.gKiMsg={id:s.id,err:true,text:KI_FEHLER[res&&res.fehler]||"Das hat nicht geklappt. Bitte noch einmal versuchen."};
  if(cur()&&cur().id===s.id)render();else if(ui.tab==="gestalten")render();
}

/* ---------- view ---------- */
function list(type){
  const G=gDoc(),mine=G.seiten.filter(s=>s.type===type).sort((a,b)=>b.t-a.t),tpls=G.vorlagen.filter(v=>v.type===type).sort((a,b)=>a.name.localeCompare(b.name,"de"));
  const neu=type==="pf"
    ?`<div class="chips">${Object.entries(PF_LAYOUTS).map(([k,l])=>`<button class="chip" data-act="gNew" data-layout="${k}">+ ${l.name}</button>`).join("")}</div>`
    :`<div class="row"><button class="btn" data-act="gNew">Neues Arbeitsblatt</button></div>${kiOn()?`<div style="margin-top:12px">${kiBox(null)}</div>`:""}`;
  return `<div class="card"><h2>${type==="pf"?"Neue Portfolioseite":"Neues Arbeitsblatt"}</h2>${neu}
    ${tpls.length?`<h3>Meine Vorlagen</h3><div class="chips">${tpls.map(v=>`<span class="row" style="gap:2px"><button class="chip" data-act="gFromTpl" data-id="${v.id}">${esc(v.name)}</button>${ui.confirm==="tpl:"+v.id?`<button class="link" style="color:var(--bad)" data-act="gDelTpl" data-id="${v.id}">löschen?</button>`:`<button class="link muted" data-act="ask" data-key="tpl:${v.id}" aria-label="Vorlage löschen">×</button>`}</span>`).join("")}</div>`:`<p class="small muted" style="margin:0">Jede Seite kannst du beim Bearbeiten als Vorlage speichern. Sie erscheint dann hier.</p>`}</div>
  <div class="card"><h2>${type==="pf"?"Meine Portfolioseiten":"Meine Arbeitsblätter"}</h2>
    ${mine.length?`<ul class="list">${mine.map(s=>`<li class="row between"><button class="link" style="text-align:left;font-size:1rem" data-act="gOpen" data-id="${s.id}">${esc(fillVars(s.title||s.name,s.kid,s.date)||"Ohne Titel")}${s.kid?` · ${esc((kidById(s.kid)||{name:""}).name)}`:""}</button><span class="row"><span class="date">${esc(fmtD(s.date||today(),{day:"2-digit",month:"2-digit",year:"2-digit"}))}</span>${delBtn("gs:"+s.id)}</span></li>`).join("")}</ul>`:`<p class="small muted" style="margin:0">Noch nichts gestaltet. Alles, was du hier anlegst, wird automatisch gespeichert.</p>`}</div>`;
}
function editorPF(s){
  const L=PF_LAYOUTS[s.layout],pics=s.kid?fotos(s.kid):[];
  return `<label class="f">Kind<select id="g-kid" data-chg="gKid">${kidOptions(s.kid,"Kind auswählen")}</select></label>
  <label class="f">Überschrift<input id="g-title" data-bind="gField" data-f="title" value="${esc(s.title)}"></label>
  <label class="f">Datum<input type="date" id="g-date" data-bind="gField" data-f="date" value="${esc(s.date)}"></label>
  ${s.layout==="foto"?[0,1,2,3].map(i=>`<label class="f">Bildunterschrift ${i+1}<input id="g-cap${i}" data-bind="gCap" data-i="${i}" value="${esc((s.caps||[])[i])}"></label>`).join(""):""}
  <label class="f">${s.layout==="kann"?"Was kann das Kind? (eine Zeile pro Punkt)":s.layout==="ich"?"Steckbrief (eine Zeile pro Punkt, Frage: Antwort)":"Text"}<textarea id="g-text" data-bind="gField" data-f="text" style="min-height:${s.layout==="lern"?200:140}px">${esc(s.text)}</textarea></label>
  <p class="small muted" style="margin:0">{Name} und {Alter} werden automatisch durch die Angaben des Kindes ersetzt.</p>
  ${themePicker(s)}
  <h3>Fotos (${L.photos} ${L.photos===1?"Platz":"Plätze"})</h3>
  <div class="row">${Array.from({length:L.photos},(_,i)=>{const a=(s.photos||[])[i];return `<button class="thumb slot" data-act="gSlot" data-i="${i}" aria-label="Fotoplatz ${i+1}${a?" leeren":""}">${a?`<img data-asset="${(fotos(s.kid).find(p=>p.asset===a)||{}).thumb||a}" alt="">`:`<span>${i+1}</span>`}</button>`}).join("")}</div>
  ${!s.kid?`<p class="small muted" style="margin:0">Wähle oben ein Kind, dann erscheinen seine Fotos.</p>`:pics.length?`<p class="small muted" style="margin:0">Tippe auf ein Foto, um es in den nächsten freien Platz zu legen. Ein Tipp auf einen belegten Platz leert ihn.</p><div class="grid pick">${pics.map(p=>`<button class="thumb" data-act="gPick" data-asset="${p.asset}"><img data-asset="${p.thumb}" alt="${esc(p.caption)}"></button>`).join("")}</div>`:`<p class="small muted" style="margin:0">Von diesem Kind gibt es noch keine Fotos. Du kannst sie unter Kinder → Fotos hochladen.</p>`}`;
}
function themePicker(s){
  return `<h3>Thema</h3><div class="chips">${Object.entries(THEME_OPTS).map(([k,n])=>`<button class="chip ${(s.theme||"")===k?"on":""}" data-act="gTheme" data-theme="${k}">${k?`<span class="chip-ico">${MOTIVE.svg(MOTIVE.THEMES[k].motifs[0],{size:22})}</span>`:""}${n}</button>`).join("")}</div>
  ${(s.motifs||[]).length?`<p class="small muted" style="margin:0">Schmuck: ${s.motifs.filter(MOTIVE.has).map(k=>esc(MOTIVE.name(k))).join(", ")} <button class="link" data-act="gOwnOff">Motive des Themas verwenden</button></p>`:""}
  ${(s.theme||(s.motifs||[]).length)&&s.type==="pf"?`<div class="row"><div class="seg seg3" style="flex:1 1 220px">${[[1,"Wenig"],[2,"Mittel"],[3,"Viel"]].map(([v,l])=>`<button type="button" class="${(+s.density||2)===v?"on":""}" data-act="gDensity" data-v="${v}">${l}</button>`).join("")}</div><button class="btn-sm" data-act="gShuffle">Neu anordnen</button></div>`:""}`;
}
function editorAB(s){
  return `<label class="f">Name des Blatts<input id="g-name" data-bind="gField" data-f="title" value="${esc(s.title)}"></label>
  ${themePicker(s)}
  ${(s.blocks||[]).map((b,i)=>`<div class="g-block"><div class="row between"><b>${BLOCKS[b.t].name}</b><span class="row" style="gap:4px"><button class="btn-sm" data-act="gMove" data-i="${i}" data-d="-1" aria-label="Nach oben" ${i===0?"disabled":""}>↑</button><button class="btn-sm" data-act="gMove" data-i="${i}" data-d="1" aria-label="Nach unten" ${i===s.blocks.length-1?"disabled":""}>↓</button><button class="btn-sm" style="color:var(--bad);background:var(--bad-soft)" data-act="gDelBlock" data-i="${i}" aria-label="Entfernen">✕</button></span></div>${blockFields(b,i)}</div>`).join("")}
  <label class="f">Baustein hinzufügen<select id="g-add" data-chg="gAdd"><option value="">Auswählen …</option>${Object.entries(BLOCKS).map(([k,v])=>`<option value="${k}">${v.name}</option>`).join("")}</select></label>`;
}
function blockFields(b,i){
  const p=b.p,inp=(f,l,v,type="text",extra="")=>`<label class="f">${l}<input id="g-b${i}-${f}" type="${type}" data-bind="gBlock" data-i="${i}" data-f="${f}" value="${esc(v)}" ${extra}></label>`;
  const sel=(f,l,opts,v)=>`<label class="f">${l}<select id="g-b${i}-${f}" data-chg="gBlockSel" data-i="${i}" data-f="${f}">${Object.entries(opts).map(([k,n])=>`<option value="${k}" ${v===k?"selected":""}>${n}</option>`).join("")}</select></label>`;
  if(b.t==="titel"||b.t==="anleitung")return inp("text","Text",p.text);
  if(b.t==="ausmalen")return `<div class="g-two">${sel("motif","Motiv",motifOpts(),p.motif)}${inp("text","Aufgabe",p.text)}</div>`;
  if(b.t==="zaehlen")return `<div class="g-two">${sel("symbol","Symbol",symbolOpts(),p.symbol)}${inp("rows","Reihen",p.rows,"number",'min="1" max="8"')}${inp("max","Höchstens",p.max,"number",'min="1" max="10"')}</div><button class="btn-sm" data-act="gReroll" data-i="${i}">Neu mischen</button>`;
  if(b.t==="nachspuren")return `<div class="g-two">${inp("text","Wort oder Buchstaben",p.text)}${sel("size","Größe",{gross:"Groß",mittel:"Mittel"},p.size)}</div>`;
  if(b.t==="schwung")return `<div class="g-two">${sel("muster","Muster",MUSTER,p.muster)}${inp("rows","Reihen",p.rows,"number",'min="1" max="6"')}</div>`;
  if(b.t==="malfeld")return `<div class="g-two">${inp("text","Aufgabe",p.text)}${sel("hoehe","Größe",{gross:"Groß",klein:"Klein"},p.hoehe)}</div>`;
  if(b.t==="linien")return inp("rows","Anzahl Linien",p.rows,"number",'min="1" max="10"');
  return "";
}
function editor(s){
  return `<div class="row between"><button class="btn-sm" data-act="gClose">‹ Übersicht</button><span class="small muted">Wird automatisch gespeichert</span></div>
  <div class="g-wrap"><div class="card g-controls">${kiBox(s)}${s.type==="pf"?editorPF(s):editorAB(s)}
    <div class="row">${ui.gSaveTpl?`<input id="g-tplname" placeholder="Name der Vorlage" value="${esc(s.title?fillVars(s.title,"",s.date):"")}" style="flex:1 1 160px"><button class="btn" data-act="gSaveTpl">Speichern</button><button class="btn ghost" data-act="gSaveTplCancel">Abbrechen</button>`:`<button class="btn" data-act="gPrint">Drucken oder PDF</button><button class="btn ghost" data-act="gSaveTplAsk">Als Vorlage speichern</button>`}</div></div>
  <div class="g-preview" id="g-preview">${pageHTML(s)}</div></div>`;
}
VIEWS.gestalten=function(){
  syncMotive();const mode=ui.gMode||"pf";
  const seg=`<div class="seg seg3" role="tablist">${[["pf","Portfolio"],["ab","Arbeitsblatt"],["brief","Elternbrief"]].map(([k,l])=>`<button type="button" class="${mode===k?"on":""}" data-act="gMode" data-m="${k}" role="tab" aria-selected="${mode===k}">${l}</button>`).join("")}</div>`;
  if(mode==="brief")return seg+VIEWS.briefe();
  const s=cur();
  if(s&&s.type===mode)return seg+editor(s);
  return seg+list(mode);
};

/* ---------- actions ---------- */
function newSeite(type,base){
  const s=Object.assign({id:uid(),type,t:Date.now(),date:today(),kid:"",photos:[],caps:[]},base);
  gDoc().seiten.push(s);touch("gestalten");ui.gEdit=s.id;ui.gSaveTpl=false;render();window.scrollTo(0,0);
}
function scalePreview(){$("#main").classList.toggle("wide",ui.tab==="gestalten"&&!!ui.gEdit);const pv=$("#g-preview");if(!pv)return;const a=pv.querySelector(".a4");if(a)a.style.zoom=Math.min(1,(pv.clientWidth-24)/794,innerWidth>=1000?(innerHeight-130)/1123:1)}
const _render=render;
render=function(){_render();scalePreview()};
window.addEventListener("resize",scalePreview);
function refreshPreview(){const s=cur(),pv=$("#g-preview");if(!s||!pv)return;pv.innerHTML=pageHTML(s);scalePreview();hydrate()}
Object.assign(ACT,{
  gMode:t=>{ui.gMode=t.dataset.m;ui.gEdit=null;ui.confirm=null;render()},
  gNew:t=>{if((ui.gMode||"pf")==="pf"){const L=PF_LAYOUTS[t.dataset.layout];newSeite("pf",{layout:t.dataset.layout,title:L.title,text:L.text})}
    else newSeite("ab",{title:"Arbeitsblatt",blocks:["titel","name","anleitung","zaehlen"].map(k=>({t:k,p:BLOCKS[k].d()}))})},
  gFromTpl:t=>{const v=gDoc().vorlagen.find(x=>x.id===t.dataset.id);if(!v)return;const d=JSON.parse(JSON.stringify(v.data));if(d.blocks)d.blocks.forEach(b=>{if(b.t==="zaehlen")b.p.seed=Math.floor(Math.random()*1e6)});newSeite(v.type,d)},
  gDelTpl:t=>{const G=gDoc();G.vorlagen=G.vorlagen.filter(v=>v.id!==t.dataset.id);touch("gestalten");ui.confirm=null;render()},
  gOpen:t=>{ui.gEdit=t.dataset.id;ui.gSaveTpl=false;render();window.scrollTo(0,0)},
  gClose:()=>{ui.gEdit=null;ui.gSaveTpl=false;render()},
  gTheme:t=>{const s=cur();s.theme=t.dataset.theme;s.motifs=[];s.seed=s.seed||Math.floor(Math.random()*1e6);
    if(s.type==="ab"&&s.theme)s.blocks.forEach(b=>{if(b.t==="zaehlen"&&!String(b.p.symbol).startsWith("m:"))b.p.symbol="m:"+MOTIVE.THEMES[s.theme].motifs[0];if(b.t==="ausmalen")b.p.motif=MOTIVE.THEMES[s.theme].motifs[0]});
    touch("gestalten");render()},
  gKi:()=>{const s=cur();if(s)kiRun(s,ui.gWish)},
  gKiNew:()=>{const w=String(ui.gWish||"").trim();if(!w){toast("Schreib zuerst deinen Wunsch auf.");return}if(ui.gKiBusy)return;ACT.gNew({dataset:{}});const s=cur();ui.gUndo=null;kiRun(s,w)},
  gKiUndo:()=>{const u=ui.gUndo,G=gDoc();if(!u)return;const i=G.seiten.findIndex(x=>x.id===u.id);if(i>=0){G.seiten[i]=JSON.parse(u.data);touch("gestalten")}ui.gUndo=null;ui.gKiMsg=null;render()},
  gOwnOff:()=>{const s=cur();s.motifs=[];touch("gestalten");render()},
  gDensity:t=>{cur().density=+t.dataset.v;touch("gestalten");render()},
  gShuffle:()=>{cur().seed=Math.floor(Math.random()*1e6);touch("gestalten");refreshPreview()},
  gSlot:t=>{const s=cur(),i=+t.dataset.i;if(s.photos[i]){s.photos[i]=null;touch("gestalten");render()}},
  gPick:t=>{const s=cur(),n=PF_LAYOUTS[s.layout].photos;let i=-1;for(let j=0;j<n;j++)if(!s.photos[j]){i=j;break}
    if(i<0){toast("Alle Fotoplätze sind belegt. Tippe oben auf einen Platz, um ihn zu leeren.");return}s.photos[i]=t.dataset.asset;touch("gestalten");render()},
  gMove:t=>{const s=cur(),i=+t.dataset.i,j=i+ +t.dataset.d;if(j<0||j>=s.blocks.length)return;[s.blocks[i],s.blocks[j]]=[s.blocks[j],s.blocks[i]];touch("gestalten");render()},
  gDelBlock:t=>{const s=cur();s.blocks.splice(+t.dataset.i,1);touch("gestalten");render()},
  gReroll:t=>{cur().blocks[+t.dataset.i].p.seed=Math.floor(Math.random()*1e6);touch("gestalten");refreshPreview()},
  gSaveTplAsk:()=>{ui.gSaveTpl=true;render();setTimeout(()=>{const i=$("#g-tplname");if(i){i.focus();i.select()}},30)},
  gSaveTplCancel:()=>{ui.gSaveTpl=false;render()},
  gSaveTpl:()=>{const s=cur(),name=($("#g-tplname").value||"").trim()||"Vorlage";
    const data=s.type==="pf"?{layout:s.layout,title:s.title,text:s.text,caps:s.caps||[],theme:s.theme||"",density:s.density||2}:{title:s.title,blocks:s.blocks,theme:s.theme||""};
    gDoc().vorlagen.push({id:uid(),type:s.type,name,data:JSON.parse(JSON.stringify(data)),t:Date.now()});touch("gestalten");ui.gSaveTpl=false;toast(`Vorlage „${name}“ gespeichert`);render()},
  gPrint:async()=>{const s=cur();if(!s)return;const root=$("#print-root");root.innerHTML=pageHTML(s);
    const imgs=[...root.querySelectorAll("img[data-asset]")];await Promise.all(imgs.map(img=>photoURL(img.dataset.asset).then(u=>new Promise(r=>{img.onload=img.onerror=r;img.src=u})).catch(()=>{})));
    const old=document.title;document.title=fillVars(s.title,s.kid,s.date)||"Kita-Helfer";setTimeout(()=>{window.print();document.title=old},50)}
});
const _del=ACT.del;
ACT.del=t=>{const k=t.dataset.key;if(k.startsWith("gs:")){const G=gDoc();G.seiten=G.seiten.filter(s=>s.id!==k.slice(3));touch("gestalten");ui.confirm=null;toast("Gelöscht");render();return}_del(t)};
Object.assign(BIND,{
  gWish:t=>{ui.gWish=t.value},
  gField:t=>{const s=cur();if(!s)return;s[t.dataset.f]=t.value;s.t=Date.now();touch("gestalten");refreshPreview()},
  gCap:t=>{const s=cur();s.caps=s.caps||[];s.caps[+t.dataset.i]=t.value;touch("gestalten");refreshPreview()},
  gBlock:t=>{const b=cur().blocks[+t.dataset.i];b.p[t.dataset.f]=t.type==="number"?+t.value:t.value;touch("gestalten");refreshPreview()}
});
Object.assign(CHG,{
  gKid:t=>{const s=cur();if(s.kid!==t.value){s.kid=t.value;s.photos=[]}touch("gestalten");render()},
  gBlockSel:t=>{cur().blocks[+t.dataset.i].p[t.dataset.f]=t.value;touch("gestalten");refreshPreview()},
  gAdd:t=>{if(!t.value)return;cur().blocks.push({t:t.value,p:BLOCKS[t.value].d()});touch("gestalten");render()}
});
})();

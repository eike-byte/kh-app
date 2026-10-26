/* Stil-Baukasten für Portfolioseiten: Farben, Hintergründe, Rahmen, Überschriften, Fotoformen,
   Textkästen, Schriften, Anordnungen und frei platzierte Aufkleber. Eine Seite mit s.stil wird damit
   gestaltet; Seiten ohne s.stil sehen aus wie bisher. Die KI setzt s.stil frei zusammen. */
(()=>{
const PALETTES={
  sonne:{name:"Sonnig",c1:"#E07A1F",c2:"#F2C230",c3:"#3FA7D6",warm:"#FFF4D6"},
  meer:{name:"Meer",c1:"#1E7FA8",c2:"#5BC0DE",c3:"#F2A23B",warm:"#E3F4FA"},
  wiese:{name:"Wiese",c1:"#3E8E2F",c2:"#8CC84B",c3:"#F2C230",warm:"#EEF7E3"},
  beere:{name:"Beere",c1:"#C2185B",c2:"#9C7BE0",c3:"#F28CB1",warm:"#FCE8F1"},
  bonbon:{name:"Bonbon",c1:"#D6487F",c2:"#4FB3D9",c3:"#F7C948",warm:"#FFF0F6"},
  herbst:{name:"Herbst",c1:"#B85C1E",c2:"#E0A030",c3:"#7A9A3A",warm:"#FBEEDD"},
  nacht:{name:"Sternennacht",c1:"#3A3F9E",c2:"#9C7BE0",c3:"#F2C230",warm:"#E8E9FA"},
  regenbogen:{name:"Regenbogen",c1:"#E4572E",c2:"#3FA7D6",c3:"#6DBA52",warm:"#FFF8E8"},
  pastell:{name:"Pastell",c1:"#6F8FCF",c2:"#F4A6B8",c3:"#8FD1AE",warm:"#F6F3FF"},
  feuer:{name:"Feuerwehr",c1:"#C9302C",c2:"#F2C230",c3:"#4A4F57",warm:"#FDECE8"},
  wald:{name:"Wald",c1:"#2F6B4F",c2:"#A3C46C",c3:"#C98A4B",warm:"#EDF4EA"},
  baustelle:{name:"Baustelle",c1:"#C98A00",c2:"#F07A2E",c3:"#4A4F57",warm:"#FFF1C7"}
};
const OPTS={
  hintergrund:{weiss:"Weiß",uni:"Farbig",punkte:"Punkte",karo:"Karo",streifen:"Streifen",konfetti:"Konfetti",sterne:"Sterne",wolken:"Wolken",wellen:"Wellen",herzen:"Herzen"},
  rahmen:{keiner:"Kein Rahmen",linie:"Linie",doppelt:"Doppellinie",naht:"Genäht",band:"Breites Band",kreise:"Kreise",wimpel:"Wimpelkette",ecken:"Fotoecken"},
  titel:{schlicht:"Schlicht",banner:"Banner",schild:"Schild",wolke:"Wolke",bunt:"Bunte Buchstaben",welle:"Wellenlinie"},
  foto:{rund:"Abgerundet",polaroid:"Polaroid",klebeband:"Klebeband",oval:"Oval",blob:"Klecks",rahmen:"Farbrahmen"},
  text:{schlicht:"Schlicht",zettel:"Notizzettel",sprechblase:"Sprechblase",karte:"Karte",tafel:"Tafel"},
  schrift:{baloo:"Rund",fredoka:"Weich",hand:"Handschrift",kreide:"Kreide"}
};
const VARIANTEN={lern:{1:"Großes Foto links",2:"Großes Foto rechts",3:"Drei Fotos nebeneinander"},kann:{1:"Foto oben",2:"Foto neben der Liste",3:"Foto unten"},foto:{1:"Raster",2:"Collage",3:"Verstreut"},ich:{1:"Foto in der Mitte",2:"Foto neben dem Steckbrief"}};
const FONTS={baloo:"'Baloo 2',sans-serif",fredoka:"'Fredoka',sans-serif",hand:"'Patrick Hand',cursive",kreide:"'Gochi Hand',cursive"};
const pick=(o,v,d)=>v in o?v:d;

function colors(s){
  const P=PALETTES[(s.stil||{}).palette],T=window.MOTIVE&&MOTIVE.THEMES[s.theme];
  if(P)return P;if(T)return {c1:T.accent,c2:T.a,c3:T.b,warm:T.warm};return PALETTES.sonne;
}
function norm(st){st=st||{};return {
  palette:st.palette in PALETTES?st.palette:"",hintergrund:pick(OPTS.hintergrund,st.hintergrund,"weiss"),rahmen:pick(OPTS.rahmen,st.rahmen,"linie"),
  titel:pick(OPTS.titel,st.titel,"schlicht"),foto:pick(OPTS.foto,st.foto,"rund"),text:pick(OPTS.text,st.text,"schlicht"),schrift:pick(OPTS.schrift,st.schrift,"baloo"),
  variante:Math.max(1,Math.min(3,Math.round(+st.variante)||1)),zitat:String(st.zitat||"").slice(0,160),
  aufkleber:(Array.isArray(st.aufkleber)?st.aufkleber:[]).slice(0,12)}}

function rng(seed){let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
const W=794,H=1123;
function star(x,y,r,fill){let p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;p.push((x+rr*Math.cos(a)).toFixed(1)+","+(y+rr*Math.sin(a)).toFixed(1))}return `<polygon points="${p.join(" ")}" fill="${fill}"/>`}
function heart(x,y,r,fill){return `<path d="M${x} ${y+r*.85} C${x-r*1.3} ${y-r*.1} ${x-r*.75} ${y-r*1.05} ${x} ${y-r*.4} C${x+r*.75} ${y-r*1.05} ${x+r*1.3} ${y-r*.1} ${x} ${y+r*.85}Z" fill="${fill}"/>`}
function cloud(x,y,w,fill){const h=w*.45;return `<g fill="${fill}"><ellipse cx="${x}" cy="${y}" rx="${w/2}" ry="${h/2}"/><circle cx="${x-w*.18}" cy="${y-h*.35}" r="${h*.42}"/><circle cx="${x+w*.12}" cy="${y-h*.45}" r="${h*.5}"/></g>`}

/* background layer */
function bgHTML(s,C){
  const st=norm(s.stil),R=rng((s.seed||1)+31),cols=[C.c1,C.c2,C.c3];let g="";
  const soft=c=>`${c}`;
  if(st.hintergrund==="konfetti")for(let i=0;i<70;i++){const x=R()*W,y=R()*H,c=cols[i%3],k=R();g+=k<.4?`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(4+R()*5).toFixed(1)}" fill="${c}" opacity=".35"/>`:k<.75?`<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${(6+R()*8).toFixed(0)}" height="${(14+R()*10).toFixed(0)}" rx="3" fill="${c}" opacity=".35" transform="rotate(${(R()*180).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`:`<path d="M${x.toFixed(0)} ${y.toFixed(0)} q8 -10 16 0 t16 0" stroke="${c}" stroke-width="4" fill="none" opacity=".35" stroke-linecap="round"/>`}
  else if(st.hintergrund==="sterne")for(let i=0;i<46;i++)g+=star(R()*W,R()*H,6+R()*12,cols[i%3]).replace("/>",` opacity="${(.18+R()*.2).toFixed(2)}"/>`);
  else if(st.hintergrund==="herzen")for(let i=0;i<40;i++)g+=heart(R()*W,R()*H,8+R()*10,cols[i%3]).replace("/>",` opacity="${(.15+R()*.2).toFixed(2)}"/>`);
  else if(st.hintergrund==="wolken"){for(let i=0;i<7;i++){g+=cloud(R()*W,20+R()*90,110+R()*80,"#FFFFFF");g+=cloud(R()*W,H-30-R()*90,110+R()*80,"#FFFFFF")}}
  else if(st.hintergrund==="wellen"){for(let i=0;i<4;i++){const y=H-40-i*42;g+=`<path d="M0 ${y} ${Array.from({length:9},(_,j)=>`Q${j*100+50} ${y-(i%2?22:-22)} ${j*100+100} ${y}`).join(" ")} L${W} ${H} L0 ${H}Z" fill="${cols[i%3]}" opacity="${.12+i*.03}"/>`}}
  const bgc=st.hintergrund==="weiss"?"#FFFFFF":st.hintergrund==="wolken"?C.warm:st.hintergrund==="uni"?C.warm:"#FFFFFF";
  let css=`background:${bgc};`;
  if(st.hintergrund==="punkte")css+=`background-image:radial-gradient(${C.c2}55 3.5px,transparent 4px);background-size:34px 34px;`;
  if(st.hintergrund==="karo")css+=`background-image:linear-gradient(${C.c1}22 2px,transparent 2px),linear-gradient(90deg,${C.c1}22 2px,transparent 2px);background-size:32px 32px;`;
  if(st.hintergrund==="streifen")css+=`background-image:repeating-linear-gradient(135deg,${C.warm} 0 22px,#FFFFFF 22px 44px);`;
  return `<div class="st-bg" style="${css}">${g?`<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">${g}</svg>`:""}</div>`;
}

/* frame layer */
function frameHTML(s,C){
  const st=norm(s.stil),R=rng((s.seed||1)+57);let g="";
  if(st.rahmen==="linie")g=`<rect x="22" y="22" width="${W-44}" height="${H-44}" rx="26" fill="none" stroke="${C.c1}" stroke-width="5"/>`;
  else if(st.rahmen==="doppelt")g=`<rect x="16" y="16" width="${W-32}" height="${H-32}" rx="28" fill="none" stroke="${C.c1}" stroke-width="6"/><rect x="30" y="30" width="${W-60}" height="${H-60}" rx="20" fill="none" stroke="${C.c2}" stroke-width="3"/>`;
  else if(st.rahmen==="naht")g=`<rect x="14" y="14" width="${W-28}" height="${H-28}" rx="30" fill="none" stroke="${C.warm}" stroke-width="20"/><rect x="26" y="26" width="${W-52}" height="${H-52}" rx="22" fill="none" stroke="${C.c1}" stroke-width="3.5" stroke-dasharray="12 9" stroke-linecap="round"/>`;
  else if(st.rahmen==="band")g=`<rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${C.c2}" stroke-width="44"/><rect x="26" y="26" width="${W-52}" height="${H-52}" rx="18" fill="none" stroke="${C.c1}" stroke-width="4"/>`;
  else if(st.rahmen==="kreise"){const cols=[C.c1,C.c2,C.c3];let i=0;const dot=(x,y)=>{g+=`<circle cx="${x}" cy="${y}" r="9" fill="${cols[i++%3]}"/>`};
    for(let x=22;x<=W-22;x+=31)dot(x,22),dot(x,H-22);for(let y=53;y<=H-53;y+=31)dot(22,y),dot(W-22,y)}
  else if(st.rahmen==="wimpel"){const cols=[C.c1,C.c2,C.c3];g=`<rect x="22" y="22" width="${W-44}" height="${H-44}" rx="26" fill="none" stroke="${C.c1}" stroke-width="3"/><path d="M10 26 Q${W/2} 96 ${W-10} 26" fill="none" stroke="#5A6676" stroke-width="2.5"/>`;
    for(let i=0;i<13;i++){const t=(i+.5)/13,x=10+t*(W-20),y=26+(1-Math.pow(2*t-1,2))*35;g+=`<path d="M${(x-22).toFixed(0)} ${(y-2).toFixed(0)} L${(x+22).toFixed(0)} ${(y-2).toFixed(0)} L${x.toFixed(0)} ${(y+40).toFixed(0)}Z" fill="${cols[i%3]}" stroke="#1C2633" stroke-width="1.5" stroke-linejoin="round"/>`}}
  else if(st.rahmen==="ecken"){const c=C.c1,L=90;[[24,24,1,1],[W-24,24,-1,1],[24,H-24,1,-1],[W-24,H-24,-1,-1]].forEach(([x,y,dx,dy])=>{g+=`<path d="M${x} ${y} L${x+dx*L} ${y} L${x} ${y+dy*L}Z" fill="${c}" opacity=".9"/>`});
    g+=`<rect x="24" y="24" width="${W-48}" height="${H-48}" fill="none" stroke="${C.c2}" stroke-width="2" stroke-dasharray="2 8" stroke-linecap="round"/>`}
  return g?`<svg class="st-frame" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">${g}</svg>`:"";
}

function titleHTML(text,s,esc){
  const st=norm(s.stil);
  if(st.titel==="bunt"){const C=colors(s),cols=[C.c1,C.c2,C.c3];let i=0;
    return `<h1 class="pf-title st-t-bunt">${[...text].map(ch=>ch===" "?" ":`<span style="color:${cols[i%3]};display:inline-block;transform:rotate(${(i++%2?4:-4)}deg)">${esc(ch)}</span>`).join("")}</h1>`}
  return `<h1 class="pf-title st-t-${st.titel}"><span>${esc(text)}</span></h1>`;
}
function stickersHTML(s){
  const st=norm(s.stil);return st.aufkleber.filter(a=>a&&MOTIVE.has(a.m)).map(a=>{const g=Math.max(30,Math.min(260,+a.g||90)),x=Math.max(0,Math.min(100,+a.x||0)),y=Math.max(0,Math.min(100,+a.y||0));
    return `<div class="deco st-st" style="left:calc(${x}% - ${g/2}px);top:calc(${y}% - ${g/2}px);width:${g}px;height:${g}px;transform:rotate(${Math.max(-40,Math.min(40,+a.d||0))}deg)">${MOTIVE.svg(a.m,{size:g})}</div>`}).join("");
}
function classes(s){const st=norm(s.stil);return `styled v${st.variante} st-foto-${st.foto} st-text-${st.text} st-fr-${st.rahmen} st-bg-${st.hintergrund}`}
function vars(s){const C=colors(s),st=norm(s.stil);return `--paper-accent:${C.c1};--paper-warm:${C.warm};--c1:${C.c1};--c2:${C.c2};--c3:${C.c3};--f-title:${FONTS[st.schrift]};--f-text:${st.schrift==="hand"||st.schrift==="kreide"?FONTS[st.schrift]:"var(--f-body)"}`}
function random(theme){
  const r=a=>a[Math.floor(Math.random()*a.length)],k=o=>Object.keys(o);
  const T=window.MOTIVE&&MOTIVE.THEMES[theme];
  return {palette:T?"":r(k(PALETTES)),hintergrund:r(k(OPTS.hintergrund)),rahmen:r(k(OPTS.rahmen).filter(x=>x!=="keiner")),titel:r(k(OPTS.titel)),foto:r(k(OPTS.foto)),text:r(k(OPTS.text)),schrift:r(k(OPTS.schrift)),variante:1+Math.floor(Math.random()*3),zitat:"",aufkleber:[]};
}

const CSS=`
.a4.styled{border:none;outline:none;background:transparent;font-family:var(--f-body)}
.a4.styled>*{position:relative;z-index:2}
.a4.styled>.st-bg{position:absolute;inset:0;z-index:0}
.a4.styled>.st-bg svg{display:block}
.a4.styled>.st-frame{position:absolute;inset:0;z-index:1;pointer-events:none}
.a4.styled>.deco{position:absolute;z-index:3}
.a4.styled.st-fr-wimpel{padding-top:104px}
.a4.styled.st-fr-wimpel>.deco.top{top:110px!important}
.a4.styled.st-fr-band,.a4.styled.st-fr-kreise{padding:66px 68px}
.styled .pf-title{font-family:var(--f-title);color:var(--c1);align-self:center;max-width:100%;box-sizing:border-box}
.styled .st-t-banner span{display:inline-block;background:var(--c1);color:#fff;padding:10px 64px 14px;clip-path:polygon(0 0,100% 0,94% 50%,100% 100%,0 100%,6% 50%)}
.styled .st-t-schild span{display:inline-block;background:var(--c2);color:#fff;padding:10px 34px 14px;border-radius:999px;transform:rotate(-2deg);box-shadow:0 5px 0 var(--c1)}
.styled .st-t-wolke span{display:inline-block;background:#fff;border:5px solid var(--c1);padding:12px 40px 16px;border-radius:60px 70px 55px 75px / 50px 45px 60px 50px}
.styled .st-t-welle span{display:inline-block;padding-bottom:16px;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='14'%3E%3Cpath d='M0 7 Q10 0 20 7 T40 7' fill='none' stroke='%23999' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E") repeat-x bottom/40px 14px}
.styled .st-t-welle span{background-color:transparent}
.styled .pf-foot{background:rgba(255,255,255,.85);border-radius:12px;padding:8px 14px;border-top:none}
.styled .pf-photo{overflow:visible;background:#E6EAEE;box-sizing:border-box}
.styled .pf-photo img{border-radius:inherit}
.st-foto-polaroid .pf-photo{background:#fff;padding:12px 12px 44px;border-radius:4px;box-shadow:0 6px 16px rgba(0,0,0,.18);transform:rotate(-2deg)}
.st-foto-polaroid .pf-photo:nth-of-type(2n),.st-foto-polaroid figure:nth-of-type(2n) .pf-photo{transform:rotate(2.5deg)}
.st-foto-polaroid .pf-photo img,.st-foto-polaroid .pf-photo>span{border-radius:2px}
.st-foto-polaroid .pf-photo>span{background:#E6EAEE;width:100%;height:100%;display:flex;align-items:center;justify-content:center}
.st-foto-klebeband .pf-photo{border-radius:6px;border:8px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.15)}
.st-foto-klebeband .pf-photo::before,.st-foto-klebeband .pf-photo::after{content:"";position:absolute;width:96px;height:28px;background:var(--c2);opacity:.75;z-index:2}
.st-foto-klebeband .pf-photo::before{top:-14px;left:-26px;transform:rotate(-35deg)}
.st-foto-klebeband .pf-photo::after{bottom:-14px;right:-26px;transform:rotate(-35deg)}
.st-foto-klebeband .pf-photo{position:relative}
.st-foto-oval .pf-photo{border-radius:50%;border:7px solid var(--c2)}
.st-foto-blob .pf-photo{border-radius:42% 58% 63% 37% / 41% 44% 56% 59%;border:7px solid var(--c3)}
.st-foto-rahmen .pf-photo{border-radius:22px;border:9px solid var(--c1);box-shadow:0 0 0 5px #fff,0 0 0 9px var(--c2)}
.styled .st-box{font-family:var(--f-text);box-sizing:border-box}
.st-text-schlicht:not(.st-bg-weiss) .st-box{background:rgba(255,255,255,.88);border-radius:18px;padding:18px 22px}
.st-text-zettel .st-box{background:#fff repeating-linear-gradient(#fff 0 31px,#D5E3F0 31px 33px);background-position:0 14px;padding:16px 24px;border-radius:4px;box-shadow:0 6px 16px rgba(0,0,0,.14);transform:rotate(-.8deg);position:relative}
.st-text-zettel .st-box::before{content:"";position:absolute;top:-14px;left:calc(50% - 50px);width:100px;height:28px;background:var(--c2);opacity:.7;transform:rotate(2deg)}
.st-text-sprechblase .st-box{background:#fff;border:4px solid var(--c1);border-radius:30px;padding:20px 26px;position:relative;margin-top:14px}
.st-text-sprechblase .st-box::after{content:"";position:absolute;top:-24px;left:70px;border:12px solid transparent;border-bottom:14px solid var(--c1)}
.st-text-karte .st-box{background:var(--paper-warm);border-radius:26px;padding:22px 28px;box-shadow:inset 0 0 0 3px #fff,0 0 0 3px var(--c2)}
.st-text-tafel .st-box{background:#2F4A3A;color:#F4F1E8;border:12px solid #A0703C;border-radius:14px;padding:20px 26px}
.st-text-tafel .st-box dt{color:#CFE0D3}
.st-text-tafel .pf-stars li::before{color:var(--c2)}
.styled .pf-letter.st-box{flex:1}
.styled .pf-zitat{align-self:center;max-width:80%;background:#fff;border:4px solid var(--c2);border-radius:28px;padding:12px 26px;font-family:var(--f-title);font-size:26px;color:var(--c1);position:relative;text-align:center}
.styled .pf-zitat::after{content:"";position:absolute;bottom:-26px;left:40px;border:13px solid transparent;border-top:15px solid var(--c2)}
.styled .pf-stars li::before{color:var(--c2)}
.styled .pf-ich dt{color:var(--c1)}
.pf-lern.v2 .pf-grid.lern{grid-template-columns:1fr 2fr}.pf-lern.v2 .pf-grid.lern .big{grid-column:2;grid-row:1/3}
.pf-lern.v3 .pf-grid.lern{grid-template-columns:1fr 1fr 1fr;grid-template-rows:1fr;height:250px}.pf-lern.v3 .pf-grid.lern .big{grid-row:auto}
.pf-kann .pf-kann-row{display:flex;flex-direction:column;gap:22px}
.pf-kann-row>.pf-photo{flex:none}.pf-kann-row>.pf-stars{flex:1 1 auto;min-width:0}
.styled .pf-grid>*,.styled figure{min-width:0;min-height:0}
.styled .pf-photo{min-width:0;min-height:0}.styled .pf-photo img{min-width:0;min-height:0;max-width:100%}
.pf-kann.v2 .pf-kann-row{flex-direction:row;align-items:flex-start}.pf-kann.v2 .pf-photo.wide{width:300px;flex:none;aspect-ratio:3/4}
.pf-kann.v3 .pf-kann-row>.pf-photo{order:2}
.pf-foto.v2 .pf-grid.four{grid-template-columns:1fr 1fr 1fr}.pf-foto.v2 .pf-grid.four figure:first-child{grid-column:1/4}.pf-foto.v2 .pf-grid.four figure:first-child .pf-photo{aspect-ratio:16/8}
.pf-foto.v3 .pf-grid.four{gap:26px 30px}.pf-foto.v3 figure:nth-child(1){transform:rotate(-3deg)}.pf-foto.v3 figure:nth-child(2){transform:rotate(2deg) translateY(16px)}.pf-foto.v3 figure:nth-child(3){transform:rotate(2.5deg)}.pf-foto.v3 figure:nth-child(4){transform:rotate(-2deg) translateY(12px)}
.a4.pf.pf-ich{align-items:stretch}
.styled .pf-ich dl{font-size:26px;gap:24px}.styled .pf-ich .pf-photo.round{width:340px}
.pf-ich.v2 .pf-ich{flex-direction:row;align-items:flex-start}.pf-ich.v2 .pf-ich .pf-photo.round{width:270px}
.styled .pf-grid{margin-bottom:8px}.st-text-zettel .st-box{margin-top:12px}
`;
const el=document.createElement("style");el.textContent=CSS;document.head.appendChild(el);
const f=document.createElement("link");f.rel="stylesheet";f.href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Gochi+Hand&family=Patrick+Hand&display=swap";document.head.appendChild(f);

window.STIL={PALETTES,OPTS,VARIANTEN,norm,colors,bgHTML,frameHTML,titleHTML,stickersHTML,classes,vars,random};
})();

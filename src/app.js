/* ================= Utils ================= */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const rnd=(a,b)=>a+Math.random()*(b-a), ri=(a,b)=>Math.floor(rnd(a,b+1)), pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const fr=(n,d=1)=>(Math.round(n*Math.pow(10,d))/Math.pow(10,d)).toFixed(d).replace('.',',').replace('-','−');
const frs=n=>Number.isInteger(n)?String(n):fr(n,(Math.round(n*100)%10)?2:1);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const mk=s=>esc(s).replace(/\[\[(.+?)\]\]/g,'<mark>$1</mark>');
const plain=s=>String(s).replace(/\[\[|\]\]/g,'');
/* [[término]] = palabra clave resaltada (sustituye al antiguo «término» en francés dentro del español) */
const hl=s=>esc(s).replace(/\[\[(.+?)\]\]/g,'<span class="frw">$1</span>');
const unmark=s=>String(s).replace(/\[\[|\]\]|\*\*/g,'');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const RM=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const TOUCH=!!(window.matchMedia&&matchMedia('(pointer: coarse)').matches);
const num=s=>{const v=parseFloat(String(s).trim().replace(',','.').replace('−','-'));return isNaN(v)?null:v};
const NS='http://www.w3.org/2000/svg';
const fmtN=n=>Math.floor(n).toLocaleString(L==='es'?'es-ES':'fr-FR');
const fmtBig=n=>n>=1e9?fr(n/1e9,2)+' G':n>=1e6?fr(n/1e6,2)+' M':n>=1e5?fr(n/1e3,0)+' k':fmtN(n);
const fmtTime=s=>{s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?`${h} h ${String(m).padStart(2,'0')}`:m?`${m} min`:`${s} s`};
const dayStr=d=>{d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};

/* ================= Store ================= */
const KEY='chrono-ohm-v1';
const DEF={name:'',xp:0,cr:0,introSeen:false,ch:{},seenTravel:{},notes:{},skills:{},ach:{},
  settings:{diff:'cadet',narr:true,music:true,sfx:true,lang:'',alt:false},
  stats:{answered:0,correct:0,time:0,bestStreak:0,burns:0,shorts:0,labs:0,hist:[]},days:[],v:2,
  lumiSkin:'cuivre',skins:{cuivre:1},shop:{gen:1,own:{},on:{},quiz:{},seen:0,v:2,ln:{},fu:{A:10,B:16,C:25},t:0,pend:{h:0,prod:0,kwh:0},earned:0},pz:{},rev:{days:[],n:0}};
const clone=o=>JSON.parse(JSON.stringify(o));
function merge(d,s){if(s===undefined||s===null)return clone(d);if(d===null||typeof d!=='object'||Array.isArray(d))return s;if(typeof s!=='object'||Array.isArray(s))return clone(d);
  const o=clone(d);for(const k in s){o[k]=(k in d)?merge(d[k],s[k]):s[k]}return o}
function load(){try{const r=localStorage.getItem(KEY);if(r){const raw=JSON.parse(r);const s=merge(DEF,raw);
    /* partidas de la v1.1 (solo francés + traducción al español): pasan a francés con ayuda en español */
    if(raw.settings&&raw.settings.es!==undefined&&!raw.settings.lang){s.settings.lang='fr';s.settings.alt=!!raw.settings.es}
    /* v1.4: el taller pasa de 12 V a 24 V → las potencias cambian: se vuelven a calcular y todo empieza apagado en la línea A */
    if(raw.shop&&!raw.shop.v){s.shop.quiz={};s.shop.on={};s.shop.v=2}
    delete s.settings.es;s.v=2;return s}}catch(e){}return clone(DEF)}
let S=load();
/* guardado en el aparato: cada cambio importante se escribe al momento; STORE_OK avisa si el navegador no deja guardar (modo privado) */
let STORE_OK=true,LAST_SAVE=0;
function save(){try{S.savedAt=Date.now();localStorage.setItem(KEY,JSON.stringify(S));STORE_OK=true;LAST_SAVE=S.savedAt}catch(e){STORE_OK=false}}
(function(){try{const k='__co_t';localStorage.setItem(k,'1');localStorage.removeItem(k)}catch(e){STORE_OK=false}})();
/* pide al navegador que no borre los datos por su cuenta (Chrome, Edge, Firefox; Safari lo decide él) */
function askPersist(){try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{})}catch(e){}}
addEventListener('pagehide',()=>save());document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save()});

/* ---------- copia de seguridad: un código de texto que se copia y se pega en otro aparato ---------- */
const B64=(u8)=>{let s='';u8.forEach(b=>s+=String.fromCharCode(b));return btoa(s)};
const UNB64=(t)=>Uint8Array.from(atob(t),c=>c.charCodeAt(0));
async function zip(str,inflate){const CS=inflate?window.DecompressionStream:window.CompressionStream;if(!CS)return null;
  const st=new Blob([str]).stream().pipeThrough(new CS('deflate-raw'));return new Uint8Array(await new Response(st).arrayBuffer())}
async function saveCode(){const json=JSON.stringify(S);let body,tag;try{const z=await zip(new TextEncoder().encode(json));if(z){body=B64(z);tag='Z'}}catch(e){}
  if(!body){body=B64(new TextEncoder().encode(json));tag='P'}
  let sum=0;for(const ch of body)sum=(sum*31+ch.charCodeAt(0))>>>0;return `CHRONO1${tag}-${(sum%46656).toString(36).padStart(3,'0')}-${body}`}
async function readCode(code){const m=String(code).trim().replace(/\s+/g,'').match(/^CHRONO1([ZP])-([0-9a-z]{3})-([A-Za-z0-9+/=]+)$/);if(!m)throw new Error('format');
  let sum=0;for(const ch of m[3])sum=(sum*31+ch.charCodeAt(0))>>>0;if((sum%46656).toString(36).padStart(3,'0')!==m[2])throw new Error('sum');
  const raw=UNB64(m[3]);const bytes=m[1]==='Z'?await zip(raw,true):raw;if(!bytes)throw new Error('zip');const o=JSON.parse(new TextDecoder().decode(bytes));
  if(!o||typeof o!=='object'||!o.settings)throw new Error('data');return o}
const diffLvl=()=>({cadet:0,ingenieur:1,commandant:2})[S.settings.diff]||0;
/* grados con nombres epicenos (valen igual para chicas y chicos): [xp, clave de texto, icono] */
const RANKS=[[0,'rank.0','bolt'],[200,'rank.1','gear'],[500,'rank.2','meter'],[900,'rank.3','book'],[1500,'rank.4','star'],[2400,'rank.5','clock']];
const rankName=r=>ui(r[1]);
const playerName=()=>S.name||'Alex';
/* la voz nunca pronuncia el nombre del jugador: así no sale del aparato (algunas voces del navegador funcionan en la nube)
   y las frases se pueden pregrabar. {N} solo aparece como vocativo («{N}, …» o «…, {N} ?»). */
const dropName=s=>String(s).replace(/(^|[.!?…][\s\u00a0]+)\{N\},\s*/g,'$1').replace(/,\s*\{N\}([\s\u00a0\u202f]*[:?!.…]|$)/g,'$1');

/* ================= Languages ================= */
const VERSION='1.4';
const LANGS={fr:'Français',es:'Español'};
const MISS=new Set();
const detectLang=()=>{try{return /^es\b/i.test(navigator.language||'')?'es':'fr'}catch(e){return 'fr'}};
let L=LANGS[S.settings.lang]?S.settings.lang:detectLang();
const other=()=>L==='fr'?'es':'fr';
const fill=(s,v)=>s.replace(/\{(\w+)\}/g,(m,n)=>v&&n in v?v[n]:m);
/* contenido: la clave es el texto original del juego */
const tx=(fr,es)=>({fr,es});
const frTypo=s=>String(s).replace(/ ([:;!?»])/g,'\u00a0$1').replace(/« /g,'«\u00a0');
function T(s){if(s==null||s==='')return '';if(typeof s==='object'){const v=s[L]!=null?s[L]:s.fr;return L==='fr'?frTypo(v):v}const e=I18N.c[s];if(e&&e[L]!=null)return e[L];if(/[A-Za-zÀ-ÿ]{3}/.test(s))MISS.add(s);return s}
function TO(s){if(s&&typeof s==='object'){const o=other(),v=s[o]||'';return o==='fr'?frTypo(v):v}const e=I18N.c[s];return e&&e[other()]!=null?e[other()]:''}
/* interfaz: la clave es un identificador */
function ui(k,v){const e=I18N.u[k];let s=e&&e[L]!=null?e[L]:(MISS.add('ui:'+k),k);return v?fill(s,v):s}
/* plural: en francés 0 y 1 van en singular; en español solo 1 */
const uiN=(k,n,v)=>ui(k+((L==='fr'?Math.abs(n)<2:n===1)?'.1':'.n'),Object.assign({n},v||{}));
function uiO(k,v){const e=I18N.u[k];const s=e&&e[other()]||'';return v?fill(s,v):s}
/* línea opcional en el otro idioma (ajuste «ayuda en el otro idioma») */
const altC=(s,cls)=>{if(!S.settings.alt)return '';const o=TO(s);return o&&o!==T(s)?`<span class="${cls||'es'}" lang="${other()}">${hl(o)}</span>`:''};
const altU=(k,cls,v)=>{if(!S.settings.alt)return '';const o=uiO(k,v);return o&&o!==ui(k,v)?`<span class="${cls||'es'}" lang="${other()}">${esc(o)}</span>`:''};
function applyStatic(){document.documentElement.lang=L;$$('[data-t]').forEach(el=>{el.textContent=ui(el.dataset.t)});$$('[data-ta]').forEach(el=>el.setAttribute('aria-label',ui(el.dataset.ta)));$$('[data-tp]').forEach(el=>el.setAttribute('placeholder',ui(el.dataset.tp)))}
function setLang(l){if(!LANGS[l])return;L=l;S.settings.lang=l;save();VO.stop();applyStatic()}
function rankOf(xp){let i=0;RANKS.forEach((r,k)=>{if(xp>=r[0])i=k});return {i,r:RANKS[i],nx:RANKS[i+1]||null}}
function markDay(){const t=dayStr();if(!S.days.includes(t)){S.days.push(t);S.days=S.days.slice(-90);save()}}
function dayStreak(){const set=new Set(S.days);let d=new Date();if(!set.has(dayStr(d)))d.setDate(d.getDate()-1);let n=0;while(set.has(dayStr(d))){n++;d.setDate(d.getDate()-1)}return n}

/* ================= Audio ================= */
const AU={ctx:null,
  init(){
    if(this.ctx){if(this.ctx.state==='suspended')this.ctx.resume();return}
    try{
      const C=window.AudioContext||window.webkitAudioContext;this.ctx=new C();const c=this.ctx;
      this.master=c.createGain();this.master.gain.value=.9;this.master.connect(c.destination);
      this.music=c.createGain();this.music.gain.value=S.settings.music?.55:0;this.music.connect(this.master);
      this.sfx=c.createGain();this.sfx.gain.value=S.settings.sfx?.6:0;this.sfx.connect(this.master);
      this.delay=c.createDelay(1);this.delay.delayTime.value=.42;this.fb=c.createGain();this.fb.gain.value=.38;
      this.delay.connect(this.fb);this.fb.connect(this.delay);this.delay.connect(this.music);
    }catch(e){this.ctx=null}
  },
  tone(o){if(!this.ctx)return;const c=this.ctx,t=c.currentTime+(o.t||0),d=o.dur||.2;const osc=c.createOscillator(),g=c.createGain();
    osc.type=o.type||'sine';osc.frequency.setValueAtTime(o.f,t);if(o.to)osc.frequency.exponentialRampToValueAtTime(o.to,t+d);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(o.vol||.2,t+(o.a||.012));g.gain.exponentialRampToValueAtTime(.0001,t+d);
    osc.connect(g);g.connect(o.dest||this.sfx);if(o.echo)g.connect(this.delay);osc.start(t);osc.stop(t+d+.05)},
  noise(o){if(!this.ctx)return;const c=this.ctx,t=c.currentTime+(o.t||0),d=o.dur||.3;const n=Math.floor(c.sampleRate*d);const b=c.createBuffer(1,n,c.sampleRate);const ch=b.getChannelData(0);for(let i=0;i<n;i++)ch[i]=Math.random()*2-1;
    const s=c.createBufferSource();s.buffer=b;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.setValueAtTime(o.freq||1500,t);if(o.to)f.frequency.exponentialRampToValueAtTime(o.to,t+d);f.Q.value=o.q||1;const g=c.createGain();
    g.gain.setValueAtTime(o.vol||.2,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f);f.connect(g);g.connect(this.sfx);s.start(t);s.stop(t+d)},
  play(n,arg){if(S.settings.sfx&&TOUCH&&navigator.vibrate&&({bad:1,hit:1,boom:1,smallboom:1})[n]){try{navigator.vibrate(n==='bad'?25:60)}catch(e){}}if(!this.ctx||!S.settings.sfx)return;
    switch(n){
      case 'click':this.tone({f:820,dur:.05,type:'square',vol:.05});break;
      case 'select':this.tone({f:600,dur:.06,type:'triangle',vol:.08});break;
      case 'type':this.tone({f:1500+Math.random()*400,dur:.025,type:'square',vol:.018});break;
      case 'ok':[660,880,1320].forEach((f,i)=>this.tone({f,t:i*.08,dur:.28,type:'triangle',vol:.16,echo:true}));break;
      case 'bad':this.tone({f:200,to:80,dur:.38,type:'sawtooth',vol:.12});this.noise({dur:.25,vol:.08,freq:400});break;
      case 'power':this.tone({f:80,to:640,dur:1.4,type:'sawtooth',vol:.09});[261.6,329.6,392,523.3].forEach((f,i)=>this.tone({f,t:1.1+i*.06,dur:1.8,type:'triangle',vol:.11,a:.05,echo:true}));break;
      case 'alarm':for(let i=0;i<4;i++){this.tone({f:880,t:i*.5,dur:.24,type:'square',vol:.07});this.tone({f:660,t:i*.5+.25,dur:.24,type:'square',vol:.07})}break;
      case 'zap':this.noise({dur:.35,vol:.25,freq:3200,q:.7});this.tone({f:1200,to:60,dur:.3,type:'sawtooth',vol:.1});break;
      case 'plug':this.tone({f:300,dur:.06,type:'square',vol:.07});this.tone({f:520,t:.05,dur:.07,type:'square',vol:.05});break;
      case 'unlock':[523.3,659.3,784,1046.5,1318.5].forEach((f,i)=>this.tone({f,t:i*.07,dur:.5,type:'triangle',vol:.12,echo:true}));break;
      case 'tick':this.tone({f:1000,dur:.03,type:'square',vol:.03});break;
      case 'coin':this.tone({f:988,dur:.08,type:'square',vol:.05});this.tone({f:1319,t:.07,dur:.22,type:'square',vol:.05});break;
      case 'orb':this.tone({f:1200+(arg||0)*80,dur:.07,type:'sine',vol:.06});break;
      case 'combo':{const k=Math.min(arg||3,10);for(let i=0;i<4;i++)this.tone({f:440*Math.pow(2,(k+i*2)/12),t:i*.06,dur:.25,type:'triangle',vol:.12,echo:true});break}
      case 'levelup':[392,523.3,659.3,784,1046.5].forEach((f,i)=>this.tone({f,t:i*.11,dur:.6,type:'sawtooth',vol:.06,echo:true}));[1046.5,1318.5,1568].forEach((f,i)=>this.tone({f,t:.6+i*.02,dur:1.4,type:'triangle',vol:.1,echo:true}));break;
      case 'ach':[784,988,1175,1568].forEach((f,i)=>this.tone({f,t:i*.09,dur:.6,type:'sine',vol:.13,echo:true}));break;
      case 'laser':this.tone({f:1500,to:300,dur:.12,type:'square',vol:.035});break;
      case 'boom':this.noise({dur:.6,vol:.35,freq:500,to:80,q:.6});this.tone({f:110,to:35,dur:.5,type:'sine',vol:.3});break;
      case 'smallboom':this.noise({dur:.25,vol:.18,freq:900,to:200,q:.7});break;
      case 'whoosh':this.noise({dur:.5,vol:.15,freq:300,to:2400,q:1.5});break;
      case 'hit':this.noise({dur:.3,vol:.25,freq:220,q:.8});this.tone({f:140,to:60,dur:.3,type:'square',vol:.1});break;
      case 'buy':this.tone({f:700,dur:.06,type:'square',vol:.06});this.tone({f:1050,t:.06,dur:.12,type:'square',vol:.06});this.tone({f:1400,t:.13,dur:.25,type:'triangle',vol:.1,echo:true});break;
      case 'build':for(let i=0;i<6;i++)this.noise({t:i*.09,dur:.06,vol:.1,freq:1800+i*200,q:3});this.tone({f:220,to:880,t:.5,dur:.5,type:'triangle',vol:.12,echo:true});break;
    }},
  startMusic(){if(!this.ctx||this.mus)return;const c=this.ctx;const m={};this.mus=m;
    const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=260;lp.Q.value=4;const dg=c.createGain();dg.gain.value=.13;lp.connect(dg);dg.connect(this.music);
    m.osc=[55,55.35,82.4].map((f,i)=>{const o=c.createOscillator();o.type=i<2?'sawtooth':'triangle';o.frequency.value=f;o.connect(lp);o.start();return o});
    const lfo=c.createOscillator();lfo.frequency.value=.06;const lg=c.createGain();lg.gain.value=140;lfo.connect(lg);lg.connect(lp.frequency);lfo.start();m.osc.push(lfo);
    const chords=[[220,261.6,329.6],[196,246.9,293.7],[174.6,220,261.6],[196,246.9,329.6]];let ci=0;
    const pad=()=>{const ch=chords[ci++%chords.length];const t=c.currentTime;ch.forEach(f=>{const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.028,t+3);g.gain.linearRampToValueAtTime(.0001,t+9);o.connect(g);g.connect(this.music);o.start(t);o.stop(t+9.2)})};
    pad();m.pad=setInterval(pad,8000);
    const scale=[880,987.8,1174.7,1318.5,1568,1760];
    const ping=()=>{this.tone({f:pick(scale),dur:.9,vol:.04,dest:this.music,echo:true,a:.01});m.ping=setTimeout(ping,(this.tense?900:2400)+Math.random()*2600)};m.ping=setTimeout(ping,1500)},
  setMusic(on){S.settings.music=on;if(this.music)this.music.gain.setTargetAtTime(on?.55:0,this.ctx.currentTime,.3);if(on)this.startMusic()},
  setSfx(on){S.settings.sfx=on;if(this.sfx)this.sfx.gain.value=on?.6:0}
};

/* ================= Voice ================= */
const VO={ok:'speechSynthesis' in window,voices:[],
  load(){if(!this.ok)return;try{this.voices=speechSynthesis.getVoices();speechSynthesis.onvoiceschanged=()=>{this.voices=speechSynthesis.getVoices()}}catch(e){this.ok=false}},
  /* la mejor voz instalada para el idioma: primero las «naturales/neural», luego la variante de Francia o España */
  v(l){const pref=l==='fr'?/fr[-_]fr/i:/es[-_]es/i;const sc=v=>(/natural|neural|online|premium|enhanced/i.test(v.name)?10:0)+(pref.test(v.lang)?4:0)+(/google/i.test(v.name)?2:0)+(/microsoft/i.test(v.name)?1:0);
    return this.voices.filter(v=>v.lang&&v.lang.toLowerCase().replace('_','-').startsWith(l)).sort((a,b)=>sc(b)-sc(a))[0]},
  has(l){return !!this.v(l||L)},
  stop(){if(this.ok)try{speechSynthesis.cancel()}catch(e){}},
  /* texto pensado para leer en voz alta: sin marcas, con símbolos y unidades dichos con palabras */
  prep(t,l){t=unmark(String(t).replace(/<[^>]+>/g,'')).replace(/[«»]/g,'').replace(/\b([UIR])(\d)\b/g,'$1 $2');
    const W=l==='fr'?{eq:' égale ',mi:' moins ',pl:' plus ',ti:' fois ',di:' divisé par ',dec:' virgule ',mA:' milliampères',A:' ampères',V:' volts',O:' ohms',kO:' kilo-ohms',W:' watts',mW:' milliwatts'}
      :{eq:' igual a ',mi:' menos ',pl:' más ',ti:' por ',di:' entre ',dec:' coma ',mA:' miliamperios',A:' amperios',V:' voltios',O:' ohmios',kO:' kiloohmios',W:' vatios',mW:' milivatios'};
    return t.replace(/ = /g,W.eq).replace(/ − /g,W.mi).replace(/ \+ /g,W.pl).replace(/ × /g,W.ti).replace(/ ÷ /g,W.di)
      .replace(/(\d) ?mA\b/g,'$1'+W.mA).replace(/(\d) ?kΩ/g,'$1'+W.kO).replace(/(\d) ?Ω/g,'$1'+W.O).replace(/(\d) ?mW\b/g,'$1'+W.mW).replace(/(\d) ?A\b/g,'$1'+W.A).replace(/(\d) ?V\b/g,'$1'+W.V).replace(/(\d) ?W\b/g,'$1'+W.W)
      .replace(/\bmA\b/g,W.mA.trim()).replace(/ · /g,', ').replace(/(\d),(\d)/g,'$1'+W.dec+'$2').replace(/(\d)[\u00a0\u202f ](\d{3})\b/g,'$1$2').replace(/[\u00a0\u202f]/g,' ')},
  say(text,force){return new Promise(res=>{
    if(!this.ok||(!force&&!S.settings.narr)){res();return}
    this.stop();const p=this.prep(text,L).trim();if(!p||!/[\p{L}\d]/u.test(p)){res();return}
    let done=false;const fin=()=>{if(!done){done=true;res()}};
    try{const u=new SpeechSynthesisUtterance(p);u.lang=L==='fr'?'fr-FR':'es-ES';const vv=this.v(L);if(vv)u.voice=vv;u.rate=L==='fr'?.97:1.02;
      u.onend=fin;u.onerror=fin;setTimeout(fin,p.length*95+1500);speechSynthesis.speak(u)}catch(e){fin()}})}
};

/* ================= Time-vortex background ================= */
const STAR={speed:.25,warp:0,paused:false,tint:0};
(function(){const cv=$('#stars'),cx=cv.getContext('2d');let W,H,st=[];const dpr=Math.min(2,window.devicePixelRatio||1);
  function rs(){W=cv.width=innerWidth*dpr;H=cv.height=innerHeight*dpr;st=Array.from({length:Math.round(innerWidth*innerHeight/3800)},()=>({a:Math.random()*6.283,r:Math.random(),z:Math.random()*.9+.1}))}
  rs();addEventListener('resize',rs);let t=0;
  function fr_(){if(!STAR.paused){t+=.016;cx.clearRect(0,0,W,H);const cxm=W/2,cym=H/2,R=Math.hypot(W,H)/2;const sp=(STAR.speed+STAR.warp)*(RM?0:1);
    for(const s of st){s.a+=.0016*sp*(1.5-s.r);s.r+=.0009*sp*(.3+s.r)*(STAR.warp>1?6:1);if(s.r>1){s.r=.02;s.a=Math.random()*6.283}
      const rr=s.r*s.r*R,x=cxm+Math.cos(s.a)*rr,y=cym+Math.sin(s.a)*rr*.62;const al=Math.min(1,s.r*1.6)*(.25+s.z*.6);
      cx.fillStyle=s.z>.75?`rgba(242,166,90,${al})`:`rgba(150,225,255,${al})`;const sz=Math.max(1,s.z*2.2*dpr*(.4+s.r));
      if(STAR.warp>1){cx.strokeStyle=cx.fillStyle;cx.lineWidth=sz;cx.beginPath();cx.moveTo(x,y);cx.lineTo(cxm+Math.cos(s.a-.05)*rr*.9,cym+Math.sin(s.a-.05)*rr*.9*.62);cx.stroke()}else cx.fillRect(x,y,sz,sz)}}
    requestAnimationFrame(fr_)}
  requestAnimationFrame(fr_)})();

/* ================= FX particles ================= */
const FX={ps:[],ob:[],C:{},
  init(){const cv=document.createElement('canvas');cv.id='fx';cv.setAttribute('aria-hidden','true');document.body.append(cv);this.cv=cv;this.cx=cv.getContext('2d');
    const rs=()=>{this.dpr=Math.min(2,window.devicePixelRatio||1);cv.width=innerWidth*this.dpr;cv.height=innerHeight*this.dpr};rs();addEventListener('resize',rs);
    const cs=getComputedStyle(document.documentElement),g=k=>cs.getPropertyValue(k).trim();
    this.C={volt:g('--volt')||'#ffc53d',signal:g('--signal')||'#6fd6e6',ok:g('--ok')||'#45d38b',bad:g('--bad')||'#ff6166',mid:g('--mid')||'#ff9f43',white:'#fff6d8'};
    this.last=performance.now();requestAnimationFrame(t=>this.loop(t))},
  center(el){const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}},
  burst(x,y,o){o=o||{};if(RM)return;const n=o.n||22;for(let i=0;i<n;i++){const a=o.dir!=null?o.dir+rnd(-o.spread,o.spread):Math.random()*Math.PI*2,s=(o.speed||5)*(.35+Math.random());
    this.ps.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-(o.up||0),g:o.grav==null?.12:o.grav,life:0,max:(o.life||.8)*(.6+Math.random()*.6),c:pick(o.colors||[this.C.volt,this.C.white]),sz:(o.size||3)*(.5+Math.random()),t:o.type||'spark',rot:Math.random()*6,vr:rnd(-.3,.3)})}},
  burstEl(el,o){if(!el)return;const c=this.center(el);this.burst(c.x,c.y,o)},
  confetti(n){if(RM)return;n=n||140;const cols=[this.C.volt,this.C.signal,this.C.ok,this.C.mid,'#ffffff'];for(let i=0;i<n;i++)this.ps.push({x:rnd(0,innerWidth),y:rnd(-200,-10),vx:rnd(-1.5,1.5),vy:rnd(2,5),g:.05,life:0,max:rnd(2.2,3.6),c:pick(cols),sz:rnd(5,9),t:'conf',rot:Math.random()*6,vr:rnd(-.25,.25)})},
  orbs(from,to,n,o){o=o||{};if(!from||!to||RM||n<1){o.done&&o.done();return}const a=this.center(from),b=this.center(to);
    for(let i=0;i<n;i++){const sx=a.x+rnd(-24,24),sy=a.y+rnd(-14,14);this.ob.push({sx,sy,cx:sx+rnd(-160,160),cy:Math.min(sy,b.y)-rnd(60,180),ex:b.x,ey:b.y,t:-i*.07,dur:rnd(.6,.85),c:o.color||this.C.volt,last:i===n-1,o,to,i})}},
  loop(now){const dt=Math.min(.05,(now-this.last)/1000);this.last=now;const cx=this.cx,d=this.dpr;
    if(this.ps.length||this.ob.length){cx.clearRect(0,0,this.cv.width,this.cv.height);this.dirty=true}else if(this.dirty){cx.clearRect(0,0,this.cv.width,this.cv.height);this.dirty=false}
    cx.globalCompositeOperation='lighter';
    this.ps=this.ps.filter(p=>{p.life+=dt;if(p.life>p.max)return false;p.vy+=p.g;p.vx*=.985;p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;const k=1-p.life/p.max;
      if(p.t==='conf'){cx.globalCompositeOperation='source-over';cx.save();cx.translate(p.x*d,p.y*d);cx.rotate(p.rot);cx.globalAlpha=Math.min(1,k*2);cx.fillStyle=p.c;cx.fillRect(-p.sz*d/2,-p.sz*d/4,p.sz*d,p.sz*d/2);cx.restore();cx.globalCompositeOperation='lighter'}
      else if(p.t==='line'){cx.strokeStyle=p.c;cx.globalAlpha=k;cx.lineWidth=p.sz*d*.6;cx.beginPath();cx.moveTo(p.x*d,p.y*d);cx.lineTo((p.x-p.vx*3)*d,(p.y-p.vy*3)*d);cx.stroke()}
      else{cx.globalAlpha=k;cx.fillStyle=p.c;cx.beginPath();cx.arc(p.x*d,p.y*d,Math.max(.5,p.sz*k)*d,0,6.283);cx.fill()}
      return true});
    this.ob=this.ob.filter(o=>{o.t+=dt;if(o.t<0)return true;const u=Math.min(1,o.t/o.dur),e=u*u*(3-2*u),iu=1-e;
      const x=iu*iu*o.sx+2*iu*e*o.cx+e*e*o.ex,y=iu*iu*o.sy+2*iu*e*o.cy+e*e*o.ey;
      cx.globalAlpha=1;const gr=cx.createRadialGradient(x*d,y*d,0,x*d,y*d,9*d);gr.addColorStop(0,'#fff');gr.addColorStop(.35,o.c);gr.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=gr;cx.beginPath();cx.arc(x*d,y*d,9*d,0,6.283);cx.fill();
      if(u>=1){AU.play('orb',o.i);if(o.o.each)o.o.each(o.i);if(o.to){o.to.classList.remove('bump');void o.to.offsetWidth;o.to.classList.add('bump')}if(o.last&&o.o.done)o.o.done();this.burst(o.ex,o.ey,{n:5,speed:2,life:.4,colors:[o.c]});return false}return true});
    cx.globalAlpha=1;cx.globalCompositeOperation='source-over';
    requestAnimationFrame(t=>this.loop(t))}
};

/* ================= Small UI helpers ================= */
let toastT;function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,2600)}
function fx(html,cls){const d=document.createElement('div');d.className='overlay-fx '+(cls||'');d.innerHTML=`<div>${html}</div>`;document.body.append(d);setTimeout(()=>d.remove(),cls==='long'?3000:1900)}
function comboPop(t){if(RM)return;const d=document.createElement('div');d.className='combo-pop';d.innerHTML=`<div>${t}</div>`;document.body.append(d);setTimeout(()=>d.remove(),1050)}
function hitFlash(){const r=$('#redflash');r.classList.remove('hit','on');void r.offsetWidth;r.classList.add('hit')}
function shakeEl(el){if(!el||RM)return;el.classList.remove('hit');void el.offsetWidth;el.classList.add('hit')}
function starsHTML(n,tot){let s='';for(let i=0;i<(tot||3);i++)s+=`<svg viewBox="0 0 24 24" aria-hidden="true"><path class="${i<n?'star-on':'star-off'}" d="${GLYPH.star}"/></svg>`;return `<span class="stars" role="img" aria-label="${esc(ui('stars.aria',{n}))}">${s}</span>`}

/* ================= Icons & emblems ================= */
const GLYPH={
  bolt:'M13 2L4 14h6l-1 8 9-12h-6z',
  star:'M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z',
  shield:'M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5z',
  meter:'M12 4a9 9 0 0 0-9 9v2h4v-2a5 5 0 0 1 10 0v2h4v-2a9 9 0 0 0-9-9zm4.2 3.4l-4 5.2a1.6 1.6 0 1 0 1.5 1l2.9-5.8z',
  bulb:'M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2zM9 18.5h6V21H9z',
  rocket:'M12 1.5c3.2 2.2 5 6.3 5 10.5l2.5 3.5-3.5 1.2-1 2.8H9l-1-2.8-3.5-1.2L7 12c0-4.2 1.8-8.3 5-10.5zM12 7a2.2 2.2 0 1 0 0 4.4A2.2 2.2 0 0 0 12 7zM10 20.5h4l-2 3z',
  target:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zm0 3.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  flame:'M12 1.5c1 4.2 6.5 6.3 6.5 12.5a6.5 6.5 0 0 1-13 0c0-3.3 2-5.5 3.3-6.5 0 2.2 1 3.4 2.2 3.4C11 6.5 10 4.5 12 1.5z',
  book:'M3 4.5h7a2.5 2.5 0 0 1 2 1 2.5 2.5 0 0 1 2-1h7V19h-7a2 2 0 0 0-2 1.5A2 2 0 0 0 10 19H3z',
  trophy:'M6 2.5h12v2.5h3.5v2.5a5 5 0 0 1-5 5h-.4A5 5 0 0 1 13.5 15v2.5H17V21H7v-3.5h3.5V15A5 5 0 0 1 7.9 12.5h-.4a5 5 0 0 1-5-5V5H6zm-1.3 5v.2a2.6 2.6 0 0 0 1.3 2.2V7.5zm14.6 0H18v2.4a2.6 2.6 0 0 0 1.3-2.2z',
  gear:'M10.3 1.5h3.4l.5 2.7a8 8 0 0 1 2 .9l2.3-1.6 2.4 2.4-1.6 2.3c.4.6.7 1.3.9 2l2.7.5v3.4l-2.7.5a8 8 0 0 1-.9 2l1.6 2.3-2.4 2.4-2.3-1.6a8 8 0 0 1-2 .9l-.5 2.7h-3.4l-.5-2.7a8 8 0 0 1-2-.9l-2.3 1.6-2.4-2.4 1.6-2.3a8 8 0 0 1-.9-2l-2.7-.5v-3.4l2.7-.5c.2-.7.5-1.4.9-2L3.2 6.3l2.4-2.4 2.3 1.6c.6-.4 1.3-.7 2-.9zM12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6z',
  planet:'M12 5.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM1.5 16.5c1.8 1.8 9-1 13.6-4.3 4.6-3.3 7.8-7.4 6.8-8.4-.5-.5-2 0-3.9 1 .4.4.8.9 1.1 1.4 1-.4 1.6-.5 1.7-.3.4.6-2.2 3.8-6.3 6.7-4.1 2.9-9.3 4.9-10.3 4.3-.2-.2.3-.9 1.2-1.9a8 8 0 0 1-.8-1.4c-2.2 1.6-3.6 2.4-3.1 2.9z',
  calc:'M5 2h14v20H5zm2 2v4h10V4zm0 6v2.2h2.2V10zm3.9 0v2.2h2.2V10zm3.9 0v2.2H17V10zM7 14v2.2h2.2V14zm3.9 0v2.2h2.2V14zm3.9 0V20H17v-6zM7 17.8V20h2.2v-2.2zm3.9 0V20h2.2v-2.2z',
  puzzle:'M9 3h6v2.5a2 2 0 1 0 0 3.6V11h3v3.2a2 2 0 1 1 0 3.6V21h-5v-2.5a2 2 0 1 0-3.6 0V21H4v-5.5h2.5a2 2 0 1 0 0-3.6H4V6h5z',
  clock:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm-1 2.5V13l4.5 2.7 1-1.6-3.5-2.1V7.5z',
  plug:'M8.5 2h2v5h3V2h2v5H18v4.5a6 6 0 0 1-5 5.9V22h-2v-4.6a6 6 0 0 1-5-5.9V7h2.5z',
  eye:'M12 5C6.5 5 2.5 9.5 1 12c1.5 2.5 5.5 7 11 7s9.5-4.5 11-7c-1.5-2.5-5.5-7-11-7zm0 3.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z',
  repeat:'M17 2l4 4-4 4V7H7a3 3 0 0 0-3 3v1H2v-1a5 5 0 0 1 5-5h10zM7 22l-4-4 4-4v3h10a3 3 0 0 0 3-3v-1h2v1a5 5 0 0 1-5 5H7z',
  heart:'M12 21l-1.5-1.3C5 15 2 12.2 2 8.6 2 5.7 4.3 3.5 7.1 3.5c1.7 0 3.6.8 4.9 2.3 1.3-1.5 3.2-2.3 4.9-2.3 2.8 0 5.1 2.2 5.1 5.1 0 3.6-3 6.4-8.5 11.1z',
  map:'M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2zm6 0v14m6-12v14',
  crystal:'M12 1.5l7 7-7 14-7-14zm0 3.2L7.8 8.9h8.4z',
  sound:'M3 9h4l5-4.5v15L7 15H3zm13.5-1.6a6 6 0 0 1 0 9.2l-1.3-1.5a4 4 0 0 0 0-6.2zm2.7-3a10 10 0 0 1 0 15.2l-1.3-1.5a8 8 0 0 0 0-12.2z',
  mute:'M3 9h4l5-4.5v15L7 15H3zm12.6.6l1.4-1.4 2.1 2.1 2.1-2.1 1.4 1.4-2.1 2.1 2.1 2.1-1.4 1.4-2.1-2.1-2.1 2.1-1.4-1.4 2.1-2.1z',
  cog:'M10.3 1.5h3.4l.5 2.7a8 8 0 0 1 2 .9l2.3-1.6 2.4 2.4-1.6 2.3c.4.6.7 1.3.9 2l2.7.5v3.4l-2.7.5a8 8 0 0 1-.9 2l1.6 2.3-2.4 2.4-2.3-1.6a8 8 0 0 1-2 .9l-.5 2.7h-3.4l-.5-2.7a8 8 0 0 1-2-.9l-2.3 1.6-2.4-2.4 1.6-2.3a8 8 0 0 1-.9-2l-2.7-.5v-3.4l2.7-.5c.2-.7.5-1.4.9-2L3.2 6.3l2.4-2.4 2.3 1.6c.6-.4 1.3-.7 2-.9zM12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6z',
  ship:'M2 12l5-4h9c3 0 5 2 6 4-1 2-3 4-6 4H7zm5-6.5L10 2h4l2 3.5zm0 13L10 22h4l2-3.5z',
  gamepad:'M7 7h10a5 5 0 0 1 5 5v2.5A3.5 3.5 0 0 1 18.5 18c-1.3 0-2.2-.7-2.9-1.6L14.5 15h-5l-1.1 1.4C7.7 17.3 6.8 18 5.5 18A3.5 3.5 0 0 1 2 14.5V12a5 5 0 0 1 5-5zm-.5 3v1.5H5v2h1.5V15h2v-1.5H10v-2H8.5V10zm9.5.2a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6zm-2.5 2.5a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6z',
  chart:'M3 3h2v16h16v2H3zm4 10h3v4H7zm5-6h3v10h-3zm5 3h3v7h-3z',
  hangar:'M2 11L12 4l10 7v10h-3v-8H5v8H2zm5 4h10v2H7zm0 3.5h10V21H7z',
  play:'M7 4l13 8-13 8z',
  lock:'M7 10V7a5 5 0 0 1 10 0v3h2v12H5V10zm2 0h6V7a3 3 0 0 0-6 0z',
  check:'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  station:'M11 2h2v4h4l2 3h-5v3h7v2h-7v3h5l-2 3h-4v2h-2v-2H7l-2-3h5v-3H3v-2h7V9H5l2-3h4z'
};
const ICON=(n,cls)=>`<svg class="${cls||'ico'}" viewBox="0 0 24 24" aria-hidden="true"><path d="${GLYPH[n]||GLYPH.star}" fill-rule="evenodd"/></svg>`;
const TIERC=['var(--bronze)','var(--silver)','var(--gold)'];
let embN=0;
function emblem(glyph,tier,locked,cls){const id='eg'+(embN++);const c=TIERC[(tier||1)-1]||TIERC[0];
  return `<svg class="emb ${locked?'locked':''} ${cls||''}" viewBox="0 0 64 64" aria-hidden="true">
  <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${c}"/><stop offset="1" style="stop-color:${c};stop-opacity:.45"/></linearGradient></defs>
  <path d="M32 3l25 14.5v29L32 61 7 46.5v-29z" fill="#0b1220" stroke="url(#${id})" stroke-width="3"/>
  <path d="M32 9l20 11.5v23L32 55 12 43.5v-23z" fill="url(#${id})" opacity=".22"/>
  ${tier>=3?`<path d="M32 3l25 14.5v29L32 61 7 46.5v-29z" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1" transform="translate(32 32) scale(.82) translate(-32 -32)"/>`:''}
  <g transform="translate(18 18) scale(1.17)"><path d="${GLYPH[glyph]||GLYPH.star}" fill="${c}" fill-rule="evenodd"/></g></svg>`}

/* ================= Circuit simulator (nodal analysis, Ohm's law) =================
   Board: grid of nodes; every component sits on one edge between two adjacent nodes.
   edge 'h:x,y' joins (x,y)-(x+1,y); 'v:x,y' joins (x,y)-(x,y+1).
   dir = 1 → the first node (left/top) is the + terminal (generator +, meter V/A terminal). */
const LAMPS={l6a:{Un:6,In:.1,n:'6 V · 0,1 A'},l6b:{Un:6,In:.3,n:'6 V · 0,3 A'},l35:{Un:3.5,In:.2,n:'3,5 V · 0,2 A'},l12:{Un:12,In:.1,n:'12 V · 0,1 A'},l25:{Un:2.5,In:.2,n:'2,5 V · 0,2 A'},l45:{Un:4.5,In:.3,n:'4,5 V · 0,3 A'}};
const RVALS=[10,22,33,47,68,100,150,220,330,470,680,1000,2200,4700];
const GVALS=[1.5,3,4.5,6,9,12];
const FVALS=[.1,.2,.5,1,2,5];
const PVALS=[.25,.5,1,2,5];
const CTYPES={
  wire:{n:'Fil',es:'Cable',pre:''},
  gen:{n:'Générateur',es:'Pila / generador',pre:'G'},
  lamp:{n:'Lampe',es:'Lámpara',pre:'L'},
  res:{n:'Résistance',es:'Resistencia',pre:'R'},
  amp:{n:'Ampèremètre',es:'Amperímetro',pre:'A'},
  volt:{n:'Voltmètre',es:'Voltímetro',pre:'V'},
  sw:{n:'Interrupteur',es:'Interruptor',pre:'K'},
  fuse:{n:'Fusible',es:'Fusible',pre:'F'},
  motor:{n:'Moteur',es:'Motor',pre:'M'}};
const G_WIRE=1000,R_INT=.1,I_SHORT=4,AMP_MAX=10;
function edgeNodes(e){const t=e.split(':'),p=t[1].split(',').map(Number);return t[0]==='h'?[[p[0],p[1]],[p[0]+1,p[1]]]:[[p[0],p[1]],[p[0],p[1]+1]]}
function compR(c){switch(c.t){case 'res':return c.R;case 'lamp':{const L=LAMPS[c.lt];return L.Un/L.In}case 'motor':return 6/.2;case 'amp':return .01;case 'fuse':return .02;case 'volt':return 1e7;default:return 1e-3}}
function conducts(c){if(c.burnt)return false;if(c.t==='sw'&&!c.on)return false;return true}
/* Solve G·V = J with partial pivoting */
function gauss(A,b){const n=b.length;for(let c=0;c<n;c++){let p=c,m=Math.abs(A[c][c]);for(let r=c+1;r<n;r++){const v=Math.abs(A[r][c]);if(v>m){m=v;p=r}}
    if(m<1e-18)continue;if(p!==c){[A[p],A[c]]=[A[c],A[p]];[b[p],b[c]]=[b[c],b[p]]}
    for(let r=c+1;r<n;r++){const f=A[r][c]/A[c][c];if(!f)continue;for(let k=c;k<n;k++)A[r][k]-=f*A[c][k];b[r]-=f*b[c]}}
  const x=Array(n).fill(0);for(let r=n-1;r>=0;r--){let s=b[r];for(let k=r+1;k<n;k++)s-=A[r][k]*x[k];x[r]=Math.abs(A[r][r])<1e-18?0:s/A[r][r]}return x}
function solveOnce(B){const idx=new Map();const nid=(x,y)=>{const k=x+','+y;if(!idx.has(k))idx.set(k,idx.size);return idx.get(k)};
  const els=B.comps.map(c=>{const [a,b]=edgeNodes(c.e);const na=nid(a[0],a[1]),nb=nid(b[0],b[1]);const p=c.dir===-1?nb:na,q=c.dir===-1?na:nb;return {c,p,q}});
  const n=idx.size;const A=Array.from({length:n},()=>Array(n).fill(0)),J=Array(n).fill(0);
  const stamp=(p,q,g)=>{A[p][p]+=g;A[q][q]+=g;A[p][q]-=g;A[q][p]-=g};
  els.forEach(({c,p,q})=>{if(!conducts(c))return;if(c.t==='gen'){const g=1/R_INT;stamp(p,q,g);J[p]+=c.E*g;J[q]-=c.E*g}else stamp(p,q,c.t==='wire'||c.t==='sw'?G_WIRE:1/compR(c))});
  for(let i=0;i<n;i++)A[i][i]+=1e-9;
  const V=gauss(A,J);
  const res=new Map();els.forEach(({c,p,q})=>{const U=V[p]-V[q];let I=0;if(conducts(c)){if(c.t==='gen')I=(c.E-U)/R_INT;else I=U*(c.t==='wire'||c.t==='sw'?G_WIRE:1/compR(c))}
    res.set(c.id,{U,I,P:Math.abs(U*I)})});
  return {res,V,idx}}
/* Solve and apply instantaneous failures (lamp/resistor/motor burnout, fuses, ammeter fuse). */
function simulate(B){let out,events=[];
  for(let it=0;it<8;it++){out=solveOnce(B);let changed=false;
    for(const c of B.comps){if(c.burnt)continue;const r=out.res.get(c.id);const aI=Math.abs(r.I),aU=Math.abs(r.U);
      if(c.t==='lamp'){const L=LAMPS[c.lt];if(aU>L.Un*1.45){c.burnt=1;changed=true;events.push({k:'lamp',c})}}
      else if(c.t==='res'){if(r.P>(c.Pmax||5)*1.15){c.burnt=1;changed=true;events.push({k:'res',c})}}
      else if(c.t==='motor'){if(aI>.2*2.5){c.burnt=1;changed=true;events.push({k:'motor',c})}}
      else if(c.t==='fuse'){if(aI>c.Ir*1.0001){c.burnt=1;changed=true;events.push({k:'fuse',c})}}
      else if(c.t==='amp'){if(aI>AMP_MAX){c.burnt=1;changed=true;events.push({k:'amp',c})}}}
    if(!changed)break}
  const shorts=B.comps.filter(c=>c.t==='gen'&&!c.burnt&&Math.abs(out.res.get(c.id).I)>I_SHORT);
  return {res:out.res,events,shorts}}
/* nets joined by wires and closed switches only — used to check where meters are connected */
function nets(B){const par={};const f=k=>{while(par[k]!==undefined&&par[k]!==k)k=par[k];return k};const key=p=>p[0]+','+p[1];
  B.comps.forEach(c=>edgeNodes(c.e).forEach(p=>{const k=key(p);if(par[k]===undefined)par[k]=k}));
  B.comps.forEach(c=>{if((c.t==='wire'||(c.t==='sw'&&c.on))&&!c.burnt){const [a,b]=edgeNodes(c.e);const ra=f(key(a)),rb=f(key(b));if(ra!==rb)par[ra]=rb}});
  return c=>edgeNodes(c.e).map(p=>f(key(p)))}
/* Query helpers for mission objectives */
function makeQ(B,R){const N=nets(B);const byLab=l=>B.comps.find(c=>c.lab===l);const r=c=>c?R.res.get(c.id):{U:0,I:0,P:0};
  const Q={B,R,c:byLab,r:l=>r(byLab(l)),of:t=>B.comps.filter(c=>c.t===t),
    I:l=>Math.abs(r(byLab(l)).I),U:l=>Math.abs(r(byLab(l)).U),P:l=>r(byLab(l)).P,
    lampState(l){const c=byLab(l);if(!c)return 'none';if(c.burnt)return 'burnt';const L=LAMPS[c.lt],u=Math.abs(r(c).U);return u<L.Un*.08?'off':u<L.Un*.85?'sous':u>L.Un*1.15?'sur':'normal'},
    lit(l){const s=Q.lampState(l);return s==='normal'||s==='sous'||s==='sur'},
    /* meter whose terminals land on the same nets as component l */
    across(type,l){const c=byLab(l);if(!c)return null;const nc=N(c).sort().join('|');return Q.of(type).find(m=>!m.burnt&&N(m).sort().join('|')===nc)||null},
    /* ammeter in series with l: same (non-zero) current and sharing one net with l */
    series(l){const c=byLab(l);if(!c)return null;const ic=r(c).I,nc=N(c);return Q.of('amp').find(m=>{if(m.burnt)return false;const im=r(m).I;if(Math.abs(Math.abs(im)-Math.abs(ic))>1e-4*Math.max(1,Math.abs(ic))||Math.abs(ic)<1e-4)return false;return N(m).some(x=>nc.includes(x))})||null},
    read(m){if(!m||m.burnt)return null;const x=r(m);return m.t==='amp'?x.I:m.t==='volt'?x.U:null},
    shorts:R.shorts.length>0};
  return Q}

/* ================= Laboratory: editable circuit board ================= */
const LM=56,LS=92;
const BAND=['#151515','#7a4a24','#d1312b','#ef7d22','#f3d22b','#2e9e4f','#2a62c9','#7f3fbf','#8a8f99','#f2f2f2'];
const BANDN=['noir','marron','rouge','orange','jaune','vert','bleu','violet','gris','blanc'];
function bands(R){const e=Math.floor(Math.log10(R))-1;const d=Math.round(R/Math.pow(10,e));return [Math.floor(d/10),d%10,e]}
const fmtA=v=>{if(v==null)return '—';const a=Math.abs(v)<.0005?0:v;return (a<0?'−':'')+fr(Math.abs(a),3)+' A'};
const fmtV=v=>{if(v==null)return '—';const a=Math.abs(v)<.005?0:v;return (a<0?'−':'')+fr(Math.abs(a),2)+' V'};
const fmtR=R=>R>=1000?frs(R/1000)+' kΩ':frs(R)+' Ω';
const fmtW=p=>p<.1?fr(p*1000,0)+' mW':fr(p,2)+' W';
function createLab(host,o){o=Object.assign({cols:7,rows:4,comps:[],palette:{wire:Infinity},showAll:false,genAdj:false,lampTypes:Object.keys(LAMPS),resVals:RVALS,fuseVals:FVALS,showPmax:false,onChange:null,onEvent:null},o);
  let uid=0;const B={comps:o.comps.map(c=>Object.assign({dir:1},clone(c),{id:++uid}))};
  const used={};B.comps.forEach(c=>{if(!c.lock)used[c.t]=(used[c.t]||0)+1});
  let tool=o.tool||'select',sel=null,R=null,Q=null,drag=null,shortT=null;
  const W=2*LM+(o.cols-1)*LS,H=2*LM+(o.rows-1)*LS;
  host.innerHTML=`<div class="lab"><div class="lab-board"><svg viewBox="0 0 ${W} ${H}" id="labSvg" role="application" aria-label="${esc(ui('lab.aria'))}"></svg><div class="lab-alert" id="labAlert" hidden></div></div>
    <div class="lab-tools" id="labTools" role="toolbar" aria-label="${esc(ui('lab.tools'))}"></div></div>`;
  const svg=$('#labSvg',host),alertEl=$('#labAlert',host);
  const left=t=>o.palette[t]===undefined?0:o.palette[t]===Infinity?Infinity:o.palette[t]-(used[t]||0);
  function tools(){const list=[['select',ui('tool.select')],['wire',T(CTYPES.wire.n)],...Object.keys(CTYPES).filter(t=>t!=='wire'&&o.palette[t]!==undefined).map(t=>[t,T(CTYPES[t].n)]),['erase',ui('tool.erase')]];
    $('#labTools',host).innerHTML=list.map(([t,n])=>{const l=left(t);const cnt=t==='select'||t==='erase'||l===Infinity?'':`<i>${l}</i>`;
      return `<button class="ltool ${tool===t?'on':''}" data-t="${t}" title="${esc(n)}" aria-pressed="${tool===t}" ${t!=='select'&&t!=='erase'&&l<=0?'disabled':''}>${toolIcon(t)}<span>${esc(n)}</span>${cnt}</button>`}).join('');
    $$('.ltool',host).forEach(b=>b.onclick=()=>{tool=b.dataset.t;AU.play('select');tools();render()})}
  const nodeXY=(x,y)=>[LM+x*LS,LM+y*LS];
  const at=e=>B.comps.find(c=>c.e===e);
  function pt(ev){const r=svg.getBoundingClientRect();return {x:(ev.clientX-r.left)/r.width*W,y:(ev.clientY-r.top)/r.height*H}}
  function nearestEdge(p){const gx=(p.x-LM)/LS,gy=(p.y-LM)/LS;const c=[];const ry=Math.round(gy),fx=Math.floor(gx);if(ry>=0&&ry<o.rows&&fx>=0&&fx<o.cols-1)c.push({e:`h:${fx},${ry}`,d:Math.abs(gy-ry)});
    const rx=Math.round(gx),fy=Math.floor(gy);if(rx>=0&&rx<o.cols&&fy>=0&&fy<o.rows-1)c.push({e:`v:${rx},${fy}`,d:Math.abs(gx-rx)});c.sort((a,b)=>a.d-b.d);return c[0]&&c[0].d<.34?c[0].e:null}
  function nearestNode(p){const x=Math.round((p.x-LM)/LS),y=Math.round((p.y-LM)/LS);if(x<0||y<0||x>=o.cols||y>=o.rows)return null;const [nx,ny]=nodeXY(x,y);return Math.hypot(nx-p.x,ny-p.y)<LS*.3?[x,y]:null}
  const edgeBetween=(a,b)=>{if(a[1]===b[1]&&Math.abs(a[0]-b[0])===1)return `h:${Math.min(a[0],b[0])},${a[1]}`;if(a[0]===b[0]&&Math.abs(a[1]-b[1])===1)return `v:${a[0]},${Math.min(a[1],b[1])}`;return null};
  function label(t){const pre=CTYPES[t].pre;if(!pre)return '';let n=1;while(B.comps.some(c=>c.lab===pre+n))n++;return pre+n}
  function place(t,e){if(at(e))return null;if(left(t)<=0){toast(ui('lab.none'));AU.play('bad');return null}
    const c={id:++uid,t,e,dir:1,lab:label(t)};if(t==='gen')c.E=o.genE||6;if(t==='lamp')c.lt=o.lampType||o.lampTypes[0];if(t==='res'){c.R=o.resDefault||o.resVals[Math.min(5,o.resVals.length-1)];c.Pmax=o.Pmax||5}if(t==='fuse')c.Ir=o.fuseDefault||1;if(t==='sw')c.on=true;
    B.comps.push(c);used[t]=(used[t]||0)+1;AU.play(t==='wire'?'select':'plug');return c}
  function remove(c){if(!c||c.lock){if(c)toast(ui('lab.locked'));return}B.comps=B.comps.filter(x=>x!==c);if(used[c.t])used[c.t]--;if(sel===c)sel=null;AU.play('click')}
  function click(e){const c=e&&at(e);
    if(tool==='select'){if(c&&c.t==='sw'&&!c.burnt){c.on=!c.on;AU.play('plug')}sel=c||null}
    else if(tool==='erase'){if(c)remove(c)}
    else if(e){if(c)sel=c;else{const n=place(tool,e);if(n&&n.t!=='wire')sel=n}}
    run()}
  svg.addEventListener('pointerdown',ev=>{const p=pt(ev);if(tool==='wire'){const n=nearestNode(p);drag={last:n,moved:false,edge:nearestEdge(p)};try{svg.setPointerCapture(ev.pointerId)}catch(_){}}else click(nearestEdge(p))});
  svg.addEventListener('pointermove',ev=>{const p=pt(ev);const he=nearestEdge(p);if(he!==svg.dataset.hover){svg.dataset.hover=he||'';$$('.hit',svg).forEach(h=>h.classList.toggle('hv',h.dataset.e===he))}
    if(!drag)return;const n=nearestNode(p);if(!n)return;if(!drag.last){drag.last=n;return}const e=edgeBetween(drag.last,n);if(e){if(!at(e))place('wire',e);drag.last=n;drag.moved=true;run()}else if(n[0]!==drag.last[0]||n[1]!==drag.last[1])drag.last=n});
  svg.addEventListener('pointerup',()=>{if(drag&&!drag.moved&&drag.edge){const c=at(drag.edge);if(c){sel=c;run()}else{place('wire',drag.edge);run()}}drag=null});
  svg.addEventListener('pointerleave',()=>{$$('.hit.hv',svg).forEach(h=>h.classList.remove('hv'));svg.dataset.hover=''});
  function geom(c){const [a,b]=edgeNodes(c.e);const [x1,y1]=nodeXY(a[0],a[1]),[x2,y2]=nodeXY(b[0],b[1]);const h=c.e[0]==='h';const cx=(x1+x2)/2,cy=(y1+y2)/2;
    const P=(t,n)=>h?[cx+t,cy-n]:[cx+n,cy+t];return {h,cx,cy,P,x1,y1,x2,y2}}
  const pts=a=>a.map(p=>p.join(',')).join(' ');
  function flowAB(c,r){if(c.t==='gen')return c.dir===1?-r.I:r.I;return c.dir===1?r.I:-r.I}
  function sym(c,r){const g=geom(c),P=g.P;let s='';const hw={wire:0,gen:8,lamp:18,res:22,amp:18,volt:18,sw:20,fuse:18,motor:18}[c.t];
    const lead=(t1,t2)=>`<line class="w" x1="${P(t1,0)[0]}" y1="${P(t1,0)[1]}" x2="${P(t2,0)[0]}" y2="${P(t2,0)[1]}"/>`;
    const hot=R&&R.shorts.length&&(c.t==='wire'||c.t==='gen')?' hot':'';
    if(c.t==='wire')return `<g class="cp wire${hot}${sel===c?' sel':''}${c.lock?' lock':''}${c.mark?' mark':''}">${lead(-LS/2,LS/2)}</g>`;
    s+=lead(-LS/2,-hw)+lead(hw,LS/2);
    const ab=r?Math.abs(flowAB(c,r)):0;
    if(c.t==='gen'){const pl=c.dir===1?-5:5,mi=-pl;s+=`<polyline class="w gp" points="${pts([P(pl,-20),P(pl,20)])}"/><polyline class="w gm" points="${pts([P(mi,-11),P(mi,11)])}"/>`;const pp=P(c.dir===1?-24:24,-22);s+=`<text class="pm" x="${pp[0]}" y="${pp[1]+5}" text-anchor="middle">+</text>`;const mm=P(c.dir===1?24:-24,-22);s+=`<text class="pm" x="${mm[0]}" y="${mm[1]+5}" text-anchor="middle">−</text>`}
    else if(c.t==='lamp'){const L=LAMPS[c.lt],u=r?Math.abs(r.U):0;const br=c.burnt?0:Math.min(1.5,(u/L.Un)**2);s=`<circle class="glow" cx="${g.cx}" cy="${g.cy}" r="${30+br*22}" fill="url(#lGlow)" style="opacity:${Math.min(1,br)}"/>`+s+`<circle class="body ${c.burnt?'burnt':''}" cx="${g.cx}" cy="${g.cy}" r="17" style="fill:${c.burnt?'#111':`rgba(255,${190+br*40|0},${90+br*80|0},${Math.min(1,br*.9)})`}"/><path class="w" d="M${g.cx-11} ${g.cy-11}L${g.cx+11} ${g.cy+11}M${g.cx+11} ${g.cy-11}L${g.cx-11} ${g.cy+11}"/>${c.burnt?`<path class="crack" d="M${g.cx-4} ${g.cy-17}l7 9-8 6 6 11"/>`:''}`}
    else if(c.t==='res'||c.t==='fuse'){const w=c.t==='res'?20:17,hh=c.t==='res'?9:7;const heat=r&&c.t==='res'?Math.min(1,r.P/(c.Pmax||5)):0;
      s+=`<polygon class="body ${c.burnt?'burnt':''}" points="${pts([P(-w,-hh),P(w,-hh),P(w,hh),P(-w,hh)])}" style="${c.t==='res'&&!c.burnt?`fill:rgb(${40+heat*215|0},${44+heat*60|0},${52-heat*30|0})`:''}"/>`;
      if(c.t==='res'&&!c.burnt){const bd=bands(c.R);[[-12,BAND[bd[0]]],[-5,BAND[bd[1]]],[2,BAND[bd[2]]],[12,'#c9a227']].forEach(([t,col])=>{s+=`<polygon points="${pts([P(t-2.2,-hh),P(t+2.2,-hh),P(t+2.2,hh),P(t-2.2,hh)])}" fill="${col}"/>`})}
      if(c.t==='fuse')s+=c.burnt?`<polyline class="w" points="${pts([P(-17,0),P(-5,0)])}"/><polyline class="w" points="${pts([P(5,0),P(17,0)])}"/>`:`<polyline class="w" points="${pts([P(-17,0),P(17,0)])}"/>`;
      if(heat>.7&&!c.burnt)s+=`<circle cx="${g.cx}" cy="${g.cy}" r="26" fill="url(#hGlow)" class="heat"/>`}
    else if(c.t==='amp'||c.t==='volt'||c.t==='motor'){s+=`<circle class="body meter ${c.t} ${c.burnt?'burnt':''}" cx="${g.cx}" cy="${g.cy}" r="17"/>`;
      if(c.t==='motor'){const sp=c.burnt||!r?0:Math.abs(r.I)/.2;s+=`<g class="rotor" style="animation-duration:${sp>.05?(1.2/sp).toFixed(2):0}s;${sp>.05?'':'animation-name:none'}"><path d="M${g.cx} ${g.cy-12}V${g.cy+12}M${g.cx-12} ${g.cy}H${g.cx+12}" class="w thin"/></g><text class="sym-l" x="${g.cx}" y="${g.cy+6}">M</text>`}
      else{s+=`<text class="sym-l" x="${g.cx}" y="${g.cy+6}">${c.t==='amp'?'A':'V'}</text>`;const pp=P(c.dir===1?-30:30,0),cm=P(c.dir===1?30:-30,0);s+=`<circle cx="${pp[0]}" cy="${pp[1]}" r="5" class="tplus"/><circle cx="${cm[0]}" cy="${cm[1]}" r="5" class="tcom"/>`}
      if(c.burnt)s+=`<path class="crack" d="M${g.cx-4} ${g.cy-17}l7 9-8 6 6 11"/>`}
    else if(c.t==='sw'){s+=`<circle class="dotw" cx="${P(-20,0)[0]}" cy="${P(-20,0)[1]}" r="4"/><circle class="dotw" cx="${P(20,0)[0]}" cy="${P(20,0)[1]}" r="4"/>`+(c.on?`<polyline class="w" points="${pts([P(-20,0),P(20,0)])}"/>`:`<polyline class="w" points="${pts([P(-20,0),P(16,22)])}"/>`)}
    return `<g class="cp ${c.t}${sel===c?' sel':''}${c.lock?' lock':''}${hot}">${s}</g>`}
  function flow(c,r){if(!r||c.burnt)return '';const f=flowAB(c,r),a=Math.abs(f);if(a<2e-4)return '';const g=geom(c);const dur=Math.max(.18,1.6/(.3+Math.log10(1+a*100)));
    const hw={wire:0,gen:8,lamp:18,res:22,amp:18,volt:18,sw:20,fuse:18,motor:18}[c.t];const seg=(t1,t2)=>{const p1=g.P(t1,0),p2=g.P(t2,0);return `<line class="flow${a>I_SHORT?' fast':''}" x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" style="animation-duration:${dur.toFixed(2)}s;animation-direction:${f>0?'normal':'reverse'}"/>`};
    return c.t==='wire'?seg(-LS/2,LS/2):seg(-LS/2,-hw)+seg(hw,LS/2)}
  function tag(c,r){const g=geom(c);let t='',cls='lab-l';if(c.t==='wire')return '';
    const lx=g.h?g.cx:g.cx+30,ly=g.h?g.cy-30:g.cy-6,an=g.h?'middle':'start';
    let sub='';if(c.t==='gen')sub=frs(c.E)+' V';else if(c.t==='lamp')sub=LAMPS[c.lt].n;else if(c.t==='res')sub=fmtR(c.R)+(o.showPmax?' · '+frs(c.Pmax)+' W':'');else if(c.t==='fuse')sub=frs(c.Ir)+' A';
    t+=`<text class="${cls}" x="${lx}" y="${ly}" text-anchor="${an}">${esc(c.lab||'')}${sub?`<tspan class="lab-s"> ${esc(sub)}</tspan>`:''}</text>`;
    if((c.t==='amp'||c.t==='volt')&&r){const v=c.burnt?ui('lab.fuseHS'):c.t==='amp'?fmtA(r.I):fmtV(r.U);const bx=g.h?g.cx-46:g.cx+26,by=g.h?g.cy+24:g.cy+6;
      t+=`<g class="lcdb ${c.burnt?'dead':''}"><rect x="${bx}" y="${by}" width="92" height="26" rx="4"/><text x="${bx+86}" y="${by+19}" text-anchor="end">${esc(v)}</text></g>`}
    if(o.showAll&&r&&!c.burnt&&(c.t==='lamp'||c.t==='res'||c.t==='motor')){t+=`<text class="lab-v" x="${lx}" y="${g.h?g.cy+40:g.cy+14}" text-anchor="${an}">${fmtV(Math.abs(r.U))} · ${fmtA(Math.abs(r.I))}</text>`}
    return t}
  function render(noInsp){let s=`<defs><radialGradient id="lGlow"><stop offset="0" stop-color="#ffe7a8" stop-opacity=".95"/><stop offset=".5" stop-color="#ffb347" stop-opacity=".35"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
      <radialGradient id="hGlow"><stop offset="0" stop-color="#ff6a3d" stop-opacity=".7"/><stop offset="1" stop-color="#ff6a3d" stop-opacity="0"/></radialGradient></defs>
      <rect class="bench" x="0" y="0" width="${W}" height="${H}" rx="10"/>`;
    for(let y=0;y<o.rows;y++)for(let x=0;x<o.cols;x++){const [nx,ny]=nodeXY(x,y);s+=`<circle class="peg" cx="${nx}" cy="${ny}" r="5"/>`}
    const tl=tool!=='select'?' tool':'';
    for(let y=0;y<o.rows;y++)for(let x=0;x<o.cols;x++){if(x<o.cols-1){const e=`h:${x},${y}`,[a,b]=[nodeXY(x,y),nodeXY(x+1,y)];s+=`<line class="hit${tl}" data-e="${e}" x1="${a[0]+10}" y1="${a[1]}" x2="${b[0]-10}" y2="${b[1]}"/>`}
      if(y<o.rows-1){const e=`v:${x},${y}`,[a,b]=[nodeXY(x,y),nodeXY(x,y+1)];s+=`<line class="hit${tl}" data-e="${e}" x1="${a[0]}" y1="${a[1]+10}" x2="${b[0]}" y2="${b[1]-10}"/>`}}
    const res=c=>R?R.res.get(c.id):null;
    s+=B.comps.map(c=>sym(c,res(c))).join('');s+=`<g class="flows">${B.comps.map(c=>flow(c,res(c))).join('')}</g>`;s+=B.comps.map(c=>tag(c,res(c))).join('');
    B.comps.forEach(c=>{if(c.t==='wire')return;const [a,b]=edgeNodes(c.e).map(n=>nodeXY(n[0],n[1]));s+=`<circle class="pin" cx="${a[0]}" cy="${a[1]}" r="4"/><circle class="pin" cx="${b[0]}" cy="${b[1]}" r="4"/>`});
    svg.innerHTML=s;svg.dataset.tool=tool;if(o.inspector&&!noInsp)inspect()}
  function inspect(){const el=o.inspector;if(!sel||!B.comps.includes(sel)){el.innerHTML=`<p class="insp-empty">${esc(ui(tool==='wire'?'insp.wire':tool==='select'?'insp.select':tool==='erase'?'insp.erase':'insp.place'))}</p>`;return}
    const c=sel,r=R&&R.res.get(c.id),CT=CTYPES[c.t];const can=!c.lockVal;let h=`<div class="insp-h"><b>${esc(c.lab||T(CT.n))}</b><span>${esc(T(CT.n))}${altC(CT.n)}</span></div>`;
    if(c.burnt)h+=`<p class="insp-burnt">${esc(ui(c.t==='fuse'?'insp.fuseBlown':c.t==='amp'?'insp.ampFuse':'insp.burnt'))}</p><button class="btn sm" data-a="fix">${ICON('gear')} ${esc(ui('btn.replace'))}</button>`;
    if(c.t==='gen'){h+=o.genAdj&&can?`<label class="insp-l" for="gSl">${esc(ui('insp.tension'))} U = <b id="gV">${frs(c.E)} V</b></label><input type="range" id="gSl" min="0" max="12" step="0.5" value="${c.E}">`:can?chips('E',GVALS,v=>frs(v)+' V',c.E):`<p>U = ${frs(c.E)} V</p>`}
    if(c.t==='res'){h+=can?chips('R',o.resVals,fmtR,c.R):`<p>R = ${fmtR(c.R)}</p>`;if(o.showPmax)h+=can&&!o.fixPmax?`<span class="insp-l">${esc(ui('insp.pmax'))}</span>`+chips('Pmax',PVALS,v=>frs(v)+' W',c.Pmax):`<p>Pmax = ${frs(c.Pmax)} W</p>`;
      const bd=bands(c.R);h+=`<p class="insp-bands">${bd.map((b,i)=>`<i style="background:${BAND[b]}"></i>${esc(T(BANDN[b]))}`).join(' · ')}</p>`}
    if(c.t==='lamp')h+=can&&o.lampTypes.length>1?chips('lt',o.lampTypes,k=>LAMPS[k].n,c.lt):`<p>${LAMPS[c.lt].n}<br><span class="insp-sub">${esc(ui('insp.lampNom',{u:frs(LAMPS[c.lt].Un),i:frs(LAMPS[c.lt].In)}))}</span></p>`;
    if(c.t==='fuse')h+=can?chips('Ir',o.fuseVals,v=>frs(v)+' A',c.Ir):`<p>${esc(ui('insp.rating',{v:frs(c.Ir)}))}</p>`;
    if(c.t==='sw')h+=`<button class="btn sm" data-a="sw">${esc(ui(c.on?'btn.open':'btn.close'))}</button>`;
    if((c.t==='gen'||c.t==='amp'||c.t==='volt')&&!c.lockDir)h+=`<button class="btn sm ghost" data-a="flip">⇄ ${esc(ui('btn.flip'))}</button>`;
    if(r&&!c.burnt){if(c.t==='amp')h+=`<div class="insp-read">${fmtA(r.I)}</div><p class="insp-sub">${esc(ui('insp.ampTerm'))}</p>`;else if(c.t==='volt')h+=`<div class="insp-read">${fmtV(r.U)}</div><p class="insp-sub">${esc(ui('insp.voltTerm'))}</p>`;
      else if(o.showAll&&c.t!=='wire')h+=`<p class="insp-all">U = ${fmtV(Math.abs(r.U))} · I = ${fmtA(Math.abs(r.I))} · P = ${fmtW(r.P)}</p>`}
    if(!c.lock)h+=`<button class="btn sm ghost danger" data-a="del">${esc(ui('btn.remove'))}</button>`;
    el.innerHTML=h;
    $$('[data-k]',el).forEach(b=>b.onclick=()=>{const k=b.dataset.k;let v=b.dataset.v;if(k!=='lt')v=+v;c[k]=v;if(c.burnt&&k!=='Pmax')c.burnt=0;AU.play('select');run()});
    const sl=$('#gSl',el);if(sl){sl.oninput=()=>{c.E=+sl.value;$('#gV',el).textContent=frs(c.E)+' V';run(true)}}
    $$('[data-a]',el).forEach(b=>b.onclick=()=>{const a=b.dataset.a;if(a==='fix'){c.burnt=0;AU.play('build')}if(a==='sw'){c.on=!c.on;AU.play('plug')}if(a==='flip'){c.dir=-c.dir;AU.play('plug')}if(a==='del')remove(c);run()})}
  function chips(k,vals,f,cur){return `<div class="chips">${vals.map(v=>`<button class="chip ${v===cur?'cur':''}" data-k="${k}" data-v="${v}">${esc(f(v))}</button>`).join('')}</div>`}
  function alertMsg(html,cls){alertEl.innerHTML=html;alertEl.className='lab-alert '+(cls||'');alertEl.hidden=false;clearTimeout(alertEl._t);alertEl._t=setTimeout(()=>alertEl.hidden=true,3600)}
  function run(noInsp){R=simulate(B);Q=makeQ(B,R);
    R.events.forEach(ev=>{const c=ev.c;S.stats.burns++;const g=geom(c);const rr=svg.getBoundingClientRect();const x=rr.left+g.cx/W*rr.width,y=rr.top+g.cy/H*rr.height;
      FX.burst(x,y,{n:34,speed:6,colors:['#fff3c2','#ffb347','#ff5a4f','#8a8f99']});AU.play(c.t==='fuse'?'smallboom':'zap');shakeEl($('.lab-board',host));
      alertMsg(md(ui('alert.'+ev.k,{lab:c.lab})),'bad');
      if(o.onEvent)o.onEvent(ev)});
    clearTimeout(shortT);
    if(R.shorts.length){S.stats.shorts++;AU.play('alarm');alertMsg(md(ui('alert.short')),'bad');
      const g=geom(R.shorts[0]);const rr=svg.getBoundingClientRect();FX.burst(rr.left+g.cx/W*rr.width,rr.top+g.cy/H*rr.height,{n:30,speed:5,colors:['#fff','#ffb347','#5ee0ff']});if(o.onEvent)o.onEvent({k:'short'});
      shortT=setTimeout(()=>{const R2=simulate(B);if(R2.shorts.length){R2.shorts.forEach(c=>c.burnt=1);AU.play('boom');alertMsg(md(ui('alert.genburn')),'bad');if(o.onEvent)o.onEvent({k:'genburn'});run()}},1900)}
    render(noInsp);if(o.onChange)o.onChange(Q,R)}
  tools();run();
  return {B,get Q(){return Q},get R(){return R},run,setComps(cs){B.comps=cs.map(c=>Object.assign({dir:1},clone(c),{id:++uid}));Object.keys(used).forEach(k=>delete used[k]);B.comps.forEach(c=>{if(!c.lock)used[c.t]=(used[c.t]||0)+1});sel=null;tools();run()},
    select(l){sel=B.comps.find(c=>c.lab===l)||null;render()},alert:alertMsg,destroy(){clearTimeout(shortT)}}}
function toolIcon(t){const m={select:'M7 3l11 9-5 1 3 6-2 1-3-6-4 4z',erase:'M15 3l6 6-10 10H5l-2-2zM9 19h12',wire:'M3 18C8 18 8 6 13 6s5 12 8 12'};
  if(m[t])return `<svg viewBox="0 0 24 24" class="ti" aria-hidden="true"><path d="${m[t]}" class="${t==='wire'?'ln':''}"/></svg>`;
  const inner={gen:'<line x1="2" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="22" y2="12"/><line x1="9" y1="5" x2="9" y2="19"/><line x1="15" y1="8" x2="15" y2="16" style="stroke-width:3.5"/>',
    lamp:'<line x1="1" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="23" y2="12"/><circle cx="12" cy="12" r="7"/><path d="M7 7l10 10M17 7L7 17"/>',
    res:'<line x1="1" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="23" y2="12"/><rect x="5" y="8" width="14" height="8"/>',
    amp:'<circle cx="12" cy="12" r="8"/><text x="12" y="16" text-anchor="middle">A</text>',volt:'<circle cx="12" cy="12" r="8"/><text x="12" y="16" text-anchor="middle">V</text>',motor:'<circle cx="12" cy="12" r="8"/><text x="12" y="16" text-anchor="middle">M</text>',
    sw:'<line x1="1" y1="14" x2="6" y2="14"/><line x1="18" y1="14" x2="23" y2="14"/><line x1="6" y1="14" x2="17" y2="6"/>',fuse:'<line x1="1" y1="12" x2="23" y2="12"/><rect x="6" y="8" width="12" height="8"/>'}[t];
  return `<svg viewBox="0 0 24 24" class="ti sym" aria-hidden="true">${inner}</svg>`}

/* ================= Characters ================= */
const CAST={
  lumi:{n:'Lumi',role:'Asistente del Chronotron',col:'#5ee0ff'},
  ampere:{n:'André-Marie Ampère',role:'París · 1820',col:'#f2a65a'},
  ohm:{n:'Georg Simon Ohm',role:'Colonia · 1827',col:'#9fd47a'},
  baron:{n:'Barón Court-Circuit',role:'Ladrón de electricidad',col:'#c77dff'},
  nar:{n:'',role:'',col:'#a9b4c8'},
  minister:{n:'El ministro Altenstein',role:'Berlín · 1827',col:'#d9c08a'},
  arago:{n:'François Arago',role:'Académie des sciences',col:'#e8b86a'},
  joule:{n:tx('James Prescott Joule','James Prescott Joule'),role:tx('Manchester · 1843','Mánchester · 1843'),col:'#ff9f6b'},
  thomson:{n:tx('William Thomson','William Thomson'),role:tx('Oxford · 1847','Oxford · 1847'),col:'#e8c86a'},
  edison:{n:tx('Thomas Edison','Thomas Edison'),role:tx('New York · 1884','Nueva York · 1884'),col:'#7ec8ff'},
  tesla:{n:tx('Nikola Tesla','Nikola Tesla'),get role(){return S.ch.c4&&S.ch.c4.complete?tx('Grand Maître du Chronotron','Gran Maestro del Chronotron'):tx('Inventeur · New York 1884','Inventor · Nueva York 1884')},col:'#b9a7ff'}};
function face(mood,x,y,s){s=s||1;const e=(dx)=>{const ex=x+dx*s,sg=dx<0?1:-1,ix=ex+7*s*sg,ox=ex-7*s*sg;
    const brow=(oy,iy)=>`<path d="M${ox} ${y+oy*s} L${ix} ${y+iy*s}" class="pf-l"/>`;
    if(mood==='happy')return `<path d="M${ex-6*s} ${y+2*s} Q${ex} ${y-6*s} ${ex+6*s} ${y+2*s}" class="pf-l"/>`;
    if(mood==='angry'||mood==='evil')return `<ellipse cx="${ex}" cy="${y+1*s}" rx="${3.5*s}" ry="${3*s}" class="pf-e"/>`+brow(-11,-5);
    if(mood==='worried'||mood==='sad')return `<ellipse cx="${ex}" cy="${y+1*s}" rx="${3.5*s}" ry="${4*s}" class="pf-e"/>`+brow(-6,-11);
    if(mood==='wow')return `<circle cx="${ex}" cy="${y}" r="${5*s}" class="pf-w"/><circle cx="${ex}" cy="${y}" r="${2.5*s}" class="pf-e"/>`+brow(-12,-13);
    return `<ellipse cx="${ex}" cy="${y}" rx="${3.5*s}" ry="${4.5*s}" class="pf-e"/><circle cx="${ex+1*s}" cy="${y-1.5*s}" r="${1.2*s}" fill="#fff"/>`};
  const m=mood==='happy'?`<path d="M${x-12*s} ${y+30*s} Q${x} ${y+42*s} ${x+12*s} ${y+30*s}" class="pf-m"/>`:mood==='wow'?`<ellipse cx="${x}" cy="${y+34*s}" rx="${6*s}" ry="${8*s}" class="pf-mo"/>`:mood==='angry'||mood==='sad'?`<path d="M${x-11*s} ${y+38*s} Q${x} ${y+30*s} ${x+11*s} ${y+38*s}" class="pf-m"/>`:mood==='evil'?`<path d="M${x-16*s} ${y+30*s} Q${x} ${y+44*s} ${x+16*s} ${y+30*s} Q${x} ${y+36*s} ${x-16*s} ${y+30*s}Z" class="pf-mo"/>`:`<path d="M${x-10*s} ${y+34*s} Q${x} ${y+37*s} ${x+10*s} ${y+34*s}" class="pf-m"/>`;
  return e(-15)+e(15)+m}
const LUMI_SKINS={cuivre:{body:'#b8733d',edge:'#f2a65a',neck:'#8a5a33',glow:'#5ee0ff',cost:0},or:{body:'#c9a227',edge:'#ffe08a',neck:'#8f7019',glow:'#fff3b0',cost:30},
  neon:{body:'#2a1f4a',edge:'#c77dff',neck:'#3a2a66',glow:'#ff5ee6',cost:50},vapeur:{body:'#5a3b22',edge:'#b08d57',neck:'#3d2817',glow:'#ffb347',cost:80}};
/* v1.4 · motor de retratos ilustrados: piel con volumen, ojos con iris y brillo, cejas y boca según el ánimo,
   pelo en capas con mechones, ropa de época (solapas, chaleco, corbatín) y luz de contorno del color del personaje. */
let PUID=0;
const shade=(h,a)=>{const n=parseInt(h.slice(1),16);const f=c=>Math.max(0,Math.min(255,Math.round(c+(a>0?(255-c)*a:c*a))));return '#'+[f(n>>16),f((n>>8)&255),f(n&255)].map(v=>v.toString(16).padStart(2,'0')).join('')};
const CHARS={
  ampere:{skin:'#efcfb0',coat:'#2f4434',vest:'#7a5a34',shirt:'#f4efe4',nk:'cravat',nkc:'#f4efe4',hair:'#3a2a1e',hs:'curly',eye:'#5a4632',brow:3.2,jaw:'round',age:1},
  ohm:{skin:'#ecc9a6',coat:'#1f2a3c',vest:'#4a4f5c',shirt:'#f2f2ea',nk:'stock',nkc:'#1b1b1b',hair:'#6b4a2e',hs:'side',eye:'#4f6f8f',brow:3.4,jaw:'long',fh:'sideburns'},
  arago:{skin:'#e8c4a0',coat:'#253246',vest:'#7a2a2e',shirt:'#f3efe6',nk:'cravat',nkc:'#f3efe6',hair:'#4a3a2c',hs:'wavy',eye:'#3f3a34',brow:3.6,jaw:'square',medal:1},
  minister:{skin:'#e9c6a8',coat:'#3a2b1e',vest:'#5a4a30',shirt:'#f3efe6',nk:'cravat',nkc:'#f3efe6',hair:'#d8d8d8',hs:'bald',eye:'#5a5a5a',brow:3.8,jaw:'square',fh:'muttonchops',age:2,medal:1},
  joule:{skin:'#f0cdb0',coat:'#3b2a1f',vest:'#6a5530',shirt:'#f2ece0',nk:'stock',nkc:'#171310',hair:'#4a2f1c',hs:'side',eye:'#4a5a6a',brow:3,jaw:'round',fh:'chin'},
  thomson:{skin:'#f2d2b4',coat:'#22283a',vest:'#3a4058',shirt:'#f4efe6',nk:'bow',nkc:'#8a2a2e',hair:'#3a2a1e',hs:'wavy',eye:'#4f7f9f',brow:2.8,jaw:'long'},
  edison:{skin:'#efcbaa',coat:'#2e2e34',vest:'#45454c',shirt:'#f3f0e8',nk:'bow',nkc:'#141418',hair:'#cfcfd4',hs:'swept',eye:'#5f7f9f',brow:4.2,browc:'#9a9aa4',jaw:'square',age:1},
  tesla:{skin:'#ecc8a8',coat:'#1b1f2c',vest:'#2a2f40',shirt:'#eef0f5',nk:'tie',nkc:'#4a3a7a',hair:'#141218',hs:'middle',eye:'#6a7fa8',brow:3,jaw:'long',fh:'mustache'},
  baron:{skin:'#e2d4da',coat:'#2a1638',vest:'#121018',shirt:'#e8e0ea',nk:'bow',nkc:'#c77dff',hair:'#141018',hs:'none',eye:'#8a3fbf',brow:3.6,jaw:'sharp',fh:'twirl',hat:1,mono:1}};
function headPath(jaw){const J={round:[37,30,48],long:[35,25,52],square:[38,33,48],sharp:[35,20,52]}[jaw]||[37,30,48];const [w,jw,ch]=J,cx=100,cy=100;
  return `M${cx-w} ${cy-4} C${cx-w} ${cy-40} ${cx-w*.55} ${cy-50} ${cx} ${cy-50} C${cx+w*.55} ${cy-50} ${cx+w} ${cy-40} ${cx+w} ${cy-4} C${cx+w} ${cy+20} ${cx+jw} ${cy+34} ${cx+jw*.45} ${cy+ch-5} Q${cx} ${cy+ch+3} ${cx-jw*.45} ${cy+ch-5} C${cx-jw} ${cy+34} ${cx-w} ${cy+20} ${cx-w} ${cy-4}Z`}
function eyesHTML(C,mood,u){const y=97;let s='';
  [-15,15].forEach(dx=>{const ex=100+dx,sg=dx<0?-1:1;
    if(mood==='happy'){s+=`<path d="M${ex-7} ${y+1} Q${ex} ${y-6} ${ex+7} ${y+1}" stroke="#2a1a12" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M${ex-6} ${y+5} q6 3 12 0" stroke="#c98a6a" stroke-width="1.4" fill="none" opacity=".6"/>`;return}
    const open=mood==='wow'?7:mood==='angry'||mood==='evil'?3.2:mood==='sad'||mood==='worried'?5:5.4,low=mood==='wow'?6:4.6,ir=mood==='wow'?3:3.8;
    s+=`<path d="M${ex-8} ${y} Q${ex} ${y-open*1.3} ${ex+8} ${y} Q${ex} ${y+low} ${ex-8} ${y}Z" fill="#fbf7f2"/>`+
      `<clipPath id="${u}e${dx<0?'l':'r'}"><path d="M${ex-8} ${y} Q${ex} ${y-open*1.3} ${ex+8} ${y} Q${ex} ${y+low} ${ex-8} ${y}Z"/></clipPath>`+
      `<g clip-path="url(#${u}e${dx<0?'l':'r'})"><circle cx="${ex+(mood==='evil'?sg*1.5:0)}" cy="${y+.6}" r="${ir}" fill="${C.eye}"/><circle cx="${ex+(mood==='evil'?sg*1.5:0)}" cy="${y+.6}" r="${ir}" fill="none" stroke="${shade(C.eye,-.5)}" stroke-width="1"/><circle cx="${ex+(mood==='evil'?sg*1.5:0)}" cy="${y+.6}" r="${ir*.48}" fill="#120c0a"/><path d="M${ex-9} ${y-open*.9} Q${ex} ${y-open*1.6} ${ex+9} ${y-open*.9} L${ex+9} ${y-4} Q${ex} ${y-open*.6} ${ex-9} ${y-4}Z" fill="#000" opacity=".12"/></g>`+
      `<circle cx="${ex+1.4}" cy="${y-1.2}" r="1.3" fill="#fff"/><path d="M${ex-8.5} ${y+.3} Q${ex} ${y-open*1.35} ${ex+8.5} ${y+.3}" stroke="#2a1a12" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M${ex+sg*8} ${y} l${sg*2.5} -1.6" stroke="#2a1a12" stroke-width="1.6" stroke-linecap="round"/>`});
  return s}
function browsHTML(C,mood){const y=84,col=C.browc||shade(C.hair==='#d8d8d8'||C.hair==='#cfcfd4'?'#8a8a90':C.hair,-.2),w=C.brow;let s='';
  const tilt={angry:[6,-3],evil:[7,-4],worried:[-5,3],sad:[-5,3],wow:[-5,-5],happy:[-2,-2]}[mood]||[0,0];
  [-1,1].forEach(sg=>{const ix=100+sg*6,ox=100+sg*24;s+=`<path d="M${ix} ${y+tilt[0]*.5+(mood==='wow'?-4:0)} Q${100+sg*15} ${y-4+tilt[1]+(mood==='wow'?-4:0)} ${ox} ${y+1+tilt[1]*.6+(mood==='wow'?-4:0)}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`});return s}
function mouthHTML(mood){const x=100,y=128;
  if(mood==='happy')return `<path d="M${x-13} ${y-2} Q${x} ${y+13} ${x+13} ${y-2} Q${x} ${y+3} ${x-13} ${y-2}Z" fill="#7a2a24"/><path d="M${x-10} ${y} Q${x} ${y+4} ${x+10} ${y} L${x+9} ${y+2} Q${x} ${y+5} ${x-9} ${y+2}Z" fill="#fff"/><path d="M${x-5} ${y+8} q5 2 10 0" stroke="#e07a6a" stroke-width="2" fill="none" opacity=".7"/>`;
  if(mood==='wow')return `<ellipse cx="${x}" cy="${y+3}" rx="6" ry="8" fill="#5a1a18"/><ellipse cx="${x}" cy="${y+7}" rx="3.5" ry="2.5" fill="#c0504a"/>`;
  if(mood==='angry'||mood==='sad')return `<path d="M${x-11} ${y+5} Q${x} ${y-3} ${x+11} ${y+5}" stroke="#8a3a32" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  if(mood==='worried')return `<path d="M${x-10} ${y+3} Q${x-4} ${y-1} ${x} ${y+2} Q${x+5} ${y+5} ${x+10} ${y+1}" stroke="#8a3a32" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  if(mood==='evil')return `<path d="M${x-16} ${y-3} Q${x} ${y+12} ${x+16} ${y-3} Q${x} ${y+3} ${x-16} ${y-3}Z" fill="#3a0e18"/><path d="M${x-13} ${y-1} Q${x} ${y+3} ${x+13} ${y-1} L${x+12} ${y+1} Q${x} ${y+5} ${x-12} ${y+1}Z" fill="#fff"/>`;
  return `<path d="M${x-10} ${y+1} Q${x} ${y+4} ${x+10} ${y+1}" stroke="#8a3a32" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M${x-6} ${y+6} q6 2.5 12 0" stroke="#c97a68" stroke-width="2" fill="none" opacity=".55"/>`}
/* pelo: [capa de atrás, capa de delante] */
function hairHTML(C,u){const h=C.hair,d=shade(h,-.35),l=shade(h,.28),g=`url(#${u}hr)`;const st=(ps,c,w)=>ps.map(p=>`<path d="${p}" stroke="${c}" stroke-width="${w||1.6}" fill="none" stroke-linecap="round" opacity=".75"/>`).join('');
  switch(C.hs){
  case 'curly':{const cs=[[64,64,12],[76,50,12],[92,44,12],[108,44,12],[124,50,12],[136,62,12],[142,78,10],[58,80,10],[60,96,9],[140,96,9]];
    return [`<path d="M58 100 C52 56 78 40 100 42 C124 40 150 54 142 100 L146 120 L132 108 L68 108 L54 120Z" fill="${d}"/>`,
      cs.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${g}"/><path d="M${x-r*.5} ${y-r*.2} q${r*.5} ${-r*.6} ${r} 0" stroke="${l}" stroke-width="1.8" fill="none" opacity=".7"/>`).join('')]}
  case 'side':return [`<path d="M60 100 C56 60 76 44 100 44 C128 44 146 60 140 100 L142 112 L132 96 L68 96 L58 112Z" fill="${d}"/>`,
      `<path d="M62 92 C58 54 84 44 106 46 C134 48 148 66 140 96 C136 80 128 72 112 70 C98 66 84 70 74 80 C68 84 64 88 62 92Z" fill="${g}"/>`+st(['M74 76 Q90 60 112 60','M84 70 Q104 56 128 64','M96 66 Q118 58 136 76','M70 82 Q72 66 86 56'],l)+`<path d="M78 58 Q96 50 120 54" stroke="${d}" stroke-width="2.4" fill="none"/>`];
  case 'wavy':return [`<path d="M58 104 C50 58 76 40 100 42 C126 40 152 56 142 104 L148 124 L134 104 L66 104 L52 124Z" fill="${d}"/>`,
      `<path d="M60 96 C54 56 82 42 104 44 C130 46 150 62 140 98 C136 84 128 74 118 72 C112 66 100 70 90 66 C80 70 70 76 66 88Z" fill="${g}"/>`+[[70,66],[86,54],[104,50],[122,56],[136,70]].map(([x,y])=>`<path d="M${x-9} ${y+4} q9 -14 18 0" fill="${h}"/>`).join('')+st(['M68 84 Q76 70 92 66','M96 62 Q112 56 128 66','M120 72 Q132 76 138 90'],l)];
  case 'swept':return [`<path d="M60 98 C56 62 76 46 100 46 C126 46 146 62 140 98 L140 110 L60 110Z" fill="${d}"/>`,
      `<path d="M60 92 C56 60 78 44 100 46 C124 44 146 58 140 92 C134 74 122 66 104 64 C90 62 76 70 66 80Z" fill="${g}"/><path d="M86 52 q16 -26 44 -10 q-18 -2 -26 14z" fill="${g}"/>`+st(['M70 76 Q86 58 112 58','M90 52 Q108 36 126 42','M104 62 Q122 60 134 76','M66 84 Q68 70 78 62'],l)];
  case 'middle':return [`<path d="M64 98 C58 58 82 44 100 46 C118 44 142 58 136 98 L138 108 L62 108Z" fill="${d}"/>`,
      `<path d="M64 96 C58 54 84 42 100 46 C116 42 142 54 136 96 C132 74 120 62 104 62 L100 54 L96 62 C80 62 68 74 64 96Z" fill="${g}"/>`+st(['M96 58 Q82 60 70 80','M92 62 Q78 68 68 88','M104 58 Q118 60 130 80','M108 62 Q122 68 132 88'],l,1.4)+`<path d="M100 50 V60" stroke="${shade(h,.5)}" stroke-width="1.2" opacity=".6"/>`];
  case 'bald':return [``,`<path d="M62 96 C58 80 62 66 70 60 C66 74 68 86 70 98Z M138 96 C142 80 138 66 130 60 C134 74 132 86 130 98Z" fill="${g}"/>`+st(['M64 90 Q64 76 70 66','M136 90 Q136 76 130 66'],l)+`<ellipse cx="88" cy="62" rx="14" ry="6" fill="#fff" opacity=".22" transform="rotate(-18 88 62)"/>`];
  default:return ['',''];}}
function facialHTML(C,u){const h=C.hair,g=`url(#${u}hr)`,l=shade(h,.28);
  switch(C.fh){
  case 'sideburns':return `<path d="M63 92 Q61 116 70 128 L74 104Z M137 92 Q139 116 130 128 L126 104Z" fill="${g}"/>`;
  case 'muttonchops':return `<path d="M62 90 Q58 126 78 136 Q84 124 76 112 Q72 100 70 92Z M138 90 Q142 126 122 136 Q116 124 124 112 Q128 100 130 92Z" fill="${g}"/>`;
  case 'chin':return `<path d="M63 98 Q60 148 100 156 Q140 148 137 98 Q136 128 122 138 Q110 132 100 140 Q90 132 78 138 Q64 128 63 98Z" fill="${g}"/>`+[0,1,2,3,4,5].map(i=>`<path d="M${70+i*12} ${136+Math.abs(2.5-i)*-2} q2 8 0 14" stroke="${l}" stroke-width="1.3" fill="none" opacity=".6"/>`).join('');
  case 'mustache':return `<path d="M83 121 Q92 114 100 119 Q108 114 117 121 Q110 125 100 123 Q90 125 83 121Z" fill="${g}"/>`;
  case 'twirl':return `<path d="M78 122 C88 114 96 118 100 120 C104 118 112 114 122 122 C116 120 110 124 100 124 C90 124 84 120 78 122Z" fill="${h}"/><path d="M78 122 q-12 -2 -12 -14 M122 122 q12 -2 12 -14" stroke="${h}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  default:return ''}}
function neckwear(C){const c=C.nkc,d=shade(c,-.3);switch(C.nk){
  case 'cravat':return `<path d="M84 166 Q100 178 116 166 L112 184 Q100 192 88 184Z" fill="${c}"/><path d="M90 182 Q100 204 96 214 Q104 204 110 182" fill="${shade(c,-.08)}"/><path d="M90 172 Q100 180 110 172" stroke="${d}" stroke-width="1.4" fill="none" opacity=".6"/>`;
  case 'stock':return `<path d="M84 164 Q100 176 116 164 L116 178 Q100 188 84 178Z" fill="${c}"/><path d="M86 170 Q100 180 114 170" stroke="${shade(c,.3)}" stroke-width="1.2" fill="none" opacity=".5"/>`;
  case 'bow':return `<path d="M86 172 L99 178 L86 186Z M114 172 L101 178 L114 186Z" fill="${c}"/><circle cx="100" cy="178" r="3.4" fill="${d}"/><path d="M88 176 l6 2 M112 176 l-6 2" stroke="${shade(c,.35)}" stroke-width="1" opacity=".6"/>`;
  case 'tie':return `<path d="M95 172 L105 172 L103 180 L107 214 L100 222 L93 214 L97 180Z" fill="${c}"/><path d="M100 182 L102 212" stroke="${shade(c,.3)}" stroke-width="1" opacity=".5"/>`;
  default:return ''}}
function bodyHTML(C,u){const c=C.coat;
  return `<path d="M8 240 C12 190 52 170 100 168 C148 170 188 190 192 240Z" fill="url(#${u}c)"/>`+
    `<path d="M80 172 L100 214 L120 172 L132 240 L68 240Z" fill="${C.vest}"/><path d="M80 172 L100 214 L120 172" stroke="${shade(C.vest,-.35)}" stroke-width="1.2" fill="none"/>`+
    [204,220,236].map(y=>`<circle cx="100" cy="${y}" r="2.6" fill="#c9a227" stroke="#6b5414" stroke-width=".8"/>`).join('')+
    `<path d="M84 166 L100 208 L116 166 Q100 174 84 166Z" fill="${C.shirt}"/><path d="M86 168 L94 182 L84 184Z M114 168 L106 182 L116 184Z" fill="${shade(C.shirt,-.06)}"/>`+
    `<path d="M80 170 L60 180 L74 204 L72 240 L94 240 L98 222Z" fill="${shade(c,-.22)}"/><path d="M120 170 L140 180 L126 204 L128 240 L106 240 L102 222Z" fill="${shade(c,-.3)}"/>`+
    `<path d="M80 170 L60 180 L74 204" stroke="${shade(c,.3)}" stroke-width="1.6" fill="none" opacity=".7"/><path d="M120 170 L140 180 L126 204" stroke="${shade(c,.15)}" stroke-width="1.4" fill="none" opacity=".5"/>`+
    `<path d="M30 220 Q40 206 52 200 M170 220 Q160 206 148 200 M44 240 Q48 226 58 218" stroke="${shade(c,-.45)}" stroke-width="2" fill="none" opacity=".55"/>`+
    `<path d="M14 236 C20 196 56 178 100 174" stroke="#fff" stroke-opacity=".12" stroke-width="3" fill="none"/>`+
    (C.medal?`<g transform="translate(140 206)"><path d="M-5 -14 L0 -2 L5 -14Z" fill="#8a2a2e"/><circle r="6.5" fill="#e8c86a" stroke="#8a6a1a" stroke-width="1.2"/><path d="M0 -4 L1.4 -1 L4.5 -1 L2 1 L3 4.4 L0 2.4 L-3 4.4 L-2 1 L-4.5 -1 L-1.4 -1Z" fill="#fff6c8"/></g>`:'')}
function humanHTML(id,mood,u){const C=CHARS[id];const sk=C.skin,skd=shade(sk,-.22),skl=shade(sk,.35),col=(CAST[id]||{}).col||'#5ee0ff';const hp=headPath(C.jaw);
  const defs=`<defs><radialGradient id="${u}s" cx=".36" cy=".34" r=".8"><stop offset="0" stop-color="${skl}"/><stop offset=".55" stop-color="${sk}"/><stop offset="1" stop-color="${skd}"/></radialGradient>
    <linearGradient id="${u}c" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${shade(C.coat,.25)}"/><stop offset=".6" stop-color="${C.coat}"/><stop offset="1" stop-color="${shade(C.coat,-.4)}"/></linearGradient>
    <linearGradient id="${u}hr" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${shade(C.hair,.18)}"/><stop offset="1" stop-color="${shade(C.hair,-.25)}"/></linearGradient>
    <linearGradient id="${u}rim" x1="0" y1="0" x2="1" y2="0"><stop offset=".6" stop-color="${col}" stop-opacity="0"/><stop offset="1" stop-color="${col}" stop-opacity=".55"/></linearGradient>
    <clipPath id="${u}hc"><path d="${hp}"/></clipPath></defs>`;
  const [hb,hf]=hairHTML(C,u);
  return defs+hb+`<path d="M88 128 L112 128 L114 172 Q100 180 86 172Z" fill="${skd}"/><path d="M86 140 Q100 152 114 140 L114 160 Q100 168 86 160Z" fill="#000" opacity=".14"/>`+bodyHTML(C,u)+
    `<path d="M84 156 L86 176 L100 166 L114 176 L116 156 Q100 164 84 156Z" fill="${C.shirt}"/><path d="M84 156 Q100 164 116 156" stroke="${shade(C.shirt,-.25)}" stroke-width="1.2" fill="none"/><path d="M86 176 L100 166 L114 176" stroke="${shade(C.shirt,-.2)}" stroke-width="1" fill="none" opacity=".7"/>`+neckwear(C)+
    `<ellipse cx="63" cy="104" rx="8" ry="12" fill="${skd}"/><ellipse cx="137" cy="104" rx="8" ry="12" fill="${skd}"/><path d="M60 98 q4 6 0 12 M140 98 q-4 6 0 12" stroke="${shade(skd,-.3)}" stroke-width="2" fill="none" opacity=".5"/>`+
    `<path d="${hp}" fill="url(#${u}s)"/>`+
    `<g clip-path="url(#${u}hc)"><path d="M118 40 Q146 90 120 160 L160 160 L160 40Z" fill="${shade(sk,-.5)}" opacity=".18"/><ellipse cx="100" cy="150" rx="34" ry="10" fill="${shade(sk,-.5)}" opacity=".12"/><rect x="40" y="40" width="130" height="130" fill="url(#${u}rim)"/>${C.age>1?`<path d="M80 74 q20 -5 40 0 M84 79 q16 -3 32 0" stroke="${skd}" stroke-width="1.1" fill="none" opacity=".55"/>`:''}${C.age?`<path d="M74 104 q4 3 8 2 M126 104 q-4 3 -8 2" stroke="${skd}" stroke-width="1" fill="none" opacity=".6"/>`:''}</g>`+
    `<ellipse cx="78" cy="114" rx="9" ry="5.5" fill="#e0786a" opacity="${mood==='happy'||mood==='wow'?.32:.18}"/><ellipse cx="122" cy="114" rx="9" ry="5.5" fill="#e0786a" opacity="${mood==='happy'||mood==='wow'?.32:.18}"/>`+
    (C.fh==='mustache'||C.fh==='twirl'?'':facialHTML(C,u))+eyesHTML(C,mood,u)+browsHTML(C,mood)+
    `<path d="M99 100 Q93 114 96 118 Q100 121 105 118" stroke="${shade(sk,-.35)}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".75"/><path d="M101 98 Q103 108 103 112" stroke="#fff" stroke-width="2" opacity=".35" stroke-linecap="round"/><ellipse cx="96" cy="118" rx="2" ry="1.2" fill="${shade(sk,-.5)}" opacity=".5"/><ellipse cx="104" cy="118" rx="2" ry="1.2" fill="${shade(sk,-.5)}" opacity=".5"/>`+
    mouthHTML(mood)+(C.fh==='mustache'||C.fh==='twirl'?facialHTML(C,u):'')+
    hf+
    (C.hat?`<path d="M58 66 L62 18 Q100 10 138 18 L142 66Z" fill="#0e0b14"/><path d="M62 18 Q100 10 138 18 L138 26 Q100 18 62 26Z" fill="#2a2234"/><rect x="60" y="50" width="80" height="10" fill="${CAST.baron.col}"/><path d="M40 70 Q100 54 160 70 Q160 80 150 80 Q100 68 50 80 Q40 80 40 70Z" fill="#0e0b14"/><path d="M70 22 L74 62" stroke="#fff" stroke-opacity=".12" stroke-width="5"/>`:'')+
    (C.mono?`<circle cx="115" cy="97" r="11" fill="#fff" fill-opacity=".08" stroke="#e8c86a" stroke-width="2.4"/><path d="M109 91 q4 -3 9 -1" stroke="#fff" stroke-width="1.6" opacity=".7" fill="none"/><path d="M125 101 q14 22 6 44" stroke="#e8c86a" stroke-width="1.3" fill="none"/>`:'')}
function portrait(id,mood){mood=mood||'neutral';const u='pt'+(++PUID);let s='';const col=(CAST[id]||{}).col||'#5ee0ff';
  if(id==='baron'&&mood==='neutral')mood='evil';
  if(id==='lumi'){const K=LUMI_SKINS[S.lumiSkin]||LUMI_SKINS.cuivre;const glow=mood==='worried'?'#ffb347':mood==='angry'?'#ff5a4f':K.glow;
    s=`<defs><radialGradient id="${u}l" cx=".4" cy=".35"><stop offset="0" stop-color="#ffffff" stop-opacity="1"/><stop offset=".55" stop-color="${glow}" stop-opacity=".6"/><stop offset="1" stop-color="${glow}" stop-opacity=".25"/></radialGradient>
      <linearGradient id="${u}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(K.body,.3)}"/><stop offset=".55" stop-color="${K.body}"/><stop offset="1" stop-color="${shade(K.body,-.35)}"/></linearGradient></defs>
      <g class="lumi-float"><ellipse cx="100" cy="230" rx="46" ry="7" fill="#000" opacity=".35"/>
      <path d="M60 150 Q60 128 100 128 Q140 128 140 150 L134 206 Q100 222 66 206Z" fill="url(#${u}b)" stroke="${K.edge}" stroke-width="3"/><path d="M70 160 L130 160 M72 190 L128 190" stroke="${shade(K.body,-.4)}" stroke-width="1.5" opacity=".6"/><circle cx="100" cy="176" r="13" fill="#1a2232" stroke="${glow}" stroke-width="3"/><circle cx="100" cy="176" r="18" fill="none" stroke="${glow}" stroke-opacity=".25" stroke-width="4"/><path d="M95 170l8 6-8 6" fill="none" stroke="${glow}" stroke-width="3"/>
      <rect x="84" y="112" width="32" height="20" rx="4" fill="${K.neck}"/><path d="M84 118h32M84 124h32" stroke="${K.edge}" stroke-width="2"/>
      <circle cx="100" cy="72" r="48" fill="#0f1a26"/><circle cx="100" cy="72" r="48" fill="url(#${u}l)" stroke="#c9eefe" stroke-width="3"/><circle cx="100" cy="72" r="42" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="2"/><path d="M88 108 Q92 84 100 92 Q108 84 112 108" fill="none" stroke="#ffcf73" stroke-width="2.5"/><path d="M92 100 Q100 90 108 100" fill="none" stroke="#fff3c2" stroke-width="1.2" opacity=".8"/>
      <path d="M70 50 Q80 30 104 28" stroke="#fff" stroke-opacity=".55" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M128 92 Q138 80 140 66" stroke="#fff" stroke-opacity=".2" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${[[72,148],[128,148],[74,196],[126,196]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.6" fill="${K.edge}" opacity=".8"/>`).join('')}<path d="M66 150 Q100 140 134 150" stroke="#fff" stroke-opacity=".22" stroke-width="2" fill="none"/>
      <path d="M100 24V8" stroke="${K.edge}" stroke-width="3"/><circle cx="100" cy="6" r="5" fill="${glow}" class="lumi-ant"/>${face(mood,100,62,1)}<path d="M52 150 Q34 160 40 184" stroke="${K.body}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M148 150 Q166 158 162 182" stroke="${K.body}" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="40" cy="186" r="5" fill="${K.edge}"/><circle cx="162" cy="184" r="5" fill="${K.edge}"/></g>`}
  else if(CHARS[id]){s=humanHTML(id,mood,u);
    if(id==='baron')s=`<path d="M2 240 C6 168 50 146 100 146 C150 146 194 168 198 240Z" fill="#4a1f66"/><path d="M14 240 C20 176 56 156 100 156 C144 156 180 176 186 240Z" fill="#1a0f24"/>`+s+`<path d="M98 200 l-12 18 h10 l-5 20 20-27 h-10 l7-11z" fill="#c77dff" opacity=".9"/>`;
    if(id==='tesla')s=`<g class="tesla-arc" opacity=".85"><path d="M18 148 l18 10 -10 6 20 14 M182 148 l-18 10 10 6 -20 14" stroke="#b9a7ff" stroke-width="3" fill="none" stroke-linejoin="round"/><circle cx="100" cy="104" r="80" fill="none" stroke="#b9a7ff" stroke-opacity=".25" stroke-width="2" stroke-dasharray="4 9"/></g>`+s}
  if(!s)s=`<path d="M14 240 C18 186 56 166 100 166 C144 166 182 186 186 240Z" fill="#1c2232"/><ellipse cx="100" cy="104" rx="38" ry="46" fill="#1c2232"/><text x="100" y="122" text-anchor="middle" font-family="IM Fell English SC,serif" font-size="54" fill="#3d4862">?</text>`;
  const halo=id!=='lumi'&&id!=='nar'?`<defs><radialGradient id="${u}h" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="${col}" stop-opacity=".34"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient></defs><ellipse cx="100" cy="140" rx="98" ry="104" fill="url(#${u}h)"/>`:'';
  return `<svg viewBox="0 0 200 240" class="portrait" aria-hidden="true">${halo}${s}</svg>`}

/* ================= Scenes ================= */
function scene(id){const W=1000,H=560;const st=n=>Array.from({length:n},(_,i)=>`<circle cx="${(i*137.5)%W}" cy="${(i*53)%260}" r="${i%5?0.8:1.4}" fill="#fff" opacity="${.3+(i%3)*.2}"/>`).join('');
  const S={
  museum:`<defs><linearGradient id="smu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1120"/><stop offset="1" stop-color="#1b2133"/></linearGradient><radialGradient id="sring"><stop offset=".55" stop-color="#5ee0ff" stop-opacity="0"/><stop offset=".7" stop-color="#5ee0ff" stop-opacity=".55"/><stop offset="1" stop-color="#5ee0ff" stop-opacity="0"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#smu)"/>${[80,300,700,920].map(x=>`<rect x="${x-26}" y="0" width="52" height="420" fill="#141a2b"/><rect x="${x-34}" y="0" width="68" height="20" fill="#1c2438"/>`).join('')}
    <rect x="0" y="420" width="${W}" height="140" fill="#10131d"/><path d="M0 420H${W}" stroke="#2b3550" stroke-width="3"/>
    ${[[150,330],[420,340],[820,330]].map(([x,y])=>`<rect x="${x-60}" y="${y}" width="120" height="90" fill="#0e1424" stroke="#3b4a6b"/><rect x="${x-56}" y="${y-70}" width="112" height="70" fill="rgba(140,200,255,.06)" stroke="#3b4a6b"/>`).join('')}
    <path d="M420 318 l-58 -14 v-36 l58 14z" fill="#f1e4c7" stroke="#a8743e" stroke-width="2"/><path d="M420 318 l58 -14 v-36 l-58 14z" fill="#e8d6b0" stroke="#a8743e" stroke-width="2"/><path d="M372 278 l40 10 M372 288 l40 10 M428 288 l40 -10 M428 298 l40 -10" stroke="#a8743e" stroke-width="1.5"/><circle cx="150" cy="300" r="20" fill="none" stroke="#c9a227" stroke-width="3"/><path d="M150 300 l12 -8" stroke="#ff5a4f" stroke-width="3"/>
    <circle cx="620" cy="250" r="150" fill="url(#sring)" class="ring-pulse"/><circle cx="620" cy="250" r="110" fill="none" stroke="#b8733d" stroke-width="16"/><circle cx="620" cy="250" r="110" fill="none" stroke="#5ee0ff" stroke-width="2" stroke-dasharray="6 10" class="spinr"/>`,
  paris:`<defs><linearGradient id="spa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1d16"/><stop offset="1" stop-color="#3d2a1e"/></linearGradient><linearGradient id="sps" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f3f6e"/><stop offset="1" stop-color="#e2895a"/></linearGradient><radialGradient id="scand"><stop offset="0" stop-color="#ffd27a" stop-opacity=".6"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#spa)"/><rect x="600" y="60" width="300" height="230" fill="url(#sps)"/><path d="M600 290 V220 h30 v-20 h20 v20 h40 l20 -30 20 30 h50 v-40 h14 v40 h40 l30 -24 26 24 V290Z" fill="#1d1620"/><path d="M600 60h300v230H600zM750 60v230M600 175h300" stroke="#6b4a2e" stroke-width="10" fill="none"/>
    ${[0,1,2].map(i=>`<rect x="${70+i*0}" y="${80+i*70}" width="380" height="10" fill="#5a3b22"/>`).join('')}${Array.from({length:12},(_,i)=>`<rect x="${86+i*30}" y="${50+(i%3)*70}" width="18" height="30" rx="4" fill="${['#6b8f6b','#8a6b9a','#b88a4a','#4f7f9a'][i%4]}" opacity=".8"/>`).join('')}
    <rect x="0" y="380" width="${W}" height="180" fill="#2b1c12"/><rect x="40" y="360" width="920" height="26" fill="#6b4626"/>
    <g>${Array.from({length:10},(_,i)=>`<rect x="160" y="${353-i*8}" width="40" height="7" fill="${i%2?'#b8733d':'#9aa3ad'}"/>`).join('')}<path d="M200 300 q30 -20 70 40" stroke="#c9a227" stroke-width="2" fill="none"/></g>
    <circle cx="300" cy="350" r="22" fill="#e9dcc0" stroke="#6b4626" stroke-width="4"/><path d="M300 350 l14 -8" stroke="#c0392b" stroke-width="3"/>
    ${[460,840].map(x=>`<circle cx="${x}" cy="300" r="70" fill="url(#scand)"/><rect x="${x-5}" y="310" width="10" height="50" fill="#efe6d0"/><path d="M${x} 296 q6 8 0 14 q-6 -6 0 -14z" fill="#ffcf5a"/>`).join('')}`,
  academie:`<defs><linearGradient id="sac" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a22"/><stop offset="1" stop-color="#5a3c2a"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#sac)"/>
    ${[100,260,740,900].map(x=>`<rect x="${x-24}" y="40" width="48" height="380" fill="#c9b48a"/><rect x="${x-34}" y="30" width="68" height="18" fill="#dcc79c"/><rect x="${x-34}" y="412" width="68" height="18" fill="#dcc79c"/>`).join('')}
    <path d="M330 40 h340 v260 h-340z" fill="#7a1f24"/><path d="M330 40 q170 60 340 0" fill="#9a2a30"/><circle cx="500" cy="60" r="34" fill="#e6c55a" opacity=".85"/>
    <rect x="0" y="430" width="${W}" height="130" fill="#2b1c14"/>${[0,1,2].map(r=>Array.from({length:9},(_,i)=>`<rect x="${40+i*110+r*20}" y="${450+r*36}" width="80" height="22" rx="4" fill="#4a3022"/>`).join('')).join('')}`,
  cologne:`<defs><linearGradient id="sco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#23302a"/><stop offset="1" stop-color="#34433a"/></linearGradient><linearGradient id="scs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a5a7a"/><stop offset="1" stop-color="#c8a07a"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#sco)"/><rect x="80" y="70" width="460" height="250" fill="#1e2b24" stroke="#6b4a2e" stroke-width="12"/>
    <g fill="none" stroke="#e8efe6" stroke-width="3" opacity=".85"><path d="M120 130 h120 M120 170 q40 -30 80 0 t80 0 M120 230 l60 -50 l60 50"/></g><text x="300" y="150" fill="#e8efe6" font-family="IM Fell English SC,serif" font-size="34" opacity=".85">X = a / (b + x)</text><text x="300" y="260" fill="#e8efe6" font-family="IM Fell English SC,serif" font-size="28" opacity=".7">Die galvanische Kette</text>
    <rect x="640" y="70" width="280" height="250" fill="url(#scs)"/><path d="M700 320 V200 l20 -40 20 40 V320 M800 320 V230 l14 -30 14 30 V320" fill="#232020"/><path d="M806 200 l40 -30 M846 170 v20" stroke="#232020" stroke-width="5"/><path d="M640 70h280v250H640zM780 70v250" stroke="#6b4a2e" stroke-width="10" fill="none"/>
    <rect x="0" y="400" width="${W}" height="160" fill="#2a2018"/>${Array.from({length:4},(_,i)=>`<rect x="${60+i*240}" y="420" width="190" height="24" fill="#5a3c22"/><rect x="${70+i*240}" y="444" width="10" height="70" fill="#4a3020"/><rect x="${230+i*240}" y="444" width="10" height="70" fill="#4a3020"/>`).join('')}`,
  berlin:`<defs><linearGradient id="sbe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2a35"/><stop offset="1" stop-color="#3d3a45"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#sbe)"/>
    ${[120,420,720].map(x=>`<rect x="${x}" y="70" width="160" height="200" fill="#6b5a3a"/><rect x="${x+12}" y="82" width="136" height="176" fill="#3a3540"/><circle cx="${x+80}" cy="150" r="36" fill="#5a5060"/>`).join('')}
    <rect x="0" y="400" width="${W}" height="160" fill="#211d22"/><rect x="250" y="360" width="500" height="40" fill="#5a3a22"/><rect x="270" y="400" width="20" height="120" fill="#4a3020"/><rect x="710" y="400" width="20" height="120" fill="#4a3020"/><rect x="420" y="345" width="90" height="16" fill="#efe6d0"/>`,
  manchester:`<defs><linearGradient id="smc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22140e"/><stop offset="1" stop-color="#3f2618"/></linearGradient><linearGradient id="smk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3a44"/><stop offset=".7" stop-color="#b8704a"/><stop offset="1" stop-color="#e8a060"/></linearGradient><linearGradient id="scu" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6b3a1c"/><stop offset=".3" stop-color="#c98048"/><stop offset=".45" stop-color="#f0b070"/><stop offset=".7" stop-color="#a0602e"/><stop offset="1" stop-color="#5a2e14"/></linearGradient><radialGradient id="sgas"><stop offset="0" stop-color="#ffd68a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd68a" stop-opacity="0"/></radialGradient><linearGradient id="sfl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2416"/><stop offset="1" stop-color="#1a0f08"/></linearGradient><linearGradient id="spipe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0a070"/><stop offset=".5" stop-color="#9a5a2e"/><stop offset="1" stop-color="#5a3018"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#smc)"/>${Array.from({length:14},(_,r)=>Array.from({length:22},(_,i)=>`<rect x="${(i*48)+(r%2?-24:0)}" y="${r*30}" width="44" height="26" rx="2" fill="${(i*7+r*5)%9?'#4a2a1c':'#5a3020'}" opacity="${.32+((i*7+r*3)%5)*.06}"/>`).join('')).join('')}
    <rect x="0" y="0" width="${W}" height="${H}" fill="#000" opacity=".12"/>
    <path d="M0 96 H600 M560 96 V40 H1000" stroke="url(#spipe)" stroke-width="16" fill="none"/>${[120,300,480].map(x=>`<rect x="${x-6}" y="86" width="12" height="20" rx="2" fill="#7a4a24"/>`).join('')}<circle cx="560" cy="96" r="13" fill="#9a5a2e" stroke="#e0a070" stroke-width="2"/><path d="M552 96 h16 M560 88 v16" stroke="#3a2010" stroke-width="3"/>
    <rect x="620" y="56" width="300" height="220" fill="url(#smk)"/><path d="M620 276 V200 h40 v-90 h22 v90 h50 v-60 h26 v60 h60 v-120 h24 v120 h78 V276Z" fill="#1e1618"/>${[[663,100],[737,140],[880,66]].map(([x,y])=>`<g opacity=".55"><circle cx="${x}" cy="${y}" r="16" fill="#8a8590" opacity=".5"/><circle cx="${x+14}" cy="${y-22}" r="20" fill="#8a8590" opacity=".35"/><circle cx="${x+34}" cy="${y-40}" r="24" fill="#8a8590" opacity=".22"/></g>`).join('')}${[[690,230],[770,250],[850,220]].map(([x,y])=>`<rect x="${x}" y="${y}" width="8" height="10" fill="#ffcf73" opacity=".8"/>`).join('')}
    <path d="M620 56h300v220H620zM770 56v220M620 166h300" stroke="#5a3a22" stroke-width="10" fill="none"/><rect x="606" y="272" width="328" height="14" fill="#6b4626"/>
    <circle cx="560" cy="200" r="90" fill="url(#sgas)"/><path d="M560 120 v54" stroke="#2a1a10" stroke-width="5"/><path d="M546 174 h28 l-4 30 h-20z" fill="#3a2a1a" stroke="#c9a227" stroke-width="2"/><path d="M560 196 q-6 -10 0 -18 q6 8 0 18z" fill="#ffd68a"/>
    <rect x="0" y="400" width="${W}" height="160" fill="url(#sfl)"/>${Array.from({length:12},(_,i)=>`<path d="M${i*90-40} ${H} L${500+(i-6)*30} 400" stroke="#120a06" stroke-width="2" opacity=".5"/>`).join('')}<path d="M0 400H${W}" stroke="#6b4a2a" stroke-width="4"/>
    <g>${[[60,350],[60,300],[110,350]].map(([x,y])=>`<ellipse cx="${x}" cy="${y+25}" rx="34" ry="12" fill="#3a2010"/><rect x="${x-34}" y="${y-25}" width="68" height="50" fill="#6b4226"/><path d="M${x-34} ${y-10}h68M${x-34} ${y+10}h68" stroke="#3a2a1a" stroke-width="4"/><ellipse cx="${x}" cy="${y-25}" rx="34" ry="10" fill="#7a5032" stroke="#3a2a1a" stroke-width="3"/>`).join('')}</g>
    ${[[250,240,140],[440,270,110]].map(([x,y,w])=>`<ellipse cx="${x}" cy="400" rx="${w/2+8}" ry="12" fill="#000" opacity=".35"/><rect x="${x-w/2}" y="${y}" width="${w}" height="${400-y}" fill="url(#scu)"/><ellipse cx="${x}" cy="${y}" rx="${w/2}" ry="16" fill="#f0b070"/><ellipse cx="${x}" cy="${y}" rx="${w/2-10}" ry="10" fill="#2a1408"/><path d="M${x-w/2} ${y+40}h${w}M${x-w/2} ${y+100}h${w}" stroke="#5a3010" stroke-width="5"/>${[0,1,2,3,4,5].map(i=>`<circle cx="${x-w/2+10+i*(w-20)/5}" cy="${y+40}" r="2.4" fill="#f0c080"/>`).join('')}<path d="M${x-10} ${y-20} q-12 -30 6 -50 q14 -20 0 -40 M${x+12} ${y-24} q12 -26 -4 -46" stroke="#d9d4cc" stroke-width="6" fill="none" opacity=".25" class="steam"/><rect x="${x+w/2-4}" y="${y+130}" width="26" height="10" fill="#9a5a2e"/><circle cx="${x+w/2+24}" cy="${y+135}" r="8" fill="#c9a227"/>`).join('')}
    <rect x="337" y="186" width="12" height="176" rx="6" fill="#efe6d0" stroke="#8a7350" stroke-width="2"/><rect x="340" y="268" width="6" height="90" fill="#d1312b"/><circle cx="343" cy="364" r="11" fill="#d1312b" stroke="#8a7350" stroke-width="2"/>${[200,220,240,260,280,300,320,340].map(y=>`<path d="M337 ${y}h6" stroke="#5a4a3a" stroke-width="1.5"/>`).join('')}
    <path d="M540 380 h150 v-36 h-150z" fill="#5a3a22" stroke="#3a2414" stroke-width="3"/><path d="M560 344 q20 -40 40 0 t40 0 t30 -10" stroke="#c9a227" stroke-width="3" fill="none"/><rect x="560" y="352" width="40" height="22" fill="#2a1a10"/><rect x="616" y="352" width="56" height="22" rx="3" fill="#20283a" stroke="#c9a227"/><text x="644" y="368" text-anchor="middle" font-family="Share Tech Mono,monospace" font-size="13" fill="#5ee0ff">J</text>`,
  newyork:`<defs><linearGradient id="sny" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070d26"/><stop offset=".7" stop-color="#26305e"/><stop offset="1" stop-color="#4a4070"/></linearGradient><radialGradient id="snl"><stop offset="0" stop-color="#f4f8ff" stop-opacity=".85"/><stop offset=".35" stop-color="#dbe8ff" stop-opacity=".25"/><stop offset="1" stop-color="#dbe8ff" stop-opacity="0"/></radialGradient><radialGradient id="smoon"><stop offset=".7" stop-color="#fff6dc"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0"/></radialGradient><linearGradient id="sst" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2632"/><stop offset="1" stop-color="#121018"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#sny)"/>${st(70)}<circle cx="860" cy="80" r="40" fill="url(#smoon)" opacity=".9"/><circle cx="848" cy="72" r="30" fill="#fff6dc" opacity=".85"/><circle cx="858" cy="66" r="5" fill="#e8dcc0"/><circle cx="840" cy="82" r="4" fill="#e8dcc0"/>
    <path d="M0 300 Q200 240 420 270 L600 230 L640 160 L660 230 L700 240 L720 170 L740 240 L1000 260 V420 H0Z" fill="#141834" opacity=".8"/>
    <path d="M560 250 L580 120 L600 250 M680 250 L700 120 L720 250" stroke="#2a2f4e" stroke-width="10" fill="none"/><path d="M420 260 Q580 150 640 250 Q700 150 860 260" stroke="#2a2f4e" stroke-width="3" fill="none"/>${Array.from({length:14},(_,i)=>`<path d="M${440+i*30} ${260-Math.sin((i+1)/15*Math.PI)*90} V262" stroke="#2a2f4e" stroke-width="1.2"/>`).join('')}
    ${[[0,180,150],[150,120,130],[280,210,110],[390,90,150],[540,160,120],[660,60,160],[820,140,180]].map(([x,y,w],b)=>`<rect x="${x}" y="${y}" width="${w}" height="${420-y}" fill="${b%2?'#141933':'#1b2140'}"/><rect x="${x}" y="${y}" width="${w}" height="8" fill="${b%2?'#20264a':'#262d55'}"/><path d="M${x+w-10} ${y} V420" stroke="#000" stroke-opacity=".25" stroke-width="20"/>`+Array.from({length:Math.floor((400-y)/34)},(_,r)=>Array.from({length:Math.floor(w/30)},(_,c)=>((b*13+r*7+c*5)%4)?`<rect x="${x+10+c*30}" y="${y+16+r*34}" width="14" height="18" fill="${((b+r+c)%3)?'#ffd27a':'#7ec8ff'}" opacity="${((b+r+c)%3)?.85:.35}"/><rect x="${x+10+c*30}" y="${y+24+r*34}" width="14" height="1.5" fill="#000" opacity=".35"/>`:'').join('')).join('')).join('')}
    <rect x="0" y="330" width="${W}" height="16" fill="#2a2430"/>${Array.from({length:21},(_,i)=>`<rect x="${i*50}" y="346" width="6" height="74" fill="#2a2430"/>`).join('')}<g class="el-train"><rect x="40" y="304" width="230" height="28" rx="6" fill="#4a2a24"/>${[0,1,2,3,4,5,6].map(i=>`<rect x="${52+i*30}" y="310" width="18" height="12" fill="#ffd27a" opacity=".9"/>`).join('')}<rect x="270" y="310" width="10" height="16" fill="#3a2a24"/></g>
    ${[120,470,840].map(x=>`<rect x="${x-4}" y="160" width="8" height="270" fill="#3a2e24"/><rect x="${x-40}" y="170" width="80" height="6" fill="#3a2e24"/><rect x="${x-30}" y="190" width="60" height="5" fill="#3a2e24"/>${[-36,-24,-12,12,24,36].map(d=>`<circle cx="${x+d}" cy="168" r="2.5" fill="#8fd0ff"/>`).join('')}`).join('')}
    <path d="M0 176 Q60 196 120 172 T470 172 T840 172 T1000 180 M0 196 Q60 214 120 192 T470 192 T840 192 T1000 198 M80 172 Q300 214 470 190 M500 190 Q680 226 840 192 M90 168 Q280 200 460 168 M480 168 Q660 204 830 168" stroke="#05060c" stroke-width="2" fill="none"/>
    <rect x="0" y="420" width="${W}" height="140" fill="url(#sst)"/>${Array.from({length:30},(_,i)=>`<rect x="${(i*37)%1000}" y="${430+(i*13)%110}" width="22" height="9" rx="3" fill="#000" opacity=".25"/>`).join('')}<path d="M0 470 H${W}" stroke="#3a3440" stroke-width="3" stroke-dasharray="40 30"/>
    <g transform="translate(560 410)"><rect x="0" y="-36" width="70" height="30" rx="4" fill="#1a1420"/><circle cx="14" cy="-2" r="12" fill="none" stroke="#3a3040" stroke-width="3"/><circle cx="58" cy="-2" r="12" fill="none" stroke="#3a3040" stroke-width="3"/><path d="M70 -20 h40 l20 -20 l10 4 l-14 22 v16" fill="#1a1420"/><path d="M120 -40 q-4 -14 6 -18" stroke="#1a1420" stroke-width="4" fill="none"/></g>
    ${[300,700].map(x=>`<circle cx="${x}" cy="292" r="110" fill="url(#snl)"/><rect x="${x-3}" y="300" width="6" height="120" fill="#20242e"/><path d="M${x-16} 300 h32 l-6 -16 h-20z" fill="#2a2e3a"/><circle cx="${x}" cy="296" r="9" fill="#ffffff"/><ellipse cx="${x}" cy="424" rx="80" ry="10" fill="#dbe8ff" opacity=".12"/>`).join('')}`,
  pearl:`<defs><linearGradient id="spe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#171c1f"/><stop offset="1" stop-color="#2d3639"/></linearGradient><radialGradient id="spb"><stop offset="0" stop-color="#ffe7a8" stop-opacity=".75"/><stop offset="1" stop-color="#ffe7a8" stop-opacity="0"/></radialGradient><linearGradient id="smet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6c767c"/><stop offset=".5" stop-color="#3a4248"/><stop offset="1" stop-color="#22282c"/></linearGradient><radialGradient id="scoil" cx=".4" cy=".35"><stop offset="0" stop-color="#f0b070"/><stop offset=".6" stop-color="#b8733d"/><stop offset="1" stop-color="#5a3018"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#spe)"/>${Array.from({length:9},(_,r)=>Array.from({length:22},(_,i)=>`<rect x="${(i*48)+(r%2?-24:0)}" y="${r*30}" width="44" height="26" fill="#2a2420" opacity="${.3+((i*5+r*3)%4)*.08}"/>`).join('')).join('')}
    ${[90,330,570,810].map(x=>`<rect x="${x}" y="30" width="110" height="200" fill="#0e1214" stroke="#3c4a4e" stroke-width="6"/><path d="M${x+55} 30v200M${x} 130h110" stroke="#3c4a4e" stroke-width="4"/><path d="M${x+6} 36 L${x+50} 36 L${x+6} 120Z" fill="#7ec8ff" opacity=".06"/>`).join('')}
    <path d="M0 250 H${W}" stroke="#4a5458" stroke-width="10"/>${Array.from({length:12},(_,i)=>`<path d="M${40+i*85} 250 V${270+(i%3)*14}" stroke="#c9a227" stroke-width="3"/>`).join('')}
    ${[160,420,680].map(x=>`<circle cx="${x}" cy="66" r="44" fill="url(#spb)"/><path d="M${x} 0v52" stroke="#5a6266" stroke-width="2"/><path d="M${x-10} 52 h20 l-3 8 h-14z" fill="#2a2e32"/><circle cx="${x}" cy="66" r="9" fill="#fff3c2"/><path d="M${x-3} 62 q3 6 6 0" stroke="#e8a040" stroke-width="1.2" fill="none"/>`).join('')}
    <rect x="0" y="410" width="${W}" height="150" fill="#1a1d1e"/>${Array.from({length:10},(_,i)=>`<rect x="${i*100}" y="410" width="98" height="150" fill="#000" opacity="${i%2?.08:0}"/>`).join('')}<path d="M0 410H${W}" stroke="#4a5458" stroke-width="4"/>
    ${[[230,330],[560,330]].map(([x,y])=>`<ellipse cx="${x}" cy="414" rx="130" ry="10" fill="#000" opacity=".4"/><rect x="${x-120}" y="${y+40}" width="240" height="44" rx="6" fill="url(#smet)" stroke="#6c767c" stroke-width="2"/><path d="M${x-100} ${y-30} L${x-100} ${y+40} M${x+20} ${y-30} L${x+20} ${y+40}" stroke="#4a5458" stroke-width="14"/>
      <circle cx="${x-40}" cy="${y+4}" r="62" fill="url(#scoil)" stroke="#3a2010" stroke-width="3"/>${Array.from({length:12},(_,i)=>`<path d="M${x-40} ${y+4} L${x-40+Math.cos(i*Math.PI/6)*60} ${y+4+Math.sin(i*Math.PI/6)*60}" stroke="#5a3018" stroke-width="2" opacity=".6"/>`).join('')}<circle cx="${x-40}" cy="${y+4}" r="24" fill="#2a2e32" stroke="#e09a5a" stroke-width="4"/><circle cx="${x-40}" cy="${y+4}" r="7" fill="#c9d3e3"/>
      <rect x="${x+24}" y="${y-30}" width="74" height="60" rx="6" fill="#24282c" stroke="#6c767c" stroke-width="2"/><text x="${x+61}" y="${y+6}" text-anchor="middle" font-family="IM Fell English SC,serif" font-size="15" fill="#c9a227">JUMBO</text><path d="M${x+61} ${y-30} V${y-150}" stroke="#c9a227" stroke-width="6"/><path d="M${x+52} ${y-150} V${y-30}" stroke="#8a6a1a" stroke-width="2"/>`).join('')}
    <circle cx="880" cy="300" r="104" fill="none" stroke="url(#smet)" stroke-width="16"/><circle cx="880" cy="300" r="16" fill="#6c767c"/><g class="spinr">${[0,1,2,3,4,5].map(i=>`<path d="M880 300 L${880+Math.cos(i*Math.PI/3)*96} ${300+Math.sin(i*Math.PI/3)*96}" stroke="#5c666c" stroke-width="7"/>`).join('')}</g><path d="M560 326 L880 204 M560 390 L880 396" stroke="#2a1a10" stroke-width="5"/>
    <rect x="700" y="100" width="280" height="110" fill="#22282c" stroke="#6c767c" stroke-width="3"/>${[750,830,910].map(x=>`<circle cx="${x}" cy="140" r="24" fill="#efe6d0" stroke="#8a7350" stroke-width="2"/><path d="M${x} 140 l12 -14" stroke="#d1312b" stroke-width="3"/><circle cx="${x}" cy="140" r="3" fill="#2a2016"/>`).join('')}${[740,790,840,890,940].map(x=>`<rect x="${x-6}" y="178" width="12" height="22" fill="#c9a227"/><path d="M${x} 178 l10 -14" stroke="#e8c86a" stroke-width="3"/>`).join('')}`,
  vortex:`<rect width="${W}" height="${H}" fill="rgba(6,8,16,.2)"/>`};
  /* v1.4: capa de ambiente común — haces de luz desde las ventanas, polvo en suspensión, bruma en el suelo y viñeta */
  const WIN={paris:[600,60,300,230,'#ffd9a8'],cologne:[640,70,280,250,'#ffe2b8'],manchester:[620,56,300,220,'#ffb98a'],museum:[520,120,200,200,'#5ee0ff'],academie:[330,40,340,260,'#ffe08a'],berlin:[420,70,160,200,'#e8dcc0'],pearl:[90,40,820,200,'#fff3c2'],newyork:[200,250,600,170,'#ffd27a']};
  const w=WIN[id];const motes=w?Array.from({length:22},(_,i)=>`<circle class="mote" cx="${(w[0]+(i*97)%Math.max(60,w[2]))-((i*53)%140)}" cy="${w[1]+40+(i*61)%(H-w[1]-80)}" r="${1+(i%3)*.7}" fill="${w[4]}" opacity="${.25+(i%4)*.12}" style="animation-delay:-${(i*.7).toFixed(1)}s"/>`).join(''):'';
  const fxl=`<defs><radialGradient id="sfxV" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient><linearGradient id="sfxF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>${w?`<linearGradient id="sfxS${id}" x1="0" y1="0" x2="-.3" y2="1"><stop offset="0" stop-color="${w[4]}" stop-opacity=".3"/><stop offset="1" stop-color="${w[4]}" stop-opacity="0"/></linearGradient>`:''}</defs>
    ${w&&id!=='newyork'&&id!=='pearl'?`<polygon points="${w[0]},${w[1]+w[3]} ${w[0]+w[2]},${w[1]+w[3]} ${w[0]+w[2]-140},${H} ${w[0]-300},${H}" fill="url(#sfxS${id})" class="shaft"/>`:''}${motes}
    <rect y="${H*.72}" width="${W}" height="${H*.28}" fill="url(#sfxF)"/><rect width="${W}" height="${H}" fill="url(#sfxV)"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" class="scene" aria-hidden="true">${S[id]||S.vortex}${id==='vortex'?'':fxl}</svg>`}

/* ================= Dialogue engine ================= */
function talk(lines,o){o=o||{};return new Promise(res=>{show('talk');const box=$('#scr-talk');let i=0,typing=false,full='',sceneId=o.scene||'vortex',left=null,right=null,timer=null,ended=false;
  box.innerHTML=`<div class="tk-scene" id="tkScene">${scene(sceneId)}</div><div class="tk-cast"><div class="tk-p left" id="tkL"></div><div class="tk-p right" id="tkR"></div></div>
    <div class="tk-box" id="tkBox"><div class="tk-name" id="tkName"></div><p class="tk-text" id="tkText" aria-live="polite"></p><p class="tk-alt" id="tkAlt" hidden></p><div class="tk-foot"><span class="tk-hint">${esc(ui(TOUCH?'talk.hintTouch':'talk.hint'))}</span><button class="btn sm ghost" id="tkSkip">${esc(ui('talk.skip'))}</button></div></div>`;
  /* los personajes se colocan siempre encima del cuadro de diálogo (en el móvil el cuadro crece con el texto) */
  const fitCast=()=>{const b=$('#tkBox');if(b)box.style.setProperty('--tkb',(b.offsetHeight+26)+'px')};fitCast();let ro=null;try{ro=new ResizeObserver(fitCast);ro.observe($('#tkBox'))}catch(e){}
  const setP=(slot,who,mood)=>{const el=$(slot==='left'?'#tkL':'#tkR');const key=who+':'+mood;if(el.dataset.k===key)return;const isNew=el.dataset.who!==who;el.dataset.k=key;el.dataset.who=who;el.innerHTML=who?portrait(who,mood):'';if(isNew&&who){el.classList.remove('enter');void el.offsetWidth;el.classList.add('enter')}};
  function step(){if(ended)return;if(i>=lines.length)return finish();const L=lines[i++];
    if(L.scene){sceneId=L.scene;const sc=$('#tkScene');sc.classList.remove('fade');void sc.offsetWidth;sc.classList.add('fade');sc.innerHTML=scene(sceneId);return step()}
    if(L.fx){if(L.fx==='flash'){const f=document.createElement('div');f.className='white-flash';document.body.append(f);setTimeout(()=>f.remove(),900);AU.play('zap')}
      if(L.fx==='shake'){shakeEl($('#scr-talk'));AU.play('hit')}if(L.fx==='thunder'){AU.play('alarm');hitFlash();shakeEl($('#scr-talk'))}if(L.fx==='dark'){$('#tkScene').classList.add('dark')}if(L.fx==='light'){$('#tkScene').classList.remove('dark')}if(L.fx==='power')AU.play('power');if(L.fx==='ok')AU.play('unlock');return step()}
    const who=L.w||'nar',c=CAST[who];const side=L.side||(who==='lumi'?'left':who==='nar'?null:'right');
    if(side==='left')setP('left',who,L.m);else if(side==='right')setP('right',who,L.m);
    $$('.tk-p').forEach(p=>p.classList.toggle('dim',p.dataset.who!==who));
    $('#tkName').innerHTML=who==='nar'?'':`<b style="color:${c.col}">${esc(T(c.n))}</b><span>${esc(T(c.role))}</span>`;$('#tkName').hidden=who==='nar';$('#tkBox').classList.toggle('nar',who==='nar');
    full=T(L.t||'').replace(/\{N\}/g,playerName());const el=$('#tkText');el.innerHTML='';typing=true;$('#tkBox').classList.remove('ready');let k=0;const plainT=unmark(full);
    const alt=S.settings.alt?TO(L.t||'').replace(/\{N\}/g,playerName()):'';const ae=$('#tkAlt');ae.hidden=!alt;ae.lang=other();ae.innerHTML=alt?hl(alt):'';
    VO.say(dropName(T(L.t||'')));
    const tick=()=>{if(!typing)return;k+=RM?9999:2;if(k%6===0)AU.play('type');if(k>=plainT.length){typing=false;el.innerHTML=hl(full);$('#tkBox').classList.add('ready');return}el.textContent=plainT.slice(0,k);timer=setTimeout(tick,16)};tick()}
  function adv(){if(ended)return;if(typing){typing=false;clearTimeout(timer);$('#tkText').innerHTML=hl(full);$('#tkBox').classList.add('ready');return}AU.play('click');step()}
  function finish(){if(ended)return;ended=true;if(ro)ro.disconnect();VO.stop();removeEventListener('keydown',kd);res()}
  const kd=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();adv()}if(e.key==='Escape'){finish()}};addEventListener('keydown',kd);
  $('#tkBox').addEventListener('click',e=>{if(e.target.closest('#tkSkip'))return;adv()});$('#tkScene').addEventListener('click',adv);$('#tkSkip').onclick=()=>{VO.stop();finish()};
  step()})}
/* time travel cinematic */
function travel(era,year,place){return new Promise(res=>{show('travel');const el=$('#scr-travel');el.innerHTML=`<div class="tr-wrap"><p class="kicker">${esc(ui('travel.k'))}</p><h1 class="tr-year" id="trY">2026</h1><p class="tr-place">${esc(place)}</p><p class="tr-era">${esc(era)}</p></div>`;
  AU.play('whoosh');AU.play('power');STAR.warp=14;let y=2026;const target=year;const t0=performance.now();const dur=RM?100:2600;
  const f=now=>{const k=Math.min(1,(now-t0)/dur);const e=1-Math.pow(1-k,3);y=Math.round(2026+(target-2026)*e);const yy=$('#trY');if(yy)yy.textContent=y;if(k<1)requestAnimationFrame(f);else{STAR.warp=0;const fl=document.createElement('div');fl.className='white-flash';document.body.append(fl);AU.play('boom');setTimeout(()=>{fl.remove();res()},700)}};requestAnimationFrame(f)})}

/* ================= Shared content: skills, notebook ================= */
const SKILLS=[
  {id:'intensite',fr:"L'intensité du courant : unité ampère (A), 1 A = 1000 mA",es:'La intensidad: amperios y miliamperios'},
  {id:'amperemetre',fr:"Brancher un ampèremètre en série (bornes A ou mA et COM)",es:'Conectar el amperímetro en serie'},
  {id:'unicite',fr:"Loi d'unicité de l'intensité dans un circuit en série",es:'Ley de unicidad de la intensidad en serie'},
  {id:'noeuds',fr:"Loi d'additivité des intensités (loi des nœuds)",es:'Ley de los nudos en derivación'},
  {id:'resistance',fr:"La résistance : unité ohm (Ω), effet sur l'intensité",es:'La resistencia y su efecto'},
  {id:'couleurs',fr:"Lire le code des couleurs d'une résistance",es:'Código de colores'},
  {id:'ohm',fr:"Loi d'Ohm : U = R × I",es:'Ley de Ohm'},
  {id:'caract',fr:"Caractéristique d'un conducteur ohmique",es:'La gráfica característica'},
  {id:'puissance',fr:"La puissance : P = U × I (watt)",es:'La potencia'},
  {id:'energie',fr:"L'énergie : E = P × t (joule, kWh)",es:'La energía'},
  {id:'joule',fr:"L'effet Joule",es:'El efecto Joule'},
  {id:'securite',fr:"Court-circuit, fusible et sécurité électrique",es:'Seguridad eléctrica'}];
const SK=Object.fromEntries(SKILLS.map(s=>[s.id,s]));
/* notebook: cat = loi | astuce | hist */
const NOTES={
  n_circuit:{cat:'astuce',fr:'Un circuit doit être fermé',es:'El circuito debe estar cerrado',b:"Le courant ne circule que si la boucle est **fermée** : du générateur, à travers les dipôles, et retour au générateur. Un seul trou et tout s'arrête.",bes:'La corriente solo circula si el camino forma un bucle cerrado. Un solo hueco y todo se apaga.'},
  n_sens:{cat:'loi',fr:'Le sens conventionnel du courant',es:'El sentido convencional',b:"À l'extérieur du générateur, le courant va de la borne **+** vers la borne **−**. Dans le labo, les petits points lumineux suivent ce sens.",bes:'Fuera de la pila, la corriente va del + al −. Los puntitos luminosos del laboratorio siguen ese sentido.'},
  n_intensite:{cat:'loi',fr:"L'intensité du courant",es:'La intensidad de la corriente',b:"On la note **I**. Son unité est l'**ampère (A)**. On utilise souvent le **milliampère** : **1 A = 1000 mA**, donc 0,25 A = 250 mA.",bes:'Se escribe I y se mide en amperios (A). 1 A = 1000 mA. Truco: para pasar de A a mA, la coma salta 3 cifras a la derecha.'},
  n_ampmetre:{cat:'loi',fr:"Brancher l'ampèremètre",es:'Conectar el amperímetro',b:"L'ampèremètre se branche **en série**, dans la boucle. Le courant entre par la borne **A** (ou **mA**) et sort par la borne **COM**. Si l'écran affiche un signe −, on inverse les fils.",bes:'El amperímetro va en serie: hay que abrir el circuito y meterlo dentro. Entra por A (o mA) y sale por COM.'},
  n_piege:{cat:'astuce',fr:'Le piège du Barón',es:'La trampa del Barón',b:"Un ampèremètre n'a presque **pas de résistance**. Branché en **dérivation**, il crée un **court-circuit** : un courant énorme le traverse et son fusible fond.",bes:'El amperímetro casi no tiene resistencia. En derivación provoca un cortocircuito y se funde su fusible. ¡Nunca en derivación!'},
  n_unicite:{cat:'loi',fr:"Loi d'unicité de l'intensité",es:'Ley de unicidad de la intensidad',b:"**Dans un circuit en série, l'intensité du courant est la même en tout point.** I = I1 = I2 = I3. Le courant ne « s'use » pas en traversant une lampe !",bes:'En serie la intensidad es igual en todos los puntos. La lámpara no gasta corriente: la corriente circula, como el agua en un circuito cerrado.'},
  n_noeuds:{cat:'loi',fr:"Loi d'additivité des intensités",es:'Ley de los nudos',b:"**Dans un circuit en dérivation, l'intensité dans la branche principale est égale à la somme des intensités dans les branches dérivées.** I = I1 + I2. Ce qui arrive à un nœud en repart.",bes:'En derivación, la corriente se reparte: I = I1 + I2. Todo lo que entra en un nudo, sale.'},
  n_eau:{cat:'astuce',fr:"L'image de l'eau",es:'La imagen del agua',b:"Imagine le courant comme de l'eau dans des tuyaux : le générateur est une pompe, l'intensité est le débit, les résistances sont des tuyaux étroits.",bes:'La pila es una bomba de agua, la intensidad es el caudal y las resistencias son tuberías estrechas que frenan el agua.'},
  n_resistance:{cat:'loi',fr:'La résistance',es:'La resistencia',b:"Une résistance **s'oppose au passage du courant**. Son unité est l'**ohm (Ω)**. En série, plus R est grande, plus l'intensité I est petite.",bes:'Una resistencia frena la corriente. Se mide en ohmios (Ω). Más resistencia = menos intensidad.'},
  n_couleurs:{cat:'astuce',fr:'Le code des couleurs',es:'El código de colores',b:"1ʳᵉ bague = 1ᵉʳ chiffre, 2ᵉ bague = 2ᵉ chiffre, 3ᵉ bague = nombre de zéros. noir 0 · marron 1 · rouge 2 · orange 3 · jaune 4 · vert 5 · bleu 6 · violet 7 · gris 8 · blanc 9. Ex. : marron-noir-rouge = 1 0 00 = 1000 Ω.",bes:'Truco para recordarlo: «Ni Mi Rojo Oso Ama Ver Bailar Violines Grises Blancos» (negro, marrón, rojo, naranja, amarillo, verde, azul, violeta, gris, blanco).'},
  n_caract:{cat:'loi',fr:"La caractéristique d'un conducteur ohmique",es:'La característica',b:"On trace U en fonction de I. Pour un **conducteur ohmique**, on obtient une **droite qui passe par l'origine** : U et I sont **proportionnelles**.",bes:'Si dibujas U frente a I y sale una recta que pasa por el origen, es un conductor óhmico.'},
  n_ohm:{cat:'loi',fr:"Loi d'Ohm",es:'Ley de Ohm',b:"**La tension U aux bornes d'un conducteur ohmique est égale au produit de sa résistance R par l'intensité I du courant qui le traverse : U = R × I** (U en V, R en Ω, I en A). Donc aussi I = U ÷ R et R = U ÷ I.",bes:'U = R × I. Truco del triángulo: escribe U arriba y R · I abajo. Tapa la letra que buscas y lo que queda te da la fórmula.'},
  n_triangle:{cat:'astuce',fr:'Le triangle magique',es:'El triángulo mágico',b:"U en haut, R et I en bas. Cache ce que tu cherches : U = R × I, I = U ÷ R, R = U ÷ I. **Attention : I toujours en ampères !** 20 mA = 0,020 A.",bes:'¡Ojo! En la fórmula, I siempre en amperios. Si te dan mA, divide entre 1000 antes de calcular.'},
  n_protege:{cat:'astuce',fr:'Protéger une lampe',es:'Proteger una lámpara',b:"Si le générateur donne plus que la tension nominale, on ajoute une résistance en série. Elle « prend » la tension en trop : R = (U − Un) ÷ In.",bes:'La resistencia en serie se queda con los voltios que sobran.'},
  h_ampere:{cat:'hist',fr:'André-Marie Ampère (1775-1836)',es:'Ampère',b:"En septembre 1820, une semaine après avoir appris l'expérience d'Ørsted (un courant fait bouger une boussole), Ampère présente à l'Académie des sciences ses découvertes sur les courants. C'est lui qui popularise les mots « courant électrique » et « tension ».",bes:'Era famoso por despistado: se cuenta que una vez escribió ecuaciones en la parte trasera de un coche de caballos… que se fue con sus cálculos. El amperio lleva su nombre desde 1881.'},
  h_ohm:{cat:'hist',fr:'Georg Simon Ohm (1789-1854)',es:'Ohm',b:"Professeur au lycée des jésuites de Cologne, Ohm publie en 1827 « Die galvanische Kette ». Ses idées sont d'abord moquées et il perd son poste. Quatorze ans plus tard, la Royal Society de Londres lui remet la médaille Copley.",bes:'Para tener medidas estables, Ohm cambió las pilas (que se agotaban) por un termopar: dos metales soldados, uno en agua hirviendo y otro en hielo. ¡Ingenioso!'},
  h_unites:{cat:'hist',fr:'1881 : les unités officielles',es:'1881: las unidades',b:"Au Congrès international des électriciens de Paris (1881), les savants adoptent officiellement le volt, l'ampère et l'ohm, en l'honneur de Volta, Ampère et Ohm.",bes:'Por eso decimos voltios, amperios y ohmios.'}};
/* Board helpers */
const LOOP=['h:1,0','h:2,0','h:3,0','h:4,0','v:5,0','v:5,1','v:5,2','h:4,3','h:3,3','h:2,3','h:1,3','v:1,0','v:1,1','v:1,2'];
const wiresOn=(edges,except,unlocked)=>edges.filter(e=>!(except||[]).includes(e)).map(e=>(unlocked||[]).includes(e)?{t:'wire',e,lock:0,mark:1}:{t:'wire',e,lock:1});
const cG=(e,E,o)=>Object.assign({t:'gen',e,E,dir:1,lab:'G',lock:1,lockVal:1,lockDir:1},o);
const cL=(e,lt,lab,o)=>Object.assign({t:'lamp',e,lt,lab,lock:1,lockVal:1},o);
const cR=(e,R,lab,o)=>Object.assign({t:'res',e,R,Pmax:5,lab,lock:1,lockVal:1},o);
const cA=(e,lab,o)=>Object.assign({t:'amp',e,lab,lock:1,dir:1},o);
const cV=(e,lab,o)=>Object.assign({t:'volt',e,lab,lock:1,dir:1},o);
/* builds a full board: components + loop wires on the remaining loop edges */
function board(comps,o){o=o||{};const taken=comps.map(c=>c.e);return comps.concat(wiresOn((o.edges||LOOP).filter(e=>!taken.includes(e)),o.gaps,o.free))}
const ampsOK=Q=>Q.of('amp').filter(a=>!a.burnt).every(a=>(Q.read(a)||0)>.0005);

/* ================= Chapter 1 · Paris 1820 · Ampère ================= */
const PAR_EDGES=['h:1,0','h:2,0','h:3,0','h:4,0','v:3,0','v:3,2','v:5,0','v:5,2','h:1,3','h:2,3','h:3,3','h:4,3','v:1,0','v:1,2'];
const CH1={id:'c1',n:1,place:'Paris',year:1820,era:'París, septiembre de 1820',sci:'ampere',scene:'paris',title:'Le courant',es:'La corriente y la intensidad',color:'#f2a65a',page:'Page 1 · L\'intensité',
missions:[
 {id:'1-1',t:'Premier circuit',es:'Primer circuito',steps:[
  {type:'travel'},
  {type:'talk',scene:'paris',lines:[
    {w:'nar',t:'París, septiembre de 1820. Un laboratorio lleno de pilas, brújulas y montañas de papeles.'},
    {w:'ampere',m:'wow',t:'Mon Dieu ! ¿Quiénes sois? ¿Y qué es esa… bombilla con patas?'},
    {w:'lumi',m:'happy',t:'¡Bip! Soy Lumi, y él es {N}, mi ingeniero. Venimos del futuro para ayudarle, monsieur Ampère.'},
    {w:'ampere',m:'worried',t:'¿Ayudarme? Un hombre con sombrero de copa entró anoche y se llevó mis notas. Dentro de una semana debo presentar mis experimentos en la Académie des sciences.'},
    {w:'ampere',m:'neutral',t:'Ørsted, un danés, acaba de descubrir que una «courant électrique» mueve la aguja de una brújula. Yo quiero entender esa corriente: medirla, domarla.'},
    {w:'lumi',m:'neutral',t:'Para eso hay que empezar por lo básico. {N}, en el banco de trabajo hay un circuito a medio montar. ¡Complétalo!'},
    {w:'lumi',m:'happy',t:'Elige la herramienta «Fil» y arrastra de un punto dorado a otro para tender cables.'}]},
  {type:'lab',title:'Allume la lampe',es:'Enciende la lámpara',board:{comps:board([cG('v:1,1',6),cL('h:3,0','l6a','L1')],{gaps:['v:5,1','h:2,3']})},palette:{wire:Infinity},tool:'wire',
   goals:[{t:'Complète le circuit pour allumer L1',es:'Rellena los dos huecos con cables',check:Q=>Q.lit('L1')}],
   hints:['Hay dos huecos en el circuito: uno a la derecha y otro abajo.','Con la herramienta «Fil», arrastra entre los dos puntos de cada hueco.'],skill:null},
  {type:'tip',id:'n_circuit'},{type:'tip',id:'n_sens'},
  {type:'talk',scene:'paris',lines:[
    {w:'ampere',m:'happy',t:'Magnifique ! Esa luz… ¡y esos puntitos que corren por los hilos!'},
    {w:'lumi',m:'happy',t:'Es el sentido convencional de la corriente: sale del + de la pila y vuelve por el −. Ahora, un interruptor para controlarla.'}]},
  {type:'lab',title:"L'interrupteur",es:'El interruptor',board:{comps:board([cG('v:1,1',6),cL('h:3,0','l6a','L1')],{gaps:['h:2,3']})},palette:{wire:Infinity,sw:1},tool:'sw',
   goals:[{t:"Place l'interrupteur K dans le trou",es:'Coloca el interruptor en el hueco de abajo',check:Q=>Q.of('sw').length>0&&Q.lit('L1')},
     {t:'Ouvre K : la lampe doit s\'éteindre',es:'Con la «Main», toca K para abrirlo',check:Q=>Q.of('sw').some(s=>!s.on)&&!Q.lit('L1')},
     {t:'Referme K',es:'Vuelve a tocarlo para cerrarlo',check:Q=>Q.of('sw').some(s=>s.on)&&Q.lit('L1')}],
   hints:['Elige «Interrupteur» y toca el hueco entre los dos puntos de abajo.','Con la herramienta «Main», un toque sobre el interruptor lo abre o lo cierra.']},
  {type:'qcm',skill:'intensite',q:"Interrupteur [[ouvert]] : que se passe-t-il ?",es:'Interruptor abierto: ¿qué pasa?',o:["Le circuit est ouvert : le courant ne circule plus","Le courant circule plus lentement","Seule la moitié du circuit fonctionne","La lampe brille plus fort"],ex:'Un interruptor abierto corta la boucle: el circuito queda abierto y la corriente deja de circular en todo el circuito.'}]},
 {id:'1-2',t:"L'ampèremètre",es:'El amperímetro',steps:[
  {type:'talk',scene:'paris',lines:[
    {w:'ampere',m:'neutral',t:'Ver la corriente está bien. Pero un científico necesita MEDIR. ¿Cuánta corriente pasa? Lo llamaré… su «intensité».'},
    {w:'lumi',m:'happy',t:'¡Buen nombre! En el futuro se mide con un «ampèremètre». Y la unidad será… el ampère. En su honor.'},
    {w:'ampere',m:'wow',t:'¿En mi honor? Oh là là… Vite, enséñenme cómo se usa.'}]},
  {type:'tip',id:'n_intensite'},{type:'tip',id:'n_ampmetre'},
  {type:'lab',title:"Mesure l'intensité",es:'Mide la intensidad',board:{comps:board([cG('v:1,1',6),cL('h:3,0','l6a','L1')],{gaps:['h:4,0']})},palette:{wire:Infinity,amp:1},tool:'amp',
   goals:[{t:"Branche l'ampèremètre en série, dans le trou",es:'Coloca el amperímetro en el hueco de arriba',check:Q=>!!Q.series('L1')},
     {t:'Lecture positive (sinon : inverse les bornes)',es:'Si sale negativo, selecciónalo e inviértelo',check:Q=>{const a=Q.series('L1');return a&&Q.read(a)>.0005}},
     {t:"Note l'intensité : I = ? A",es:'Escribe el valor que marca la pantalla',input:{unit:'A',ans:Q=>Q.I('L1'),tol:.003}}],
   hints:['Elige «Ampèremètre» y toca el hueco entre los dos puntos de arriba a la derecha.','El punto rojo es la borne A: la corriente debe entrar por ahí. Si la pantalla marca «−», toca el amperímetro y pulsa «Inverser les bornes».','Escribe con coma o con punto, como prefieras: 0,1 o 0.1.'],skill:'amperemetre'},
  {type:'qcm',skill:'amperemetre',q:"Comment branche-t-on un [[ampèremètre]] ?",es:'¿Cómo se conecta un amperímetro?',o:["En série, dans la boucle","En dérivation, aux bornes de la lampe","À la place du générateur","Il n'y a pas de règle"],ex:'El «ampèremètre» se conecta «en série»: se abre el circuito y se mete dentro, para que toda la corriente lo atraviese.'},
  {type:'qcm',skill:'intensite',q:"0,25 A = combien de [[mA]] ?",es:'0,25 A son ¿cuántos mA?',o:['250 mA','25 mA','2 500 mA','0,025 mA'],ex:'1 A = 1000 mA, así que 0,25 × 1000 = «250 mA».'}]},
 {id:'1-3',t:'Le piège du Baron',es:'La trampa del Barón',steps:[
  {type:'talk',scene:'paris',lines:[
    {fx:'thunder'},
    {w:'baron',m:'evil',t:'¡Buenas noches, señores científicos! Qué aparatito tan bonito. Un consejo de amigo: ¡conectad el amperímetro en derivación, sobre la lámpara! Medirá mucho mejor.'},
    {w:'ampere',m:'worried',t:'¿Es usted el ladrón de mis notas? ¡Fuera de mi laboratorio!'},
    {w:'baron',m:'evil',t:'Ja, ja. Pruébelo y verá…'},
    {w:'lumi',m:'worried',t:'Es una trampa, estoy segura. Pero los científicos comprobamos las cosas. Usemos un amperímetro de repuesto y hagamos la prueba… con cuidado.'}]},
  {type:'lab',title:'Expérience interdite',es:'Experimento prohibido',board:{comps:board([cG('v:1,1',6),cL('h:3,0','l6a','L1')],{free:['h:1,0']})},palette:{wire:Infinity,amp:2},tool:'wire',
   goals:[{t:"Branche l'ampèremètre en dérivation, aux bornes de L1",es:'Haz un puente por debajo de L1: dos cables hacia abajo y el amperímetro entre ellos',check:(Q,st)=>st.ampBurnt},
     {t:'Maintenant, branche un ampèremètre correctement : en série',es:'Borra el puente, borra el cable azul discontinuo de arriba a la izquierda y pon ahí un amperímetro',check:Q=>!!Q.series('L1')&&ampsOK(Q)}],
   hints:['Baja un cable desde cada borne de L1 (los dos puntos a los lados de la lámpara) hasta la fila de abajo, y pon el amperímetro entre ellos.','Después, con la goma, borra el amperímetro quemado, los cables del puente y el cable azul discontinuo de arriba a la izquierda. En ese hueco va el amperímetro nuevo.'],onEvent:(ev,st)=>{if(ev.k==='amp')st.ampBurnt=true}},
  {type:'tip',id:'n_piege'},
  {type:'qcm',skill:'amperemetre',q:"Pourquoi le fusible de l'ampèremètre a-t-il [[fondu]] ?",es:'¿Por qué se fundió el fusible del amperímetro?',o:["Il n'a presque pas de résistance : en dérivation, il crée un court-circuit","La lampe était trop puissante","Le générateur était à l'envers","L'ampèremètre était trop vieux"],ex:'Un amperímetro casi no tiene resistencia. En derivación, la corriente pasa toda por él en lugar de por la lámpara: es un cortocircuito.'},
  {type:'talk',scene:'paris',lines:[{w:'baron',m:'angry',t:'¡Bah! Esta vez habéis tenido suerte. ¡Pero la Académie se reirá de usted, Ampère!'},{fx:'flash'},{w:'lumi',m:'happy',t:'Se ha ido. Bien hecho, {N}: ahora sabes por qué un amperímetro va SIEMPRE en serie.'}]}]},
 {id:'1-4',t:"L'intensité ne s'use pas",es:'La corriente no se gasta',steps:[
  {type:'talk',scene:'paris',lines:[
    {w:'ampere',m:'neutral',t:'Tengo una duda. Si la lámpara brilla, quizá «gasta» corriente. Entonces, después de la lámpara, debería quedar menos… ¿no?'},
    {w:'lumi',m:'neutral',t:'Mucha gente lo piensa. Antes de medir: ¿tú qué crees, {N}?'}]},
  {type:'qcm',predict:true,skill:'unicite',q:"Avant la lampe, I = 0,1 A. [[Après]] la lampe, l'intensité est…",es:'Antes de la lámpara I = 0,1 A. Después de la lámpara, la intensidad es…',o:['La même : 0,1 A','Plus petite','Plus grande','Nulle'],ex:'Vamos a comprobarlo con tres amperímetros.'},
  {type:'lab',title:'Trois mesures',es:'Tres medidas',board:{comps:board([cG('v:1,1',12,{E:12}),cL('h:2,0','l6a','L1'),cL('h:4,0','l6a','L2')],{gaps:['h:1,0','v:5,1','h:2,3']})},palette:{wire:Infinity,amp:3},tool:'amp',
   goals:[{t:'Place les 3 ampèremètres dans les 3 trous',es:'Uno antes de L1, uno entre las lámparas y uno al final',check:Q=>Q.of('amp').filter(a=>!a.burnt).length>=3&&Q.lit('L1')&&Q.lit('L2')},
     {t:'Les trois lectures positives',es:'Invierte el que marque negativo',check:Q=>ampsOK(Q)&&Q.of('amp').length>=3},
     {t:"Que vaut l'intensité partout ? I = ? A",es:'Escribe el valor común',input:{unit:'A',ans:Q=>Q.I('L1'),tol:.003}}],
   hints:['Los huecos están arriba a la izquierda, a la derecha y abajo.','Abajo la corriente vuelve de derecha a izquierda: ese amperímetro saldrá negativo. Selecciónalo y pulsa «Inverser les bornes».'],skill:'unicite'},
  {type:'tip',id:'n_unicite'},{type:'tip',id:'n_eau'},
  {type:'qcm',skill:'unicite',q:"Quelle est la [[loi d'unicité]] de l'intensité ?",es:'¿Cuál es la ley de unicidad de la intensidad?',o:["Dans un circuit en série, l'intensité est la même en tout point","Dans un circuit en série, l'intensité diminue après chaque lampe","Dans un circuit en dérivation, l'intensité est la même partout","L'intensité est toujours de 1 A"],ex:'«Dans un circuit en série, l\'intensité du courant est la même en tout point.»'},
  {type:'talk',scene:'paris',lines:[{w:'ampere',m:'happy',t:'¡La corriente no se gasta: circula! Como el agua en un molino: mueve la rueda, pero no desaparece. ¡Qué idea tan bella!'}]}]},
 {id:'1-5',t:'La loi des nœuds',es:'La ley de los nudos',steps:[
  {type:'talk',scene:'paris',lines:[
    {w:'ampere',m:'neutral',t:'¿Y si el camino se divide en dos? Como un río que rodea una isla.'},
    {w:'lumi',m:'happy',t:'Eso es un circuito «en dérivation». El punto donde se separan los cables es un «nœud». Montemos uno con dos lámparas diferentes.'}]},
  {type:'lab',title:'Partage du courant',es:'Reparto de la corriente',board:{comps:board([cG('v:1,1',6),cL('v:3,1','l6a','L1'),cL('v:5,1','l6b','L2')],{edges:PAR_EDGES,gaps:['h:1,0','v:3,2','v:5,2']})},palette:{wire:Infinity,amp:3},tool:'amp',
   goals:[{t:'Mesure I dans la branche principale',es:'Amperímetro en el hueco de arriba a la izquierda',check:Q=>Q.lit('L1')&&Q.lit('L2')&&Q.of('amp').some(a=>!a.burnt&&Math.abs(Math.abs(Q.read(a))-(Q.I('L1')+Q.I('L2')))<.003)},
     {t:'Mesure I1 dans la branche de L1',es:'Amperímetro debajo de L1',check:Q=>!!Q.series('L1')},
     {t:'Mesure I2 dans la branche de L2',es:'Amperímetro debajo de L2',check:Q=>!!Q.series('L2')&&ampsOK(Q)},
     {t:'I1 = ? A',es:'Intensidad en la rama de L1',input:{unit:'A',ans:Q=>Q.I('L1'),tol:.003}},
     {t:'I2 = ? A',es:'Intensidad en la rama de L2',input:{unit:'A',ans:Q=>Q.I('L2'),tol:.003}},
     {t:'I (branche principale) = ? A',es:'Intensidad total',input:{unit:'A',ans:Q=>Q.I('L1')+Q.I('L2'),tol:.004}}],
   hints:['Tres huecos: arriba a la izquierda (rama principal), debajo de L1 y debajo de L2.','Compara: ¿cuánto suman I1 e I2?'],skill:'noeuds'},
  {type:'tip',id:'n_noeuds'},
  {type:'num',skill:'noeuds',q:"Dérivation : I = 0,8 A et I1 = 0,3 A. Que vaut [[I2]] ?",es:'Derivación: I = 0,8 A e I1 = 0,3 A. ¿Cuánto vale I2?',ans:.5,unit:'A',tol:.001,ex:'Ley de los nudos: I = I1 + I2, así que I2 = I − I1 = 0,8 − 0,3 = «0,5 A».'},
  {type:'qcm',skill:'noeuds',q:"Quelle relation est juste dans un circuit [[en dérivation]] ?",es:'¿Qué relación es correcta en derivación?',o:['I = I1 + I2','I = I1 = I2','I1 = I + I2','I = I1 − I2'],ex:'«Loi d\'additivité des intensités»: la corriente principal es la suma de las corrientes de las ramas.'}]},
 {id:'1-6',t:"Devant l'Académie",es:'Ante la Académie',boss:true,steps:[
  {type:'talk',scene:'academie',lines:[
    {w:'nar',t:'Académie des sciences, 18 de septiembre de 1820. Los sabios más importantes de Francia esperan.'},
    {w:'arago',m:'neutral',t:'Monsieur Ampère, la Académie le escucha. Dicen que trae ideas nuevas sobre la corriente.'},
    {w:'baron',m:'evil',t:'(desde el fondo) ¡Patrañas! ¡Que conteste a nuestras preguntas si es tan listo!'},
    {w:'lumi',m:'worried',t:'{N}, el Barón ha llenado la sala de preguntas trampa. Ampère necesita tu ayuda: tres vidas, seis preguntas.'}]},
  {type:'boss',title:'Les questions de l\'Académie',hearts:3,qs:[
    {skill:'intensite',q:'250 mA = ? A',es:'250 mA son ¿cuántos amperios?',o:['0,25 A','2,5 A','25 A','0,025 A'],ex:'Se divide entre 1000: 250 ÷ 1000 = 0,25 A.'},
    {skill:'amperemetre',q:"Le courant entre dans l'ampèremètre par la borne…",es:'La corriente entra en el amperímetro por el borne…',o:['A (ou mA)','COM','V','Ω'],ex:'Entra por A (o mA) y sale por COM.'},
    {skill:'unicite',q:'Circuit en série : I1 = 0,2 A. Que vaut I3 plus loin ?',es:'En serie: I1 = 0,2 A. ¿Cuánto vale I3 más adelante?',o:['0,2 A','0,1 A','0,4 A','0 A'],ex:'En serie la intensidad es la misma en todos los puntos.'},
    {skill:'noeuds',type:'num',q:'Dérivation : I1 = 0,15 A, I2 = 0,35 A. I = ? A',es:'Derivación: I1 = 0,15 A, I2 = 0,35 A. ¿I?',ans:.5,unit:'A',tol:.001,ex:'I = I1 + I2 = 0,15 + 0,35 = 0,5 A.'},
    {skill:'amperemetre',q:"Un ampèremètre branché en dérivation provoque…",es:'Un amperímetro en derivación provoca…',o:['un court-circuit','une mesure parfaite','une tension nulle partout','rien de spécial'],ex:'Casi no tiene resistencia: es un cortocircuito.'},
    {skill:'noeuds',q:"Un nœud, c'est…",es:'Un nudo es…',o:['un point où se rejoignent au moins trois fils','le milieu d\'un fil','la borne + du générateur','un interrupteur'],ex:'En un nudo se juntan tres cables o más: ahí la corriente se reparte.'}]},
  {type:'talk',scene:'academie',lines:[
    {fx:'ok'},{w:'arago',m:'happy',t:'¡Bravo, monsieur Ampère! Esto abre una ciencia nueva.'},
    {w:'ampere',m:'happy',t:'La llamaré «électrodynamique». Y no lo habría logrado sin mis amigos del futuro.'},
    {w:'baron',m:'angry',t:'¡Grrr! ¡Esto no ha terminado! ¡Me voy a Colonia… y allí nadie salvará a ese profesor de matemáticas!'},{fx:'flash'},
    {w:'lumi',m:'happy',t:'¡Página 1 recuperada! El amperio vuelve a existir en el futuro.'},{w:'ampere',m:'happy',t:'Adieu, mes amis. Si algún día una unidad lleva mi nombre… sabré a quién dar las gracias.'}]},
  {type:'tip',id:'h_ampere'},{type:'page'}]}]};

/* ================= Chapter 2 · Cologne 1827 · Ohm ================= */
const CH2={id:'c2',n:2,place:'Cologne',year:1827,era:'Colonia, 1826-1827',sci:'ohm',scene:'cologne',title:'La résistance',es:'Resistencias y ley de Ohm',color:'#9fd47a',page:"Page 2 · La loi d'Ohm",
missions:[
 {id:'2-1',t:'La résistance freine',es:'La resistencia frena',steps:[
  {type:'travel'},
  {type:'talk',scene:'cologne',lines:[
    {w:'nar',t:'Colonia, 1826. El gimnasio de los jesuitas. Por la ventana se ve la catedral, sin terminar, con una grúa de madera en lo alto de la torre.'},
    {w:'ohm',m:'worried',t:'Guten Abend. Soy Georg Simon Ohm, profesor de matemáticas y de física. Llevo años midiendo corrientes con hilos de distintas longitudes y grosores…'},
    {w:'ohm',m:'sad',t:'Los hilos largos y finos dejan pasar menos corriente. Pero mis pilas se agotan y mis medidas bailan. Y ahora un barón con monóculo va diciendo por toda la ciudad que soy un loco.'},
    {w:'lumi',m:'happy',t:'¡No está loco, profesor! Lo que usted estudia se llama «résistance». {N}, enseñémosle cómo frena la corriente.'}]},
  {type:'tip',id:'n_resistance'},
  {type:'lab',title:'Résistance en série',es:'Resistencia en serie',board:{comps:board([cG('v:1,1',6),cA('h:1,0','A1',{lockDir:1}),cL('h:3,0','l6a','L1')],{free:['h:2,3']})},palette:{wire:Infinity,res:1},resVals:[10,47,100,470],resDefault:100,tool:'erase',
   goals:[{t:'Remplace le fil bleu en pointillés (en bas) par une résistance',es:'Bórralo con la goma y coloca una resistencia en su lugar',check:Q=>Q.of('res').some(r=>Math.abs(Q.r(r.lab).I)>1e-4)},
     {t:'Choisis R pour que L1 brille à peine',es:'Selecciona la resistencia y prueba valores',check:Q=>Q.lampState('L1')==='sous'&&Q.I('L1')<.05&&Q.I('L1')>1e-4},
     {t:'Choisis la valeur qui laisse passer le plus de courant',es:'¿Qué resistencia frena menos?',check:Q=>Q.of('res').some(r=>r.R===10&&Q.I(r.lab)>1e-3)},
     {t:"Avec cette résistance, I = ? A",es:'Lee el amperímetro A1',input:{unit:'A',ans:Q=>Q.I('L1'),tol:.003}}],
   hints:['Usa la goma sobre el cable azul discontinuo de abajo. Luego elige «Résistance» y toca ese hueco.','Con la «Main», toca la resistencia: verás los valores 10, 47, 100 y 470 Ω.','Cuanto más pequeña la resistencia, más corriente pasa.'],skill:'resistance'},
  {type:'qcm',skill:'resistance',q:"Dans un circuit en série, si on [[augmente]] la résistance, l'intensité…",es:'En serie, si aumentamos la resistencia, la intensidad…',o:['diminue','augmente','ne change pas','devient négative'],ex:'Una resistencia mayor frena más la corriente: la intensidad «diminue».'},
  {type:'qcm',skill:'resistance',q:"L'unité de la résistance est…",es:'La unidad de la resistencia es…',o:["l'ohm (Ω)","l'ampère (A)","le volt (V)","le watt (W)"],ex:'La resistencia se mide en «ohms», símbolo Ω (omega).'}]},
 {id:'2-2',t:'Le code des couleurs',es:'El código de colores',steps:[
  {type:'talk',scene:'cologne',lines:[
    {w:'ohm',m:'wow',t:'¿Y esas rayitas de colores en sus resistencias?'},
    {w:'lumi',m:'happy',t:'En el futuro, las resistencias son tan pequeñas que no se puede escribir el número. Así que se pinta con colores. ¡Es un código secreto!'}]},
  {type:'tip',id:'n_couleurs'},
  {type:'colors',rounds:6,skill:'couleurs'},
  {type:'talk',scene:'cologne',lines:[{w:'ohm',m:'happy',t:'Wunderbar! Un código como los de los espías. Mis alumnos lo adorarían.'}]}]},
 {id:'2-3',t:'La caractéristique',es:'La gráfica característica',steps:[
  {type:'talk',scene:'cologne',lines:[
    {w:'ohm',m:'neutral',t:'Mi idea es esta: si aumento la tensión, la intensidad aumenta… siempre en la misma proporción. Pero necesito medidas limpias para demostrarlo.'},
    {w:'lumi',m:'neutral',t:'Para eso, en lugar de pilas que se agotan, usaremos un generador regulable. Mide U e I para varias tensiones y apunta cada punto en la gráfica.'},
    {w:'ohm',m:'happy',t:'Ja! Yo usé un termopar, dos metales: uno en agua hirviendo y otro en hielo. ¡Muy estable!'}]},
  {type:'tip',id:'h_ohm'},
  {type:'lab',title:'Tracer U = f(I)',es:'Dibujar U en función de I',board:{comps:board([cG('v:1,1',0,{lockVal:0}),cA('h:1,0','A1',{lockDir:1}),cR('h:3,0',100,'R1'),{t:'wire',e:'v:3,0',lock:1},{t:'wire',e:'v:4,0',lock:1},cV('h:3,1','V1',{lockDir:1})])},palette:{wire:Infinity},genAdj:true,tool:'select',
   graph:{amp:'A1',volt:'V1',min:5},
   goals:[{t:'Enregistre au moins 5 points différents',es:'Mueve la tensión del generador G y pulsa «Enregistrer» cada vez',check:(Q,st)=>(st.pts||[]).length>=5},
     {t:'Avec un de tes points, calcule R = U ÷ I. R = ? Ω',es:'Divide la tensión entre la intensidad de un punto',input:{unit:'Ω',ans:()=>100,tol:4}}],
   hints:['Toca el generador G y mueve el deslizador. Luego pulsa «Enregistrer la mesure».','Elige tensiones distintas: 2 V, 4 V, 6 V, 8 V, 10 V…','Ejemplo: si U = 6 V e I = 0,06 A, entonces R = 6 ÷ 0,06.'],skill:'caract'},
  {type:'tip',id:'n_caract'},
  {type:'qcm',skill:'caract',q:"La caractéristique U = f(I) d'un conducteur ohmique est…",es:'La característica de un conductor óhmico es…',o:["une droite qui passe par l'origine","une courbe qui monte de plus en plus vite","une droite horizontale","un cercle"],ex:'U e I son proporcionales: la gráfica es una recta que pasa por el origen.'}]},
 {id:'2-4',t:"La loi d'Ohm",es:'La ley de Ohm',steps:[
  {type:'talk',scene:'cologne',lines:[
    {w:'ohm',m:'happy',t:'¡Lo veo claro! La tensión es igual a la resistencia multiplicada por la intensidad. Lo escribiré en mi libro: «Die galvanische Kette».'},
    {w:'lumi',m:'happy',t:'En el futuro, todos los alumnos del mundo la estudian. Se llama… ¡la ley de Ohm!'}]},
  {type:'tip',id:'n_ohm'},{type:'tip',id:'n_triangle'},
  {type:'calc',skill:'ohm',q:"Un conducteur ohmique de R = 220 Ω est traversé par I = 0,03 A. Calcule la tension U.",es:'R = 220 Ω, I = 0,03 A. Calcula U.',steps:[{h:'Formule',hes:'Fórmula',o:['U = R × I','U = R ÷ I','U = I ÷ R']},{h:'Calcul',hes:'Cálculo',o:['U = 220 × 0,03','U = 220 ÷ 0,03','U = 0,03 ÷ 220']}],ans:6.6,unit:'V',tol:.05,ex:'U = R × I = 220 × 0,03 = «6,6 V».'},
  {type:'calc',skill:'ohm',q:"Un générateur de 12 V alimente une résistance de 400 Ω. Calcule l'intensité I.",es:'U = 12 V, R = 400 Ω. Calcula I.',steps:[{h:'Formule',hes:'Fórmula',o:['I = U ÷ R','I = U × R','I = R ÷ U']},{h:'Calcul',hes:'Cálculo',o:['I = 12 ÷ 400','I = 12 × 400','I = 400 ÷ 12']}],ans:.03,unit:'A',tol:.001,ex:'I = U ÷ R = 12 ÷ 400 = «0,03 A» = 30 mA.'},
  {type:'lab',title:'Vérification',es:'Comprobación',board:{comps:board([cG('v:1,1',9,{E:9}),cR('h:3,0',470,'R1')],{gaps:['h:4,0']})},palette:{wire:Infinity,amp:1},tool:'amp',
   goals:[{t:'Prévois : I = U ÷ R = ? mA',es:'Calcula 9 ÷ 470 y pásalo a mA (× 1000)',input:{unit:'mA',ans:()=>9/470*1000,tol:.7}},
     {t:"Vérifie avec l'ampèremètre (en série)",es:'Colócalo en el hueco',check:Q=>!!Q.series('R1')&&ampsOK(Q)},
     {t:'La mesure confirme ta prévision',es:'Compara la pantalla con tu cálculo',check:Q=>{const a=Q.series('R1');return a&&Math.abs(Q.read(a)*1000-9/470*1000)<1}}],
   hints:['9 ÷ 470 = 0,019… A. Para pasar a mA, multiplica por 1000.','El hueco está arriba a la derecha.'],skill:'ohm'}]},
 {id:'2-5',t:'Protéger la lampe',es:'Proteger la lámpara',steps:[
  {type:'talk',scene:'cologne',lines:[
    {w:'ohm',m:'worried',t:'Tengo un problema: esta lámpara es de 6 V, pero mi generador da 12 V. Si la conecto directamente…'},
    {w:'lumi',m:'worried',t:'¡Se fundiría! Con tu ley podemos salvarla: añadimos una resistencia en serie que se quede con los voltios que sobran.'}]},
  {type:'tip',id:'n_protege'},
  {type:'calc',skill:'ohm',q:"Lampe 6 V · 0,3 A, générateur 12 V. La résistance doit prendre 12 − 6 = 6 V avec I = 0,3 A. Calcule R.",es:'La resistencia debe quedarse 6 V con I = 0,3 A. Calcula R.',steps:[{h:'Formule',hes:'Fórmula',o:['R = U ÷ I','R = U × I','R = I ÷ U']},{h:'Calcul',hes:'Cálculo',o:['R = 6 ÷ 0,3','R = 12 ÷ 0,3','R = 6 × 0,3']}],ans:20,unit:'Ω',tol:.5,ex:'R = U ÷ I = 6 ÷ 0,3 = «20 Ω». En la caja no hay 20 Ω: elegimos la más cercana, 22 Ω.'},
  {type:'lab',title:'Sauver la lampe',es:'Salvar la lámpara',board:{comps:board([cG('v:1,1',12,{E:12}),cL('h:3,0','l6b','L1')],{gaps:['h:2,3']})},palette:{wire:Infinity,res:1},resVals:[10,22,33,47],resDefault:47,tool:'res',
   goals:[{t:'Ajoute une résistance en série dans le trou',es:'Coloca la resistencia abajo',check:Q=>Q.of('res').some(r=>Math.abs(Q.r(r.lab).I)>1e-3)},
     {t:'L1 doit briller normalement',es:'Elige el valor de R adecuado',check:Q=>Q.lampState('L1')==='normal'}],
   hints:['Coloca la resistencia en el hueco de abajo.','Con 47 Ω la lámpara brilla poco; con 10 Ω demasiado. ¿Cuál está en medio y se parece más a 20 Ω?','Si se funde, selecciónala y pulsa «Remplacer».'],skill:'ohm'}]},
 {id:'2-6',t:'Le procès de Berlin',es:'El juicio de Berlín',boss:true,steps:[
  {type:'talk',scene:'berlin',lines:[
    {w:'nar',t:'Berlín, 1827. El ministerio de Educación de Prusia.'},
    {w:'minister',m:'neutral',t:'Herr Ohm, nos han dicho que su libro está lleno de fantasías matemáticas.'},
    {w:'baron',m:'evil',t:'¡Exacto, Excelencia! ¡La corriente depende del color del hilo y de la luna! ¡Su «ley» es un disparate!'},
    {w:'ohm',m:'worried',t:'Puedo demostrarlo… pero el Barón ha preparado preguntas trampa.'},
    {w:'lumi',m:'neutral',t:'{N}, demuéstrale al ministro que la ley de Ohm funciona. Siete preguntas, tres vidas.'}]},
  {type:'boss',title:'Les questions du ministre',hearts:3,qs:[
    {skill:'resistance',q:"L'unité de la résistance est…",es:'La unidad de la resistencia es…',o:['l\'ohm (Ω)','le volt (V)','l\'ampère (A)','le watt (W)'],ex:'Ohmio, Ω.'},
    {skill:'ohm',type:'num',q:'R = 100 Ω, I = 0,05 A. U = ? V',es:'R = 100 Ω, I = 0,05 A. ¿U?',ans:5,unit:'V',tol:.01,ex:'U = R × I = 100 × 0,05 = 5 V.'},
    {skill:'ohm',type:'num',q:'U = 6 V, R = 200 Ω. I = ? A',es:'U = 6 V, R = 200 Ω. ¿I en amperios?',ans:.03,unit:'A',tol:.001,ex:'I = U ÷ R = 6 ÷ 200 = 0,03 A.'},
    {skill:'ohm',type:'num',q:'U = 4,5 V, I = 0,15 A. R = ? Ω',es:'U = 4,5 V, I = 0,15 A. ¿R?',ans:30,unit:'Ω',tol:.1,ex:'R = U ÷ I = 4,5 ÷ 0,15 = 30 Ω.'},
    {skill:'caract',q:"La caractéristique d'un conducteur ohmique est…",es:'La característica de un conductor óhmico es…',o:["une droite passant par l'origine",'une courbe en U','une droite horizontale','une parabole'],ex:'Recta que pasa por el origen: U e I son proporcionales.'},
    {skill:'couleurs',q:'marron · noir · rouge =',es:'marrón · negro · rojo =',o:['1 000 Ω','102 Ω','120 Ω','10 Ω'],ex:'1, 0 y dos ceros: 1000 Ω.'},
    {skill:'ohm',q:'U ne change pas. Si R est multipliée par 2, I est…',es:'Si U no cambia y R se multiplica por 2, I…',o:['divisée par 2','multipliée par 2','inchangée','nulle'],ex:'I = U ÷ R: si R se duplica, I se divide entre 2.'}]},
  {type:'talk',scene:'berlin',lines:[
    {fx:'ok'},{w:'minister',m:'happy',t:'Impresionante. Herr Ohm, sus números no mienten.'},
    {w:'baron',m:'angry',t:'¡NOOO! ¡Mi plan perfecto! Muy bien… ¡me voy a Inglaterra! ¡Allí un cervecero está jugando con el calor y la electricidad!'},{fx:'flash'},
    {w:'ohm',m:'happy',t:'Danke, meine Freunde. Al principio nadie me creerá, lo sé. Pero en 1841 la Royal Society me dará la medalla Copley. Ahora tengo paciencia.'},
    {w:'lumi',m:'happy',t:'¡Página 2 recuperada! Próxima parada: Mánchester, 1843… cuando el Chronotron termine de recargarse.'}]},
  {type:'tip',id:'h_unites'},{type:'page'}]}]};
/* ================= Chapter 3 · Manchester 1843 · Joule (v1.4) ================= */
Object.assign(NOTES,{
  n_puissance:{cat:'loi',fr:tx('La puissance électrique','La potencia eléctrica'),es:tx('La potencia eléctrica','La potencia eléctrica'),
    b:tx("La **puissance** P d'un appareil se calcule avec la tension U à ses bornes et l'intensité I qui le traverse : **P = U × I** (P en watts W, U en volts V, I en ampères A).","La **potencia** P de un aparato se calcula con la tensión U entre sus bornes y la intensidad I que lo atraviesa: **P = U × I** (P en vatios W, U en voltios V, I en amperios A)."),
    bes:tx("Plus la puissance est grande, plus l'appareil « travaille » vite : une lampe de 100 W éclaire plus qu'une lampe de 10 W.","Cuanto mayor es la potencia, más rápido «trabaja» el aparato: una lámpara de 100 W ilumina más que una de 10 W.")},
  n_nominale:{cat:'loi',fr:tx('La puissance nominale','La potencia nominal'),es:tx('La potencia nominal','La potencia nominal'),
    b:tx("Sur chaque appareil sont indiquées sa **tension nominale** et sa **puissance nominale**, par exemple « 230 V – 60 W ». Branché sous sa tension nominale, il consomme sa puissance nominale.","En cada aparato se indican su **tensión nominal** y su **potencia nominal**, por ejemplo «230 V – 60 W». Conectado a su tensión nominal, consume su potencia nominal."),
    bes:tx("Pour trouver l'intensité : I = P ÷ U. Une lampe 230 V – 60 W : I = 60 ÷ 230 ≈ 0,26 A.","Para hallar la intensidad: I = P ÷ U. Una lámpara de 230 V – 60 W: I = 60 ÷ 230 ≈ 0,26 A.")},
  n_joule:{cat:'loi',fr:tx("L'effet Joule",'El efecto Joule'),es:tx('El efecto Joule','El efecto Joule'),
    b:tx("Un conducteur traversé par un courant **s'échauffe** : il transforme de l'énergie électrique en **énergie thermique** (de la chaleur). C'est l'**effet Joule**.","Un conductor por el que pasa corriente **se calienta**: transforma energía eléctrica en **energía térmica** (calor). Es el **efecto Joule**."),
    bes:tx("Utile : radiateur, grille-pain, bouilloire. Gênant : il chauffe les câbles et gaspille de l'énergie. Un câble trop fin pour l'intensité peut prendre feu !","Útil: radiador, tostadora, hervidor. Molesto: calienta los cables y desperdicia energía. ¡Un cable demasiado fino para la intensidad puede arder!")},
  n_energie:{cat:'loi',fr:tx("L'énergie électrique",'La energía eléctrica'),es:tx('La energía eléctrica','La energía eléctrica'),
    b:tx("L'énergie consommée dépend de la puissance et de la durée : **E = P × t**. Avec P en watts et t en secondes, E est en **joules (J)**.","La energía consumida depende de la potencia y del tiempo: **E = P × t**. Con P en vatios y t en segundos, E sale en **julios (J)**."),
    bes:tx("Exemple : une lampe de 10 W allumée 60 s consomme 10 × 60 = 600 J.","Ejemplo: una lámpara de 10 W encendida 60 s consume 10 × 60 = 600 J.")},
  n_kwh:{cat:'astuce',fr:tx('Le kilowattheure','El kilovatio hora'),es:tx('El kilovatio hora','El kilovatio hora'),
    b:tx("Le joule est minuscule. Pour les factures, on utilise le **kilowattheure** : P en kilowatts (kW), t en heures (h). **1 kWh = 3 600 000 J**.","El julio es diminuto. En las facturas se usa el **kilovatio hora**: P en kilovatios (kW) y t en horas (h). **1 kWh = 3 600 000 J**."),
    bes:tx("Astuce : divise les watts par 1 000 pour avoir des kilowatts. 1 500 W = 1,5 kW.","Truco: divide los vatios entre 1000 para tener kilovatios. 1500 W = 1,5 kW.")},
  n_facture:{cat:'astuce',fr:tx('Lire une facture','Leer una factura'),es:tx('Leer una factura','Leer una factura'),
    b:tx("**Coût = E (en kWh) × prix du kWh.** À 0,20 € le kWh, un radiateur de 2 kW allumé 3 h coûte 2 × 3 × 0,20 = 1,20 €.","**Coste = E (en kWh) × precio del kWh.** A 0,20 € el kWh, un radiador de 2 kW encendido 3 h cuesta 2 × 3 × 0,20 = 1,20 €."),
    bes:tx("Pour économiser : éteindre les veilles, préférer les LED et ne pas chauffer une pièce vide.","Para ahorrar: apagar los aparatos en espera, usar LED y no calentar una habitación vacía.")},
  h_joule:{cat:'hist',fr:tx('James Prescott Joule (1818-1889)','James Prescott Joule (1818-1889)'),es:tx('Joule','Joule'),
    b:tx("Fils d'un brasseur de Salford, près de Manchester, Joule mesure avec une précision incroyable la chaleur produite par le courant (1841), puis l'équivalence entre travail et chaleur. En 1847, à Oxford, le jeune William Thomson remarque ses travaux.","Hijo de un cervecero de Salford, junto a Mánchester, Joule mide con una precisión increíble el calor que produce la corriente (1841) y después la equivalencia entre trabajo y calor. En 1847, en Oxford, el joven William Thomson se fija en sus trabajos."),
    bes:tx("L'unité d'énergie, le joule (J), porte son nom. On raconte qu'il emporta un thermomètre en voyage de noces pour mesurer l'eau d'une cascade !","La unidad de energía, el julio (J), lleva su nombre. ¡Se cuenta que se llevó un termómetro en su viaje de novios para medir el agua de una cascada!")},
  n_dangers:{cat:'loi',fr:tx('Le corps et le courant','El cuerpo y la corriente'),es:tx('El cuerpo y la corriente','El cuerpo y la corriente'),
    b:tx("Le corps humain est **conducteur**. Un courant qui le traverse peut provoquer des brûlures, bloquer les muscles ou arrêter le cœur. Une tension de plus de **25 V** en milieu humide (50 V en milieu sec) peut être dangereuse.","El cuerpo humano es **conductor**. Una corriente que lo atraviesa puede causar quemaduras, bloquear los músculos o parar el corazón. Una tensión de más de **25 V** en un lugar húmedo (50 V en seco) puede ser peligrosa."),
    bes:tx("Les prises de la maison donnent 230 V : on ne joue jamais avec le réseau. Les piles de 1,5 V à 9 V sont sans danger pour le corps.","Los enchufes de casa dan 230 V: con la red no se juega nunca. Las pilas de 1,5 V a 9 V no son peligrosas para el cuerpo.")},
  n_fusible:{cat:'loi',fr:tx('Fusible et disjoncteur','Fusible y disyuntor'),es:tx('Fusible y disyuntor','Fusible y disyuntor'),
    b:tx("Un **fusible** ou un **disjoncteur** coupe le circuit quand l'intensité dépasse son **calibre** : en cas de surcharge (trop d'appareils) ou de court-circuit. Il protège les **fils et les appareils**.","Un **fusible** o un **disyuntor** corta el circuito cuando la intensidad supera su **calibre**: si hay sobrecarga (demasiados aparatos) o un cortocircuito. Protege los **cables y los aparatos**."),
    bes:tx("On choisit le calibre juste au-dessus de l'intensité normale, et jamais plus grand que ce que supporte le câble.","El calibre se elige justo por encima de la intensidad normal, y nunca mayor que lo que aguanta el cable.")},
  n_terre:{cat:'loi',fr:tx('Prise de terre et différentiel','Toma de tierra y diferencial'),es:tx('Toma de tierra y diferencial','Toma de tierra y diferencial'),
    b:tx("La **prise de terre** relie les carcasses métalliques au sol : si un fil touche la carcasse, le courant part dans la terre. Le **disjoncteur différentiel** détecte cette fuite et coupe tout : il protège les **personnes**.","La **toma de tierra** une las carcasas metálicas con el suelo: si un cable toca la carcasa, la corriente se va a tierra. El **interruptor diferencial** detecta esa fuga y lo corta todo: protege a las **personas**."),
    bes:tx("C'est pour ça que la machine à laver et le frigo ont une fiche avec une broche de terre.","Por eso la lavadora y la nevera tienen una clavija con toma de tierra.")},
  n_alternatif:{cat:'loi',fr:tx('Continu ou alternatif','Continua o alterna'),es:tx('Continua o alterna','Continua o alterna'),
    b:tx("Une pile donne un courant **continu** : toujours dans le même sens. Le réseau donne un courant **alternatif** : il change de sens 50 fois par seconde (**50 Hz**) et sa tension est de **230 V** en Europe.","Una pila da corriente **continua**: siempre en el mismo sentido. La red da corriente **alterna**: cambia de sentido 50 veces por segundo (**50 Hz**) y su tensión es de **230 V** en Europa."),
    bes:tx("Le courant alternatif, défendu par Tesla, voyage loin et change facilement de tension : c'est lui qui a gagné la « guerre des courants ».","La corriente alterna, que defendía Tesla, viaja lejos y cambia fácilmente de tensión: fue la que ganó la «guerra de las corrientes».")},
  h_edison:{cat:'hist',fr:tx('Thomas Edison (1847-1931)','Thomas Edison (1847-1931)'),es:tx('Edison','Edison'),
    b:tx("Inventeur infatigable, Edison perfectionne l'ampoule à incandescence et ouvre en 1882 la centrale de Pearl Street, à New York, qui distribue du courant continu à des centaines de clients.","Inventor incansable, Edison perfecciona la bombilla incandescente y abre en 1882 la central de Pearl Street, en Nueva York, que reparte corriente continua a cientos de clientes."),
    bes:tx("On lui attribue cette phrase : « Le génie, c'est 1 % d'inspiration et 99 % de transpiration. »","Se le atribuye esta frase: «El genio es un 1 % de inspiración y un 99 % de transpiración».")},
  h_tesla:{cat:'hist',fr:tx('Nikola Tesla (1856-1943)','Nikola Tesla (1856-1943)'),es:tx('Tesla','Tesla'),
    b:tx("Né dans l'actuelle Croatie, Tesla arrive à New York en 1884 et travaille d'abord pour Edison. Il invente ensuite le moteur à courant alternatif et le système qui alimente encore nos maisons.","Nacido en la actual Croacia, Tesla llega a Nueva York en 1884 y trabaja primero para Edison. Después inventa el motor de corriente alterna y el sistema que todavía da corriente a nuestras casas."),
    bes:tx("L'unité de champ magnétique, le tesla (T), porte son nom. On dit qu'il imaginait une machine entière dans sa tête avant de la construire.","La unidad de campo magnético, el tesla (T), lleva su nombre. Dicen que imaginaba una máquina entera en su cabeza antes de construirla.")}});

const CH3={id:'c3',n:3,place:'Manchester',year:1843,era:'Mánchester, 1843',sci:'joule',scene:'manchester',title:'La puissance',es:'Potencia, energía y efecto Joule',color:'#ff9f6b',page:tx("Page 3 · La puissance et l'énergie",'Página 3 · La potencia y la energía'),
missions:[
 {id:'3-1',t:tx('La puissance','La potencia'),steps:[
  {type:'travel'},
  {type:'talk',scene:'manchester',lines:[
    {w:'nar',t:tx("Salford, près de Manchester, 1843. La brasserie Joule sent le malt et le charbon. Des cuves de cuivre fument dans la pénombre.","Salford, junto a Mánchester, 1843. La cervecería Joule huele a malta y a carbón. Unas cubas de cobre humean en la penumbra.")},
    {w:'joule',m:'worried',t:tx("Vous tombez mal ! Un baron à monocle a renversé mes thermomètres. Sans eux, impossible de prouver mon idée.","¡Llegáis en mal momento! Un barón con monóculo ha volcado mis termómetros. Sin ellos no puedo demostrar mi idea.")},
    {w:'lumi',m:'neutral',t:tx("Quelle idée, monsieur Joule ?","¿Qué idea, señor Joule?")},
    {w:'joule',m:'neutral',t:tx("Qu'un courant électrique produit de la chaleur, et toujours la même quantité pour le même travail. Mais d'abord : une lampe qui brille fort travaille plus qu'une lampe faible. Comment le mesurer ?","Que una corriente eléctrica produce calor, y siempre la misma cantidad para el mismo trabajo. Pero primero: una lámpara que brilla mucho trabaja más que una que brilla poco. ¿Cómo se mide eso?")},
    {w:'lumi',m:'happy',t:tx("Dans le futur, on appelle ça la [[puissance]]. Elle se calcule avec la tension et l'intensité : P = U × I. {N}, mesurons-la !","En el futuro eso se llama [[potencia]]. Se calcula con la tensión y la intensidad: P = U × I. {N}, ¡vamos a medirla!")}]},
  {type:'tip',id:'n_puissance'},
  {type:'lab',title:tx('Mesurer la puissance','Medir la potencia'),board:{comps:board([cG('v:1,1',6),cA('h:1,0','A1',{lockDir:1}),cL('h:3,0','l6b','L1'),{t:'wire',e:'v:3,0',lock:1},{t:'wire',e:'v:4,0',lock:1}])},palette:{volt:1},tool:'volt',
   goals:[{t:tx('Branche le voltmètre en dérivation, aux bornes de L1','Conecta el voltímetro en paralelo, en los bornes de L1'),es:tx('Le trou est juste sous la lampe','El hueco está justo debajo de la lámpara'),check:Q=>{const v=Q.across('volt','L1');return !!v&&Math.abs(Q.read(v)||0)>.5}},
     {t:tx('Note la tension : U = ? V','Anota la tensión: U = ? V'),es:tx('Lis le voltmètre','Lee el voltímetro'),input:{unit:'V',ans:Q=>Q.U('L1'),tol:.06}},
     {t:tx("Note l'intensité : I = ? A",'Anota la intensidad: I = ? A'),es:tx("Lis l'ampèremètre A1",'Lee el amperímetro A1'),input:{unit:'A',ans:Q=>Q.I('L1'),tol:.004}},
     {t:tx('Calcule la puissance : P = U × I = ? W','Calcula la potencia: P = U × I = ? W'),es:tx('Multiplie les deux mesures','Multiplica las dos medidas'),input:{unit:'W',ans:Q=>Q.U('L1')*Q.I('L1'),tol:.06}}],
   hints:[tx('Choisis « Voltmètre » et touche le trou sous L1.','Elige «Voltímetro» y toca el hueco debajo de L1.'),tx('Multiplie les deux valeurs : par exemple 6 × 0,3 = 1,8.','Multiplica los dos valores: por ejemplo 6 × 0,3 = 1,8.')],skill:'puissance'},
  {type:'qcm',skill:'puissance',q:tx("L'unité de la [[puissance]] est…","La unidad de la [[potencia]] es…"),o:[tx('le watt (W)','el vatio (W)'),tx('le volt (V)','el voltio (V)'),tx("l'ampère (A)",'el amperio (A)'),tx('le joule (J)','el julio (J)')],ex:tx("La puissance se mesure en [[watts]] (W), en l'honneur de James Watt.","La potencia se mide en [[vatios]] (W), en honor de James Watt.")},
  {type:'num',skill:'puissance',q:tx('Une lampe reçoit U = 12 V et I = 0,5 A. P = ? W','Una lámpara recibe U = 12 V e I = 0,5 A. P = ? W'),ans:6,unit:'W',tol:.01,ex:tx('P = U × I = 12 × 0,5 = [[6 W]].','P = U × I = 12 × 0,5 = [[6 W]].')}]},
 {id:'3-2',t:tx('La puissance nominale','La potencia nominal'),steps:[
  {type:'talk',scene:'manchester',lines:[
    {w:'joule',m:'neutral',t:tx("Sur mes nouvelles lampes, le fabricant a gravé deux nombres. Que veulent-ils dire ?","En mis lámparas nuevas el fabricante ha grabado dos números. ¿Qué significan?")},
    {w:'lumi',m:'happy',t:tx("Ce sont les valeurs [[nominales]] : la tension prévue, et la puissance consommée sous cette tension. Dans le futur, on lit par exemple « 230 V – 60 W ».","Son los valores [[nominales]]: la tensión prevista y la potencia que consume con esa tensión. En el futuro se lee, por ejemplo, «230 V – 60 W».")}]},
  {type:'tip',id:'n_nominale'},
  {type:'lab',title:tx('La bonne lampe','La lámpara adecuada'),board:{comps:board([cG('v:1,1',4.5,{E:4.5}),cL('h:3,0','l6a','L1',{lockVal:0})])},palette:{},tool:'select',lampTypes:['l25','l35','l45','l6a','l12'],
   goals:[{t:tx('Choisis la lampe qui brille normalement avec 4,5 V','Elige la lámpara que brilla con normalidad con 4,5 V'),es:tx('Sélectionne L1 et change son modèle','Selecciona L1 y cambia su modelo'),check:Q=>Q.lampState('L1')==='normal'},
     {t:tx('Sa puissance nominale : P = U × I = ? W','Su potencia nominal: P = U × I = ? W'),es:tx('Utilise les valeurs écrites sur la lampe','Usa los valores escritos en la lámpara'),input:{unit:'W',ans:()=>4.5*.3,tol:.03}}],
   hints:[tx('Une lampe brille normalement quand elle reçoit sa tension nominale.','Una lámpara brilla con normalidad cuando recibe su tensión nominal.'),tx('Cherche la lampe marquée 4,5 V. Puis 4,5 × 0,3 = ?','Busca la lámpara de 4,5 V. Y luego 4,5 × 0,3 = ?')],skill:'puissance'},
  {type:'qcm',skill:'puissance',q:tx("Sur une ampoule, on lit « 230 V – 60 W ». Que signifie 60 W ?","En una bombilla pone «230 V – 60 W». ¿Qué significa 60 W?"),o:[tx('Sa puissance nominale, quand elle reçoit 230 V','Su potencia nominal, cuando recibe 230 V'),tx('La tension dont elle a besoin','La tensión que necesita'),tx('Son intensité maximale','Su intensidad máxima'),tx("L'énergie qu'elle consomme en un an",'La energía que consume en un año')],ex:tx("60 W est la [[puissance nominale]] : celle que la lampe consomme quand elle reçoit sa tension nominale, 230 V.","60 W es la [[potencia nominal]]: la que consume la lámpara cuando recibe su tensión nominal, 230 V.")},
  {type:'calc',skill:'puissance',q:tx("Un radiateur porte « 230 V – 2 300 W ». Calcule l'intensité qui le traverse.","Un radiador indica «230 V – 2300 W». Calcula la intensidad que lo atraviesa."),steps:[{h:tx('Formule','Fórmula'),o:['I = P ÷ U','I = P × U','I = U ÷ P']},{h:tx('Calcul','Cálculo'),o:['I = 2300 ÷ 230','I = 2300 × 230','I = 230 ÷ 2300']}],ans:10,unit:'A',tol:.05,ex:tx("I = P ÷ U = 2 300 ÷ 230 = [[10 A]]. Un appareil puissant demande une grosse intensité !","I = P ÷ U = 2300 ÷ 230 = [[10 A]]. ¡Un aparato potente pide mucha intensidad!")}]},
 {id:'3-3',t:tx("L'effet Joule",'El efecto Joule'),steps:[
  {type:'talk',scene:'manchester',lines:[
    {w:'joule',m:'happy',t:tx("Mes thermomètres sont réparés ! Regardez : quand le courant traverse un fil fin plongé dans l'eau, l'eau se réchauffe.","¡Ya están arreglados mis termómetros! Mirad: cuando la corriente atraviesa un hilo fino metido en agua, el agua se calienta.")},
    {w:'lumi',m:'happy',t:tx("C'est l'[[effet Joule]] : un conducteur traversé par un courant transforme de l'énergie électrique en chaleur. Grille-pain, radiateur, bouilloire… tous l'utilisent.","Es el [[efecto Joule]]: un conductor por el que pasa corriente transforma energía eléctrica en calor. Tostadora, radiador, hervidor… todos lo usan.")},
    {fx:'thunder'},
    {w:'baron',m:'evil',t:tx("Et si l'on chauffait un peu trop, hein ? Voyons combien de résistances vous allez griller…","¿Y si calentamos un poco de más, eh? A ver cuántas resistencias quemáis…")}]},
  {type:'tip',id:'n_joule'},
  {type:'lab',title:tx('Chauffer sans griller','Calentar sin quemar'),board:{comps:board([cG('v:1,1',0,{lockVal:0}),cR('h:3,0',100,'R1',{Pmax:1})])},palette:{},genAdj:true,showAll:true,showPmax:true,fixPmax:true,tool:'select',
   goals:[{t:tx('Fais chauffer R1 entre 0,7 W et 1 W, sans la griller','Calienta R1 entre 0,7 W y 1 W, sin quemarla'),es:tx('Monte la tension du générateur peu à peu','Sube poco a poco la tensión del generador'),check:Q=>{const r=Q.c('R1');return !!r&&!r.burnt&&Q.P('R1')>=.7&&Q.P('R1')<=1}},
     {t:tx('Lis U et I sous R1, puis calcule P = U × I = ? W','Lee U e I bajo R1 y calcula P = U × I = ? W'),es:tx('Les valeurs sont écrites sous la résistance','Los valores aparecen debajo de la resistencia'),input:{unit:'W',ans:Q=>Q.P('R1'),tol:.05}}],
   hints:[tx('Touche le générateur G et utilise le curseur. Commence bas et monte doucement.','Toca el generador G y usa el deslizador. Empieza bajo y sube poco a poco.'),tx('Avec R = 100 Ω, essaie environ 9 V : P ≈ 9 × 0,09 ≈ 0,8 W.','Con R = 100 Ω, prueba unos 9 V: P ≈ 9 × 0,09 ≈ 0,8 W.')],skill:'joule'},
  {type:'qcm',skill:'joule',q:tx("L'[[effet Joule]], c'est…","El [[efecto Joule]] es…"),o:[tx("la transformation d'énergie électrique en chaleur dans un conducteur","la transformación de energía eléctrica en calor en un conductor"),tx("la production d'électricité avec de la chaleur","la producción de electricidad con calor"),tx('le passage du courant sans aucune perte','el paso de la corriente sin ninguna pérdida'),tx("l'attraction entre deux aimants",'la atracción entre dos imanes')],ex:tx("Tout conducteur traversé par un courant chauffe : c'est l'[[effet Joule]]. Utile dans un radiateur, gênant dans un câble.","Todo conductor por el que pasa corriente se calienta: es el [[efecto Joule]]. Útil en un radiador, molesto en un cable.")},
  {type:'qcm',skill:'joule',q:tx("Pourquoi un fil trop fin pour l'intensité qui le traverse est-il dangereux ?","¿Por qué es peligroso un cable demasiado fino para la intensidad que lleva?"),o:[tx('Il chauffe trop et peut provoquer un incendie','Se calienta demasiado y puede provocar un incendio'),tx('Il laisse passer moins de tension','Deja pasar menos tensión'),tx('Il attire la foudre','Atrae los rayos'),tx("Il n'est pas dangereux",'No es peligroso')],ex:tx("Plus l'intensité est grande pour un fil fin, plus l'effet Joule le chauffe. C'est pour ça qu'on choisit la section du fil selon l'intensité.","Cuanto mayor es la intensidad para un cable fino, más lo calienta el efecto Joule. Por eso la sección del cable se elige según la intensidad.")},
  {type:'talk',scene:'manchester',lines:[{w:'joule',m:'wow',t:tx("Le même courant, le même temps… et toujours la même chaleur. La nature tient ses comptes !","La misma corriente, el mismo tiempo… y siempre el mismo calor. ¡La naturaleza lleva bien las cuentas!")}]}]},
 {id:'3-4',t:tx("L'énergie",'La energía'),steps:[
  {type:'talk',scene:'manchester',lines:[
    {w:'lumi',m:'neutral',t:tx("La puissance, c'est la vitesse à laquelle un appareil utilise l'énergie. Allumé plus longtemps, il consomme plus d'[[énergie]] : E = P × t.","La potencia es la rapidez con que un aparato usa la energía. Encendido más tiempo, consume más [[energía]]: E = P × t.")},
    {w:'joule',m:'neutral',t:tx("Dans ma brasserie, je paie le charbon à la tonne. Et vous, dans le futur, vous payez l'électricité… au kilowattheure ?","En mi cervecería pago el carbón por toneladas. Y vosotros, en el futuro, ¿pagáis la electricidad… por kilovatio hora?")},
    {w:'lumi',m:'happy',t:tx("Exactement ! On lui montre le compteur, {N} ?","¡Exacto! ¿Le enseñamos el contador, {N}?")}]},
  {type:'tip',id:'n_energie'},{type:'tip',id:'n_kwh'},
  {type:'meter',title:tx('Le compteur de la brasserie','El contador de la cervecería'),skill:'energie',hideTotal:2,
   apps:[{id:'pump',n:tx('Pompe à eau','Bomba de agua'),P:500,max:8},{id:'lamps',n:tx("Lampes de l'atelier",'Lámparas del taller'),P:100,max:12},{id:'heater',n:tx('Chauffe-cuve','Calentador de la cuba'),P:2000,max:6},{id:'fan',n:tx('Ventilateur','Ventilador'),P:50,max:12}],
   goals:[{t:tx('Règle la pompe (500 W) sur 2 h','Pon la bomba (500 W) en 2 h'),es:tx('Déplace son curseur','Mueve su deslizador'),check:s=>s.h.pump===2},
     {t:tx('Énergie de la pompe : E = P × t = ? kWh','Energía de la bomba: E = P × t = ? kWh'),es:tx('500 W = 0,5 kW','500 W = 0,5 kW'),input:{unit:'kWh',ans:()=>1,tol:.01}},
     {t:tx('Organise la journée pour consommer 5 kWh au total','Organiza el día para consumir 5 kWh en total'),es:tx('Combine les durées : le chauffe-cuve consomme vite !','Combina los tiempos: ¡el calentador consume rápido!'),check:s=>Math.abs(s.E-5)<.051},
     {t:tx('À 0,20 € le kWh, coût de la journée = ? €','A 0,20 € el kWh, coste del día = ? €'),es:tx('Coût = E × prix','Coste = E × precio'),input:{unit:'€',ans:s=>s.E*.2,tol:.011}}],
   hints:[tx('Par exemple : pompe 2 h (1 kWh) + chauffe-cuve 2 h (4 kWh) = 5 kWh.','Por ejemplo: bomba 2 h (1 kWh) + calentador 2 h (4 kWh) = 5 kWh.'),tx('5 kWh × 0,20 € = 1 €.','5 kWh × 0,20 € = 1 €.')],price:.2},
  {type:'num',skill:'energie',q:tx('Un sèche-cheveux de 1 500 W fonctionne 0,5 h. E = ? kWh','Un secador de 1500 W funciona 0,5 h. E = ? kWh'),ans:.75,unit:'kWh',tol:.005,ex:tx("E = P × t = 1,5 kW × 0,5 h = [[0,75 kWh]]. On convertit d'abord les watts en kilowatts.","E = P × t = 1,5 kW × 0,5 h = [[0,75 kWh]]. Primero se pasan los vatios a kilovatios.")},
  {type:'qcm',skill:'energie',q:tx('1 kWh, c\'est…','1 kWh es…'),o:[tx("l'énergie consommée par un appareil de 1 000 W pendant 1 heure",'la energía que consume un aparato de 1000 W durante 1 hora'),tx('une puissance de 1 000 W','una potencia de 1000 W'),tx("la tension d'une prise électrique",'la tensión de un enchufe'),tx('une intensité de 1 000 A','una intensidad de 1000 A')],ex:tx("Le kilowattheure est une unité d'[[énergie]] : 1 kWh = 1 000 W pendant 1 h = 3 600 000 J.","El kilovatio hora es una unidad de [[energía]]: 1 kWh = 1000 W durante 1 h = 3 600 000 J.")}]},
 {id:'3-5',t:tx('La facture','La factura'),steps:[
  {type:'talk',scene:'manchester',lines:[
    {w:'nar',t:tx("Le soir, Joule fait ses comptes à la lueur d'une lampe.","Por la noche, Joule hace cuentas a la luz de una lámpara.")},
    {w:'joule',m:'neutral',t:tx("Si j'avais une maison du futur, combien me coûterait-elle chaque mois ?","Si tuviera una casa del futuro, ¿cuánto me costaría cada mes?")},
    {w:'lumi',m:'happy',t:tx("On multiplie l'énergie en kWh par le prix du kWh. Et pour économiser, on éteint ce qui ne sert à rien !","Se multiplica la energía en kWh por el precio del kWh. ¡Y para ahorrar, se apaga lo que no sirve!")}]},
  {type:'tip',id:'n_facture'},
  {type:'calc',skill:'energie',q:tx('Un frigo consomme 1,2 kWh par jour. Le kWh coûte 0,20 €. Combien coûte-t-il en 30 jours ?','Una nevera consume 1,2 kWh al día. El kWh cuesta 0,20 €. ¿Cuánto cuesta en 30 días?'),steps:[{h:tx('Énergie sur 30 jours','Energía en 30 días'),o:[tx('E = 1,2 × 30 = 36 kWh','E = 1,2 × 30 = 36 kWh'),tx('E = 1,2 ÷ 30 = 0,04 kWh','E = 1,2 ÷ 30 = 0,04 kWh'),tx('E = 1,2 + 30 = 31,2 kWh','E = 1,2 + 30 = 31,2 kWh')]},{h:tx('Coût','Coste'),o:['36 × 0,20','36 ÷ 0,20','36 + 0,20']}],ans:7.2,unit:'€',tol:.02,ex:tx('E = 1,2 × 30 = 36 kWh, puis coût = 36 × 0,20 = [[7,20 €]].','E = 1,2 × 30 = 36 kWh, y coste = 36 × 0,20 = [[7,20 €]].')},
  {type:'meter',title:tx('Chasse au gaspillage','A la caza del derroche'),skill:'energie',price:.2,
   apps:[{id:'rad',n:tx('Radiateur','Radiador'),P:2000,max:8,min:3,h0:5},{id:'light',n:tx('Éclairage','Iluminación'),P:200,max:12,min:4,h0:10},{id:'pc',n:tx('Ordinateur','Ordenador'),P:60,max:10,min:2,h0:8},{id:'standby',n:tx('Appareils en veille','Aparatos en espera'),P:10,max:24,h0:24}],
   goals:[{t:tx('Réduis la consommation de la journée sous 8 kWh','Reduce el consumo del día por debajo de 8 kWh'),es:tx('Chaque appareil a un minimum : il faut quand même se chauffer et s\'éclairer','Cada aparato tiene un mínimo: hay que calentarse e iluminarse igualmente'),check:s=>s.E<8},
     {t:tx('Au départ : 12,72 kWh. Économie par jour = ? €','Al principio: 12,72 kWh. Ahorro al día = ? €'),es:tx('(12,72 − ta consommation) × 0,20','(12,72 − tu consumo) × 0,20'),input:{unit:'€',ans:s=>(12.72-s.E)*.2,tol:.011}}],
   hints:[tx('Le radiateur consomme le plus : passe-le à 3 h. Coupe aussi les veilles.','El radiador es el que más consume: bájalo a 3 h. Apaga también los aparatos en espera.'),tx('Par exemple 12,72 − 6,92 = 5,8 kWh économisés, soit 5,8 × 0,20 = 1,16 €.','Por ejemplo 12,72 − 6,92 = 5,8 kWh ahorrados, o sea 5,8 × 0,20 = 1,16 €.')]},
  {type:'qcm',skill:'energie',q:tx("Quel appareil consomme le plus d'énergie en une heure ?",'¿Qué aparato consume más energía en una hora?'),o:[tx('Un radiateur de 2 000 W','Un radiador de 2000 W'),tx('Une lampe LED de 8 W','Una lámpara LED de 8 W'),tx('Un téléphone en charge (10 W)','Un móvil cargando (10 W)'),tx('Une télévision de 100 W','Una televisión de 100 W')],ex:tx("En 1 h, E = P × t : l'appareil le plus puissant consomme le plus, ici le radiateur (2 kWh).",'En 1 h, E = P × t: consume más el aparato más potente, aquí el radiador (2 kWh).')}]},
 {id:'3-6',t:tx('Oxford, 1847','Oxford, 1847'),boss:true,steps:[
  {type:'talk',scene:'academie',lines:[
    {w:'nar',t:tx("Oxford, juin 1847. Réunion de la British Association. Personne ne prête attention au jeune brasseur… sauf un certain William Thomson.","Oxford, junio de 1847. Reunión de la British Association. Nadie hace caso al joven cervecero… salvo un tal William Thomson.")},
    {w:'thomson',m:'neutral',t:tx("Monsieur Joule, vos mesures sont étonnantes. Mais ces messieurs ont des questions… et un baron en a glissé quelques-unes de piégées.","Señor Joule, sus medidas son asombrosas. Pero estos señores tienen preguntas… y un barón ha colado algunas con trampa.")},
    {w:'baron',m:'evil',t:tx("La chaleur n'a rien à voir avec l'électricité ! Prouvez le contraire, si vous pouvez !","¡El calor no tiene nada que ver con la electricidad! ¡Demuestre lo contrario, si puede!")},
    {w:'lumi',m:'neutral',t:tx("{N}, sept questions, trois vies. Montrons-leur ce que vaut l'énergie !","{N}, siete preguntas, tres vidas. ¡Demostremos lo que vale la energía!")}]},
  {type:'boss',title:tx('Les questions de la British Association','Las preguntas de la British Association'),hearts:3,qs:[
    {skill:'puissance',type:'num',q:tx('U = 230 V, I = 2 A. P = ? W','U = 230 V, I = 2 A. P = ? W'),ans:460,unit:'W',tol:1,ex:tx('P = U × I = 230 × 2 = 460 W.','P = U × I = 230 × 2 = 460 W.')},
    {skill:'puissance',q:tx('Sur un appareil : « 230 V – 1 000 W ». 1 000 W est sa…','En un aparato: «230 V – 1000 W». 1000 W es su…'),o:[tx('puissance nominale','potencia nominal'),tx('tension nominale','tensión nominal'),tx('intensité','intensidad'),tx('énergie','energía')],ex:tx('Le nombre en watts est la puissance nominale.','El número en vatios es la potencia nominal.')},
    {skill:'energie',type:'num',q:tx('Un four de 2 kW fonctionne 1,5 h. E = ? kWh','Un horno de 2 kW funciona 1,5 h. E = ? kWh'),ans:3,unit:'kWh',tol:.01,ex:tx('E = P × t = 2 × 1,5 = 3 kWh.','E = P × t = 2 × 1,5 = 3 kWh.')},
    {skill:'joule',q:tx("Quel appareil utilise volontairement l'effet Joule ?",'¿Qué aparato usa a propósito el efecto Joule?'),o:[tx('un grille-pain','una tostadora'),tx('un ventilateur','un ventilador'),tx('une radio','una radio'),tx('une boussole','una brújula')],ex:tx("Le grille-pain transforme l'énergie électrique en chaleur : c'est l'effet Joule.",'La tostadora transforma la energía eléctrica en calor: es el efecto Joule.')},
    {skill:'energie',type:'num',q:tx('3 kWh à 0,20 € le kWh. Coût = ? €','3 kWh a 0,20 € el kWh. Coste = ? €'),ans:.6,unit:'€',tol:.005,ex:tx('3 × 0,20 = 0,60 €.','3 × 0,20 = 0,60 €.')},
    {skill:'energie',q:tx('1 kWh = ? J','1 kWh = ? J'),o:['3 600 000 J','1 000 J','3 600 J','60 J'],ex:tx('1 kWh = 1 000 W × 3 600 s = 3 600 000 J.','1 kWh = 1000 W × 3600 s = 3 600 000 J.')},
    {skill:'energie',q:tx("Si l'on double la durée d'utilisation, l'énergie consommée…",'Si se duplica el tiempo de uso, la energía consumida…'),o:[tx('double','se duplica'),tx('reste la même','no cambia'),tx('est divisée par 2','se divide entre 2'),tx('devient nulle','se anula')],ex:tx('E = P × t : si t double, E double.','E = P × t: si t se duplica, E se duplica.')}]},
  {type:'talk',scene:'academie',lines:[
    {fx:'ok'},{w:'thomson',m:'happy',t:tx("Extraordinaire. Je crois que nous assistons à la naissance d'une loi : l'énergie ne se perd pas, elle se transforme.","Extraordinario. Creo que estamos viendo nacer una ley: la energía no se pierde, se transforma.")},
    {w:'baron',m:'angry',t:tx("Encore raté ! Très bien… direction New York ! Là-bas, un certain Edison veut éclairer toute une ville. Une ville entière à plonger dans le noir… ha, ha !","¡Otra vez fallo! Muy bien… ¡rumbo a Nueva York! Allí un tal Edison quiere iluminar una ciudad entera. Una ciudad entera que dejar a oscuras… ¡ja, ja!")},{fx:'flash'},
    {w:'joule',m:'happy',t:tx("Merci, mes amis. Un jour, l'unité d'énergie portera peut-être mon nom… le joule. J'aime bien le son.","Gracias, amigos. Algún día la unidad de energía quizá lleve mi nombre… el julio. Me gusta cómo suena.")},
    {w:'lumi',m:'happy',t:tx("Page 3 récupérée ! Prochain arrêt : New York, 1884.","¡Página 3 recuperada! Próxima parada: Nueva York, 1884.")}]},
  {type:'tip',id:'h_joule'},{type:'page'}]}]};

/* ================= Chapter 4 · New York 1884 · Edison & Tesla (v1.4) ================= */
/* casa de 6 V: L1 (0,1 A) + L2 (0,3 A) + motor (0,2 A) en paralelo, hueco para el fusible general y K2 = cortocircuito del Barón */
const HOUSE=()=>[cG('v:1,1',6),...['v:1,0','v:1,2','h:2,0','h:3,0','h:4,0','h:1,3','h:2,3','h:3,3','h:4,3','v:2,0','v:2,2','v:3,0','v:3,2','v:4,0','v:4,2','v:5,0','v:5,2'].map(e=>({t:'wire',e,lock:1})),
  cL('v:2,1','l6a','L1'),cL('v:3,1','l6b','L2'),{t:'motor',e:'v:4,1',lab:'M1',lock:1},{t:'sw',e:'v:5,1',lab:'K2',lock:1,on:false}];
const houseOK=Q=>Q.lit('L1')&&Q.lit('L2')&&Q.I('M1')>.15;
const DANGER1=[
  {t:tx('Toucher une prise avec des mains mouillées','Tocar un enchufe con las manos mojadas'),danger:1,why:tx("L'eau rend le corps meilleur conducteur : risque d'électrisation.",'El agua hace que el cuerpo conduzca mejor: riesgo de descarga eléctrica.')},
  {t:tx('Brancher une pile de 4,5 V sur une petite lampe','Conectar una pila de 4,5 V a una lamparita'),danger:0,why:tx('Une pile de 4,5 V ne présente pas de danger pour le corps.','Una pila de 4,5 V no es peligrosa para el cuerpo.')},
  {t:tx('Brancher trois radiateurs sur une seule multiprise','Enchufar tres radiadores en una sola regleta'),danger:1,why:tx("Trop d'intensité : la multiprise chauffe (effet Joule) et peut prendre feu.",'Demasiada intensidad: la regleta se calienta (efecto Joule) y puede arder.')},
  {t:tx("Remplacer un fusible fondu par un bout de fil de fer",'Sustituir un fusible fundido por un trozo de alambre'),danger:1,why:tx('Plus rien ne protège le circuit : en cas de court-circuit, les fils peuvent brûler.','Ya nada protege el circuito: si hay un cortocircuito, los cables pueden arder.')},
  {t:tx('Couper le disjoncteur avant de changer une prise','Bajar el interruptor general antes de cambiar un enchufe'),danger:0,why:tx("C'est le bon geste : on travaille toujours hors tension.",'Es lo correcto: siempre se trabaja sin tensión.')},
  {t:tx("Sortir une tartine coincée dans un grille-pain branché avec une fourchette",'Sacar una tostada atascada de una tostadora enchufada con un tenedor'),danger:1,why:tx('La fourchette en métal touche des parties sous tension : danger mortel.','El tenedor de metal toca partes con tensión: peligro mortal.')},
  {t:tx('Brancher la machine à laver sur une prise avec terre','Enchufar la lavadora a un enchufe con toma de tierra'),danger:0,why:tx('La prise de terre évacue le courant si un fil touche la carcasse.','La toma de tierra desvía la corriente si un cable toca la carcasa.')},
  {t:tx("S'abriter sous un arbre isolé pendant un orage",'Refugiarse bajo un árbol aislado durante una tormenta'),danger:1,why:tx('La foudre frappe souvent les arbres isolés.','Los rayos suelen caer en los árboles aislados.')},
  {t:tx('Faire voler un cerf-volant près d\'une ligne électrique','Volar una cometa cerca de una línea eléctrica'),danger:1,why:tx("Si le fil touche la ligne, le courant peut descendre jusqu'à toi.",'Si el hilo toca la línea, la corriente puede llegar hasta ti.')},
  {t:tx('Débrancher en tirant sur la fiche, pas sur le câble','Desenchufar tirando de la clavija, no del cable'),danger:0,why:tx('Tirer sur le câble peut l\'abîmer et mettre les fils à nu.','Tirar del cable puede dañarlo y dejar los hilos al aire.')},
  {t:tx('Un sèche-cheveux branché posé au bord de la baignoire','Un secador enchufado al borde de la bañera'),danger:1,why:tx("S'il tombe dans l'eau, le courant passe par l'eau… et par le corps.",'Si cae al agua, la corriente pasa por el agua… y por el cuerpo.')},
  {t:tx('Mettre des cache-prises quand il y a de jeunes enfants','Poner protectores de enchufe si hay niños pequeños'),danger:0,why:tx("Ils empêchent d'introduire des objets dans la prise.",'Impiden meter objetos en el enchufe.')}];
const DANGER2=[
  {t:tx("Changer une ampoule sans couper l'interrupteur",'Cambiar una bombilla sin apagar el interruptor'),danger:1,why:tx('Le culot peut être sous tension : on coupe d\'abord.','El casquillo puede tener tensión: primero se apaga.')},
  {t:tx('Une prise juste à côté du robinet de la baignoire','Un enchufe justo al lado del grifo de la bañera'),danger:1,why:tx("L'eau et l'électricité ne font pas bon ménage : les prises doivent être loin des points d'eau.",'El agua y la electricidad no se llevan bien: los enchufes deben estar lejos del agua.')},
  {t:tx('Appeler un adulte et couper le disjoncteur quand un appareil fume','Avisar a un adulto y bajar el general cuando un aparato echa humo'),danger:0,why:tx("Bon réflexe ! On coupe le courant sans toucher l'appareil.",'¡Buen reflejo! Se corta la corriente sin tocar el aparato.')},
  {t:tx('Grimper sur un pylône pour récupérer un ballon','Subirse a una torre eléctrica para recuperar un balón'),danger:1,why:tx("La haute tension est mortelle même sans contact : un arc électrique peut jaillir.",'La alta tensión es mortal incluso sin tocarla: puede saltar un arco eléctrico.')},
  {t:tx("Toucher quelqu'un qui est en train de s'électriser",'Tocar a alguien que está recibiendo una descarga'),danger:1,why:tx('Le courant te traverserait aussi : il faut d\'abord couper le courant.','La corriente te atravesaría a ti también: primero hay que cortar la corriente.')},
  {t:tx('Une installation avec disjoncteur différentiel 30 mA','Una instalación con diferencial de 30 mA'),danger:0,why:tx("Le différentiel coupe en une fraction de seconde si le courant fuit par une personne.",'El diferencial corta en una fracción de segundo si la corriente se escapa por una persona.')},
  {t:tx('Mettre le doigt dans une douille vide « pour voir »','Meter el dedo en un portalámparas vacío «para ver»'),danger:1,why:tx("Les contacts de la douille sont reliés au 230 V.",'Los contactos del portalámparas están conectados a 230 V.')},
  {t:tx('Faire des montages avec une pile plate de 4,5 V','Hacer montajes con una pila de petaca de 4,5 V'),danger:0,why:tx("Sans danger pour le corps. On évite juste de court-circuiter la pile : elle chaufferait.",'No es peligroso para el cuerpo. Solo hay que evitar cortocircuitar la pila: se calentaría.')}];

const CH4={id:'c4',n:4,place:'New York',year:1884,era:'Nueva York, 1884',sci:'tesla',scene:'newyork',title:'La sécurité',es:'Edison, Tesla, fusibles y cortocircuitos',color:'#7ec8ff',page:tx('Page 4 · La sécurité électrique','Página 4 · La seguridad eléctrica'),
missions:[
 {id:'4-1',t:tx('La ville électrique','La ciudad eléctrica'),steps:[
  {type:'travel'},
  {type:'talk',scene:'newyork',lines:[
    {w:'nar',t:tx("New York, juin 1884. Sous les fils électriques de Pearl Street, la foule admire les premières rues éclairées.","Nueva York, junio de 1884. Bajo los cables de Pearl Street, la gente admira las primeras calles iluminadas.")},
    {w:'edison',m:'happy',t:tx("Bienvenue à la centrale de Pearl Street ! Ma dynamo alimente des centaines de maisons. L'avenir est électrique !","¡Bienvenidos a la central de Pearl Street! Mi dinamo da corriente a cientos de casas. ¡El futuro es eléctrico!")},
    {w:'tesla',m:'neutral',t:tx("Pardonnez-moi, monsieur Edison. Je m'appelle Nikola Tesla. J'arrive de Paris avec une lettre pour vous… et quelques idées.","Disculpe, señor Edison. Me llamo Nikola Tesla. Vengo de París con una carta para usted… y algunas ideas.")},
    {fx:'thunder'},
    {w:'baron',m:'evil',t:tx("Quelle belle ville… et si fragile ! Mes saboteurs vont semer des pannes dans tout le quartier. Bonne chance !","Qué ciudad tan bonita… ¡y tan frágil! Mis saboteadores van a sembrar averías por todo el barrio. ¡Buena suerte!")},
    {w:'tesla',m:'worried',t:tx("Il faut agir vite, mais sans jamais se mettre en danger. {N}, je vais t'apprendre les bons gestes.","Hay que actuar rápido, pero sin ponerse nunca en peligro. {N}, voy a enseñarte los gestos correctos.")}]},
  {type:'tip',id:'n_dangers'},
  {type:'danger',title:tx('Danger ou pas ?','¿Peligro o no?'),cards:DANGER1,sec:9,skill:'securite'},
  {type:'qcm',skill:'securite',q:tx('Pourquoi le courant peut-il traverser le corps humain ?','¿Por qué puede pasar la corriente por el cuerpo humano?'),o:[tx("Parce qu'il est conducteur, surtout s'il est mouillé",'Porque es conductor, sobre todo si está mojado'),tx("Parce qu'il est isolant",'Porque es aislante'),tx("Parce qu'il produit sa propre électricité",'Porque produce su propia electricidad'),tx("Il ne peut pas le traverser",'No puede atravesarlo')],ex:tx("Le corps humain est [[conducteur]] : le courant peut le traverser et provoquer brûlures ou arrêt du cœur. En milieu humide, plus de 25 V peuvent déjà être dangereux.",'El cuerpo humano es [[conductor]]: la corriente puede atravesarlo y causar quemaduras o un paro cardíaco. En un lugar húmedo, más de 25 V ya pueden ser peligrosos.')}]},
 {id:'4-2',t:tx('Le fusible','El fusible'),steps:[
  {type:'talk',scene:'pearl',lines:[
    {w:'edison',m:'worried',t:tx("Mes clients branchent trop d'appareils sur la même ligne et les fils chauffent. Dans mes installations, je mets un fusible : un petit fil qui fond si l'intensité devient trop forte.","Mis clientes enchufan demasiados aparatos en la misma línea y los cables se calientan. En mis instalaciones pongo un fusible: un hilo fino que se funde si la intensidad sube demasiado.")},
    {w:'tesla',m:'neutral',t:tx("Encore faut-il choisir le bon calibre : assez grand pour l'usage normal, assez petit pour couper vite en cas de problème.","Pero hay que elegir bien el calibre: lo bastante grande para el uso normal y lo bastante pequeño para cortar enseguida si hay un problema.")}]},
  {type:'tip',id:'n_fusible'},
  {type:'lab',title:tx('Protéger la maison','Proteger la casa'),board:{comps:HOUSE()},palette:{fuse:1},tool:'fuse',fuseVals:[.1,.2,.5,1,2,5],fuseDefault:5,
   onEvent:(ev,st)=>{if(ev.k==='fuse'&&RUN&&RUN.lab&&RUN.lab.B.comps.some(c=>c.lab==='K2'&&c.on))st.k2=true},
   goals:[{t:tx('Place un fusible dans le trou : tout doit fonctionner','Coloca un fusible en el hueco: todo debe funcionar'),es:tx('Le trou est en haut à gauche, sur la ligne principale','El hueco está arriba a la izquierda, en la línea principal'),check:Q=>Q.of('fuse').some(f=>!f.burnt)&&houseOK(Q)},
     {t:tx('Choisis le plus petit calibre qui ne fond pas','Elige el calibre más pequeño que no se funde'),es:tx('I normale = 0,1 + 0,3 + 0,2 A','I normal = 0,1 + 0,3 + 0,2 A'),check:Q=>Q.of('fuse').some(f=>!f.burnt&&f.Ir===1)&&houseOK(Q)},
     {t:tx('Le Baron veut fermer K2… Ferme-le pour voir ce qui se passe','El Barón quiere cerrar K2… Ciérralo para ver qué pasa'),es:tx('Avec la « Main », touche K2','Con la «Mano», toca K2'),check:(Q,st)=>!!st.k2},
     {t:tx('Ouvre K2 et remplace le fusible','Abre K2 y cambia el fusible'),es:tx('Sélectionne le fusible et appuie sur « Remplacer »','Selecciona el fusible y pulsa «Reemplazar»'),check:Q=>!Q.c('K2').on&&Q.of('fuse').some(f=>!f.burnt&&f.Ir===1)&&houseOK(Q)}],
   hints:[tx('Le courant normal est I = 0,1 + 0,3 + 0,2 = 0,6 A. Le calibre juste au-dessus est 1 A.','La corriente normal es I = 0,1 + 0,3 + 0,2 = 0,6 A. El calibre justo por encima es 1 A.'),tx('K2 relie directement les deux fils : c\'est un court-circuit. Le fusible fond et protège la pile.','K2 une directamente los dos cables: es un cortocircuito. El fusible se funde y protege la pila.')],skill:'securite'},
  {type:'qcm',skill:'securite',q:tx('Un [[fusible]] protège surtout…','Un [[fusible]] protege sobre todo…'),o:[tx('les fils et les appareils contre une intensité trop forte','los cables y los aparatos de una intensidad demasiado alta'),tx('les personnes contre toutes les électrocutions','a las personas de todas las electrocuciones'),tx('contre les baisses de tension','de las bajadas de tensión'),tx('contre la foudre uniquement','solo de los rayos')],ex:tx("Le fusible coupe quand l'intensité dépasse son calibre (surcharge, court-circuit). Pour protéger les personnes, on utilise le [[disjoncteur différentiel]] et la prise de terre.",'El fusible corta cuando la intensidad supera su calibre (sobrecarga, cortocircuito). Para proteger a las personas se usan el [[interruptor diferencial]] y la toma de tierra.')}]},
 {id:'4-3',t:tx('Panique à Manhattan','Pánico en Manhattan'),steps:[
  {type:'talk',scene:'newyork',lines:[
    {w:'tesla',m:'worried',t:tx("Les saboteurs du Baron attaquent le quartier ! Chaque panne a son bon geste. Choisis l'outil, puis touche la maison.","¡Los saboteadores del Barón atacan el barrio! Cada avería tiene su gesto correcto. Elige la herramienta y luego toca la casa.")},
    {w:'edison',m:'neutral',t:tx("Et vite : une maison en panne trop longtemps, c'est une maison dans le noir !","Y rápido: ¡una casa con una avería demasiado tiempo es una casa a oscuras!")}]},
  {type:'blackout',title:tx('Panique à Manhattan','Pánico en Manhattan'),time:60,maxDark:4},
  {type:'talk',scene:'newyork',lines:[
    {w:'edison',m:'happy',t:tx("Bravo ! Le quartier brille de nouveau.","¡Bravo! El barrio vuelve a brillar.")},
    {w:'tesla',m:'happy',t:tx("Tu as de bons réflexes. Mais retiens surtout ceci : on coupe toujours le courant avant de réparer.","Tienes buenos reflejos. Pero sobre todo recuerda esto: siempre se corta la corriente antes de reparar.")}]}]},
 {id:'4-4',t:tx('La prise de terre','La toma de tierra'),steps:[
  {type:'talk',scene:'pearl',lines:[
    {w:'tesla',m:'neutral',t:tx("Une machine à carcasse métallique a un défaut : un fil touche la carcasse. Que se passe-t-il si quelqu'un la touche ?","Una máquina con carcasa metálica tiene un fallo: un cable toca la carcasa. ¿Qué pasa si alguien la toca?")},
    {w:'lumi',m:'worried',t:tx("Le courant passe par la personne pour rejoindre le sol… sauf s'il trouve un chemin plus facile !","La corriente pasa por la persona para llegar al suelo… ¡salvo que encuentre un camino más fácil!")},
    {w:'tesla',m:'happy',t:tx("Exactement. Ce chemin, c'est le fil de terre. Et un appareil malin coupe tout dès qu'il sent la fuite.","Exacto. Ese camino es el cable de tierra. Y un aparato listo lo corta todo en cuanto nota la fuga.")}]},
  {type:'tip',id:'n_terre'},
  {type:'qcm',skill:'securite',q:tx('À quoi sert la [[prise de terre]] ?','¿Para qué sirve la [[toma de tierra]]?'),o:[tx('À envoyer le courant de fuite dans le sol au lieu de traverser une personne','A llevar la corriente de fuga al suelo en vez de que atraviese a una persona'),tx('À augmenter la tension de la prise','A aumentar la tensión del enchufe'),tx("À faire des économies d'énergie",'A ahorrar energía'),tx('À brancher deux appareils sur la même prise','A enchufar dos aparatos en el mismo enchufe')],ex:tx("Si un fil touche la carcasse, la [[prise de terre]] offre au courant un chemin facile vers le sol : il ne passe pas par la personne.",'Si un cable toca la carcasa, la [[toma de tierra]] da a la corriente un camino fácil hacia el suelo: no pasa por la persona.')},
  {type:'qcm',skill:'securite',q:tx('Le [[disjoncteur différentiel]] coupe le courant quand…','El [[interruptor diferencial]] corta la corriente cuando…'),o:[tx('une partie du courant « fuit », par exemple à travers une personne','una parte de la corriente «se escapa», por ejemplo a través de una persona'),tx("on allume la lumière",'se enciende la luz'),tx('la tension vaut exactement 230 V','la tensión es exactamente 230 V'),tx('un appareil est éteint','un aparato está apagado')],ex:tx("Il compare le courant qui part et celui qui revient. S'il manque quelques milliampères, il coupe en une fraction de seconde : il protège les personnes.",'Compara la corriente que sale y la que vuelve. Si faltan unos miliamperios, corta en una fracción de segundo: protege a las personas.')},
  {type:'danger',title:tx('Danger ou pas ? Niveau expert','¿Peligro o no? Nivel experto'),cards:DANGER2,sec:6,skill:'securite'}]},
 {id:'4-5',t:tx("L'idée de Tesla",'La idea de Tesla'),steps:[
  {type:'talk',scene:'pearl',lines:[
    {w:'tesla',m:'happy',t:tx("Monsieur Edison aime le courant continu. Moi, je rêve d'un courant qui change de sens des dizaines de fois par seconde : le courant [[alternatif]]. Il voyage loin, et un transformateur change sa tension.","Al señor Edison le gusta la corriente continua. Yo sueño con una corriente que cambia de sentido decenas de veces por segundo: la corriente [[alterna]]. Viaja lejos y un transformador cambia su tensión.")},
    {w:'edison',m:'angry',t:tx("Des rêves, jeune homme ! Le continu fonctionne, je l'ai prouvé.","¡Sueños, joven! La continua funciona, lo he demostrado.")},
    {w:'lumi',m:'happy',t:tx("Dans le futur, les prises de la maison donnent du courant alternatif : 230 V et 50 hertz en Europe. Tesla avait vu juste… mais ça, c'est une autre aventure !","En el futuro, los enchufes de casa dan corriente alterna: 230 V y 50 hercios en Europa. Tesla tenía razón… ¡pero eso es otra aventura!")},
    {w:'tesla',m:'neutral',t:tx("Avant de rêver, mesurons. {N}, mets en marche le moteur de la dynamo et dis-moi quelle puissance elle fournit.","Antes de soñar, midamos. {N}, pon en marcha el motor de la dinamo y dime qué potencia da.")}]},
  {type:'tip',id:'n_alternatif'},
  {type:'lab',title:tx('La dynamo de Pearl Street','La dinamo de Pearl Street'),board:{comps:[cG('v:1,1',12,{E:12}),cA('h:1,0','A1',{lockDir:1}),...['v:1,0','v:1,2','h:2,0','v:2,0','v:2,2','v:3,2','h:1,3','h:2,3'].map(e=>({t:'wire',e,lock:1})),cL('v:2,1','l12','L1'),{t:'motor',e:'v:3,1',lab:'M1',lock:1},{t:'sw',e:'v:3,0',lab:'K1',lock:1,on:false}]},palette:{},tool:'select',
   goals:[{t:tx('Ferme K1 pour démarrer le moteur M1','Cierra K1 para arrancar el motor M1'),es:tx('Avec la « Main », touche K1','Con la «Mano», toca K1'),check:Q=>Q.I('M1')>.3},
     {t:tx("Lis l'ampèremètre A1 : I = ? A",'Lee el amperímetro A1: I = ? A'),es:tx('Il mesure le courant total','Mide la corriente total'),input:{unit:'A',ans:Q=>Q.I('A1'),tol:.006}},
     {t:tx('Puissance fournie par la dynamo de 12 V : P = ? W','Potencia que da la dinamo de 12 V: P = ? W'),es:tx('P = U × I','P = U × I'),input:{unit:'W',ans:Q=>12*Q.I('A1'),tol:.15}}],
   hints:[tx('K1 est au-dessus du moteur.','K1 está encima del motor.'),tx('P = 12 × 0,5 ≈ 6 W.','P = 12 × 0,5 ≈ 6 W.')],skill:'puissance'},
  {type:'qcm',skill:'securite',q:tx('Le courant des prises de la maison en Europe est…','La corriente de los enchufes de casa en Europa es…'),o:[tx('alternatif, 230 V, 50 Hz','alterna, 230 V, 50 Hz'),tx('continu, 12 V','continua, 12 V'),tx('continu, 230 V','continua, 230 V'),tx('alternatif, 4,5 V','alterna, 4,5 V')],ex:tx('En Europe, le réseau fournit un courant [[alternatif]] de 230 V et de fréquence 50 Hz.','En Europa, la red da corriente [[alterna]] de 230 V y 50 Hz de frecuencia.')},
  {type:'tip',id:'h_edison'}]},
 {id:'4-6',t:tx('Le duel du courant','El duelo de la corriente'),boss:true,steps:[
  {type:'talk',scene:'pearl',lines:[
    {w:'nar',t:tx("Une panne géante menace Manhattan. Le Baron s'est emparé du tableau de la centrale !","Un apagón gigante amenaza Manhattan. ¡El Barón se ha hecho con el cuadro de la central!")},
    {w:'baron',m:'evil',t:tx("Répondez à mes questions, ou New York restera dans le noir pour toujours !","¡Responded a mis preguntas o Nueva York se quedará a oscuras para siempre!")},
    {w:'tesla',m:'neutral',t:tx("Pour une fois, Edison et moi sommes d'accord. {N}, nous comptons sur toi : huit questions, trois vies.","Por una vez, Edison y yo estamos de acuerdo. {N}, contamos contigo: ocho preguntas, tres vidas.")}]},
  {type:'boss',title:tx('Le duel du courant','El duelo de la corriente'),hearts:3,qs:[
    {skill:'securite',q:tx('Un appareil fume. Premier geste ?','Un aparato echa humo. ¿Qué haces primero?'),o:[tx('Couper le courant au disjoncteur','Bajar el interruptor general'),tx("Le jeter dans l'eau",'Echarlo al agua'),tx("Le toucher pour voir s'il chauffe",'Tocarlo para ver si quema'),tx('Le débrancher avec les mains mouillées','Desenchufarlo con las manos mojadas')],ex:tx("On coupe d'abord le courant, sans toucher l'appareil.",'Primero se corta la corriente, sin tocar el aparato.')},
    {skill:'securite',q:tx("Le calibre d'un fusible doit être…",'El calibre de un fusible debe ser…'),o:[tx("juste au-dessus de l'intensité normale",'justo por encima de la intensidad normal'),tx('le plus grand possible','lo más grande posible'),tx('égal à la tension','igual a la tensión'),tx('toujours 1 A','siempre 1 A')],ex:tx('Assez grand pour le fonctionnement normal, assez petit pour couper vite.','Lo bastante grande para el uso normal y lo bastante pequeño para cortar enseguida.')},
    {skill:'noeuds',type:'num',q:tx('Trois appareils de 0,5 A, 1 A et 2 A en dérivation. I totale = ? A','Tres aparatos de 0,5 A, 1 A y 2 A en paralelo. I total = ? A'),ans:3.5,unit:'A',tol:.01,ex:tx('Loi des nœuds : I = 0,5 + 1 + 2 = 3,5 A.','Ley de los nudos: I = 0,5 + 1 + 2 = 3,5 A.')},
    {skill:'securite',q:tx("Un court-circuit, c'est…",'Un cortocircuito es…'),o:[tx("un chemin sans résistance : l'intensité devient énorme",'un camino sin resistencia: la intensidad se dispara'),tx('une lampe qui brille moins','una lámpara que brilla menos'),tx('un circuit ouvert','un circuito abierto'),tx('une pile vide','una pila gastada')],ex:tx("Sans résistance, l'intensité devient énorme : les fils chauffent, le fusible doit couper.",'Sin resistencia, la intensidad se dispara: los cables se calientan y el fusible debe cortar.')},
    {skill:'puissance',type:'num',q:tx('Une bouilloire de 2 000 W sous 230 V. I ≈ ? A (arrondi à l\'unité)','Un hervidor de 2000 W a 230 V. I ≈ ? A (redondea a la unidad)'),ans:9,unit:'A',tol:.6,ex:tx('I = P ÷ U = 2 000 ÷ 230 ≈ 8,7 A, soit environ 9 A.','I = P ÷ U = 2000 ÷ 230 ≈ 8,7 A, o sea unos 9 A.')},
    {skill:'securite',q:tx('La prise de terre protège…','La toma de tierra protege…'),o:[tx('les personnes, si une carcasse métallique est sous tension','a las personas, si una carcasa metálica tiene tensión'),tx('la lampe de la surtension','la lámpara de la sobretensión'),tx('le compteur','el contador'),tx('rien du tout','nada')],ex:tx('Elle évacue le courant de fuite vers le sol.','Desvía la corriente de fuga al suelo.')},
    {skill:'securite',q:tx('En milieu humide, une tension peut être dangereuse dès…','En un lugar húmedo, una tensión puede ser peligrosa a partir de…'),o:['25 V','230 V','1 000 V','100 000 V'],ex:tx('Dès 25 V en milieu humide (50 V en milieu sec).','A partir de 25 V en un lugar húmedo (50 V en seco).')},
    {skill:'securite',q:tx('Le courant des prises en Europe a une fréquence de…','La corriente de los enchufes en Europa tiene una frecuencia de…'),o:['50 Hz','230 Hz','12 Hz','1 Hz'],ex:tx('Il change de sens 50 fois par seconde : 50 Hz.','Cambia de sentido 50 veces por segundo: 50 Hz.')}]},
  {type:'talk',scene:'pearl',lines:[
    {fx:'ok'},{w:'edison',m:'happy',t:tx("Les lumières reviennent ! Monsieur Tesla… vous n'êtes peut-être pas qu'un rêveur.","¡Vuelven las luces! Señor Tesla… quizá no sea usted solo un soñador.")},
    {w:'baron',m:'angry',t:tx("NOOON ! Vous ne m'aurez pas ! Je me réfugie dans le Vortex, hors du temps. Venez m'y chercher… si vous l'osez !","¡NOOO! ¡No me atraparéis! Me refugio en el Vórtice, fuera del tiempo. Venid a buscarme… ¡si os atrevéis!")},{fx:'flash'},
    {w:'tesla',m:'happy',t:tx("{N}, tu as un vrai talent. Si tu le veux, je serai désormais ton maître. Je t'ai préparé des épreuves dignes des plus grands inventeurs.","{N}, tienes un talento de verdad. Si quieres, a partir de ahora seré tu maestro. Te he preparado unas pruebas dignas de los grandes inventores.")},
    {w:'tesla',m:'neutral',t:tx("Et un jour, je te montrerai les champs invisibles : le courant crée du magnétisme, et le magnétisme crée du courant. Tout est lié.","Y algún día te enseñaré los campos invisibles: la corriente crea magnetismo y el magnetismo crea corriente. Todo está unido.")},
    {w:'lumi',m:'happy',t:tx("Page 4 récupérée ! Il ne reste que le Vortex… quand le Chronotron sera prêt.","¡Página 4 recuperada! Solo queda el Vórtice… cuando el Chronotron esté listo.")}]},
  {type:'tip',id:'h_tesla'},{type:'page'}]}]};


const CHAPTERS=[CH1,CH2,CH3,CH4,
  {id:'c5',n:5,place:'Le Vortex',year:0,vortex:1,era:'Fuera del tiempo',sci:'baron',title:'Le Baron',es:'El duelo final',color:'#c77dff',soon:true,missions:[]}];

/* ================= Learning tracker ================= */
function trackSkill(id,ok){if(!id)return;const k=S.skills[id]||(S.skills[id]={n:0,ok:0,h:[]});k.n++;if(ok)k.ok++;k.h.push(ok?1:0);if(k.h.length>10)k.h=k.h.slice(-10);S.stats.answered++;if(ok)S.stats.correct++}
function mastery(id){const k=S.skills[id];if(!k||!k.n)return {n:0,score:0,st:'none'};let w=0,t=0;k.h.forEach((v,i)=>{const wt=1+i*.25;w+=wt;t+=v*wt});const score=w?t/w:0;
  const st=k.n>=4&&score>=.8?'ok':score>=.5?'mid':'low';return {n:k.n,score,st:(k.n<3&&st==='ok')?'mid':st}}
const md=s=>hl(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');

/* ================= Mission runner ================= */
let RUN=null;const KEYS={};
function chState(id){return S.ch[id]||(S.ch[id]={done:0,stars:{},complete:false})}
function chUnlocked(ch){const i=CHAPTERS.indexOf(ch);if(ch.soon)return false;return i===0||chState(CHAPTERS[i-1].id).complete}
function startMission(ch,mi){BACK=null;AU.init();markDay();VO.stop();RUN={ch,mi,m:ch.missions[mi],i:0,err:0,hints:0,xp:0,cr:0,streak:0,r0:rankOf(S.xp).i};next()}
function playHead(){const m=RUN.m,ch=RUN.ch;const n=m.steps.length;
  $('#phTitle').innerHTML=`${esc(T(ch.place))} ${ch.year||''} · ${esc(T(m.t))} ${altC(m.t)}`;
  $('#phRight').innerHTML=`<span class="dots">${m.steps.map((s,k)=>`<i class="${k<RUN.i-1?'on':k===RUN.i-1?'cur':''}"></i>`).join('')}</span><span class="xpc" id="phXp">+${RUN.xp} XP</span>`}
async function next(){if(!RUN)return;VO.stop();KEYS.opt=null;KEYS.next=null;const m=RUN.m;if(RUN.i>=m.steps.length)return missionEnd();const st=m.steps[RUN.i++];
  if(st.type==='travel'){await travel(T(RUN.ch.era),RUN.ch.year,T(RUN.ch.place).toLocaleUpperCase(L));S.seenTravel[RUN.ch.id]=1;save();return next()}
  if(st.type==='talk'){await talk(st.lines,{scene:st.scene||RUN.ch.scene});return next()}
  show('play');playHead();const stage=$('#stage');stage.className='stage';
  ({tip:renderTip,lab:renderLab,qcm:renderQcm,num:renderNum,calc:renderCalc,colors:renderColors,boss:renderBoss,page:renderPage,meter:renderMeter,danger:renderDanger,blackout:renderBlackout})[st.type](st,stage)}
function gain(xp,el){RUN.xp+=xp;const x=$('#phXp');if(el&&x)FX.orbs(el,x,Math.min(7,Math.max(3,xp/5|0)),{done:()=>{const y=$('#phXp');if(y)y.textContent=`+${RUN.xp} XP`}});else if(x)x.textContent=`+${RUN.xp} XP`}
function nextBtn(host,label){const b=document.createElement('button');b.className='btn primary';b.id='nextBtn';b.innerHTML=`${esc(label||ui('btn.continue'))} ›`;host.append(b);b.focus({preventScroll:true});KEYS.next=()=>b.click();b.onclick=()=>{AU.play('click');next()}}
const fmtErr=n=>Number.isInteger(n)?String(n):fr(n,1);
function missionEnd(){const r=RUN,ch=r.ch,cs=chState(ch.id);const stars=r.err===0?3:r.err<=2?2:1;const first=cs.done<=r.mi;
  cs.stars[r.m.id]=Math.max(cs.stars[r.m.id]||0,stars);if(first)cs.done=r.mi+1;const last=r.mi===ch.missions.length-1;if(last)cs.complete=true;
  const bonus=(first?(r.m.boss?60:30):10);r.xp+=bonus;S.xp+=r.xp;const cr=stars*(r.m.boss?5:2);S.cr+=cr;S.stats.hist.push({d:dayStr(),a:Math.max(0,100-r.err*12),m:r.m.id});if(S.stats.hist.length>40)S.stats.hist=S.stats.hist.slice(-40);save();
  show('play');$('#phRight').innerHTML='';const nx=ch.missions[r.mi+1];
  $('#stage').className='stage';$('#stage').innerHTML=`<div class="panel end"><p class="kicker">${esc(ui(last?'end.chapter':'end.mission'))}</p><div class="end-big ok">${esc(T(r.m.t))}</div>${altC(r.m.t,'es end-alt')}
    <div class="end-stars">${starsHTML(stars).replace(/^<span class="stars"[^>]*>|<\/span>$/g,'')}</div>
    <div class="end-stats"><span><b>+${r.xp}</b>XP</span><span><b class="cry">${ICON('crystal')} +${cr}</b>${esc(uiN('end.crystals',cr))}</span><span><b>${fmtErr(r.err)}</b>${esc(uiN('end.errors',r.err))}</span>${r.hints?`<span><b>${r.hints}</b>${esc(uiN('end.hints',r.hints))}</span>`:''}</div>
    <div class="end-actions">${nx?`<button class="btn primary" id="eNext">${ICON('play')} ${esc(T(nx.t))}</button>`:''}<button class="btn ${nx?'ghost':'primary'}" id="eBack">${esc(ui(last?'end.backTimeline':'end.backList'))}</button></div></div>`;
  AU.play(last?'levelup':'unlock');FX.confetti(last?220:90);
  const nb=$('#eNext');if(nb){nb.onclick=()=>startMission(ch,r.mi+1);nb.focus()}$('#eBack').onclick=()=>{RUN=null;last?renderHub():openChapter(ch)};
  const r0=r.r0;RUN=null;setTimeout(()=>{rankCheck(r0);checkAch()},900)}
function rankCheck(r0){const r=rankOf(S.xp);if(r.i>r0){AU.play('levelup');FX.confetti(200);fx(`${emblem(r.r[2],Math.min(3,1+Math.floor(r.i/2)))}${esc(ui('rank.new'))}<small>${esc(rankName(r.r))}${altU(r.r[1],'es')}</small>`,'long')}}

/* ---------- tip card ---------- */
function renderTip(st,stage){const n=NOTES[st.id];const isNew=!S.notes[st.id];S.notes[st.id]=Date.now();save();
  const ico={loi:'book',astuce:'bulb',hist:'clock'}[n.cat];
  stage.innerHTML=`<div class="tipcard ${n.cat}"><div class="tc-h">${ICON(ico)}<span>${esc(ui('note.cat.'+n.cat))}${altU('note.cat.'+n.cat,'tc-alt')}</span>${isNew?`<em>${esc(ui('note.new'))}</em>`:''}</div><h2>${esc(T(n.fr))}${altC(n.fr,'es tc-alt')}</h2><p class="tc-b">${md(T(n.b))}</p>${altC(n.b,'es tc-alt tc-alt-b')}<p class="tc-es"><b>${esc(ui('note.x.'+n.cat))} ›</b> ${md(T(n.bes))}</p>${n.cat==='astuce'?`<div class="tc-p">${portrait('lumi','happy')}</div>`:n.cat==='hist'&&RUN?`<div class="tc-p">${portrait(RUN.ch.sci,'happy')}</div>`:''}<div class="tc-f" id="tcF"><button class="tool" id="tcRead">${esc(ui('btn.listen'))}</button></div></div>`;
  $('#tcRead').onclick=()=>VO.say(noteSpeech(n),true);if(S.settings.narr)VO.say(T(n.fr)+'. '+T(n.b));if(isNew){AU.play('ach')}nextBtn($('#tcF'),ui('btn.noted'))}
const noteSpeech=n=>T(n.fr)+'. '+T(n.b)+' '+T(n.bes);

/* ---------- lab step ---------- */
function renderLab(st,stage){const state={pts:[]};let gi=0,done=false,hintI=0,lab=null;
  stage.className='stage wide';
  stage.innerHTML=`<div class="lab-step"><div class="ls-main" id="lsMain"></div><aside class="ls-side panel"><div class="ls-title"><p class="kicker">${esc(ui('lab.k'))}</p><h2>${esc(T(st.title))}</h2>${altC(st.title)}</div>
    <ol class="goals" id="goals"></ol>${st.graph?'<div class="ls-graph" id="lsGraph"></div>':''}<div class="insp" id="insp"></div>
    <div class="ls-foot" id="lsFoot"><button class="btn sm ghost" id="lsHint">${ICON('bulb')} ${esc(ui('btn.hint'))}</button><button class="btn sm ghost" id="lsReset">${esc(ui('btn.restart'))}</button></div><p class="ls-hint" id="lsHintT" hidden></p></aside></div>`;
  const drawGoals=()=>{$('#goals').innerHTML=st.goals.map((g,k)=>`<li class="${k<gi?'ok':k===gi?'cur':''}"><i>${k<gi?'✓':k+1}</i><div><b>${hl(T(g.t))}</b>${altC(g.t,'es g-alt')}${g.es?`<span class="g-help">${hl(T(g.es))}</span>`:''}${k===gi&&g.input&&!done?`<div class="num-row"><input id="gIn" inputmode="decimal" autocomplete="off" placeholder="?" aria-label="${esc(ui('aria.answer'))}"><span>${esc(g.input.unit)}</span><button class="btn sm primary" id="gOk">OK</button></div><span class="gmsg" id="gMsg"></span>`:''}</div></li>`).join('');
    const inp=$('#gIn');if(inp){const chk=()=>{const v=num(inp.value);if(v==null){$('#gMsg').textContent=ui('msg.number');return}const g=st.goals[gi];const a=g.input.ans(lab.Q);
      if(Math.abs(v-a)<=g.input.tol){AU.play('ok');trackSkill(st.skill,true);gain(8,inp);advance()}else{RUN.err++;trackSkill(st.skill,false);AU.play('bad');shakeEl(inp);$('#gMsg').textContent=ui(g.input.unit==='mA'?'msg.wrongMA':'msg.wrongRead')}};
      $('#gOk').onclick=chk;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();chk()}};inp.focus({preventScroll:true})}};
  function advance(){const li=$$('#goals li')[gi];if(li)FX.burstEl(li,{n:16,speed:3,colors:[FX.C.ok,FX.C.volt]});gi++;if(gi>=st.goals.length)return finish();drawGoals();evalGoals()}
  let pend=false;function evalGoals(){if(done||pend||!lab||!lab.Q)return;const g=st.goals[gi];if(!g||g.input)return;let ok=false;try{ok=g.check(lab.Q,state)}catch(e){ok=false}if(ok){pend=true;AU.play('ok');gain(6,$$('#goals li')[gi]);setTimeout(()=>{pend=false;advance()},250)}}
  function finish(){done=true;drawGoals();S.stats.labs++;save();const ft=$('#lsFoot');ft.innerHTML=`<p class="ls-done">${ICON('check')} ${esc(ui('lab.done'))}</p>`;gain(15,$('#goals'));nextBtn(ft);$('.lab-board',stage).classList.add('good')}
  lab=createLab($('#lsMain'),{comps:st.board.comps,cols:st.board.cols||7,rows:st.board.rows||4,palette:st.palette,tool:st.tool,inspector:$('#insp'),genAdj:st.genAdj,resVals:st.resVals,resDefault:st.resDefault,lampTypes:st.lampTypes,showPmax:st.showPmax,showAll:st.showAll,fixPmax:st.fixPmax,Pmax:st.Pmax,fuseVals:st.fuseVals,fuseDefault:st.fuseDefault,
    onChange:()=>{if(st.graph)drawGraph();setTimeout(evalGoals,0)},onEvent:ev=>{if(st.onEvent)st.onEvent(ev,state)}});
  if(RUN)RUN.lab=lab;drawGoals();evalGoals();
  $('#lsHint').onclick=()=>{const h=st.hints||[];if(!h.length)return;const t=h[Math.min(hintI,h.length-1)];hintI++;RUN.hints++;const el=$('#lsHintT');el.hidden=false;el.innerHTML=`<b>Lumi ›</b> ${hl(T(t))}${altC(t,'es g-alt')}`;AU.play('select');VO.say(T(t),true)};
  $('#lsReset').onclick=()=>{lab.setComps(st.board.comps);state.pts=[];AU.play('click');if(st.graph)drawGraph()};
  function drawGraph(){const g=$('#lsGraph');if(!g)return;const pts=state.pts;const Imax=Math.max(.13,...pts.map(p=>p.I))*1.1,Umax=13;const W=300,H=200,L=40,B=30,px=I=>L+I/Imax*(W-L-10),py=U=>H-B-U/Umax*(H-B-10);
    let line='';if(pts.length>=3){const k=pts.reduce((a,p)=>a+p.U*p.I,0)/Math.max(1e-9,pts.reduce((a,p)=>a+p.I*p.I,0));const Ie=Math.min(Imax,Umax/k);line=`<line x1="${px(0)}" y1="${py(0)}" x2="${px(Ie)}" y2="${py(k*Ie)}" class="gr-fit"/>`}
    const tk=[0,.04,.08,.12].filter(v=>v<=Imax);g.innerHTML=`<p class="kicker">${esc(ui('graph.k'))}</p><svg viewBox="0 0 ${W} ${H}" class="gr" role="img" aria-label="${esc(ui('graph.aria'))}">
      ${[0,4,8,12].map(u=>`<line x1="${L}" x2="${W-10}" y1="${py(u)}" y2="${py(u)}" class="gr-g"/><text x="${L-6}" y="${py(u)+4}" text-anchor="end" class="gr-t">${u}</text>`).join('')}
      ${tk.map(i=>`<text x="${px(i)}" y="${H-B+16}" text-anchor="middle" class="gr-t">${fr(i,2)}</text>`).join('')}<line x1="${L}" y1="${H-B}" x2="${W-10}" y2="${H-B}" class="gr-a"/><line x1="${L}" y1="${H-B}" x2="${L}" y2="8" class="gr-a"/>
      <text x="${W-10}" y="${H-4}" text-anchor="end" class="gr-t">I (A)</text><text x="${L+4}" y="16" class="gr-t">U (V)</text>${line}${pts.map(p=>`<circle cx="${px(p.I)}" cy="${py(p.U)}" r="5" class="gr-p"/>`).join('')}</svg>
      <div class="gr-row"><button class="btn sm primary" id="grRec">${esc(ui('btn.record'))}</button><span>${esc(uiN('graph.points',pts.length))}</span></div>`;
    $('#grRec').onclick=()=>{const Q=lab.Q;const a=Q.read(Q.c(st.graph.amp)),v=Q.read(Q.c(st.graph.volt));if(a==null||v==null){toast(ui('graph.noRead'));return}
      const U=Math.abs(v),I=Math.abs(a);if(state.pts.some(p=>Math.abs(p.U-U)<.2)){toast(ui('graph.dup'));AU.play('bad');return}
      state.pts.push({U,I});AU.play('coin');drawGraph();evalGoals();const c=$$('#lsGraph .gr-p').pop();if(c)FX.burstEl(c,{n:10,speed:2})}}
  if(st.graph)drawGraph()}

/* ---------- questions ---------- */
/* botón con el código del otro idioma: muestra u oculta la pregunta traducida */
function qHead(q,kindKey){const o=TO(q.q);return `<div class="q-top"><span class="q-kind">${esc(ui(kindKey))}</span><div class="q-tools"><button class="tool" id="tRead">${esc(ui('btn.listen'))}</button>${o?`<button class="tool ${S.settings.alt?'on':''}" id="tEsBtn" aria-pressed="${!!S.settings.alt}" title="${esc(ui('q.altTitle'))}">${other().toUpperCase()}</button>`:''}</div></div><h2 class="q-text" id="qText"></h2>${o?`<p class="q-es es" id="qEs" lang="${other()}" ${S.settings.alt?'':'hidden'}>${hl(o)}</p>`:''}`}
function wireHead(q){$('#tRead').onclick=()=>VO.say(T(q.q),true);const b=$('#tEsBtn');if(b)b.onclick=e=>{const h=$('#qEs');h.hidden=!h.hidden;e.currentTarget.classList.toggle('on',!h.hidden);e.currentTarget.setAttribute('aria-pressed',String(!h.hidden))}}
function decode(el,html,done){el.innerHTML=html;const txt=el.textContent;if(RM){done&&done();return}
  const gl='▚▞▖▗▘▝01ΩΣ⌁';const dur=Math.min(1000,320+txt.length*9);const t0=performance.now();el.classList.add('decoding');let lt=0;
  const f=now=>{if(!el.isConnected)return;const p=Math.min(1,(now-t0)/dur);const k=Math.floor(p*txt.length);let out=txt.slice(0,k);for(let i=k;i<txt.length;i++)out+=txt[i]===' '?' ':gl[(Math.random()*gl.length)|0];el.textContent=out;
    if(now-lt>70){AU.play('type');lt=now}if(p<1)requestAnimationFrame(f);else{el.innerHTML=html;el.classList.remove('decoding');done&&done()}};requestAnimationFrame(f)}
/* body: texto ya traducido; src: texto original (para la línea opcional en el otro idioma) */
function fbHTML(ok,head,body,neutral,src){const k=neutral?'fb.hyp':ok?'fb.ok':'fb.bad';
  return `<div class="fb ${neutral?'neutral':ok?'ok':'bad'}"><div class="fb-h">${esc(ui(k))}${altU(k,'es')}</div>${head||''}<p>${hl(body)}</p>${src?altC(src,'es fb-alt'):''}</div>`}
function qcmInto(host,q,onDone){const opts=shuffle(q.o.map((t,i)=>({t,ok:i===0})));
  host.innerHTML=qHead(q,q.predict?'q.kind.predict':'q.kind.q')+`<div class="opts locked" id="opts">${opts.map((o,k)=>`<button class="opt" data-k="${k}"><span class="opt-k">${'ABCD'[k]}</span><span class="opt-t">${esc(T(o.t))}</span></button>`).join('')}</div><div id="fb"></div><div class="q-foot" id="qFoot"></div>`;
  wireHead(q);decode($('#qText',host),mk(T(q.q)),()=>{$('#opts',host).classList.remove('locked');if(S.settings.narr)VO.say(T(q.q))});
  const choose=k=>{if($('#opts',host).classList.contains('locked')||$('#opts',host).classList.contains('done'))return;VO.stop();const o=opts[k];const btns=$$('.opt',host);$('#opts',host).classList.add('done');const ri=opts.findIndex(x=>x.ok);
    if(q.predict){btns[k].classList.add('picked');AU.play('select');$('#fb',host).innerHTML=fbHTML(true,'',T(q.ex),true,q.ex);onDone(true,btns[k]);return}
    btns[ri].classList.add('right');if(!o.ok)btns[k].classList.add('wrong');trackSkill(q.skill,o.ok);AU.play(o.ok?'ok':'bad');if(!o.ok)shakeEl(host);else FX.burstEl(btns[ri],{n:24,speed:5});
    $('#fb',host).innerHTML=fbHTML(o.ok,o.ok?'':`<p>${esc(ui('q.right'))} <b>${esc(T(opts[ri].t))}</b></p>`,T(q.ex),false,q.ex);if(S.settings.narr)VO.say(T(q.ex));onDone(o.ok,btns[ri])};
  $$('.opt',host).forEach(b=>b.onclick=()=>choose(+b.dataset.k));KEYS.opt=k=>{if(k<opts.length)choose(k)}}
const ansFmt=(a,u)=>`${fr(a,a%1?(a<.1?3:2):0)} ${u}`;
function numInto(host,q,onDone){host.innerHTML=qHead(q,'q.kind.calc')+`<div class="num-row big"><input id="nIn" inputmode="decimal" autocomplete="off" placeholder="?" aria-label="${esc(ui('aria.answer'))}"><span>${esc(q.unit)}</span><button class="btn primary" id="nOk">${esc(ui('btn.validate'))}</button></div><div id="fb"></div><div class="q-foot" id="qFoot"></div>`;
  wireHead(q);decode($('#qText',host),mk(T(q.q)),()=>{if(S.settings.narr)VO.say(T(q.q));$('#nIn',host).focus({preventScroll:true})});let tries=0;
  const chk=()=>{const v=num($('#nIn',host).value);if(v==null){toast(ui('msg.number'));return}const ok=Math.abs(v-q.ans)<=q.tol;tries++;
    if(!ok&&tries<2&&!q.oneShot){AU.play('bad');shakeEl($('#nIn',host));$('#fb',host).innerHTML=`<div class="fb bad"><div class="fb-h">${esc(ui('fb.notYet'))}</div><p>${esc(ui('fb.retry'))}</p></div>`;return}
    $('#nIn',host).disabled=true;$('#nOk',host).disabled=true;trackSkill(q.skill,ok);AU.play(ok?'ok':'bad');if(ok)FX.burstEl($('#nIn',host),{n:24,speed:5});
    $('#fb',host).innerHTML=fbHTML(ok,ok?'':`<p>${esc(ui('q.answer'))} <b>${esc(ansFmt(q.ans,q.unit))}</b></p>`,T(q.ex),false,q.ex);if(S.settings.narr)VO.say(T(q.ex));onDone(ok&&tries===1,$('#nIn',host))};
  $('#nOk',host).onclick=chk;$('#nIn',host).onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();chk()}}}
function renderQcm(st,stage){stage.innerHTML='<div class="console panel" id="qc"></div>';qcmInto($('#qc'),st,(ok,el)=>{if(st.predict){}else if(ok)gain(10,el);else RUN.err++;nextBtn($('#qFoot'))})}
function renderNum(st,stage){stage.innerHTML='<div class="console panel" id="qc"></div>';numInto($('#qc'),st,(ok,el)=>{if(ok)gain(12,el);else RUN.err++;nextBtn($('#qFoot'))})}
function renderCalc(st,stage){stage.innerHTML=`<div class="console panel">${qHead(st,'q.kind.guided')}<div class="steps" id="steps"></div><div id="fb"></div><div class="q-foot" id="qFoot"></div></div>`;wireHead(st);let errs=0;
  decode($('#qText'),mk(T(st.q)),()=>{if(S.settings.narr)VO.say(T(st.q));step(0)});
  function step(i){const box=$('#steps');if(i>=st.steps.length)return numStep();const s=st.steps[i];const el=document.createElement('div');el.className='step';
    el.innerHTML=`<div class="st-h"><span class="st-n">${i+1}</span><span>${esc(T(s.h))}</span>${altC(s.h,'st-es')}</div><div class="chips">${shuffle(s.o.map((o,k)=>({o,k}))).map(x=>`<button class="chip" data-k="${x.k}">${esc(T(x.o))}</button>`).join('')}</div>`;box.append(el);
    $$('.chip',el).forEach(b=>b.onclick=()=>{const ok=b.dataset.k==='0';$('.chips',el).classList.add('done');const rc=$$('.chip',el).find(c=>c.dataset.k==='0');rc.classList.add('right');if(!ok){b.classList.add('wrong');errs++;AU.play('bad')}else{AU.play('select');FX.burstEl(rc,{n:10,speed:2.5})}setTimeout(()=>step(i+1),500)})}
  function numStep(){const el=document.createElement('div');el.className='step';el.innerHTML=`<div class="st-h"><span class="st-n">${st.steps.length+1}</span><span>${esc(ui('calc.result'))}</span><span class="st-es">${esc(ui('calc.resultHelp'))}</span></div><div class="num-row"><input id="cIn" inputmode="decimal" autocomplete="off" placeholder="?" aria-label="${esc(ui('aria.answer'))}"><span>${esc(st.unit)}</span><button class="btn sm primary" id="cOk">${esc(ui('btn.validate'))}</button></div>`;$('#steps').append(el);
    const inp=$('#cIn');inp.focus({preventScroll:true});const chk=()=>{const v=num(inp.value);if(v==null){toast(ui('msg.number'));return}const ok=Math.abs(v-st.ans)<=st.tol;inp.disabled=true;$('#cOk').disabled=true;if(!ok)errs++;
      const all=errs===0;trackSkill(st.skill,all);AU.play(all?'ok':'bad');if(all){gain(15,inp)}else RUN.err++;$('#fb').innerHTML=fbHTML(all,ok?'':`<p>${esc(ui('q.answer'))} <b>${esc(ansFmt(st.ans,st.unit))}</b></p>`,T(st.ex),false,st.ex);if(S.settings.narr)VO.say(T(st.ex));nextBtn($('#qFoot'))};
    $('#cOk').onclick=chk;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();chk()}}}}
/* ---------- color code mini-game ---------- */
function resistorSVG(R){const bd=bands(R);return `<svg viewBox="0 0 320 110" class="bigres" role="img" aria-label="${esc(ui('colors.aria'))}"><line x1="0" y1="55" x2="320" y2="55" stroke="#c9d3e3" stroke-width="6"/><rect x="70" y="22" width="180" height="66" rx="30" fill="#d9c49a" stroke="#8a7350" stroke-width="3"/>
  ${[[100,BAND[bd[0]]],[130,BAND[bd[1]]],[160,BAND[bd[2]]],[220,'#c9a227']].map(([x,c])=>`<rect x="${x-8}" y="23" width="16" height="64" fill="${c}"/>`).join('')}</svg>`}
function renderColors(st,stage){const pool=[10,22,33,47,68,100,150,220,330,470,680,1000,1500,2200,4700,10000,47000];let k=0,good=0;
  stage.innerHTML=`<div class="console panel" id="cc"></div>`;const round=()=>{const box=$('#cc');if(k>=st.rounds){box.innerHTML=`<p class="kicker">${esc(ui('colors.k'))}</p><div class="end-big ${good>=st.rounds-1?'ok':''}">${good} / ${st.rounds}</div><p class="cc-msg">${esc(ui(good===st.rounds?'colors.perfect':'colors.tip'))}</p><div class="q-foot" id="qFoot"></div>`;if(good===st.rounds)S.stats.colorsPerfect=1;nextBtn($('#qFoot'));return}
    const R=pick(pool);const cand=[pick([R*10,R/10]),...shuffle(pool)].filter((x,i,a)=>x>=10&&x<=100000&&x!==R&&a.indexOf(x)===i);const opts=shuffle([R,...cand.slice(0,3)].map(v=>({t:fmtR(v),ok:v===R})));
    const bd=bands(R);const cn=b=>T(BANDN[b]);box.innerHTML=`<div class="q-top"><span class="q-kind">${esc(ui('colors.kind',{k:k+1,n:st.rounds}))}</span></div><h2 class="q-text">${esc(ui('colors.q'))}</h2>${altU('colors.q','es')}${resistorSVG(R)}<p class="cc-n">${bd.map(b=>esc(cn(b))).join(' · ')} · ${esc(ui('color.gold'))}</p>
      <div class="opts grid">${opts.map((o,i)=>`<button class="opt" data-i="${i}"><span class="opt-k">${'ABCD'[i]}</span><span class="opt-t">${esc(o.t)}</span></button>`).join('')}</div><div id="fb"></div><div class="q-foot" id="qFoot"></div>`;
    KEYS.opt=i=>{const b=$$('.opt',box)[i];if(b)b.click()};
    $$('.opt',box).forEach(b=>b.onclick=()=>{if($('.opts',box).classList.contains('done'))return;$('.opts',box).classList.add('done');const o=opts[+b.dataset.i];const ri=opts.findIndex(x=>x.ok);$$('.opt',box)[ri].classList.add('right');if(!o.ok){b.classList.add('wrong');RUN.err+=.5}else{good++;gain(4,b)}
      trackSkill(st.skill,o.ok);AU.play(o.ok?'ok':'bad');$('#fb',box).innerHTML=fbHTML(o.ok,'',`[[${cn(bd[0])}]] = ${bd[0]}, [[${cn(bd[1])}]] = ${bd[1]}, [[${cn(bd[2])}]] = ${uiN('colors.zeros',bd[2])} → ${fmtR(R)}.`);
      const b2=document.createElement('button');b2.className='btn primary';b2.textContent=ui('btn.nextQ')+' ›';$('#qFoot',box).append(b2);b2.focus();KEYS.opt=null;KEYS.next=()=>b2.click();b2.onclick=()=>{k++;round()}})};round()}
/* ---------- boss quiz ---------- */
function renderBoss(st,stage){let hearts=st.hearts,k=0;const qs=st.qs;
  const draw=()=>{stage.innerHTML=`<div class="boss-bar"><span class="kicker">${esc(T(st.title))}</span><span class="hearts">${Array.from({length:st.hearts},(_,i)=>ICON('heart',i<hearts?'ht on':'ht')).join('')}</span><span aria-label="${esc(ui('boss.progress',{k:k+1,n:qs.length}))}">${k+1} / ${qs.length}</span></div><div class="console panel boss" id="qc"></div>`;
    const q=qs[k];const done=ok=>{if(!ok){hearts--;hitFlash();AU.play('hit');$$('.boss-bar .ht.on').pop()&&$$('.boss-bar .ht.on').pop().classList.remove('on')}else gain(10,$('#qc'));
      const f=$('#qFoot');const b=document.createElement('button');b.className='btn primary';
      if(hearts<=0){b.textContent=ui('btn.retry');f.append(b);b.onclick=()=>{hearts=st.hearts;k=0;RUN.err++;draw()};$('#fb').insertAdjacentHTML('beforeend',`<div class="fb bad"><div class="fb-h">${esc(ui('boss.noLives'))}</div><p>${esc(ui('boss.laugh'))}</p></div>`);return}
      b.textContent=ui(k<qs.length-1?'btn.nextQ':'boss.win')+' ›';f.append(b);b.focus();KEYS.next=()=>b.click();b.onclick=()=>{k++;if(k>=qs.length){AU.play('levelup');FX.confetti(140);next()}else draw()}};
    if(q.type==='num')numInto($('#qc'),Object.assign({oneShot:true},q),done);else qcmInto($('#qc'),q,done)};draw()}
/* ---------- page recovered ---------- */
function renderPage(st,stage){const ch=RUN.ch;stage.innerHTML=`<div class="page-rec"><div class="page-paper"><p class="pp-k">${esc(ui('page.book'))}</p><h2>${esc(T(ch.page))}</h2><p>${esc(T(ch.es))}</p>${portrait(ch.sci,'happy')}</div><p class="kicker">${esc(ui('page.got'))}</p><div id="pgF"></div></div>`;
  AU.play('levelup');FX.confetti(180);nextBtn($('#pgF'),ui('btn.endChapter'))}

/* =====================================================================
   v1.4 · Nuevos tipos de paso: contador de energía, ¿peligro o seguro? y arcade de averías
   ===================================================================== */

/* ---------- Contador de energía: horas de uso de cada aparato → kWh y coste ---------- */
const kwhFmt=v=>fr(v,v<10?2:1);
function renderMeter(st,stage){const H={};st.apps.forEach(a=>H[a.id]=a.h0||0);let gi=0,done=false,hintI=0;
  const E=()=>st.apps.reduce((s,a)=>s+a.P*H[a.id],0)/1000;
  const state=()=>({E:E(),h:H,P:st.apps.filter(a=>H[a.id]>0).reduce((s,a)=>s+a.P,0)});
  stage.className='stage wide';
  stage.innerHTML=`<div class="lab-step"><div class="ls-main"><div class="panel mtr" id="mtr">
      <div class="mtr-head"><div class="mtr-disc" id="mDisc" aria-hidden="true"><i></i></div><div><p class="kicker">${esc(ui('meter.counter'))}</p><div class="mtr-total" id="mTot" aria-live="polite"></div>${st.price?`<p class="mtr-price">${esc(ui('meter.price',{p:fr(st.price,2)}))}</p>`:''}</div></div>
      <div class="mtr-rows">${st.apps.map(a=>`<div class="mtr-row"><div class="mtr-n"><b>${esc(T(a.n))}</b><span class="mono">P = ${fmtN(a.P)} W${a.min?` · ${esc(ui('meter.min',{h:frs(a.min)}))}`:''}</span></div>
        <input type="range" id="h-${a.id}" min="${a.min||0}" max="${a.max}" step="0.5" value="${H[a.id]}" aria-label="${esc(T(a.n))}"><span class="mtr-h mono" id="hv-${a.id}"></span></div>`).join('')}</div></div></div>
    <aside class="ls-side panel"><div class="ls-title"><p class="kicker">${esc(ui('meter.k'))}</p><h2>${esc(T(st.title))}</h2>${altC(st.title)}</div><ol class="goals" id="goals"></ol>
    <div class="ls-foot" id="lsFoot"><button class="btn sm ghost" id="lsHint">${ICON('bulb')} ${esc(ui('btn.hint'))}</button></div><p class="ls-hint" id="lsHintT" hidden></p></aside></div>`;
  const paint=()=>{st.apps.forEach(a=>{$('#hv-'+a.id).textContent=`t = ${frs(H[a.id])} h`});const s=state();
    $('#mTot').innerHTML=gi<(st.hideTotal||0)?'? kWh':`${kwhFmt(s.E)} <small>kWh</small>`;
    const d=$('#mDisc i');d.style.animationDuration=s.P>0?Math.max(.25,6-Math.log10(s.P+1)*1.8)+'s':'0s';d.style.animationPlayState=s.P>0?'running':'paused'};
  const drawGoals=()=>{$('#goals').innerHTML=st.goals.map((g,k)=>`<li class="${k<gi?'ok':k===gi?'cur':''}"><i>${k<gi?'✓':k+1}</i><div><b>${hl(T(g.t))}</b>${altC(g.t,'es g-alt')}${g.es?`<span class="g-help">${hl(T(g.es))}</span>`:''}${k===gi&&g.input&&!done?`<div class="num-row"><input id="gIn" inputmode="decimal" autocomplete="off" placeholder="?" aria-label="${esc(ui('aria.answer'))}"><span>${esc(g.input.unit)}</span><button class="btn sm primary" id="gOk">OK</button></div><span class="gmsg" id="gMsg"></span>`:''}</div></li>`).join('');
    const inp=$('#gIn');if(inp){const chk=()=>{const v=num(inp.value);if(v==null){$('#gMsg').textContent=ui('msg.number');return}const g=st.goals[gi];const a=g.input.ans(state());
      if(Math.abs(v-a)<=g.input.tol){AU.play('ok');trackSkill(st.skill,true);gain(8,inp);advance()}else{RUN.err++;trackSkill(st.skill,false);AU.play('bad');shakeEl(inp);$('#gMsg').textContent=ui('meter.wrong')}};
      $('#gOk').onclick=chk;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();chk()}}}};
  function advance(){const li=$$('#goals li')[gi];if(li)FX.burstEl(li,{n:16,speed:3,colors:[FX.C.ok,FX.C.volt]});gi++;if(gi>=st.goals.length)return finish();drawGoals();paint();evalGoals()}
  let pend=false;function evalGoals(){if(done||pend)return;const g=st.goals[gi];if(!g||g.input)return;let ok=false;try{ok=g.check(state())}catch(e){}if(ok){pend=true;AU.play('ok');gain(6,$$('#goals li')[gi]);setTimeout(()=>{pend=false;advance()},250)}}
  function finish(){done=true;drawGoals();paint();save();const ft=$('#lsFoot');ft.innerHTML=`<p class="ls-done">${ICON('check')} ${esc(ui('lab.done'))}</p>`;gain(15,$('#goals'));nextBtn(ft)}
  st.apps.forEach(a=>{const r=$('#h-'+a.id);r.oninput=()=>{H[a.id]=+r.value;paint();AU.play('tick');clearTimeout(r._t);r._t=setTimeout(evalGoals,120)}});
  $('#lsHint').onclick=()=>{const h=st.hints||[];if(!h.length)return;const t=h[Math.min(hintI,h.length-1)];hintI++;RUN.hints++;const el=$('#lsHintT');el.hidden=false;el.innerHTML=`<b>Lumi ›</b> ${hl(T(t))}${altC(t,'es g-alt')}`;AU.play('select');VO.say(T(t),true)};
  drawGoals();paint();evalGoals()}

/* ---------- ¿Peligro o seguro? Tarjetas rápidas con cuenta atrás ---------- */
function renderDanger(st,stage){const cards=shuffle(st.cards);let k=0,lives=3,good=0,combo=0,timer=null,locked=false;const sec=st.sec||8;
  stage.className='stage';
  const end=win=>{clearInterval(timer);KEYS.opt=null;const stars=lives===3?3:lives===2?2:1;
    stage.innerHTML=`<div class="panel end"><p class="kicker">${esc(T(st.title))}</p><div class="end-big ${win?'ok':''}">${good} / ${cards.length}</div><p class="cc-msg">${esc(ui(win?(good===cards.length?'dg.perfect':'dg.win'):'dg.lose'))}</p><div class="q-foot" id="qFoot"></div></div>`;
    if(win){if(good===cards.length)S.stats.dangerPerfect=1;save();AU.play('levelup');FX.confetti(good*12);nextBtn($('#qFoot'))}
    else{const b=document.createElement('button');b.className='btn primary';b.textContent=ui('btn.retry');$('#qFoot').append(b);b.focus();KEYS.next=()=>b.click();b.onclick=()=>{RUN.err++;renderDanger(st,stage)}}};
  const draw=()=>{if(k>=cards.length||lives<=0)return end(lives>0);const c=cards[k];locked=false;let left=sec;
    stage.innerHTML=`<div class="boss-bar"><span class="kicker">${esc(T(st.title))}</span><span class="hearts">${Array.from({length:3},(_,i)=>ICON('heart',i<lives?'ht on':'ht')).join('')}</span><span>${k+1} / ${cards.length}</span></div>
      <div class="console panel dg"><div class="dg-time"><i id="dgBar"></i></div><p class="q-kind">${esc(ui('dg.q'))}${combo>1?` · <b class="dg-combo">×${combo}</b>`:''}</p><h2 class="q-text dg-card" id="dgCard">${hl(T(c.t))}</h2>${altC(c.t,'q-es es')}
      <div class="dg-btns"><button class="btn dg-no" id="dgSafe">✓ ${esc(ui('dg.safe'))}</button><button class="btn dg-yes" id="dgDanger">⚠ ${esc(ui('dg.danger'))}</button></div><div id="fb"></div><div class="q-foot" id="qFoot"></div></div>`;
    const answer=isDanger=>{if(locked)return;locked=true;clearInterval(timer);VO.stop();const ok=isDanger===!!c.danger;trackSkill(st.skill||'securite',ok);
      if(ok){good++;combo++;AU.play(combo>2?'combo':'ok',combo);FX.burstEl($('#dgCard'),{n:18,speed:4})}else{lives--;combo=0;RUN.err+=.5;hitFlash();AU.play('hit');shakeEl($('.dg'))}
      $('#fb').innerHTML=fbHTML(ok,`<p><b>${esc(ui(c.danger?'dg.wasDanger':'dg.wasSafe'))}</b></p>`,T(c.why),false,c.why);
      const b=document.createElement('button');b.className='btn primary';b.textContent=ui('btn.continue')+' ›';$('#qFoot').append(b);b.focus();KEYS.next=()=>b.click();b.onclick=()=>{k++;draw()};
      if(ok&&!st.slow)setTimeout(()=>{if(b.isConnected&&!b.dataset.clicked){b.dataset.clicked=1;k++;draw()}},1600)};
    $('#dgSafe').onclick=()=>answer(false);$('#dgDanger').onclick=()=>answer(true);KEYS.opt=i=>{if(i===0)answer(false);if(i===1)answer(true)};
    if(S.settings.narr)VO.say(T(c.t));
    timer=setInterval(()=>{left-=.1;const bar=$('#dgBar');if(!bar){clearInterval(timer);return}bar.style.width=Math.max(0,left/sec*100)+'%';
      if(left<=0){clearInterval(timer);if(!locked){locked=true;lives--;combo=0;RUN.err+=.5;AU.play('bad');$('#fb').innerHTML=fbHTML(false,`<p><b>${esc(ui('dg.late'))}</b> ${esc(ui(c.danger?'dg.wasDanger':'dg.wasSafe'))}</p>`,T(c.why),false,c.why);
        const b=document.createElement('button');b.className='btn primary';b.textContent=ui('btn.continue')+' ›';$('#qFoot').append(b);b.focus();KEYS.next=()=>b.click();b.onclick=()=>{k++;draw()}}}},100)};
  draw()}

/* ---------- Arcade de averías: elegir la herramienta adecuada y tocar la casa antes del apagón ---------- */
const BO_TOOLS=['cut','tape','unplug','earth'];
/* cada avería tiene su gesto correcto; el fil dénudé exige cortar primero y luego aislar */
const BO_INC={short:{fix:['cut']},water:{fix:['cut']},overload:{fix:['unplug']},earth:{fix:['earth']},bare:{fix:['cut','tape']}};
function boIcon(k){return {short:'<path d="M-14-6l8 4-6 4 12 6M2-14l8 6-6 2 10 8" stroke="#ffd27a" stroke-width="3" fill="none"/>',
  water:'<path d="M0-16q10 14 0 22q-10-8 0-22z" fill="#5ee0ff"/><path d="M-12 12h24" stroke="#5ee0ff" stroke-width="3"/>',
  overload:'<rect x="-16" y="-6" width="32" height="12" rx="3" fill="#a8b2c6"/>'+[-9,0,9].map(x=>`<path d="M${x}-6v-10" stroke="#ff5a4f" stroke-width="3"/>`).join('')+'<path d="M-6 10q6 8 12 0" stroke="#ff9f43" stroke-width="2" fill="none"/>',
  earth:'<rect x="-14" y="-14" width="28" height="28" rx="4" fill="#c9d3e3"/><circle r="8" fill="#20283a"/><path d="M14-14l8-8" stroke="#ffd27a" stroke-width="3"/>',
  bare:'<path d="M-18 4q10-14 18 0t18-2" stroke="#b8733d" stroke-width="5" fill="none"/><path d="M-2 0l4-8M2 0l6-6" stroke="#ffd27a" stroke-width="2.5"/>'}[k]||''}
function toolIcon2(t){return {cut:ICON('bolt'),tape:ICON('repeat'),unplug:ICON('plug'),earth:ICON('shield')}[t]}
function renderBlackout(st,stage){const dur=st.time||60,maxDark=st.maxDark||4,N=st.houses||9;let tool=null,houses,t0,fixed=0,dark=0,raf=null,nextSpawn=0,over=false,combo=0;
  stage.className='stage wide';
  const brief=()=>{stage.innerHTML=`<div class="panel bo-brief"><p class="kicker">${esc(T(st.title))}</p><h2>${esc(ui('bo.brief'))}</h2>
      <ul class="bo-legend">${Object.keys(BO_INC).map(k=>`<li><svg viewBox="-24 -24 48 48" aria-hidden="true">${boIcon(k)}</svg><span><b>${esc(ui('bo.i.'+k))}</b> → ${BO_INC[k].fix.map(f=>`${toolIcon2(f)} ${esc(ui('bo.t.'+f))}`).join(' + ')}</span></li>`).join('')}</ul>
      <p class="cc-msg">${esc(ui('bo.rules',{s:dur,d:maxDark}))}</p><div class="q-foot"><button class="btn primary lg" id="boGo">${ICON('play')} ${esc(ui('bo.start'))}</button></div></div>`;
    $('#boGo').onclick=start;$('#boGo').focus();KEYS.next=()=>start()};
  function start(){KEYS.next=null;houses=Array.from({length:N},(_,i)=>({i,inc:null,step:0,dl:0,dark:false}));fixed=0;dark=0;combo=0;over=false;tool=null;t0=performance.now();nextSpawn=t0+900;
    stage.innerHTML=`<div class="bo"><div class="bo-hud panel"><span class="kicker">${esc(T(st.title))}</span><span class="bo-stat">${ICON('check')} <b id="boFix">0</b></span><span class="bo-stat bad">${ICON('lock')} <b id="boDark">0</b> / ${maxDark}</span><span class="bo-stat mono" id="boT">${dur} s</span></div>
      <div class="bo-city" id="boCity">${houses.map(h=>`<button class="bo-h" data-i="${h.i}" aria-label="${esc(ui('bo.house',{n:h.i+1}))}"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M10 48 L50 14 L90 48 V92 H10Z" class="bo-wall"/><rect x="40" y="62" width="20" height="30" class="bo-door"/><rect x="18" y="54" width="16" height="14" class="bo-win"/><rect x="66" y="54" width="16" height="14" class="bo-win"/><g class="bo-inc" transform="translate(50 36)"></g></svg><i class="bo-dl"></i></button>`).join('')}</div>
      <div class="bo-tools" role="toolbar" aria-label="${esc(ui('lab.tools'))}">${BO_TOOLS.map((t,k)=>`<button class="ltool" data-t="${t}" aria-pressed="false">${toolIcon2(t)}<span>${k+1} · ${esc(ui('bo.t.'+t))}</span></button>`).join('')}</div>
      <p class="bo-msg" id="boMsg" aria-live="polite">${esc(ui('bo.pick'))}</p></div>`;
    $$('.bo-tools .ltool').forEach(b=>b.onclick=()=>pick(b.dataset.t));KEYS.opt=i=>{if(BO_TOOLS[i])pick(BO_TOOLS[i])};
    $$('.bo-h').forEach(b=>b.onclick=()=>hit(+b.dataset.i));AU.play('power');raf=requestAnimationFrame(loop)}
  function pick(t){tool=t;AU.play('select');$$('.bo-tools .ltool').forEach(b=>{const on=b.dataset.t===t;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))})}
  const msg=(k,v,cls)=>{const m=$('#boMsg');if(m){m.textContent=ui(k,v);m.className='bo-msg '+(cls||'')}};
  function paintHouse(h){const b=$(`.bo-h[data-i="${h.i}"]`);if(!b)return;b.classList.toggle('alarm',!!h.inc);b.classList.toggle('dark',h.dark);
    b.querySelector('.bo-inc').innerHTML=h.inc?boIcon(h.inc):'';b.setAttribute('aria-label',ui('bo.house',{n:h.i+1})+(h.inc?' · '+ui('bo.i.'+h.inc):'')+(h.dark?' · '+ui('bo.dark'):''))}
  function hit(i){if(over)return;const h=houses[i];if(h.dark||!h.inc){AU.play('click');return}if(!tool){msg('bo.pick');AU.play('bad');return}
    const need=BO_INC[h.inc].fix[h.step];
    if(tool===need){h.step++;if(h.step>=BO_INC[h.inc].fix.length){const k=h.inc;h.inc=null;h.step=0;fixed++;combo++;AU.play(combo>2?'combo':'ok',combo);FX.burstEl($(`.bo-h[data-i="${i}"]`),{n:20,speed:4,colors:[FX.C.ok,FX.C.volt]});trackSkill('securite',true);msg('bo.ok.'+k,{},'ok');$('#boFix').textContent=fixed}
      else{AU.play('select');msg('bo.step2',{},'ok')}}
    else{combo=0;RUN.err+=.25;trackSkill('securite',false);AU.play('bad');shakeEl($(`.bo-h[data-i="${i}"]`));msg(h.inc==='bare'&&h.step===0&&tool==='tape'?'bo.cutFirst':'bo.wrong.'+h.inc,{},'bad')}
    paintHouse(h)}
  function loop(now){if(over||!$('#boCity'))return;const el=(now-t0)/1000,left=Math.max(0,dur-el);$('#boT').textContent=Math.ceil(left)+' s';const prog=el/dur;
    if(now>=nextSpawn){const free=houses.filter(h=>!h.inc&&!h.dark);if(free.length){const h=pick1(free);const kinds=Object.keys(BO_INC);h.inc=kinds[Math.floor(Math.random()*kinds.length)];h.step=0;h.life=Math.max(4.5,8.5-prog*4)*(h.inc==='bare'?1.4:1);h.dl=now+h.life*1000;AU.play('zap');paintHouse(h)}
      nextSpawn=now+Math.max(1100,2600-prog*1500)*(0.75+Math.random()*.5)}
    houses.forEach(h=>{const b=$(`.bo-h[data-i="${h.i}"] .bo-dl`);if(h.inc){const r=(h.dl-now)/(h.life*1000);if(b)b.style.width=Math.max(0,r*100)+'%';if(now>=h.dl){h.inc=null;h.dark=true;dark++;combo=0;AU.play('boom');hitFlash();$('#boDark').textContent=dark;paintHouse(h);msg('bo.lost',{},'bad')}}else if(b)b.style.width='0%'});
    if(dark>=maxDark)return finish(false);if(left<=0)return finish(true);raf=requestAnimationFrame(loop)}
  const pick1=a=>a[Math.floor(Math.random()*a.length)];
  function finish(win){over=true;cancelAnimationFrame(raf);KEYS.opt=null;if(win&&dark>1)RUN.err+=1;
    stage.innerHTML=`<div class="panel end"><p class="kicker">${esc(T(st.title))}</p><div class="end-big bo-big ${win?'ok':''}">${esc(ui(win?'bo.win':'bo.lose'))}</div><p class="cc-msg">${esc(ui('bo.score',{f:fixed,d:dark}))}</p><div class="q-foot" id="qFoot"></div></div>`;
    if(win){if(dark===0)S.stats.blackoutPerfect=1;save();AU.play('levelup');FX.confetti(140);nextBtn($('#qFoot'))}
    else{const b=document.createElement('button');b.className='btn primary';b.textContent=ui('btn.retry');$('#qFoot').append(b);b.focus();KEYS.next=()=>b.click();b.onclick=()=>{RUN.err++;brief()}}}
  brief()}

/* ================= Achievements ================= */
const ACH=[
  ['lab1','bolt',1,'Premier circuit','Encender la primera lámpara',()=>S.stats.labs>=1],
  ['burn','flame',1,'Ça sent le brûlé','Fundir una lámpara o una resistencia',()=>S.stats.burns>=1],
  ['short','bolt',1,'Court-circuit !','Provocar un cortocircuito (y aprender por qué)',()=>S.stats.shorts>=1],
  ['c1','trophy',2,'Ami d\'Ampère','Terminar el capítulo de París 1820',()=>chState('c1').complete],
  ['c2','trophy',2,'Ami d\'Ohm','Terminar el capítulo de Colonia 1827',()=>chState('c2').complete],
  ['stars1','star',2,'Sans faute','Terminar un capítulo con todas las estrellas',()=>CHAPTERS.some(c=>!c.soon&&chState(c.id).complete&&c.missions.every(m=>(chState(c.id).stars[m.id]||0)===3))],
  ['notes10','book',1,'Carnet bien rempli','Desbloquear 10 páginas del cuaderno',()=>Object.keys(S.notes).length>=10],
  ['colors','eye',2,'Œil de lynx','Código de colores sin un solo fallo',()=>!!S.stats.colorsPerfect],
  ['q50','check',1,'50 bonnes réponses','50 aciertos en total',()=>S.stats.correct>=50],
  ['labs10','gear',2,'Chercheur','Superar 10 experimentos',()=>S.stats.labs>=10],
  ['sand','puzzle',1,'Bricoleur','Probar el laboratorio libre',()=>!!S.stats.sandbox],
  ['days3','clock',1,'Régulier','Jugar 3 días seguidos',()=>dayStreak()>=3]
].map(([id,g,t,fr_,es,test])=>({id,g,t,fr:fr_,es,test})).concat([
  ['shop1','plug',1,()=>Object.keys(S.shop.own).length>=1],['gen3','bolt',2,()=>S.shop.gen>=3],['gen6','bolt',3,()=>S.shop.gen>=6],['tycoon','crystal',3,()=>(S.shop.earned||0)>=100],
  ['pz1','puzzle',1,()=>Object.keys(S.pz).length>=1],['pz3s','star',2,()=>Object.values(S.pz).filter(v=>v===3).length>=3],['pzall','trophy',3,()=>PUZZLES.every(p=>S.pz[p.id])],
  ['anom5','repeat',2,()=>S.rev.n>=5],
  ['c3','trophy',2,()=>chState('c3').complete],['c4','trophy',2,()=>chState('c4').complete],
  ['safe','shield',2,()=>!!S.stats.dangerPerfect],['blackout','bolt',3,()=>!!S.stats.blackoutPerfect],
  ['master','trophy',3,()=>PUZZLES.filter(p=>p.master).every(p=>S.pz[p.id])]].map(([id,g,t,test])=>({id,g,t,k:'ach.'+id,test})));
const achName=a=>a.k?ui(a.k+'.n'):T(a.fr), achDesc=a=>a.k?ui(a.k+'.d'):T(a.es);
const ACH_CR=[0,10,25,60];let achQ=[],achBusy=false;
function checkAch(){const got=[];ACH.forEach(a=>{if(!S.ach[a.id]){let ok=false;try{ok=a.test()}catch(e){}if(ok){S.ach[a.id]=Date.now();S.cr+=ACH_CR[a.t];got.push(a)}}});if(got.length){save();got.slice(0,4).forEach(a=>achQ.push(a));pumpAch()}return got}
function pumpAch(){if(achBusy||!achQ.length)return;achBusy=true;const a=achQ.shift();const el=document.createElement('div');el.className='achtoast';
  el.innerHTML=`${emblem(a.g,a.t)}<div><small>${esc(ui('ach.unlocked'))}</small><b>${esc(achName(a))}</b><span>${esc(achDesc(a))} · <span class="cry">${ICON('crystal')}+${ACH_CR[a.t]}</span></span></div>`;
  $('#achStack').append(el);AU.play('ach');setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),420)},3800);setTimeout(()=>{achBusy=false;pumpAch()},900)}

/* ================= Screens ================= */
function show(n){$$('.screen').forEach(s=>s.hidden=s.id!=='scr-'+n);window.scrollTo(0,0);document.body.dataset.scr=n}
function headHTML(){const rk=rankOf(S.xp);const lo=rk.r[0],hi=rk.nx?rk.nx[0]:rk.r[0]+1000;
  return `<header class="cmd-head"><div class="brand">CHRONO<span>·</span>OHM</div><div class="pilot">${emblem(rk.r[2],Math.min(3,1+Math.floor(rk.i/2)))}<div class="pilot-txt"><div class="pilot-l"><span>${esc(playerName())} · ${esc(rankName(rk.r))}</span>${altU(rk.r[1],'es')}</div><div class="xpbar"><i style="width:${Math.min(100,(S.xp-lo)/(hi-lo)*100)}%"></i></div><div class="xp-n">${rk.nx?esc(ui('head.xpTo',{xp:S.xp,left:rk.nx[0]-S.xp,rank:rankName(rk.nx)})):`${S.xp} XP`}</div></div></div>
    <div class="res"><span class="cry" title="${esc(ui('head.crystals'))}">${ICON('crystal')} ${S.cr}</span></div><div class="head-btns"><button class="iconbtn" id="btnSound" aria-label="${esc(ui('head.sound'))}">${ICON((S.settings.music||S.settings.sfx)?'sound':'mute')}</button><button class="iconbtn" id="btnSettings" aria-label="${esc(ui('set.title'))}">${ICON('cog')}</button></div></header>`}
function wireTop(){$('#btnSound').onclick=()=>{AU.init();const on=!(S.settings.music||S.settings.sfx);AU.setMusic(on);AU.setSfx(on);save();rerender()};$('#btnSettings').onclick=openSettings}
/* vuelve a pintar la pantalla de menú en la que estamos (tras cambiar idioma o sonido) */
let VIEW={f:'hub'};
let BACK=null;
function rerender(){const v=VIEW;if(v.f==='shop')openShop();else if(v.f==='pz')openPuzzles();else if(v.f==='chapter')openChapter(v.ch);else if(v.f==='notes')openNotes();else if(v.f==='skills')openSkills();else if(v.f==='credits')openCredits();else renderHub()}
function nextTarget(){for(const ch of CHAPTERS){if(ch.soon)return {ch,soon:true};const cs=chState(ch.id);if(!cs.complete)return {ch,mi:cs.done}}return null}
function renderHub(){VIEW={f:'hub'};show('hub');const nt=nextTarget();const h=$('#scr-hub');
  const msg=!nt?esc(ui('hub.allDone')):nt.soon?esc(nt.ch.vortex?ui('hub.soonVortex'):ui('hub.soon',{place:T(nt.ch.place),year:nt.ch.year})):`${esc(ui('hub.next'))} <span class="frw">${esc(T(nt.ch.place))} ${nt.ch.year}</span> · ${esc(T(nt.ch.missions[nt.mi].t))}`;
  const tm=chState('c4').complete,mLeft=PUZZLES.filter(p=>p.master&&!S.pz[p.id]).length;
  h.innerHTML=headHTML()+`<section class="hero panel ${tm?'tesla':''}"><div class="hero-art">${portrait(tm?'tesla':'lumi','happy')}</div><div class="hero-txt"><p class="kicker">${esc(ui('hub.k'))}</p><h1 class="hero-h">${nt&&!nt.soon?esc(T(nt.ch.place))+' <span>'+nt.ch.year+'</span>':esc(ui('hub.chronotron'))}</h1><p class="bubble">${tm?`<b>Tesla ›</b> ${esc(mLeft?uiN('hub.tesla',mLeft):ui('hub.teslaDone'))}`:`<b>Lumi ›</b> ${msg}`}</p>
      ${tm?`<button class="btn primary lg" id="goMaster">${ICON('trophy')} ${esc(ui('master.title'))}</button>`:''}${nt&&!nt.soon?`<button class="btn primary lg" id="goNext">${ICON('play')} ${esc(ui(chState(nt.ch.id).done?'btn.continue':'hub.travel'))}</button>`:''}</div></section>
    <h2 class="sec">${esc(ui('hub.timeline'))} ${altU('hub.timeline')}</h2>
    <div class="timeline">${CHAPTERS.map(ch=>{const cs=chState(ch.id),un=chUnlocked(ch),n=ch.missions.length;const stars=Object.values(cs.stars).reduce((a,b)=>a+b,0);
      return `<button class="era ${un?'':'locked'} ${cs.complete?'done':''} ${ch.soon?'soon':''}" data-c="${ch.id}" style="--ec:${ch.color}"><span class="era-y">${ch.year||'∞'}</span><span class="era-m">${portrait(ch.sci,cs.complete?'happy':'neutral')}</span><span class="era-p">${esc(T(ch.place))}</span><span class="era-t">${esc(T(ch.title))}<small>${esc(T(ch.es))}</small></span>
        <span class="era-s">${ch.soon?esc(ui('hub.soonTag')):!un?ICON('lock')+' '+esc(ui('hub.locked')):cs.complete?`${ICON('check')} ${stars}/${n*3} ★`:esc(ui('hub.missions',{d:cs.done,n}))}</span></button>`}).join('<i class="tl-link"></i>')}</div>
    <div class="cards">
      <button class="panel card act" id="goNotes"><h3>${ICON('book')} ${esc(ui('notes.title'))}<small>${esc(ui('hub.notesSub'))}</small></h3><p>${esc(ui('hub.pages',{n:Object.keys(S.notes).length,t:Object.keys(NOTES).length}))}</p></button>
      <button class="panel card act" id="goSand"><h3>${ICON('gear')} ${esc(ui('sand.title'))}<small>${esc(ui('hub.sandSub'))}</small></h3><p>${esc(ui('hub.sandText'))}</p></button>
      <button class="panel card act" id="goShop"><h3>${ICON('hangar')} ${esc(ui('shop.title'))}<small>${esc(ui('hub.shopSub'))}</small></h3><p>${esc(ui('hub.shopText',{w:shopLoad(),c:GEN_LEVELS[S.shop.gen-1].w}))}</p></button>
      <button class="panel card act ${pzOpenCount()?'':'dimmed'}" id="goPz"><h3>${ICON('puzzle')} ${esc(ui('pz.title'))}<small>${esc(ui('hub.pzSub'))}</small></h3><p>${esc(ui('hub.pzText',{s:Object.values(S.pz).reduce((a,b)=>a+b,0),t:PUZZLES.length*3}))}</p></button>
      <button class="panel card act ${revPool().length>=5?'':'dimmed'}" id="goRev"><h3>${ICON('repeat')} ${esc(ui('rev.title'))}<small>${esc(ui('hub.revSub'))}</small></h3><p>${esc(revDoneToday()?ui('hub.revDone'):revPool().length>=5?ui('hub.revReady'):ui('hub.revLocked'))}</p></button>
      <button class="panel card act" id="goSkills"><h3>${ICON('chart')} ${esc(ui('skills.title'))}<small>${esc(ui('hub.skillsSub'))}</small></h3><p>${esc(ui('hub.skillsText',{ok:SKILLS.filter(s=>mastery(s.id).st==='ok').length,n:SKILLS.length,m:Object.keys(S.ach).length}))}</p></button></div>
    <p class="hub-foot"><button class="linkbtn" id="goCredits">${esc(ui('credits.link'))}</button></p>`;
  wireTop();const g=$('#goNext');if(g)g.onclick=()=>{AU.play('click');openChapter(nt.ch,true)};const gm=$('#goMaster');if(gm)gm.onclick=()=>{AU.play('click');openPuzzles();const mh=$('#masterHead');if(mh)mh.scrollIntoView({block:'start'})};
  $$('.era',h).forEach(b=>b.onclick=()=>{const ch=CHAPTERS.find(c=>c.id===b.dataset.c);if(ch.soon){toast(ui('toast.soon'));return}if(!chUnlocked(ch)){AU.play('bad');toast(ui('toast.prevChapter'));return}AU.play('click');openChapter(ch)});
  $('#goNotes').onclick=()=>openNotes();$('#goSand').onclick=()=>openSandbox();$('#goShop').onclick=()=>openShop();$('#goPz').onclick=()=>openPuzzles();$('#goRev').onclick=()=>{if(revPool().length<5){AU.play('bad');toast(ui('hub.revLocked'));return}startReview()};$('#goSkills').onclick=()=>openSkills();$('#goCredits').onclick=()=>openCredits()}
function openChapter(ch,autoplay){const cs=chState(ch.id);if(autoplay&&cs.done<ch.missions.length&&cs.done===0)return startMission(ch,0);VIEW={f:'chapter',ch};show('hub');const h=$('#scr-hub');
  h.innerHTML=headHTML()+`<button class="btn sm ghost" id="back">‹ ${esc(ui('hub.timeline'))}</button><section class="chap panel" style="--ec:${ch.color}">${portrait(ch.sci,cs.complete?'happy':'neutral')}<div><p class="kicker">${esc(ui('chap.k',{n:ch.n,era:T(ch.era)}))}</p><h1>${esc(T(ch.title))}</h1><p class="es">${esc(T(ch.es))}</p></div></section>
    <div class="mlist">${ch.missions.map((m,i)=>{const un=i<=cs.done,st=cs.stars[m.id]||0;return `<button class="panel mi ${un?'':'locked'} ${m.boss?'boss':''}" data-i="${i}"><span class="mi-n">${m.boss?ICON('trophy'):'0'+(i+1)}</span><span class="mi-t">${esc(T(m.t))}${S.settings.alt?`<small lang="${other()}">${esc(TO(m.t))}</small>`:''}</span><span class="mi-s">${un?(st?starsHTML(st):`<span class="btn sm primary">${ICON('play')} ${esc(ui('btn.play'))}</span>`):ICON('lock')}</span></button>`}).join('')}</div>`;
  wireTop();$('#back').onclick=()=>renderHub();$$('.mi',h).forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(i>cs.done){AU.play('bad');toast(ui('toast.prevMission'));return}AU.play('click');startMission(ch,i)})}
let notesTab='loi';
function openNotes(){VIEW={f:'notes'};show('hub');const h=$('#scr-hub');const tabs=['loi','astuce','hist'];
  const list=Object.entries(NOTES).filter(([,n])=>n.cat===notesTab);
  h.innerHTML=headHTML()+`<button class="btn sm ghost" id="back">‹ ${esc(ui('btn.workshop'))}</button><h2 class="sec">${esc(ui('notes.title'))} <span class="es">${esc(ui('notes.sub'))}</span></h2>
    <div class="subtabs" role="tablist">${tabs.map(k=>`<button role="tab" data-t="${k}" aria-selected="${notesTab===k}">${esc(ui('notes.tab.'+k))}</button>`).join('')}</div>
    <div class="notes">${list.map(([id,n])=>S.notes[id]?`<article class="note ${n.cat}"><h3>${esc(T(n.fr))}</h3><p>${md(T(n.b))}</p><p class="note-x"><b>${esc(ui('note.x.'+n.cat))} ›</b> ${md(T(n.bes))}</p>${S.settings.alt&&TO(n.b)?`<p class="es" lang="${other()}">${md(TO(n.b))}</p>`:''}<button class="tool" data-say="${id}">${esc(ui('btn.listen'))}</button></article>`:`<article class="note locked"><h3>???</h3><p>${esc(ui('notes.locked'))}</p></article>`).join('')}</div>`;
  wireTop();$('#back').onclick=()=>renderHub();$$('.subtabs button',h).forEach(b=>b.onclick=()=>{notesTab=b.dataset.t;openNotes()});$$('[data-say]',h).forEach(b=>b.onclick=()=>VO.say(noteSpeech(NOTES[b.dataset.say]),true))}
function openSkills(){VIEW={f:'skills'};show('hub');const h=$('#scr-hub');const ms=SKILLS.map(s=>({s,m:mastery(s.id)}));const acc=S.stats.answered?Math.round(S.stats.correct/S.stats.answered*100):0;
  h.innerHTML=headHTML()+`<button class="btn sm ghost" id="back">‹ ${esc(ui('btn.workshop'))}</button><h2 class="sec">${esc(ui('skills.title'))} <span class="es">${esc(ui('skills.sub'))}</span></h2>
    <div class="panel skills">${ms.map(x=>`<div class="sk-row"><i class="mdot ${x.m.st}"></i><span class="sk-t">${esc(T(x.s.fr))}<small>${x.m.n?esc(uiN('skills.tries',x.m.n)):esc(ui('skills.noData'))}</small></span><span class="mbar"><i class="${x.m.st}" style="width:${x.m.n?Math.max(6,Math.round(x.m.score*100)):0}%"></i></span></div>`).join('')}
      <div class="legend"><span><i class="mdot ok"></i>${esc(ui('skills.ok'))}</span><span><i class="mdot mid"></i>${esc(ui('skills.mid'))}</span><span><i class="mdot low"></i>${esc(ui('skills.low'))}</span><span><i class="mdot"></i>${esc(ui('skills.none'))}</span></div></div>
    <div class="tiles">${[[S.stats.correct,'tile.correct'],[acc+' %','tile.acc'],[S.stats.labs,'tile.labs'],[fmtTime(S.stats.time),'tile.time'],[S.stats.burns,'tile.burns'],[S.stats.shorts,'tile.shorts']].map(x=>`<div class="tile"><b>${x[0]}</b><span>${esc(ui(x[1]))}</span></div>`).join('')}</div>
    <h2 class="sec">${esc(ui('skills.medals'))} <span class="es">${Object.keys(S.ach).length} / ${ACH.length}</span></h2><div class="ach-grid">${ACH.map(a=>{const got=!!S.ach[a.id];return `<div class="panel ach ${got?'':'locked'}">${emblem(a.g,a.t,!got)}<div><b>${esc(achName(a))}</b><span>${esc(achDesc(a))}</span></div></div>`}).join('')}</div>`;
  wireTop();$('#back').onclick=()=>renderHub()}
function openSandbox(){S.stats.sandbox=1;BACK=null;save();show('play');RUN=null;$('#phTitle').innerHTML=`${esc(ui('sand.title'))} ${altU('sand.title')}`;$('#phRight').innerHTML='';const stage=$('#stage');stage.className='stage wide';
  stage.innerHTML=`<div class="lab-step"><div class="ls-main" id="lsMain"></div><aside class="ls-side panel"><div class="ls-title"><p class="kicker">${esc(ui('sand.k'))}</p><h2>${esc(ui('sand.title'))}</h2><p class="ls-sub">${esc(ui('sand.text'))}</p></div><div class="insp" id="insp"></div>
    <div class="ls-foot"><button class="btn sm ghost" id="sbClear">${esc(ui('sand.clear'))}</button><button class="btn sm ghost" id="sbDemo">${esc(ui('sand.demo'))}</button></div>
    <div class="sb-ideas"><p class="kicker">${esc(ui('sand.ideas'))}</p><ul><li>${esc(ui('sand.idea1'))}</li><li>${esc(ui('sand.idea2'))}</li><li>${esc(ui('sand.idea3'))}</li></ul></div></aside></div>`;
  const all={wire:Infinity,gen:Infinity,lamp:Infinity,res:Infinity,amp:Infinity,volt:Infinity,sw:Infinity,fuse:Infinity,motor:Infinity};
  const demo=board([{t:'gen',e:'v:1,1',E:6,dir:1,lab:'G1'},{t:'lamp',e:'h:3,0',lt:'l6a',lab:'L1'},{t:'amp',e:'h:1,0',lab:'A1',dir:1}]).map(c=>Object.assign(c,{lock:0,lockVal:0,lockDir:0}));
  const lab=createLab($('#lsMain'),{cols:9,rows:5,comps:demo,palette:all,showAll:true,genAdj:true,inspector:$('#insp'),tool:'select',showPmax:true,onChange:()=>{},onEvent:()=>setTimeout(checkAch,500)});
  $('#sbClear').onclick=()=>lab.setComps([]);$('#sbDemo').onclick=()=>lab.setComps(demo);checkAch()}
/* créditos y licencias: obligatorio para las fuentes (OFL) y útil para la versión a la venta */
function openCredits(){VIEW={f:'credits'};show('hub');const h=$('#scr-hub');
  h.innerHTML=headHTML()+`<button class="btn sm ghost" id="back">‹ ${esc(ui('btn.workshop'))}</button><h2 class="sec">${esc(ui('credits.title'))}</h2>
    <div class="panel credits"><p class="ver">${esc(ui('credits.version',{v:VERSION}))}</p><p>${esc(ui('credits.made'))}</p><h3>${esc(ui('credits.fontsH'))}</h3><ul><li>Atkinson Hyperlegible — Braille Institute of America</li><li>IM Fell English SC — Igino Marini</li><li>Oxanium — Severin Meyer</li><li>Share Tech Mono — Carrois Apostrophe</li></ul><p class="small">${esc(ui('credits.ofl'))}</p>
    <h3>${esc(ui('credits.soundH'))}</h3><p>${esc(ui('credits.sound'))}</p><h3>${esc(ui('credits.privH'))}</h3><p>${esc(ui('credits.priv'))}</p></div>`;
  wireTop();$('#back').onclick=()=>renderHub()}

/* =====================================================================
   v1.3 · Taller del Chronotron, Desafíos con estrellas y Anomalías (repaso)
   ===================================================================== */

/* ---------- Taller v1.4: red de 24 V, cuadro con 3 líneas, fusibles, cables y producción ---------- */
const GEN_LEVELS=[{w:20,cost:0},{w:50,cost:40},{w:100,cost:90},{w:200,cost:160},{w:350,cost:260},{w:500,cost:400}];
const SHOP_U=24;
const KWH_CR=5;          /* precio del kWh en cristales */
const PEND_MAX_H=12;     /* la producción se acumula como mucho 12 h */
/* la potencia no se muestra hasta que el jugador la calcula: P = U × I.  r = cristales por hora (aparatos productivos) */
const DEVICES=[{id:'garland',I:.25,cost:6},{id:'lamp',I:.5,cost:8},{id:'radio',I:.5,cost:12},{id:'fan',I:1,cost:15},
  {id:'neon',I:1.5,cost:25},{id:'console',I:2,cost:30},{id:'coffee',I:3,cost:35},{id:'tesla',I:2.5,cost:40},
  {id:'solder',I:2,cost:45,r:.5},{id:'fridge',I:2.5,cost:55},{id:'charger',I:4,cost:65,r:1},{id:'printer3d',I:5,cost:80,r:1.5},
  {id:'robot',I:4,cost:95,r:2},{id:'lathe',I:6,cost:120,r:2.5},{id:'heater',I:10,cost:130},{id:'compressor',I:12.5,cost:170,r:3}];
/* líneas del cuadro: sección del cable, intensidad máxima que aguanta y generador necesario */
const LINES={A:{mm:'1,5',max:16,gen:1},B:{mm:'2,5',max:20,gen:3},C:{mm:'6',max:32,gen:5}};
const FUSES=[2,5,10,16,20,25,32];
const devP=d=>SHOP_U*d.I;
const shopCap=()=>GEN_LEVELS[S.shop.gen-1].w;
const lineOf=d=>LINES[S.shop.ln[d.id]]&&S.shop.gen>=LINES[S.shop.ln[d.id]].gen?S.shop.ln[d.id]:'A';
const onDevs=()=>DEVICES.filter(d=>S.shop.own[d.id]&&S.shop.on[d.id]);
const shopLoad=()=>onDevs().reduce((a,d)=>a+devP(d),0);
const lineI=L=>onDevs().filter(d=>lineOf(d)===L).reduce((a,d)=>a+d.I,0);
const prodRate=()=>onDevs().reduce((a,d)=>a+(d.r||0),0);
const lineOpen=L=>S.shop.gen>=LINES[L].gen;
/* acumula producción y consumo desde la última vez (tiempo real, máximo 12 h) */
function accrue(){const now=Date.now(),p=S.shop.pend;if(!S.shop.t){S.shop.t=now;return}let dh=Math.max(0,(now-S.shop.t)/3.6e6);S.shop.t=now;dh=Math.min(dh,Math.max(0,PEND_MAX_H-p.h));
  if(!onDevs().length)return;p.h+=dh;p.prod+=dh*prodRate();p.kwh+=dh*shopLoad()/1000}
const SLOTS={garland:[300,62],neon:[770,62],lamp:[235,190],radio:[320,300],tesla:[195,385],solder:[330,410],
  coffee:[905,150],fan:[690,190],heater:[800,200],console:[705,330],fridge:[950,300],printer3d:[455,400],charger:[545,415],robot:[630,395],lathe:[820,410],compressor:[940,420]};
function devIcon(id,on){const g=on?'':'off';const glow=c=>on?`<circle r="44" fill="${c}" opacity=".18" class="dv-glow"/>`:'';
  const I={
   lamp:`${glow('#ffd27a')}<path d="M-14 34h28M0 34V6" stroke="#8a93a6" stroke-width="5"/><path d="M-22 6h44L12-18h-24z" fill="#5a6378"/><path d="M-22 6h44" stroke="#8a93a6" stroke-width="2"/><circle cy="-22" r="13" fill="${on?'#ffe7a8':'#3a4152'}"/>${on?'<path d="M-30 14l-10 14M30 14l10 14M0 16v16" stroke="#ffe7a8" stroke-width="2" opacity=".5"/>':''}`,
   garland:`${on?'<rect x="-110" y="-24" width="220" height="48" fill="#ffd27a" opacity=".08"/>':''}<path d="M-100-10 Q-50 18 0-10 T100-10" fill="none" stroke="#6d7891" stroke-width="3"/>${[-90,-60,-30,0,30,60,90].map((x,i)=>`<circle cx="${x}" cy="${Math.abs(Math.sin((x+100)/100*Math.PI))*12-6}" r="7" fill="${on?['#ff5a4f','#ffd27a','#5ee0ff','#4fd18b'][i%4]:'#3a4152'}"/>`).join('')}`,
   radio:`${glow('#5ee0ff')}<rect x="-34" y="-20" width="68" height="44" rx="8" fill="#6b4626"/><rect x="-34" y="-20" width="68" height="8" rx="4" fill="#8a5a33"/><circle cx="-12" cy="2" r="13" fill="#2b1c12" stroke="#c9a227" stroke-width="2"/><path d="M-20 2h16M-12-6v16" stroke="#4a3220" stroke-width="1.5"/><rect x="8" y="-8" width="18" height="8" rx="2" fill="${on?'#5ee0ff':'#2b3346'}"/><circle cx="12" cy="12" r="3" fill="#c9a227"/><circle cx="22" cy="12" r="3" fill="#c9a227"/><path d="M20-20l14-26" stroke="#8a93a6" stroke-width="3"/>${on?'<path d="M40-30q8 6 0 12M48-36q12 12 0 24" stroke="#5ee0ff" stroke-width="2.5" fill="none"/>':''}`,
   fan:`${glow('#9fd4ff')}<path d="M0 30v14M-18 44h36" stroke="#8a93a6" stroke-width="5"/><circle r="30" fill="#1a2232" stroke="#8a93a6" stroke-width="3"/><g class="${on?'dv-spin':''}">${[0,120,240].map(a=>`<ellipse rx="8" ry="22" cy="-13" fill="#c9d3e3" transform="rotate(${a})"/>`).join('')}</g><circle r="5" fill="#5a6378"/><path d="M-30 0h60M0-30v60" stroke="#8a93a6" stroke-width="1" opacity=".5"/>`,
   neon:`${glow('#ff5ee6')}<rect x="-74" y="-26" width="148" height="52" rx="10" fill="#1a1426" stroke="#3d2f55" stroke-width="3"/><text y="11" text-anchor="middle" font-family="Oxanium,sans-serif" font-weight="700" font-size="30" fill="none" stroke="${on?'#ff5ee6':'#4a3a66'}" stroke-width="2.2" class="${on?'dv-neon':''}">OHM</text>`,
   console:`${glow('#4fd18b')}<rect x="-40" y="-34" width="80" height="54" rx="6" fill="#20283a" stroke="#5a6378" stroke-width="3"/><rect x="-32" y="-26" width="64" height="38" fill="${on?'#0b2a1c':'#0a0e18'}"/>${on?'<path d="M-26-16h30M-26-8h44M-26 0h20M-26 6h36" stroke="#4fd18b" stroke-width="3"/>':''}<path d="M-12 20v10h24V20" fill="#5a6378"/>`,
   coffee:`${glow('#ffb347')}<rect x="-30" y="-40" width="60" height="76" rx="8" fill="#7a2e2a"/><rect x="-30" y="-40" width="60" height="10" rx="5" fill="#9a3e38"/><rect x="-20" y="-30" width="40" height="16" rx="3" fill="${on?'#ffb347':'#2b1c12'}"/><path d="M-12 8h24v20h-24z" fill="#efe6d0"/><path d="M12 12q8 0 8 6t-8 6" stroke="#efe6d0" stroke-width="3" fill="none"/>${on?'<path d="M-4 2q-6-8 0-14M6 2q-6-8 0-14" stroke="#c9d3e3" stroke-width="2.5" fill="none" class="dv-steam"/>':''}`,
   tesla:`${glow('#c77dff')}<rect x="-20" y="10" width="40" height="30" fill="#5a3b22"/><rect x="-10" y="-40" width="20" height="52" fill="#b8733d"/>${Array.from({length:6},(_,i)=>`<path d="M-10 ${-34+i*8}h20" stroke="#f2a65a" stroke-width="2"/>`).join('')}<ellipse cy="-46" rx="30" ry="10" fill="#c9d3e3"/>${on?'<path d="M-30-48l-18-12 6 10-16-4M30-48l18-14-4 10 16-2M0-56l-4-22 8 10 2-14" stroke="#e7c6ff" stroke-width="2.5" fill="none" class="dv-spark"/>':''}`,
   solder:`${glow('#ff6a3d')}<rect x="-36" y="18" width="72" height="12" rx="4" fill="#3a4152"/><path d="M-20 18l10-22h8l10 22" fill="none" stroke="#8a93a6" stroke-width="3"/><path d="M-30 4l52-30" stroke="#2b3346" stroke-width="10" stroke-linecap="round"/><path d="M22-26l14-8" stroke="#c9d3e3" stroke-width="4" stroke-linecap="round"/><circle cx="37" cy="-35" r="3.5" fill="${on?'#ff6a3d':'#6d7891'}"/>${on?'<path d="M38-42q-6-8 2-14M44-40q-4-10 4-14" stroke="#c9d3e3" stroke-width="2" fill="none" class="dv-steam"/>':''}`,
   fridge:`${glow('#9fd4ff')}<rect x="-26" y="-46" width="52" height="92" rx="7" fill="#dfe6ef" stroke="#8a93a6" stroke-width="2"/><path d="M-26-10h52" stroke="#8a93a6" stroke-width="2"/><rect x="16" y="-38" width="4" height="20" rx="2" fill="#5a6378"/><rect x="16" y="0" width="4" height="26" rx="2" fill="#5a6378"/><circle cx="-14" cy="-36" r="3" fill="${on?'#4fd18b':'#8a93a6'}"/>${on?'<path d="M-34-30l-8-4M-36-18h-10M-34-6l-8 4" stroke="#9fd4ff" stroke-width="2"/>':''}`,
   charger:`${glow('#4fd18b')}<rect x="-22" y="-34" width="44" height="70" rx="6" fill="#20283a" stroke="#8a93a6" stroke-width="3"/><rect x="-8" y="-42" width="16" height="8" rx="2" fill="#8a93a6"/>${[0,1,2,3].map(i=>`<rect x="-14" y="${18-i*14}" width="28" height="10" rx="2" fill="${on?['#ff5a4f','#ffb347','#f3d22b','#4fd18b'][i]:'#2b3346'}" class="${on&&i===3?'dv-glow':''}"/>`).join('')}<path d="M-4-10l8-6-4 8 6-2-8 8" stroke="${on?'#fff':'#6d7891'}" stroke-width="1.5" fill="none"/>`,
   printer3d:`${glow('#5ee0ff')}<rect x="-40" y="-44" width="80" height="84" rx="4" fill="none" stroke="#8a93a6" stroke-width="4"/><path d="M-40-26h80" stroke="#5a6378" stroke-width="4"/><rect x="${on?-6:-18}" y="-30" width="14" height="14" rx="2" fill="#c9d3e3" class="${on?'dv-print':''}"/><path d="M1-16v6" stroke="${on?'#ff6a3d':'#6d7891'}" stroke-width="3"/>${[0,1,2,3].map(i=>`<rect x="-16" y="${30-i*6}" width="${32-i*4}" height="5" fill="#ff9f43" opacity="${on||i<2?1:.25}" transform="translate(${i*2} 0)"/>`).join('')}<rect x="-30" y="36" width="60" height="4" fill="#5a6378"/>`,
   robot:`${glow('#ffd27a')}<rect x="-26" y="30" width="52" height="12" rx="4" fill="#3a4152"/><circle cy="28" r="10" fill="#5a6378"/><g class="${on?'dv-arm':''}" style="transform-origin:0px 28px"><path d="M0 28L-14-12" stroke="#f2a65a" stroke-width="10" stroke-linecap="round"/><circle cx="-14" cy="-12" r="6" fill="#5a6378"/><path d="M-14-12L20-26" stroke="#f2a65a" stroke-width="8" stroke-linecap="round"/><path d="M20-26l10-8M20-26l12 2" stroke="#c9d3e3" stroke-width="4" stroke-linecap="round"/></g>${on?'<circle cx="-14" cy="-12" r="2" fill="#4fd18b"/>':''}`,
   lathe:`${glow('#9fd4ff')}<rect x="-56" y="14" width="112" height="14" rx="3" fill="#3a4152"/><path d="M-50 28v14M50 28v14" stroke="#3a4152" stroke-width="6"/><rect x="-56" y="-22" width="30" height="36" rx="4" fill="#5a6378"/><g transform="translate(-20 -4)"><g class="${on?'dv-spin':''}"><circle r="14" fill="#8a93a6"/><path d="M-12 0h24M0-12v24" stroke="#3a4152" stroke-width="3"/></g></g><rect x="-6" y="-8" width="38" height="8" rx="3" fill="#c9a227"/><rect x="34" y="-18" width="20" height="32" rx="3" fill="#5a6378"/>${on?'<path d="M10 0l4 8M16-2l6 6" stroke="#ffd27a" stroke-width="2" class="dv-spark"/>':''}`,
   heater:`${on?'<circle r="50" fill="#ff6a3d" opacity=".2" class="dv-glow"/>':''}<rect x="-44" y="-30" width="88" height="62" rx="6" fill="#c9d3e3"/>${[-34,-22,-10,2,14,26].map(x=>`<rect x="${x}" y="-26" width="8" height="54" rx="3" fill="${on?'#ff9f6b':'#a8b2c6'}"/>`).join('')}<path d="M-38 32v8M38 32v8" stroke="#8a93a6" stroke-width="4"/>${on?'<path d="M-24-36q-6-8 0-16q6-8 0-16M0-36q-6-8 0-16q6-8 0-16M24-36q-6-8 0-16q6-8 0-16" stroke="#ff9f6b" stroke-width="2.5" fill="none" class="dv-steam"/>':''}`,
   compressor:`${glow('#5ee0ff')}<g class="${on?'dv-shake':''}"><rect x="-52" y="-18" width="96" height="44" rx="22" fill="#d1312b"/><path d="M-40-18v44M30-18v44" stroke="#9a2420" stroke-width="3"/><rect x="-20" y="-40" width="40" height="22" rx="4" fill="#3a4152"/><circle cx="34" cy="-28" r="12" fill="#efe6d0" stroke="#8a93a6" stroke-width="2"/><path d="M34-28l${on?7:-6} ${on?-6:-6}" stroke="#d1312b" stroke-width="2.5"/></g><circle cx="-34" cy="32" r="7" fill="#20283a"/><circle cx="26" cy="32" r="7" fill="#20283a"/>`};
  return `<g class="dv ${g}">${I[id]||''}</g>`}
function shopScene(){const load=shopLoad(),cap=shopCap(),k=Math.min(1,load/cap);const lv=S.shop.gen;
  return `<svg viewBox="0 0 1000 480" class="shop-scene" role="img" aria-label="${esc(ui('shop.aria'))}">
  <defs><linearGradient id="swall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121826"/><stop offset="1" stop-color="#1b2133"/></linearGradient><radialGradient id="sring2"><stop offset=".55" stop-color="#5ee0ff" stop-opacity="0"/><stop offset=".72" stop-color="#5ee0ff" stop-opacity="${(.15+k*.6).toFixed(2)}"/><stop offset="1" stop-color="#5ee0ff" stop-opacity="0"/></radialGradient>
  <linearGradient id="sfloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151a27"/><stop offset="1" stop-color="#0c0f17"/></linearGradient></defs>
  <rect width="1000" height="480" fill="url(#swall)"/>${[0,1,2,3,4].map(i=>`<rect x="${i*220-20}" y="0" width="12" height="440" fill="#20283a"/><circle cx="${i*220-14}" cy="40" r="3" fill="#3d4862"/>`).join('')}
  <path d="M0 120H1000" stroke="#2b3550" stroke-width="2" stroke-dasharray="2 10"/>
  <rect y="440" width="1000" height="40" fill="url(#sfloor)"/><path d="M0 440H1000" stroke="#2b3550" stroke-width="3"/>
  <circle cx="520" cy="200" r="${120+k*30}" fill="url(#sring2)" class="ring-pulse"/><circle cx="520" cy="200" r="100" fill="none" stroke="#b8733d" stroke-width="16"/><circle cx="520" cy="200" r="100" fill="none" stroke="#e09a5a" stroke-width="2" opacity=".6" transform="translate(-3 -3)"/><circle cx="520" cy="200" r="100" fill="none" stroke="#5ee0ff" stroke-width="2.5" stroke-dasharray="6 10" class="${load?'spinr':''}" opacity="${(.3+k*.7).toFixed(2)}"/>
  <g transform="translate(90 290)"><rect x="-55" y="-90" width="110" height="180" rx="10" fill="#2a3346" stroke="#5a6378" stroke-width="3"/><text y="-52" text-anchor="middle" font-family="Oxanium,sans-serif" font-weight="700" font-size="30" fill="#f2a65a">G</text>${GEN_LEVELS.map((g,i)=>`<rect x="-36" y="${-34+i*18}" width="72" height="12" rx="3" fill="${i<lv?'#4fd18b':'#151a26'}" stroke="#3d4862"/>`).join('')}<text y="112" text-anchor="middle" font-family="Share Tech Mono,monospace" font-size="20" fill="#a8b2c6">${cap} W · ${SHOP_U} V</text></g>
  ${DEVICES.filter(d=>S.shop.own[d.id]).map(d=>{const [x,y]=SLOTS[d.id];return `<g transform="translate(${x} ${y})">${devIcon(d.id,!!S.shop.on[d.id])}</g>`}).join('')}
  ${Object.keys(S.shop.own).length?'':`<text x="520" y="370" text-anchor="middle" font-family="Atkinson Hyperlegible,sans-serif" font-size="22" fill="#6d7891">${esc(ui('shop.empty'))}</text>`}</svg>`}
/* vista previa de un traje sin cambiar el traje puesto */
function lumiAs(k,mood){const p=S.lumiSkin;S.lumiSkin=k;const s=portrait('lumi',mood||'happy');S.lumiSkin=p;return s}
const crN=v=>fr(v,v%1?1:0);
function panelHTML(){return `<div class="board-panel">${Object.entries(LINES).map(([L,o])=>{const op=lineOpen(L),I=op?lineI(L):0,f=S.shop.fu[L],big=f>o.max,k=Math.min(1,I/f);
  return `<div class="line-card ${op?'':'locked'} ${big?'warn':''}"><div class="lc-h"><b>${esc(ui('shop.line',{l:L}))}</b><span class="mono">${esc(ui('shop.cable',{mm:o.mm,max:o.max}))}</span></div>
    ${op?`<div class="lc-bar"><i style="width:${(k*100).toFixed(1)}%" class="${k>.85?'hot':''}"></i></div><p class="mono lc-i">I = ${frs(+I.toFixed(2))} A / ${esc(ui('shop.fuseIs',{f}))}</p>
    <div class="chips sm" role="group" aria-label="${esc(ui('shop.fuseAria',{l:L}))}">${FUSES.map(v=>`<button class="chip ${v===f?'cur':''} ${v>o.max?'over':''}" data-fu="${L}" data-v="${v}">${v} A</button>`).join('')}</div>
    ${big?`<p class="lc-warn">⚠ ${esc(ui('shop.fuseBig',{f,max:o.max}))}</p>`:''}`:`<p class="lc-lock">${ICON('lock')} ${esc(ui('shop.lineLock',{w:GEN_LEVELS[o.gen-1].w}))}</p>`}</div>`}).join('')}</div>`}
function prodHTML(){accrue();const p=S.shop.pend,rate=prodRate(),bill=p.kwh*KWH_CR,net=Math.floor(p.prod-bill);
  return `<div class="panel prod"><h3>${ICON('crystal')} ${esc(ui('shop.prod'))}</h3>
    <p>${esc(ui('shop.rate',{r:crN(rate),w:frs(shopLoad()),c:crN(shopLoad()/1000*KWH_CR)}))}</p>
    <div class="prod-grid"><span>${esc(ui('shop.pTime'))}<b class="mono">${fr(p.h,1)} h / ${PEND_MAX_H} h</b></span><span>${esc(ui('shop.pMade'))}<b class="mono">+${crN(Math.floor(p.prod*10)/10)}</b></span><span>${esc(ui('shop.pBill',{k:KWH_CR}))}<b class="mono">${fr(p.kwh,2)} kWh → −${crN(Math.ceil(bill*10)/10)}</b></span></div>
    <button class="btn sm ${net>0?'primary':''}" id="harvest" ${net>0?'':'disabled'}>${esc(ui('shop.harvest'))} · ${ICON('crystal')} ${Math.max(0,net)}</button>
    ${rate?'':`<p class="small">${esc(ui('shop.prodHelp'))}</p>`}</div>`}
function openShop(msg){VIEW={f:'shop'};BACK=null;show('hub');const h=$('#scr-hub');accrue();const cap=shopCap(),load=shopLoad();const on=onDevs();
  const nx=GEN_LEVELS[S.shop.gen];
  h.innerHTML=headHTML()+`<button class="btn sm ghost" id="back">‹ ${esc(ui('btn.workshop'))}</button><h2 class="sec">${esc(ui('shop.title'))} <span class="es">${esc(ui('shop.sub'))}</span></h2>
   <p class="bubble shop-tip"><b>Lumi ›</b> ${hl(ui('shop.tip',{u:SHOP_U,c:cap}))}</p>
   <div class="panel shop-stage">${shopScene()}
     <div class="meter ${load>cap*.85?'hot':''}"><div class="meter-l"><b>${esc(ui('shop.load'))}</b><span>${on.length&&on.length<7?on.map(d=>frs(devP(d))).join(' + ')+' = ':''}${frs(load)} W / ${cap} W</span></div><div class="meter-bar"><i style="width:${Math.min(100,load/cap*100)}%"></i></div></div>
     <div class="lab-alert bad" id="shopAlert" ${msg?'':'hidden'}>${msg||''}</div></div>
   <h2 class="sec">${esc(ui('shop.panel'))} <span class="es">${esc(ui('shop.panelSub'))}</span></h2>
   <div class="shop-top">${panelHTML()}${prodHTML()}</div>
   <div class="shop-grid">
     <div class="panel dev gen"><h3>${ICON('bolt')} ${esc(ui('shop.gen'))}</h3><p>${esc(ui('shop.genLv',{l:S.shop.gen,w:cap}))}</p><div class="gen-steps">${GEN_LEVELS.map((g,i)=>`<i class="${i<S.shop.gen?'on':''}">${g.w}</i>`).join('')}</div>${nx?`<button class="btn sm primary" id="genUp" ${S.cr<nx.cost?'disabled':''}>${esc(ui('shop.genUp',{w:nx.w}))} · ${ICON('crystal')} ${nx.cost}</button>`:`<p class="ok-t">${esc(ui('shop.genMax'))}</p>`}</div>
     ${DEVICES.map(d=>{const own=!!S.shop.own[d.id],isOn=!!S.shop.on[d.id],q=S.shop.quiz[d.id],L=lineOf(d);
       return `<div class="panel dev ${isOn?'on':''} ${own?'':'shopwin'}" data-d="${d.id}"><svg viewBox="-60 -60 120 120" class="dev-ico" aria-hidden="true">${d.id==='garland'||d.id==='neon'||d.id==='lathe'?`<g transform="scale(.55)">${devIcon(d.id,own&&isOn)}</g>`:devIcon(d.id,own&&isOn)}</svg>
        <div class="dev-t"><h3>${esc(ui('dev.'+d.id))}${d.r?` <span class="tagp">+${crN(d.r)} ${ICON('crystal')}/h</span>`:''}</h3><p class="mono">U = ${SHOP_U} V · I = ${frs(d.I)} A</p><p class="mono">${q?`P = ${frs(devP(d))} W`:'P = ? W'}</p></div>
        <div class="dev-a">${own?`<div class="ln-pick" role="group" aria-label="${esc(ui('shop.lineAria'))}">${Object.keys(LINES).map(k=>`<button class="chip ${k===L?'cur':''}" data-ln="${d.id}" data-v="${k}" ${lineOpen(k)?'':'disabled'}>${k}</button>`).join('')}</div><button class="btn sm ${isOn?'':'primary'}" data-sw="${d.id}">${esc(ui(isOn?'shop.off':'shop.on'))}</button>`:`<button class="btn sm" data-buy="${d.id}" ${S.cr<d.cost?'disabled':''}>${esc(ui('shop.buy'))} · ${ICON('crystal')} ${d.cost}</button>`}</div>
        <div class="dev-q" id="q-${d.id}" hidden></div></div>`}).join('')}</div>
   <h2 class="sec">${esc(ui('shop.skins'))}</h2><div class="skins">${Object.entries(LUMI_SKINS).map(([k,v])=>{const own=!!S.skins[k],cur=S.lumiSkin===k;
     return `<button class="panel skin ${cur?'cur':''}" data-skin="${k}" ${!own&&S.cr<v.cost?'disabled':''} aria-pressed="${cur}"><span class="skin-p">${lumiAs(k)}</span><b>${esc(ui('skin.'+k))}</b><span>${cur?esc(ui('shop.wearing')):own?esc(ui('shop.wear')):`${ICON('crystal')} ${v.cost}`}</span></button>`}).join('')}</div>`;
  save();wireTop();$('#back').onclick=()=>renderHub();
  const gu=$('#genUp');if(gu)gu.onclick=()=>{const n=GEN_LEVELS[S.shop.gen];if(!n||S.cr<n.cost)return;accrue();S.cr-=n.cost;S.shop.gen++;save();AU.play('build');FX.confetti(80);openShop();checkAch()};
  $$('[data-buy]',h).forEach(b=>b.onclick=()=>{const d=DEVICES.find(x=>x.id===b.dataset.buy);if(S.cr<d.cost)return;S.cr-=d.cost;S.shop.own[d.id]=1;S.shop.ln[d.id]=S.shop.ln[d.id]||'A';save();AU.play('buy');openShop();checkAch()});
  $$('[data-sw]',h).forEach(b=>b.onclick=()=>{const d=DEVICES.find(x=>x.id===b.dataset.sw);if(S.shop.on[d.id]){accrue();delete S.shop.on[d.id];save();AU.play('click');openShop();return}
    if(!S.shop.quiz[d.id])return askPower(d);switchOn(d)});
  $$('[data-ln]',h).forEach(b=>b.onclick=()=>{const d=DEVICES.find(x=>x.id===b.dataset.ln),L=b.dataset.v;if(!lineOpen(L)||lineOf(d)===L)return;accrue();const was=!!S.shop.on[d.id];delete S.shop.on[d.id];S.shop.ln[d.id]=L;AU.play('plug');if(was)return switchOn(d);save();openShop()});
  $$('[data-fu]',h).forEach(b=>b.onclick=()=>{const L=b.dataset.fu,v=+b.dataset.v;accrue();S.shop.fu[L]=v;AU.play('select');save();openShop(checkLine(L))});
  const hv=$('#harvest');if(hv)hv.onclick=()=>{accrue();const p=S.shop.pend,net=Math.floor(p.prod-p.kwh*KWH_CR);if(net<=0)return;S.cr+=net;S.shop.earned=(S.shop.earned||0)+net;S.shop.pend={h:0,prod:0,kwh:0};save();AU.play('coin');FX.confetti(40+net);toast(ui('shop.harvested',{n:net}));openShop();checkAch()};
  $$('[data-skin]',h).forEach(b=>b.onclick=()=>{const k=b.dataset.skin,v=LUMI_SKINS[k];if(!S.skins[k]){if(S.cr<v.cost)return;S.cr-=v.cost;S.skins[k]=1;AU.play('buy')}else AU.play('select');S.lumiSkin=k;save();openShop()});
  if(!S.shop.seen){S.shop.seen=1;save();VO.say(ui('shop.tip',{u:SHOP_U,c:cap}))}}
/* antes de encender un aparato por primera vez: calcular su potencia */
function askPower(d){const box=$('#q-'+d.id);box.hidden=false;
  box.innerHTML=`<p>${hl(ui('shop.q',{u:SHOP_U,i:frs(d.I)}))}</p><div class="num-row"><input id="pIn-${d.id}" inputmode="decimal" autocomplete="off" placeholder="?" aria-label="${esc(ui('aria.answer'))}"><span>W</span><button class="btn sm primary" id="pOk-${d.id}">${esc(ui('btn.validate'))}</button></div><p class="gmsg" id="pMsg-${d.id}"></p>`;
  const inp=$('#pIn-'+d.id);inp.focus({preventScroll:true});
  const chk=()=>{const v=num(inp.value);if(v==null){$('#pMsg-'+d.id).textContent=ui('msg.number');return}const ok=Math.abs(v-devP(d))<.01;S.shop.quiz[d.id]=1;trackSkill('puissance',ok);
    if(ok){S.cr+=2;AU.play('ok');save();switchOn(d,ui('shop.qOk'))}else{AU.play('bad');$('#pMsg-'+d.id).innerHTML=hl(ui('shop.qBad',{u:SHOP_U,i:frs(d.I),p:frs(devP(d))}));save();setTimeout(()=>switchOn(d),2200)}};
  $('#pOk-'+d.id).onclick=chk;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();chk()}}}
/* reglas del cuadro: fusible de la línea, cable recalentado (fusible demasiado grande) */
function lineOff(L){onDevs().filter(d=>lineOf(d)===L).forEach(d=>delete S.shop.on[d.id])}
function checkLine(L){const I=lineI(L),f=S.shop.fu[L],o=LINES[L];
  if(I>f+1e-9){lineOff(L);save();AU.play('smallboom');S.stats.lineFuse=(S.stats.lineFuse||0)+1;return md(ui('shop.fuseBlown',{l:L,i:frs(+I.toFixed(2)),f}))}
  if(I>o.max+1e-9){lineOff(L);save();AU.play('boom');hitFlash();S.stats.cableHot=(S.stats.cableHot||0)+1;return md(ui('shop.cableHot',{l:L,i:frs(+I.toFixed(2)),max:o.max,mm:o.mm}))}
  return null}
function switchOn(d,okMsg){accrue();const cap=shopCap(),after=shopLoad()+devP(d);
  if(after>cap){S.shop.on={};save();AU.play('boom');hitFlash();openShop(md(ui('shop.blown',{p:frs(after),c:cap})));shakeEl($('.shop-stage'));return}
  S.shop.on[d.id]=1;const m=checkLine(lineOf(d));save();
  if(m){openShop(m);shakeEl($('.shop-stage'));return}
  AU.play('plug');openShop();if(okMsg)toast(okMsg)}

/* ---------- Desafíos de circuitos: 3 estrellas por calidad ---------- */
/* simula una copia del montaje con un cambio (p. ej. abrir un interruptor) sin tocar lo que ve el jugador */
function simWith(B,f){const B2={comps:B.comps.map(c=>Object.assign({},c))};B2.comps.forEach(f);return makeQ(B2,simulate(B2))}
const lampsOK=(Q,ls)=>ls.every(l=>Q.lampState(l)==='normal');
const PUZZLES=[
 {id:'p1',req:['c1',1],max:8,pal:{wire:Infinity},tool:'wire',board:()=>[cG('v:1,1',6),cL('v:5,1','l6a','L1')],check:Q=>lampsOK(Q,['L1'])},
 {id:'p2',req:['c1',1],max:11,pal:{wire:Infinity,sw:1},tool:'wire',board:()=>[cG('v:1,1',12,{E:12}),cL('h:2,0','l6a','L1'),cL('h:4,0','l6a','L2')],
  check:(Q,B)=>{if(!Q.of('sw').length)return false;const a=simWith(B,c=>{if(c.t==='sw')c.on=true}),b=simWith(B,c=>{if(c.t==='sw')c.on=false});return lampsOK(a,['L1','L2'])&&b.lampState('L1')==='off'&&b.lampState('L2')==='off'}},
 {id:'p3',req:['c1',5],max:8,pal:{wire:Infinity},tool:'wire',board:()=>[cG('v:1,1',6),cL('v:3,1','l6a','L1'),cL('v:5,1','l6a','L2')],check:Q=>lampsOK(Q,['L1','L2'])},
 {id:'p4',req:['c1',5],max:11,pal:{wire:Infinity,sw:2},tool:'wire',board:()=>[cG('v:1,1',6),cL('v:3,1','l6a','L1'),cL('v:5,1','l6a','L2')],
  check:(Q,B)=>{const sws=Q.of('sw');if(sws.length<2)return false;if(!lampsOK(simWith(B,c=>{if(c.t==='sw')c.on=true}),['L1','L2']))return false;
    const ctl=sws.map(sw=>{const q=simWith(B,c=>{if(c.t==='sw')c.on=c.id!==sw.id});const off=['L1','L2'].filter(l=>q.lampState(l)==='off'),nor=['L1','L2'].filter(l=>q.lampState(l)==='normal');return off.length===1&&nor.length===1?off[0]:null});
    return ctl.includes('L1')&&ctl.includes('L2')}},
 {id:'p5',req:['c2',1],max:1,pal:{wire:Infinity,res:2},tool:'res',resVals:[10,22,47,100],resDefault:47,board:()=>board([cG('v:1,1',9,{E:9}),cL('h:3,0','l6b','L1')],{gaps:['h:2,3']}),check:Q=>lampsOK(Q,['L1'])},
 {id:'p6',req:['c2',1],max:1,pal:{wire:Infinity,fuse:1},tool:'fuse',fuseVals:[.1,.2,.5,1,2],fuseDefault:2,board:()=>board([cG('v:1,1',6),cL('h:3,0','l6b','L1')],{gaps:['h:2,3']}),
  check:Q=>lampsOK(Q,['L1'])&&Q.of('fuse').some(f=>!f.burnt&&f.Ir===.5)},
 {id:'p7',req:['c2',1],max:2,pal:{wire:Infinity,res:3},tool:'res',resVals:[47,220,470],resDefault:47,board:()=>board([cG('v:1,1',6),cA('h:1,0','A1',{lockDir:1})],{gaps:['h:2,3','h:3,3']}),
  check:Q=>{const a=Math.abs(Q.read(Q.c('A1'))||0);return a>.059&&a<.068}},
 {id:'p8',req:['c1',6],max:15,pal:{wire:Infinity},tool:'wire',board:()=>[cG('v:1,1',12,{E:12}),cL('h:2,0','l6a','L1'),cL('h:4,0','l6a','L2'),cL('h:3,2','l12','L3')],check:Q=>lampsOK(Q,['L1','L2','L3'])},
 /* v1.4 · Pruebas del Maestro Tesla (se abren al terminar Nueva York) */
 {id:'m1',master:1,req:['c4',6],max:14,pal:{wire:Infinity},tool:'wire',skill:'noeuds',board:()=>[cG('v:1,1',12,{E:12}),cL('h:2,0','l6a','L1'),cL('h:4,0','l6a','L2'),cL('h:2,2','l6a','L3'),cL('h:4,2','l6a','L4')],check:Q=>lampsOK(Q,['L1','L2','L3','L4'])},
 {id:'m2',master:1,req:['c4',6],max:2,pal:{wire:Infinity,fuse:1,sw:1},tool:'fuse',skill:'securite',fuseVals:[.1,.2,.5,1,2],fuseDefault:2,
  board:()=>board([cG('v:1,1',6),cL('v:3,1','l6a','L1'),{t:'motor',e:'v:5,1',lab:'M1',lock:1}],{edges:PAR_EDGES,gaps:['h:1,0','v:5,0']}),
  check:(Q,B)=>{if(!Q.of('sw').length||!Q.of('fuse').some(f=>!f.burnt&&f.Ir===.5))return false;const a=simWith(B,c=>{if(c.t==='sw')c.on=true}),b=simWith(B,c=>{if(c.t==='sw')c.on=false});
    return a.lampState('L1')==='normal'&&a.I('M1')>.15&&b.lampState('L1')==='normal'&&b.I('M1')<.001&&!a.of('fuse').some(f=>f.burnt)}},
 {id:'m3',master:1,req:['c4',6],max:2,pal:{wire:Infinity,res:3},tool:'res',skill:'puissance',resVals:[22,47,100],resDefault:47,Pmax:.5,
  board:()=>board([cG('v:1,1',6),cA('h:1,0','A1',{lockDir:1})],{gaps:['h:2,3','h:3,3']}),
  check:Q=>{const a=Math.abs(Q.read(Q.c('A1'))||0);return a>.13&&a<.14&&!Q.of('res').some(r=>r.burnt)}},
 {id:'m4',master:1,req:['c4',6],max:4,pal:{wire:Infinity,res:2},tool:'res',skill:'puissance',resVals:[10,22,33,47,100],resDefault:33,Pmax:2,
  board:()=>board([cG('v:1,1',6)],{gaps:['h:3,0']}),
  check:Q=>{const rs=Q.of('res');if(!rs.length||rs.some(r=>r.burnt))return false;const P=rs.reduce((a,r)=>a+Q.R.res.get(r.id).P,0);return P>=2&&P<=2.2}}];
const pzUnlocked=i=>{const P=PUZZLES[i];return (i===0||(P.master&&!PUZZLES[i-1].master)||!!S.pz[PUZZLES[i-1].id])&&chState(P.req[0]).done>=P.req[1]};
const pzOpenCount=()=>PUZZLES.filter((p,i)=>pzUnlocked(i)).length;
function openPuzzles(){VIEW={f:'pz'};BACK=null;show('hub');const h=$('#scr-hub');const tot=Object.values(S.pz).reduce((a,b)=>a+b,0);
  h.innerHTML=headHTML()+`<button class="btn sm ghost" id="back">‹ ${esc(ui('btn.workshop'))}</button><h2 class="sec">${esc(ui('pz.title'))} <span class="es">${tot} / ${PUZZLES.length*3} ★</span></h2>
   <p class="bubble shop-tip"><b>Lumi ›</b> ${esc(ui('pz.intro'))}</p>
   <div class="pz-grid">${PUZZLES.map((p,i)=>{const un=pzUnlocked(i),st=S.pz[p.id]||0;const ch=CHAPTERS.find(c=>c.id===p.req[0]);const head=p.master&&!PUZZLES[i-1].master?`</div><section class="panel master-head" id="masterHead"><div class="mh-p">${portrait('tesla',chState('c4').complete?'happy':'neutral')}</div><div><p class="kicker">${esc(ui('master.k'))}</p><h2>${esc(ui('master.title'))}</h2><p>${esc(ui(chState('c4').complete?'master.intro':'master.locked'))}</p></div></section><div class="pz-grid">`:'';
     const why=!un?(i>0&&!S.pz[PUZZLES[i-1].id]&&!(p.master&&!PUZZLES[i-1].master)&&chState(p.req[0]).done>=p.req[1]?ui('pz.lockPrev'):p.master?ui('master.lockCh'):ui('pz.lockMission',{m:T(ch.missions[p.req[1]-1].t)})):'';
     return head+`<button class="panel pz-card ${un?'':'locked'} ${p.master?'master':''}" data-i="${i}"><span class="pz-n">${p.master?'T'+(i+1-PUZZLES.findIndex(x=>x.master)):String(i+1).padStart(2,'0')}</span><span class="pz-t"><b>${esc(ui('pz.'+p.id+'.t'))}</b><small>${un?esc(ui('pz.'+p.id+'.g').replace(/\[\[|\]\]/g,'')):ICON('lock')+' '+esc(why)}</small></span><span class="pz-s">${un?starsHTML(st):''}</span></button>`}).join('')}</div>`;
  wireTop();$('#back').onclick=()=>renderHub();$$('.pz-card',h).forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(!pzUnlocked(i)){AU.play('bad');toast(b.querySelector('small').textContent.trim());return}AU.play('click');startPuzzle(i)})}
let LASTLAB=null;
function startPuzzle(i){const P=PUZZLES[i];AU.init();markDay();VO.stop();RUN=null;BACK=openPuzzles;show('play');
  const st={burn:false,hint:false,solved:false,hi:0};let lab=null;
  $('#phTitle').innerHTML=`${esc(ui(P.master?'master.title':'pz.title'))} · ${esc(ui('pz.'+P.id+'.t'))}`;$('#phRight').innerHTML='';
  const stage=$('#stage');stage.className='stage wide';
  stage.innerHTML=`<div class="lab-step"><div class="ls-main" id="lsMain"></div><aside class="ls-side panel"><div class="ls-title"><p class="kicker">${esc(P.master?ui('master.k'):ui('pz.k',{n:i+1}))}</p><h2>${esc(ui('pz.'+P.id+'.t'))}</h2><p class="ls-sub">${hl(ui('pz.'+P.id+'.g'))}</p></div>
    <ol class="pz-crit" id="pzCrit"></ol><div class="insp" id="insp"></div>
    <div class="ls-foot" id="lsFoot"><button class="btn sm ghost" id="lsHint">${ICON('bulb')} ${esc(ui('btn.hint'))}</button><button class="btn sm ghost" id="lsReset">${esc(ui('btn.restart'))}</button></div><p class="ls-hint" id="lsHintT" hidden></p><div id="pzEnd"></div></aside></div>`;
  const pieces=()=>lab?lab.B.comps.filter(c=>!c.lock).length:0;
  const crit=()=>{const el=$('#pzCrit');if(!el)return;const n=pieces();const c=[[st.solved,ui('pz.s1')],[st.solved?n<=P.max:n<=P.max,ui('pz.s2',{n:P.max,now:n})],[!st.burn&&!st.hint,ui('pz.s3')]];
    el.innerHTML=c.map(([ok,t],k)=>`<li class="${ok&&(k>0||st.solved)?'ok':''} ${k>0&&!ok?'lost':''}"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="${ok&&(k>0||st.solved)?'star-on':'star-off'}" d="${GLYPH.star}"/></svg><span>${esc(t)}</span></li>`).join('')};
  const evalP=()=>{if(st.solved||!lab||!lab.Q)return;let ok=false;try{ok=P.check(lab.Q,lab.B)}catch(e){ok=false}if(!ok)return;st.solved=true;
    const stars=1+(pieces()<=P.max?1:0)+(!st.burn&&!st.hint?1:0);const prev=S.pz[P.id]||0;const won=Math.max(0,stars-prev)*3;S.pz[P.id]=Math.max(prev,stars);S.cr+=won;S.stats.labs++;trackSkill(P.skill||null,true);save();
    crit();AU.play(stars===3?'levelup':'unlock');FX.confetti(stars*50);const nx=PUZZLES[i+1];
    $('#lsFoot').hidden=true;$('#lsHintT').hidden=true;
    $('#pzEnd').innerHTML=`<div class="pz-end"><div class="end-stars">${starsHTML(stars).replace(/^<span class="stars"[^>]*>|<\/span>$/g,'')}</div>${won?`<p class="cry">${ICON('crystal')} +${won}</p>`:''}<p class="pz-why"><b>${P.master?'Tesla':'Lumi'} ›</b> ${hl(ui('pz.'+P.id+'.w'))}</p>
      <div class="end-actions">${stars<3?`<button class="btn ghost" id="pzAgain">${esc(ui('pz.again'))}</button>`:''}${nx&&pzUnlocked(i+1)?`<button class="btn primary" id="pzNext">${esc(ui('pz.next'))} ›</button>`:''}<button class="btn ${nx&&pzUnlocked(i+1)?'ghost':'primary'}" id="pzList">${esc(ui('pz.list'))}</button></div></div>`;
    const a=$('#pzAgain');if(a)a.onclick=()=>startPuzzle(i);const n=$('#pzNext');if(n){n.onclick=()=>startPuzzle(i+1);n.focus()}$('#pzList').onclick=()=>{BACK=null;openPuzzles()};
    VO.say(ui('pz.'+P.id+'.w'));setTimeout(checkAch,900)};
  lab=createLab($('#lsMain'),{comps:P.board(),palette:P.pal,tool:P.tool,inspector:$('#insp'),resVals:P.resVals,resDefault:P.resDefault,fuseVals:P.fuseVals,fuseDefault:P.fuseDefault,Pmax:P.Pmax,showPmax:!!P.Pmax,fixPmax:!!P.Pmax,showAll:!!P.Pmax,
    onChange:()=>{crit();setTimeout(evalP,0)},onEvent:ev=>{if(ev.k!=='fuse'&&!st.solved){st.burn=true;crit()}}});
  LASTLAB=lab;crit();
  $('#lsHint').onclick=()=>{const k=Math.min(st.hi,1);st.hi++;st.hint=true;crit();const t=ui('pz.'+P.id+'.h'+(k+1));const el=$('#lsHintT');el.hidden=false;el.innerHTML=`<b>${P.master?'Tesla':'Lumi'} ›</b> ${hl(t)}`;AU.play('select');VO.say(t,true)};
  $('#lsReset').onclick=()=>{lab.setComps(P.board());st.burn=false;AU.play('click');crit()}}

/* ---------- Anomalías temporales: repaso de lo que más cuesta ---------- */
function revPool(){const out=[];CHAPTERS.forEach(ch=>{if(ch.soon)return;const cs=chState(ch.id);ch.missions.forEach((m,mi)=>{if(mi>=cs.done)return;
  m.steps.forEach(st=>{if((st.type==='qcm'&&!st.predict)||st.type==='num')out.push(st);if(st.type==='boss')st.qs.forEach(q=>out.push(q))})})});return out}
const revDoneToday=()=>S.rev.days.includes(dayStr());
const revMonthDays=()=>{const m=dayStr().slice(0,7);return S.rev.days.filter(d=>d.startsWith(m)).length};
/* las preguntas de competencias flojas o sin practicar salen más a menudo */
function revPick(n){const pool=revPool().map(q=>{const m=mastery(q.skill);return {q,w:m.n?1+3*(1-m.score):2.5}});const out=[];
  while(out.length<n&&pool.length){const tot=pool.reduce((a,x)=>a+x.w,0);let r=Math.random()*tot,k=0;while(k<pool.length-1&&(r-=pool[k].w)>0)k++;out.push(pool.splice(k,1)[0].q)}return out}
function startReview(){AU.init();markDay();VO.stop();RUN=null;BACK=renderHub;show('play');const qs=revPick(5);let k=0,good=0;const first=!revDoneToday();
  $('#phTitle').innerHTML=esc(ui('rev.title'));const stage=$('#stage');stage.className='stage';
  const draw=()=>{$('#phRight').innerHTML=`<span class="dots">${qs.map((_,j)=>`<i class="${j<k?'on':j===k?'cur':''}"></i>`).join('')}</span>`;
    stage.innerHTML=`<div class="rev-head panel"><div class="rev-p">${portrait('baron','evil')}</div><p><b>${esc(T('Barón Court-Circuit'))} ›</b> ${esc(ui(k?'rev.baron2':'rev.baron1'))}</p></div><div class="console panel" id="qc"></div>`;
    const q=qs[k];const done=ok=>{if(ok)good++;const f=$('#qFoot');const b=document.createElement('button');b.className='btn primary';b.textContent=(k<qs.length-1?ui('btn.nextQ'):ui('rev.finish'))+' ›';f.append(b);b.focus();KEYS.next=()=>b.click();
      b.onclick=()=>{k++;KEYS.next=null;if(k<qs.length)draw();else finish()}};
    if(q.type==='num')numInto($('#qc'),Object.assign({oneShot:true},q),done);else qcmInto($('#qc'),q,done)};
  const finish=()=>{const cr=good+(first?5:0);S.cr+=cr;S.rev.n++;if(first){S.rev.days.push(dayStr());S.rev.days=S.rev.days.slice(-120)}save();
    $('#phRight').innerHTML='';AU.play(good>=4?'levelup':'unlock');FX.confetti(good*30);
    stage.innerHTML=`<div class="panel end"><p class="kicker">${esc(ui('rev.done'))}</p><div class="end-big ${good>=4?'ok':''}">${good} / ${qs.length}</div><p class="cc-msg">${esc(ui(good>=4?'rev.win':'rev.keep'))}</p>
      <div class="end-stats"><span><b class="cry">${ICON('crystal')} +${cr}</b>${esc(uiN('end.crystals',cr))}${first?` <small>(${esc(ui('rev.bonus'))})</small>`:''}</span><span><b>${revMonthDays()}</b>${esc(ui('rev.days'))}</span></div>
      <div class="end-actions"><button class="btn primary" id="revBack">${esc(ui('rev.back'))}</button></div></div>`;
    $('#revBack').onclick=()=>{BACK=null;renderHub()};$('#revBack').focus();setTimeout(checkAch,900)};
  draw()}

/* ================= Title & intro ================= */
function paintLangButtons(){$$('.lang-btn').forEach(b=>{const on=b.dataset.lang===L;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))})}
function renderTitle(){applyStatic();paintLangButtons();const known=!!S.name;$('#titleLumi').innerHTML=portrait('lumi','happy');$('#storeWarn').hidden=STORE_OK;$('#nameRow').hidden=known;$('#whoLine').hidden=!known;$('#nameIn').value=S.name||'';
  if(known)$('#whoLine').innerHTML=`${esc(ui('title.player'))} <b>${esc(S.name)}</b> · <button class="linkbtn" id="chgName">${esc(ui('btn.change'))}</button>`;const c=$('#chgName');if(c)c.onclick=()=>{$('#nameRow').hidden=false;$('#whoLine').hidden=true;$('#nameIn').focus()};show('title')}
const INTRO=[
  {w:'nar',t:'París, hoy. Noche de los museos. En el Museo de las Ciencias, la última sala sigue abierta.'},
  {w:'nar',t:'En una vitrina descansa el Gran Libro de la Electricidad: cada página la escribió un sabio que cambió el mundo.'},
  {fx:'thunder'},{fx:'dark'},
  {w:'baron',m:'evil',t:'Buenas noches, joven. Permítame presentarme: Barón Court-Circuit.'},
  {w:'baron',m:'evil',t:'Este libro guarda todos los descubrimientos eléctricos. Si arranco sus páginas en el pasado… ¡nadie los habrá hecho jamás!'},
  {w:'baron',m:'angry',t:'El mundo volverá a las velas. Y yo seré el único que domine la electricidad. ¡Ja, ja, ja!'},
  {fx:'flash'},
  {w:'nar',t:'El Barón salta dentro de un anillo luminoso y desaparece. Las luces del museo parpadean. Los móviles se apagan.'},
  {fx:'light'},
  {w:'lumi',m:'worried',t:'¡Bip! ¿Hola? ¡Sistema Lumi activado! Soy la asistente del Chronotron número 2. ¡Ese bandido ha robado el número 1!'},
  {w:'lumi',m:'worried',t:'Cada página que arranca borra un descubrimiento. Si no lo detenemos, la «intensité», la «résistance» y la ley de Ohm… desaparecerán.'},
  {w:'lumi',m:'neutral',t:'Necesito a alguien con buen ojo para los circuitos. ¿{N}? Perfecto. Sube al Chronotron.'},
  {w:'lumi',m:'happy',t:'Primera parada: París, 1820. Vamos a buscar a André-Marie Ampère. ¡Agárrate fuerte!'}];
async function playIntro(){AU.init();AU.startMusic();await talk(INTRO,{scene:'museum'});S.introSeen=true;save();renderHub();checkAch()}

/* ================= Settings ================= */
function openSettings(){const m=$('#settings');applyStatic();paintLangButtons();$('#setName').value=S.name;$('#tNarr').checked=S.settings.narr;$('#tMusic').checked=S.settings.music;$('#tSfx').checked=S.settings.sfx;$('#tAlt').checked=!!S.settings.alt;
  $('#narrHelp').textContent=ui(VO.ok&&VO.has(L)?'set.narrHelp':'set.noVoice');paintSaveInfo();$('#bkCode').hidden=true;$('#bkIn').hidden=true;$('#bkIn').value='';$('#bkMsg').textContent='';$('#bkRestore').textContent=ui('save.restore');restoreArm=null;m.hidden=false;$('#setClose').focus()}
function closeSettings(){S.name=($('#setName').value||'').trim()||S.name;save();$('#settings').hidden=true;refreshAfterChange()}
/* repinta lo que se ve detrás (menús, o el título); durante una misión los cambios se ven en la siguiente pantalla */
function refreshAfterChange(){applyStatic();paintLangButtons();if(!$('#scr-hub').hidden)rerender();else if(!$('#scr-title').hidden)renderTitle()}

/* ================= Wiring ================= */
$$('.lang-btn').forEach(b=>b.onclick=()=>{AU.play('select');setLang(b.dataset.lang);paintLangButtons();if($('#settings').hidden)renderTitle();else openSettings()});
$('#tNarr').onchange=e=>{S.settings.narr=e.target.checked;if(!S.settings.narr)VO.stop();save()};
$('#tMusic').onchange=e=>{AU.init();AU.setMusic(e.target.checked);save()};
$('#tSfx').onchange=e=>{AU.init();AU.setSfx(e.target.checked);save()};
$('#tAlt').onchange=e=>{S.settings.alt=e.target.checked;save()};
function paintSaveInfo(){const el=$('#saveInfo');if(!el)return;if(!STORE_OK){el.textContent=ui('save.noStore');el.className='save-info bad';return}
  const t=S.savedAt?new Date(S.savedAt):null;el.className='save-info';el.textContent=t?ui('save.ok',{t:t.toLocaleString(L==='es'?'es-ES':'fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}):ui('save.none')}
$('#bkCopy').onclick=async()=>{save();const code=await saveCode();const box=$('#bkCode');box.value=code;box.hidden=false;box.select();
  try{await navigator.clipboard.writeText(code);toast(ui('save.copied'))}catch(e){toast(ui('save.copyManual'))}};
$('#bkFile').onclick=async()=>{save();const code=await saveCode();try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([code],{type:'text/plain'}));
  a.download=`chrono-ohm-${(S.name||'partida').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,'-')||'partida'}-${dayStr()}.txt`;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}catch(e){toast(ui('save.copyManual'))}};
let restoreArm=null;
async function tryRestore(code){let o;try{o=await readCode(code)}catch(e){$('#bkMsg').textContent=ui('save.badCode');AU.play('bad');return}
  if(restoreArm!==code){restoreArm=code;$('#bkMsg').textContent=ui('save.confirm',{n:o.name||'—',xp:o.xp||0});$('#bkRestore').textContent=ui('save.confirmBtn');return}
  restoreArm=null;S=merge(DEF,o);save();AU.play('unlock');$('#settings').hidden=true;toast(ui('save.restored',{n:S.name||''}));if(S.settings.lang&&LANGS[S.settings.lang])setLang(S.settings.lang);renderTitle()}
$('#bkRestore').onclick=()=>{const box=$('#bkIn');if(box.hidden){box.hidden=false;box.focus();$('#bkMsg').textContent=ui('save.pasteHelp');return}tryRestore(box.value)};
$('#bkLoad').onchange=async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const txt=await f.text();$('#bkIn').hidden=false;$('#bkIn').value=txt.trim();restoreArm=null;tryRestore(txt)};
let resetArm=false;$('#btnReset').onclick=e=>{if(!resetArm){resetArm=true;e.currentTarget.textContent=ui('set.resetSure');setTimeout(()=>{resetArm=false;$('#btnReset').textContent=ui('set.reset')},3500);return}
  const keep={name:S.name,settings:S.settings,introSeen:S.introSeen};S=Object.assign(clone(DEF),keep);save();resetArm=false;$('#btnReset').textContent=ui('set.reset');$('#settings').hidden=true;toast(ui('set.resetDone'));renderHub()};
$('#setClose').onclick=closeSettings;$('#settings').addEventListener('click',e=>{if(e.target.id==='settings')closeSettings()});
$('#btnStart').onclick=()=>{askPersist();markDay();const nm=($('#nameIn').value||'').trim();if(!$('#nameRow').hidden)S.name=nm||S.name||'';S.settings.lang=L;save();AU.init();AU.play('power');
  if(!S.introSeen)playIntro();else{if(S.settings.music)AU.startMusic();STAR.warp=6;setTimeout(()=>STAR.warp=0,700);renderHub();checkAch()}};
$('#nameIn').addEventListener('keydown',e=>{if(e.key==='Enter')$('#btnStart').click()});
let quitArm=false;$('#quitBtn').onclick=e=>{if(!quitArm){quitArm=true;e.currentTarget.textContent=ui('btn.quitSure');setTimeout(()=>{quitArm=false;const q=$('#quitBtn');if(q)q.textContent=ui('btn.quit')},3000);return}
  quitArm=false;$('#quitBtn').textContent=ui('btn.quit');VO.stop();if(BACK){const f=BACK;BACK=null;RUN=null;f();return}const r=RUN;RUN=null;if(r){S.xp+=Math.round(r.xp/2);save();openChapter(r.ch)}else renderHub();checkAch()};
document.addEventListener('keydown',e=>{if(!$('#settings').hidden){if(e.key==='Escape')closeSettings();return}
  if($('#scr-play').hidden)return;const tag=(e.target.tagName||'').toLowerCase();if(tag==='input')return;
  const map={'1':0,'2':1,'3':2,'4':3,a:0,b:1,c:2,d:3};const k=map[e.key.toLowerCase()];
  if(k!=null&&KEYS.opt){KEYS.opt(k);return}
  if(e.key==='Enter'&&KEYS.next&&tag!=='button'){e.preventDefault();KEYS.next()}});
setInterval(()=>{if(document.visibilityState!=='visible')return;const sc=document.body.dataset.scr;if(sc==='play'||sc==='talk'){S.stats.time+=5;if(S.stats.time%30===0)save()}},5000);
VO.load();FX.init();renderTitle();

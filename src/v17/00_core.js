/* =====================================================================
   v1.7 · TOMO II «La guerre des courants» — núcleo compartido
   Personajes nuevos, decorados, competencias de nivel lycée, rangos,
   y el «ritmo diario» (desbloqueo progresivo con anulación parental).
   ===================================================================== */
const STEP2={};          /* tipos de paso nuevos: se rellenan en 10_steps.js */
const SCENEWIN={};       /* ventanas que proyectan luz en los decorados nuevos */

/* ---------- Personajes ---------- */
Object.assign(CAST,{
  kirchhoff:{n:tx('Gustav Kirchhoff','Gustav Kirchhoff'),role:tx('Königsberg · 1845','Königsberg · 1845'),col:'#7fd1ff'},
  wheatstone:{n:tx('Charles Wheatstone','Charles Wheatstone'),role:tx('Londres · 1843','Londres · 1843'),col:'#e6c27a'},
  deprez:{n:tx('Marcel Deprez','Marcel Deprez'),role:tx('Munich · 1882','Múnich · 1882'),col:'#9ee6a8'},
  westinghouse:{n:tx('George Westinghouse','George Westinghouse'),role:tx('Niagara · 1896','Niágara · 1896'),col:'#ffcf6b'},
  ayrton:{n:tx('Hertha Ayrton','Hertha Ayrton'),role:tx('Ingénieure · Londres','Ingeniera · Londres'),col:'#ff9ec7'},
  entropie:{n:tx('Comtesse Entropie','Condesa Entropía'),role:tx('Elle veut tout changer en chaleur','Quiere convertirlo todo en calor'),col:'#ff7a45'}});
Object.assign(CHARS,{
  kirchhoff:{skin:'#f0d0b2',coat:'#26324a',vest:'#3c465e',shirt:'#f4f0e6',nk:'stock',nkc:'#15161c',hair:'#5a3a22',hs:'side',eye:'#4a6a8a',brow:2.8,jaw:'long'},
  wheatstone:{skin:'#eecaa8',coat:'#3a2f24',vest:'#6a5a3a',shirt:'#f3eee2',nk:'cravat',nkc:'#f3eee2',hair:'#7a6a5a',hs:'bald',eye:'#5a5040',brow:3.4,jaw:'square',fh:'sideburns',age:1},
  deprez:{skin:'#ecc6a2',coat:'#2b3a2e',vest:'#4a5a3e',shirt:'#f2eee4',nk:'bow',nkc:'#1a1a1a',hair:'#3a2a1c',hs:'swept',eye:'#4a4038',brow:3.6,jaw:'round',fh:'chin'},
  westinghouse:{skin:'#efc9a6',coat:'#2a2622',vest:'#5a4a2e',shirt:'#f4efe4',nk:'tie',nkc:'#6a2a2a',hair:'#8a7a6a',hs:'side',eye:'#4a5a6a',brow:4,browc:'#7a6a5a',jaw:'square',fh:'mustache',age:1,medal:1},
  ayrton:{skin:'#f1d3b8',coat:'#3a2440',vest:'#6a3a5a',shirt:'#f6f0ee',nk:'cravat',nkc:'#f6f0ee',hair:'#2a1c18',hs:'bun',eye:'#5a4a3a',brow:2.6,jaw:'round'},
  entropie:{skin:'#e8dcd6',coat:'#3a1a14',vest:'#1a0e0c',shirt:'#f0e2da',nk:'bow',nkc:'#ff7a45',hair:'#d8d4e0',hs:'bun',eye:'#c4502a',brow:3.4,browc:'#9a96a6',jaw:'sharp',mono:1}});

/* ---------- Decorados del tomo II ---------- */
SCENEWIN.konigsberg=[640,60,260,230,'#cfe6ff'];SCENEWIN.london=[600,70,300,220,'#e8e2c8'];SCENEWIN.munich=[120,30,760,190,'#fff1c8'];
const SCENES2={
  konigsberg:(W,H,st)=>`<defs><linearGradient id="skb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141b2c"/><stop offset="1" stop-color="#242a3a"/></linearGradient><linearGradient id="skn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2a4a"/><stop offset="1" stop-color="#6a7fa8"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#skb)"/><rect x="640" y="60" width="260" height="230" fill="url(#skn)"/>${Array.from({length:40},(_,i)=>`<circle cx="${650+(i*67)%240}" cy="${70+(i*41)%210}" r="${1+i%3}" fill="#fff" opacity=".7"/>`).join('')}
    <path d="M640 290V230l30-10v-30l16-20 16 20v30l40 10 20-40h12l20 40 46 0 20-24 24 24V290Z" fill="#0e1424"/><path d="M640 60h260v230H640zM770 60v230M640 175h260" stroke="#4a3a2a" stroke-width="10" fill="none"/>
    <rect x="70" y="70" width="480" height="250" rx="6" fill="#1d2a22" stroke="#5a4630" stroke-width="12"/>
    <g stroke="#e8efe6" stroke-width="3" fill="none" opacity=".85"><path d="M130 130h120v120H130zM250 130h120v120H250z"/><path d="M370 130h110v120H370"/></g>
    <g fill="#e8efe6" opacity=".85">${[[130,130],[250,130],[370,130],[130,250],[250,250],[370,250]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="6"/>`).join('')}</g>
    <g font-family="IM Fell English SC,serif" font-size="26" fill="#e8efe6" opacity=".8"><text x="150" y="196">I₁</text><text x="270" y="196">I₂</text><text x="390" y="196">I₃</text><text x="400" y="300">Σ I = 0</text><text x="120" y="300">Σ U = 0</text></g>
    <path d="M250 130l-14 10m14-10l-6 16" stroke="#ffd27a" stroke-width="3"/>
    <rect x="0" y="400" width="${W}" height="160" fill="#1a1712"/><rect x="40" y="378" width="560" height="30" fill="#5a3b22"/><rect x="60" y="408" width="20" height="120" fill="#3a2614"/><rect x="560" y="408" width="20" height="120" fill="#3a2614"/>
    <path d="M940 160v220" stroke="#6b4a2e" stroke-width="6"/><circle cx="940" cy="150" r="22" fill="#ffd27a" opacity=".9"/><circle cx="940" cy="150" r="60" fill="#ffd27a" opacity=".12"/>`,
  london:(W,H,st)=>`<defs><linearGradient id="sln" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2420"/><stop offset="1" stop-color="#3a3028"/></linearGradient><linearGradient id="slf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a9a8a"/><stop offset="1" stop-color="#d8cfb0"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#sln)"/>${Array.from({length:13},(_,r)=>Array.from({length:22},(_,c)=>`<rect x="${c*48-(r%2)*24}" y="${r*30}" width="44" height="26" fill="#4a3226" opacity=".35"/>`).join('')).join('')}
    <rect x="600" y="70" width="300" height="220" fill="url(#slf)"/><path d="M640 290V210h40v-30h30v30h30q20-60 50-60t50 60h30v-20h20v20h10V290Z" fill="#6a6658" opacity=".8"/><circle cx="770" cy="132" r="6" fill="#6a6658"/><path d="M600 70h300v220H600zM750 70v220M600 180h300" stroke="#3a2a1e" stroke-width="10" fill="none"/>
    ${[0,1,2,3].map(i=>`<path d="M0 ${60+i*14} Q300 ${90+i*14} 560 ${50+i*14}" stroke="#8a7a5a" stroke-width="2" fill="none" opacity=".5"/>`).join('')}
    <rect x="0" y="390" width="${W}" height="170" fill="#221a14"/><rect x="60" y="370" width="880" height="28" fill="#6b4626"/>
    <g transform="translate(260 300)"><path d="M0-70L70 0 0 70-70 0Z" fill="none" stroke="#e6c27a" stroke-width="5"/>${[[0,-70],[70,0],[0,70],[-70,0]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="8" fill="#e6c27a"/>`).join('')}<path d="M0-70V70" stroke="#5ee0ff" stroke-width="3" stroke-dasharray="6 6"/><circle r="16" fill="#1c1a16" stroke="#5ee0ff" stroke-width="3"/><path d="M-8 6l12-14" stroke="#ff5a4f" stroke-width="3"/></g>
    <g transform="translate(470 330)"><rect x="-50" y="-40" width="100" height="80" rx="8" fill="#3a2a1e" stroke="#c9a227" stroke-width="3"/><path d="M-36 20 A40 40 0 0 1 36 20" fill="none" stroke="#f3e6c2" stroke-width="3"/><path d="M0 24 L18 -10" stroke="#ff5a4f" stroke-width="3"/></g>
    <path d="M560 390 q40-80 120-80" stroke="#b8733d" stroke-width="4" fill="none"/>`,
  munich:(W,H,st)=>`<defs><linearGradient id="smh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2a3a"/><stop offset="1" stop-color="#3a4a5a"/></linearGradient><linearGradient id="smw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd8ff"/><stop offset="1" stop-color="#2a7ab0"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#smh)"/>${Array.from({length:9},(_,i)=>`<path d="M${60+i*110} 230 V60 Q${115+i*110} 0 ${170+i*110} 60 V230" fill="rgba(200,230,255,.06)" stroke="#8a96a8" stroke-width="5"/><path d="M${60+i*110} 140 H${170+i*110}" stroke="#8a96a8" stroke-width="2" opacity=".6"/>`).join('')}
    <rect x="0" y="230" width="${W}" height="16" fill="#5a6474"/><rect x="0" y="420" width="${W}" height="140" fill="#2a2a30"/>
    <path d="M600 420 V300 h140 v120" fill="#5a5a62"/><rect x="618" y="270" width="104" height="34" fill="#6a6a74"/><rect x="636" y="304" width="68" height="200" fill="url(#smw)" class="falls" opacity=".85"/>${[0,1,2,3].map(i=>`<path d="M${642+i*16} 310 v110" stroke="#e8f8ff" stroke-width="2" stroke-dasharray="10 14" opacity=".7"/>`).join('')}
    <ellipse cx="670" cy="430" rx="110" ry="16" fill="#2a7ab0" opacity=".7"/>
    ${[200,330,860].map(x=>`<path d="M${x} 420 V250" stroke="#2a2a30" stroke-width="5"/><circle cx="${x}" cy="244" r="12" fill="#fff6d8"/><circle cx="${x}" cy="244" r="46" fill="#fff6d8" opacity=".14"/>`).join('')}
    ${Array.from({length:18},(_,i)=>`<ellipse cx="${30+i*55}" cy="${470+(i%3)*10}" rx="18" ry="34" fill="#141418" opacity=".9"/><circle cx="${30+i*55}" cy="${428+(i%3)*10}" r="12" fill="#141418"/>`).join('')}
    <path d="M0 200 Q300 180 600 270" stroke="#c9a227" stroke-width="3" fill="none" opacity=".8"/><text x="70" y="190" font-family="IM Fell English SC,serif" font-size="20" fill="#c9a227" opacity=".8">Miesbach → München · 57 km</text>`,
  niagara:(W,H,st)=>`<defs><linearGradient id="sng" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1428"/><stop offset="1" stop-color="#1c2c4a"/></linearGradient><linearGradient id="snf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe8ff"/><stop offset="1" stop-color="#3a7ab8"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#sng)"/>${st(70)}
    <path d="M0 250 Q250 230 520 260 L520 560 L0 560Z" fill="#1a2a20"/><rect x="40" y="250" width="440" height="260" fill="url(#snf)" opacity=".9"/>${Array.from({length:22},(_,i)=>`<path d="M${50+i*20} 256 v250" stroke="#f0faff" stroke-width="3" stroke-dasharray="${14+i%4*6} 18" opacity=".55" class="falls"/>`).join('')}
    <ellipse cx="260" cy="512" rx="280" ry="40" fill="#e8f6ff" opacity=".28"/>
    <path d="M560 420 V280 l120-40 120 40 V420Z" fill="#3a3430"/><path d="M560 280 l120-40 120 40" stroke="#5a5048" stroke-width="6" fill="none"/>${[0,1,2,3].map(i=>`<rect x="${578+i*56}" y="300" width="34" height="80" rx="16" fill="#ffd27a" opacity=".85"/>`).join('')}
    ${[860,960].map((x,i)=>`<path d="M${x} 430 L${x-18} 200 L${x+18} 200 Z M${x-36} 220 H${x+36} M${x-28} 260 H${x+28}" stroke="#6a7a8a" stroke-width="4" fill="none"/>`).join('')}<path d="M800 300 Q840 230 878 220 Q930 240 960 222 Q990 230 1000 240" stroke="#9ab" stroke-width="2" fill="none"/>
    <rect x="0" y="420" width="${W}" height="140" fill="#141c18" opacity=".9"/><text x="590" y="460" font-family="IM Fell English SC,serif" font-size="22" fill="#ffcf6b" opacity=".85">Adams Power Plant · 1896</text>`,
  control:(W,H,st)=>`<defs><linearGradient id="scc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1220"/><stop offset="1" stop-color="#121c2e"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#scc)"/>${[0,1,2].map(i=>`<rect x="${70+i*300}" y="50" width="260" height="170" rx="8" fill="#0e2034" stroke="#2a5a7a" stroke-width="3"/>`).join('')}
    <g stroke="#5ee0ff" stroke-width="3" fill="none" opacity=".8"><path d="M110 170 L170 100 L240 150 L290 90"/><path d="M400 180 Q470 60 560 150"/><path d="M700 160h50l20-50 20 80 20-40h40"/></g>
    ${[[150,110],[220,140],[460,110],[520,140],[760,120]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7" fill="#ffd27a"/>`).join('')}
    <rect x="0" y="380" width="${W}" height="180" fill="#0c1422"/><path d="M80 400 h840 l40 60 H40Z" fill="#1a2840"/>${Array.from({length:16},(_,i)=>`<rect x="${110+i*50}" y="412" width="30" height="10" rx="3" fill="${['#4fd18b','#ffd27a','#5ee0ff','#ff5a4f'][i%4]}" opacity=".8"/>`).join('')}`};

/* ---------- Competencias nuevas (progresión hasta 1ʳᵉ / 2º bachillerato) ---------- */
[['req',tx('Résistance équivalente (série, dérivation)','Resistencia equivalente (serie, paralelo)')],
 ['kirchhoff',tx('Lois de Kirchhoff : nœuds et mailles','Leyes de Kirchhoff: nudos y mallas')],
 ['diviseur',tx('Diviseur de tension et potentiomètre','Divisor de tensión y potenciómetro')],
 ['pont',tx('Pont de Wheatstone','Puente de Wheatstone')],
 ['resistivite',tx('Résistivité : R = ρ × L ÷ S','Resistividad: R = ρ × L ÷ S')],
 ['rendement',tx('Rendement et bilan de puissance','Rendimiento y balance de potencia')],
 ['transport',tx('Transport : pertes en ligne et haute tension','Transporte: pérdidas en línea y alta tensión')],
 ['diagnostic',tx('Diagnostic de panne par la mesure','Diagnóstico de averías midiendo')],
 ['reseau',tx('Réseau électrique : production, demande, coût','Red eléctrica: producción, demanda, coste')]]
 .forEach(([id,n])=>{const s={id,fr:n,es:n,t2:1};SKILLS.push(s);SK[id]=s});

/* ---------- Rangos del tomo II ---------- */
RANKS.push([3500,'rank.6','meter'],[5000,'rank.7','gear'],[7000,'rank.8','crystal'],[9500,'rank.9','trophy']);

/* ---------- Estado nuevo (se añade a las partidas existentes sin tocar lo anterior) ---------- */
const T2DEF={t2:{pace:true,pin:'',day:'',n:0,seen:0},exp:{},daily:{last:'',streak:0,best:0,days:[],hist:{}},
  tyc:null};
Object.assign(DEF,T2DEF);
for(const k in T2DEF){if(T2DEF[k]&&typeof T2DEF[k]==='object')S[k]=merge(T2DEF[k],S[k]);else if(!(k in S))S[k]=T2DEF[k]}

/* ---------- Ritmo diario: nuevas misiones del tomo II y del modo experto ---------- */
const PACE_PER_DAY=3;
function paceDay(){const d=dayStr();if(S.t2.day!==d){S.t2.day=d;S.t2.n=0}}
function paceLeft(){paceDay();return S.t2.pace?Math.max(0,PACE_PER_DAY-S.t2.n):99}
const paceOK=()=>paceLeft()>0;
function paceUse(){paceDay();S.t2.n++;save()}
/* pantalla «el Chronotron se recarga»: invita a repasar, al taller, a la compañía o al desafío del día */
function paceWall(go){show('play');RUN=null;$('#phTitle').innerHTML=esc(T(tx('Chronotron en recharge','Chronotron recargándose')));$('#phRight').innerHTML='';
  const stage=$('#stage');stage.className='stage';const tm=new Date();tm.setHours(24,0,0,0);const h=Math.max(1,Math.ceil((tm-new Date())/36e5));
  stage.innerHTML=`<div class="panel end pace"><div class="pace-p">${portrait('lumi','worried')}</div><p class="kicker">${esc(T(tx('Rythme quotidien','Ritmo diario')))}</p>
    <div class="end-big">${esc(T(tx('Reviens demain !','¡Vuelve mañana!')))}</div>
    <p class="cc-msg">${esc(T(tx(`Le Chronotron a fait ${PACE_PER_DAY} sauts aujourd'hui : ses bobines doivent refroidir (encore ${h} h environ). Les vrais ingénieurs apprennent un peu chaque jour : c'est comme ça que le cerveau retient.`,`El Chronotron ha dado ${PACE_PER_DAY} saltos hoy: sus bobinas tienen que enfriarse (unas ${h} h más). Los buenos ingenieros aprenden un poco cada día: así es como el cerebro lo retiene.`)))}</p>
    <ul class="pace-list"><li>${ICON('repeat')} ${esc(T(tx('Rejoue les missions déjà faites pour gagner des étoiles','Repite misiones ya hechas para ganar estrellas')))}</li><li>${ICON('star')} ${esc(T(tx('Le défi du jour et la compagnie électrique restent ouverts','El desafío del día y la compañía eléctrica siguen abiertos')))}</li></ul>
    <div class="end-actions"><button class="btn primary" id="pwBack">${esc(ui('btn.workshop'))}</button><button class="btn ghost sm" id="pwParent">${ICON('lock')} ${esc(T(tx('Parent : débloquer','Padres: desbloquear')))}</button></div><div id="pwPin"></div></div>`;
  $('#pwBack').onclick=()=>renderHub();$('#pwBack').focus();
  $('#pwParent').onclick=()=>pinAsk($('#pwPin'),()=>{S.t2.n=Math.max(0,S.t2.n-PACE_PER_DAY);save();toast(T(tx('Débloqué pour aujourd\'hui','Desbloqueado por hoy')));go()})}
/* código parental: 4 cifras. Si aún no existe, se crea la primera vez (lo hace el adulto). */
function pinAsk(host,ok){const make=!S.t2.pin;
  host.innerHTML=`<div class="pin-box"><p>${esc(T(make?tx('Choisissez un code parent de 4 chiffres (à garder pour vous).','Elegid un código parental de 4 cifras (que solo sepáis vosotros).'):tx('Code parent :','Código parental:')))}</p><div class="num-row"><input id="pinIn" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="PIN"><button class="btn sm primary" id="pinOk">OK</button></div><span class="gmsg" id="pinMsg"></span></div>`;
  const inp=$('#pinIn',host);inp.focus();const go=()=>{const v=(inp.value||'').replace(/\D/g,'');if(v.length!==4){$('#pinMsg',host).textContent=T(tx('4 chiffres','4 cifras'));return}
    if(make){S.t2.pin=v;save();host.innerHTML='';ok()}else if(v===S.t2.pin){host.innerHTML='';ok()}else{AU.play('bad');shakeEl(inp);$('#pinMsg',host).textContent=T(tx('Code incorrect','Código incorrecto'))}};
  $('#pinOk',host).onclick=go;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go()}}}

/* ---------- utilidades de los pasos nuevos ---------- */
const t2Done=()=>CHAPTERS.filter(c=>c.t2&&chState(c.id).complete).length;
/* número con coma y unidad, para enunciados generados */
const nu=(v,u,d)=>(d==null?frs(Math.round(v*1000)/1000):fr(v,d))+(u?' '+u:'');
/* semilla del día: el desafío diario es el mismo para todos los que juegan ese día */
function seeded(seed){let x=0;for(const ch of String(seed))x=(x*31+ch.charCodeAt(0))>>>0;return ()=>{x=(x+0x6D2B79F5)>>>0;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}

/* =====================================================================
   v1.7 · LA COMPAÑÍA ELÉCTRICA (tycoon final)
   Un mapa con barrios y emplazamientos de centrales. Cada «día» simulado representa un mes:
   24 horas de demanda por tipo de barrio, despacho por orden de mérito, flujo de potencia
   con las leyes de Kirchhoff (análisis nodal en «por unidad»), pérdidas R·I², caída de tensión,
   sobrecargas que disparan líneas, averías y tormentas, economía, CO₂, investigación y 5 eras.
   ===================================================================== */
const TY_ERAS=[null,
 {y:1882,n:tx('Le courant continu','La corriente continua'),need:'c6',adv:'edison',tar:.30,K:12,LM:40,volts:[110],rv:{dc3:[220]},sect:[50,120,300,500]},
 {y:1896,n:tx("L'alternatif",'La alterna'),need:'c7',adv:'westinghouse',tar:.25,K:1500,LM:250,volts:[2200],rv:{hv11:[11000]},sect:[16,50,120,300]},
 {y:1930,n:tx('Le grand réseau','La gran red'),need:'c8',adv:'ayrton',tar:.18,K:12000,LM:400,volts:[11000],rv:{hv63:[63000]},sect:[50,120,300,500]},
 {y:1975,n:tx('Nucléaire et 400 kV','Nuclear y 400 kV'),need:'c9',adv:'tesla',tar:.12,K:250000,LM:1000,volts:[63000],rv:{hv400:[225000,400000]},sect:[120,300,500,1000]},
 {y:2026,n:tx('La transition énergétique','La transición energética'),need:'c9',adv:'lumi',tar:.15,K:300000,LM:1250,volts:[63000,225000,400000],rv:{},sect:[120,300,500,1000],co2:.08}];
const TY_SITES={
 center:{x:500,y:330,k:'p',era:1,allow:['steam','coal','gas'],n:tx('Centrale urbaine','Central urbana')},
 old:{x:420,y:250,k:'d',era:1,type:'res',size:1,n:tx('Vieille ville','Casco antiguo')},
 gare:{x:600,y:370,k:'d',era:1,type:'com',size:.8,n:tx('Quartier de la gare','Barrio de la estación')},
 usine:{x:300,y:440,k:'d',era:2,type:'ind',size:1.4,n:tx('Zone industrielle','Polígono industrial')},
 port:{x:770,y:450,k:'d',era:2,type:'ind',size:1.2,n:tx('Le port','El puerto')},
 riv:{x:170,y:210,k:'p',era:2,allow:['hydro'],n:tx('Rivière','Río')},
 mine:{x:130,y:510,k:'p',era:2,allow:['coal','steam'],n:tx('Mine de charbon','Mina de carbón')},
 hop:{x:520,y:150,k:'d',era:3,type:'crit',size:.5,n:tx('Hôpital','Hospital')},
 ban:{x:720,y:210,k:'d',era:3,type:'res',size:1.3,n:tx('Banlieue','Afueras')},
 lake:{x:340,y:70,k:'p',era:3,allow:['dam','pumped'],n:tx('Lac de montagne','Lago de montaña')},
 coast:{x:920,y:530,k:'p',era:4,allow:['nuke','gas'],n:tx('La côte','La costa')},
 off:{x:965,y:400,k:'p',era:5,allow:['offshore'],n:tx('Large','Mar adentro')},
 bat:{x:540,y:470,k:'p',era:5,allow:['battery','gas'],n:tx('Parc de stockage','Parque de almacenamiento')},
 hill:{x:900,y:110,k:'p',era:5,allow:['wind'],n:tx('Colline ventée','Colina ventosa')},
 plain:{x:620,y:550,k:'p',era:5,allow:['solar','battery'],n:tx('Plaine ensoleillée','Llanura soleada')},
 campus:{x:880,y:330,k:'d',era:5,type:'data',size:1.1,n:tx('Centre de données','Centro de datos')},
 eco:{x:220,y:340,k:'d',era:5,type:'ev',size:1,n:tx('Écoquartier','Ecobarrio')}};
const TY_CORR=[['center','old',.5,1],['center','gare',.6,1],['old','gare',.8,1],
 ['riv','old',12,2],['riv','usine',10,2],['mine','usine',8,2],['mine','center',16,2],['gare','port',6,2],['usine','old',5,2],['center','port',9,2],['center','usine',7,2],
 ['lake','riv',15,3],['lake','hop',22,3],['hop','old',4,3],['hop','ban',5,3],['ban','gare',6,3],['lake','ban',28,3],
 ['coast','port',7,4],['coast','ban',45,4],['coast','center',38,4],
 ['hill','ban',18,5],['hill','campus',15,5],['plain','port',6,5],['plain','gare',9,5],['campus','port',8,5],['campus','ban',9,5],['eco','usine',4,5],['eco','old',5,5],['plain','eco',25,5],['off','campus',12,5],['off','port',14,5],['bat','gare',3,5],['bat','center',4,5],['bat','port',8,5],['bat','usine',9,5]].map(([a,b,km,era])=>({id:a+'-'+b,a,b,km,era}));
const TY_PL={
 steam:{n:tx('Vapeur + dynamo','Vapor + dinamo'),era:1,CF:.6,FF:.45,co2:1.2,u:[.5,1,2],col:'#b08d57'},
 coal:{n:tx('Centrale à charbon','Central de carbón'),era:2,CF:.7,FF:.3,co2:1,u:[1,2,3],col:'#6b6b74'},
 hydro:{n:tx("Centrale au fil de l'eau",'Central fluyente'),era:2,CF:1.1,FF:0,co2:0,u:[.5,1,2],col:'#5ec8ff'},
 dam:{n:tx('Barrage','Presa'),era:3,CF:1.4,FF:0,co2:0,u:[1,2,3],col:'#3a8ad8'},
 gas:{n:tx('Turbine à gaz','Turbina de gas'),era:4,CF:.4,FF:.55,co2:.45,u:[.5,1,2],col:'#ff9f43'},
 nuke:{n:tx('Centrale nucléaire','Central nuclear'),era:4,CF:2,FF:.08,co2:0,u:[2,4],min:.7,col:'#b9a7ff'},
 wind:{n:tx('Parc éolien','Parque eólico'),era:5,CF:.7,FF:0,co2:0,u:[.5,1,2],col:'#9ee6a8'},
 offshore:{n:tx('Éolien en mer','Eólica marina'),era:5,CF:1,FF:0,co2:0,u:[1,2],col:'#7fd1ff'},
 solar:{n:tx('Centrale solaire','Planta solar'),era:5,CF:.4,FF:0,co2:0,u:[.5,1,2],col:'#ffd27a'},
 battery:{n:tx('Batteries (4 h)','Baterías (4 h)'),era:5,CF:.3,FF:0,co2:0,u:[.25,.5,1],store:4,need:'battery',col:'#4fd18b'},
 pumped:{n:tx('STEP (pompage, 8 h)','Central de bombeo (8 h)'),era:5,CF:1.2,FF:0,co2:0,u:[.5,1],store:8,col:'#2a7ab0'}};
const TY_RES={
 dc3:{era:1,gk:'PRI',k:.15,n:tx("Les trois fils d'Edison",'Los tres hilos de Edison'),d:tx('Lignes en 220 V continu : deux fois moins de courant pour la même puissance.','Líneas de 220 V en continua: la mitad de corriente para la misma potencia.')},
 hv11:{era:2,gk:'transfo',k:.12,n:tx('Transformateurs 11 kV','Transformadores de 11 kV'),d:tx('Lignes en 11 000 V : I divisé par 5, pertes divisées par 25.','Líneas de 11 000 V: I entre 5, pérdidas entre 25.')},
 alu:{era:2,gk:'rho',k:.06,n:tx('Câbles en aluminium','Cables de aluminio'),d:tx('Moins chers et plus légers, un peu plus résistants (ρ = 0,028).','Más baratos y ligeros, algo más resistentes (ρ = 0,028).')},
 relay:{era:3,gk:'calibre',k:.08,n:tx('Relais de protection','Relés de protección'),d:tx("Une ligne qui disjoncte se réenclenche après 2 h, et la surcharge ne se propage plus.","Una línea que salta se reconecta a las 2 h, y la sobrecarga ya no se propaga.")},
 hv63:{era:3,gk:'loss',k:.12,n:tx('Lignes 63 kV','Líneas de 63 kV'),d:tx('Le transport régional à haute tension.','El transporte regional en alta tensión.')},
 scada:{era:3,gk:'eta',k:.05,n:tx('Salle de conduite','Centro de control'),d:tx('Prévisions : tu vois la météo et les événements du mois suivant.','Previsiones: ves el tiempo y los sucesos del mes siguiente.')},
 hv400:{era:4,gk:'loss',k:.1,n:tx('Lignes 225 et 400 kV','Líneas de 225 y 400 kV'),d:tx('Le réseau de transport national.','La red de transporte nacional.')},
 battery:{era:5,gk:'kwhMJ',k:.05,n:tx('Stockage par batteries','Almacenamiento con baterías'),d:tx('Stocke le surplus solaire de midi pour le soir.','Guarda el excedente solar del mediodía para la noche.')},
 smart:{era:5,gk:'cost',k:.05,n:tx('Compteurs intelligents','Contadores inteligentes'),d:tx("Les voitures et les chauffe-eau se rechargent quand l'énergie est abondante.","Los coches y los termos se cargan cuando la energía sobra.")}};
const TY_OBJ={
 1:[{id:'a',t:tx('Alimente la vieille ville et la gare à 98 % pendant 2 mois de suite','Abastece el casco antiguo y la estación al 98 % durante 2 meses seguidos'),test:H=>streak(H,r=>r.served>=.98&&r.dOn>=2)>=2},
    {id:'b',t:tx('Un mois avec une chute de tension ≤ 5 % dans chaque quartier','Un mes con caída de tensión ≤ 5 % en cada barrio'),test:H=>H.some(r=>r.dOn>=2&&r.maxDrop<=5&&r.served>=.98)},
    {id:'c',t:tx('Bénéfice cumulé ≥ 4 000 €','Beneficio acumulado ≥ 4000 €'),test:(H,T)=>T.profit>=4000}],
 2:[{id:'a',t:tx('Quatre quartiers alimentés à 98 % pendant 2 mois de suite','Cuatro barrios abastecidos al 98 % durante 2 meses seguidos'),test:H=>streak(H,r=>r.served>=.98&&r.dOn>=4)>=2},
    {id:'b',t:tx('Un mois avec moins de 5 % de pertes en ligne','Un mes con menos del 5 % de pérdidas en línea'),test:H=>H.some(r=>r.dOn>=4&&r.served>=.98&&r.lossP<5)},
    {id:'c',t:tx('Bénéfice cumulé ≥ 1,5 M€','Beneficio acumulado ≥ 1,5 M€'),test:(H,T)=>T.profit>=1.5e6}],
 3:[{id:'a',t:tx("L'hôpital jamais coupé pendant 4 mois de suite (et tout le monde à 97 %)","El hospital nunca cortado durante 4 meses seguidos (y todos al 97 %)"),test:H=>streak(H,r=>r.hosp===0&&r.dOn>=6&&r.served>=.97)>=4},
    {id:'b',t:tx('Traverser une tempête sans délestage','Superar una tormenta sin cortes de carga'),test:H=>H.some(r=>r.ev==='storm'&&r.served>=.995)},
    {id:'c',t:tx('Réputation ≥ 80','Reputación ≥ 80'),test:(H,T)=>T.rep>=80}],
 4:[{id:'a',t:tx('Tous les quartiers à 99 % pendant 3 mois de suite','Todos los barrios al 99 % durante 3 meses seguidos'),test:H=>streak(H,r=>r.served>=.99&&r.dOn>=6)>=3},
    {id:'b',t:tx('Un mois avec moins de 2 % de pertes','Un mes con menos del 2 % de pérdidas'),test:H=>H.some(r=>r.dOn>=6&&r.served>=.99&&r.lossP<2)},
    {id:'c',t:tx('Bénéfice cumulé ≥ 150 M€','Beneficio acumulado ≥ 150 M€'),test:(H,T)=>T.profit>=1.5e8}],
 5:[{id:'a',t:tx('Un mois à moins de 0,1 t de CO₂ par MWh, sans délestage','Un mes con menos de 0,1 t de CO₂ por MWh, sin cortes'),test:H=>H.some(r=>r.dOn>=8&&r.served>=.99&&r.co2i<.1)},
    {id:'b',t:tx('Un mois d\'hiver à plus de 60 % de renouvelables, sans délestage','Un mes de invierno con más del 60 % de renovables, sin cortes'),test:H=>H.some(r=>r.dOn>=8&&r.served>=.99&&r.ren>=.6&&[11,0,1].includes(r.m))},
    {id:'c',t:tx('Réputation ≥ 90','Reputación ≥ 90'),test:(H,T)=>T.rep>=90}]};
function streak(H,f){let n=0,b=0;H.forEach(r=>{n=f(r)?n+1:0;b=Math.max(b,n)});return b}
const TY_PER_DAY=4;
const MONTHS=[tx('janvier','enero'),tx('février','febrero'),tx('mars','marzo'),tx('avril','abril'),tx('mai','mayo'),tx('juin','junio'),tx('juillet','julio'),tx('août','agosto'),tx('septembre','septiembre'),tx('octobre','octubre'),tx('novembre','noviembre'),tx('décembre','diciembre')];
const tyUnlockedEra=e=>e>=1&&e<=5&&chState(TY_ERAS[e].need).complete;
const tyE=()=>TY_ERAS[S.tyc.era];
const kWf=v=>{const a=Math.abs(v);return a>=1e6?fr(v/1e6,a>=1e7?1:2)+' GW':a>=1e3?fr(v/1e3,a>=1e4?0:1)+' MW':fr(v,a>=100?0:1)+' kW'};
const eur=v=>(v<0?'−':'')+fmtBig(Math.abs(v)).replace(/ $/,'')+' €';
const vName=v=>v>=1000?frs(v/1000)+' kV':v+' V';

/* ---------- estado ---------- */
function tyNew(){return {era:1,day:0,money:0,rep:60,profit:0,co2:0,tar:1,plants:{},lines:[],res:{},rtry:{},hist:[],obj:{},stars:{},sim:{d:'',n:0},bonus:0,grow:{},seed:Math.floor(Math.random()*1e9),seen:{},name:''}}
function tyStartEra(e){const T=S.tyc,E=TY_ERAS[e];T.era=e;T.hist=[];T.profit=0;
  const dists=Object.entries(TY_SITES).filter(([,s])=>s.k==='d'&&s.era<=e);const peak=dists.reduce((a,[id,s])=>a+s.size*(T.grow[id]||1),0)*E.K;
  const prevStars=e>1?Object.values(T.stars[e-1]||{}).length:0;T.money=Math.round(peak*468*E.tar*3*(1+.15*prevStars));
  /* modernización: se retiran las líneas con tensiones de eras pasadas */
  const ok=tyVolts(e,true);T.lines=T.lines.filter(l=>ok.includes(l.U));T.rep=Math.max(T.rep,55);save()}
function tyVolts(e,all){const E=TY_ERAS[e];let v=[...E.volts];for(const [r,vs] of Object.entries(E.rv))if(all||S.tyc.res[r])v=v.concat(vs);return v}

/* ---------- perfiles horarios y disponibilidad ---------- */
const PROF={res:[.4,.35,.33,.33,.35,.45,.6,.75,.7,.6,.55,.55,.6,.55,.52,.55,.65,.85,1,1,.95,.85,.7,.5],
 com:[.25,.22,.2,.2,.22,.3,.45,.7,.9,.95,1,1,.95,.95,1,1,.95,.9,.8,.6,.45,.35,.3,.27],
 ind:[.55,.55,.55,.55,.55,.6,.85,.95,1,1,1,1,.9,1,1,1,.95,.9,.8,.75,.7,.65,.6,.55],
 crit:[.8,.78,.78,.78,.8,.85,.9,.95,1,1,1,1,1,1,1,1,1,.98,.95,.92,.9,.88,.85,.82],
 data:[.92,.92,.92,.92,.92,.92,.93,.95,.97,1,1,1,1,1,1,1,1,.99,.98,.97,.96,.95,.94,.93],
 ev:[.6,.55,.5,.45,.4,.45,.55,.7,.55,.4,.35,.35,.35,.35,.4,.5,.7,.9,1,1,.95,.85,.75,.65]};
const SEASON=m=>({heat:[1.25,1.2,1.08,1,.95,.95,1,1,.95,1,1.1,1.22][m],sun:[.45,.55,.7,.85,.95,1,1,.95,.8,.65,.5,.42][m],river:[.65,.7,.9,1,.95,.8,.6,.5,.55,.65,.75,.7][m]});
function tyWeather(T,day){const r=seeded('ty'+T.seed+'-'+day);const m=day%12;const E=T.era;const w={cloud:r(),wind:.15+r()*.65,wnoise:[],ev:null,evH:ri2(r,9,20)};for(let h=0;h<24;h++)w.wnoise.push(.75+r()*.5);
  const p=r();const cand=[];if(E>=2)cand.push('storm','drought','sabotage');if(E>=2&&E<=3)cand.push('strike');if(E>=3&&[11,0,1].includes(m))cand.push('cold','cold');if(E>=4&&[5,6,7].includes(m))cand.push('heat','heat');if(E>=4)cand.push('fuel');if(E>=5)cand.push('calm');
  if(E===1&&p<.35)w.ev='sabotage';else if(cand.length&&p<.55)w.ev=cand[Math.floor(r()*cand.length)];
  if(w.ev==='drought'&&![5,6,7,8].includes(m))w.ev=null;w.r2=r();return w}
const EV_N={storm:tx('Tempête','Tormenta'),drought:tx('Sécheresse','Sequía'),sabotage:tx('Sabotage de la Comtesse','Sabotaje de la Condesa'),strike:tx('Grève des mineurs','Huelga minera'),cold:tx('Vague de froid','Ola de frío'),heat:tx('Canicule','Ola de calor'),fuel:tx('Prix du gaz × 2','Precio del gas × 2'),calm:tx('Pas de vent','Sin viento')};
const EV_D={storm:tx('Une ligne au hasard va disjoncter dans la journée.','Una línea al azar saltará durante el día.'),drought:tx('Les rivières et le lac baissent : hydraulique −50 %.','Ríos y lago bajan: hidráulica −50 %.'),sabotage:tx('Une ligne au hasard perd la moitié de sa capacité.','Una línea al azar pierde la mitad de su capacidad.'),strike:tx('Les centrales à charbon sont à l\'arrêt.','Las centrales de carbón están paradas.'),cold:tx('Chauffage à fond : demande résidentielle +20 %.','Calefacción a tope: demanda residencial +20 %.'),heat:tx('Climatisation : bureaux et données +15 %.','Aire acondicionado: oficinas y datos +15 %.'),fuel:tx('Le gaz coûte deux fois plus cher ce mois-ci.','El gas cuesta el doble este mes.'),calm:tx('Les éoliennes tournent à peine.','Los aerogeneradores apenas giran.')};

/* ---------- física de una línea ---------- */
const TY_RHO={cu:.017,al:.028};const TY_TOW={110:2,220:3,2200:8,11000:15,63000:40,225000:90,400000:150};const TY_MET={cu:.15,al:.06};
const lineR=l=>TY_RHO[l.mat]*2*l.km*1000/l.S;
const lineImax=l=>(l.mat==='al'?2.4:3)*l.S*(l.half?.5:1);
const lineCost=(l,e)=>Math.round(l.km*(TY_TOW[l.U]+l.S*TY_MET[l.mat])*TY_ERAS[e||S.tyc.era].LM);
const plantCost=(t,cap,e)=>Math.round(cap*TY_PL[t].CF*TY_ERAS[e||S.tyc.era].tar*1000);

/* ---------- simulación de un mes (24 h representativas) ---------- */
function tySim(T,opt){opt=opt||{};const E=TY_ERAS[T.era],day=T.day,m=day%12,se=SEASON(m),w=tyWeather(T,day);
  const dists=Object.entries(TY_SITES).filter(([,s])=>s.k==='d'&&s.era<=T.era).map(([id])=>id);
  const plants=Object.entries(T.plants).map(([id,p])=>Object.assign({id},p));
  const lines=T.lines.map(l=>Object.assign({},l,{out:0,half:0}));const Ub=Math.max(110,...lines.map(l=>l.U));
  if(w.ev==='sabotage'&&lines.length)lines[Math.floor(w.r2*lines.length)].half=1;
  const stormL=w.ev==='storm'&&lines.length?Math.floor(w.r2*lines.length):-1;
  const store={};plants.forEach(p=>{if(TY_PL[p.t].store)store[p.id]=p.cap*TY_PL[p.t].store*.5});
  const damE={};plants.forEach(p=>{if(p.t==='dam')damE[p.id]=p.cap*10*(w.ev==='drought'?.6:1)*se.river});
  const R={m,ev:w.ev,hours:[],dem:0,served:0,loss:0,gen:{},co2:0,fuel:0,trips:0,over:0,hosp:0,maxDrop:0,drop:{},unserved:{},lineMax:{},dOn:0};
  const conn=new Set();lines.forEach(l=>{conn.add(l.a);conn.add(l.b)});
  R.dOn=dists.filter(d=>conn.has(d)).length;
  const smart=!!T.res.smart;
  for(let h=0;h<24;h++){
    if(h===w.evH&&stormL>=0){lines[stormL].out=T.res.relay?2:99;R.trips++}
    lines.forEach(l=>{if(l.out>0&&l.out<99&&h>0)l.out--});
    /* demanda */
    const load={};dists.forEach(d=>{const s=TY_SITES[d];let pf=PROF[s.type][h];if(s.type==='ev'&&smart)pf=[.85,.85,.8,.75,.7,.6,.55,.6,.5,.45,.55,.65,.7,.65,.55,.5,.55,.65,.7,.7,.75,.8,.85,.85][h];
      let k=1;if(s.type==='res'||s.type==='ev')k=se.heat*(w.ev==='cold'?1.2:1);if((s.type==='com'||s.type==='data')&&w.ev==='heat')k=1.15;if(smart&&s.type==='res'&&h>=17&&h<=21)k*=.92;
      load[d]=s.size*(T.grow[d]||1)*E.K*pf*k});
    /* disponibilidad */
    const sun=h<6||h>20?0:Math.max(0,Math.sin((h-6)/14*Math.PI))*se.sun*(1-.6*w.cloud);
    const av={},cost={};plants.forEach(p=>{const P=TY_PL[p.t];let a=p.cap;
      if(p.t==='hydro')a*=se.river*(w.ev==='drought'?.5:1);if(p.t==='solar')a*=sun;if(p.t==='wind'||p.t==='offshore')a*=Math.min(1,w.wind*(p.t==='offshore'?1.3:1)*w.wnoise[h]*(w.ev==='calm'?.2:1));
      if(p.t==='coal'&&w.ev==='strike')a=0;if(TY_PL[p.t].store)a=Math.min(p.cap,store[p.id]);if(p.t==='dam')a=Math.min(p.cap,damE[p.id]/Math.max(1,24-h)*2.2);
      av[p.id]=Math.max(0,a);cost[p.id]=P.FF*(p.t==='gas'&&w.ev==='fuel'?2:1)});
    let lg=.03,res=null;
    for(let it=0;it<3;it++){res=tyHour(T,plants,lines,load,av,cost,lg,Ub,store);const D=Object.values(res.servedL).reduce((a,b)=>a+b,0);lg=D>0?res.loss/D:0;
      const trip=lines.filter(l=>!l.out&&Math.abs(res.I[l.id]||0)>lineImax(l)*1.25);if(!trip.length)break;
      if(T.res.relay){trip.sort((a,b)=>Math.abs(res.I[b.id])/lineImax(b)-Math.abs(res.I[a.id])/lineImax(a));trip[0].out=2;R.trips++}else{trip.forEach(l=>{l.out=99;R.trips++})}}
    /* almacenamiento: carga con el excedente renovable, descarga lo usado */
    plants.forEach(p=>{if(TY_PL[p.t].store){store[p.id]=Math.max(0,store[p.id]-(res.gen[p.id]||0))+Math.min(p.cap,(res.spill||0)*(p.cap/Math.max(1,res.storeCap))*.85);store[p.id]=Math.min(p.cap*TY_PL[p.t].store,store[p.id])}
      if(p.t==='dam')damE[p.id]=Math.max(0,damE[p.id]-(res.gen[p.id]||0))});
    /* contabilidad de la hora */
    const D=Object.values(load).reduce((a,b)=>a+b,0),Sv=Object.values(res.servedL).reduce((a,b)=>a+b,0);
    R.dem+=D;R.served+=Sv;R.loss+=res.loss;
    plants.forEach(p=>{const g=res.gen[p.id]||0;if(TY_PL[p.t].store&&g<0)return;R.gen[p.t]=(R.gen[p.t]||0)+g;R.co2+=g*TY_PL[p.t].co2/1000;R.fuel+=g*cost[p.id]*E.tar});
    dists.forEach(d=>{R.unserved[d]=(R.unserved[d]||0)+(load[d]-(res.servedL[d]||0));const dr=res.drop[d]||0;if(load[d]>0&&res.servedL[d]>0)R.drop[d]=Math.max(R.drop[d]||0,dr);
      if(d==='hop'&&load[d]-(res.servedL[d]||0)>load[d]*.01)R.hosp++});
    lines.forEach(l=>{const k=Math.abs(res.I[l.id]||0)/lineImax(l);R.lineMax[l.id]=Math.max(R.lineMax[l.id]||0,k);if(k>1)R.over++});
    R.hours.push({h,D,Sv,loss:res.loss,gen:Object.assign({},res.gen),I:Object.assign({},res.I),drop:Object.assign({},res.drop),out:lines.filter(l=>l.out).map(l=>l.id)})}
  R.maxDrop=Math.max(0,...dists.filter(d=>conn.has(d)).map(d=>R.drop[d]||0));R.lossP=R.served>0?R.loss/(R.served+R.loss)*100:0;
  const ren=['hydro','dam','wind','offshore','solar','pumped','battery'].reduce((a,t)=>a+(R.gen[t]||0),0),gt=Object.values(R.gen).reduce((a,b)=>a+b,0)||1;
  R.ren=ren/gt;R.co2i=R.co2/Math.max(1e-9,gt/1000);R.served=R.dem>0?R.served/R.dem:0;R.servedKWh=R.served*R.dem;
  /* economía del mes (×30) */
  const capex=Object.values(T.plants).reduce((a,p)=>a+plantCost(p.t,p.cap,T.era),0)+T.lines.reduce((a,l)=>a+lineCost(l,T.era),0);
  R.rev=R.servedKWh*E.tar*T.tar*30;R.fuelM=R.fuel*30;R.om=capex*.012;R.co2M=R.co2*30*(E.co2?E.co2*1000*E.tar*5:0);R.profit=R.rev-R.fuelM-R.om-R.co2M;
  R.rep=Math.round((R.served>=.995?4:-(1-R.served)*120)-(R.maxDrop>10?4:R.maxDrop>7?1.5:0)-R.hosp*3-(T.tar-1)*25-(R.trips>2?2:0)+(E.co2&&R.co2i<.2?2:0));
  return R}
/* una hora: despacho por orden de mérito en cada isla de la red, y flujo con las leyes de Kirchhoff */
function tyHour(T,plants,lines,load,av,cost,lg,Ub,store){const live=lines.filter(l=>!l.out);const par={};const f=k=>{while(par[k]!==undefined&&par[k]!==k)k=par[k];return k};
  const nodes=new Set([...Object.keys(load),...plants.map(p=>p.id)]);nodes.forEach(n=>par[n]=n);live.forEach(l=>{if(nodes.has(l.a)&&nodes.has(l.b)){const a=f(l.a),b=f(l.b);if(a!==b)par[a]=b}});
  const comps={};nodes.forEach(n=>{const r=f(n);(comps[r]=comps[r]||[]).push(n)});
  const gen={},servedL={},I={},drop={};let loss=0,spill=0,storeCap=0;
  for(const ns of Object.values(comps)){const pl=plants.filter(p=>ns.includes(p.id)),ld=ns.filter(n=>n in load);const D=ld.reduce((a,d)=>a+load[d],0);if(!pl.length){ld.forEach(d=>servedL[d]=0);continue}
    let need=D*(1+lg);const mer=p=>TY_PL[p.t].store?9:p.t==='dam'?.35:cost[p.id];const order=pl.slice().sort((a,b)=>mer(a)-mer(b));
    /* nuclear: mínimo técnico */
    pl.forEach(p=>gen[p.id]=0);pl.forEach(p=>{if(TY_PL[p.t].min){gen[p.id]=Math.min(av[p.id],p.cap*TY_PL[p.t].min);need-=gen[p.id]}});
    for(const p of order){if(need<=0)break;const g=Math.min(need,av[p.id]-gen[p.id]);if(g>0){gen[p.id]+=g;need-=g}}
    const sup=pl.reduce((a,p)=>a+gen[p.id],0);let fr_=1;
    if(need>1e-6){/* déficit: se corta primero a todos menos al hospital */const avail=sup/(1+lg);const hop=ld.includes('hop')?load.hop:0;
      ld.forEach(d=>{servedL[d]=d==='hop'?Math.min(hop,avail):Math.max(0,avail-hop)*load[d]/Math.max(1e-9,D-hop)})}
    else{ld.forEach(d=>servedL[d]=load[d]);const ren=pl.filter(p=>['solar','wind','offshore','hydro'].includes(p.t)).reduce((a,p)=>a+av[p.id]-gen[p.id],0);spill+=Math.max(0,ren);storeCap+=pl.filter(p=>TY_PL[p.t].store).reduce((a,p)=>a+p.cap,0)}
    /* flujo: análisis nodal por unidad, referencia = la central que más produce */
    const slack=pl.slice().sort((a,b)=>gen[b.id]-gen[a.id])[0].id;const idx=ns.filter(n=>n!==slack);const k=new Map(idx.map((n,i)=>[n,i]));
    const A=idx.map(()=>Array(idx.length).fill(0)),b=Array(idx.length).fill(0);
    const ls=live.filter(l=>ns.includes(l.a)&&ns.includes(l.b));
    ls.forEach(l=>{const g=1/Math.max(1e-9,lineR(l)*(Ub/l.U)**2);const ia=k.get(l.a),ib=k.get(l.b);if(ia!=null)A[ia][ia]+=g;if(ib!=null)A[ib][ib]+=g;if(ia!=null&&ib!=null){A[ia][ib]-=g;A[ib][ia]-=g}});
    idx.forEach((n,i)=>{A[i][i]+=1e-12;const inj=(gen[n]||0)-(servedL[n]||0);b[i]=inj*1000/Ub});
    const V=idx.length?gauss(A,b):[];const Vn=n=>n===slack?0:V[k.get(n)];
    ls.forEach(l=>{const Rr=lineR(l)*(Ub/l.U)**2;const Iref=(Vn(l.a)-Vn(l.b))/Rr;const Ia=Iref*Ub/l.U;I[l.id]=Ia;loss+=lineR(l)*Ia*Ia/1000});
    ld.forEach(d=>drop[d]=Math.max(0,-Vn(d)/Ub*100));
    /* las pérdidas las cubre la central de referencia */
    const lc=ls.reduce((a,l)=>a+lineR(l)*I[l.id]**2/1000,0);gen[slack]=Math.min(av[slack]+1e9,gen[slack]+Math.max(0,lc-(sup-ld.reduce((a,d)=>a+servedL[d],0))))}
  return {gen,servedL,I,drop,loss,spill,storeCap}}

/* ---------- pantalla principal ---------- */
let TYSEL=null,TYBUILD=null;
function tyEnsure(){if(!S.tyc){S.tyc=tyNew();tyStartEra(1)}}
function tySimLeft(){const T=S.tyc,d=dayStr();if(T.sim.d!==d){T.sim.d=d;T.sim.n=0}return S.t2.pace?Math.max(0,TY_PER_DAY+(T.bonusD===d?2:0)-T.sim.n):99}
function openTycoon(){if(!tyUnlockedEra(1)){AU.play('bad');toast(T(tx('Termine le chapitre de Königsberg pour fonder ta compagnie.','Termina el capítulo de Königsberg para fundar tu compañía.')));return}
  tyEnsure();const Ty=S.tyc;VIEW={f:'tyc'};BACK=null;show('hub');
  if(!Ty.seen[Ty.era]){Ty.seen[Ty.era]=1;save();return tyEraIntro(Ty.era).then(openTycoon)}
  const E=tyE(),h=$('#scr-hub'),left=tySimLeft(),last=Ty.hist[Ty.hist.length-1];
  h.innerHTML=headHTML()+`<button class="btn sm ghost" id="back">‹ ${esc(ui('btn.workshop'))}</button>
   <section class="panel ty-head"><div><p class="kicker">${esc(T(tx('Ta compagnie électrique','Tu compañía eléctrica')))} · ${esc(T(tx('Ère','Era')))} ${Ty.era} · ${E.y}</p><h2>${esc(T(E.n))}</h2></div>
    <div class="ty-kpi"><span><i>${esc(T(tx('Trésorerie','Caja')))}</i><b class="${Ty.money<0?'bad':''}">${eur(Ty.money)}</b></span><span><i>${esc(T(tx('Réputation','Reputación')))}</i><b>${Ty.rep}/100</b></span><span><i>${esc(T(tx('Mois','Mes')))}</i><b>${esc(T(MONTHS[Ty.day%12]))} ${E.y+Math.floor(Ty.day/12)}</b></span><span><i>${esc(T(tx('Tarif','Tarifa')))}</i><b>${fr(E.tar*Ty.tar,2)} €/kWh</b></span></div></section>
   <div class="ty-main"><div class="panel ty-mapw"><div id="tyMap"></div><div class="ty-legend">${tyLegend()}</div></div><aside class="panel ty-side" id="tySide"></aside></div>
   <div class="ty-actions"><button class="btn primary lg" id="tySim" ${left<=0?'disabled':''}>${ICON('play')} ${esc(T(tx('Simuler le mois','Simular el mes')))} <small>(${left>=99?'∞':left} ${esc(T(tx("aujourd'hui","hoy")))})</small></button>
    <button class="btn ghost" id="tyRes">${ICON('book')} ${esc(T(tx('Recherche','Investigación')))}</button><button class="btn ghost" id="tyObj">${ICON('target')} ${esc(T(tx('Objectifs','Objetivos')))} ${tyStarsTxt(Ty.era)}</button>${last?`<button class="btn ghost" id="tyLast">${ICON('chart')} ${esc(T(tx('Dernier rapport','Último informe')))}</button>`:''}</div>
   ${left<=0?`<p class="bubble shop-tip"><b>Lumi ›</b> ${esc(T(tx('Les ingénieurs se reposent : reviens demain pour simuler d\'autres mois. Tu peux continuer à construire et à chercher.','El equipo descansa: vuelve mañana para simular más meses. Puedes seguir construyendo e investigando.')))} <button class="linkbtn" id="tyPin">${esc(T(tx('Parent : débloquer','Padres: desbloquear')))}</button></p><div id="tyPinBox"></div>`:''}`;
  wireTop();$('#back').onclick=()=>renderHub();tyDrawMap();tySide();
  $('#tySim').onclick=()=>tyRun();$('#tyRes').onclick=()=>tyResearch();$('#tyObj').onclick=()=>tyObjectives();const lb=$('#tyLast');if(lb)lb.onclick=()=>tyReport(last,true);
  const pb=$('#tyPin');if(pb)pb.onclick=()=>pinAsk($('#tyPinBox'),()=>{Ty.sim.n=Math.max(0,Ty.sim.n-TY_PER_DAY);save();openTycoon()})}
const tyStarsTxt=e=>{const n=Object.keys(S.tyc.stars[e]||{}).length;return `<span class="ty-st">${'★'.repeat(n)}${'☆'.repeat(3-n)}</span>`};
function tyLegend(){const vs=tyVolts(S.tyc.era);return vs.map(v=>`<span><i style="background:${vCol(v)}"></i>${vName(v)}</span>`).join('')+`<span><i class="lg-d"></i>${esc(T(tx('tracé possible','trazado posible')))}</span>`}
const vCol=v=>({110:'#c9a227',220:'#e8c86a',2200:'#9ee6a8',11000:'#4fd18b',63000:'#5ee0ff',225000:'#7fa8ff',400000:'#c77dff'})[v]||'#ccc';
function tyDrawMap(hr){const Ty=S.tyc,e=Ty.era;const sites=Object.entries(TY_SITES).filter(([,s])=>s.era<=e);const has=id=>!!Ty.plants[id];
  const built=new Set(Ty.lines.map(l=>l.id));let s=`<defs><radialGradient id="tyG"><stop offset="0" stop-color="#ffe7a8" stop-opacity=".8"/><stop offset="1" stop-color="#ffe7a8" stop-opacity="0"/></radialGradient></defs><rect width="1000" height="600" rx="14" class="ty-bg"/>
   <path d="M0 470 Q200 430 320 560 L0 600Z" class="ty-land2"/><path d="M820 600 Q860 470 1000 450 L1000 600Z" class="ty-sea"/><path d="M60 0 Q140 160 180 220 Q240 330 210 600" class="ty-river"/>`;
  TY_CORR.filter(c=>c.era<=e&&!built.has(c.id)).forEach(c=>{const A=TY_SITES[c.a],B=TY_SITES[c.b];s+=`<g class="ty-corr ${TYSEL&&TYSEL.c===c.id?'sel':''}" data-c="${c.id}"><line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/><line class="hitc" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/><text x="${(A.x+B.x)/2}" y="${(A.y+B.y)/2-6}">${frs(c.km)} km</text></g>`});
  Ty.lines.forEach(l=>{const A=TY_SITES[l.a],B=TY_SITES[l.b];const ld=hr?Math.abs(hr.I[l.id]||0)/lineImax(l):null;const out=hr&&hr.out.includes(l.id);
    s+=`<g class="ty-line ${TYSEL&&TYSEL.l===l.id?'sel':''} ${out?'out':''}" data-l="${l.id}"><line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" style="stroke:${out?'#ff5a4f':ld!=null&&ld>1?'#ff5a4f':ld!=null&&ld>.8?'#ffb347':vCol(l.U)};stroke-width:${3+Math.log2(l.S/16)*1.4}"/>${ld!=null&&ld>.01&&!out?`<line class="ty-flow" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" style="animation-duration:${(1.4/Math.max(.25,ld)).toFixed(2)}s;animation-direction:${(hr.I[l.id]||0)>=0?'normal':'reverse'}"/>`:''}<line class="hitc" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/>${ld!=null?`<text x="${(A.x+B.x)/2}" y="${(A.y+B.y)/2-8}" class="${ld>1?'bad':''}">${Math.round(ld*100)} %</text>`:''}</g>`});
  sites.forEach(([id,st])=>{const p=Ty.plants[id];const on=st.k==='d'?(hr?(hr.drop[id]!=null&&(hr.gen?1:1)):1):1;const sel=TYSEL&&TYSEL.s===id?' sel':'';
    if(st.k==='d'){const dr=hr?hr.drop[id]:null;const dark=hr&&!(id in hr.drop);const lit=dark?0:dr!=null?Math.max(.25,1-dr/15):.8;
      s+=`<g class="ty-site d${sel}" data-s="${id}" transform="translate(${st.x} ${st.y})"><g class="ty-in"><circle r="44" fill="url(#tyG)" opacity="${lit}"/>${[[-18,-6,14,22],[-2,-16,14,32],[14,-2,14,18]].map(([x,y,w,hh])=>`<rect x="${x}" y="${y}" width="${w}" height="${hh}" class="ty-bld"/><rect x="${x+4}" y="${y+5}" width="6" height="5" fill="rgba(255,215,120,${lit})"/>`).join('')}<text y="34">${esc(T(st.n))}</text>${hr&&dr!=null?`<text y="48" class="${dr>10?'bad':'sub'}">ΔU ${fr(dr,1)} %</text>`:''}${id==='hop'?'<path d="M-4-30h8v6h6v8h-6v6h-8v-6h-6v-8h6z" fill="#ff5a4f"/>':''}</g></g>`}
    else{const P=p?TY_PL[p.t]:null;const g=hr&&p?hr.gen[id]||0:null;
      s+=`<g class="ty-site p ${p?'built':''}${sel}" data-s="${id}" transform="translate(${st.x} ${st.y})"><g class="ty-in">${p?`<circle r="22" fill="${P.col}" class="ty-pl"/><text y="5" class="ty-ico">${tyIco(p.t)}</text>`:`<circle r="20" class="ty-empty"/><text y="6" class="ty-ico">+</text>`}<text y="38">${esc(T(st.n))}</text>${p?`<text y="52" class="sub">${g!=null?kWf(g)+' / ':''}${kWf(p.cap)}</text>`:''}</g></g>`}});
  const xs=sites.map(([,q])=>q.x),ys=sites.map(([,q])=>q.y);let x0=Math.min(...xs)-130,x1=Math.max(...xs)+130,y0=Math.min(...ys)-90,y1=Math.max(...ys)+110;
  let vw=Math.max(520,x1-x0),vh=Math.max(312,y1-y0);if(vw/vh>1000/600)vh=vw*.6;else vw=vh/.6;vw=Math.min(1000,vw);vh=Math.min(600,vh);
  const cx=(x0+x1)/2,cy=(y0+y1)/2;const vx=clamp(cx-vw/2,0,1000-vw),vy=clamp(cy-vh/2,0,600-vh);
  $('#tyMap').innerHTML=`<svg viewBox="${Math.round(vx)} ${Math.round(vy)} ${Math.round(vw)} ${Math.round(vh)}" class="ty-map" role="img" aria-label="${esc(T(tx('Carte du réseau','Mapa de la red')))}">${s}</svg>`;
  $$('#tyMap [data-s]').forEach(g=>g.onclick=()=>{TYSEL={s:g.dataset.s};AU.play('select');tyDrawMap(hr);tySide()});
  $$('#tyMap [data-c]').forEach(g=>g.onclick=()=>{TYSEL={c:g.dataset.c};TYBUILD=null;AU.play('select');tyDrawMap(hr);tySide()});
  $$('#tyMap [data-l]').forEach(g=>g.onclick=()=>{TYSEL={l:g.dataset.l};AU.play('select');tyDrawMap(hr);tySide()})
  $$('#tyMap [data-s],#tyMap [data-c],#tyMap [data-l]').forEach(g=>{g.setAttribute('tabindex','0');g.setAttribute('role','button');const t=g.dataset.s?T(TY_SITES[g.dataset.s].n):(g.dataset.c||g.dataset.l).split('-').map(id=>T(TY_SITES[id].n)).join(' ↔ ');g.setAttribute('aria-label',t);g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();g.onclick()}}})}
const tyIco=t=>({steam:'♨',coal:'⛏',hydro:'≈',dam:'▤',gas:'🔥',nuke:'⚛',wind:'✣',offshore:'✣',solar:'☀',battery:'▮',pumped:'⇅'})[t]||'?';
function tySide(){const Ty=S.tyc,e=Ty.era,el=$('#tySide');if(!el)return;const E=tyE();
  if(!TYSEL){const D=Object.entries(TY_SITES).filter(([,s])=>s.k==='d'&&s.era<=e).reduce((a,[id,s])=>a+s.size*(Ty.grow[id]||1)*E.K,0);const C=Object.values(Ty.plants).reduce((a,p)=>a+p.cap,0);
    el.innerHTML=`<p class="kicker">${esc(T(tx('Conseil','Consejo')))}</p><div class="ty-adv">${portrait(E.adv,'happy')}<p>${esc(T(tyTip()))}</p></div>
     <div class="ty-sum"><span><i>${esc(T(tx('Pointe de demande','Pico de demanda')))}</i><b>${kWf(D)}</b></span><span><i>${esc(T(tx('Capacité installée','Potencia instalada')))}</i><b class="${C<D*1.15?'bad':''}">${kWf(C)}</b></span><span><i>${esc(T(tx('Lignes','Líneas')))}</i><b>${Ty.lines.length}</b></span></div>
     <label class="insp-l" for="tyTar">${esc(T(tx('Tarif :','Tarifa:')))} <b id="tyTarV">${Math.round(Ty.tar*100)} %</b></label><input type="range" id="tyTar" min="80" max="130" step="5" value="${Math.round(Ty.tar*100)}"><p class="insp-sub">${esc(T(tx('Plus cher = plus de recettes, mais la réputation baisse.','Más caro = más ingresos, pero baja la reputación.')))}</p>
     <p class="insp-sub">${esc(T(tx('Touche une centrale, un quartier ou un tracé en pointillés.','Toca una central, un barrio o un trazado punteado.')))}</p>`;
    const tr=$('#tyTar');tr.oninput=()=>{Ty.tar=+tr.value/100;$('#tyTarV').textContent=tr.value+' %';save()};return}
  if(TYSEL.s){const id=TYSEL.s,st=TY_SITES[id];
    if(st.k==='d'){const pk_=st.size*(Ty.grow[id]||1)*E.K;const last=Ty.hist[Ty.hist.length-1];const con=Ty.lines.some(l=>l.a===id||l.b===id);
      el.innerHTML=`<p class="kicker">${esc(T(tx('Quartier','Barrio')))}</p><h3>${esc(T(st.n))}</h3><p>${esc(T({res:tx('Résidentiel : pointe le soir.','Residencial: pico por la tarde-noche.'),com:tx('Commerces et bureaux : la journée.','Comercios y oficinas: de día.'),ind:tx('Industrie : jour et nuit.','Industria: día y noche.'),crit:tx('Hôpital : ne doit JAMAIS être coupé.','Hospital: NUNCA debe quedarse sin luz.'),data:tx('Centre de données : demande constante.','Centro de datos: demanda constante.'),ev:tx('Voitures électriques : grosse pointe le soir.','Coches eléctricos: gran pico por la tarde.')}[st.type]))}</p>
       ${tyCurve(st.type)}<div class="ty-sum"><span><i>${esc(T(tx('Pointe','Pico')))}</i><b>${kWf(pk_)}</b></span><span><i>${esc(T(tx('Croissance','Crecimiento')))}</i><b>${Math.round(((Ty.grow[id]||1)-1)*100)} %</b></span>${last&&last.drop[id]!=null?`<span><i>ΔU max</i><b class="${last.drop[id]>10?'bad':''}">${fr(last.drop[id],1)} %</b></span>`:''}</div>${con?'':`<p class="bad">${esc(T(tx('Pas encore relié au réseau !','¡Todavía no está conectado a la red!')))}</p>`}${tyLinks(id)}`;tyLinksWire();return}
    const p=Ty.plants[id];
    if(!p){const opts=st.allow.filter(t=>TY_PL[t].era<=e&&(!TY_PL[t].need||Ty.res[TY_PL[t].need]));
      el.innerHTML=`<p class="kicker">${esc(T(tx('Emplacement','Emplazamiento')))}</p><h3>${esc(T(st.n))}</h3>${opts.length?opts.map(t=>{const P=TY_PL[t];return `<div class="ty-opt"><b style="color:${P.col}">${tyIco(t)} ${esc(T(P.n))}</b><span class="insp-sub">${esc(T(tx(`Combustible : ${fr(P.FF*E.tar,3)} €/kWh · CO₂ : ${frs(P.co2)} t/MWh`,`Combustible: ${fr(P.FF*E.tar,3)} €/kWh · CO₂: ${frs(P.co2)} t/MWh`)))}</span><div class="chips">${P.u.map(u=>{const cap=u*E.K,c=plantCost(t,cap);return `<button class="chip" data-t="${t}" data-cap="${cap}" ${c>Ty.money?'disabled':''}>${kWf(cap)} · ${eur(c)}</button>`}).join('')}</div></div>`}).join(''):`<p class="insp-sub">${esc(T(tx('Rien à construire ici à cette époque.','Nada que construir aquí en esta época.')))}</p>`}${tyLinks(id)}`;tyLinksWire();
      $$('#tySide .chip').forEach(b=>b.onclick=()=>{const cap=+b.dataset.cap,t=b.dataset.t,c=plantCost(t,cap);if(c>Ty.money){AU.play('bad');return}Ty.money-=c;Ty.plants[id]={t,cap,since:Ty.day};AU.play('build');save();openTycoon();TYSEL={s:id};tySide()});return}
    const P=TY_PL[p.t],up=P.u[0]*E.K,cu=plantCost(p.t,up);
    el.innerHTML=`<p class="kicker">${esc(T(tx('Centrale','Central')))}</p><h3 style="color:${P.col}">${tyIco(p.t)} ${esc(T(P.n))}</h3><div class="ty-sum"><span><i>${esc(T(tx('Puissance','Potencia')))}</i><b>${kWf(p.cap)}</b></span><span><i>CO₂</i><b>${frs(P.co2)} t/MWh</b></span><span><i>${esc(T(tx('Combustible','Combustible')))}</i><b>${fr(P.FF*E.tar,3)} €/kWh</b></span></div>
      <p class="insp-sub">${esc(T(P.store?tx('Stocke l\'énergie quand il y en a trop, la rend en pointe.','Guarda energía cuando sobra y la devuelve en el pico.'):P.min?tx('Ne peut pas descendre sous 70 % de sa puissance.','No puede bajar del 70 % de su potencia.'):p.t==='solar'?tx('Ne produit que le jour, beaucoup plus en été.','Solo produce de día, mucho más en verano.'):p.t==='wind'||p.t==='offshore'?tx('Dépend du vent : très variable.','Depende del viento: muy variable.'):p.t==='hydro'?tx('Suit le débit de la rivière selon les saisons.','Sigue el caudal del río según la estación.'):p.t==='dam'?tx("Réserve d'eau limitée chaque mois : gardée pour les pointes.","Reserva de agua limitada cada mes: se guarda para los picos."):tx('Pilotable : produit à la demande, mais brûle du combustible.','Gestionable: produce a demanda, pero quema combustible.')))}</p>
      <div class="end-actions"><button class="btn sm primary" id="tyUp" ${cu>Ty.money?'disabled':''}>+${kWf(up)} · ${eur(cu)}</button><button class="btn sm ghost danger" id="tyDel">${esc(T(tx('Démolir (rembourse 20 %)','Demoler (devuelve el 20 %)')))}</button></div>${tyLinks(id)}`;tyLinksWire();
    $('#tyUp').onclick=()=>{if(cu>Ty.money)return;Ty.money-=cu;p.cap+=up;AU.play('build');save();openTycoon();TYSEL={s:id};tySide()};
    $('#tyDel').onclick=()=>{Ty.money+=Math.round(plantCost(p.t,p.cap)*.2);delete Ty.plants[id];AU.play('click');save();TYSEL=null;openTycoon()};return}
  if(TYSEL.c){const c=TY_CORR.find(x=>x.id===TYSEL.c);const vs=tyVolts(e);const mats=['cu'].concat(Ty.res.alu?['al']:[]);
    TYBUILD=TYBUILD&&TYBUILD.id===c.id?TYBUILD:{id:c.id,a:c.a,b:c.b,km:c.km,U:vs[vs.length-1],S:E.sect[1],mat:'cu'};const L=TYBUILD;
    const dests=[c.a,c.b].filter(x=>TY_SITES[x].k==='d');const P=dests.length?Math.max(...dests.map(d=>TY_SITES[d].size*(Ty.grow[d]||1)*E.K)):E.K;
    const R=lineR(L),Im=lineImax(L),I=P*1000/L.U,Pj=R*I*I/1000,cost=lineCost(L);
    const chip=(k,vals,f)=>`<div class="chips">${vals.map(v=>`<button class="chip ${L[k]===v?'cur':''}" data-k="${k}" data-v="${v}">${esc(f(v))}</button>`).join('')}</div>`;
    el.innerHTML=`<p class="kicker">${esc(T(tx('Nouvelle ligne','Línea nueva')))}</p><h3>${esc(T(TY_SITES[c.a].n))} ↔ ${esc(T(TY_SITES[c.b].n))}</h3><p class="insp-sub">${frs(c.km)} km · ${esc(T(tx('aller-retour','ida y vuelta')))} ${frs(2*c.km)} km</p>
      <span class="insp-l">${esc(T(tx('Tension','Tensión')))}</span>${chip('U',vs,vName)}<span class="insp-l">${esc(T(tx('Section','Sección')))}</span>${chip('S',E.sect,v=>v+' mm²')}${mats.length>1?`<span class="insp-l">${esc(T(tx('Métal','Metal')))}</span>${chip('mat',mats,k=>T(METALS[k].n))}`:''}
      <div class="ty-sum"><span><i>R</i><b>${fr(R,R<1?3:1)} Ω</b></span><span><i>Imax</i><b>${frs(Math.round(Im))} A</b></span><span><i>${esc(T(tx('Pour','Para')))} ${kWf(P)}</i><b class="${I>Im?'bad':''}">I = ${fr(I,I<10?1:0)} A</b></span><span><i>${esc(T(tx('Pertes','Pérdidas')))}</i><b class="${Pj/P>.08?'bad':''}">${fr(Pj/P*100,1)} %</b></span><span><i>ΔU</i><b class="${R*I/L.U>.08?'bad':''}">${fr(R*I/L.U*100,1)} %</b></span></div>
      <button class="btn primary" id="tyBuildL" ${cost>Ty.money?'disabled':''}>${ICON('plug')} ${esc(T(tx('Construire','Construir')))} · ${eur(cost)}</button>`;
    $$('#tySide .chip').forEach(b=>b.onclick=()=>{const k=b.dataset.k;L[k]=k==='mat'?b.dataset.v:+b.dataset.v;AU.play('select');tySide()});
    $('#tyBuildL').onclick=()=>{if(cost>Ty.money)return;Ty.money-=cost;Ty.lines.push({id:c.id,a:c.a,b:c.b,km:c.km,U:L.U,S:L.S,mat:L.mat});AU.play('build');TYSEL={l:c.id};TYBUILD=null;save();openTycoon();TYSEL={l:c.id};tySide()};return}
  if(TYSEL.l){const l=Ty.lines.find(x=>x.id===TYSEL.l);if(!l){TYSEL=null;return tySide()}const last=Ty.hist[Ty.hist.length-1];const mx=last&&last.lineMax[l.id];
    el.innerHTML=`<p class="kicker">${esc(T(tx('Ligne','Línea')))}</p><h3>${esc(T(TY_SITES[l.a].n))} ↔ ${esc(T(TY_SITES[l.b].n))}</h3><div class="ty-sum"><span><i>${esc(T(tx('Tension','Tensión')))}</i><b>${vName(l.U)}</b></span><span><i>${esc(T(tx('Section','Sección')))}</i><b>${l.S} mm² ${esc(T(METALS[l.mat].n))}</b></span><span><i>R</i><b>${fr(lineR(l),3)} Ω</b></span><span><i>Imax</i><b>${Math.round(lineImax(l))} A</b></span>${mx!=null?`<span><i>${esc(T(tx('Charge max (dernier mois)','Carga máx. (último mes)')))}</i><b class="${mx>1?'bad':''}">${Math.round(mx*100)} %</b></span>`:''}</div>
      <p class="insp-sub">${esc(T(tx('Au-delà de 125 % de Imax, la ligne disjoncte.','Por encima del 125 % de Imax, la línea salta.')))}</p><button class="btn sm ghost danger" id="tyDelL">${esc(T(tx('Démonter','Desmontar')))}</button>`;
    $('#tyDelL').onclick=()=>{Ty.lines=Ty.lines.filter(x=>x!==l);AU.play('click');TYSEL={c:l.id};TYBUILD={id:l.id,a:l.a,b:l.b,km:l.km,U:l.U,S:l.S,mat:l.mat};save();openTycoon();TYSEL={c:l.id};tySide()}}}
function tyLinks(id){const Ty=S.tyc,built=new Set(Ty.lines.map(l=>l.id));const cs=TY_CORR.filter(c=>c.era<=Ty.era&&(c.a===id||c.b===id));if(!cs.length)return '';
  return `<span class="insp-l">${esc(T(tx('Lignes depuis ici','Líneas desde aquí')))}</span><div class="chips">${cs.map(c=>{const o=c.a===id?c.b:c.a;const b=built.has(c.id);return `<button class="chip ${b?'cur':''}" data-go="${c.id}" data-b="${b?1:0}">${b?'✓ ':'+ '}${esc(T(TY_SITES[o].n))} · ${frs(c.km)} km</button>`}).join('')}</div>`}
function tyLinksWire(){$$('#tySide [data-go]').forEach(b=>b.onclick=()=>{TYSEL=b.dataset.b==='1'?{l:b.dataset.go}:{c:b.dataset.go};TYBUILD=null;AU.play('select');tyDrawMap();tySide()})}
function tyCurve(type){const p=PROF[type];const W=260,H=70;return `<svg viewBox="0 0 ${W} ${H+14}" class="ty-curve" aria-hidden="true"><path d="M0 ${H} ${p.map((v,h)=>`L${h*W/23} ${H-v*H*.9}`).join(' ')} L${W} ${H}Z" class="ty-cf"/>${[0,6,12,18].map(h=>`<text x="${h*W/23}" y="${H+12}">${h} h</text>`).join('')}</svg>`}
function tyTip(){const Ty=S.tyc,e=Ty.era;const last=Ty.hist[Ty.hist.length-1];
  if(!Object.keys(Ty.plants).length)return tx('Commence par construire une centrale (touche un « + » sur la carte).','Empieza construyendo una central (toca un «+» en el mapa).');
  if(!Ty.lines.length)return tx('Relie ta centrale aux quartiers : touche un tracé en pointillés.','Une tu central a los barrios: toca un trazado punteado.');
  const E=tyE(),ds=Object.entries(TY_SITES).filter(([,q])=>q.k==='d'&&q.era<=e);const D=ds.reduce((a,[id,q])=>a+q.size*(Ty.grow[id]||1)*E.K,0),C=Object.values(Ty.plants).reduce((a,p)=>a+p.cap,0);
  if(ds.some(([id])=>!Ty.lines.some(l=>l.a===id||l.b===id)))return tx('Un quartier n\'est relié à rien : il restera dans le noir.','Hay un barrio sin conectar: se quedará a oscuras.');
  if(C<D*1.1)return tx('Ta puissance installée est trop juste pour la pointe de demande (et l\'hiver, on chauffe !). Construis ou agrandis une centrale.','Tu potencia instalada es justa para el pico de demanda (¡y en invierno se usa calefacción!). Construye o amplía una central.');
  if(last&&last.served<.98)return tx('Des quartiers ont été délestés : il manque de la puissance ou des lignes.','Hubo cortes en algunos barrios: falta potencia o faltan líneas.');
  if(last&&last.maxDrop>8)return tx('Chute de tension trop forte : monte la tension ou la section des lignes.','Caída de tensión demasiado grande: sube la tensión o la sección de las líneas.');
  if(last&&last.lossP>6)return tx('Trop de pertes en ligne : pense à P = R × I².','Demasiadas pérdidas en línea: piensa en P = R × I².');
  if(e>=5&&last&&last.co2i>.3)return tx('Le climat compte : remplace le charbon et le gaz par des renouvelables et du stockage.','El clima importa: cambia carbón y gas por renovables y almacenamiento.');
  return tx('Tout tourne ! Vise les étoiles des objectifs pour passer à l\'ère suivante.','¡Todo funciona! Ve a por las estrellas de los objetivos para pasar a la era siguiente.')}

/* ---------- simular: animación de 24 h + informe ---------- */
function tyRun(){const Ty=S.tyc;if(tySimLeft()<=0)return;if(!Object.keys(Ty.plants).length||!Ty.lines.length){AU.play('bad');toast(T(tx('Il faut au moins une centrale et une ligne.','Hace falta al menos una central y una línea.')));return}
  const R=tySim(Ty);Ty.sim.n++;
  let h=0;const sb=$('#tySim');if(sb)sb.disabled=true;AU.play('power');TYSEL=null;
  const side=$('#tySide');side.innerHTML=`<p class="kicker">${esc(T(tx('Simulation','Simulación')))} · ${esc(T(MONTHS[R.m]))}</p><div class="ty-clock" id="tyClk"></div><div id="tyChart"></div><button class="btn sm ghost" id="tySkip">${esc(ui('talk.skip'))}</button>`;
  let stop=false;$('#tySkip').onclick=()=>{stop=true};
  const tick=()=>{if(!$('#tyMap'))return;const hr=R.hours[h];tyDrawMap(hr);$('#tyClk').innerHTML=`<b>${String(h).padStart(2,'0')}:00</b> · ${esc(T(tx('demande','demanda')))} ${kWf(hr.D)} · ${esc(T(tx('pertes','pérdidas')))} ${kWf(hr.loss)}`;$('#tyChart').innerHTML=tyChart(R,h);
    if(hr.out.length&&!tick.al){tick.al=1;AU.play('alarm')}h++;if(h<24&&!stop&&!RM)setTimeout(tick,420);else tyEndMonth(R)};tick()}
function tyChart(R,upto){const W=300,H=120;const mx=Math.max(...R.hours.map(x=>Math.max(x.D,Object.values(x.gen).reduce((a,b)=>a+Math.max(0,b),0))))*1.1||1;const X=h=>h*W/23,Y=v=>H-v/mx*H;
  const types=Object.keys(TY_PL);let acc=R.hours.map(()=>0),areas='';
  types.forEach(t=>{const ps=R.hours.map((x,h)=>{let g=0;for(const [id,v] of Object.entries(x.gen)){const p=S.tyc.plants[id];if(p&&p.t===t)g+=Math.max(0,v)}return g});if(!ps.some(v=>v>0))return;
    const lo=acc.slice(),hi=acc.map((a,i)=>a+ps[i]);acc=hi;areas+=`<path d="M${hi.map((v,i)=>`${X(i)} ${Y(v)}`).join(' L')} L${lo.map((v,i)=>`${X(i)} ${Y(v)}`).reverse().join(' L')}Z" fill="${TY_PL[t].col}" opacity=".75"/>`});
  return `<svg viewBox="0 0 ${W} ${H+16}" class="ty-chart" role="img" aria-label="${esc(T(tx('Production et demande sur 24 h','Producción y demanda en 24 h')))}">${areas}<path d="M${R.hours.map((x,i)=>`${X(i)} ${Y(x.D)}`).join(' L')}" class="ty-dem"/>${upto!=null?`<line x1="${X(upto)}" x2="${X(upto)}" y1="0" y2="${H}" class="ty-now"/>`:''}${[0,6,12,18,23].map(h=>`<text x="${X(h)}" y="${H+13}">${h}h</text>`).join('')}</svg>`}
function tyEndMonth(R){const Ty=S.tyc;Ty.money+=Math.round(R.profit);Ty.profit+=R.profit;Ty.co2+=R.co2*30;Ty.rep=clamp(Ty.rep+R.rep,0,100);
  Object.entries(TY_SITES).forEach(([id,s])=>{if(s.k!=='d'||s.era>Ty.era)return;const g=Ty.rep>65?1.02:Ty.rep<40?.99:1.005;Ty.grow[id]=clamp((Ty.grow[id]||1)*g,.8,1.6)});
  const rec={day:Ty.day,m:R.m,ev:R.ev,served:R.served,dOn:R.dOn,maxDrop:R.maxDrop,lossP:R.lossP,hosp:R.hosp,co2i:R.co2i,ren:R.ren,profit:R.profit,rev:R.rev,fuel:R.fuelM,om:R.om,co2M:R.co2M,trips:R.trips,over:R.over,rep:R.rep,drop:R.drop,lineMax:R.lineMax,gen:R.gen,unserved:R.unserved,dem:R.dem};
  Ty.hist.push(rec);if(Ty.hist.length>36)Ty.hist=Ty.hist.slice(-36);Ty.day++;
  const got=[];(TY_OBJ[Ty.era]||[]).forEach(o=>{const st=Ty.stars[Ty.era]||(Ty.stars[Ty.era]={});if(!st[o.id]&&o.test(Ty.hist,Ty)){st[o.id]=Ty.day;got.push(o)}});
  trackSkill('reseau',R.served>=.98);S.xp+=10+got.length*40;save();tyReport(rec,false,got);setTimeout(checkAch,600)}
function tyReport(r,old,got){const Ty=S.tyc,side=$('#tySide');if(!side)return;got=got||[];
  side.innerHTML=`<p class="kicker">${esc(T(tx('Rapport du mois','Informe del mes')))} · ${esc(T(MONTHS[r.m]))}</p>${r.ev?`<p class="ty-ev">${ICON('bolt')} <b>${esc(T(EV_N[r.ev]))}</b> — ${esc(T(EV_D[r.ev]))}</p>`:''}
   <div class="ty-sum"><span><i>${esc(T(tx('Énergie servie','Energía servida')))}</i><b class="${r.served<.98?'bad':''}">${fr(r.served*100,1)} %</b></span><span><i>${esc(T(tx('Pertes en ligne','Pérdidas en línea')))}</i><b class="${r.lossP>6?'bad':''}">${fr(r.lossP,1)} %</b></span><span><i>ΔU max</i><b class="${r.maxDrop>10?'bad':''}">${fr(r.maxDrop,1)} %</b></span><span><i>CO₂</i><b>${fr(r.co2i,2)} t/MWh</b></span>
    <span><i>${esc(T(tx('Recettes','Ingresos')))}</i><b>${eur(r.rev)}</b></span><span><i>${esc(T(tx('Combustible','Combustible')))}</i><b>−${eur(r.fuel)}</b></span><span><i>${esc(T(tx('Entretien','Mantenimiento')))}</i><b>−${eur(r.om)}</b></span>${r.co2M?`<span><i>${esc(T(tx('Taxe carbone','Impuesto CO₂')))}</i><b>−${eur(r.co2M)}</b></span>`:''}<span><i>${esc(T(tx('Bénéfice','Beneficio')))}</i><b class="${r.profit<0?'bad':'ok-t'}">${eur(r.profit)}</b></span><span><i>${esc(T(tx('Réputation','Reputación')))}</i><b>${r.rep>=0?'+':''}${r.rep}</b></span></div>
   ${r.trips?`<p class="bad">${esc(T(tx(`${r.trips} ligne(s) ont disjoncté.`,`${r.trips} línea(s) han saltado.`)))}</p>`:''}${r.hosp?`<p class="bad">${esc(T(tx("L'hôpital a été privé de courant !","¡El hospital se ha quedado sin corriente!")))}</p>`:''}
   ${got.map(o=>`<p class="ty-star">★ ${esc(T(o.t))}</p>`).join('')}
   ${Ty.res.scada&&!old?`<p class="insp-sub">${ICON('eye')} ${esc(T(tx('Prévision du mois prochain :','Previsión del mes que viene:')))} ${(w=>w.ev?esc(T(EV_N[w.ev])):esc(T(tx('rien de spécial','nada especial'))))(tyWeather(Ty,Ty.day))}</p>`:''}
   <div class="end-actions"><button class="btn primary" id="tyOk">${esc(ui('btn.continue'))}</button></div>`;
  if(got.length){AU.play('levelup');FX.confetti(120)}else AU.play(r.profit>=0?'coin':'bad');
  $('#tyOk').onclick=()=>{const Ty2=S.tyc;const nx=Ty2.era+1;if(TY_OBJ[Ty2.era]&&Ty2.stars[Ty2.era]&&Ty2.stars[Ty2.era].a&&nx<=5&&!Ty2.eraDone?.[Ty2.era]){Ty2.eraDone=Ty2.eraDone||{};Ty2.eraDone[Ty2.era]=1;save();tyEraUnlockMsg(nx)}else openTycoon()}}
function tyEraUnlockMsg(nx){const ok=tyUnlockedEra(nx);const side=$('#tySide');
  side.innerHTML=`<p class="kicker">${esc(T(tx('Ère terminée','Era terminada')))}</p><h3>★ ${esc(T(TY_ERAS[nx-1].n))}</h3><p>${esc(T(ok?tx(`L'ère ${nx} — ${T(TY_ERAS[nx].n)} — est ouverte. Tu peux y passer quand tu veux (ou rester pour gagner les autres étoiles).`,`La era ${nx} — ${T(TY_ERAS[nx].n)} — está abierta. Puedes pasar cuando quieras (o quedarte para ganar las otras estrellas).`):tx(`Pour ouvrir l'ère ${nx}, termine le chapitre « ${T(CHAPTERS.find(c=>c.id===TY_ERAS[nx].need).place)} ».`,`Para abrir la era ${nx}, termina el capítulo «${T(CHAPTERS.find(c=>c.id===TY_ERAS[nx].need).place)}».`)))}</p>
   <div class="end-actions">${ok?`<button class="btn primary" id="tyNext">${ICON('rocket')} ${esc(T(tx('Ère suivante','Era siguiente')))} (${TY_ERAS[nx].y})</button>`:''}<button class="btn ghost" id="tyStay">${esc(T(tx('Rester','Quedarme')))}</button></div>`;
  const b=$('#tyNext');if(b)b.onclick=()=>{tyStartEra(nx);openTycoon()};$('#tyStay').onclick=()=>openTycoon()}
function tyObjectives(){const Ty=S.tyc,side=$('#tySide');const nx=Ty.era+1;const st=Ty.stars[Ty.era]||{};
  side.innerHTML=`<p class="kicker">${esc(T(tx('Objectifs de l\'ère','Objetivos de la era')))} ${Ty.era}</p>${TY_OBJ[Ty.era].map((o,i)=>`<div class="ty-objr ${st[o.id]?'ok':''}"><span>${st[o.id]?'★':'☆'}</span><p>${esc(T(o.t))}${i===0?` <small>${esc(T(tx('(obligatoire pour l\'ère suivante)','(obligatorio para la era siguiente)')))}</small>`:''}</p></div>`).join('')}
   ${nx<=5&&st.a?`<div class="end-actions">${tyUnlockedEra(nx)?`<button class="btn primary" id="tyNext">${ICON('rocket')} ${esc(T(TY_ERAS[nx].n))} (${TY_ERAS[nx].y})</button>`:`<p class="insp-sub">${esc(T(tx('Ère suivante : termine d\'abord le chapitre ','Era siguiente: termina antes el capítulo ')))}${esc(T(CHAPTERS.find(c=>c.id===TY_ERAS[nx].need).place))}.</p>`}</div>`:''}
   <h4>${esc(T(tx('Ères','Eras')))}</h4><div class="ty-eras">${[1,2,3,4,5].map(e=>`<span class="${e===Ty.era?'cur':''} ${tyUnlockedEra(e)?'':'locked'}">${TY_ERAS[e].y}<small>${'★'.repeat(Object.keys(Ty.stars[e]||{}).length)}</small></span>`).join('')}</div>`;
  const b=$('#tyNext');if(b)b.onclick=()=>{tyStartEra(nx);openTycoon()}}
/* investigación: cuesta dinero y un problema de ingeniería bien resuelto */
function tyResearch(){const Ty=S.tyc,side=$('#tySide'),E=tyE();const list=Object.entries(TY_RES).filter(([,r])=>r.era<=Ty.era);
  const cost=r=>Math.round(r.k*tyStartMoney(Ty.era));
  side.innerHTML=`<p class="kicker">${esc(T(tx('Bureau d\'études','Oficina técnica')))}</p><p class="insp-sub">${esc(T(tx('Chaque recherche demande de l\'argent… et un calcul juste. Une seule tentative par jour.','Cada investigación pide dinero… y un cálculo correcto. Un solo intento al día.')))}</p>
   ${list.map(([id,r])=>{const done=Ty.res[id],c=cost(r),tried=Ty.rtry[id]===dayStr();return `<div class="ty-opt ${done?'ok':''}"><b>${done?'✓ ':''}${esc(T(r.n))}</b><span class="insp-sub">${esc(T(r.d))}</span>${done?'':`<button class="btn sm ${tried?'ghost':'primary'}" data-r="${id}" ${tried||c>Ty.money?'disabled':''}>${tried?esc(T(tx('Demain','Mañana'))):eur(c)}</button>`}</div>`}).join('')}`;
  $$('#tySide [data-r]').forEach(b=>b.onclick=()=>{const id=b.dataset.r,r=TY_RES[id];const q=GENS[r.gk](Math.random,2);Ty.rtry[id]=dayStr();save();
    side.innerHTML=`<p class="kicker">${esc(T(r.n))}</p><div id="tyQ"></div>`;const go=ok=>{const f=$('#qFoot');if(ok){Ty.money-=cost(r);Ty.res[id]=Ty.day;S.xp+=25;AU.play('levelup');FX.confetti(80)}save();
      const bb=document.createElement('button');bb.className='btn primary';bb.textContent=T(ok?tx('Recherche terminée !','¡Investigación terminada!'):tx('Réessaie demain','Inténtalo mañana'))+' ›';f.append(bb);bb.onclick=()=>{KEYS.next=null;openTycoon()};KEYS.next=()=>bb.click()};
    if(q.type==='num')numInto($('#tyQ'),Object.assign({oneShot:true},q),go);else qcmInto($('#tyQ'),q,go)})}
function tyStartMoney(e){const E=TY_ERAS[e];const peak=Object.entries(TY_SITES).filter(([,s])=>s.k==='d'&&s.era<=e).reduce((a,[,s])=>a+s.size,0)*E.K;return peak*468*E.tar*3}
/* presentación de cada era por su consejero */
const TY_INTRO={
  1:[{w:'edison',m:'happy',t:tx("New York, 1882 ! Ma centrale de Pearl Street éclaire déjà un quartier. À toi : vapeur, dynamo, courant continu en 110 volts. Mais attention : à 110 V, l'intensité est énorme. Des lignes courtes et des câbles épais !","¡Nueva York, 1882! Mi central de Pearl Street ya ilumina un barrio. Te toca: vapor, dinamo y corriente continua a 110 voltios. Pero ojo: a 110 V la intensidad es enorme. ¡Líneas cortas y cables gruesos!")},{w:'lumi',m:'neutral',t:tx("Chaque simulation représente un mois. Construis une centrale, relie la vieille ville et la gare, et surveille la chute de tension.","Cada simulación representa un mes. Construye una central, une el casco antiguo y la estación, y vigila la caída de tensión.")}],
  2:[{w:'westinghouse',m:'happy',t:tx("L'alternatif est arrivé ! Avec les transformateurs, tu peux aller chercher l'énergie loin : la rivière, la mine de charbon. La ville a grandi : il faut maintenant des mégawatts.","¡Ha llegado la alterna! Con transformadores puedes ir a buscar la energía lejos: el río, la mina de carbón. La ciudad ha crecido: ahora hacen falta megavatios.")}],
  3:[{w:'ayrton',m:'happy',t:tx("Je suis Hertha Ayrton, ingénieure. En 1930, le réseau devient régional : un barrage, des lignes à 63 kV, un hôpital qui ne doit jamais manquer de courant. Et les tempêtes n'attendent personne.","Soy Hertha Ayrton, ingeniera. En 1930 la red se vuelve regional: una presa, líneas de 63 kV y un hospital que nunca debe quedarse sin corriente. Y las tormentas no esperan a nadie.")}],
  4:[{w:'tesla',m:'happy',t:tx("1975 : la demande explose. Nucléaire sur la côte, turbines à gaz pour les pointes, et des lignes à 400 000 volts pour tout relier.","1975: la demanda se dispara. Nuclear en la costa, turbinas de gas para los picos y líneas de 400 000 voltios para conectarlo todo.")}],
  5:[{w:'lumi',m:'happy',t:tx("Retour en 2026 ! Le climat impose de réduire le CO₂ : éolien, solaire, batteries, pompage… et des compteurs intelligents. Garde la lumière allumée même quand il n'y a ni vent ni soleil.","¡De vuelta en 2026! El clima obliga a reducir el CO₂: eólica, solar, baterías, bombeo… y contadores inteligentes. Mantén la luz encendida aunque no haya ni viento ni sol.")}]};
function tyEraIntro(e){const L1=TY_INTRO[e];  return talk(L1,{scene:e===1?'pearl':e===2?'niagara':'control'})}

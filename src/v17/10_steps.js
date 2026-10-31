/* =====================================================================
   v1.7 · Tipos de paso nuevos
   reduce    → simplificar una red de resistencias paso a paso (série / dérivation)
   transport → llevar la energía de una central a una ciudad: tensión, sección, metal
   diag      → encontrar el componente averiado midiendo con voltímetro y amperímetro
   ===================================================================== */

/* ---------- Réduire un réseau ---------- */
const reqOf=n=>n.k==='r'?n.R:n.k==='s'?n.ch.reduce((a,c)=>a+reqOf(c),0):1/n.ch.reduce((a,c)=>a+1/reqOf(c),0);
function netNode(e,ctr){if(typeof e==='number')return {k:'r',R:e,lab:'R'+(++ctr.n)};if(e.r!=null)return {k:'r',R:e.r,lab:e.lab||'R'+(++ctr.n)};
  const k=e.s?'s':'p';return {k,ch:(e.s||e.p).map(x=>netNode(x,ctr))}}
const REQ_TOL=a=>Math.max(.06,a*.015);
STEP2.reduce=function(st,stage){const root={k:'s',ch:[netNode(st.net,{n:0})]};let sel=null,phase='pick',fi=0,errs=0,id=0;
  const tag=n=>{n.id=++id;(n.ch||[]).forEach(tag)};tag(root);
  const leafy=n=>n.k!=='r'&&n.ch.every(c=>c.k==='r')&&n.ch.length>1;
  stage.className='stage wide';
  stage.innerHTML=`<div class="lab-step"><div class="ls-main"><div class="rd-board" id="rdB"></div></div><aside class="ls-side panel"><div class="ls-title"><p class="kicker">${esc(T(tx('Réduction de réseau','Reducción de redes')))}</p><h2>${esc(T(st.title))}</h2>${altC(st.title)}</div>
    <p class="ls-sub" id="rdMsg"></p><div id="rdAsk"></div><ol class="goals" id="rdFinal"></ol><div class="ls-foot" id="lsFoot"><button class="btn sm ghost" id="lsHint">${ICON('bulb')} ${esc(ui('btn.hint'))}</button></div><p class="ls-hint" id="lsHintT" hidden></p></aside></div>`;
  function lay(n){if(n.k==='r'){n.w=104;n.h=64;return}n.ch.forEach(lay);
    if(n.k==='s'){n.w=n.ch.reduce((a,c)=>a+c.w,0)+(n.ch.length-1)*10;n.h=Math.max(...n.ch.map(c=>c.h))}
    else{n.w=Math.max(...n.ch.map(c=>c.w))+52;n.h=n.ch.reduce((a,c)=>a+c.h,0)+(n.ch.length-1)*8}}
  function draw(n,x,y){let s='';const my=y+n.h/2;
    if(n.k==='r'){const cx=x+n.w/2;s+=`<line class="w" x1="${x}" y1="${my}" x2="${cx-26}" y2="${my}"/><line class="w" x1="${cx+26}" y1="${my}" x2="${x+n.w}" y2="${my}"/><rect class="rd-r ${n.merged?'merged':''}" x="${cx-26}" y="${my-11}" width="52" height="22" rx="3"/><text class="lab-l" x="${cx}" y="${my-18}" text-anchor="middle">${esc(n.lab)}<tspan class="lab-s"> ${esc(fmtR(Math.round(n.R*100)/100))}</tspan></text>`;return s}
    if(n.k==='s'){let cx=x;n.ch.forEach((c,i)=>{s+=draw(c,cx,my-c.h/2);cx+=c.w;if(i<n.ch.length-1){s+=`<line class="w" x1="${cx}" y1="${my}" x2="${cx+10}" y2="${my}"/>`;cx+=10}})}
    else{let cy=y;const mids=[];n.ch.forEach(c=>{const ox=x+26+(n.w-52-c.w)/2;s+=draw(c,ox,cy);const m=cy+c.h/2;mids.push(m);
        s+=`<line class="w" x1="${x+14}" y1="${m}" x2="${ox}" y2="${m}"/><line class="w" x1="${ox+c.w}" y1="${m}" x2="${x+n.w-14}" y2="${m}"/>`;cy+=c.h+8});
      s+=`<line class="w" x1="${x+14}" y1="${mids[0]}" x2="${x+14}" y2="${mids[mids.length-1]}"/><line class="w" x1="${x+n.w-14}" y1="${mids[0]}" x2="${x+n.w-14}" y2="${mids[mids.length-1]}"/><line class="w" x1="${x}" y1="${my}" x2="${x+14}" y2="${my}"/><line class="w" x1="${x+n.w-14}" y1="${my}" x2="${x+n.w}" y2="${my}"/>`+
        `<circle class="pin" cx="${x+14}" cy="${mids[0]}" r="4"/><circle class="pin" cx="${x+14}" cy="${mids[mids.length-1]}" r="4"/><circle class="pin" cx="${x+n.w-14}" cy="${mids[0]}" r="4"/><circle class="pin" cx="${x+n.w-14}" cy="${mids[mids.length-1]}" r="4"/>`}
    if(leafy(n)&&phase==='pick')s=`<rect class="rd-grp ${sel===n?'on':''}" data-g="${n.id}" x="${x-4}" y="${y-30}" width="${n.w+8}" height="${n.h+34}" rx="10"/>`+s;
    return s}
  function find(n,i){if(n.id===i)return n;for(const c of n.ch||[]){const f=find(c,i);if(f)return f}return null}
  function render(){const top=root.ch[0];lay(top);const W=Math.max(420,top.w+120),H=Math.max(200,top.h+110);const x0=(W-top.w)/2,y0=(H-top.h)/2+10;
    let s=`<rect class="bench" x="0" y="0" width="${W}" height="${H}" rx="10"/>`+draw(top,x0,y0)+
      `<circle class="rd-term" cx="${x0-24}" cy="${y0+top.h/2}" r="9"/><circle class="rd-term" cx="${x0+top.w+24}" cy="${y0+top.h/2}" r="9"/><line class="w" x1="${x0-15}" y1="${y0+top.h/2}" x2="${x0}" y2="${y0+top.h/2}"/><line class="w" x1="${x0+top.w}" y1="${y0+top.h/2}" x2="${x0+top.w+15}" y2="${y0+top.h/2}"/>`+
      `<text class="lab-l" x="${x0-24}" y="${y0+top.h/2+32}" text-anchor="middle">A</text><text class="lab-l" x="${x0+top.w+24}" y="${y0+top.h/2+32}" text-anchor="middle">B</text>`+(st.U?`<text class="lab-s" x="${W/2}" y="${H-12}" text-anchor="middle">U(AB) = ${frs(st.U)} V</text>`:'');
    $('#rdB').innerHTML=`<svg viewBox="0 0 ${W} ${H}" class="rd-svg" role="img" aria-label="${esc(T(tx('Réseau de résistances','Red de resistencias')))}">${s}</svg>`;
    $$('.rd-grp',stage).forEach(g=>g.addEventListener('click',()=>{if(phase!=='pick')return;sel=find(root,+g.dataset.g);AU.play('select');render();ask()}));
    $('#rdMsg').innerHTML=hl(T(phase==='pick'?tx('Touche un groupe encadré : des résistances toutes en série, ou toutes en dérivation.','Toca un grupo enmarcado: resistencias todas en serie, o todas en paralelo.'):phase==='final'?tx('Le réseau entier vaut une seule résistance équivalente. Termine les calculs.','Toda la red equivale a una sola resistencia. Termina los cálculos.'):''))}
  function ask(){const n=sel;const box=$('#rdAsk');const kinds=[['s',tx('en série','en serie')],['p',tx('en dérivation','en paralelo')]];
    box.innerHTML=`<div class="rd-ask"><p><b>${n.ch.map(c=>esc(c.lab)).join(' · ')}</b> ${esc(T(tx('sont…','están…')))}</p><div class="chips" id="rdK">${kinds.map(([k,t])=>`<button class="chip" data-k="${k}">${esc(T(t))}</button>`).join('')}</div><div id="rdV"></div><span class="gmsg" id="rdE"></span></div>`;
    $$('#rdK .chip').forEach(b=>b.onclick=()=>{if(b.dataset.k!==n.k){errs++;RUN.err+=.5;trackSkill(st.skill,false);AU.play('bad');shakeEl(b);$('#rdE').textContent=T(n.k==='s'?tx('Non : elles se suivent sur un seul chemin.','No: van una detrás de otra en un solo camino.'):tx('Non : le courant a plusieurs chemins entre les mêmes nœuds.','No: la corriente tiene varios caminos entre los mismos nudos.'));return}
      AU.play('select');$$('#rdK .chip').forEach(c=>{c.disabled=true;c.classList.toggle('right',c===b)});$('#rdE').textContent='';
      const f=n.k==='s'?'Req = '+n.ch.map(c=>c.lab).join(' + '):(n.ch.length===2?'Req = (R × R′) ÷ (R + R′)':'1/Req = '+n.ch.map(c=>'1/'+c.lab).join(' + '));
      $('#rdV').innerHTML=`<p class="rd-f">${esc(f)}</p><div class="num-row"><input id="rdIn" inputmode="decimal" autocomplete="off" placeholder="?" aria-label="${esc(ui('aria.answer'))}"><span>Ω</span><button class="btn sm primary" id="rdOk">OK</button></div>`;
      const inp=$('#rdIn');inp.focus({preventScroll:true});const chk=()=>{const v=num(inp.value);if(v==null)return;const a=reqOf(n);
        if(Math.abs(v-a)<=REQ_TOL(a)){AU.play('ok');trackSkill(st.skill,true);gain(8,inp);merge(n,a)}else{errs++;RUN.err+=.5;trackSkill(st.skill,false);AU.play('bad');shakeEl(inp);$('#rdE').textContent=T(n.k==='p'?tx('Attention : en dérivation, Req est plus petite que la plus petite résistance.','Ojo: en paralelo, Req es menor que la resistencia más pequeña.'):tx('En série, les résistances s\'additionnent.','En serie, las resistencias se suman.'))}};
      $('#rdOk').onclick=chk;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();chk()}}})}
  function merge(n,a){const lab=n.ch.length<=3?'R'+n.ch.map(c=>c.lab.replace(/^R/,'')).join(''):'Req';
    n.k='r';n.R=a;n.lab=lab.length>6?'Req':lab;n.merged=1;delete n.ch;sel=null;$('#rdAsk').innerHTML='';FX.burstEl($('#rdB'),{n:20,speed:4,colors:[FX.C.ok,FX.C.volt]});
    if(root.ch[0].k==='r'){phase='final';render();final()}else render()}
  function final(){const Req=root.ch[0].R;const F=st.final||[];
    const drawF=()=>{$('#rdFinal').innerHTML=F.map((g,k)=>`<li class="${k<fi?'ok':k===fi?'cur':''}"><i>${k<fi?'✓':k+1}</i><div><b>${hl(T(g.t))}</b>${altC(g.t,'es g-alt')}${k===fi?`<div class="num-row"><input id="gIn" inputmode="decimal" autocomplete="off" placeholder="?" aria-label="${esc(ui('aria.answer'))}"><span>${esc(g.unit)}</span><button class="btn sm primary" id="gOk">OK</button></div><span class="gmsg" id="gMsg"></span>`:''}</div></li>`).join('');
      const inp=$('#gIn');if(!inp)return done();inp.focus({preventScroll:true});const chk=()=>{const v=num(inp.value);if(v==null)return;const g=F[fi],a=g.ans(Req);
        if(Math.abs(v-a)<=(g.tol!=null?g.tol:Math.max(.005,Math.abs(a)*.02))){AU.play('ok');trackSkill(st.skill,true);gain(8,inp);fi++;drawF()}else{RUN.err+=.5;trackSkill(st.skill,false);AU.play('bad');shakeEl(inp);$('#gMsg').textContent=T(g.err||tx('Pas encore. Vérifie la formule et les unités.','Todavía no. Revisa la fórmula y las unidades.'))}};
      $('#gOk').onclick=chk;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();chk()}}};drawF()}
  function done(){const ft=$('#lsFoot');ft.innerHTML=`<p class="ls-done">${ICON('check')} ${esc(ui('lab.done'))}</p>`;gain(15,ft);S.stats.labs++;save();nextBtn(ft)}
  let hi=0;$('#lsHint').onclick=()=>{const h=st.hints||[tx('Cherche d\'abord les résistances en dérivation tout au fond du réseau, puis remonte.','Busca primero las resistencias en paralelo más «escondidas» y luego ve subiendo.'),tx('Deux résistances en dérivation : Req = (R1 × R2) ÷ (R1 + R2). Deux résistances égales en dérivation : Req = R ÷ 2.','Dos resistencias en paralelo: Req = (R1 × R2) ÷ (R1 + R2). Dos iguales en paralelo: Req = R ÷ 2.')];
    const t=h[Math.min(hi,h.length-1)];hi++;RUN.hints++;const el=$('#lsHintT');el.hidden=false;el.innerHTML=`<b>Lumi ›</b> ${hl(T(t))}`;AU.play('select');VO.say(T(t),true)};
  if(RUN)RUN.reduce={root,reqOf,find,sel:n=>{sel=n;ask()}};render()};

/* ---------- Transporter l'énergie ---------- */
const METALS={cu:{n:tx('Cuivre','Cobre'),rho:.017,d:8960,price:9},al:{n:tx('Aluminium','Aluminio'),rho:.028,d:2700,price:2.5},fe:{n:tx('Fer','Hierro'),rho:.13,d:7870,price:.8}};
function lineCalc(o){const m=METALS[o.mat];const Rl=m.rho*(2*o.L*1000)/o.S;const I=o.P/o.U;const Pj=Rl*I*I;const dU=Rl*I;const mass=2*o.L*1000*o.S*1e-6*m.d;
  return {R:Rl,I,Pj,dU,dUp:dU/o.U*100,eta:o.P/(o.P+Pj)*100,mass,cost:mass*m.price/1000,Pin:o.P+Pj}}
STEP2.transport=function(st,stage){const s={U:st.volts[0],S:st.sections[0],mat:(st.mats||['cu'])[0],P:st.P,L:st.L};let gi=0,fin=false,hi=0;
  stage.className='stage wide';const hide=st.hide||[];
  stage.innerHTML=`<div class="lab-step"><div class="ls-main"><div class="tp-board panel" id="tpB"></div><div class="tp-ctl panel" id="tpC"></div></div><aside class="ls-side panel"><div class="ls-title"><p class="kicker">${esc(T(tx('Ligne de transport','Línea de transporte')))}</p><h2>${esc(T(st.title))}</h2>${altC(st.title)}</div>
    <ol class="goals" id="goals"></ol><div class="ls-foot" id="lsFoot"><button class="btn sm ghost" id="lsHint">${ICON('bulb')} ${esc(ui('btn.hint'))}</button></div><p class="ls-hint" id="lsHintT" hidden></p></aside></div>`;
  const kW=v=>v>=1e6?fr(v/1e6,2)+' MW':v>=1e3?fr(v/1e3,v>=1e4?0:1)+' kW':fr(v,0)+' W';const kV=v=>v>=1000?frs(v/1000)+' kV':frs(v)+' V';
  const hidden=id=>!fin&&hide.some(h=>Array.isArray(h)?h[0]===id&&gi<=h[1]:h===id);
  function board(){const c=lineCalc(s);const heat=Math.min(1,c.Pj/s.P);const lit=Math.max(.15,1-Math.min(1,c.dUp/20));
    const rows=[['I',fmtA(c.I).replace(' A','')+' A','I'],['R',fr(c.R,2)+' Ω','R'],['Pj',kW(c.Pj),'Pj'],['ΔU',c.dUp>=100?'> 100 % !':fr(c.dU,1)+' V ('+fr(c.dUp,1)+' %)','dU'],['η',fr(c.eta,1)+' %','eta'],[T(tx('Métal','Metal')),fr(c.mass/1000,1)+' t · '+fr(c.cost,0)+' k€','cost']];
    $('#tpB').innerHTML=`<svg viewBox="0 0 800 230" class="tp-svg" role="img" aria-label="${esc(T(tx('Centrale, ligne et ville','Central, línea y ciudad')))}">
      <rect class="bench" x="0" y="0" width="800" height="230" rx="10"/><g transform="translate(70 130)"><rect x="-44" y="-50" width="88" height="70" fill="#3a3430" stroke="#8a7a6a" stroke-width="3"/><rect x="18" y="-82" width="16" height="36" fill="#5a5048"/><circle cx="0" cy="-12" r="16" fill="none" stroke="#ffd27a" stroke-width="4"/><text class="lab-l" y="44" text-anchor="middle">${esc(kW(s.P+c.Pj))}</text></g>
      <path d="M118 104 C300 ${140+heat*40} 500 ${140+heat*40} 690 104" stroke="rgb(${150+heat*105|0},${120-heat*60|0},${70-heat*40|0})" stroke-width="${3+s.S/60}" fill="none" class="tp-line"/><path d="M118 104 C300 ${140+heat*40} 500 ${140+heat*40} 690 104" stroke="#ffd27a" stroke-width="2" fill="none" class="flow" style="animation-duration:${(1.2/Math.max(.2,lit)).toFixed(2)}s"/>
      ${heat>.08?`<circle cx="400" cy="${146+heat*30}" r="${30+heat*40}" fill="url(#hGlowT)" opacity="${Math.min(1,heat*2)}"/>`:''}<defs><radialGradient id="hGlowT"><stop offset="0" stop-color="#ff6a3d" stop-opacity=".7"/><stop offset="1" stop-color="#ff6a3d" stop-opacity="0"/></radialGradient></defs>
      <text class="lab-s" x="400" y="40" text-anchor="middle">${esc(T(tx('Ligne','Línea')))} 2 × ${frs(s.L)} km · ${esc(T(METALS[s.mat].n))} ${frs(s.S)} mm² · ${esc(kV(s.U))}</text>
      <g transform="translate(730 130)">${[[-40,-10],[-12,-30],[16,-6],[40,-24]].map(([x,y])=>`<rect x="${x-12}" y="${y}" width="24" height="${50-y}" fill="#2a3448"/><rect x="${x-6}" y="${y+8}" width="12" height="10" fill="rgba(255,215,120,${lit})"/>`).join('')}<text class="lab-l" y="70" text-anchor="middle">${esc(kW(s.P))}</text></g></svg>
      ${c.dUp>=50?`<p class="tp-warn">${esc(T(tx('Chute de tension énorme : au bout de la ligne, il ne reste presque rien pour la ville !','Caída de tensión enorme: al final de la línea, ¡casi no le llega nada a la ciudad!')))}</p>`:''}<div class="tp-read">${rows.map(([k,v,id])=>`<span><i>${esc(k)}</i><b>${hidden(id)?'?':esc(v)}</b></span>`).join('')}</div>`}
  function ctl(){const chip=(k,vals,f)=>`<div class="chips">${vals.map(v=>`<button class="chip ${s[k]===v?'cur':''}" data-k="${k}" data-v="${v}">${esc(f(v))}</button>`).join('')}</div>`;
    $('#tpC').innerHTML=`<span class="insp-l">${esc(T(tx('Tension de la ligne','Tensión de la línea')))}</span>${chip('U',st.volts,kV)}<span class="insp-l">${esc(T(tx('Section du câble','Sección del cable')))}</span>${chip('S',st.sections,v=>frs(v)+' mm²')}${(st.mats||[]).length>1?`<span class="insp-l">${esc(T(tx('Métal','Metal')))}</span>${chip('mat',st.mats,k=>T(METALS[k].n))}`:''}`;
    $$('#tpC .chip').forEach(b=>b.onclick=()=>{const k=b.dataset.k;s[k]=k==='mat'?b.dataset.v:+b.dataset.v;AU.play('select');ctl();board();setTimeout(evalG,0)})}
  function goals(){$('#goals').innerHTML=st.goals.map((g,k)=>`<li class="${k<gi?'ok':k===gi?'cur':''}"><i>${k<gi?'✓':k+1}</i><div><b>${hl(T(g.t))}</b>${altC(g.t,'es g-alt')}${g.es?`<span class="g-help">${hl(T(g.es))}</span>`:''}${k===gi&&g.input&&!fin?`<div class="num-row"><input id="gIn" inputmode="decimal" autocomplete="off" placeholder="?" aria-label="${esc(ui('aria.answer'))}"><span>${esc(g.input.unit)}</span><button class="btn sm primary" id="gOk">OK</button></div><span class="gmsg" id="gMsg"></span>`:''}</div></li>`).join('');
    const inp=$('#gIn');if(inp){const chk=()=>{const v=num(inp.value);if(v==null){$('#gMsg').textContent=ui('msg.number');return}const g=st.goals[gi],a=g.input.ans(lineCalc(s),s);
      if(Math.abs(v-a)<=(g.input.tol!=null?g.input.tol:Math.abs(a)*.02)){AU.play('ok');trackSkill(st.skill,true);gain(8,inp);adv()}else{RUN.err+=.5;trackSkill(st.skill,false);AU.play('bad');shakeEl(inp);$('#gMsg').textContent=T(g.err||tx('Pas encore : vérifie les unités (km → m, kV → V).','Todavía no: revisa las unidades (km → m, kV → V).'))}};
      $('#gOk').onclick=chk;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();chk()}}}}
  function adv(){gi++;board();if(gi>=st.goals.length){fin=true;goals();board();const ft=$('#lsFoot');ft.innerHTML=`<p class="ls-done">${ICON('check')} ${esc(ui('lab.done'))}</p>`;gain(15,ft);S.stats.labs++;save();nextBtn(ft);return}goals();evalG()}
  let pend=false;function evalG(){if(fin||pend)return;const g=st.goals[gi];if(!g||g.input)return;let ok=false;try{ok=g.check(lineCalc(s),s)}catch(e){}if(ok){pend=true;AU.play('ok');gain(6,$$('#goals li')[gi]);setTimeout(()=>{pend=false;adv()},250)}}
  $('#lsHint').onclick=()=>{const h=st.hints||[];if(!h.length)return;const t=h[Math.min(hi,h.length-1)];hi++;RUN.hints++;const el=$('#lsHintT');el.hidden=false;el.innerHTML=`<b>Lumi ›</b> ${hl(T(t))}`;AU.play('select');VO.say(T(t),true)};
  if(RUN)RUN.tp={s,set:(k,v)=>{s[k]=v;ctl();board();evalG()},calc:()=>lineCalc(s)};ctl();board();goals();evalG()};

/* ---------- Diagnostic : trouver la panne en mesurant ---------- */
STEP2.diag=function(st,stage){let tries=0,solved=false,hi=0,meas=0;
  stage.className='stage wide';
  stage.innerHTML=`<div class="lab-step"><div class="ls-main" id="lsMain"></div><aside class="ls-side panel"><div class="ls-title"><p class="kicker">${esc(T(tx('Diagnostic','Diagnóstico')))}</p><h2>${esc(T(st.title))}</h2>${altC(st.title)}</div>
    <p class="ls-sub">${hl(T(st.brief))}</p>${altC(st.brief,'es g-alt')}<div class="insp" id="insp"></div>
    <div class="dg-acc"><p class="kicker">${esc(T(tx('Composant suspect','Componente sospechoso')))}</p><div class="chips" id="dgS">${st.suspects.map(l=>`<button class="chip" data-l="${l}">${esc(l)}</button>`).join('')}</div>
    <div class="chips" id="dgF">${[['open',tx('coupé (circuit ouvert)','cortado (circuito abierto)')],['short',tx('en court-circuit','en cortocircuito')]].map(([k,t])=>`<button class="chip" data-f="${k}">${esc(T(t))}</button>`).join('')}</div>
    <button class="btn primary sm" id="dgGo" disabled>${esc(T(tx('Accuser','Acusar')))}</button><span class="gmsg" id="dgMsg"></span></div>
    <div class="ls-foot" id="lsFoot"><button class="btn sm ghost" id="lsHint">${ICON('bulb')} ${esc(ui('btn.hint'))}</button><button class="btn sm ghost" id="lsReset">${esc(ui('btn.restart'))}</button></div><p class="ls-hint" id="lsHintT" hidden></p></aside></div>`;
  let pickL=null,pickF=st.faultKind?null:'open';if(!st.faultKind)$('#dgF').hidden=true;
  const ready=()=>{$('#dgGo').disabled=!(pickL&&pickF)};
  $$('#dgS .chip').forEach(b=>b.onclick=()=>{pickL=b.dataset.l;$$('#dgS .chip').forEach(c=>c.classList.toggle('cur',c===b));AU.play('select');lab.select(pickL);ready()});
  $$('#dgF .chip').forEach(b=>b.onclick=()=>{pickF=b.dataset.f;$$('#dgF .chip').forEach(c=>c.classList.toggle('cur',c===b));AU.play('select');ready()});
  $('#dgGo').onclick=()=>{if(solved)return;const ok=pickL===st.culprit&&(!st.faultKind||pickF===st.faultKind);tries++;
    if(ok){solved=true;trackSkill('diagnostic',true);AU.play('levelup');gain(meas>=2?20:12,$('#dgGo'));const c=lab.B.comps.find(x=>x.lab===st.culprit);if(c)c.fault=null;lab.run();
      $('#dgMsg').innerHTML='';const ft=$('#lsFoot');ft.innerHTML=`<p class="ls-done">${ICON('check')} ${esc(T(tx('Panne trouvée et réparée !','¡Avería encontrada y reparada!')))}</p>${fbHTML(true,'',T(st.ex),false,st.ex)}`;S.stats.labs++;save();nextBtn(ft);$$('#dgS .chip,#dgF .chip,#dgGo').forEach(b=>b.disabled=true)}
    else{RUN.err++;trackSkill('diagnostic',false);AU.play('bad');shakeEl($('#dgGo'));$('#dgMsg').textContent=T(tries>=2?tx('Indice : compare chaque mesure avec ce que tu attends si tout était normal.','Pista: compara cada medida con lo que esperarías si todo estuviera bien.'):tx('Ce n\'est pas ça. Mesure encore !','No es eso. ¡Sigue midiendo!'))}};
  const lab=createLab($('#lsMain'),{comps:st.board.comps,cols:st.board.cols||7,rows:st.board.rows||4,palette:st.palette||{volt:2,amp:1},tool:st.tool||'volt',inspector:$('#insp'),showAll:false,
    onChange:Q=>{meas=Q.of('volt').length+Q.of('amp').length}});
  if(RUN)RUN.lab=lab;
  $('#lsHint').onclick=()=>{const h=st.hints||[];if(!h.length)return;const t=h[Math.min(hi,h.length-1)];hi++;RUN.hints++;const el=$('#lsHintT');el.hidden=false;el.innerHTML=`<b>Lumi ›</b> ${hl(T(t))}`;AU.play('select');VO.say(T(t),true)};
  $('#lsReset').onclick=()=>{lab.setComps(st.board.comps);AU.play('click')}};

// Verifica cada desafío con una solución de referencia (debe aprobar y caber en el máximo de piezas)
// y con montajes erróneos típicos (deben suspender).
const {chromium}=require('playwright');const path=require('path');
const W=e=>({t:'wire',e}),SW=e=>({t:'sw',e,on:true}),RES=(e,R)=>({t:'res',e,R,Pmax:5}),FU=(e,Ir)=>({t:'fuse',e,Ir});
const LOOP=['h:1,0','h:2,0','h:3,0','h:4,0','v:5,0','v:5,1','v:5,2','h:4,3','h:3,3','h:2,3','h:1,3','v:1,0','v:1,1','v:1,2'];
const CASES={
 p1:{ok:[['h:1,1','h:2,1','h:3,1','h:4,1','h:1,2','h:2,2','h:3,2','h:4,2'].map(W)],bad:[['h:1,1','h:2,1','h:3,1','h:4,1'].map(W)]},
 p2:{ok:[[...['v:1,0','h:1,0','h:3,0','v:5,0','v:5,1','v:5,2','h:4,3','h:3,3','h:2,3','v:1,2'].map(W),SW('h:1,3')]],
     bad:[['v:1,0','h:1,0','h:3,0','v:5,0','v:5,1','v:5,2','h:4,3','h:3,3','h:2,3','h:1,3','v:1,2'].map(W)]},
 p3:{ok:[['h:1,1','h:2,1','h:3,1','h:4,1','h:1,2','h:2,2','h:3,2','h:4,2'].map(W)],bad:[[...['v:1,0','h:1,0','h:2,0','v:3,0','v:3,2','h:3,3','h:2,3','h:1,3','v:1,2'].map(W)]]},
 p4:{ok:[[...['v:1,0','h:1,0','h:2,0','h:3,0','h:4,0','h:1,2','h:2,2','h:3,2','h:4,2'].map(W),SW('v:3,0'),SW('v:5,0')]],
     bad:[[...['h:2,1','h:3,1','h:4,1','h:1,2','h:2,2','h:3,2','h:4,2'].map(W),SW('h:1,1'),SW('h:3,2')]]},
 p5:{ok:[[RES('h:2,3',10)]],bad:[[RES('h:2,3',47)],[W('h:2,3')]]},
 p6:{ok:[[FU('h:2,3',.5)]],bad:[[FU('h:2,3',2)],[FU('h:2,3',.2)],[W('h:2,3')]]},
 p7:{ok:[[RES('h:2,3',47),RES('h:3,3',47)]],bad:[[RES('h:2,3',47),W('h:3,3')],[RES('h:2,3',220),RES('h:3,3',470)]]},
 p8:{ok:[['v:1,0','h:1,0','h:3,0','v:5,0','v:5,1','v:5,2','h:4,3','h:3,3','h:2,3','h:1,3','v:1,2','v:3,1','h:2,1','h:1,1','v:4,2'].map(W)],
     bad:[[...['v:1,0','h:1,0','h:3,0','v:5,0','v:5,1','v:5,2','h:4,3','h:3,3','h:2,3','h:1,3','v:1,2'].map(W)]]}};
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+path.join(__dirname,'..','dist','test.html'));await p.waitForTimeout(300);
 const res=await p.evaluate(CASES=>{const C=window.__CO;const out=[];
  for(const P of C.PUZZLES){const cs=CASES[P.id];if(!cs){out.push(P.id+' SIN CASOS');continue}
   const run=extra=>{let id=0;const comps=P.board().map(c=>Object.assign({dir:1},JSON.parse(JSON.stringify(c)),{id:++id}));
     // las piezas de la solución sustituyen a los cables marcados en el mismo hueco
     extra.forEach(x=>{const k=comps.findIndex(c=>c.e===x.e&&!c.lock);if(k>=0)comps.splice(k,1);comps.push(Object.assign({dir:1,lab:x.t==='res'?'R'+id:x.t==='sw'?'K'+id:x.t==='fuse'?'F'+id:''},x,{id:++id}))});
     const B={comps};const R=C.simulate(B);const Q=C.makeQ(B,R);let ok=false;try{ok=P.check(Q,B)}catch(e){ok='ERR '+e.message}
     return {ok,pieces:comps.filter(c=>!c.lock).length,burn:R.events.length+(R.shorts.length?1:0)}};
   cs.ok.forEach((s,k)=>{const r=run(s);out.push(`${P.id} solución ${k+1}: ${r.ok===true?'APRUEBA':'FALLA '+r.ok} · piezas ${r.pieces}/${P.max} ${r.pieces<=P.max?'✓':'✗'} · quemados ${r.burn}`)});
   cs.bad.forEach((s,k)=>{const r=run(s);out.push(`${P.id} error ${k+1}: ${r.ok===false?'suspende (bien)':'¡APRUEBA MAL! '+r.ok} · quemados ${r.burn}`)})}
  return out},CASES);
 res.forEach(x=>console.log(x));console.log('errores JS:',errs.length,errs.slice(0,3));await b.close()})();

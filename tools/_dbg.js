const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:820}});p.on('pageerror',e=>console.log('ERR',e.message));
await p.addInitScript(()=>localStorage.setItem('chrono-ohm-v1',JSON.stringify({name:'Nil',introSeen:true,settings:{lang:'es',narr:false,music:false,sfx:false}})));
await p.goto('file:///home/claude/ohm/dist/test.html');await p.waitForTimeout(300);
// negativo: contacto NC en la autorretención no debe dejar el motor en marcha
console.log(await p.evaluate(()=>{const C=window.__CO;const ch=C.CHAPTERS[4];const st=ch.missions[2].steps.find(s=>s.type==='lab');const B={comps:st.board.comps.map((c,i)=>Object.assign({dir:1},JSON.parse(JSON.stringify(c)),{id:i+1}))};
 B.comps.push({t:'knc',e:'v:3,1',lab:'KA1',rel:'KA1',dir:1,id:99});const R=C.simulate(B);const Q=C.makeQ(B,R);return {run:Q.I('M1'),ev:R.events.map(e=>e.k)}}));
const go=async(mi,n)=>{await p.evaluate(mi=>{const C=window.__CO;const ch=C.CHAPTERS[4];const si=ch.missions[mi].steps.findIndex(s=>s.type==='lab');C.setRun({ch,mi,m:ch.missions[mi],i:si,err:0,hints:0,xp:0,cr:0,streak:0,r0:0});C.next()},mi);await p.waitForTimeout(400)};
await go(2);
// pulsar S1 con el ratón de verdad
const box=await p.$('#labSvg');const bb=await box.boundingBox();const W=2*56+6*92,H=2*56+4*92;const pt=(x,y)=>[bb.x+(56+x*92)/W*bb.width,bb.y+(56+y*92)/H*bb.height];
const [x,y]=pt(2,1.5);await p.mouse.move(x,y);await p.mouse.down();await p.waitForTimeout(300);await p.screenshot({path:'shots-ux/c5-press.png'});
console.log('pulsado', await p.evaluate(()=>window.__CO.RUN.lab.Q.I('M1')));await p.mouse.up();await p.waitForTimeout(300);
console.log('soltado', await p.evaluate(()=>window.__CO.RUN.lab.Q.I('M1')));
await go(3);await p.screenshot({path:'shots-ux/c5-pilotos.png'});
await p.evaluate(()=>{const C=window.__CO;const ch=C.CHAPTERS[4];C.setRun({ch,mi:0,m:ch.missions[0],i:1,err:0,hints:0,xp:0,cr:0,streak:0,r0:0});C.next()});await p.waitForTimeout(900);
for(let k=0;k<3;k++){await p.click('#tkBox',{position:{x:30,y:30}});await p.waitForTimeout(60);await p.click('#tkBox',{position:{x:30,y:30}});await p.waitForTimeout(80)}await p.waitForTimeout(500);await p.screenshot({path:'shots-ux/c5-escena.png'});
await p.evaluate(()=>{const C=window.__CO;const ch=C.CHAPTERS[4];const m=ch.missions[5];C.setRun({ch,mi:5,m,i:m.steps.length,err:0,hints:0,xp:40,cr:0,streak:0,r0:0});C.next()});await p.waitForTimeout(500);await p.screenshot({path:'shots-ux/c5-fin.png',fullPage:true});
await b.close()})();

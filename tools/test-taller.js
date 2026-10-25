// Prueba de las pantallas de la v1.3 en los dos idiomas: Taller (compra, cálculo de potencia, fusible general),
// desafíos (resolver de verdad dentro de la pantalla) y anomalías (5 preguntas y premio).
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const SH=path.join(__dirname,'..','shots-taller');fs.mkdirSync(SH,{recursive:true});
(async()=>{const b=await chromium.launch();
for(const [lang,w,h] of [['fr',390,844],['es',1280,800],['es',390,844]]){
 const ctx=await b.newContext({viewport:{width:w,height:h}});
 await ctx.addInitScript(l=>localStorage.setItem('chrono-ohm-v1',JSON.stringify({name:'Inès',introSeen:true,cr:120,ch:{c1:{done:6,stars:{},complete:true},c2:{done:2,stars:{},complete:false}},settings:{lang:l,narr:false,music:false,sfx:false}})),lang);
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const tag=lang+'-'+w;
 await p.goto('file://'+path.join(__dirname,'..','dist','test.html'));await p.waitForTimeout(300);
 await p.click('#btnStart');await p.waitForTimeout(400);await p.screenshot({path:`${SH}/${tag}-menu.png`,fullPage:true});
 // Taller
 await p.click('#goShop');await p.waitForTimeout(200);
 await p.click('[data-buy="lamp"]');await p.click('[data-buy="fan"]');await p.click('[data-sw="lamp"]');await p.fill('#pIn-lamp','6');await p.click('#pOk-lamp');await p.waitForTimeout(150);
 await p.click('[data-sw="fan"]');await p.fill('#pIn-fan','10');await p.click('#pOk-fan');await p.waitForTimeout(2500);
 const s1=await p.evaluate(()=>({on:Object.keys(window.__CO.S.shop.on),cr:window.__CO.S.cr,alert:(document.querySelector('#shopAlert:not([hidden])')||{}).innerText||''}));
 console.log(tag,'taller tras 6 W + 12 W con 20 W de límite:',JSON.stringify(s1));
 await p.click('#genUp');await p.waitForTimeout(150);await p.click('[data-sw="lamp"]');await p.click('[data-sw="fan"]');await p.waitForTimeout(150);
 const s2=await p.evaluate(()=>({on:Object.keys(window.__CO.S.shop.on),gen:window.__CO.S.shop.gen,load:document.querySelector('.meter-l span').innerText}));
 console.log(tag,'con generador de 50 W:',JSON.stringify(s2));
 await p.click('[data-skin="or"]');await p.waitForTimeout(150);await p.screenshot({path:`${SH}/${tag}-taller.png`,fullPage:true});
 // Desafíos: resolver el 1 dentro de la pantalla
 await p.evaluate(()=>window.__CO.openPuzzles());await p.waitForTimeout(150);await p.screenshot({path:`${SH}/${tag}-desafios.png`,fullPage:true});
 await p.click('.pz-card[data-i="0"]');await p.waitForTimeout(200);await p.screenshot({path:`${SH}/${tag}-desafio1.png`});
 await p.evaluate(()=>{const lab=window.__CO.LASTLAB;const add=['h:1,1','h:2,1','h:3,1','h:4,1','h:1,2','h:2,2','h:3,2','h:4,2'].map(e=>({t:'wire',e}));lab.setComps(lab.B.comps.map(c=>({...c})).concat(add))});
 await p.waitForTimeout(500);const pz=await p.evaluate(()=>({stars:window.__CO.S.pz,end:!!document.querySelector('.pz-end'),cr:window.__CO.S.cr}));console.log(tag,'desafío 1 resuelto:',JSON.stringify(pz));
 await p.screenshot({path:`${SH}/${tag}-desafio1-fin.png`});
 // Anomalías
 await p.evaluate(()=>window.__CO.renderHub());await p.click('#goRev');await p.waitForTimeout(1200);await p.screenshot({path:`${SH}/${tag}-anomalia.png`});
 for(let k=0;k<5;k++){if(await p.$('#nIn')){await p.fill('#nIn','1');await p.click('#nOk')}else{await p.waitForTimeout(900);await p.click('.opt[data-k="0"]')}await p.waitForTimeout(120);await p.click('#qFoot .btn');await p.waitForTimeout(1100)}
 const rv=await p.evaluate(()=>({rev:window.__CO.S.rev,end:!!document.querySelector('#revBack')}));console.log(tag,'anomalía:',JSON.stringify(rv));
 await p.screenshot({path:`${SH}/${tag}-anomalia-fin.png`});
 const miss=await p.evaluate(()=>[...window.__CO.MISS]);console.log(tag,'sin traducir:',miss.length,miss.slice(0,5),'errores:',errs);
 const ov=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 await ctx.close()}
await b.close()})();

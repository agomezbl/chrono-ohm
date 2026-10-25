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
 await p.click('[data-buy="lamp"]');await p.click('[data-buy="fan"]');await p.click('[data-sw="lamp"]');await p.fill('#pIn-lamp','12');await p.click('#pOk-lamp');await p.waitForTimeout(150);
 await p.click('[data-sw="fan"]');await p.fill('#pIn-fan','10');await p.click('#pOk-fan');await p.waitForTimeout(2500);
 const s1=await p.evaluate(()=>({on:Object.keys(window.__CO.S.shop.on),cr:window.__CO.S.cr,alert:(document.querySelector('#shopAlert:not([hidden])')||{}).innerText||''}));
 console.log(tag,'taller tras 12 W + 24 W con 20 W de límite (debe saltar):',JSON.stringify(s1));
 await p.click('#genUp');await p.waitForTimeout(150);await p.click('[data-sw="lamp"]');await p.click('[data-sw="fan"]');await p.waitForTimeout(150);
 const s2=await p.evaluate(()=>({on:Object.keys(window.__CO.S.shop.on),gen:window.__CO.S.shop.gen,load:document.querySelector('.meter-l span').innerText}));
 console.log(tag,'con generador de 50 W:',JSON.stringify(s2));
 // v1.4: cuadro eléctrico de 500 W
 await p.evaluate(()=>{const S=window.__CO.S;S.cr=3000;S.shop.gen=6;['heater','compressor','printer3d','robot'].forEach(k=>{S.shop.own[k]=1;S.shop.quiz[k]=1;S.shop.ln[k]='A'});S.shop.on={};window.__CO.openShop()});await p.waitForTimeout(150);
 await p.click('[data-sw="heater"]');await p.waitForTimeout(100);
 const a1=await p.evaluate(()=>Object.keys(window.__CO.S.shop.on));
 await p.click('[data-sw="robot"]');await p.waitForTimeout(100);
 const a2=await p.evaluate(()=>({on:Object.keys(window.__CO.S.shop.on),alert:document.querySelector('#shopAlert').innerText.slice(0,60)}));
 await p.click('[data-fu="A"][data-v="32"]');await p.waitForTimeout(100);await p.click('[data-sw="heater"]');await p.waitForTimeout(100);await p.click('[data-sw="robot"]');await p.waitForTimeout(100);await p.click('[data-sw="printer3d"]');await p.waitForTimeout(100);
 const a3=await p.evaluate(()=>({on:Object.keys(window.__CO.S.shop.on),alert:document.querySelector('#shopAlert').innerText.slice(0,60),hot:window.__CO.S.stats.cableHot}));
 await p.click('[data-fu="A"][data-v="16"]');await p.click('[data-ln="printer3d"][data-v="B"]');await p.waitForTimeout(100);
 await p.click('[data-sw="heater"]');await p.click('[data-sw="robot"]');await p.click('[data-sw="printer3d"]');await p.waitForTimeout(100);
 const a4=await p.evaluate(()=>({on:Object.keys(window.__CO.S.shop.on),load:document.querySelector('.meter-l span').innerText}));
 await p.evaluate(()=>{const S=window.__CO.S;S.shop.t=Date.now()-3*3.6e6;window.__CO.openShop()});await p.waitForTimeout(100);
 const pend=await p.evaluate(()=>JSON.stringify(window.__CO.S.shop.pend));const cr0=await p.evaluate(()=>window.__CO.S.cr);
 await p.screenshot({path:`${SH}/${tag}-taller500.png`,fullPage:true});
 await p.click('#harvest');await p.waitForTimeout(150);const cr1=await p.evaluate(()=>window.__CO.S.shop.earned);
 console.log(tag,'500W: heater solo',JSON.stringify(a1),'| +robot en A (fusible 10 A)',JSON.stringify(a2),'| fusible 32 A en cable 16 A con 19 A',JSON.stringify(a3),'| repartido A/B',JSON.stringify(a4),'| 3 h',pend,'recoge',cr1);
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

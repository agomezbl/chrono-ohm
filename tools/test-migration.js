// Comprueba que una partida de la versión 1 (la de Nil) (v1.1) se conserva al pasar a la v1.2 o posterior.
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext();
 await ctx.addInitScript(()=>{localStorage.setItem('chrono-ohm-v1',JSON.stringify({name:'Nil',xp:640,cr:37,introSeen:true,ch:{c1:{done:6,stars:{'1-1':3},complete:true}},notes:{n_circuit:1},settings:{diff:'cadet',narr:true,music:false,sfx:true,es:true},stats:{answered:20,correct:17,labs:5},v:1}))});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+path.join(__dirname,'..','dist','test.html'));await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const S=window.__CO.S;return {lang:S.settings.lang,alt:S.settings.alt,es:S.settings.es,name:S.name,xp:S.xp,c1:S.ch.c1&&S.ch.c1.complete,html:document.documentElement.lang}});
 await p.click('#btnStart');await p.waitForTimeout(300);
 const hub=await p.evaluate(()=>document.querySelector('.pilot-l').innerText);
 console.log(JSON.stringify(r),'| cabecera:',hub.replace(/\n/g,' / '),'| errores:',errs.length);
 const ok=r.lang==='fr'&&r.alt===true&&r.es===undefined&&r.name==='Nil'&&r.xp===640&&r.c1&&/Nil/.test(hub)&&/Analyste/.test(hub)&&/Analista/.test(hub)&&!errs.length;
 console.log(ok?'MIGRACIÓN OK':'MIGRACIÓN FALLA');await b.close()})();

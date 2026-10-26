// Comprueba en un servidor web que las voces grabadas se cargan y suenan (y que sin ellas se usa la voz del aparato).
// Uso: node tools/test-voces.js   (sirve dist/ con un servidor local; dist/audio enlaza a audio/)
const {chromium}=require('playwright');const path=require('path');const http=require('http'),fs=require('fs');
const ROOT=path.join(__dirname,'..','dist');
const srv=http.createServer((q,r)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return}r.writeHead(200,{'Content-Type':f.endsWith('.mp3')?'audio/mpeg':f.endsWith('.json')?'application/json':'text/html'});r.end(d)})}).listen(8765);
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const out=[];
 for(const l of ['fr','es']){const p=await b.newPage();const reqs=[];p.on('request',q=>{if(q.url().endsWith('.mp3'))reqs.push(q.url())});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(l=>localStorage.setItem('chrono-ohm-v1',JSON.stringify({name:'Nil',introSeen:true,settings:{lang:l,narr:true,music:false,sfx:false}})),l);
  await p.goto('http://localhost:8765/test.html');await p.waitForTimeout(800);
  const r=await p.evaluate(async()=>{const C=window.__CO;const lines=C.voiceLines();const n=lines.length;const man=C.VO.man?C.VO.man[document.documentElement.lang].size:0;
    const x=lines.find(x=>x.who==='baron')||lines[0];const t0=performance.now();await Promise.race([C.VO.say(x.text,true,x.who),new Promise(r=>setTimeout(r,15000))]);
    const missing=lines.filter(y=>!C.VO.man[document.documentElement.lang].has(y.key)).length;return {n,man,missing,ms:Math.round(performance.now()-t0),who:x.who}});
  out.push({l,...r,mp3:reqs.length,errs});await p.close()}
 console.log(JSON.stringify(out,null,1));srv.close();await b.close()})();

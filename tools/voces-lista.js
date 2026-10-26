// Saca del juego todas las frases que se pueden oír (por idioma y personaje) → voz/lineas.json
// Uso: node tools/voces-lista.js   (después: python3 tools/voces.py)
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+path.join(__dirname,'..','dist','test.html'));await p.waitForTimeout(300);
 const out={};for(const l of ['fr','es']){out[l]=await p.evaluate(l=>{window.__CO.setLang(l);return window.__CO.voiceLines()},l)}
 fs.mkdirSync(path.join(__dirname,'..','voz'),{recursive:true});fs.writeFileSync(path.join(__dirname,'..','voz','lineas.json'),JSON.stringify(out,null,0));
 for(const l in out){const w={};out[l].forEach(x=>w[x.who]=(w[x.who]||0)+1);console.log(l,out[l].length,'frases',JSON.stringify(w),'caracteres',out[l].reduce((a,x)=>a+x.say.length,0))}
 console.log('errores',errs);await b.close()})();

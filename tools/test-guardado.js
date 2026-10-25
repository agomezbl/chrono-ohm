// Guardado: el nombre se conserva al recargar (aunque no se termine la introducción),
// y una partida pasa de un aparato a otro con el código de copia (copiar → borrar → restaurar).
const {chromium}=require('playwright');const path=require('path');const FILE='file://'+path.join(__dirname,'..','dist','test.html');
(async()=>{const b=await chromium.launch();let fail=0;const ok=(c,m)=>{console.log((c?'OK   ':'FALLA')+' '+m);if(!c)fail++};
 const ctx=await b.newContext({acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(FILE);await p.waitForTimeout(300);
 await p.fill('#nameIn','Inès');await p.click('#btnStart');await p.waitForTimeout(300);
 await p.reload();await p.waitForTimeout(300);
 ok(await p.isVisible('#whoLine')&&(await p.textContent('#whoLine')).includes('Inès'),'tras recargar a mitad de la introducción, saluda con el nombre guardado');
 await p.evaluate(()=>{const C=window.__CO;C.S.xp=640;C.S.cr=37;C.S.pz={p1:3};C.S.ch.c1={done:3,stars:{'1-1':3},complete:false}});
 await p.evaluate(()=>window.__CO.openSettings());await p.waitForTimeout(100);
 ok(/✓/.test(await p.textContent('#saveInfo')),'Ajustes muestra «progreso guardado» con la hora: '+(await p.textContent('#saveInfo')));
 await p.click('#bkCopy');await p.waitForTimeout(300);const code=await p.inputValue('#bkCode');
 ok(/^CHRONO1[ZP]-[0-9a-z]{3}-/.test(code),'código de copia generado ('+code.length+' caracteres, '+code.slice(0,9)+'…)');
 const [dl]=await Promise.all([p.waitForEvent('download',{timeout:3000}).catch(()=>null),p.click('#bkFile')]);
 ok(!!dl&&/chrono-ohm-.*\.txt$/.test(dl.suggestedFilename()),'descarga del archivo: '+(dl&&dl.suggestedFilename()));
 // otro aparato: navegador limpio
 const ctx2=await b.newContext();const q=await ctx2.newPage();q.on('pageerror',e=>errs.push(e.message));await q.goto(FILE);await q.waitForTimeout(300);
 await q.evaluate(()=>window.__CO.openSettings());await q.click('#bkRestore');await q.fill('#bkIn',code.slice(0,-4)+'AAAA');await q.click('#bkRestore');
 ok((await q.textContent('#bkMsg')).length>10&&!(await q.evaluate(()=>window.__CO.S.name)),'un código estropeado se rechaza: '+(await q.textContent('#bkMsg')));
 await q.fill('#bkIn',code);await q.click('#bkRestore');await q.waitForTimeout(200);ok(/Inès/.test(await q.textContent('#bkMsg')),'pide confirmación mostrando de quién es la partida');
 await q.click('#bkRestore');await q.waitForTimeout(300);
 const r=await q.evaluate(()=>{const S=window.__CO.S;return {n:S.name,xp:S.xp,cr:S.cr,pz:S.pz.p1,c1:S.ch.c1&&S.ch.c1.done,stored:JSON.parse(localStorage.getItem('chrono-ohm-v1')).xp}});
 ok(r.n==='Inès'&&r.xp===640&&r.cr===37&&r.pz===3&&r.c1===3&&r.stored===640,'partida restaurada y guardada en el aparato nuevo: '+JSON.stringify(r));
 // archivo descargado → abrir archivo en un tercer aparato
 if(dl){const fp=await dl.path();const ctx3=await b.newContext();const w=await ctx3.newPage();await w.goto(FILE);await w.waitForTimeout(300);await w.evaluate(()=>window.__CO.openSettings());
  await w.setInputFiles('#bkLoad',fp);await w.waitForTimeout(300);await w.click('#bkRestore');await w.waitForTimeout(300);ok(await w.evaluate(()=>window.__CO.S.xp)===640,'restaurar desde el archivo descargado')}
 // modo sin almacenamiento
 const ctx4=await b.newContext();await ctx4.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked')}})});
 const z=await ctx4.newPage();z.on('pageerror',e=>errs.push('sin-almacén: '+e.message));await z.goto(FILE);await z.waitForTimeout(300);
 ok(await z.isVisible('#storeWarn'),'sin almacenamiento (modo privado) avisa en la portada');
 ok(errs.length===0,'sin errores de JavaScript '+JSON.stringify(errs));
 console.log(fail?`${fail} fallos`:'TODO OK');await b.close()})();

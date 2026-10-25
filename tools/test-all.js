// Prueba completa en Chromium: recorre todas las pantallas y todos los pasos de todas las misiones
// en francés y en español, con y sin ayuda en el otro idioma. Busca errores de JavaScript,
// textos sin traducir, palabras del otro idioma y desbordes de pantalla. Saca capturas.
// Uso: node tools/test-all.js
const {chromium} = require('playwright');
const path = require('path'), fs = require('fs');
const FILE = 'file://' + path.join(__dirname, '..', 'dist', 'test.html');
const SHOTS = path.join(__dirname, '..', 'shots'); fs.mkdirSync(SHOTS, {recursive: true});

// palabras que delatan el otro idioma en el texto visible (fuera de nombres propios y frases de época)
const LEAK = {
  fr: /[¿¡ñ]|(?<!\p{L})(el|los|las|una|con|para|está|pero|muy|hay|corriente|lámpara|amperímetro|pulsa|toca|cable)(?!\p{L})/iu,
  es: /[èêàçœ]|(?<!\p{L})(est|et|du|des|une|avec|pour|dans|sur|pas|qui|courant|lampe|ampèremètre|appuie|touche|fil)(?!\p{L})/iu,
};
const OK = {
  fr: ['Guten Abend', 'Wunderbar', 'Danke, meine Freunde', 'Herr Ohm', 'Die galvanische Kette', 'Español', 'ESPAÑOL', 'Ja', 'Inès'],
  es: ['Mon Dieu', 'Magnifique', 'Oh là là', 'Vite', 'Académie des sciences', 'Académie', 'monsieur', 'Monsieur', 'Adieu, mes amis', 'en dérivation',
       'Ampère', 'André-Marie', 'Die galvanische Kette', 'Court-Circuit', 'Chronotron', 'Français', 'CHRONO', 'Royal Society', 'François Arago', 'FRANÇAIS', 'Inès'],
};
function leaks(text, lang) {
  let s = text; OK[lang].forEach(o => { s = s.split(o).join(' '); });
  const out = []; s.split(/\n+/).forEach(line => { const m = line.match(LEAK[lang]); if (m) out.push(`«${m[0]}» → ${line.trim().slice(0, 140)}`); });
  return out;
}

(async () => {
  const browser = await chromium.launch();
  const report = {errors: [], miss: {}, leaks: {}, overflow: [], steps: 0};
  for (const lang of ['fr', 'es']) {
    for (const alt of (lang === 'fr' ? [false, true] : [false])) {
      for (const vp of (alt ? [{w: 390, h: 844, n: 'movil'}] : lang === 'fr' ? [{w: 390, h: 844, n: 'movil'}, {w: 1280, h: 800, n: 'pc'}] : [{w: 390, h: 844, n: 'movil'}])) {
        const tag = `${lang}${alt ? '-ayuda' : ''}-${vp.n}`;
        const ctx = await browser.newContext({viewport: {width: vp.w, height: vp.h}, deviceScaleFactor: 1});
        await ctx.addInitScript(([l, a]) => {
          localStorage.setItem('chrono-ohm-v1', JSON.stringify({name: 'Inès', introSeen: false, settings: {lang: l, alt: a, narr: false, music: false, sfx: false}}));
        }, [lang, alt]);
        const page = await ctx.newPage();
        const blocked = [];
        page.on('pageerror', e => report.errors.push(`${tag}: ${e.message}`));
        page.on('console', m => { if (m.type() === 'error') report.errors.push(`${tag} consola: ${m.text()}`); });
        page.on('request', r => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) blocked.push(r.url()); });
        await page.goto(FILE);
        await page.waitForTimeout(300);
        const seen = [];
        const grab = async (name, shot) => {
          const r = await page.evaluate(() => { const L = document.documentElement.lang; const c = document.body.cloneNode(true); c.querySelectorAll('[lang]').forEach(e => { if (e.getAttribute('lang') !== L) e.remove(); }); document.body.append(c); c.style.cssText = 'position:absolute;left:-99999px;top:0;width:1000px'; const text = c.innerText; c.remove(); return {text, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth}; });
          seen.push(r.text);
          if (r.sw > r.cw + 1) report.overflow.push(`${tag} ${name}: ancho ${r.sw} > ${r.cw}`);
          if (shot) await page.screenshot({path: path.join(SHOTS, `${tag}-${name}.png`)});
        };
        await grab('titulo', true);
        // introducción: avanzar todas las líneas
        await page.click('#btnStart');
        await page.waitForTimeout(400);
        await grab('intro', true);
        for (let i = 0; i < 20 && await page.$('#scr-talk:not([hidden])'); i++) { await page.click('#tkBox', {position: {x: 30, y: 30}}).catch(() => {}); await page.waitForTimeout(40); await page.click('#tkBox', {position: {x: 30, y: 30}}).catch(() => {}); await page.waitForTimeout(40); }
        await page.waitForTimeout(300);
        await grab('menu', true);
        // ajustes
        await page.click('#btnSettings'); await page.waitForTimeout(150); await grab('ajustes', true); await page.click('#setClose');
        // todas las pantallas de menú
        await page.evaluate(() => window.__CO.openNotes()); await grab('cuaderno-vacio', false);
        // desbloquear todo el cuaderno para ver todas las páginas
        await page.evaluate(() => { const C = window.__CO; Object.keys(C.NOTES).forEach(k => C.S.notes[k] = 1); C.S.ach = {lab1:1,burn:1,short:1,c1:1,c2:1,stars1:1,notes10:1,colors:1,q50:1,labs10:1,sand:1,days3:1}; C.CHAPTERS.forEach(ch => { C.S.ch[ch.id] = {done: ch.missions.length, stars: {}, complete: !ch.soon}; }); });
        for (const tab of ['loi', 'astuce', 'hist']) { await page.evaluate(() => window.__CO.openNotes()); await page.click(`.subtabs button[data-t="${tab}"]`); await grab('cuaderno-' + tab, tab === 'loi'); }
        await page.evaluate(() => window.__CO.openSkills()); await grab('competencias', true);
        await page.evaluate(() => window.__CO.openCredits()); await grab('creditos', true);
        await page.evaluate(() => window.__CO.renderHub()); await grab('menu-completo', false);
        await page.evaluate(() => window.__CO.openChapter(window.__CO.CHAPTERS[0])); await grab('capitulo', true);
        await page.evaluate(() => window.__CO.openSandbox()); await page.waitForTimeout(200); await grab('labo-libre', true);
        // cada paso de cada misión
        const missions = await page.evaluate(() => window.__CO.CHAPTERS.filter(c => !c.soon).flatMap((c, ci) => c.missions.map((m, mi) => ({ci, mi, n: m.steps.length, types: m.steps.map(s => s.type)}))));
        let shotDone = {};
        for (const m of missions) {
          for (let si = 0; si < m.n; si++) {
            const type = m.types[si];
            if (type === 'travel') continue;
            await page.evaluate(([ci, mi, si]) => { const C = window.__CO; const ch = C.CHAPTERS[ci]; C.setRun({ch, mi, m: ch.missions[mi], i: si, err: 0, hints: 0, xp: 0, cr: 0, streak: 0, r0: 0}); C.next(); }, [m.ci, m.mi, si]);
            await page.waitForTimeout(type === 'talk' ? 120 : 1150);
            if (type === 'talk') {
              // leer todas las líneas del diálogo
              for (let k = 0; k < 14 && await page.$('#scr-talk:not([hidden])'); k++) { const t = await page.evaluate(() => { const L = document.documentElement.lang; const c = document.body.cloneNode(true); c.querySelectorAll('[lang]').forEach(e => { if (e.getAttribute('lang') !== L) e.remove(); }); document.body.append(c); c.style.cssText = 'position:absolute;left:-99999px;top:0;width:1000px'; const x = c.innerText; c.remove(); return x; }); seen.push(t); await page.click('#tkBox', {position: {x: 30, y: 30}}).catch(() => {}); await page.waitForTimeout(30); await page.click('#tkBox', {position: {x: 30, y: 30}}).catch(() => {}); await page.waitForTimeout(30); }
            } else {
              await grab(`m${m.ci + 1}-${m.mi + 1}-${si}-${type}`, !shotDone[type]); shotDone[type] = 1;
              if (type === 'lab') { // pistas
                for (let h = 0; h < 3; h++) { await page.click('#lsHint').catch(() => {}); await page.waitForTimeout(30); await grab('pista', false); }
              }
              if (type === 'qcm' || type === 'boss') { await page.click('.opt[data-k="0"]').catch(() => {}); await page.waitForTimeout(80); await grab(`m${m.ci + 1}-${m.mi + 1}-${si}-respuesta`, !shotDone.fb); shotDone.fb = 1; }
              if (type === 'num') { await page.fill('#nIn', '999').catch(() => {}); await page.click('#nOk').catch(() => {}); await page.click('#nOk').catch(() => {}); await page.fill('#nIn', '999').catch(() => {}); await page.click('#nOk').catch(() => {}); await page.waitForTimeout(60); await grab('num-fb', false); }
              if (type === 'colors') { for (let r = 0; r < 6; r++) { await page.click('.opt[data-i="0"]').catch(() => {}); await page.waitForTimeout(30); await grab('colores', false); await page.click('#qFoot .btn').catch(() => {}); await page.waitForTimeout(30); } await grab('colores-fin', false); }
              if (type === 'calc') { for (let r = 0; r < 2; r++) { await page.click('.step:last-child .chip').catch(() => {}); await page.waitForTimeout(560); } await page.fill('#cIn', '1').catch(() => {}); await page.click('#cOk').catch(() => {}); await page.waitForTimeout(60); await grab('calc-fb', false); }
              report.steps++;
            }
          }
          // pantalla de final de misión
          await page.evaluate(([ci, mi]) => { const C = window.__CO; const ch = C.CHAPTERS[ci]; C.setRun({ch, mi, m: ch.missions[mi], i: ch.missions[mi].steps.length, err: 1, hints: 2, xp: 40, cr: 0, streak: 0, r0: 0}); C.next(); }, [m.ci, m.mi]);
          await page.waitForTimeout(100); await grab('fin-mision', !shotDone.end); shotDone.end = 1;
        }
        // textos que pasaron por T() o ui() sin traducción
        const miss = await page.evaluate(() => [...window.__CO.MISS]);
        miss.forEach(x => { report.miss[x] = (report.miss[x] || 0) + 1; });
        const L = [...new Set(seen.join('\n').split('\n'))].join('\n');
        leaks(L, lang).forEach(x => { report.leaks[`${lang}: ${x}`] = 1; });
        if (blocked.length) report.errors.push(`${tag}: peticiones externas: ${[...new Set(blocked)].join(', ')}`);
        await ctx.close();
      }
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(SHOTS, 'informe.json'), JSON.stringify(report, null, 1));
  console.log('pasos renderizados:', report.steps);
  console.log('errores JS:', report.errors.length); [...new Set(report.errors)].slice(0, 15).forEach(e => console.log('  ', e));
  console.log('sin traducir:', Object.keys(report.miss).length); Object.keys(report.miss).slice(0, 30).forEach(e => console.log('  ', e));
  console.log('posibles mezclas de idioma:', Object.keys(report.leaks).length); Object.keys(report.leaks).slice(0, 40).forEach(e => console.log('  ', e));
  console.log('desbordes:', report.overflow.length); [...new Set(report.overflow)].slice(0, 20).forEach(e => console.log('  ', e));
})();

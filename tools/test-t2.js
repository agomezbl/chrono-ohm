// Prueba funcional del TOMO II (v1.7): resuelve de verdad cada paso de los capítulos 6-9,
// las misiones del modo experto, el desafío del día, los generadores y la compañía eléctrica.
// Uso: node tools/test-t2.js [fr|es]
const {chromium} = require('playwright');
const path = require('path'), fs = require('fs');
const FILE = 'file://' + path.join(__dirname, '..', 'dist', 'test.html');
const SHOTS = path.join(__dirname, '..', 'shots-t2'); fs.mkdirSync(SHOTS, {recursive: true});
const ALL = ['c1','c2','c3','c4','c5'];
(async () => {
  const browser = await chromium.launch(); const errors = []; let fails = 0, oks = 0;
  const langs = process.argv[2] ? [process.argv[2]] : ['fr', 'es'];
  for (const lang of langs) {
    const ctx = await browser.newContext({viewport: {width: lang === 'fr' ? 1280 : 390, height: 860}});
    await ctx.addInitScript(([l, all]) => { const ch = {}; all.forEach(id => ch[id] = {done: 9, stars: {}, complete: true});
      localStorage.setItem('chrono-ohm-v1', JSON.stringify({name: 'Nil', introSeen: true, ch, t2: {pace: false}, settings: {lang: l, narr: false, music: false, sfx: false}})); }, [lang, ALL]);
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`${lang}: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') errors.push(`${lang} consola: ${m.text()}`); });
    await page.goto(FILE); await page.waitForTimeout(300);
    const ok = (good, tag) => { if (good) oks++; else { fails++; console.log('FALLA', tag); } };
    /* resuelve el paso que esté en pantalla, sea del tipo que sea */
    async function solveStep(type, tag) {
      const i0 = await page.evaluate(() => window.__CO.RUN.i);
      for (let g = 0; g < 40; g++) {
        if (await page.$('#nextBtn')) return true;
        if (await page.evaluate(i0 => !window.__CO.RUN || window.__CO.RUN.i !== i0, i0)) return true;
        const st = await page.evaluate(() => { const C = window.__CO, R = C.RUN; return R ? R.m.steps[R.i - 1] ? 1 : 0 : 0; });
        if (type === 'lab' || type === 'transport') {
          const inp = await page.$('#gIn');
          if (inp) { const v = await page.evaluate(t => { const C = window.__CO, R = C.RUN, st = R.m.steps[R.i - 1]; const gi = [...document.querySelectorAll('#goals li')].findIndex(l => l.classList.contains('cur')); const g = st.goals[gi];
                return t === 'lab' ? g.input.ans(R.lab.Q) : g.input.ans(R.tp.calc(), {}); }, type);
            await page.fill('#gIn', String(Math.round(v * 10000) / 10000).replace('.', ',')); await page.click('#gOk'); await page.waitForTimeout(350); continue; }
          await page.evaluate(t => { const C = window.__CO, R = C.RUN, st = R.m.steps[R.i - 1]; const gi = [...document.querySelectorAll('#goals li')].findIndex(l => l.classList.contains('cur')); const g = st.goals[gi];
            if (!g || !g.sol) return; if (t === 'lab') { g.sol(R.lab); R.lab.run(); } else g.sol(R.tp); }, type);
          await page.waitForTimeout(450); continue; }
        if (type === 'reduce') {
          const grp = await page.$('.rd-grp'); const inp = await page.$('#rdIn'), gin = await page.$('#gIn');
          if (gin) { const v = await page.evaluate(() => { const st = window.__CO.RUN.m.steps[window.__CO.RUN.i - 1]; const R = window.__CO.RUN.reduce; const gi = [...document.querySelectorAll('#rdFinal li')].findIndex(l => l.classList.contains('cur')); return st.final[gi].ans(R.root.ch[0].R); });
            await page.fill('#gIn', String(Math.round(v * 10000) / 10000).replace('.', ',')); await page.click('#gOk'); await page.waitForTimeout(250); continue; }
          if (inp) { const v = await page.evaluate(() => { const R = window.__CO.RUN.reduce; const sel = [...document.querySelectorAll('.rd-grp.on')][0]; return R.reqOf(R.find(R.root, +sel.dataset.g)); });
            await page.fill('#rdIn', String(Math.round(v * 1000) / 1000).replace('.', ',')); await page.click('#rdOk'); await page.waitForTimeout(250); continue; }
          if (await page.$('#rdK .chip:not([disabled])')) { const k = await page.evaluate(() => { const R = window.__CO.RUN.reduce; const sel = document.querySelector('.rd-grp.on'); return R.find(R.root, +sel.dataset.g).k; }); await page.click(`#rdK .chip[data-k="${k}"]`); await page.waitForTimeout(200); continue; }
          if (grp) { await grp.dispatchEvent('click'); await page.waitForTimeout(200); continue; } }
        if (type === 'diag') { const st = await page.evaluate(() => { const s = window.__CO.RUN.m.steps[window.__CO.RUN.i - 1]; return {c: s.culprit, f: s.faultKind}; });
          await page.evaluate(() => { const lab = window.__CO.RUN.lab; const used = new Set(lab.B.comps.map(c => c.e)); ['h:2,1', 'h:4,1', 'h:3,2'].filter(e => !used.has(e)).slice(0, 1).forEach((e, i) => lab.B.comps.push({t: 'volt', e, dir: 1, lab: 'V9', id: 980 + i})); lab.run(); });
          await page.click(`#dgS .chip[data-l="${st.c}"]`); if (st.f) await page.click(`#dgF .chip[data-f="${st.f}"]`); await page.click('#dgGo'); await page.waitForTimeout(300); continue; }
        if (type === 'qcm' || type === 'num' || type === 'calc' || type === 'boss') {
          await page.waitForTimeout(150);
          const q = await page.evaluate(() => { const C = window.__CO, R = C.RUN, st = R.m.steps[R.i - 1]; if (st.type !== 'boss') return st; const k = +(document.querySelector('.boss-bar span[aria-label]') || {textContent: '1 /'}).textContent.split('/')[0] - 1; return st.qs[k]; });
          if (await page.$('.opts:not(.locked):not(.done)')) { const right = await page.evaluate(q => { const C = window.__CO; return C.T(q.o[0]); }, q);
            const btns = await page.$$('.opt'); for (const b of btns) { const t = (await b.textContent()).slice(1).trim(); if (t === right.trim()) { await b.click(); break; } } await page.waitForTimeout(150); }
          else if (await page.$('#nIn:not([disabled])')) { await page.fill('#nIn', String(q.ans).replace('.', ',')); await page.click('#nOk'); await page.waitForTimeout(150); }
          else if (await page.$('.step .chips:not(.done) .chip')) { await page.click('.step .chips:not(.done) .chip[data-k="0"]'); await page.waitForTimeout(600); }
          else if (await page.$('#cIn:not([disabled])')) { await page.fill('#cIn', String(q.ans).replace('.', ',')); await page.click('#cOk'); await page.waitForTimeout(150); }
          else if (await page.$('#qFoot .btn')) { await page.click('#qFoot .btn', {timeout: 2000}).catch(() => {}); await page.waitForTimeout(250); }
          else await page.waitForTimeout(250);
          continue; }
        if (type === 'tip' || type === 'page') { await page.waitForTimeout(150); continue; }
        if (type === 'meter') { /* plan fijo para la casa de 2026 */
          const plan = [{ev: 4}, null, {ev: 4, fridge: 24, hp: 4, led: 4}, null];
          for (const p of plan) { if (p) { await page.evaluate(p => Object.entries(p).forEach(([k, v]) => { const r = document.getElementById('h-' + k); r.value = v; r.dispatchEvent(new Event('input')); }), p); await page.waitForTimeout(500); }
            else { const v = await page.evaluate(() => { const st = window.__CO.RUN.m.steps[window.__CO.RUN.i - 1]; const gi = [...document.querySelectorAll('#goals li')].findIndex(l => l.classList.contains('cur')); const H = {}; st.apps.forEach(a => H[a.id] = +document.getElementById('h-' + a.id).value); const E = st.apps.reduce((s, a) => s + a.P * H[a.id], 0) / 1000; return st.goals[gi].input.ans({E, h: H}); });
              await page.fill('#gIn', String(Math.round(v * 100) / 100).replace('.', ',')); await page.click('#gOk'); await page.waitForTimeout(400); } }
          continue; }
        if (type === 'blackout') { await page.click('#boGo').catch(() => {}); await page.waitForTimeout(200);
          const map = await page.evaluate(() => { const C = window.__CO; return Object.fromEntries(['short', 'water', 'overload', 'earth', 'bare'].map(k => [C.ui('bo.i.' + k), k])); });
          const FIX = {short: ['cut'], water: ['cut'], overload: ['unplug'], earth: ['earth'], bare: ['cut', 'tape']}; const t0 = Date.now();
          while (Date.now() - t0 < 12000 && !await page.$('.end')) { const al = await page.$$eval('.bo-h.alarm', bs => bs.map(b => [b.dataset.i, b.getAttribute('aria-label')]));
            for (const [i, l] of al) { const k = Object.entries(map).find(([n]) => l.includes(n)); if (!k) continue; for (const t of FIX[k[1]]) { await page.click(`.bo-tools .ltool[data-t="${t}"]`).catch(() => {}); await page.click(`.bo-h[data-i="${i}"]`).catch(() => {}); } }
            await page.waitForTimeout(120); } continue; }
        if (type === 'danger') { const d = await page.evaluate(() => { const C = window.__CO, st = C.RUN.m.steps[C.RUN.i - 1]; const el = document.getElementById('dgCard'); if (!el) return null; const t = el.textContent.trim(); const c = st.cards.find(x => C.T(x.t).replace(/<[^>]+>/g, '').trim() === t); return c ? !!c.danger : null; });
          if (d === null) { await page.click('#qFoot .btn').catch(() => {}); await page.waitForTimeout(150); continue; }
          await page.click(d ? '#dgDanger' : '#dgSafe'); await page.waitForTimeout(150); await page.click('#qFoot .btn').catch(() => {}); await page.waitForTimeout(150); continue; }
        await page.waitForTimeout(200);
      }
      return !!await page.$('#nextBtn');
    }
    async function playChapter(chId) {
      const n = await page.evaluate(id => window.__CO.CHAPTERS.concat(window.__CO.EXPERTS).find(c => c.id === id).missions.length, chId);
      for (let mi = 0; mi < n; mi++) {
        await page.evaluate(([id, mi]) => { const C = window.__CO; const ch = C.CHAPTERS.concat(C.EXPERTS).find(c => c.id === id); const m = ch.missions[mi]; if (m.gen) m.steps = m.gen(); ch.blackT = 1;
          m.steps.forEach(s => { if (s.type === 'blackout') { s.time = 8; s.maxDark = 9; } }); C.setRun({ch, mi, m, i: 0, err: 0, hints: 0, xp: 0, cr: 0, streak: 0, r0: 0}); }, [chId, mi]);
        const steps = await page.evaluate(() => window.__CO.RUN.m.steps.map(s => s.type));
        for (let si = 0; si < steps.length; si++) { const type = steps[si]; if (type === 'travel' || type === 'talk') { await page.evaluate(() => { window.__CO.RUN.i++; }); continue; }
          await page.evaluate(() => { const R = window.__CO.RUN; window.__CO.setRun(R); }); await page.evaluate(i => { const R = window.__CO.RUN; R.i = i; window.__CO.next(); }, si); await page.waitForTimeout(250);
          const good = await solveStep(type, `${lang} ${chId} ${mi + 1}.${si} ${type}`); ok(good, `${lang} ${chId} ${mi + 1}.${si} ${type}`);
          if (!good) await page.screenshot({path: path.join(SHOTS, `fail-${lang}-${chId}-${mi + 1}-${si}.png`)}); }
        await page.evaluate(() => { if (window.__CO.RUN) window.__CO.missionEnd(); }); await page.waitForTimeout(200);
      }
      const done = await page.evaluate(id => window.__CO.S.ch[id] && window.__CO.S.ch[id].complete, chId); ok(done, `${lang} ${chId} completo`);
    }
    for (const id of ['c6', 'c7', 'c8', 'c9']) await playChapter(id);
    await page.screenshot({path: path.join(SHOTS, `${lang}-fin-tomo2.png`)});
    for (const id of ['x1', 'x2', 'x3', 'x4', 'x5']) await playChapter(id);
    /* generadores: 300 tiradas cada uno, en los dos niveles */
    const bad = await page.evaluate(() => { const C = window.__CO, out = []; for (const [k, g] of Object.entries(C.GENS)) for (let i = 0; i < 300; i++) { const q = g(Math.random, 1 + i % 2);
      const txt = JSON.stringify(q.q) + JSON.stringify(q.ex); if (/NaN|undefined|Infinity/.test(txt) || (q.type === 'num' && !isFinite(q.ans)) || (q.type === 'qcm' && q.o.length < 3)) { out.push(k + ': ' + txt.slice(0, 120)); break; } } return out; });
    ok(!bad.length, `${lang} generadores ${bad.join(' | ')}`);
    /* desafío del día */
    await page.evaluate(() => window.__CO.startDaily()); await page.waitForTimeout(300);
    for (let k = 0; k < 30 && !await page.$('#dBack'); k++) { if (await page.$('.opts:not(.locked):not(.done)')) { await page.click('.opt'); await page.waitForTimeout(100); }
      else if (await page.$('#nIn:not([disabled])')) { await page.fill('#nIn', '1'); await page.click('#nOk'); await page.waitForTimeout(100); } else if (await page.$('#qFoot .btn')) await page.click('#qFoot .btn'); await page.waitForTimeout(150); }
    ok(!!await page.$('#dBack') && await page.evaluate(() => window.__CO.S.daily.last.length > 0), `${lang} desafío del día`);
    /* compañía eléctrica por la interfaz */
    await page.evaluate(() => { window.__CO.renderHub(); }); await page.click('#goTyc'); await page.waitForTimeout(400);
    for (let k = 0; k < 6 && await page.$('#tkBox'); k++) { await page.click('#tkSkip').catch(() => {}); await page.waitForTimeout(300); }
    await page.click('[data-s="center"]'); await page.waitForTimeout(150); await page.click('#tySide .chip[data-cap="24"]'); await page.waitForTimeout(250);
    for (const c of ['center-old', 'center-gare']) { await page.click('[data-s="center"]'); await page.waitForTimeout(150); await page.click(`#tySide [data-go="${c}"]`); await page.waitForTimeout(150); await page.click('#tySide .chip[data-k="S"][data-v="300"]'); await page.waitForTimeout(100); await page.click('#tyBuildL'); await page.waitForTimeout(250); }
    await page.screenshot({path: path.join(SHOTS, `${lang}-tycoon-mapa.png`)});
    await page.click('#tySim'); await page.waitForTimeout(800); await page.click('#tySkip').catch(() => {}); await page.waitForTimeout(800);
    await page.screenshot({path: path.join(SHOTS, `${lang}-tycoon-informe.png`)});
    const tyr = await page.evaluate(() => { const T = window.__CO.S.tyc; return {h: T.hist.length, srv: T.hist[0] && T.hist[0].served}; });
    ok(tyr.h === 1 && tyr.srv > .97, `${lang} compañía: un mes simulado ${JSON.stringify(tyr)}`);
    const miss = await page.evaluate(() => [...window.__CO.MISS].slice(0, 8)); ok(!miss.length, `${lang} textos sin traducir: ${miss.join(' | ')}`);
    await ctx.close();
  }
  await browser.close();
  console.log(`OK ${oks} · fallos ${fails} · errores JS ${errors.length}`); errors.slice(0, 12).forEach(e => console.log('  ', e));
  console.log(!fails && !errors.length ? 'TODO OK' : 'HAY FALLOS');
})();

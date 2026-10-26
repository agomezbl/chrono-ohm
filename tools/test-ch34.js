// Prueba funcional de los capítulos 3 (Manchester) y 4 (Nueva York): cada experimento,
// contador, tarjetas de peligro y arcade de averías se resuelven de verdad hasta "terminado".
// Uso: node tools/test-ch34.js
const {chromium} = require('playwright');
const path = require('path'), fs = require('fs');
const FILE = 'file://' + path.join(__dirname, '..', 'dist', 'test.html');
const SHOTS = path.join(__dirname, '..', 'shots-ch34'); fs.mkdirSync(SHOTS, {recursive: true});

(async () => {
  const browser = await chromium.launch();
  const errors = [], results = [];
  for (const lang of ['fr', 'es']) {
    const ctx = await browser.newContext({viewport: {width: lang === 'fr' ? 1280 : 390, height: 860}});
    await ctx.addInitScript(l => localStorage.setItem('chrono-ohm-v1', JSON.stringify({name: 'Inès', introSeen: true, settings: {lang: l, narr: false, music: false, sfx: false}})), lang);
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`${lang}: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') errors.push(`${lang} consola: ${m.text()}`); });
    await page.goto(FILE); await page.waitForTimeout(300);
    const steps = await page.evaluate(() => window.__CO.CHAPTERS.slice(2, 5).flatMap(ch => ch.missions.flatMap((m, mi) => m.steps.map((s, si) => ({c: ch.id, mi, si, type: s.type, title: s.title ? (s.title.fr || s.title) : ''})))));
    for (const s of steps) {
      if (!['lab', 'meter', 'danger', 'blackout'].includes(s.type)) continue;
      const tag = `${lang} ${s.c} ${s.mi + 1}.${s.si} ${s.type} «${s.title}»`;
      await page.evaluate(([c, mi, si]) => { const C = window.__CO; const ch = C.CHAPTERS.find(x => x.id === c); const st = ch.missions[mi].steps[si]; if (st.type === 'blackout') { st.time = 8; } C.setRun({ch, mi, m: ch.missions[mi], i: si, err: 0, hints: 0, xp: 0, cr: 0, streak: 0, r0: 0}); C.next(); }, [s.c, s.mi, s.si]);
      await page.waitForTimeout(300);
      let ok = false;
      if (s.type === 'lab') {
        for (let g = 0; g < 8; g++) {
          if (await page.$('.ls-done')) break;
          const inp = await page.$('#gIn');
          if (inp) {
            const v = await page.evaluate(([c, mi, si]) => { const C = window.__CO; const st = C.CHAPTERS.find(x => x.id === c).missions[mi].steps[si]; const lis = [...document.querySelectorAll('#goals li')]; const gi = lis.findIndex(l => l.classList.contains('cur')); return st.goals[gi].input.ans(C.RUN.lab.Q); }, [s.c, s.mi, s.si]);
            await page.fill('#gIn', String(Math.round(v * 1000) / 1000).replace('.', ',')); await page.click('#gOk'); await page.waitForTimeout(150); continue;
          }
          // acción para el objetivo actual
          await page.evaluate(([fr, gi]) => { const lab = window.__CO.RUN.lab, B = lab.B; const by = l => B.comps.find(c => c.lab === l);
            if (fr === 'Mesurer la puissance') B.comps.push({t: 'volt', e: 'h:3,1', dir: 1, lab: 'V1', id: 900});
            if (fr === 'La bonne lampe') by('L1').lt = 'l45';
            if (fr === 'Chauffer sans griller') by('G').E = 9;
            if (fr === 'Protéger la maison') { const f = B.comps.find(c => c.t === 'fuse');
              if (!f) B.comps.push({t: 'fuse', e: 'h:1,0', dir: 1, lab: 'F1', Ir: 5, id: 901});
              else if (f.Ir !== 1) { f.Ir = 1; f.burnt = 0; }
              else if (gi === 2) by('K2').on = true;
              else { by('K2').on = false; f.burnt = 0; } }
            if (fr === 'La dynamo de Pearl Street') by('K1').on = true;
            const P = (l, v) => { const c = by(l); if (c) c.pressed = v; }, add = c => B.comps.push(Object.assign({dir: 1, id: 920 + B.comps.length}, c));
            const relAll = () => B.comps.forEach(c => { c.pressed = false; });
            if (fr === 'Appuyer pour allumer') {
              if (gi === 0) add({t: 'pbno', e: 'h:2,3', lab: 'S1'});
              if (gi === 1) P('S1', true);
              if (gi === 2) { relAll(); B.comps.splice(B.comps.findIndex(c => c.t === 'pbno'), 1); add({t: 'pbnc', e: 'h:2,3', lab: 'S1'}); }
              if (gi === 3) B.comps.find(c => c.t === 'pbnc').pressed = true; }
            if (fr === 'Petit courant, grand moteur') by('K1').on = gi === 0;
            if (fr === "L'auto-maintien") {
              if (gi === 0) P('S1', true);
              if (gi === 1) { relAll(); lab.run(); add({t: 'kno', e: 'v:3,1', lab: 'KA1', rel: 'KA1'}); P('S1', true); lab.run(); P('S1', false); }
              if (gi === 2) P('S2', true);
              if (gi === 3) relAll(); }
            if (fr === "Vert en marche, rouge à l'arrêt") {
              if (gi === 0) { add({t: 'kno', e: 'v:6,1', lab: 'KA1', rel: 'KA1'}); add({t: 'knc', e: 'v:7,1', lab: 'KA1', rel: 'KA1'}); }
              if (gi === 1) { P('S1', true); lab.run(); P('S1', false); }
              if (gi === 2) { P('S2', true); lab.run(); P('S2', false); } }
            if (fr === 'Le coup-de-poing') {
              if (gi === 0) add({t: 'pbnc', e: 'h:1,0', lab: 'S3'});
              if (gi === 1) { P('S1', true); lab.run(); P('S1', false); }
              if (gi === 2) P('S3', true);
              if (gi === 3) relAll(); }
            lab.run(); }, [s.title, await page.evaluate(() => [...document.querySelectorAll('#goals li')].findIndex(l => l.classList.contains('cur')))]);
          await page.waitForTimeout(450);
        }
        ok = !!await page.$('.ls-done');
      }
      if (s.type === 'meter') {
        const plan = s.title === 'Le compteur de la brasserie' ? [{pump: 2}, null, {pump: 2, heater: 2}, null] : [{rad: 3, light: 4, pc: 2, standby: 0}, null];
        for (const p of plan) {
          if (p) { await page.evaluate(p => Object.entries(p).forEach(([k, v]) => { const r = document.getElementById('h-' + k); r.value = v; r.dispatchEvent(new Event('input')); }), p); await page.waitForTimeout(500); }
          else { const v = await page.evaluate(([c, mi, si]) => { const C = window.__CO; const st = C.CHAPTERS.find(x => x.id === c).missions[mi].steps[si]; const lis = [...document.querySelectorAll('#goals li')]; const gi = lis.findIndex(l => l.classList.contains('cur'));
              const H = {}; st.apps.forEach(a => H[a.id] = +document.getElementById('h-' + a.id).value); const E = st.apps.reduce((s, a) => s + a.P * H[a.id], 0) / 1000; return st.goals[gi].input.ans({E, h: H}); }, [s.c, s.mi, s.si]);
            await page.fill('#gIn', String(Math.round(v * 100) / 100).replace('.', ',')); await page.click('#gOk'); await page.waitForTimeout(400); }
        }
        ok = !!await page.$('.ls-done');
      }
      if (s.type === 'danger') {
        for (let k = 0; k < 20; k++) {
          if (await page.$('.end')) break;
          const d = await page.evaluate(([c, mi, si]) => { const C = window.__CO; const st = C.CHAPTERS.find(x => x.id === c).missions[mi].steps[si]; const t = document.getElementById('dgCard').textContent.trim(); const L = document.documentElement.lang; const card = st.cards.find(x => C.T(x.t).replace(/<[^>]+>/g, '').trim() === t); return card ? !!card.danger : null; }, [s.c, s.mi, s.si]);
          if (d === null) { errors.push(`${tag}: tarjeta no encontrada`); break; }
          await page.click(d ? '#dgDanger' : '#dgSafe'); await page.waitForTimeout(150); await page.click('#qFoot .btn').catch(() => {}); await page.waitForTimeout(150);
        }
        ok = !!await page.$('.end-big.ok') && !!await page.$('#nextBtn');
      }
      if (s.type === 'blackout') {
        await page.click('#boGo'); await page.waitForTimeout(200);
        const map = await page.evaluate(() => { const C = window.__CO; return Object.fromEntries(['short', 'water', 'overload', 'earth', 'bare'].map(k => [C.ui('bo.i.' + k), k])); });
        const FIX = {short: ['cut'], water: ['cut'], overload: ['unplug'], earth: ['earth'], bare: ['cut', 'tape']};
        const t0 = Date.now();
        while (Date.now() - t0 < 11000 && !await page.$('.end')) {
          const alarms = await page.$$eval('.bo-h.alarm', bs => bs.map(b => [b.dataset.i, b.getAttribute('aria-label')]));
          for (const [i, lab] of alarms) { const kind = Object.entries(map).find(([n]) => lab.includes(n)); if (!kind) continue;
            for (const t of FIX[kind[1]]) { await page.click(`.bo-tools .ltool[data-t="${t}"]`).catch(() => {}); await page.click(`.bo-h[data-i="${i}"]`).catch(() => {}); } }
          await page.waitForTimeout(150);
        }
        if (lang === 'fr') await page.screenshot({path: path.join(SHOTS, 'blackout-fin.png')});
        ok = !!await page.$('.end-big.ok');
      }
      if (!results.some(r => r.type === s.type && r.lang === lang)) await page.screenshot({path: path.join(SHOTS, `${lang}-${s.type}-${s.c}-${s.mi + 1}.png`)});
      results.push({lang, type: s.type, tag, ok});
      console.log(ok ? 'OK ' : 'FALLA', tag);
    }
    await ctx.close();
  }
  await browser.close();
  console.log('errores JS:', errors.length); errors.slice(0, 10).forEach(e => console.log('  ', e));
  console.log(results.every(r => r.ok) && !errors.length ? 'TODO OK' : 'HAY FALLOS');
})();

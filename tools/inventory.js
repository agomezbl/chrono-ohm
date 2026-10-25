// Inventario de textos de contenido: ejecuta el juego en jsdom y recorre los datos.
// Uso: node tools/inventory.js  -> escribe i18n/worksheet.json
const {JSDOM} = require('jsdom');
const fs = require('fs'), path = require('path');
const R = p => path.join(__dirname, '..', p);
const app = fs.readFileSync(R('src/app.js'), 'utf8');
const body = fs.readFileSync(R('src/body.html'), 'utf8');
let i18n = '{}'; try { i18n = fs.readFileSync(R('i18n/dict.json'), 'utf8'); } catch (e) {}
const html = '<!doctype html><html><head></head><body>' + body + "<script>(function(){'use strict';const I18N=" + i18n + ';\n' + app +
  '\nwindow.__CO={CHAPTERS,NOTES,SKILLS,ACH,INTRO,CAST,RANKS,CTYPES,BANDN};\n})();</script></body></html>';
const fake = new Proxy(function () {}, {get: (t, p) => p === 'canvas' ? {width: 1, height: 1} : p === 'measureText' ? () => ({width: 1}) : () => fake, set: () => true, apply: () => fake});
const dom = new JSDOM(html, {runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://example.test/', beforeParse(w) {
  w.HTMLCanvasElement.prototype.getContext = () => fake; w.scrollTo = () => {};
  w.matchMedia = () => ({matches: false, addListener() {}, removeListener() {}});
}});
const CO = dom.window.__CO;
if (!CO) { console.error('sin export'); process.exit(1); }
const out = []; const seen = new Map();
// kind: identifica el tipo de texto; src: idioma del texto original; pair: texto hermano que ya es su traducción
function add(kind, src, text, ctx, pair) {
  if (typeof text !== 'string' || !text.trim()) return;
  if (seen.has(text)) { const e = seen.get(text); if (!e.ctx.includes(ctx)) e.ctx.push(ctx); if (pair && !e.pair) e.pair = pair; return; }
  const e = {id: 'c' + String(out.length + 1).padStart(4, '0'), kind, src, text, ctx: [ctx]};
  if (pair) e.pair = pair;
  seen.set(text, e); out.push(e);
}
const Q = (q, ctx) => {
  add('question', 'fr', q.q, ctx, q.es);
  (q.o || []).forEach((o, k) => add('option', 'fr', o, ctx + '.o' + k));
  add('explain', 'es', q.ex, ctx + '.ex');
};
add('dialogue-hint', 'es', '', '');
CO.INTRO.forEach((l, i) => l.t && add('dialogue', 'es', l.t, 'intro.' + i + '.' + l.w));
CO.CHAPTERS.forEach(ch => {
  const c = ch.id;
  add('place', 'fr', ch.place, c + '.place');
  add('era', 'es', ch.era, c + '.era');
  add('chapter-title', 'fr', ch.title, c + '.title');
  add('chapter-sub', 'es', ch.es, c + '.sub');
  if (ch.page) add('page', 'fr', ch.page, c + '.page');
  (ch.missions || []).forEach(m => {
    const mc = c + '.' + m.id;
    add('mission-title', 'fr', m.t, mc + '.t', m.es);
    m.steps.forEach((st, si) => {
      const sc = mc + '.s' + si + '.' + st.type;
      if (st.type === 'talk') st.lines.forEach((l, li) => l.t && add('dialogue', 'es', l.t, sc + '.' + li + '.' + l.w));
      if (st.type === 'lab') {
        add('lab-title', 'fr', st.title, sc + '.title', st.es);
        st.goals.forEach((g, gi) => { add('goal', 'fr', g.t, sc + '.g' + gi); add('goal-help', 'es', g.es, sc + '.g' + gi + '.help'); });
        (st.hints || []).forEach((h, hi) => add('hint', 'es', h, sc + '.h' + hi));
      }
      if (st.type === 'qcm' || st.type === 'num') Q(st, sc);
      if (st.type === 'calc') {
        add('question', 'fr', st.q, sc, st.es);
        st.steps.forEach((s, k) => { add('calc-step', 'fr', s.h, sc + '.st' + k, s.hes); s.o.forEach((o, j) => add('formula', 'fr', o, sc + '.st' + k + '.o' + j)); });
        add('explain', 'es', st.ex, sc + '.ex');
      }
      if (st.type === 'boss') { add('boss-title', 'fr', st.title, sc + '.title'); st.qs.forEach((q, k) => Q(q, sc + '.q' + k)); }
    });
  });
});
Object.entries(CO.NOTES).forEach(([id, n]) => {
  add('note-title', 'fr', n.fr, 'note.' + id, n.es);
  add('note-body', 'fr', n.b, 'note.' + id + '.b');
  add('note-extra', 'es', n.bes, 'note.' + id + '.extra');
});
CO.SKILLS.forEach(s => { add('skill', 'fr', s.fr, 'skill.' + s.id); add('skill-short', 'es', s.es, 'skill.' + s.id + '.short'); });
CO.ACH.forEach(a => { add('ach-name', 'fr', a.fr, 'ach.' + a.id); add('ach-desc', 'es', a.es, 'ach.' + a.id + '.desc'); });
Object.entries(CO.CAST).forEach(([id, c]) => { add('cast-name', id === 'baron' || id === 'minister' ? 'es' : 'fr', c.n, 'cast.' + id); add('cast-role', 'es', c.role, 'cast.' + id + '.role'); });
Object.entries(CO.CTYPES).forEach(([id, c]) => add('component', 'fr', c.n, 'ctype.' + id, c.es));
CO.BANDN.forEach((b, i) => add('color', 'fr', b, 'band.' + i));
fs.writeFileSync(R('i18n/worksheet.json'), JSON.stringify(out, null, 1));
const by = {}; out.forEach(e => { by[e.kind] = (by[e.kind] || 0) + 1; });
console.log('entradas únicas:', out.length); console.log(by);
const words = l => out.filter(e => e.src === l).reduce((a, e) => a + e.text.split(/\s+/).length, 0);
console.log('palabras origen FR:', words('fr'), ' ES:', words('es'));
process.exit(0);

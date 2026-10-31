# Chrono-Ohm — código fuente (v1.7 beta, bilingüe FR/ES)

Juego web de electricidad para 12-16 años: tomo I de nivel collège / ESO, tomo II progresivo hasta lycée / bachillerato.
Estado: **versión 1 en desarrollo, todavía sin pruebas con familias reales**. Historial en `CHANGELOG.md`.
Un solo archivo HTML, sin servidor, sin cuentas y sin peticiones externas.

## Carpetas
- `src/app.js` — lógica del juego (simulador de circuitos, misiones, pantallas). Contenido de las misiones en `CH1` a `CH5`, `NOTES`… (los capítulos 3 y 4 llevan los textos en línea con `tx(fr, es)`).
  v1.3 (bloque «v1.3 · Taller…»): desafíos (`PUZZLES`) y anomalías (`revPool`, `startReview`).
  v1.4: capítulos `CH3` (Joule) y `CH4` (Edison y Tesla) con textos `tx(fr, es)` dentro del propio código; pasos nuevos `meter`, `danger`
  y `blackout`; pruebas del Maestro (`PUZZLES` con `master:1`); Taller de 500 W (`GEN_LEVELS`, `DEVICES`, `LINES`, `FUSES`, `accrue`).
- `src/v17/*.js` — **tomo II (v1.7)**, se concatenan detrás de `app.js` en orden alfabético:
  `00_core.js` (personajes, escenarios `SCENES2`, competencias, rangos, ritmo diario y código parental),
  `10_steps.js` (pasos nuevos `reduce`, `transport` y `diag` en `STEP2`), `20_ch6.js`…`23_ch9.js` (capítulos 6-9, textos con `tx(fr, es)`),
  `30_expert.js` (generadores de problemas `GENS`, modo experto `EXPERTS`, desafío del día), `50_tycoon.js` (la compañía eléctrica:
  `tySim` simula un mes hora a hora con despacho y flujo de potencia por análisis nodal), `60_hub.js` (panel principal, ajustes de ritmo, medallas)
  y `99_init.js` (arranque). Los objetivos de laboratorio con `check` llevan `sol` (solución de referencia) para las pruebas automáticas.
- `src/style.css`, `src/body.html` — estilos y esqueleto de la página. `src/fonts.css` se genera (fuentes OFL en base64).
- `i18n/content.txt` — traducciones del contenido (`cNNNN.fr = …`, `cNNNN.es = …`). Los números salen de `i18n/worksheet.json`.
- `i18n/ui.txt` — textos de botones y pantallas (`clave.fr = …`).
- `i18n/REVISION.md` — lo que se corrigió en la revisión del 24/10/2026.
- `tools/` — scripts: `inventory.js` (inventario de textos), `merge.py` (une y valida traducciones),
  `build.py` (genera `dist/`), `test-all.js` (prueba completa en Chromium), `test-migration.js`, `pack.py`.

## Construir
```
npm install jsdom playwright @fontsource/atkinson-hyperlegible @fontsource/im-fell-english-sc @fontsource/oxanium @fontsource/share-tech-mono
python3 tools/fonts.py         # genera src/fonts.css
node tools/inventory.js        # solo si cambian textos en src/app.js
python3 tools/merge.py         # debe terminar con "problemas: 0"
python3 tools/build.py         # dist/index.html (GitHub Pages) y dist/chrono-ohm.artifact.html
node tools/test-all.js         # errores, textos sin traducir, mezclas de idioma, desbordes
node tools/test-puzzles.js     # cada desafío: solución de referencia aprueba, errores típicos suspenden
node tools/test-taller.js      # Taller, desafíos y anomalías de punta a punta
node tools/test-guardado.js    # guardado, código de copia, restaurar en otro aparato, modo privado
node tools/test-ch34.js        # capítulos 3 y 4 resueltos de verdad (experimentos, contador, peligro, arcade)
node tools/test-t2.js          # tomo II, modo experto, desafío del día, generadores y compañía eléctrica
node tools/voces-lista.js && python3 tools/voces.py   # graba con Kokoro solo las frases nuevas
```

## Reglas de los textos
- `[[término]]` resalta una palabra clave; `**negrita**`; `{N}` es el nombre del jugador y solo va como
  vocativo («{N}, …» o «…, {N} ?») para que la voz pueda omitirlo.
- El jugador siempre en neutro (vale para chicas y chicos).
- Español de España con terminología de ESO: "en paralelo" (no "en derivación"), "ohmio", "el borne".

## Desafíos: cómo añadir uno
Cada entrada de `PUZZLES` tiene `board()` (piezas fijas), `pal` (piezas disponibles), `max` (piezas para la 2.ª estrella),
`req` (misión que lo desbloquea) y `check(Q,B)`. Añade sus textos `pz.<id>.t/g/h1/h2/w` en `i18n/ui.txt`
y una solución correcta y otra errónea en `tools/test-puzzles.js`.

## v1.4
- Nuevos tipos de paso: `meter` (contador de energía), `danger` (¿peligro o no?), `blackout` (arcade de averías).
- Retratos: `CHARS` describe cada personaje (piel, ropa, pelo, barba, ojos) y `portrait(id, ánimo)` los dibuja.
- Pruebas del Maestro Tesla: entradas de `PUZZLES` con `master:1`. Taller de 500 W: `GEN_LEVELS`, `DEVICES`, líneas del cuadro.
- `node tools/test-ch34.js` resuelve de verdad todos los experimentos, contadores y juegos de los capítulos 3 y 4.

## v1.5
- Capítulo 5 (`CH5`): tipos de pieza `pbno`/`pbnc` (pulsadores), `coil` (bobina de relé), `kno`/`knc` (contactos). `seqSim()` prueba una secuencia de pulsaciones sobre una copia.
- Voces: `node tools/voces-lista.js` saca todas las frases (`voiceLines()` en el juego) y `python3 tools/voces.py` graba solo las que faltan en `audio/fr` y `audio/es` (necesita `voz/kokoro-v1.0.onnx` y `voz/voices-v1.0.bin`, que no se suben al repositorio por su tamaño).

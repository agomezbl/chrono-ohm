# Chrono-Ohm

**Jugar:** https://agomezbl.github.io/chrono-ohm/

Aventura de viaje en el tiempo para aprender electricidad (12-14 años): intensidad, amperímetro, resistencias,
ley de Ohm, potencia y energía, y seguridad eléctrica con Edison y Tesla, con laboratorio de circuitos real, desafíos, taller de 500 W y repaso. En francés y español.

**Versión 1.4 beta**, todavía sin pruebas con familias reales. Historial en [CHANGELOG.md](CHANGELOG.md).

Sin cuentas, sin publicidad y sin peticiones a servidores externos: el progreso se guarda solo en el aparato.

© 2026 agomezbl. Todos los derechos reservados. Las tipografías se distribuyen con licencia SIL OFL 1.1 (carpeta `licenses/`).

---

# Chrono-Ohm — código fuente (v1.4 beta, bilingüe FR/ES)

Juego web de electricidad para 12-14 años (collège en Francia, ESO en España).
Estado: **versión 1 en desarrollo, todavía sin pruebas con familias reales**. Historial en `CHANGELOG.md`.
Un solo archivo HTML, sin servidor, sin cuentas y sin peticiones externas.

## Carpetas
- `src/app.js` — lógica del juego (simulador de circuitos, misiones, pantallas). Contenido de las misiones en `CH1` a `CH4`, `NOTES`… (los capítulos 3 y 4 llevan los textos en línea con `tx(fr, es)`).
  v1.3 (bloque «v1.3 · Taller…»): desafíos (`PUZZLES`) y anomalías (`revPool`, `startReview`).
  v1.4: capítulos `CH3` (Joule) y `CH4` (Edison y Tesla) con textos `tx(fr, es)` dentro del propio código; pasos nuevos `meter`, `danger`
  y `blackout`; pruebas del Maestro (`PUZZLES` con `master:1`); Taller de 500 W (`GEN_LEVELS`, `DEVICES`, `LINES`, `FUSES`, `accrue`).
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

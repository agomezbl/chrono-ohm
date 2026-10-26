# Historial de versiones de Chrono-Ohm

Todo es la **versión 1**, todavía en desarrollo y **sin pruebas con familias reales**.
Cada evolución suma una cifra: v1.1, v1.2, v1.3…

## v1.5 · beta (26/10/2026)
- **Capítulo 5 · El Vórtice (final del juego):** pulsadores NA y NC, el relé (bobina y contactos), montaje marcha-paro con autorretención, pilotos verde y rojo, seta de paro de emergencia, tarjetas de seguridad de máquinas y duelo final contra el Barón. Nuevo escenario: la fortaleza del Barón fuera del tiempo.
- **Simulador ampliado:** pulsadores que funcionan solo mientras se mantienen apretados, relés que hacen «clac» y mueven todos sus contactos a la vez, y aviso si un relé vibra porque su propio contacto lo desconecta.
- **Final del juego:** diploma con el nombre y la fecha, y un adelanto muy breve del próximo juego (Chrono-Tesla · El misterio de los imanes). Nota histórica sobre Joseph Henry y el electroimán.
- **Voces grabadas:** todo el juego narrado con voces de Kokoro (modelo abierto), cada personaje con su voz y cada idioma con las suyas. En Ajustes se elige entre voces grabadas y la voz del aparato. Las voces están en la versión de GitHub; si falta una frase, se usa la voz del aparato.
- 2 medallas nuevas y una competencia nueva (automatismos).

## v1.4 · beta (25/10/2026)
- **Capítulo 3 · Mánchester 1843 (Joule):** potencia P = U × I, potencia nominal, efecto Joule, energía E = P × t, kilovatio hora y factura. Nuevo juego «contador de energía» (organizar el día de la cervecería, cazar el derroche) y jefe final en Oxford 1847 con William Thomson.
- **Capítulo 4 · Nueva York 1884 (Edison y Tesla):** seguridad eléctrica en modo juego: tarjetas rápidas «¿Peligro o no?» con cuenta atrás y combos, arcade «Pánico en Manhattan» (elegir la herramienta correcta para cada avería antes del apagón), fusible y cortocircuito en una casa, toma de tierra y diferencial, la dinamo de Pearl Street y el duelo final.
- **Tesla, Gran Maestro:** al terminar Nueva York pasa a ser el maestro del jugador, aparece en el panel principal y propone 4 pruebas difíciles (serie + paralelo, fusible + interruptor, resistencias frágiles de 0,5 W, potencia exacta). Anuncia el electromagnetismo.
- **Taller de 500 W:** red de 24 V, generador de 20 a 500 W (6 niveles), 16 aparatos, cuadro eléctrico con 3 líneas (cable de 1,5 / 2,5 / 6 mm²) y fusibles de 2 a 32 A. Si un fusible es más grande de lo que aguanta el cable, el cable se recalienta. Máquinas productivas que generan cristales en tiempo real (hasta 12 h) con factura de la luz en kWh. Las partidas de la v1.3 se adaptan solas (las potencias se vuelven a calcular).
- **Ilustraciones nuevas:** motor de retratos rehecho para los 9 personajes: ojos con iris y brillo, cejas y boca según el ánimo (neutral, contento, sorprendido, preocupado, enfadado), pelo en capas con mechones, barbas y bigotes, cuello alto y ropa de época (chaleco, solapas, corbatín, condecoraciones) y luz de contorno del color de cada personaje. Escenarios de Mánchester, Nueva York y Pearl Street con mucho más detalle (tuberías y farol de gas, luna, puente y tren elevado en movimiento, dinamos «Jumbo», volante y cuadro de mandos). Haces de luz, polvo en suspensión y viñeta en todos los escenarios.
- UX: en el móvil los personajes ya no quedan tapados por el cuadro de diálogo y quien habla se ve más grande; aparatos del taller en 2 columnas; indicador de «continuar» en los diálogos, botones más grandes en pantallas táctiles, vibración corta en el móvil al fallar, corrección de un fallo por el que Lumi a veces salía sin brillo, y de otro que podía saltarse un objetivo si se hacían dos cambios muy seguidos.
- 7 medallas nuevas.

## v1.3 · beta (25/10/2026)
- Taller del Chronotron: generador de 20, 50 y 100 W y 8 aparatos a 12 V. Antes de encender cada uno se calcula P = U × I, y si se supera la potencia salta el fusible general. 4 trajes para Lumi.
- 8 desafíos de circuitos con 3 estrellas (funciona · pocas piezas · sin quemar nada ni usar pistas). Admiten varias soluciones y Lumi explica el resultado.
- Anomalías temporales: repaso de 5 preguntas sobre las competencias más flojas, con premio doble una vez al día y días de práctica al mes.
- 6 medallas nuevas. La versión se ve en Créditos.
- Guardado reforzado: el nombre y el progreso se guardan al momento en el aparato (también al cerrar o cambiar de pestaña), la portada saluda aunque la introducción no se haya terminado, el juego pide al navegador que no borre los datos y avisa si no puede guardar (modo privado).
- Copia de seguridad en Ajustes: un código corto (CHRONO1…) para copiar o descargar en archivo y restaurar la partida en otro aparato.

## v1.2 (24/10/2026)
- Francés y español completos, con selector de idioma y ayuda opcional en el otro idioma.
- Terminología escolar de cada país; jugador en neutro (rangos y medallas epicenos).
- Fuentes incluidas en el juego (cero peticiones externas). El narrador no pronuncia el nombre.
- Pantalla de créditos y privacidad, y correcciones de la revisión (ver `i18n/REVISION.md`).
- Las partidas de la v1.1 se conservan.

## v1.1 (13/10/2026)
- Versión inicial para Nil: capítulos de Ampère (París 1820) y Ohm (Colonia 1827), laboratorio de circuitos, cuaderno, competencias y medallas.

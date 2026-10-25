# Revisión de Chrono-Ohm (24/10/2026)

## Correcciones de cifras de la revisión anterior
- Textos de contenido: 464 únicos (no 277). ~1.700 palabras nacen en francés y ~2.500 en español.
  Además hay ~150 textos de interfaz escritos dentro del código (botones, avisos, pantallas).
- El cálculo de "23 min / 4 MB de audio por idioma" no estaba medido: se recalcula al generar las voces.

## Problemas encontrados y cómo se corrigen
1. Mezcla de idiomas: historia en español, interfaz y preguntas en francés, términos franceses
   entre « » dentro del español. → Dos idiomas completos + ayuda opcional en el otro idioma.
2. Fuentes cargadas desde Google (envía la IP del niño a Google). → Fuentes dentro del juego.
3. Jugador siempre en masculino ("mi ingeniero", rangos Apprenti/Chercheur..., "Ami d'Ampère").
   → Frases neutras y rangos/medallas epicenos (sirven igual para niñas y niños).
4. Nombre por defecto "Nil". → "Alex" si no se escribe nombre (la partida de Nil conserva el suyo).
5. Truco del código de colores en español usaba iniciales que no cuadran con los colores en
   español ("Ni Mi Rojo Oso..."). → Nuevo truco correcto en español y el clásico francés
   "Ne Mangez Rien Ou Je Vous Brûle Votre Grande Barbe".
6. "la borne A" en español (es "el borne"); "corta la boucle" (palabra francesa en texto español);
   "Con tu ley" (Lumi trata de usted a Ohm); título "Le piège du Barón" con tilde española.
7. Terminología española de ESO: "en derivación" → "en paralelo" (se menciona una vez que en
   Francia se dice "en dérivation"); "ohms" → "ohmios"; "gimnasio de los jesuitas" → "colegio".
8. Ohm: "il perd son poste" → "il quitte son poste" (dimitió; más exacto).
9. Botones citados en las pistas ("Inverser les bornes", "Remplacer", "Enregistrer") deben
   coincidir con los botones del idioma elegido.
10. La voz del navegador cambiaba de voz a mitad de frase (español ↔ francés). → Un idioma por frase.

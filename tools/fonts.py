#!/usr/bin/env python3
"""Genera src/fonts.css con las fuentes OFL incrustadas (paquetes npm @fontsource, subconjunto latin)."""
import base64, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, 'node_modules', '@fontsource')
FACES = [('Atkinson Hyperlegible', 'atkinson-hyperlegible', 400, 'normal'), ('Atkinson Hyperlegible', 'atkinson-hyperlegible', 700, 'normal'),
         ('Atkinson Hyperlegible', 'atkinson-hyperlegible', 400, 'italic'), ('Atkinson Hyperlegible', 'atkinson-hyperlegible', 700, 'italic'),
         ('IM Fell English SC', 'im-fell-english-sc', 400, 'normal'), ('Oxanium', 'oxanium', 500, 'normal'), ('Oxanium', 'oxanium', 600, 'normal'),
         ('Oxanium', 'oxanium', 700, 'normal'), ('Share Tech Mono', 'share-tech-mono', 400, 'normal')]
out = ['/* Fuentes incluidas en el juego (SIL Open Font License 1.1, paquetes @fontsource, subconjunto latin): ninguna petición a servidores externos */']
for fam, pk, w, st in FACES:
    b = open(os.path.join(D, pk, 'files', f'{pk}-latin-{w}-{st}.woff2'), 'rb').read()
    out.append(f"@font-face{{font-family:'{fam}';font-style:{st};font-weight:{w};font-display:swap;src:url(data:font/woff2;base64,{base64.b64encode(b).decode()}) format('woff2')}}")
open(os.path.join(ROOT, 'src', 'fonts.css'), 'w').write('\n'.join(out) + '\n')
print('src/fonts.css listo')

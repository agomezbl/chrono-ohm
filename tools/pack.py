#!/usr/bin/env python3
"""Empaqueta el código fuente editable en dist/fuente/proyecto.json.

Se publica junto al juego para que el proyecto no dependa de este ordenador: cualquier sesión
futura puede leerlo desde el enlace y reconstruir la carpeta (cada clave es la ruta de un archivo).
Las fuentes tipográficas no se incluyen: se regeneran con npm (@fontsource, ver tools/build.py).
"""
import json, os, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = ['README.md', 'CHANGELOG.md', 'src/app.js', 'src/style.css', 'src/body.html', 'i18n/content.txt', 'i18n/ui.txt',
         'i18n/worksheet.json', 'i18n/REVISION.md'] + sorted(glob.glob('tools/*', root_dir=ROOT)) + sorted(glob.glob('licenses/*', root_dir=ROOT))
out = {}
for f in files:
    p = os.path.join(ROOT, f)
    if os.path.isfile(p):
        out[f] = open(p, encoding='utf-8').read()
os.makedirs(os.path.join(ROOT, 'dist', 'fuente'), exist_ok=True)
dst = os.path.join(ROOT, 'dist', 'fuente', 'proyecto.json')
json.dump({'proyecto': 'Chrono-Ohm', 'version': '1.5', 'archivos': out}, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(dst, len(out), 'archivos', round(os.path.getsize(dst) / 1024), 'KB')

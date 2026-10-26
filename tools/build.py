#!/usr/bin/env python3
"""Construye Chrono-Ohm a partir de src/ e i18n/.

Salidas:
  dist/chrono-ohm.artifact.html  -> para publicar como artifact (sin <!doctype>, el publicador añade el esqueleto)
  dist/index.html                -> documento completo para GitHub Pages o para abrir sin conexión
  dist/test.html                 -> igual que index.html pero exporta datos internos para las pruebas
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)

def read(*a):
    with open(P(*a), encoding='utf-8') as f:
        return f.read()

css = read('src', 'style.css')
fonts = read('src', 'fonts.css') if os.path.exists(P('src', 'fonts.css')) else ''
body = read('src', 'body.html')
app = read('src', 'app.js')
dict_path = P('i18n', 'dict.json')
i18n = read('i18n', 'dict.json') if os.path.exists(dict_path) else '{}'
# valida el JSON antes de inyectarlo
json.loads(i18n)

TEST_EXPORT = ("\nwindow.__CO={get S(){return S},set S(v){S=v},CHAPTERS,NOTES,SKILLS,ACH,INTRO,CAST,RANKS,CTYPES,BANDN,LAMPS,"
               "startMission,openChapter,renderHub,openNotes,openSkills,openSandbox,openSettings,openCredits,setLang,renderTitle,"
               "get RUN(){return RUN},setRun(v){RUN=v},next,simulate,makeQ,checkAch,T,ui,MISS,I18N,VO,dropName,setLangT:setLang,PUZZLES,simWith,board,cG,cL,cR,cA,openShop,openPuzzles,startPuzzle,startReview,revPool,DEVICES,get LASTLAB(){return LASTLAB},saveCode,readCode,portrait,scene,voiceLines,VO};window.__CO_portrait=portrait;\n")

def page(test=False):
    script = ("<script>\n(function(){'use strict';\nconst I18N=" + i18n + ";\n" + app +
              (TEST_EXPORT if test else "") + "\n})();\n</script>\n")
    return ('<title>Chrono-Ohm</title>\n<style>\n' + fonts + '\n' + css + '</style>\n' + body + '\n' + script)

def full(test=False):
    return ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
            '<meta name="description" content="Chrono-Ohm : aventure scientifique pour apprendre l\'intensité, la résistance et la loi d\'Ohm.">\n'
            + page(test).replace('<title>Chrono-Ohm</title>\n', '<title>Chrono-Ohm</title>\n</head>\n<body>\n', 1) + '</body>\n</html>\n')

os.makedirs(P('dist'), exist_ok=True)
outs = {
    'chrono-ohm.artifact.html': page(),
    'index.html': full(),
    'test.html': full(test=True),
}
for name, html in outs.items():
    with open(P('dist', name), 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'{name:28s} {len(html.encode("utf-8"))/1024:8.1f} KB')

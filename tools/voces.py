#!/usr/bin/env python3
"""Graba las voces del juego con Kokoro (modelo abierto, Apache 2.0) → audio/<idioma>/<huella>.mp3 + audio/manifest.json

Lee voz/lineas.json (lo genera tools/voces-lista.js). Solo graba las frases que faltan, así que
al añadir textos basta con volver a ejecutarlo. Reparto: cada personaje tiene su voz en cada idioma.
En francés Kokoro solo tiene una voz (ff_siwis): los hombres y el Barón se distinguen bajando el tono.
Uso: python3 tools/voces.py [fr|es]
"""
import json, os, sys, subprocess, tempfile
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = os.path.join(ROOT, 'voz')
# personaje → (voz, velocidad, tono)   tono < 1 = más grave (sin conservar formantes: suena más masculino)
CAST = {
 'fr': {'lumi': ('ff_siwis', 1.0, 1.0), 'nar': ('ff_siwis', .92, .94), 'baron': ('ff_siwis', .9, .72),
        'ampere': ('ff_siwis', .97, .8), 'ohm': ('ff_siwis', .95, .78), 'arago': ('ff_siwis', .95, .76), 'minister': ('ff_siwis', .9, .74),
        'joule': ('ff_siwis', .97, .8), 'thomson': ('ff_siwis', 1.0, .84), 'edison': ('ff_siwis', .97, .77), 'tesla': ('ff_siwis', .95, .82)},
 'es': {'lumi': ('ef_dora', 1.0, 1.0), 'nar': ('ef_dora', .92, .95), 'baron': ('em_alex', .9, .85),
        'ampere': ('em_santa', .97, 1.0), 'ohm': ('em_alex', .95, .95), 'arago': ('em_santa', .95, .95), 'minister': ('em_santa', .9, .9),
        'joule': ('em_alex', .97, 1.0), 'thomson': ('em_alex', 1.0, 1.05), 'edison': ('em_santa', .97, 1.0), 'tesla': ('em_alex', .95, 1.0)}}
CODE = {'fr': 'fr-fr', 'es': 'es'}

def main():
    langs = sys.argv[1:] or ['fr', 'es']
    lines = json.load(open(os.path.join(V, 'lineas.json'), encoding='utf-8'))
    k = Kokoro(os.path.join(V, 'kokoro-v1.0.onnx'), os.path.join(V, 'voices-v1.0.bin'))
    for l in langs:
        d = os.path.join(ROOT, 'audio', l); os.makedirs(d, exist_ok=True)
        todo = [x for x in lines[l] if not os.path.exists(os.path.join(d, x['key'] + '.mp3'))]
        print(l, len(lines[l]), 'frases,', len(todo), 'por grabar', flush=True)
        for n, x in enumerate(todo):
            voice, speed, pitch = CAST[l].get(x['who'], CAST[l]['lumi'])
            a, sr = k.create(x['say'], voice=voice, speed=speed, lang=CODE[l])
            with tempfile.NamedTemporaryFile(suffix='.wav') as t:
                sf.write(t.name, a, sr)
                af = ['-af', f'rubberband=pitch={pitch}'] if pitch != 1.0 else []
                subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', t.name, *af, '-ac', '1', '-ar', '24000', '-b:a', '40k',
                                os.path.join(d, x['key'] + '.mp3')], check=True)
            if n % 25 == 0: print(l, n, '/', len(todo), flush=True)
    man = {l: sorted(f[:-4] for f in os.listdir(os.path.join(ROOT, 'audio', l)) if f.endswith('.mp3')) for l in ('fr', 'es') if os.path.isdir(os.path.join(ROOT, 'audio', l))}
    json.dump(man, open(os.path.join(ROOT, 'audio', 'manifest.json'), 'w'), separators=(',', ':'))
    print('manifest', {l: len(v) for l, v in man.items()})

main()

#!/usr/bin/env python3
"""Une inventario + traducciones y genera i18n/dict.json.

- i18n/worksheet.json : textos de contenido tal como están en el código (clave = texto original)
- i18n/content.txt    : traducciones de contenido  (cNNNN.fr = …)
- i18n/ui.txt         : textos de interfaz         (clave.fr = …)
Comprueba: textos sin traducir, palabras de un idioma colándose en el otro, marcas {N} y [[ ]] coherentes.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)

def parse(path):
    out = {}
    for n, line in enumerate(open(path, encoding='utf-8'), 1):
        line = line.rstrip('\n')
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        if ' = ' not in line:
            sys.exit(f'{path}:{n}: falta " = "')
        k, v = line.split(' = ', 1)
        k = k.strip()
        if '.' not in k:
            sys.exit(f'{path}:{n}: clave sin idioma: {k}')
        key, lang = k.rsplit('.', 1)
        if lang not in ('fr', 'es'):
            sys.exit(f'{path}:{n}: idioma desconocido {lang}')
        if (key, lang) in out:
            sys.exit(f'{path}:{n}: clave repetida {k}')
        out[(key, lang)] = v
    return out

NBSP = ' '
def fr_typo(s):
    """Tipografía francesa: espacio fino irrompible antes de : ; ! ? » y después de «."""
    s = re.sub(r' ([:;!?»])', NBSP + r'\1', s)
    s = re.sub(r'« ', '«' + NBSP, s)
    return s

LETTERS = re.compile(r'[A-Za-zÀ-ÿ]{4,}')
UNIT_WORDS = {'COM'}
def neutral(text, kind):
    if kind in ('formula',):
        return True
    if kind == 'cast-name':
        return True
    words = [w for w in LETTERS.findall(text) if w not in UNIT_WORDS]
    return not words

# Palabras que delatan un idioma dentro del otro
FR_IN_ES = re.compile(r"[èêàçœôîû]|\b(est|et|du|des|une|avec|pour|dans|sur|pas|qui|ou|au|aux|dérivation|intensité|résistance|ampèremètre|boucle|lampe)\b", re.I)
ES_IN_FR = re.compile(r"[¿¡ñ]|\b(el|los|las|una|con|para|está|por|del|pero|muy|hay|corriente|lámpara|amperímetro)\b", re.I)
# Expresiones francesas permitidas dentro del español (color de época) y viceversa
ES_OK = ['Mon Dieu', 'Magnifique', 'Oh là là', 'Vite', 'Académie des sciences', 'Académie', 'monsieur', 'Monsieur', 'Adieu, mes amis',
         'en dérivation', 'Ampère', 'André-Marie', 'Die galvanische Kette', 'Court-Circuit', 'Chronotron', 'Royal Society']
FR_OK = ['Guten Abend', 'Wunderbar', 'Danke, meine Freunde', 'Herr Ohm', 'Die galvanische Kette', 'Ja !', 'Ja !']

def leak(text, lang):
    s = text
    if lang == 'es':
        for ok in ES_OK:
            s = s.replace(ok, '')
        m = FR_IN_ES.search(s)
    else:
        for ok in FR_OK:
            s = s.replace(ok, '')
        m = ES_IN_FR.search(s)
    return m.group(0) if m else None

def main():
    ws = json.load(open(P('i18n', 'worksheet.json'), encoding='utf-8'))
    tr = parse(P('i18n', 'content.txt'))
    ui_raw = parse(P('i18n', 'ui.txt')) if os.path.exists(P('i18n', 'ui.txt')) else {}
    ids = {e['id'] for e in ws}
    unknown = sorted({k for k, _ in tr if k not in ids})
    problems = []
    if unknown:
        problems.append('ids de content.txt que no existen: ' + ', '.join(unknown))
    content, review = {}, []
    for e in ws:
        src, text, kind = e['src'], e['text'], e['kind']
        val = {}
        for lang in ('fr', 'es'):
            v = tr.get((e['id'], lang))
            if v is None and lang == src:
                v = text
            if v is None and lang == 'es' and e.get('pair') and kind in ('mission-title', 'lab-title', 'note-title', 'component', 'calc-step'):
                v = e['pair']
            if v is None and neutral(text, kind):
                v = text
            if v is None:
                problems.append(f"FALTA {e['id']}.{lang} ({kind}): {text}")
                continue
            val[lang] = v
        # comprobaciones de coherencia
        for lang, v in val.items():
            if lang != src or (e['id'], lang) in tr:
                w = leak(v, lang)
                if w and kind not in ('cast-name', 'formula'):
                    problems.append(f"MEZCLA {e['id']}.{lang}: «{w}» en: {v}")
            if '{N}' in v and not re.search(r'((^|[.!?…] )\{N\}, |, \{N\}( ?[:?!.]|$))', v):
                problems.append(f"NOMBRE {e['id']}.{lang}: {{N}} no está como vocativo: {v}")
            if '«' in v and lang == 'es' and kind in ('dialogue', 'explain', 'hint', 'goal-help', 'note-extra', 'note-body'):
                inner = re.findall(r'«([^»]+)»', v)
                for i in inner:
                    if FR_IN_ES.search(i) and i not in ('en dérivation',):
                        problems.append(f"COMILLAS {e['id']}.es: término francés entre comillas «{i}»")
        if 'fr' in val:
            val['fr'] = fr_typo(val['fr'])
        content[text] = val
        review.append({'id': e['id'], 'kind': kind, 'ctx': e['ctx'][0], **val})
    ui = {}
    for (k, lang), v in ui_raw.items():
        ui.setdefault(k, {})[lang] = fr_typo(v) if lang == 'fr' else v
    for k, v in ui.items():
        for lang in ('fr', 'es'):
            if lang not in v:
                problems.append(f'FALTA ui {k}.{lang}')
            else:
                w = leak(v[lang], lang)
                if w:
                    problems.append(f"MEZCLA ui {k}.{lang}: «{w}» en: {v[lang]}")
    json.dump({'c': content, 'u': ui}, open(P('i18n', 'dict.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    json.dump(review, open(P('i18n', 'review.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'contenido: {len(content)} textos · interfaz: {len(ui)} claves')
    for p in problems:
        print(' -', p)
    print('problemas:', len(problems))
    return 1 if problems else 0

if __name__ == '__main__':
    sys.exit(main())

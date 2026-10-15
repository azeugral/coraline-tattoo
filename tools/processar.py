# Gera as imagens do site a partir do IG extraído em ../_ref/ig
# uso: python -I tools/processar.py  (rodar dentro de site/)
import glob, json, os
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IG = os.path.join(ROOT, '..', '_ref', 'ig')
OUT = os.path.join(ROOT, 'assets')

# code, slug, título, categoria, índices (o 1º é a capa), índice do decalque (ou None)
OBRAS = [
    ('Dec6ZtQEbiw', 'musashi',     'Musashi, Vagabond',          'personagens', [0, 1, 2, 4], 4),
    ('DdSJLZBEaeT', 'ada-leon',    'Ada e Leon, Resident Evil',  'personagens', [0, 1, 2, 3, 5], 5),
    ('Dc_1ggSFRex', 'messmer',     'Messmer, Elden Ring',        'personagens', [0, 1, 2, 5], 5),
    ('DZVxeEzkRDF', 'rei',         'Rei, Evangelion',            'personagens', [0, 2, 3, 5], 5),
    ('DZOKklsEYXS', 'artorias',    'Artorias, Dark Souls',       'personagens', [0, 1, 2, 3], 3),
    ('DYyH7FckVj2', 'nana',        'Nana',                       'personagens', [3, 0, 1, 4], None),
    ('DXZhM9akVP0', 'borboleta',   'Borboleta cybertribal',      'cybertribal', [0, 1, 2, 4], None),
    ('DbEdvcWkVwm', 'tribal-anime','Rosto e tribal',             'cybertribal', [1, 0, 2, 3, 5], 5),
    ('DWgzZrDEQ-1', 'coracao-mao', 'Coração tribal na mão',      'cybertribal', [0, 1, 2, 3], 2),
    ('DYfvx-VEY6x', 'cybertribal', 'Cybertribal com estrelas',   'cybertribal', [0, 1, 2], None),
    ('DOrfEzUkWWJ', 'sesshomaru',  'Sesshomaru, Inuyasha',       'personagens', [0, 1, 2, 4, 6], 6),
    ('DQR21EYETzn', 'ghostface',   'Ghostface',                  'personagens', [0, 1, 2], None),
    ('DPkN_dqkfm6', 'bakugo',      'Bakugo, Boku no Hero',       'personagens', [0, 1, 3], 3),
    ('DbofH1DEVSv', 'hello-kitty', 'Hello Kitty tribal',         'personagens', [1, 0, 2], None),
    ('DRzldjxkVfH', 'chaveiro',    'Chaveirinho de corações',    'fino', [0, 1, 3, 4], 3),
    ('DOZaVbPERiN', 'moon-potion', 'Moon potion',                'fino', [0, 1, 2, 5], 2),
    ('DTtT0HFEcqx', 'pitbull',     'Pitbull no coração',         'fino', [0, 2, 5, 6], 5),
    ('DX99FPuEUWa', 'olho',        'Olho, da folha de flashes',  'fino', [0, 1, 2], None),
    ('DVhJYV6EZlT', 'peonia',      'Peônia',                     'fino', [0, 1, 2], None),
]
# pares decalque -> pele do hero
HERO = ['musashi', 'rei', 'moon-potion', 'ada-leon']
DISP = [22, 24, 29, 48, 46, 49, 57, 59, 62, 66]
PROCESSO = [('arte', 'ig/posts/*_DOrfEzUkWWJ_5.jpg'), ('decalque', 'ig/posts/*_DOZaVbPERiN_2.jpg'),
            ('pele', 'ig/posts/*_DOZaVbPERiN_0.jpg'), ('cicatrizada', 'ig/hl/cicatrizadas_04.jpg')]


def src(code, k):
    return glob.glob(os.path.join(IG, 'posts', f'*_{code}_{k}.jpg'))[0]


def crop(im, ratio, fy=.4):
    w, h = im.size
    if w / h > ratio:
        nw = int(h * ratio); x = (w - nw) // 2
        return im.crop((x, 0, x + nw, h))
    nh = int(w / ratio); y = max(0, int((h - nh) * fy))
    return im.crop((0, y, w, y + nh))


def save(im, path, width, q=80):
    im = im.copy()
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, 'WEBP', quality=q, method=6)


def abrir(p):
    return ImageOps.exif_transpose(Image.open(p)).convert('RGB')


dados = []
for code, slug, titulo, cat, idx, dec in OBRAS:
    fotos = []
    for n, k in enumerate(idx):
        im = abrir(src(code, k))
        base = f'{OUT}/obras/{slug}-{n}'
        save(im, base + '-1280.webp', 1280)
        fotos.append({'src': f'assets/obras/{slug}-{n}-1280.webp', 'w': min(im.width, 1280),
                      'h': round(im.height * min(im.width, 1280) / im.width)})
        if n == 0:
            save(crop(im, 4 / 5), base + '-c640.webp', 640)
    dados.append({'slug': slug, 'titulo': titulo, 'cat': cat, 'capa': f'assets/obras/{slug}-0-c640.webp', 'fotos': fotos})
    if slug in HERO:
        save(crop(abrir(src(code, idx[0])), 4 / 5), f'{OUT}/hero/{slug}-pele.webp', 900, 82)
        save(crop(abrir(src(code, dec)), 4 / 5), f'{OUT}/hero/{slug}-decalque.webp', 900, 82)

for i in DISP:
    save(abrir(os.path.join(IG, 'hl', f'disponiveis_{i:02d}.jpg')), f'{OUT}/disponiveis/d{i}.webp', 540, 78)

for nome, pat in PROCESSO:
    save(crop(abrir(glob.glob(os.path.join(IG, '..', pat))[0]), 4 / 5, .2 if nome == 'cicatrizada' else .4), f'{OUT}/img/processo-{nome}.webp', 720)

perfil = abrir(os.path.join(IG, 'perfil.jpg'))
save(perfil, f'{OUT}/img/coraline.webp', 900, 82)
save(crop(abrir(src('DWrXkUUERvS', 6)), 4 / 5), f'{OUT}/img/coraline-estudio.webp', 720)

with open(f'{OUT}/js/obras.js', 'w', encoding='utf8') as f:
    f.write('window.OBRAS=' + json.dumps(dados, ensure_ascii=False) + ';\n')
print(len(dados), 'obras')

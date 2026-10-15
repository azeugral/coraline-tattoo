"""Renderiza a fumaça do hero para aparelhos de toque: fumaca-celular.mp4 (em pé),
fumaca-deitado.mp4 (deitado) e o pôster.
Usa o mesmo shader de assets/js/fumaca.js, quadro a quadro, num Chromium headless
(Playwright + Brave), e codifica com o ffmpeg do imageio-ffmpeg.
O loop fecha sem emenda: o quadro final é a fase 2π, igual à fase 0.
Uso: python tools/gerar_video.py"""
import os, subprocess, base64
from playwright.sync_api import sync_playwright
import imageio_ffmpeg

AQUI = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(AQUI)
SAIDA = os.path.join(SITE, 'assets', 'video')
BRAVE = r'C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe'

VERSOES = [('fumaca-celular', 540, 1170), ('fumaca-deitado', 1280, 590)]
FPS, SEGUNDOS = 24, 12
RAIO = .18                      # mesma velocidade do desktop (raio .3 em 20 s)


def renderizar(nome, LARG, ALT, poster=False):
    quadros = FPS * SEGUNDOS
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    mp4 = os.path.join(SAIDA, nome + '.mp4')
    enc = subprocess.Popen([ff, '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'png', '-i', '-',
                            '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
                            '-movflags', '+faststart', '-an', mp4], stdin=subprocess.PIPE)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=BRAVE, args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        pg = b.new_page(viewport={'width': LARG, 'height': ALT})
        pg.set_content(f'<body style="margin:0"><canvas id="c" width="{LARG}" height="{ALT}"></canvas></body>')
        pg.add_script_tag(path=os.path.join(SITE, 'assets', 'js', 'fumaca.js'))
        pg.evaluate("window.T = fumacaGL(document.getElementById('c'), {preserveDrawingBuffer: true})")
        for i in range(quadros):
            fase = i / quadros * 6.283185307179586
            dado = pg.evaluate(f"(T.desenhar({fase}, {RAIO}), document.getElementById('c').toDataURL('image/png'))")
            png = base64.b64decode(dado.split(',', 1)[1])
            enc.stdin.write(png)
            if i == 0 and poster:
                with open(os.path.join(SAIDA, 'poster.png'), 'wb') as f:
                    f.write(png)
        b.close()
    enc.stdin.close(); enc.wait()
    if poster:
        from PIL import Image
        Image.open(os.path.join(SAIDA, 'poster.png')).convert('RGB').save(os.path.join(SITE, 'assets', 'img', 'fumaca-poster.webp'), 'WEBP', quality=80)
        os.remove(os.path.join(SAIDA, 'poster.png'))
    print(mp4, round(os.path.getsize(mp4) / 1e6, 2), 'MB')


def main():
    os.makedirs(SAIDA, exist_ok=True)
    for i, (nome, w, h) in enumerate(VERSOES):
        renderizar(nome, w, h, poster=(i == 0))


if __name__ == '__main__':
    main()

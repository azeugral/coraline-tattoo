(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const raf2 = fn => requestAnimationFrame(() => requestAnimationFrame(fn));

  /* topo sólido ao rolar + botão flutuante depois do hero */
  const topo = $('#topo'), flutua = $('.flutua'), hero = $('.hero');
  const aoRolar = () => {
    const y = scrollY;
    topo.classList.toggle('solido', y > 12);
    const fimHero = hero.offsetTop + hero.offsetHeight - innerHeight * .4;
    const perto = innerHeight + y > document.body.scrollHeight - 160;
    flutua.classList.toggle('ve', y > fimHero && !perto);
  };
  addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  /* menu do celular */
  const menu = $('#menu'), menuBt = $('.menu-bt');
  const abreMenu = abrir => {
    menuBt.setAttribute('aria-expanded', abrir);
    menuBt.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = abrir ? 'hidden' : '';
    if (abrir) { menu.hidden = false; raf2(() => menu.classList.add('aberto')); }
    else {
      menu.classList.remove('aberto');
      setTimeout(() => { if (!menu.classList.contains('aberto')) menu.hidden = true; }, 400);
    }
  };
  menuBt.addEventListener('click', () => abreMenu(menuBt.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => abreMenu(false)));

  /* revelar ao rolar */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  const observar = el => io.observe(el);

  /* grade de trabalhos */
  const grade = $('#grade');
  const obras = window.OBRAS || [];
  obras.forEach((o, i) => {
    const li = document.createElement('li');
    li.className = 'obra rv';
    li.dataset.cat = o.cat;
    li.style.transitionDelay = (i % 4) * 60 + 'ms';
    li.innerHTML = `<button type="button" aria-label="Ver fotos: ${o.titulo}">
      <div class="foto"><img src="${o.capa}" alt="${o.titulo}" width="640" height="800" loading="lazy" decoding="async">
      ${o.fotos.length > 1 ? `<span class="qtd">1/${o.fotos.length}</span>` : ''}</div>
      <p class="leg"><b>${String(i + 1).padStart(2, '0')}</b><span>${o.titulo}</span></p></button>`;
    li.querySelector('button').addEventListener('click', () => abreLb(i));
    grade.appendChild(li);
  });

  const conta = c => c === 'todos' ? obras.length : obras.filter(o => o.cat === c).length;
  $$('.filtro').forEach(bt => {
    bt.insertAdjacentHTML('beforeend', `<small>${conta(bt.dataset.f)}</small>`);
    bt.addEventListener('click', () => {
      if (bt.classList.contains('on')) return;
      $$('.filtro').forEach(b => { b.classList.toggle('on', b === bt); b.setAttribute('aria-selected', b === bt); });
      const f = bt.dataset.f;
      const fx = bt.parentElement;
      fx.scrollTo({ left: bt.offsetLeft - (fx.clientWidth - bt.offsetWidth) / 2, behavior: calmo ? 'auto' : 'smooth' });
      const itens = $$('.obra', grade);
      itens.forEach(li => li.classList.add('entrando'));
      setTimeout(() => {
        let n = 0;
        itens.forEach(li => {
          const ve = f === 'todos' || li.dataset.cat === f;
          li.classList.toggle('fora', !ve);
          li.classList.add('in');
          if (ve) { li.style.transitionDelay = Math.min(n++, 8) * 40 + 'ms'; }
        });
        raf2(() => itens.forEach(li => li.classList.remove('entrando')));
      }, calmo ? 0 : 220);
    });
  });

  /* lightbox: trilho nativo com scroll-snap (arrasta no dedo) */
  const lb = $('#lb'), lbTrilho = $('.lb-trilho', lb), lbTit = $('.lb-tit', lb), lbCont = $('.lb-cont', lb);
  const lbAnt = $('.lb-ant', lb), lbProx = $('.lb-prox', lb);
  let lbN = 0, lbVolta = null;
  const lbIndice = () => Math.round(lbTrilho.scrollLeft / lbTrilho.clientWidth);
  const lbAtualiza = () => {
    const i = lbIndice();
    lbCont.textContent = `${i + 1} / ${lbN}`;
    lbAnt.disabled = i <= 0;
    lbProx.disabled = i >= lbN - 1;
  };
  function abreLb(i) {
    const o = obras[i];
    lbVolta = document.activeElement;
    lbTit.textContent = o.titulo;
    lbN = o.fotos.length;
    lbTrilho.innerHTML = o.fotos.map((f, k) =>
      `<figure><img src="${f.src}" alt="${o.titulo}, foto ${k + 1}" width="${f.w}" height="${f.h}" decoding="async"${k > 1 ? ' loading="lazy"' : ''}></figure>`).join('');
    $$('img', lbTrilho).forEach(img => {
      const ok = () => img.classList.add('ok');
      img.complete ? ok() : img.addEventListener('load', ok, { once: true });
    });
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lbTrilho.scrollLeft = 0;
    lbAtualiza();
    raf2(() => lb.classList.add('aberto'));
    $('.lb-x', lb).focus({ preventScroll: true });
  }
  const fechaLb = () => {
    lb.classList.remove('aberto');
    document.body.style.overflow = '';
    setTimeout(() => { lb.hidden = true; lbTrilho.innerHTML = ''; }, 350);
    if (lbVolta) lbVolta.focus({ preventScroll: true });
  };
  const lbVai = d => lbTrilho.scrollTo({ left: (lbIndice() + d) * lbTrilho.clientWidth, behavior: calmo ? 'auto' : 'smooth' });
  $('.lb-x', lb).addEventListener('click', fechaLb);
  lbAnt.addEventListener('click', () => lbVai(-1));
  lbProx.addEventListener('click', () => lbVai(1));
  lbTrilho.addEventListener('scroll', () => requestAnimationFrame(lbAtualiza), { passive: true });
  lbTrilho.addEventListener('click', e => { if (e.target.tagName === 'FIGURE') fechaLb(); });
  addEventListener('keydown', e => {
    if (lb.hidden) { if (e.key === 'Escape' && !menu.hidden) abreMenu(false); return; }
    if (e.key === 'Escape') fechaLb();
    if (e.key === 'ArrowRight') lbVai(1);
    if (e.key === 'ArrowLeft') lbVai(-1);
  });

  /* trilho dos disponíveis */
  const trilho = $('#trilho');
  $$('.trilho-bts .seta').forEach(bt => bt.addEventListener('click', () => {
    const passo = trilho.querySelector('li').offsetWidth + 14;
    trilho.scrollBy({ left: passo * 2 * +bt.dataset.d, behavior: 'smooth' });
  }));

  /* dúvidas: abre e fecha com altura animada */
  $$('.faq details').forEach(d => {
    const s = $('summary', d), p = $('p', d);
    s.addEventListener('click', e => {
      if (calmo) return;
      e.preventDefault();
      const abrindo = !d.open;
      if (abrindo) d.open = true;
      const h = p.scrollHeight;
      p.style.overflow = 'hidden';
      p.animate(abrindo ? [{ height: 0, opacity: 0 }, { height: h + 'px', opacity: 1 }]
                        : [{ height: h + 'px', opacity: 1 }, { height: 0, opacity: 0 }],
        { duration: 420, easing: 'cubic-bezier(.16,.84,.32,1)' }).onfinish = () => {
          if (!abrindo) d.open = false;
          p.style.overflow = '';
        };
    });
  });

  /* hero: decalque que vira tinta */
  const PARES = [
    ['musashi', 'Musashi, Vagabond'],
    ['rei', 'Rei, Evangelion'],
    ['moon-potion', 'Moon potion'],
    ['ada-leon', 'Ada e Leon, Resident Evil'],
  ];
  const fig = $('.decalque'), pilha = $('.decalque-pilha'), linha = $('.decalque-linha');
  const nome = $('.decalque-nome'), pontos = $('.decalque-pontos');
  const DUR = 5600;
  const pares = PARES.map(([slug, titulo], i) => {
    const d = document.createElement('div');
    d.className = 'par';
    d.innerHTML = `<img class="dec" src="assets/hero/${slug}-decalque.webp" alt="Decalque de ${titulo}" width="900" height="1125"${i ? ' loading="lazy"' : ' fetchpriority="high"'}>
      <img class="pele" src="assets/hero/${slug}-pele.webp" alt="${titulo} tatuado" width="900" height="1125"${i ? ' loading="lazy"' : ''}>`;
    pilha.appendChild(d);
    pontos.insertAdjacentHTML('beforeend', '<span></span>');
    return { el: d, titulo };
  });
  const barras = $$('span', pontos);
  let atual = -1, timer = null, rodando = false;
  const carregado = el => Promise.all($$('img', el).map(img => img.decode ? img.decode().catch(() => {}) : Promise.resolve()));

  async function mostra(i) {
    const p = pares[i];
    await carregado(p.el);
    pares.forEach((q, k) => { q.el.classList.toggle('ativo', k === i); if (k !== i) setTimeout(() => q.el.classList.remove('tinta'), 900); });
    p.el.classList.remove('tinta');
    fig.classList.remove('na-pele');
    nome.style.opacity = 0;
    setTimeout(() => { nome.textContent = p.titulo; nome.style.opacity = 1; }, 200);
    barras.forEach((b, k) => { b.classList.toggle('feito', k < i); b.classList.remove('ativo'); });
    raf2(() => { barras[i].style.setProperty('--dur', DUR + 'ms'); barras[i].classList.add('ativo'); });
    atual = i;
    if (calmo) { p.el.classList.add('tinta'); fig.classList.add('na-pele'); return; }
    setTimeout(() => {
      linha.style.setProperty('--h', pilha.offsetHeight + 'px');
      linha.classList.remove('some', 'corre');
      void linha.offsetWidth;
      linha.classList.add('corre');
      p.el.classList.add('tinta');
      fig.classList.add('na-pele');
      setTimeout(() => { linha.classList.add('some'); }, 1700);
      setTimeout(() => linha.classList.remove('corre', 'some'), 2300);
    }, 1300);
  }
  const ciclo = () => {
    clearTimeout(timer);
    timer = setTimeout(() => { if (rodando) { mostra((atual + 1) % pares.length); ciclo(); } }, DUR);
  };
  const liga = on => {
    if (on === rodando) return;
    rodando = on;
    if (on) { if (atual < 0) mostra(0); ciclo(); } else clearTimeout(timer);
  };
  new IntersectionObserver(es => liga(es[0].isIntersecting && !document.hidden), { threshold: .25 }).observe(fig);
  document.addEventListener('visibilitychange', () => {
    const r = fig.getBoundingClientRect();
    liga(!document.hidden && r.bottom > 0 && r.top < innerHeight);
  });

  /* entrada */
  const entra = () => { document.documentElement.classList.add('pronto'); $$('.rv').forEach(observar); };
  (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 500))]) : Promise.resolve())
    .then(() => raf2(entra));
})();

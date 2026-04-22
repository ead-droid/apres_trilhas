/* ═══════════════════════════════════════════════════
   MT PRODUTIVO JOVEM — Navegação da Apresentação
   ═══════════════════════════════════════════════════ */

const TOTAL = 12;
let current = 1;

function getSlide(n) {
  return document.getElementById('s' + n);
}

function buildDots() {
  for (let s = 1; s <= TOTAL; s++) {
    const container = document.getElementById('dots-' + s);
    if (!container) continue;
    container.innerHTML = '';
    for (let i = 1; i <= TOTAL; i++) {
      const d = document.createElement('div');
      d.className = 'dot' + (i === s ? ' active' : '');
      d.title = 'Slide ' + i;
      d.onclick = (function(n) { return function() { goTo(n); }; })(i);
      container.appendChild(d);
    }
  }
}

function goTo(n) {
  if (n < 1 || n > TOTAL || n === current) return;
  const old = getSlide(current);
  const nxt = getSlide(n);

  old.classList.add('exit');
  old.classList.remove('active');
  setTimeout(() => { old.classList.remove('exit'); }, 460);

  nxt.style.transform = n > current ? 'translateX(60px)' : 'translateX(-60px)';
  nxt.style.opacity = '0';
  nxt.classList.add('active');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      nxt.style.transition = 'opacity .45s ease, transform .45s ease';
      nxt.style.transform = 'translateX(0)';
      nxt.style.opacity = '1';
    });
  });

  current = n;
}

function nextSlide() { goTo(current + 1); }
function prevSlide() { goTo(current - 1); }

/* Navegação por teclado */
document.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextSlide();
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   prevSlide();
});

/* Suporte a toque (swipe) */
let touchX = 0;
document.addEventListener('touchstart', e => { touchX = e.changedTouches[0].clientX; });
document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) { dx < 0 ? nextSlide() : prevSlide(); }
});

/* Inicializa os pontos de progresso */
buildDots();

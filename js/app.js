/*
   JOVEM PRODUTIVO MT - Navigation
*/

const slides = Array.from(document.querySelectorAll('.slide'));
const TOTAL = slides.length;
const TRANSITION_MS = 460;

let current = 1;
let isTransitioning = false;

function clampSlideNumber(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) return 1;
  return Math.max(1, Math.min(TOTAL, parsed));
}

function getSlide(number) {
  return document.getElementById(`s${number}`);
}

function parseSlideFromHash(hashValue) {
  const match = String(hashValue || '').match(/^#?s(\d+)$/i);
  return match ? clampSlideNumber(match[1]) : null;
}

function clearInlineTransitionStyles(slide) {
  if (!slide) return;
  slide.style.transition = '';
  slide.style.transform = '';
  slide.style.opacity = '';
}

function updateDots(activeSlide) {
  const containers = document.querySelectorAll('.progress-dots');
  containers.forEach((container) => {
    Array.from(container.children).forEach((dot, index) => {
      const isActive = index + 1 === activeSlide;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  });
  updateMenuActive(activeSlide);
}

function updateNavButtons(activeSlide) {
  const navBars = document.querySelectorAll('.slide .nav-bar');
  navBars.forEach((navBar) => {
    const buttons = navBar.querySelectorAll('.nav-btn');
    if (buttons.length < 2) return;

    const prevButton = buttons[0];
    const nextButton = buttons[buttons.length - 1];

    prevButton.disabled = activeSlide === 1;
    nextButton.disabled = activeSlide === TOTAL;
  });
}

function syncHistory(slideNumber, replaceState = false) {
  const url = new URL(window.location.href);
  url.hash = `s${slideNumber}`;

  const state = { slide: slideNumber };
  if (replaceState) {
    window.history.replaceState(state, '', url);
    return;
  }

  const activeHash = parseSlideFromHash(window.location.hash);
  if (activeHash === slideNumber) return;
  window.history.pushState(state, '', url);
}

function buildDots() {
  for (let slideIndex = 1; slideIndex <= TOTAL; slideIndex += 1) {
    const container = document.getElementById(`dots-${slideIndex}`);
    if (!container) continue;

    container.innerHTML = '';

    for (let dotIndex = 1; dotIndex <= TOTAL; dotIndex += 1) {
      const dot = document.createElement('div');
      dot.className = 'dot';
      dot.title = `Slide ${dotIndex}`;
      dot.setAttribute('role', 'button');
      dot.setAttribute('tabindex', '0');
      dot.setAttribute('aria-label', `Ir para o slide ${dotIndex}`);
      dot.addEventListener('click', () => {
        goTo(dotIndex);
      });
      dot.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          goTo(dotIndex);
        }
      });
      container.appendChild(dot);
    }
  }

  updateDots(current);
}

function renderWithoutAnimation(targetSlide, options = {}) {
  const { updateHistory = false, replaceHistory = false } = options;

  slides.forEach((slide, index) => {
    const isActive = index + 1 === targetSlide;
    slide.classList.toggle('active', isActive);
    slide.classList.remove('exit');
    clearInlineTransitionStyles(slide);
  });

  current = targetSlide;
  updateDots(current);
  updateNavButtons(current);

  if (updateHistory) {
    syncHistory(current, replaceHistory);
  }
}

function goTo(targetSlide, options = {}) {
  const { updateHistory = true, replaceHistory = false, animate = true } = options;
  const nextSlideNumber = clampSlideNumber(targetSlide);

  if (!animate) {
    renderWithoutAnimation(nextSlideNumber, { updateHistory, replaceHistory });
    return;
  }

  if (nextSlideNumber === current || isTransitioning) return;

  const previousSlideNumber = current;
  const oldSlide = getSlide(previousSlideNumber);
  const newSlide = getSlide(nextSlideNumber);
  const isForward = nextSlideNumber > previousSlideNumber;

  if (!oldSlide || !newSlide) return;

  isTransitioning = true;

  oldSlide.classList.add('exit');
  oldSlide.classList.remove('active');
  oldSlide.style.transition = 'opacity .45s ease, transform .45s ease';
  oldSlide.style.transform = `translateX(${isForward ? '-60px' : '60px'})`;
  oldSlide.style.opacity = '0';

  newSlide.style.transition = 'none';
  newSlide.style.transform = `translateX(${isForward ? '60px' : '-60px'})`;
  newSlide.style.opacity = '0';
  newSlide.classList.add('active');

  newSlide.getBoundingClientRect();

  newSlide.style.transition = 'opacity .45s ease, transform .45s ease';
  requestAnimationFrame(() => {
    newSlide.style.transform = 'translateX(0)';
    newSlide.style.opacity = '1';
  });

  current = nextSlideNumber;
  updateDots(current);
  updateNavButtons(current);

  if (updateHistory) {
    syncHistory(current, replaceHistory);
  }

  window.setTimeout(() => {
    oldSlide.classList.remove('exit');
    clearInlineTransitionStyles(oldSlide);
    clearInlineTransitionStyles(newSlide);
    isTransitioning = false;
  }, TRANSITION_MS);
}

function getOpenSubslide() {
  return document.querySelector('.subslide-overlay.is-open');
}

function openSubslide(name) {
  const overlay = document.querySelector(`[data-subslide="${name}"]`);
  if (!overlay) return;

  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  const closeButton = overlay.querySelector('.subslide-close');
  if (closeButton) closeButton.focus();
}

function closeSubslide() {
  const overlay = getOpenSubslide();
  if (!overlay) return;

  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
}

function initSubslides() {
  document.querySelectorAll('[data-subslide-open]').forEach((trigger) => {
    const target = trigger.getAttribute('data-subslide-open');
    trigger.addEventListener('click', () => openSubslide(target));
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openSubslide(target);
      }
    });
  });

  document.querySelectorAll('[data-subslide-close]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      closeSubslide();
    });
  });
}

function nextSlide() {
  goTo(current + 1);
}

function prevSlide() {
  goTo(current - 1);
}

document.addEventListener('keydown', (event) => {
  if (getOpenSubslide()) {
    if (event.key === 'Escape') closeSubslide();
    return;
  }

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextSlide();
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') prevSlide();
});

let touchX = 0;
document.addEventListener('touchstart', (event) => {
  touchX = event.changedTouches[0].clientX;
});
document.addEventListener('touchend', (event) => {
  if (getOpenSubslide()) return;

  const deltaX = event.changedTouches[0].clientX - touchX;
  if (Math.abs(deltaX) > 50) {
    if (deltaX < 0) nextSlide();
    else prevSlide();
  }
});

window.addEventListener('popstate', (event) => {
  const stateSlide = clampSlideNumber(event.state?.slide);
  const hashSlide = parseSlideFromHash(window.location.hash);
  const targetSlide = hashSlide || stateSlide || 1;
  goTo(targetSlide, { updateHistory: false, animate: false });
});

window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
window.goTo = goTo;
window.openSubslide = openSubslide;
window.closeSubslide = closeSubslide;

const initialSlide = parseSlideFromHash(window.location.hash) || 1;
current = initialSlide;
initSubslides();
buildDots();
renderWithoutAnimation(initialSlide, { updateHistory: true, replaceHistory: true });
initMenu();

// ── MENU ──────────────────────────────────────────
function updateMenuActive(slideNumber) {
  document.querySelectorAll('.slide-menu-item').forEach((btn, i) => {
    btn.classList.toggle('smenu-active', i + 1 === slideNumber);
  });
}

function openMenu() {
  document.getElementById('menuToggle').classList.add('is-open');
  document.getElementById('menuToggle').setAttribute('aria-expanded', 'true');
  document.getElementById('slideMenu').classList.add('is-open');
  document.getElementById('slideMenu').setAttribute('aria-hidden', 'false');
  document.getElementById('menuBackdrop').classList.add('is-open');
}

function closeMenu() {
  document.getElementById('menuToggle').classList.remove('is-open');
  document.getElementById('menuToggle').setAttribute('aria-expanded', 'false');
  document.getElementById('slideMenu').classList.remove('is-open');
  document.getElementById('slideMenu').setAttribute('aria-hidden', 'true');
  document.getElementById('menuBackdrop').classList.remove('is-open');
}

function initMenu() {
  document.getElementById('menuToggle').addEventListener('click', () => {
    const isOpen = document.getElementById('slideMenu').classList.contains('is-open');
    isOpen ? closeMenu() : openMenu();
  });

  document.getElementById('menuBackdrop').addEventListener('click', closeMenu);

  document.querySelectorAll('.slide-menu-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      goTo(Number.parseInt(btn.dataset.goto, 10));
      closeMenu();
    });
  });

  document.getElementById('pdfBtn').addEventListener('click', generatePDF);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  updateMenuActive(current);
}

// ── PDF EXPORT ─────────────────────────────────────
async function generatePDF() {
  if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
    alert('Bibliotecas não carregadas. Verifique sua conexão e tente novamente.');
    return;
  }

  closeMenu();

  const btn = document.getElementById('pdfBtn');
  btn.disabled = true;

  // Overlay de progresso
  const overlay = document.createElement('div');
  overlay.className = 'pdf-progress-overlay';
  overlay.innerHTML = `
    <div class="pdf-progress-spinner"></div>
    <div class="pdf-progress-title" id="pdfTitle">Preparando exportação…</div>
    <div class="pdf-progress-sub" id="pdfSub">Aguarde, isso pode levar alguns segundos</div>
    <div class="pdf-progress-bar-wrap"><div class="pdf-progress-bar" id="pdfBar"></div></div>
  `;
  document.body.appendChild(overlay);

  // Oculta elementos de UI do menu para não aparecerem na captura
  const uiEls = document.querySelectorAll('.menu-toggle, .slide-menu-backdrop, .slide-menu');
  uiEls.forEach(el => { el.dataset.pdfHidden = el.style.visibility; el.style.visibility = 'hidden'; });

  const savedCurrent = current;
  const allSlides = Array.from(document.querySelectorAll('.slide'));
  const pres = document.getElementById('pres');
  const W = pres.offsetWidth;
  const H = pres.offsetHeight;

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: W >= H ? 'landscape' : 'portrait',
      unit: 'px',
      format: [W, H],
      compress: true,
    });

    // Desativa transições durante captura
    allSlides.forEach(s => { s.style.transition = 'none'; });

    for (let i = 1; i <= TOTAL; i++) {
      document.getElementById('pdfTitle').textContent = `Capturando slide ${i} de ${TOTAL}…`;
      document.getElementById('pdfSub').textContent = `${Math.round((i / TOTAL) * 100)}% concluído`;
      document.getElementById('pdfBar').style.width = `${Math.round((i / TOTAL) * 100)}%`;

      // Mostra apenas o slide atual
      allSlides.forEach((s, idx) => {
        const active = idx + 1 === i;
        s.style.opacity = active ? '1' : '0';
        s.style.transform = 'translateX(0)';
        s.classList.toggle('active', active);
      });

      // Aguarda o browser pintar
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise(r => setTimeout(r, 120));

      const canvas = await html2canvas(pres, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: W,
        height: H,
        windowWidth: W,
        windowHeight: H,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.93);
      if (i > 1) pdf.addPage([W, H], W >= H ? 'landscape' : 'portrait');
      pdf.addImage(imgData, 'JPEG', 0, 0, W, H);
    }

    document.getElementById('pdfTitle').textContent = 'Gerando arquivo…';
    document.getElementById('pdfBar').style.width = '100%';
    await new Promise(r => setTimeout(r, 200));

    pdf.save('jovem-produtivo-mt.pdf');

  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    alert('Erro ao gerar o PDF. Verifique o console e tente novamente.');
  } finally {
    // Restaura tudo
    allSlides.forEach(s => {
      s.style.transition = '';
      s.style.opacity = '';
      s.style.transform = '';
    });
    uiEls.forEach(el => { el.style.visibility = el.dataset.pdfHidden || ''; delete el.dataset.pdfHidden; });
    renderWithoutAnimation(savedCurrent);
    overlay.remove();
    btn.disabled = false;
  }
}

/*
   JOVEM PRODUTIVO MT - Navigation
*/

const slides = Array.from(document.querySelectorAll('.slide'));
const TOTAL = slides.length;
const TRANSITION_MS = 460;
const SLIDE_BASE_WIDTH = 1920;
const SLIDE_BASE_HEIGHT = 1080;

let current = 1;
let isTransitioning = false;
let fitFrame = null;

function fitPresentationToViewport() {
  const scaleX = window.innerWidth / SLIDE_BASE_WIDTH;
  const scaleY = window.innerHeight / SLIDE_BASE_HEIGHT;

  document.documentElement.style.setProperty(
    '--presentation-scale-x',
    String(Number.isFinite(scaleX) && scaleX > 0 ? scaleX : 1),
  );
  document.documentElement.style.setProperty(
    '--presentation-scale-y',
    String(Number.isFinite(scaleY) && scaleY > 0 ? scaleY : 1),
  );
}

function schedulePresentationFit() {
  if (fitFrame) {
    window.cancelAnimationFrame(fitFrame);
  }

  fitFrame = window.requestAnimationFrame(() => {
    fitPresentationToViewport();
    fitFrame = null;
  });
}

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

window.addEventListener('resize', schedulePresentationFit);
window.addEventListener('orientationchange', schedulePresentationFit);

window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
window.goTo = goTo;
window.openSubslide = openSubslide;
window.closeSubslide = closeSubslide;

fitPresentationToViewport();

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

function buildPDFPageList() {
  const pages = [];
  document.querySelectorAll('.slide-menu-item').forEach(btn => {
    const num = parseInt(btn.dataset.goto, 10);
    const label = btn.querySelector('.smenu-label').textContent.trim();
    pages.push({ type: 'slide', num, label: `${String(num).padStart(2, '0')} — ${label}`, id: `s${num}` });
    const slide = document.getElementById(`s${num}`);
    if (!slide) return;
    slide.querySelectorAll('.subslide-overlay').forEach(ov => {
      const name = ov.dataset.subslide;
      const titleEl = ov.querySelector('[id$="-title"]');
      const sub = titleEl ? titleEl.textContent.trim() : name;
      pages.push({ type: 'subslide', num, subName: name, label: `↳ ${sub}`, id: `sub-${name}` });
    });
  });
  return pages;
}

function showPDFSelector(pages) {
  return new Promise(resolve => {
    const sel = document.createElement('div');
    sel.className = 'pdf-selector-overlay';

    const items = pages.map(p => `
      <label class="pdf-sel-item${p.type === 'subslide' ? ' pdf-sel-subitem' : ''}">
        <input type="checkbox" class="pdf-sel-cb" data-id="${p.id}" checked>
        <span>${p.label}</span>
      </label>
    `).join('');

    sel.innerHTML = `
      <div class="pdf-selector-dialog">
        <div class="pdf-selector-header">
          <i class="fa-solid fa-file-pdf"></i>
          <span>Exportar PDF — Selecione as páginas</span>
        </div>
        <div class="pdf-selector-body">
          <div class="pdf-selector-actions">
            <button class="pdf-sel-tag-btn" id="pdfSelAll">Tudo</button>
            <button class="pdf-sel-tag-btn" id="pdfSelNone">Limpar</button>
            <button class="pdf-sel-tag-btn" id="pdfSelSlides">Só slides</button>
            <button class="pdf-sel-tag-btn" id="pdfSelSubs">Só subslides</button>
          </div>
          <div class="pdf-selector-list">${items}</div>
        </div>
        <div class="pdf-selector-footer">
          <button class="pdf-sel-cancel" id="pdfSelCancel">Cancelar</button>
          <button class="pdf-sel-generate" id="pdfSelGenerate">
            <i class="fa-solid fa-file-pdf"></i> Gerar PDF
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(sel);

    const cbs = () => Array.from(sel.querySelectorAll('.pdf-sel-cb'));

    document.getElementById('pdfSelAll').addEventListener('click', () => {
      cbs().forEach(cb => { cb.checked = true; });
    });
    document.getElementById('pdfSelNone').addEventListener('click', () => {
      cbs().forEach(cb => { cb.checked = false; });
    });
    document.getElementById('pdfSelSlides').addEventListener('click', () => {
      cbs().forEach(cb => {
        const page = pages.find(p => p.id === cb.dataset.id);
        cb.checked = !!(page && page.type === 'slide');
      });
    });
    document.getElementById('pdfSelSubs').addEventListener('click', () => {
      cbs().forEach(cb => {
        const page = pages.find(p => p.id === cb.dataset.id);
        cb.checked = !!(page && page.type === 'subslide');
      });
    });
    document.getElementById('pdfSelCancel').addEventListener('click', () => {
      sel.remove();
      resolve(null);
    });
    document.getElementById('pdfSelGenerate').addEventListener('click', () => {
      const selected = cbs().filter(cb => cb.checked).map(cb => cb.dataset.id);
      sel.remove();
      resolve(selected);
    });
  });
}

// Forces every slide iframe to fully load (fonts + icons included) before capture.
// Lazy iframes that the user never visited will be blank — this fixes that.
async function preloadSlideIframes() {
  const iframes = Array.from(document.querySelectorAll('.slide iframe'));
  for (const frame of iframes) {
    const ready = frame.contentDocument &&
                  frame.contentDocument.readyState === 'complete' &&
                  frame.contentDocument.body &&
                  frame.contentDocument.body.childElementCount > 0;
    if (!ready) {
      await new Promise(resolve => {
        frame.addEventListener('load', resolve, { once: true });
        frame.removeAttribute('loading');
        frame.src = frame.getAttribute('src'); // trigger lazy iframe to load
      });
      // Let fonts/icons finish painting after the document loads
      await new Promise(r => setTimeout(r, 800));
    }
  }
}

async function generatePDF() {
  if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
    alert('Bibliotecas não carregadas. Verifique sua conexão e tente novamente.');
    return;
  }

  closeMenu();

  const allPages = buildPDFPageList();
  const selectedIds = await showPDFSelector(allPages);
  if (!selectedIds || selectedIds.length === 0) return;

  const pagesToExport = allPages.filter(p => selectedIds.includes(p.id));

  const btn = document.getElementById('pdfBtn');
  btn.disabled = true;

  const overlay = document.createElement('div');
  overlay.className = 'pdf-progress-overlay';
  overlay.innerHTML = `
    <div class="pdf-progress-spinner"></div>
    <div class="pdf-progress-title" id="pdfTitle">Preparando exportação…</div>
    <div class="pdf-progress-sub" id="pdfSub">Aguarde, isso pode levar alguns segundos</div>
    <div class="pdf-progress-bar-wrap"><div class="pdf-progress-bar" id="pdfBar"></div></div>
  `;
  document.body.appendChild(overlay);

  // Garante que todos os iframes (lazy) estejam carregados e pintados antes de capturar
  document.getElementById('pdfTitle').textContent = 'Carregando slides…';
  await preloadSlideIframes();

  // Oculta menu e barra inferior de navegação
  const uiEls = document.querySelectorAll('.menu-toggle, .slide-menu-backdrop, .slide-menu, .nav-bar');
  uiEls.forEach(el => { el.dataset.pdfHidden = el.style.visibility; el.style.visibility = 'hidden'; });

  const savedCurrent = current;
  const allSlides = Array.from(document.querySelectorAll('.slide'));
  const pres = document.getElementById('pres');

  // Usa as dimensões base do slide (1920×1080), não as visuais escaladas
  const W = SLIDE_BASE_WIDTH;
  const H = SLIDE_BASE_HEIGHT;

  // Neutraliza o transform CSS (position:fixed + scale) para o html2canvas
  // capturar o elemento na posição real, não na visual transformada
  const savedPresStyle = pres.style.cssText;
  pres.style.position = 'absolute';
  pres.style.top = '0';
  pres.style.left = '0';
  pres.style.transform = 'none';
  pres.style.transformOrigin = 'top left';
  pres.style.width = `${W}px`;
  pres.style.height = `${H}px`;

  // Desativa todas as animações CSS para que os elementos apareçam
  // imediatamente no estado final (evita título/kicker invisíveis)
  const noAnimStyle = document.createElement('style');
  noAnimStyle.id = 'pdf-no-anim';
  noAnimStyle.textContent = '* { animation-duration: 0.001ms !important; animation-delay: 0ms !important; }';
  document.head.appendChild(noAnimStyle);

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [W, H],
      compress: true,
    });

    allSlides.forEach(s => { s.style.transition = 'none'; });

    let firstPage = true;

    for (let pi = 0; pi < pagesToExport.length; pi++) {
      const page = pagesToExport[pi];
      const pct = Math.round(((pi + 1) / pagesToExport.length) * 100);
      document.getElementById('pdfTitle').textContent = `Capturando ${pi + 1} de ${pagesToExport.length}…`;
      document.getElementById('pdfSub').textContent = `${pct}% concluído`;
      document.getElementById('pdfBar').style.width = `${pct}%`;

      allSlides.forEach((s, idx) => {
        const active = idx + 1 === page.num;
        s.style.opacity = active ? '1' : '0';
        s.style.transform = 'translateX(0)';
        s.classList.toggle('active', active);
      });

      if (page.type === 'subslide') {
        const subOv = document.querySelector(`[data-subslide="${page.subName}"]`);
        if (subOv) { subOv.classList.add('is-open'); subOv.setAttribute('aria-hidden', 'false'); }
      } else {
        document.querySelectorAll('.subslide-overlay.is-open').forEach(ov => {
          ov.classList.remove('is-open'); ov.setAttribute('aria-hidden', 'true');
        });
      }

      // Aguarda o browser re-pintar com o slide ativo antes de capturar
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise(r => setTimeout(r, 350));

      let canvas;
      const SCALE = 2; // 2× = 3840×2160 — igual à resolução que o usuário vê em HiDPI

      if (page.type === 'subslide') {
        canvas = await html2canvas(document.body, {
          scale: SCALE, useCORS: true, allowTaint: true, logging: false,
          width: W, height: H, windowWidth: W, windowHeight: H,
          scrollX: 0, scrollY: 0, x: 0, y: 0,
        });
      } else {
        const slideEl = document.getElementById(`s${page.num}`);
        const iframeEl = slideEl ? slideEl.querySelector('iframe') : null;

        if (iframeEl && iframeEl.contentDocument && iframeEl.contentDocument.documentElement) {
          // Captura o iframe já vivo na tela — fontes e ícones já estão renderizados.
          // Informa ao html2canvas as dimensões reais do slide para que o layout
          // respeitoso ao 100%/100% do iframe seja calculado em 1920×1080.
          canvas = await html2canvas(iframeEl.contentDocument.documentElement, {
            scale: SCALE, useCORS: true, allowTaint: true, logging: false,
            width: W, height: H, windowWidth: W, windowHeight: H,
            scrollX: 0, scrollY: 0,
          });
        } else {
          // Slide inline convencional — captura o container da apresentação.
          canvas = await html2canvas(pres, {
            scale: SCALE, useCORS: true, allowTaint: true, logging: false,
            width: W, height: H, windowWidth: W, windowHeight: H,
            scrollX: 0, scrollY: 0, x: 0, y: 0,
          });
        }
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.97);
      if (!firstPage) pdf.addPage([W, H], 'landscape');
      pdf.addImage(imgData, 'JPEG', 0, 0, W, H);
      firstPage = false;

      if (page.type === 'subslide') {
        const subOv = document.querySelector(`[data-subslide="${page.subName}"]`);
        if (subOv) { subOv.classList.remove('is-open'); subOv.setAttribute('aria-hidden', 'true'); }
      }
    }

    document.getElementById('pdfTitle').textContent = 'Gerando arquivo…';
    document.getElementById('pdfBar').style.width = '100%';
    await new Promise(r => setTimeout(r, 200));

    pdf.save('jovem-produtivo-mt.pdf');

  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    alert('Erro ao gerar o PDF. Verifique o console e tente novamente.');
  } finally {
    allSlides.forEach(s => {
      s.style.transition = '';
      s.style.opacity = '';
      s.style.transform = '';
    });
    document.querySelectorAll('.subslide-overlay.is-open').forEach(ov => {
      ov.classList.remove('is-open'); ov.setAttribute('aria-hidden', 'true');
    });
    // Restaura o transform/posição original do #pres e as animações
    pres.style.cssText = savedPresStyle;
    document.getElementById('pdf-no-anim')?.remove();
    uiEls.forEach(el => { el.style.visibility = el.dataset.pdfHidden || ''; delete el.dataset.pdfHidden; });
    renderWithoutAnimation(savedCurrent);
    overlay.remove();
    btn.disabled = false;
  }
}

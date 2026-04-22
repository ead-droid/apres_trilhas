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

function nextSlide() {
  goTo(current + 1);
}

function prevSlide() {
  goTo(current - 1);
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextSlide();
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') prevSlide();
});

let touchX = 0;
document.addEventListener('touchstart', (event) => {
  touchX = event.changedTouches[0].clientX;
});
document.addEventListener('touchend', (event) => {
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

const initialSlide = parseSlideFromHash(window.location.hash) || 1;
current = initialSlide;
buildDots();
renderWithoutAnimation(initialSlide, { updateHistory: true, replaceHistory: true });

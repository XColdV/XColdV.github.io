/* ============================================================
   Firefly Private Server | Shared Interactions
   ============================================================ */

let revealObserver;

document.addEventListener('DOMContentLoaded', () => {
  bindGlobalEvents();
  initializePageState();
});

function bindGlobalEvents() {
  if (document.body.dataset.fireflyBound === 'true') {
    return;
  }

  document.body.dataset.fireflyBound = 'true';

  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleDocumentKeydown);
}

function initializePageState() {
  setupMobileNavState();
  setupRevealObserver();
  highlightPlatformSwitcher();
}

function handleDocumentClick(event) {
  const toggle = event.target.closest('.menu-toggle');
  if (toggle) {
    event.preventDefault();
    toggleMobileNav();
    return;
  }

  const navLink = event.target.closest('.nav-links a, .nav-cta, .platform-pill, .back-link');
  if (navLink) {
    closeMobileNav();
  }

  const faqButton = event.target.closest('.faq-q');
  if (faqButton) {
    toggleFaqItem(faqButton);
    return;
  }

  const tabButton = event.target.closest('.tab-btn');
  if (tabButton) {
    activateTab(tabButton);
    return;
  }

  const copyButton = event.target.closest('.copy-btn');
  if (copyButton) {
    copyCodeBlock(copyButton);
  }
}

function handleDocumentKeydown(event) {
  if (event.key === 'Escape') {
    closeMobileNav();
  }
}

function setupMobileNavState() {
  const menu = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (!menu || !navLinks) {
    return;
  }

  menu.setAttribute('aria-expanded', navLinks.classList.contains('open') ? 'true' : 'false');
}

function toggleMobileNav() {
  const menu = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (!menu || !navLinks) {
    return;
  }

  const shouldOpen = !navLinks.classList.contains('open');
  navLinks.classList.toggle('open', shouldOpen);
  menu.classList.toggle('active', shouldOpen);
  menu.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
  document.body.classList.toggle('menu-open', shouldOpen);
}

function closeMobileNav() {
  const menu = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (!menu || !navLinks) {
    return;
  }

  navLinks.classList.remove('open');
  menu.classList.remove('active');
  menu.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}

function toggleFaqItem(button) {
  const item = button.closest('.faq-item');
  const list = item?.parentElement;

  if (!item || !list) {
    return;
  }

  const isOpen = item.classList.contains('is-open');

  list.querySelectorAll('.faq-item').forEach((entry) => {
    entry.classList.remove('is-open');
    const entryButton = entry.querySelector('.faq-q');
    if (entryButton) {
      entryButton.setAttribute('aria-expanded', 'false');
    }
  });

  if (!isOpen) {
    item.classList.add('is-open');
    button.setAttribute('aria-expanded', 'true');
  }
}

function activateTab(button) {
  const targetId = button.dataset.tab;
  const wrapper = button.closest('.guide-main') || document;

  if (!targetId) {
    return;
  }

  wrapper.querySelectorAll('.tab-btn').forEach((tab) => {
    tab.classList.remove('active');
    tab.setAttribute('aria-selected', 'false');
  });

  wrapper.querySelectorAll('.tab-content').forEach((panel) => {
    panel.classList.remove('active');
  });

  button.classList.add('active');
  button.setAttribute('aria-selected', 'true');

  const panel = wrapper.querySelector(`#${targetId}`);
  if (panel) {
    panel.classList.add('active');
  }
}

async function copyCodeBlock(button) {
  const block = button.closest('.copy-block');
  const code = block?.querySelector('code');

  if (!code) {
    return;
  }

  const text = code.textContent.trim();
  const originalText = button.textContent;

  try {
    await navigator.clipboard.writeText(text);
    button.textContent = 'Copied';
    button.classList.add('is-copied');
  } catch (error) {
    button.textContent = 'Failed';
  }

  window.setTimeout(() => {
    button.textContent = originalText;
    button.classList.remove('is-copied');
  }, 1800);
}

function setupRevealObserver() {
  if (revealObserver) {
    revealObserver.disconnect();
  }

  const revealItems = document.querySelectorAll('.reveal');
  if (!revealItems.length) {
    return;
  }

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -32px 0px'
  });

  revealItems.forEach((item) => revealObserver.observe(item));
}

function highlightPlatformSwitcher() {
  const currentPlatform = document.body.dataset.platform;
  if (!currentPlatform) {
    return;
  }

  document.querySelectorAll('.platform-pill').forEach((link) => {
    const href = link.getAttribute('href') || '';
    const isActive = href.includes(`/${currentPlatform}/`) || href.includes(`\\${currentPlatform}\\`);
    link.classList.toggle('is-active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

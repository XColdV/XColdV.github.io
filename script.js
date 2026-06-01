/* ============================================================
   Firefly Private Server | Shared Interactions
   ============================================================ */

let revealObserver;

document.addEventListener("DOMContentLoaded", () => {
  bindGlobalEvents();
  initializePageState();
  initLanguageSwitcher();
});

function bindGlobalEvents() {
  if (document.body.dataset.fireflyBound === "true") {
    return;
  }

  document.body.dataset.fireflyBound = "true";

  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleDocumentKeydown);
}

function initializePageState() {
  setupMobileNavState();
  setupRevealObserver();
  highlightPlatformSwitcher();
  initPlatformPanels();
}

function handleDocumentClick(event) {
  const toggle = event.target.closest(".menu-toggle");
  if (toggle) {
    event.preventDefault();
    toggleMobileNav();
    return;
  }

  const navLink = event.target.closest(".nav-links a, .nav-cta, .back-link");
  if (navLink) {
    closeMobileNav();
  }

  // Platform panel switcher (unified guide page)
  const platformPill = event.target.closest(".platform-pill[data-platform]");
  if (platformPill) {
    event.preventDefault();
    closeMobileNav();
    switchPlatformPanel(platformPill.dataset.platform);
    return;
  }

  // Close mobile nav when clicking other platform pills (link-style)
  const anyPill = event.target.closest(".platform-pill");
  if (anyPill) {
    closeMobileNav();
  }

  const faqButton = event.target.closest(".faq-q");
  if (faqButton) {
    toggleFaqItem(faqButton);
    return;
  }

  const tabButton = event.target.closest(".tab-btn");
  if (tabButton) {
    activateTab(tabButton);
    return;
  }

  const copyButton = event.target.closest(".copy-btn");
  if (copyButton) {
    copyCodeBlock(copyButton);
  }

  const langButton = event.target.closest(".lang-btn");
  if (langButton) {
    switchLanguage(langButton.dataset.lang);
  }
}

function handleDocumentKeydown(event) {
  if (event.key === "Escape") {
    closeMobileNav();
  }
}

function setupMobileNavState() {
  const menu = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (!menu || !navLinks) {
    return;
  }

  menu.setAttribute(
    "aria-expanded",
    navLinks.classList.contains("open") ? "true" : "false",
  );
}

function toggleMobileNav() {
  const menu = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (!menu || !navLinks) {
    return;
  }

  const shouldOpen = !navLinks.classList.contains("open");
  navLinks.classList.toggle("open", shouldOpen);
  menu.classList.toggle("active", shouldOpen);
  menu.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
  document.body.classList.toggle("menu-open", shouldOpen);
}

function closeMobileNav() {
  const menu = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (!menu || !navLinks) {
    return;
  }

  navLinks.classList.remove("open");
  menu.classList.remove("active");
  menu.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
}

function toggleFaqItem(button) {
  const item = button.closest(".faq-item");
  const list = item?.parentElement;

  if (!item || !list) {
    return;
  }

  const isOpen = item.classList.contains("is-open");

  list.querySelectorAll(".faq-item").forEach((entry) => {
    entry.classList.remove("is-open");
    const entryButton = entry.querySelector(".faq-q");
    if (entryButton) {
      entryButton.setAttribute("aria-expanded", "false");
    }
  });

  if (!isOpen) {
    item.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
  }
}

function activateTab(button) {
  const targetId = button.dataset.tab;
  const wrapper = button.closest(".guide-main") || document;

  if (!targetId) {
    return;
  }

  wrapper.querySelectorAll(".tab-btn").forEach((tab) => {
    tab.classList.remove("active");
    tab.setAttribute("aria-selected", "false");
  });

  wrapper.querySelectorAll(".tab-content").forEach((panel) => {
    panel.classList.remove("active");
  });

  button.classList.add("active");
  button.setAttribute("aria-selected", "true");

  const panel = wrapper.querySelector(`#${targetId}`);
  if (panel) {
    panel.classList.add("active");
  }
}

async function copyCodeBlock(button) {
  const block = button.closest(".copy-block");
  const code = block?.querySelector("code");

  if (!code) {
    return;
  }

  // Trim each line to strip indentation added by HTML formatters
  const text = code.textContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
  const originalText = button.textContent;

  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied";
    button.classList.add("is-copied");
  } catch (error) {
    button.textContent = "Failed";
  }

  window.setTimeout(() => {
    button.textContent = originalText;
    button.classList.remove("is-copied");
  }, 1800);
}

function setupRevealObserver() {
  if (revealObserver) {
    revealObserver.disconnect();
  }

  const revealItems = document.querySelectorAll(".reveal");
  if (!revealItems.length) {
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          // Add stagger effect for multiple items
          const delay =
            Array.from(entry.target.parentElement.children).indexOf(
              entry.target,
            ) * 100;
          entry.target.style.transitionDelay = `${delay}ms`;
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px",
    },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

function highlightPlatformSwitcher() {
  const currentPlatform = document.body.dataset.platform;
  if (!currentPlatform) {
    return;
  }

  document.querySelectorAll(".platform-pill").forEach((link) => {
    const href = link.getAttribute("href") || "";
    const isActive =
      href.includes(`/${currentPlatform}/`) ||
      href.includes(`\\${currentPlatform}\\`);
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function initPlatformPanels() {
  // Only applies to pages with .platform-panels
  const panels = document.querySelector(".platform-panels");
  if (!panels) {
    return;
  }

  // Check URL hash to auto-select a platform on load
  const hash = (window.location.hash || "").replace("#", "").toLowerCase();
  const validPlatforms = ["android", "ios", "windows", "macos"];

  if (hash && validPlatforms.includes(hash)) {
    switchPlatformPanel(hash);
  } else {
    // Default: ensure first panel is active
    const firstPill = document.querySelector(".platform-pill[data-platform]");
    if (firstPill) {
      switchPlatformPanel(firstPill.dataset.platform);
    }
  }
}

function switchPlatformPanel(platform) {
  const panels = document.querySelectorAll(".platform-panel");
  const pills = document.querySelectorAll(".platform-pill[data-platform]");

  if (!panels.length) {
    return;
  }

  // Update pill active states
  pills.forEach((pill) => {
    const isActive = pill.dataset.platform === platform;
    pill.classList.toggle("is-active", isActive);
    if (isActive) {
      pill.setAttribute("aria-current", "page");
    } else {
      pill.removeAttribute("aria-current");
    }
  });

  // Switch visible panel
  panels.forEach((panel) => {
    panel.classList.remove("active");
  });

  const target = document.getElementById(`panel-${platform}`);
  if (target) {
    target.classList.add("active");
    // Update URL hash without scrolling
    history.replaceState(null, "", `#${platform}`);
    // Smooth scroll to top of panel
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    // Re-run reveal observer for newly visible elements
    setupRevealObserver();
  }
}

// Add smooth scroll behavior for anchor links
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href === "#" || href === "") return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
});

// Add parallax effect to hero section
window.addEventListener("scroll", () => {
  const heroVisual = document.querySelector(".hero-visual");
  if (heroVisual) {
    const scrolled = window.pageYOffset;
    heroVisual.style.transform = `translateY(${scrolled * 0.3}px)`;
  }
});

// Add hover effect enhancement for cards
document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(
    ".glass-card, .platform-card, .feature-card, .rank-card, .community-card",
  );

  cards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    });
  });
});

// Language Switcher Functionality
function initLanguageSwitcher() {
  const savedLang = localStorage.getItem("firefly-lang") || "en";
  switchLanguage(savedLang);
}

function switchLanguage(lang) {
  // Update active button state
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });

  // Update all elements with language data attributes
  document.querySelectorAll("[data-en][data-id]").forEach((element) => {
    if (lang === "id" && element.dataset.id) {
      element.textContent = element.dataset.id;
    } else if (element.dataset.en) {
      element.textContent = element.dataset.en;
    }
  });

  // Save preference
  localStorage.setItem("firefly-lang", lang);

  // Update HTML lang attribute
  document.documentElement.lang = lang === "id" ? "id" : "en";
}

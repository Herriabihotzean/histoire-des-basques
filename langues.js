"use strict";
const HB_KEY="herria_langue";
const HB_DEFAULT="fr";
const HB_HISTORY=true;
const HB_TRANSLATIONS={"eu": {"← retour à l’accueil": "← harrera-orrira itzuli", "haut de page ↑": "orriaren gaina ↑", "Histoire des Basques — Herria Bihotzean": "Eskualdunen istoria — Herria Bihotzean"}, "be": {"← retour à l’accueil": "← tourna à l’acuèlh", "haut de page ↑": "cap de pagine ↑", "Histoire des Basques — Herria Bihotzean": "Istoère deus Bàscous — Herria Bihotzean"}};
const HB_LABELS={"fr": {"fr": "français", "eu": "basque", "be": "béarnais"}, "eu": {"fr": "frantsesez", "eu": "eskuaraz", "be": "biarnesez"}, "be": {"fr": "francés", "eu": "bascou", "be": "biarnés"}};

/* Moteur stable de sélection des langues — sans rechargement. */
(function () {
  "use strict";

  if (window.__HERRIA_LANGUAGE_ENGINE__) return;
  window.__HERRIA_LANGUAGE_ENGINE__ = true;

  const VALID_LANGUAGES = new Set(["fr", "eu", "be"]);
  const textOriginals = new WeakMap();
  const attributeOriginals = new WeakMap();
  let pageLanguage = null;
  let currentLanguage = "fr";
  let observer = null;
  let applying = false;

  function generalLanguage() {
    try {
      return localStorage.getItem(HB_KEY) === "eu" ? "eu" : "fr";
    } catch (_error) {
      return HB_DEFAULT || "fr";
    }
  }

  function lookup(original, language) {
    if (language === "fr") return original;
    const clean = String(original).trim();
    if (!clean) return original;
    const dictionary = (HB_TRANSLATIONS && HB_TRANSLATIONS[language]) || {};
    let translated = dictionary[clean];
    if (!translated) {
      const numbered = clean.match(/^(\d+\.\s*)(.+)$/);
      if (numbered && dictionary[numbered[2]]) {
        translated = numbered[1] + dictionary[numbered[2]];
      }
    }
    return translated ? String(original).replace(clean, translated) : original;
  }

  function rememberTextNode(node) {
    if (!textOriginals.has(node)) textOriginals.set(node, node.nodeValue || "");
  }

  function translateTextNode(node, language) {
    if (!node || !node.parentElement) return;
    if (["SCRIPT", "STYLE", "TEXTAREA", "NOSCRIPT"].includes(node.parentElement.tagName)) return;
    if (node.parentElement.closest(".language-switcher")) return;
    rememberTextNode(node);
    const original = textOriginals.get(node);
    const next = language === "fr" ? original : lookup(original, language);
    if (node.nodeValue !== next) node.nodeValue = next;
  }

  function translateAttributes(element, language) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return;
    const names = ["placeholder", "title", "aria-label", "alt"];
    let originals = attributeOriginals.get(element);
    if (!originals) {
      originals = {};
      attributeOriginals.set(element, originals);
    }
    for (const name of names) {
      if (!element.hasAttribute(name)) continue;
      if (!(name in originals)) originals[name] = element.getAttribute(name) || "";
      const original = originals[name];
      const next = language === "fr" ? original : lookup(original, language);
      if (element.getAttribute(name) !== next) element.setAttribute(name, next);
    }
  }

  function translateSubtree(root, language) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root, language);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    const element = root.nodeType === Node.ELEMENT_NODE ? root : null;
    if (element) translateAttributes(element, language);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) translateTextNode(node, language);
      else translateAttributes(node, language);
    }
  }

  function switchHistorySection(language) {
    if (!HB_HISTORY) return;
    document.querySelectorAll("[data-history-lang]").forEach((section) => {
      section.hidden = section.dataset.historyLang !== language;
    });
  }

  function updateButtons(language) {
    const labels = HB_LABELS[language] || HB_LABELS.fr;
    document.querySelectorAll(".language-choice").forEach((button) => {
      const code = button.dataset.lang;
      const label = button.querySelector(".language-label");
      if (label) label.textContent = labels[code] || "";
      const active = code === language;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
      button.setAttribute("aria-label", labels[code] || "");
    });
  }

  function buildSwitcher() {
    if (document.querySelector(".language-switcher")) return;
    const nav = document.createElement("nav");
    nav.className = "language-switcher";
    nav.setAttribute("aria-label", "Choix de la langue");
    const languages = HB_HISTORY ? ["fr", "eu", "be"] : ["fr", "eu"];
    const images = {
      fr: "blason-france.svg",
      eu: "blason-navarre.svg",
      be: "blason-bearn.svg"
    };
    for (const language of languages) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "language-choice";
      button.dataset.lang = language;
      const image = document.createElement("img");
      image.src = images[language];
      image.alt = "";
      const label = document.createElement("span");
      label.className = "language-label";
      button.append(image, label);
      button.addEventListener("click", () => setLanguage(language));
      nav.appendChild(button);
    }
    document.body.insertBefore(nav, document.body.firstChild);
  }

  function setLanguage(requestedLanguage, options = {}) {
    let language = VALID_LANGUAGES.has(requestedLanguage) ? requestedLanguage : "fr";
    if (!HB_HISTORY && language === "be") language = "fr";

    if (HB_HISTORY) {
      pageLanguage = language;
      if (language !== "be") {
        try { localStorage.setItem(HB_KEY, language); } catch (_error) {}
      }
    } else {
      try { localStorage.setItem(HB_KEY, language); } catch (_error) {}
    }

    currentLanguage = language;
    applying = true;
    switchHistorySection(language);
    translateSubtree(document.body, language);
    document.documentElement.lang = language === "eu" ? "eu" : language === "be" ? "oc" : "fr";
    updateButtons(language);
    applying = false;

    if (!options.silent) {
      document.dispatchEvent(new CustomEvent("herria-language-change", {
        detail: { lang: language }
      }));
    }
  }

  function startObserver() {
    observer = new MutationObserver((mutations) => {
      if (applying) return;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) translateSubtree(node, currentLanguage);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function initialise() {
    buildSwitcher();
    const initial = HB_HISTORY ? generalLanguage() : generalLanguage();
    pageLanguage = initial;
    setLanguage(initial, { silent: true });
    startObserver();
  }

  window.HerriaLanguages = {
    setLanguage,
    getLanguage: () => currentLanguage,
    getGeneralLanguage: generalLanguage
  };
  window.hbSetLanguage = setLanguage;
  window.hbCurrentLanguage = () => currentLanguage;

  window.addEventListener("storage", (event) => {
    if (event.key !== HB_KEY || HB_HISTORY) return;
    setLanguage(event.newValue === "eu" ? "eu" : "fr");
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, { once: true });
  } else {
    initialise();
  }
})();

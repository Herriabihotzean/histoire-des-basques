"use strict";
const HB_KEY = "herria_langue";
const HB_LABELS = {
  fr: { fr: "français", eu: "basque", be: "béarnais" },
  eu: { fr: "frantsesez", eu: "eskuaraz", be: "biarnesez" },
  be: { fr: "francés", eu: "bascou", be: "biarnés" }
};
const HB_LISTEN = { fr: "écouter", eu: "entzun", be: "escouta" };
let hbTextLanguage = "fr";

function hbGeneralLanguage() { return localStorage.getItem(HB_KEY) === "eu" ? "eu" : "fr"; }
function hbUpdateButtons() {
  const labels = HB_LABELS[hbTextLanguage] || HB_LABELS.fr;
  document.querySelectorAll(".language-choice").forEach(button => {
    const code = button.dataset.lang;
    button.querySelector(".language-label").textContent = labels[code];
    const active = code === hbTextLanguage;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const listen = document.querySelector(".audio-open-button");
  if (listen) listen.textContent = HB_LISTEN[hbTextLanguage];
  const home = document.querySelector(".floating-home");
  if (home) home.textContent = hbTextLanguage === "eu" ? "harrera" : hbTextLanguage === "be" ? "acuèlh" : "accueil";
}
function hbSetTextLanguage(language) {
  hbTextLanguage = ["fr","eu","be"].includes(language) ? language : "fr";
  if (hbTextLanguage !== "be") localStorage.setItem(HB_KEY, hbTextLanguage);
  document.querySelectorAll("[data-history-lang]").forEach(section => { section.hidden = section.dataset.historyLang !== hbTextLanguage; });
  document.documentElement.lang = hbTextLanguage === "eu" ? "eu" : hbTextLanguage === "be" ? "oc" : "fr";
  hbUpdateButtons();
  document.dispatchEvent(new CustomEvent("herria-language-change", { detail: { lang: hbTextLanguage } }));
}
function hbBuildSwitcher() {
  const nav=document.createElement("nav"); nav.className="language-switcher"; nav.setAttribute("aria-label","Langues");
  const images={fr:"blason-france.svg",eu:"blason-navarre.svg",be:"blason-bearn.svg"};
  ["fr","eu","be"].forEach(code=>{
    const button=document.createElement("button"); button.type="button"; button.className="language-choice"; button.dataset.lang=code;
    button.innerHTML=`<img src="${images[code]}" alt=""><span class="language-label"></span>`;
    button.addEventListener("click",()=>hbSetTextLanguage(code)); nav.appendChild(button);
  });
  return nav;
}
document.addEventListener("DOMContentLoaded",()=>{
  hbTextLanguage=hbGeneralLanguage();
  const sticky=document.querySelector(".sticky-language-audio");
  sticky.insertBefore(hbBuildSwitcher(),sticky.firstChild);
  hbSetTextLanguage(hbTextLanguage);
});

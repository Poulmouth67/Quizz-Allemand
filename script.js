// script.js — version corrigée : pause manuelle + "revoir mes fautes" fonctionnel

let vocabulary = [];
let score = 0;
let total = 0;
let usedWords = [];
let results = [];
let current = null;
let direction = "de-to-fr";
let selectedTheme = "";
let speedSetting = "normal";
let reviewingMistakes = false;
let awaitingContinue = false; // vrai quand on attend que l'utilisateur clique "Continuer"

// thèmes disponibles
const themes = ["maison", "sport", "sante", "ecole", "general"];

// éléments DOM
const menuEl = document.getElementById("menu");
const configEl = document.getElementById("config");
const quizEl = document.getElementById("quiz");
const nbWordsEl = document.getElementById("nbWords");
const configTitleEl = document.getElementById("config-title");
const themeLabelEl = document.getElementById("themeLabel");
const progressEl = document.getElementById("progress");
const questionEl = document.getElementById("question");
const answerEl = document.getElementById("answer");
const feedbackEl = document.getElementById("feedback");
const scoreEl = document.getElementById("score");
const validateBtn = document.getElementById("validate");
const skipBtn = document.getElementById("skip");
const startBtn = document.getElementById("startSession");
const backBtn = document.getElementById("backToMenu");
const speedEl = document.getElementById("speed");

// ----- initialisation des listeners -----
document.querySelectorAll(".theme-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    selectedTheme = btn.dataset.theme;
    await loadVocabulary(selectedTheme);
    menuEl.classList.add("hidden");
    configTitleEl.textContent = `Thème : ${selectedTheme}`;
    configEl.classList.remove("hidden");
    nbWordsEl.max = vocabulary.length;
    nbWordsEl.value = Math.min(10, vocabulary.length);
  });
});

backBtn.addEventListener("click", () => {
  configEl.classList.add("hidden");
  menuEl.classList.remove("hidden");
});

startBtn.addEventListener("click", () => {
  const requested = parseInt(nbWordsEl.value, 10) || 10;
  total = Math.min(Math.max(1, requested), vocabulary.length);
  speedSetting = speedEl ? speedEl.value : "normal";
  startQuiz();
});

validateBtn.addEventListener("click", () => {
  // si on attend le bouton "Continuer", ne pas valider
  if (awaitingContinue) return;
  checkAnswer();
});

skipBtn.addEventListener("click", () => {
  if (awaitingContinue) return;
  // enregistrer comme incorrect et passer à la suite
  recordResult("", false);
  scoreEl.textContent = `Score : ${score} / ${usedWords.length}`;
  nextQuestion();
});

// Enter : valide si possible, sinon ignore (ou active "Continuer" si on attend)
answerEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    if (awaitingContinue) {
      // si on attend la confirmation, simuler le clic sur "Continuer"
      const cont = document.getElementById("continueBtn");
      if (cont) cont.click();
    } else {
      validateBtn.click();
    }
  }
});

// ----- chargement vocabulaire -----
async function loadVocabulary(theme) {
  try {
    if (theme === "general") {
      const allFiles = ["maison", "sport", "sante", "ecole"];
      vocabulary = [];
      for (const f of allFiles) {
        const response = await fetch(`vocab/${f}.json`);
        if (!response.ok) throw new Error(`Impossible de charger vocab/${f}.json`);
        const data = await response.json();
        data.forEach(e => {
          e._src = f;
        });
        vocabulary = vocabulary.concat(data);
      }
    } else {
      const response = await fetch(`vocab/${theme}.json`);
      if (!response.ok) throw new Error(`Impossible de charger vocab/${theme}.json`);
      vocabulary = await response.json();
      vocabulary.forEach(e => (e._src = theme));
    }
    // indexes utiles
    vocabulary.forEach((e, i) => (e._idx = i));
  } catch (err) {
    alert("Erreur de chargement du vocabulaire ! Ouvre la console pour détails.");
    console.error(err);
  }
}

// ----- démarrer quiz -----
function startQuiz(fromMistakes = false) {
  configEl.classList.add("hidden");
  quizEl.classList.remove("hidden");
  score = 0;
  usedWords = [];
  results = [];
  reviewingMistakes = fromMistakes;
  awaitingContinue = false;
  themeLabelEl.textContent = reviewingMistakes ? "Révision des erreurs" : `Thème : ${selectedTheme}`;
  scoreEl.textContent = `Score : 0 / 0`;
  nextQuestion();
}

// ----- question suivante -----
function nextQuestion() {
  // réinitialiser état d'attente
  awaitingContinue = false;
  validateBtn.disabled = false;
  skipBtn.disabled = false;

  if (usedWords.length >= total) return endSession();

  let idx;
  do {
    idx = Math.floor(Math.random() * vocabulary.length);
  } while (usedWords.includes(idx));

  usedWords.push(idx);
  current = vocabulary[idx];
  direction = Math.random() < 0.5 ? "de-to-fr" : "fr-to-de";

  questionEl.textContent =
    direction === "de-to-fr"
      ? `Traduire en français : "${current.de}"`
      : `Traduire en allemand : "${current.fr}"`;

  answerEl.value = "";
  answerEl.focus();
  feedbackEl.textContent = "";
  feedbackEl.className = "";
  progressEl.textContent = `Mot ${usedWords.length} / ${total}`;
  scoreEl.textContent = `Score : ${score} / ${Math.max(usedWords.length - 1, 0)}`;
}

// ----- normalisation tolérante -----
function normalize(str) {
  if (!str && str !== "") return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'"\-\u2010-\u2015]/g, "") // apostrophes et tirets variés
    .replace(/[.,;:!?()]/g, "") // ponctuation courante
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// ----- calcul délai (utile uniquement pour bonnes réponses) -----
function getDelay(isCorrect) {
  const speeds = {
    fast: isCorrect ? 500 : 1500,
    normal: isCorrect ? 1000 : 2500,
    slow: isCorrect ? 1500 : 3000
  };
  return speeds[speedSetting] || 1000;
}

// ----- enregistrement résultat -----
function recordResult(givenRaw, isCorrect) {
  // on stocke la direction et les deux formes pour permettre la révision
  const entry = {
    de: current.de,
    fr: current.fr,
    direction, // "de-to-fr" ou "fr-to-de"
    expected: direction === "de-to-fr" ? current.fr : current.de,
    given: givenRaw,
    isCorrect
  };
  results.push(entry);
}

// ----- vérification réponse -----
function checkAnswer() {
  // si on est en attente de "Continuer", on ignore validation
  if (awaitingContinue) return;

  const userRaw = answerEl.value;
  const user = normalize(userRaw);
  const correct = normalize(direction === "de-to-fr" ? current.fr : current.de);

  const isCorrect = user === correct;
  recordResult(userRaw, isCorrect);

  // désactiver validations pendant l'affichage
  validateBtn.disabled = true;
  skipBtn.disabled = true;

  if (isCorrect) {
    feedbackEl.textContent = "✅ Correct !";
    feedbackEl.className = "correct";
    score++;
    scoreEl.textContent = `Score : ${score} / ${usedWords.length}`;
    // courte pause puis suivante (automatique pour les bonnes réponses)
    setTimeout(nextQuestion, getDelay(true));
  } else {
    // FAUX : afficher correction + bouton "Continuer" et attendre l'action utilisateur
    awaitingContinue = true;
    const expected = direction === "de-to-fr" ? current.fr : current.de;
    feedbackEl.innerHTML = `
      ❌ Faux — attendu : <strong>${expected}</strong>
      <div style="margin-top:10px;">
        <button id="continueBtn" style="padding:8px 12px; border-radius:6px;">Continuer</button>
      </div>
    `;
    feedbackEl.className = "wrong";

    // focus sur le bouton Continuer
    const contBtn = document.getElementById("continueBtn");
    contBtn.focus();
    contBtn.addEventListener("click", () => {
      awaitingContinue = false;
      // mise à jour du score affiché (reste inchangé)
      scoreEl.textContent = `Score : ${score} / ${usedWords.length}`;
      nextQuestion();
    });
  }
}

// ----- fin de session + option "revoir mes fautes" -----
function endSession() {
  const mistakes = results.filter(r => !r.isCorrect);
  // construction de la page de récap
  document.body.innerHTML = `
    <div style="padding:24px; text-align:center;">
      <h1>Session terminée 🎉</h1>
      <p>${reviewingMistakes ? "Fin de la révision des erreurs" : `Thème : <strong>${selectedTheme}</strong>`}</p>
      <p>Score : <strong>${score} / ${total}</strong></p>
      <h2>Récapitulatif</h2>
      <ul id="recap" style="text-align:left; max-width:800px; margin:12px auto;"></ul>
      <div style="margin-top:16px;">
        <button id="restart" style="margin-right:8px; padding:8px 12px;">Recommencer</button>
        <button id="toMenu" style="margin-right:8px; padding:8px 12px;">Retour au menu</button>
        ${!reviewingMistakes && mistakes.length > 0 ? `<button id="reviewMistakes" style="padding:8px 12px;">Revoir mes fautes (${mistakes.length})</button>` : ""}
      </div>
    </div>
  `;

  const recapEl = document.getElementById("recap");
  results.forEach(r => {
    const li = document.createElement("li");
    const mark = r.isCorrect ? "🟢" : "🔴";
    li.innerHTML = `${mark} <strong>${r.direction === "de-to-fr" ? r.de : r.fr}</strong> — ta réponse : "${r.given || "—"}" — attendu : "${r.expected}"`;
    recapEl.appendChild(li);
  });

  document.getElementById("restart").addEventListener("click", () => {
    // relancer même thème / même configuration (retour à la page)
    location.reload();
  });
  document.getElementById("toMenu").addEventListener("click", () => {
    location.href = location.pathname;
  });

  const reviewBtn = document.getElementById("reviewMistakes");
  if (reviewBtn) {
    reviewBtn.addEventListener("click", () => {
      // reconstruire vocabulary à partir des erreurs (en conservant de/fr)
      const mistakesData = mistakes.map(m => ({ de: m.de, fr: m.fr }));
      vocabulary = mistakesData;
      total = vocabulary.length;
      // démarrer la révision (mode special)
      startQuiz(true);
    });
  }
}

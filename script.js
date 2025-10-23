// --- Variables ---
let vocabulary = [];
let score = 0;
let total = 0;
let usedWords = [];
let results = [];
let current = null;
let direction = "de-to-fr";
let selectedTheme = "";

// thèmes disponibles (doivent exister en vocab/*.json)
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

// Attacher événements thème
document.querySelectorAll(".theme-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    selectedTheme = btn.dataset.theme;
    // charger le vocab (sans démarrer encore)
    await loadVocabulary(selectedTheme);
    // afficher écran config
    menuEl.classList.add("hidden");
    configTitleEl.textContent = `Thème : ${selectedTheme}`;
    configEl.classList.remove("hidden");
    // régler valeur max
    nbWordsEl.max = vocabulary.length;
    nbWordsEl.value = Math.min(10, vocabulary.length);
  });
});

// Bouton retour au menu
backBtn.addEventListener("click", () => {
  configEl.classList.add("hidden");
  menuEl.classList.remove("hidden");
});

// Démarrer session (sans prompt)
startBtn.addEventListener("click", () => {
  const requested = parseInt(nbWordsEl.value, 10) || 10;
  total = Math.min(Math.max(1, requested), vocabulary.length);
  startQuiz();
});

// Validation & skip
validateBtn.addEventListener("click", checkAnswer);
skipBtn.addEventListener("click", () => {
  // enregistrer comme incorrect (vide)
  results.push({
    question: direction === "de-to-fr" ? current.de : current.fr,
    expected: (direction === "de-to-fr" ? current.fr : current.de).toLowerCase(),
    given: "",
    isCorrect: false
  });
  usedWords.push(current._idx); // pour sécurité si pas fait
  // mettre à jour progress/score
  scoreEl.textContent = `Score : ${score}/${usedWords.length}`;
  setTimeout(nextQuestion, 600);
});

// Enter pour valider
answerEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") validateBtn.click();
});

// --- Chargement du vocabulaire ---
async function loadVocabulary(theme) {
  try {
    if (theme === "general") {
      const allFiles = ["maison", "sport", "sante", "ecole"];
      vocabulary = [];
      for (const f of allFiles) {
        const response = await fetch(`vocab/${f}.json`);
        if (!response.ok) throw new Error(`Impossible de charger vocab/${f}.json`);
        const data = await response.json();
        // marquer chaque entrée avec un index unique pour tracking
        data.forEach((entry, i) => entry._src = f);
        vocabulary = vocabulary.concat(data);
      }
    } else {
      const response = await fetch(`vocab/${theme}.json`);
      if (!response.ok) throw new Error(`Impossible de charger vocab/${theme}.json`);
      vocabulary = await response.json();
      vocabulary.forEach((entry, i) => entry._src = theme);
    }
    // ajouter des indexes internes (utile pour éviter doublons)
    vocabulary.forEach((e, i) => e._idx = i);
  } catch (err) {
    alert("Erreur de chargement du (des) fichier(s) de vocabulaire. Ouvre la console pour plus d'infos.");
    console.error(err);
  }
}

// --- Démarrer quiz ---
function startQuiz() {
  configEl.classList.add("hidden");
  quizEl.classList.remove("hidden");
  score = 0;
  usedWords = [];
  results = [];
  // affichages initiaux
  themeLabelEl.textContent = `Thème : ${selectedTheme}`;
  scoreEl.textContent = `Score : 0 / 0`;
  nextQuestion();
}

// --- Question suivante ---
function nextQuestion() {
  if (usedWords.length >= total) {
    endSession();
    return;
  }

  // choisir un index non utilisé
  let idx;
  do {
    idx = Math.floor(Math.random() * vocabulary.length);
  } while (usedWords.includes(idx));

  usedWords.push(idx);
  current = vocabulary[idx];
  direction = Math.random() < 0.5 ? "de-to-fr" : "fr-to-de";

  const questionText = direction === "de-to-fr"
    ? `Traduire en français : "${current.de}"`
    : `Traduire en allemand : "${current.fr}"`;

  questionEl.textContent = questionText;
  answerEl.value = "";
  answerEl.focus();
  feedbackEl.textContent = "";
  progressEl.textContent = `Mot ${usedWords.length} / ${total}`;
  scoreEl.textContent = `Score : ${score} / ${usedWords.length - 1}`;
}

// --- Vérifier réponse ---
function checkAnswer() {
  const userAnswer = answerEl.value.trim().toLowerCase();
  const correctAnswer = (direction === "de-to-fr" ? current.fr : current.de).toLowerCase();

  const isCorrect = userAnswer === correctAnswer;
  results.push({
    question: direction === "de-to-fr" ? current.de : current.fr,
    expected: correctAnswer,
    given: userAnswer,
    isCorrect
  });

  if (isCorrect) {
    feedbackEl.textContent = "✅ Correct !";
    feedbackEl.className = "correct";
    score++;
  } else {
    feedbackEl.textContent = `❌ Faux — attendu : ${correctAnswer}`;
    feedbackEl.className = "wrong";
  }

  scoreEl.textContent = `Score : ${score} / ${usedWords.length}`;
  setTimeout(nextQuestion, 900);
}

// --- Fin de session / récap ---
function endSession() {
  // construire le récapitulatif HTML
  document.body.innerHTML = `
    <div style="padding:24px; text-align:center;">
      <h1>Session terminée 🎉</h1>
      <p>Thème : <strong>${selectedTheme}</strong></p>
      <p>Score : <strong>${score} / ${total}</strong></p>
      <h2>Récapitulatif</h2>
      <ul id="recap"></ul>
      <div style="margin-top:16px;">
        <button id="restart">Recommencer</button>
        <button id="toMenu">Retour au menu</button>
      </div>
    </div>
  `;

  const recapEl = document.getElementById("recap");
  results.forEach(r => {
    const li = document.createElement("li");
    // petite croix rouge ou point vert
    const mark = r.isCorrect ? '🟢' : '❌';
    li.innerHTML = `${mark} <strong>${r.question}</strong> — ta réponse : "${r.given || '—'}" — attendu : "${r.expected}"`;
    recapEl.appendChild(li);
  });

  document.getElementById("restart").addEventListener("click", () => location.reload());
  document.getElementById("toMenu").addEventListener("click", () => location.href = location.pathname);
}

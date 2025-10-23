let vocabulary = [];
let score = 0;
let total = 0;
let usedWords = [];
let results = [];
let current = null;
let direction = "de-to-fr";
let selectedTheme = "";
let speedSetting = "normal"; // vitesse choisie

const themes = ["maison", "sport", "sante", "ecole", "general"];

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
const speedEl = document.getElementById("speed"); // ajout du select

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
  speedSetting = speedEl.value;
  startQuiz();
});

validateBtn.addEventListener("click", checkAnswer);
skipBtn.addEventListener("click", () => {
  recordResult("", false);
  setTimeout(nextQuestion, 600);
});

answerEl.addEventListener("keydown", e => {
  if (e.key === "Enter") validateBtn.click();
});

async function loadVocabulary(theme) {
  try {
    if (theme === "general") {
      const allFiles = ["maison", "sport", "sante", "ecole"];
      vocabulary = [];
      for (const f of allFiles) {
        const response = await fetch(`vocab/${f}.json`);
        const data = await response.json();
        data.forEach(e => (e._src = f));
        vocabulary = vocabulary.concat(data);
      }
    } else {
      const response = await fetch(`vocab/${theme}.json`);
      vocabulary = await response.json();
      vocabulary.forEach(e => (e._src = theme));
    }
  } catch (err) {
    alert("Erreur de chargement du vocabulaire !");
    console.error(err);
  }
}

function startQuiz() {
  configEl.classList.add("hidden");
  quizEl.classList.remove("hidden");
  score = 0;
  usedWords = [];
  results = [];
  themeLabelEl.textContent = `Thème : ${selectedTheme}`;
  scoreEl.textContent = `Score : 0 / 0`;
  nextQuestion();
}

function nextQuestion() {
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
  progressEl.textContent = `Mot ${usedWords.length} / ${total}`;
  scoreEl.textContent = `Score : ${score} / ${usedWords.length - 1}`;
}

function normalize(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'"\-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getDelay(isCorrect) {
  const speeds = {
    fast: isCorrect ? 500 : 1500,
    normal: isCorrect ? 1000 : 2500,
    slow: isCorrect ? 1500 : 3000
  };
  return speeds[speedSetting] || 2000;
}

function checkAnswer() {
  const userAnswer = normalize(answerEl.value);
  const correctAnswer = normalize(
    direction === "de-to-fr" ? current.fr : current.de
  );

  const isCorrect = userAnswer === correctAnswer;
  recordResult(userAnswer, isCorrect);

  if (isCorrect) {
    feedbackEl.textContent = "✅ Correct !";
    feedbackEl.className = "correct";
    score++;
  } else {
    feedbackEl.textContent = `❌ Faux — attendu : ${direction === "de-to-fr" ? current.fr : current.de}`;
    feedbackEl.className = "wrong";
  }

  scoreEl.textContent = `Score : ${score} / ${usedWords.length}`;
  setTimeout(nextQuestion, getDelay(isCorrect));
}

function recordResult(answer, isCorrect) {
  const expected = direction === "de-to-fr" ? current.fr : current.de;
  results.push({
    question: direction === "de-to-fr" ? current.de : current.fr,
    expected,
    given: answer,
    isCorrect
  });
}

function endSession() {
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
    const mark = r.isCorrect ? "🟢" : "🔴";
    li.innerHTML = `${mark} <strong>${r.question}</strong> — ta réponse : "${r.given || "—"}" — attendu : "${r.expected}"`;
    recapEl.appendChild(li);
  });

  document.getElementById("restart").addEventListener("click", () => location.reload());
  document.getElementById("toMenu").addEventListener("click", () => location.href = location.pathname);
}

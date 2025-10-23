// --- Variables ---
let vocabulary = [];
let score = 0;
let total = 0;
let usedWords = [];
let results = [];
let current = null;
let direction = "de-to-fr";
let selectedTheme = "";

// Thèmes disponibles
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
  const requested = parseInt(nbWordsEl.value, 10)

/* script.js — Quiz principal avec mode spécial "Verbes irréguliers" (Option 2) */

/* -------------------------
   Variables & DOM nodes
   ------------------------- */
let vocabulary = [];           // pour thèmes "normaux" (listes fr/de)
let irregVerbs = [];           // contenu du JSON des verbes irréguliers
let mode = "normal";           // "normal" ou "irreg"
let score = 0;
let total = 0;
let usedIndices = [];
let results = [];
let current = null;            // pour normal: {de,fr,...}, pour irreg: {verb, fromField, toField}
let awaitingContinue = false;

const menuEl = document.getElementById("menu");
const configEl = document.getElementById("config");
const quizEl = document.getElementById("quiz");
const recapSection = document.getElementById("recapSection");

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
const restartBtn = document.getElementById("restart");
const toMenuBtn = document.getElementById("toMenu");
const reviewBtn = document.getElementById("reviewMistakes");
const speedSelect = document.getElementById("speed");

/* available themes for general mode (must have corresponding vocab/*.json files) */
const themesList = ["maison","sport","sante","ecole","temps","physique","adver","general"];

/* -------------------------
   Helpers
   ------------------------- */
function normalize(s){
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[’'"\-\u2010-\u2015]/g,"")
    .replace(/[.,;:!?()]/g,"")
    .replace(/\s+/g," ")
    .trim()
    .toLowerCase();
}
function getDelay(isCorrect){
  const speed = speedSelect ? speedSelect.value : "normal";
  const map = { fast: isCorrect?500:1000, normal: isCorrect?1000:2000, slow: isCorrect?1500:3000 };
  return map[speed] || 1000;
}

/* -------------------------
   Theme button handling
   ------------------------- */
document.querySelectorAll(".theme-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    const theme = btn.dataset.theme;
    // if user chose the irregular verbs theme:
    if(theme === "irreg"){
      mode = "irreg";
      // load irregular verbs JSON
      try {
        const res = await fetch("vocab/irreg_verbes.json");
        if(!res.ok) throw new Error("Impossible de charger /vocab/irreg_verbes.json");
        irregVerbs = await res.json();
      } catch(err){
        alert("Erreur lors du chargement des verbes irréguliers. Ouvre la console pour détails.");
        console.error(err);
        return;
      }
      configTitleEl.textContent = "Verbes irréguliers";
      menuEl.classList.add("hidden");
      configEl.classList.remove("hidden");
      nbWordsEl.max = irregVerbs.length;
      nbWordsEl.value = Math.min(10, irregVerbs.length);
      return;
    }

    // otherwise normal vocabulary theme
    mode = "normal";
    try {
      // load vocabulary file (or if general, load many)
      if(theme === "general"){
        const files = ["maison","sport","sante","ecole","temps","physique","adver"];
        vocabulary = [];
        for(const f of files){
          const r = await fetch(`vocab/${f}.json`);
          if(!r.ok) throw new Error(`Impossible de charger vocab/${f}.json`);
          const data = await r.json();
          vocabulary = vocabulary.concat(data);
        }
      } else {
        const r = await fetch(`vocab/${theme}.json`);
        if(!r.ok) throw new Error(`Impossible de charger vocab/${theme}.json`);
        vocabulary = await r.json();
      }
    } catch(err){
      alert("Erreur de chargement du vocabulaire. Ouvre la console pour détails.");
      console.error(err);
      return;
    }

    configTitleEl.textContent = `Thème : ${theme}`;
    menuEl.classList.add("hidden");
    configEl.classList.remove("hidden");
    nbWordsEl.max = vocabulary.length;
    nbWordsEl.value = Math.min(10, vocabulary.length);
  });
});

/* -------------------------
   Config buttons
   ------------------------- */
backBtn.addEventListener("click", () => {
  configEl.classList.add("hidden");
  menuEl.classList.remove("hidden");
});

startBtn.addEventListener("click", () => {
  const requested = Math.max(1, parseInt(nbWordsEl.value,10) || 10);
  const max = mode === "irreg" ? irregVerbs.length : vocabulary.length;
  total = Math.min(requested, max);
  // reset
  usedIndices = [];
  results = [];
  score = 0;
  feedbackEl.textContent = "";
  answerEl.value = "";
  // show quiz
  configEl.classList.add("hidden");
  recapSection.classList.add("hidden");
  quizEl.classList.remove("hidden");
  themeLabelEl.textContent = mode === "irreg" ? "Verbes irréguliers" : "Thème vocabulaire";
  scoreEl.textContent = `Score : 0 / 0`;
  // start first question
  if(mode === "irreg") askIrregQuestion();
  else askNormalQuestion();
});

/* validate / skip behavior */
validateBtn.addEventListener("click", () => {
  if(awaitingContinue) return;
  if(mode === "irreg") checkIrregAnswer();
  else checkNormalAnswer();
});
skipBtn.addEventListener("click", () => {
  if(awaitingContinue) return;
  // record as wrong
  if(mode === "irreg"){
    recordIrregResult("", false);
    nextAfterAnswer(false);
  } else {
    recordNormalResult("", false);
    nextAfterAnswer(false);
  }
});

/* keyboard enter handling */
answerEl.addEventListener("keydown", (e) => {
  if(e.key === "Enter"){
    if(awaitingContinue){
      const cont = document.getElementById("continueBtn");
      if(cont) cont.click();
    } else {
      validateBtn.click();
    }
  }
});

/* restart / to menu / review mistakes */
restartBtn.addEventListener("click", ()=> location.reload());
toMenuBtn.addEventListener("click", ()=> location.href = location.pathname);
reviewBtn.addEventListener("click", ()=> {
  // build a new practice set from mistakes
  const mistakes = results.filter(r => !r.isCorrect);
  if(mistakes.length === 0) return;
  if(mode === "irreg"){
    // replace irregVerbs with mistake verbs (keeping direction info)
    irregVerbs = mistakes.map(m => ({infinitive: m.infinitive, preteritum: m.preteritum, partizip: m.partizip, "3psPresent": m["3psPresent"], fr: m.fr}));
    total = irregVerbs.length;
    usedIndices = [];
    results = [];
    score = 0;
    quizEl.classList.remove("hidden");
    recapSection.classList.add("hidden");
    askIrregQuestion();
  } else {
    vocabulary = mistakes.map(m => ({de: m.de, fr: m.fr}));
    total = vocabulary.length;
    usedIndices = [];
    results = [];
    score = 0;
    quizEl.classList.remove("hidden");
    recapSection.classList.add("hidden");
    askNormalQuestion();
  }
});

/* -------------------------
   NORMAL MODE (vocab lists)
   ------------------------- */
function askNormalQuestion(){
  awaitingContinue = false;
  validateBtn.disabled = false;
  skipBtn.disabled = false;
  if(usedIndices.length >= total) return endSession();

  let idx;
  do { idx = Math.floor(Math.random() * vocabulary.length); } while(usedIndices.includes(idx));
  usedIndices.push(idx);
  current = vocabulary[idx];

  // randomly choose direction
  const dir = Math.random() < 0.5 ? "de-to-fr" : "fr-to-de";
  current._dir = dir;

  questionEl.textContent = dir === "de-to-fr" ? `Traduire en français : "${current.de}"` : `Traduire en allemand : "${current.fr}"`;
  answerEl.value = "";
  answerEl.focus();
  feedbackEl.textContent = "";
  progressEl.textContent = `Mot ${usedIndices.length} / ${total}`;
  scoreEl.textContent = `Score : ${score} / ${Math.max(usedIndices.length - 1,0)}`;
}

function checkNormalAnswer(){
  const userRaw = answerEl.value;
  const user = normalize(userRaw);
  const expected = normalize(current._dir === "de-to-fr" ? current.fr : current.de);
  const isCorrect = user === expected;
  recordNormalResult(userRaw, isCorrect);
  validateBtn.disabled = true;
  skipBtn.disabled = true;

  if(isCorrect){
    feedbackEl.textContent = "✅ Correct !";
    feedbackEl.className = "correct";
    score++;
    scoreEl.textContent = `Score : ${score} / ${usedIndices.length}`;
    setTimeout( () => { askNormalQuestion(); }, getDelay(true));
  } else {
    awaitingContinue = true;
    feedbackEl.innerHTML = `❌ Faux — attendu : <strong>${current._dir === "de-to-fr" ? current.fr : current.de}</strong> <div style="margin-top:10px"><button id="continueBtn">Continuer</button></div>`;
    feedbackEl.className = "wrong";
    document.getElementById("continueBtn").focus();
    document.getElementById("continueBtn").addEventListener("click", () => { awaitingContinue = false; askNormalQuestion(); });
  }
}

function recordNormalResult(given, isCorrect){
  results.push({de: current.de, fr: current.fr, given, isCorrect});
}

/* -------------------------
   IRREGULAR VERBS MODE (Option 2)
   ------------------------- */
/* fields we can ask for and labels */
const irregFields = ["infinitive","preteritum","partizip","3psPresent","fr"];
const irregLabels = {
  infinitive: "infinitif",
  preteritum: "prétérit",
  partizip: "participe passé",
  "3psPresent": "3e pers. du présent",
  fr: "traduction française"
};

function askIrregQuestion(){
  awaitingContinue = false;
  validateBtn.disabled = false;
  skipBtn.disabled = false;
  if(usedIndices.length >= total) return endSession();

  let idx;
  do { idx = Math.floor(Math.random() * irregVerbs.length); } while(usedIndices.includes(idx));
  usedIndices.push(idx);
  const verb = irregVerbs[idx];

  // choose fromField (the displayed form) and toField (what user must give)
  let fromField = irregFields[Math.floor(Math.random()*irregFields.length)];
  let toField;
  do { toField = irregFields[Math.floor(Math.random()*irregFields.length)]; } while(toField === fromField);

  // current holds the verb and fields
  current = { verb, fromField, toField };

  const promptValue = verb[fromField];
  questionEl.textContent = `Quel est le ${irregLabels[toField]} de "${promptValue}" ?`;
  answerEl.value = "";
  answerEl.focus();
  progressEl.textContent = `Verbe ${usedIndices.length} / ${total}`;
  feedbackEl.textContent = "";
  scoreEl.textContent = `Score : ${score} / ${Math.max(usedIndices.length - 1,0)}`;
}

function checkIrregAnswer(){
  const userRaw = answerEl.value;
  const user = normalize(userRaw);
  const expectedRaw = current.verb[current.toField] || "";
  const expected = normalize(expectedRaw);

  const isCorrect = user === expected;
  recordIrregResult(userRaw, isCorrect);

  validateBtn.disabled = true;
  skipBtn.disabled = true;

  if(isCorrect){
    feedbackEl.textContent = "✅ Correct !";
    feedbackEl.className = "correct";
    score++;
    scoreEl.textContent = `Score : ${score} / ${usedIndices.length}`;
    setTimeout(() => askIrregQuestion(), getDelay(true));
  } else {
    awaitingContinue = true;
    feedbackEl.innerHTML = `❌ Faux — attendu : <strong>${expectedRaw}</strong> <div style="margin-top:10px"><button id="continueBtn">Continuer</button></div>`;
    feedbackEl.className = "wrong";
    document.getElementById("continueBtn").focus();
    document.getElementById("continueBtn").addEventListener("click", () => { awaitingContinue = false; askIrregQuestion(); });
  }
}

function recordIrregResult(given, isCorrect){
  // store canonical fields so we can review mistakes later
  const v = current.verb;
  results.push({
    infinitive: v.infinitive,
    preteritum: v.preteritum,
    partizip: v.partizip,
    "3psPresent": v["3psPresent"],
    fr: v.fr,
    askedFrom: current.fromField,
    askedTo: current.toField,
    given,
    isCorrect
  });
}

/* -------------------------
   Common end / recap
   ------------------------- */
function nextAfterAnswer(wasCorrect){
  if(mode==="irreg") askIrregQuestion(); else askNormalQuestion();
}

function endSession(){
  // hide quiz show recap
  quizEl.classList.add("hidden");
  recapSection.classList.remove("hidden");

  // build recap list
  const recapList = document.getElementById("recap");
  recapList.innerHTML = "";

  results.forEach(r => {
    let li = document.createElement("li");
    if(mode === "irreg"){
      const askedLabel = irregLabels[r.askedTo] || r.askedTo;
      const askedValue = r[r.askedTo] || "";
      li.innerHTML = `${r.isCorrect ? "🟢" : "🔴"} <strong>${r.infinitive}</strong> — demandé: ${askedLabel} — ta réponse : "${r.given || "—"}" — attendu : "${askedValue}"`;
    } else {
      li.innerHTML = `${r.isCorrect ? "🟢" : "🔴"} <strong>${r.de}</strong> — ta réponse : "${r.given || "—"}" — attendu : "${r.fr}"`;
    }
    recapList.appendChild(li);
  });

  // show / hide review button
  const mistakes = results.filter(x => !x.isCorrect);
  if(mistakes.length > 0) {
    reviewBtn.classList.remove("hidden");
    reviewBtn.textContent = `Revoir mes fautes (${mistakes.length})`;
  } else {
    reviewBtn.classList.add("hidden");
  }
}

/* -------------------------
   End of script
   ------------------------- */

// --- Données de vocabulaire ---
const vocabulary = [
  {de: "sprechen", fr: "parler"},
  {de: "gehen", fr: "aller"},
  {de: "kommen", fr: "venir"},
  {de: "sehen", fr: "voir"},
  {de: "haben", fr: "avoir"},
  {de: "sein", fr: "être"},
  {de: "lernen", fr: "apprendre"},
  {de: "machen", fr: "faire"},
  {de: "spielen", fr: "jouer"},
  {de: "lesen", fr: "lire"},
  {de: "wohnen", fr: "habiter"},
  {de: "schreiben", fr: "écrire"},
  {de: "kaufen", fr: "acheter"},
  {de: "trinken", fr: "boire"},
  {de: "essen", fr: "manger"},
  {de: "öffnen", fr: "ouvrir"},
  {de: "schließen", fr: "fermer"},
  {de: "arbeiten", fr: "travailler"},
  {de: "brauchen", fr: "avoir besoin"},
  {de: "fahren", fr: "conduire / aller (en véhicule)"},
  {de: "fragen", fr: "demander"},
  {de: "antworten", fr: "répondre"},
  {de: "beginnen", fr: "commencer"},
  {de: "bleiben", fr: "rester"},
  {de: "helfen", fr: "aider"},
  {de: "nehmen", fr: "prendre"},
  {de: "finden", fr: "trouver"},
  {de: "geben", fr: "donner"},
  {de: "laufen", fr: "courir / marcher"},
  {de: "tragen", fr: "porter"},
  {de: "denken", fr: "penser"},
  {de: "das Haus", fr: "la maison"},
  {de: "die Stadt", fr: "la ville"},
  {de: "die Straße", fr: "la rue"},
  {de: "der Freund", fr: "l’ami"},
  {de: "die Schule", fr: "l’école"},
  {de: "das Buch", fr: "le livre"},
  {de: "der Tisch", fr: "la table"},
  {de: "die Tür", fr: "la porte"},
  {de: "das Fenster", fr: "la fenêtre"},
  {de: "die Arbeit", fr: "le travail"},
  {de: "der Tag", fr: "le jour"},
  {de: "die Woche", fr: "la semaine"},
  {de: "der Monat", fr: "le mois"},
  {de: "das Jahr", fr: "l’année"},
  {de: "der Hund", fr: "le chien"},
  {de: "die Katze", fr: "le chat"},
  {de: "das Wasser", fr: "l’eau"}
];

// --- Variables de session ---
let score = 0;
let total = 0;
let current = null;
let direction = "de-to-fr";
let usedWords = [];
let results = [];

// --- Initialisation ---
function startQuiz() {
  const input = prompt("Combien de mots veux-tu tester cette session ? (max : " + vocabulary.length + ")");
  total = Math.min(parseInt(input) || 10, vocabulary.length);
  score = 0;
  usedWords = [];
  results = [];
  nextQuestion();
}

function nextQuestion() {
  // Fin de la session
  if (usedWords.length >= total) {
    endSession();
    return;
  }

  // Choisir un mot non utilisé
  let currentIndex;
  do {
    currentIndex = Math.floor(Math.random() * vocabulary.length);
  } while (usedWords.includes(currentIndex));

  usedWords.push(currentIndex);
  current = vocabulary[currentIndex];
  direction = Math.random() < 0.5 ? "de-to-fr" : "fr-to-de";

  if (direction === "de-to-fr") {
    document.getElementById("question").textContent = `Traduire en français : "${current.de}"`;
  } else {
    document.getElementById("question").textContent = `Traduire en allemand : "${current.fr}"`;
  }

  document.getElementById("answer").value = "";
  document.getElementById("feedback").textContent = "";
}

function checkAnswer() {
  const userAnswer = document.getElementById("answer").value.trim().toLowerCase();
  const correctAnswer = (direction === "de-to-fr" ? current.fr : current.de).toLowerCase();

  const result = {
    question: direction === "de-to-fr" ? current.de : current.fr,
    expected: correctAnswer,
    given: userAnswer,
    isCorrect: userAnswer === correctAnswer
  };
  results.push(result);

  if (result.isCorrect) {
    document.getElementById("feedback").textContent = "✅ Correct !";
    document.getElementById("feedback").className = "correct";
    score++;
  } else {
    document.getElementById("feedback").textContent = `❌ Faux ! Réponse : ${correctAnswer}`;
    document.getElementById("feedback").className = "wrong";
  }

  document.getElementById("score").textContent = `Score : ${score}/${usedWords.length}`;
  setTimeout(nextQuestion, 1500);
}

function endSession() {
  document.body.innerHTML = `
    <h1>Session terminée 🎉</h1>
    <p>Ton score : <strong>${score} / ${total}</strong></p>
    <h2>Récapitulatif :</h2>
    <ul id="recap"></ul>
    <button onclick="location.reload()">Recommencer</button>
  `;

  const recap = document.getElementById("recap");

  results.forEach(r => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${r.isCorrect ? "🟢" : "🔴"} 
      <strong>${r.question}</strong> → 
      ta réponse : "${r.given || '–'}", 
      attendu : "${r.expected}"
    `;
    recap.appendChild(li);
  });
}

document.getElementById("validate").addEventListener("click", checkAnswer);

// Lancer le quiz au chargement
window.onload = startQuiz;

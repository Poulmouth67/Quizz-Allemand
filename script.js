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
  {de: "wohnen", fr: "habiter"},
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
  {de: "spielen", fr: "jouer"},
  {de: "das Haus", fr: "la maison"},
  {de: "die Stadt", fr: "la ville"},
  {de: "die Straße", fr: "la rue"},
  {de: "der Freund", fr: "l’ami"},
  {de: "die Schule", fr: "l’école"},
  {de: "das Buch", fr: "le livre"},
  {de: "der Tisch", fr: "la table"},
  {de: "die Tür", fr: "la porte"},
  {de: "das Fenster", fr: "la fenêtre"},
  {de: "der Lehrer", fr: "le professeur"},
  {de: "die Arbeit", fr: "le travail"},
  {de: "der Tag", fr: "le jour"},
  {de: "die Woche", fr: "la semaine"},
  {de: "der Monat", fr: "le mois"},
  {de: "das Jahr", fr: "l’année"},
  {de: "der Hund", fr: "le chien"},
  {de: "die Katze", fr: "le chat"},
  {de: "das Wasser", fr: "l’eau"}
  // → tu peux continuer la liste ici jusqu’à 1500 mots
];

let score = 0;
let current = null;
let direction = "de-to-fr";

function nextQuestion() {
  const index = Math.floor(Math.random() * vocabulary.length);
  current = vocabulary[index];
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

  if (userAnswer === correctAnswer) {
    document.getElementById("feedback").textContent = "✅ Correct !";
    document.getElementById("feedback").className = "correct";
    score++;
  } else {
    document.getElementById("feedback").textContent = `❌ Faux ! Réponse : ${correctAnswer}`;
    document.getElementById("feedback").className = "wrong";
  }

  document.getElementById("score").textContent = `Score : ${score}`;
  setTimeout(nextQuestion, 2000);
}

document.getElementById("validate").addEventListener("click", checkAnswer);

nextQuestion();

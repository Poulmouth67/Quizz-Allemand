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

// Attacher les événements aux boutons du menu
document.querySelectorAll(".theme-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    selectedTheme = btn.dataset.theme;
    await loadVocabulary(selectedTheme);
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("quiz").classList.remove("hidden");
    startQuiz();
  });
});

// Charger le vocabulaire
async function loadVocabulary(theme) {
  try {
    if (theme === "general") {
      const allFiles = ["maison", "sport", "sante", "ecole"];
      vocabulary = [];
      for (const f of allFiles) {
        const response = await fetch(`vocab/${f}.json`);
        const data = await response.json();
        vocabulary = vocabulary.concat(data);
      }
    } else {
      const response = await fetch(`vocab/${theme}.json`);
      vocabulary = await response.json();
    }
  } catch (error) {
    alert("Erreur de chargement du fichier de vocabulaire !");
    console.error(error);
  }
}

// Démarrer le quiz
function startQuiz() {
  const input = prompt(`Combien de mots veux-tu tester ? (max : ${vocabulary.length})`);
  total = Math.min(parseInt(input) || 10, vocabulary.length);
  score = 0;
  usedWords = [];
  results = [];
  nextQuestion();
}

// Afficher une question
function nextQuestion() {
  if (usedWords.length >= total) {
    endSession();
    return;
  }

  let currentIndex;
  do {
    currentIndex = Math.floor(Math.random() * vocabulary.length);
  } while (usedWords.includes(currentIndex));

  usedWords.push(currentIndex);
  current = vocabulary[currentIndex];
  direction = Math.random() < 0.5 ? "de-to-fr" : "fr-to-de";

  const questionText = direction === "de-to-fr"
    ? `Traduire en français : "${current.de}"`
    : `Traduire en allemand : "${current.fr}"`;

  document.getElementById("question").textContent = questionText;
  document.getElementById("answer").value = "";
  document.getElementById("feedback").textContent = "";
  document.getElementById("score").textContent = `Mot ${usedWords.length + 1} sur ${total}`;
}

// Vérifier la réponse
function checkAnswer() {
  const userAnswer = document.getElementById("answer").value.trim().toLowerCase();
  const correctAnswer = (direction === "de-to-fr" ? current.fr : current.de).toLowerCase();

  const isCorrect = userAnswer === correctAnswer;
  results.push({
    question: direction === "de-to-fr" ? current.de : current.fr,
    expected: correctAnswer,
    given: userAnswer,
    isCorrect
  });

  if (isCorrect) {
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

// Fin du quiz
function endSession() {
  document.body.innerHTML = `
    <h1>Session terminée 🎉</h1>
    <p>Thème : <strong>${selectedTheme}</strong></p>
    <p>Score : <strong>${score} / ${total}</strong></p>
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

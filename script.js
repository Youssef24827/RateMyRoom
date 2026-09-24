const imageInput = document.querySelector("#image");
const analyzeButton = document.querySelector("#analyze");
const result = document.querySelector("#result");

analyzeButton.addEventListener("click", () => {
    if (!imageInput.files.length) {
        alert("📸 Ajoute d'abord une photo de ta chambre !");
        return;
    }

    result.style.display = "block";

    result.innerHTML = `
        <div class="score">⭐ 7.2 / 10</div>

        <h2>📊 Analyse</h2>

        <p>🧹 Rangement : <strong>6/10</strong></p>
        <p>🪑 Organisation : <strong>7/10</strong></p>
        <p>💡 Éclairage : <strong>8/10</strong></p>
        <p>🎨 Décoration : <strong>8/10</strong></p>

        <br>

        <h2>🧹 À faire</h2>

        <div class="task">☐ Ramasser les vêtements</div>
        <div class="task">☐ Ranger le bureau</div>
        <div class="task">☐ Faire le lit</div>

        <br>

        <p>⏱️ Temps estimé : <strong>15 minutes</strong></p>
    `;
});

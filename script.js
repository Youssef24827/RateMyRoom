const imageInput = document.querySelector("#image");
const analyzeButton = document.querySelector("#analyze");
const result = document.querySelector("#result");

analyzeButton.addEventListener("click", async () => {

    if (!imageInput.files.length) {
        alert("📸 Ajoute d'abord une photo de ta chambre !");
        return;
    }

    const file = imageInput.files[0];

    analyzeButton.disabled = true;
    analyzeButton.textContent = "⏳ Analyse en cours...";
    result.style.display = "block";
    result.innerHTML = "<p>🤖 Gemini analyse ta chambre...</p>";

    try {

        const reader = new FileReader();

        reader.onload = async () => {

            const base64 = reader.result.split(",")[1];

            const response = await fetch("/api/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    image: base64
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erreur pendant l'analyse");
            }

            result.innerHTML = `
                <div class="score">
                    ⭐ ${data.note} / 10
                </div>

                <h2>📊 Analyse</h2>

                <p>🧹 Rangement : <strong>${data.rangement}/10</strong></p>
                <p>🪑 Organisation : <strong>${data.organisation}/10</strong></p>
                <p>💡 Éclairage : <strong>${data.eclairage}/10</strong></p>
                <p>🎨 Décoration : <strong>${data.decoration}/10</strong></p>

                <br>

                <h2>🧹 À faire</h2>

                ${data.taches.map(tache => `
                    <div class="task">
                        ☐ ${tache.action}
                        <strong>(${tache.temps} min)</strong>
                    </div>
                `).join("")}
            `;

            analyzeButton.disabled = false;
            analyzeButton.textContent = "✨ Analyser ma chambre";
        };

        reader.readAsDataURL(file);

    } catch (error) {

        console.error(error);

        result.innerHTML = `
            <p>❌ Une erreur est survenue.</p>
            <p>${error.message}</p>
        `;

        analyzeButton.disabled = false;
        analyzeButton.textContent = "✨ Analyser ma chambre";
    }
});

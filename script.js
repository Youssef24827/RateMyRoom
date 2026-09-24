const imageInput = document.querySelector("#image");
const analyzeButton = document.querySelector("#analyze");
const result = document.querySelector("#result");

console.log("RateMyRoom fonctionne !");

function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement("canvas");

                const maxSize = 1200;

                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxSize) {
                        height = height * (maxSize / width);
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = width * (maxSize / height);
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");

                ctx.drawImage(img, 0, 0, width, height);

                const base64 = canvas
                    .toDataURL("image/jpeg", 0.7)
                    .split(",")[1];

                resolve(base64);
            };

            img.onerror = reject;
            img.src = event.target.result;
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

analyzeButton.addEventListener("click", async () => {

    if (!imageInput.files.length) {
        alert("📸 Ajoute d'abord une photo de ta chambre !");
        return;
    }

    analyzeButton.disabled = true;
    analyzeButton.textContent = "⏳ Analyse en cours...";

    result.style.display = "block";
    result.innerHTML = "<p>🤖 Gemini analyse ta chambre...</p>";

    try {

        const file = imageInput.files[0];

        const base64 = await compressImage(file);

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
            throw new Error(
                data.details
                    ? JSON.stringify(data.details)
                    : (data.error || "Erreur pendant l'analyse")
            );
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

            <br>

            <p>
                ⏱️ Temps total estimé :
                <strong>
                    ${data.taches.reduce((total, tache) => total + tache.temps, 0)} minutes
                </strong>
            </p>
        `;

    } catch (error) {

        console.error(error);

        result.innerHTML = `
            <h2>❌ Erreur</h2>
            <p style="word-break: break-word;">
                ${error.message}
            </p>
        `;

    } finally {

        analyzeButton.disabled = false;
        analyzeButton.textContent = "✨ Analyser ma chambre";
    }
});

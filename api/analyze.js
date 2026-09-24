export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Méthode non autorisée"
        });
    }

    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({
                error: "Aucune image reçue"
            });
        }

        const maxRetries = 3;

        let response;
        let data;

        for (let attempt = 0; attempt < maxRetries; attempt++) {

            response = await fetch(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" +
                process.env.GEMINI_API_KEY,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        inline_data: {
                                            mime_type: "image/jpeg",
                                            data: image
                                        }
                                    },
                                    {
                                        text: `
Tu es un expert en rangement, organisation et décoration intérieure.

Analyse cette photo de chambre.

Donne une note globale sur 10.

Analyse :
- rangement
- organisation
- éclairage
- décoration

Identifie les choses qui pourraient être rangées, nettoyées ou améliorées.

Propose des tâches simples et concrètes avec une estimation du temps en minutes.

Retourne UNIQUEMENT un JSON valide, sans markdown et sans texte supplémentaire.

Format obligatoire :

{
  "note": 0,
  "rangement": 0,
  "organisation": 0,
  "eclairage": 0,
  "decoration": 0,
  "taches": [
    {
      "action": "description",
      "temps": 5
    }
  ]
}

Les notes doivent être entre 0 et 10.
Le temps doit être un nombre entier en minutes.
`
                                    }
                                ]
                            }
                        ]
                    })
                }
            );

            data = await response.json();

            // Si Gemini répond correctement, on arrête les tentatives.
            if (response.ok) {
                break;
            }

            // On retente uniquement pour les erreurs temporaires.
            if (response.status !== 503 && response.status !== 429) {
                break;
            }

            // Pas besoin d'attendre après la dernière tentative.
            if (attempt < maxRetries - 1) {
                const delay = 3000 * Math.pow(2, attempt);

                console.log(
                    `Gemini temporairement indisponible. Nouvelle tentative dans ${delay / 1000}s...`
                );

                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        // Gemini est toujours en erreur après les tentatives.
        if (!response.ok) {
            console.error("ERREUR GEMINI :", data);

            return res.status(500).json({
                error: "Gemini est temporairement indisponible.",
                details: data
            });
        }

        const text =
            data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error("REPONSE GEMINI VIDE :", data);

            return res.status(500).json({
                error: "Gemini n'a pas retourné de résultat.",
                details: data
            });
        }

        const cleanText = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        let result;

        try {
            result = JSON.parse(cleanText);
        } catch (parseError) {

            console.error("JSON GEMINI INVALIDE :", cleanText);

            return res.status(500).json({
                error: "Gemini a retourné un JSON invalide.",
                details: cleanText
            });
        }

        return res.status(200).json(result);

    } catch (error) {

        console.error("ERREUR SERVEUR :", error);

        return res.status(500).json({
            error: "Erreur serveur",
            details: error.message
        });
    }
}

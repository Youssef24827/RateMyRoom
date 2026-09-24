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

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
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

Analyse les catégories suivantes :
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

        const data = await response.json();

        if (!response.ok) {
            console.error("ERREUR GEMINI :", data);

            return res.status(500).json({
                error: "Erreur Gemini",
                details: data
            });
        }

        const text =
            data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error("REPONSE GEMINI VIDE :", data);

            return res.status(500).json({
                error: "Gemini n'a pas retourné de résultat",
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
                error: "Gemini a retourné un JSON invalide",
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

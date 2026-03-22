const functions = require("firebase-functions");

// Fonction proxy sécurisée — la clé API Gemini reste côté serveur
exports.callGemini = functions.https.onCall(async (data, context) => {
  // Bloquer les utilisateurs non connectés
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Vous devez être connecté pour utiliser l'assistant IA."
    );
  }

  // Lire la clé depuis la variable d'environnement (définie dans la console Google Cloud)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new functions.https.HttpsError(
      "internal",
      "Clé API Gemini non configurée. Contactez l'administrateur."
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data.body),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const status = response.status;
      const message = errData?.error?.message || "Erreur inconnue";
      throw new functions.https.HttpsError("internal", `Gemini ${status}: ${message}`);
    }

    return await response.json();
  } catch (err) {
    if (err instanceof functions.https.HttpsError) throw err;
    throw new functions.https.HttpsError("internal", err.message);
  }
});

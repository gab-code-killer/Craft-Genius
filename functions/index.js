const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// ============================================
// Utilitaire : SHA-256 (Node.js natif)
// ============================================
function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

// ============================================
// Vérification du code admin
// ============================================
async function verifyAdmin(adminCode) {
  if (!adminCode) return false;
  const doc = await db.collection("siteSettings").doc("main").get();
  if (!doc.exists) return false;
  const storedHash = doc.data().adminCodeHash;
  if (!storedHash) return false;
  return sha256(adminCode) === storedHash;
}

// ============================================
// listAdminUsers — liste tous les utilisateurs
// ============================================
exports.listAdminUsers = functions.https.onCall(async (data) => {
  if (!(await verifyAdmin(data.adminCode))) {
    throw new functions.https.HttpsError("permission-denied", "Accès refusé.");
  }

  const snapshot = await db.collection("users").orderBy("email").get();
  const users = [];
  snapshot.forEach((doc) => {
    const d = doc.data();
    users.push({
      id: doc.id,
      email: d.email || "",
      displayName: d.displayName || "",
      aiUnlimited: d.aiUnlimited || false,
      createdAt: d.createdAt ? d.createdAt.toMillis() : null,
    });
  });
  return { users };
});

// ============================================
// setUserAiUnlimited — toggle IA illimitée
// ============================================
exports.setUserAiUnlimited = functions.https.onCall(async (data) => {
  if (!(await verifyAdmin(data.adminCode))) {
    throw new functions.https.HttpsError("permission-denied", "Accès refusé.");
  }

  const { userId, value } = data;
  if (!userId || typeof value !== "boolean") {
    throw new functions.https.HttpsError("invalid-argument", "userId et value requis.");
  }

  await db.collection("users").doc(userId).set({ aiUnlimited: value }, { merge: true });
  return { success: true };
});

// ============================================
// askGemini — proxy sécurisé vers l'API Gemini
// ============================================
exports.askGemini = functions.https.onCall(async (data, context) => {
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

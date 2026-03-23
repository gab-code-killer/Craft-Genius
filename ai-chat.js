// ============================================
// Craft Genius Assistant - Gemini Flash
// ============================================

// IMPORTANT : Remplacez cette valeur par votre clé API depuis aistudio.google.com
// ATTENTION  : Cette clé est visible côté client — activez les quotas dans Google AI Studio
//              pour limiter les abus (ex: 500 requêtes/jour max).
const AI_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 64 64"><rect x="0" y="0" width="64" height="64" fill="#1b1b1b"/><rect x="0" y="0" width="64" height="16" fill="#4CAF50"/><rect x="0" y="12" width="64" height="4" fill="#3e8e41"/><rect x="0" y="16" width="64" height="48" fill="#8B5A2B"/><rect x="8" y="28" width="4" height="4" fill="#6d4421"/><rect x="20" y="40" width="4" height="4" fill="#6d4421"/><rect x="40" y="30" width="4" height="4" fill="#6d4421"/><rect x="50" y="44" width="4" height="4" fill="#6d4421"/><rect x="20" y="26" width="24" height="20" fill="#2a2a2a"/><rect x="24" y="30" width="6" height="6" fill="#00e5ff"/><rect x="34" y="30" width="6" height="6" fill="#00e5ff"/><rect x="26" y="40" width="12" height="3" fill="#00e5ff"/><rect x="31" y="20" width="2" height="6" fill="#aaaaaa"/><rect x="29" y="18" width="6" height="2" fill="#00e5ff"/></svg>`;

const MAX_QUESTIONS_PER_MONTH = 10;

const AI_SYSTEM_PROMPT =
  "Tu es un expert Minecraft qui aide les joueurs. " +
  "Réponds uniquement aux questions liées à Minecraft (commandes, crafts, mobs, biomes, enchantements, redstone, fermes, construction, survie, nether, end, etc.). " +
  "Si la question n'est pas liée à Minecraft, dis poliment que tu ne peux répondre qu'aux questions Minecraft. " +
  "Réponds en français par défaut. Sois concis, clair et précis. " +
  "Utilise des listes à puces quand c'est utile. Ne génère pas de code HTML, texte brut uniquement.";

let aiCurrentUser = null;
let aiDb = null;
let aiUsageCount = 0;
let aiChatHistory = []; // Historique de la conversation en cours

// ============================================
// Initialisation
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  // Attendre que Firebase soit initialisé par script.js / comments.js
  setTimeout(() => {
    if (typeof firebase !== "undefined" && firebase.firestore) {
      aiDb = firebase.firestore();
    }

    if (typeof firebase !== "undefined" && firebase.auth) {
      firebase.auth().onAuthStateChanged((user) => {
        aiCurrentUser = user;
        updateAiUI();
        if (user) {
          loadAiUsage(user.uid);
        }
      });
    } else {
      updateAiUI();
    }
  }, 900);

  setupAiChat();
});

// ============================================
// Interface utilisateur
// ============================================

function updateAiUI() {
  const notConnected = document.getElementById("aiNotConnected");
  const chatWrapper = document.getElementById("aiChatWrapper");

  if (!notConnected || !chatWrapper) return;

  if (aiCurrentUser) {
    notConnected.style.display = "none";
    chatWrapper.style.display = "block";
  } else {
    notConnected.style.display = "block";
    chatWrapper.style.display = "none";
  }
}

function updateUsageBar() {
  const usageText = document.getElementById("aiUsageText");
  const usageFill = document.getElementById("aiUsageFill");
  const limitReached = document.getElementById("aiLimitReached");
  const sendBtn = document.getElementById("aiSendBtn");
  const aiInput = document.getElementById("aiInput");

  const percent = (aiUsageCount / MAX_QUESTIONS_PER_MONTH) * 100;
  const remaining = MAX_QUESTIONS_PER_MONTH - aiUsageCount;
  const isLimitReached = aiUsageCount >= MAX_QUESTIONS_PER_MONTH;

  if (usageText) {
    const limitTxt = typeof getUiText === 'function'
      ? getUiText('aiUsageLimitText', 'Limite atteinte — revenez le mois prochain')
      : 'Limite atteinte — revenez le mois prochain';
    const countLabel = typeof getUiText === 'function'
      ? getUiText('aiUsageCountText', 'questions utilisées ce mois')
      : 'questions utilisées ce mois';
    usageText.textContent = isLimitReached
      ? limitTxt
      : `${aiUsageCount} / ${MAX_QUESTIONS_PER_MONTH} ${countLabel}`;
  }

  if (usageFill) {
    usageFill.style.width = `${Math.min(percent, 100)}%`;
    if (percent >= 100) {
      usageFill.style.background = "#e74c3c";
    } else if (percent >= 70) {
      usageFill.style.background = "#f39c12";
    } else {
      usageFill.style.background = "#2ecc71";
    }
  }

  if (limitReached) {
    limitReached.style.display = isLimitReached ? "block" : "none";
  }

  if (sendBtn) sendBtn.disabled = isLimitReached;
  if (aiInput) aiInput.disabled = isLimitReached;
}

// ============================================
// Firestore — usage mensuel
// ============================================

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getLocalUsageKey(uid) {
  return `aiUsage_${uid}`;
}

function readLocalUsage(uid) {
  try {
    const raw = localStorage.getItem(getLocalUsageKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.count === "number" && typeof parsed.month === "string") {
      return parsed;
    }
  } catch (_) {}
  return null;
}

function writeLocalUsage(uid, count, month) {
  try {
    localStorage.setItem(getLocalUsageKey(uid), JSON.stringify({ count, month }));
  } catch (_) {}
}

async function loadAiUsage(uid) {
  const currentMonth = getCurrentMonth();

  // Toujours essayer Firebase en premier
  if (aiDb) {
    try {
      const doc = await aiDb.collection("aiUsage").doc(uid).get();
      if (doc.exists) {
        const data = doc.data();
        if (data.month === currentMonth) {
          aiUsageCount = typeof data.count === "number" ? data.count : 0;
        } else {
          // Nouveau mois — on repart à 0
          aiUsageCount = 0;
        }
      } else {
        aiUsageCount = 0;
      }
      // Synchroniser localStorage avec la valeur Firebase
      writeLocalUsage(uid, aiUsageCount, currentMonth);
      updateUsageBar();
      return;
    } catch (error) {
      console.error("Erreur lecture Firebase, bascule sur localStorage:", error);
    }
  }

  // Fallback : localStorage (évite le contournement par rechargement)
  const local = readLocalUsage(uid);
  if (local && local.month === currentMonth) {
    aiUsageCount = local.count;
  } else {
    aiUsageCount = 0;
  }
  updateUsageBar();
}

async function saveAiUsage() {
  if (!aiCurrentUser) return;
  const currentMonth = getCurrentMonth();
  const uid = aiCurrentUser.uid;

  // Sauvegarder immédiatement dans localStorage (résiste aux rechargements)
  writeLocalUsage(uid, aiUsageCount, currentMonth);

  // Puis sauvegarder dans Firebase
  if (!aiDb) return;
  try {
    await aiDb.collection("aiUsage").doc(uid).set({
      count: aiUsageCount,
      month: currentMonth,
    });
  } catch (error) {
    console.error("Erreur sauvegarde Firebase (localStorage conservé):", error);
  }
}

// ============================================
// Chat — messages
// ============================================

function setupAiChat() {
  const sendBtn = document.getElementById("aiSendBtn");
  const aiInput = document.getElementById("aiInput");

  if (sendBtn) {
    sendBtn.addEventListener("click", sendAiMessage);
  }

  if (aiInput) {
    // Auto-resize comme ChatGPT
    aiInput.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = Math.min(this.scrollHeight, 160) + "px";
    });

    aiInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendAiMessage();
      }
    });
  }
}

async function sendAiMessage() {
  const aiInput = document.getElementById("aiInput");
  const sendBtn = document.getElementById("aiSendBtn");

  if (!aiInput || !sendBtn) return;
  if (!aiCurrentUser) return;
  if (aiUsageCount >= MAX_QUESTIONS_PER_MONTH) return;

  const message = aiInput.value.trim();
  if (!message) return;

  // Ajouter le message de l'utilisateur à l'historique
  aiChatHistory.push({ role: "user", parts: [{ text: message }] });

  // Afficher le message de l'utilisateur
  appendMessage("user", message);
  aiInput.value = "";
  aiInput.style.height = "auto";

  // 1. Bloquer immédiatement le bouton pour éviter les doubles clics
  sendBtn.disabled = true;
  sendBtn.innerHTML = "⏳";
  aiInput.disabled = true;

  // Afficher les points de chargement
  const loadingId = appendLoadingMessage();

  try {
    const response = await callGemini();

    removeLoadingMessage(loadingId);
    appendMessage("ai", response);

    // Ajouter la réponse de l'IA à l'historique
    aiChatHistory.push({ role: "model", parts: [{ text: response }] });

    // Incrémenter et sauvegarder le compteur
    aiUsageCount++;
    await saveAiUsage();
    updateUsageBar();
  } catch (error) {
    removeLoadingMessage(loadingId);
    console.error("Erreur Gemini:", error);

    // 2. Gestion spéciale de l'erreur 429 (quota dépassé)
    if (error.message && error.message.includes("429")) {
      appendMessage("ai", "⏱️ Doucement ! L'IA reprend son souffle. Réessaie dans 1 à 2 minutes.");
    } else {
      appendMessage("ai", `❌ Erreur: ${error.message}`);
    }
  } finally {
    // 3. Réactiver le bouton après 2 secondes de sécurité
    setTimeout(() => {
      const SEND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
      sendBtn.innerHTML = SEND_SVG;
      sendBtn.disabled = aiUsageCount >= MAX_QUESTIONS_PER_MONTH;
      aiInput.disabled = aiUsageCount >= MAX_QUESTIONS_PER_MONTH;
    }, 2000);
  }
}

// ============================================
// Appel au proxy Vercel sécurisé (/api/gemini)
// ============================================

async function callGemini() {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: AI_SYSTEM_PROMPT }] },
      contents: aiChatHistory,
      generationConfig: { maxOutputTokens: 700, temperature: 0.7 },
    }),
  });

  // Lire le texte brut d'abord pour voir ce qui revient vraiment
  const text = await response.text();
  if (!text) {
    throw new Error(`Réponse vide du serveur (status HTTP ${response.status}) — vérifie que GEMINI_API_KEY est bien définie sur Vercel`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`Réponse inattendue: ${text.substring(0, 200)}`);
  }

  if (!response.ok) {
    throw new Error(`Gemini ${response.status}: ${data?.error || "Erreur inconnue"}`);
  }

  if (data.candidates?.[0]?.content?.parts) {
    return data.candidates[0].content.parts[0].text;
  }

  throw new Error("Réponse Gemini invalide");
}

// ============================================
// Affichage des bulles de chat
// ============================================

function appendMessage(role, text) {
  const chatBox = document.getElementById("aiChatBox");
  if (!chatBox) return;

  const div = document.createElement("div");
  div.className = `ai-message ai-${role}`;

  const avatar = document.createElement("span");
  avatar.className = "ai-avatar";
  if (role === "user") {
    avatar.textContent = "👤";
  } else {
    avatar.innerHTML = AI_SVG;
  }

  const bubble = document.createElement("div");
  bubble.className = "ai-bubble";
  bubble.textContent = text;

  if (role === "user") {
    div.appendChild(bubble);
    div.appendChild(avatar);
  } else {
    div.appendChild(avatar);
    div.appendChild(bubble);
  }

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function appendLoadingMessage() {
  const chatBox = document.getElementById("aiChatBox");
  if (!chatBox) return null;

  const id = "ai-loading-" + Date.now();
  const div = document.createElement("div");
  div.className = "ai-message ai-ai";
  div.id = id;

  const avatar = document.createElement("span");
  avatar.className = "ai-avatar";
  avatar.innerHTML = AI_SVG;

  const bubble = document.createElement("div");
  bubble.className = "ai-bubble ai-loading-bubble";
  bubble.innerHTML =
    '<span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span>';

  div.appendChild(avatar);
  div.appendChild(bubble);
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;

  return id;
}

function removeLoadingMessage(id) {
  if (!id) return;
  const el = document.getElementById(id);
  if (el) el.remove();
}

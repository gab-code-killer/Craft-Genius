// ============================================
// ⚠️  CHANGEZ VOTRE CODE ADMIN ICI !
// ============================================
// Mettez le SHA-256 hash de votre mot de passe (pas le mot de passe lui-même !).
// Pour générer votre hash : ouvrez /admin.html et cliquez sur "Générer mon hash".
// ============================================
const ADMIN_CODE_HASH = "";

// ============================================
// Configuration Firebase (identique au reste du site)
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyDV9nR4R9DrLBF7xkQzihLtzl8cOipUaC0",
  authDomain: "craft-genius-201e6.firebaseapp.com",
  projectId: "craft-genius-201e6",
  storageBucket: "craft-genius-201e6.firebasestorage.app",
  messagingSenderId: "476192035823",
  appId: "1:476192035823:web:9f3c8a72fa2eef9bb99c1a",
};

let adminDB = null;

// ============================================
// Initialisation
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  // Init Firebase
  if (typeof firebase !== "undefined") {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    adminDB = firebase.firestore();
  }

  // Vérifier si déjà connecté en session (survit aux rafraîchissements)
  if (sessionStorage.getItem("adminLoggedIn") === "true") {
    showDashboard();
  }

  // Boutons
  document.getElementById("adminLoginBtn").addEventListener("click", handleLogin);
  document.getElementById("adminCodeInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });
  document.getElementById("adminLogoutBtn").addEventListener("click", handleLogout);
  document.getElementById("saveSettings").addEventListener("click", saveSettings);
  document.getElementById("refreshComments").addEventListener("click", loadAllComments);
  document.getElementById("aiOverlayToggle").addEventListener("change", updateToggleLabel);
});

// ============================================
// Connexion Admin
// ============================================
async function handleLogin() {
  const input = document.getElementById("adminCodeInput");
  const errorEl = document.getElementById("adminError");
  const btn = document.getElementById("adminLoginBtn");

  const enteredCode = input.value;

  if (!enteredCode) {
    shakeInput();
    return;
  }

  if (!ADMIN_CODE_HASH) {
    errorEl.textContent = "⚠️ Aucun hash configuré — lisez les commentaires dans admin.js";
    errorEl.style.display = "block";
    return;
  }

  btn.textContent = "⏳";
  btn.disabled = true;

  try {
    const enteredHash = await sha256(enteredCode);
    if (enteredHash === ADMIN_CODE_HASH) {
      sessionStorage.setItem("adminLoggedIn", "true");
      errorEl.style.display = "none";
      showDashboard();
    } else {
      errorEl.textContent = "❌ Code incorrect. Réessayez.";
      errorEl.style.display = "block";
      input.value = "";
      input.focus();
      shakeInput();
      btn.textContent = "Accéder →";
      btn.disabled = false;
    }
  } catch (err) {
    errorEl.textContent = "❌ Erreur de vérification : " + err.message;
    errorEl.style.display = "block";
    btn.textContent = "Accéder →";
    btn.disabled = false;
  }
}

// ============================================
// Hash SHA-256 (via Web Crypto API intégrée au navigateur)
// ============================================
async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ============================================
// Générateur de hash (outil intégré à la page)
// ============================================
async function generateHash() {
  const password = document.getElementById("hashInput").value;
  if (!password) return;
  const hash = await sha256(password);
  const outputEl = document.getElementById("hashOutput");
  outputEl.value = hash;
  outputEl.select();
  document.execCommand("copy");
  document.getElementById("hashCopyMsg").style.display = "inline";
  setTimeout(() => {
    document.getElementById("hashCopyMsg").style.display = "none";
  }, 2000);
}

function handleLogout() {
  sessionStorage.removeItem("adminLoggedIn");
  document.getElementById("adminDashboard").style.display = "none";
  document.getElementById("adminLogin").style.display = "flex";
  document.getElementById("adminLogoutBtn").style.display = "none";
  document.getElementById("adminCodeInput").value = "";
}

function shakeInput() {
  const input = document.getElementById("adminCodeInput");
  input.classList.remove("shake");
  void input.offsetWidth; // force reflow
  input.classList.add("shake");
}

// ============================================
// Afficher le tableau de bord
// ============================================
async function showDashboard() {
  document.getElementById("adminLogin").style.display = "none";
  document.getElementById("adminDashboard").style.display = "block";
  document.getElementById("adminLogoutBtn").style.display = "block";

  await loadSettings();
  await loadAllComments();
}

// ============================================
// Chargement des paramètres Firestore
// ============================================
async function loadSettings() {
  if (!adminDB) return;

  try {
    const doc = await adminDB.collection("siteSettings").doc("main").get();
    const toggle = document.getElementById("aiOverlayToggle");

    if (doc.exists && typeof doc.data().aiOverlayVisible === "boolean") {
      toggle.checked = doc.data().aiOverlayVisible;
    } else {
      toggle.checked = true; // défaut : overlay visible
    }
    updateToggleLabel();
  } catch (err) {
    console.error("Erreur chargement paramètres:", err);
  }
}

// ============================================
// Sauvegarde des paramètres Firestore
// ============================================
async function saveSettings() {
  if (!adminDB) {
    showSaveStatus("❌ Firebase non disponible", "error");
    return;
  }

  const saveBtn = document.getElementById("saveSettings");
  saveBtn.disabled = true;
  saveBtn.textContent = "⏳ Sauvegarde...";

  const aiOverlayVisible = document.getElementById("aiOverlayToggle").checked;

  try {
    await adminDB.collection("siteSettings").doc("main").set(
      { aiOverlayVisible },
      { merge: true }
    );
    showSaveStatus("✅ Sauvegardé !", "success");
  } catch (err) {
    console.error("Erreur sauvegarde:", err);
    showSaveStatus("❌ Erreur : " + err.message, "error");
  } finally {
    saveBtn.textContent = "💾 Sauvegarder les paramètres";
    saveBtn.disabled = false;
  }
}

function showSaveStatus(message, type) {
  const el = document.getElementById("saveStatus");
  el.textContent = message;
  el.className = "admin-save-status admin-save-status--" + type;
  el.style.display = "inline";
  setTimeout(() => {
    el.textContent = "";
    el.style.display = "none";
  }, 3000);
}

// ============================================
// Toggle label
// ============================================
function updateToggleLabel() {
  const toggle = document.getElementById("aiOverlayToggle");
  const label = document.getElementById("toggleLabel");
  if (toggle.checked) {
    label.textContent = "Activé (écran visible)";
    label.className = "admin-toggle-label admin-toggle-label--on";
  } else {
    label.textContent = "Désactivé (écran masqué)";
    label.className = "admin-toggle-label admin-toggle-label--off";
  }
}

// ============================================
// Chargement de tous les commentaires
// ============================================
async function loadAllComments() {
  const container = document.getElementById("adminComments");
  const statsEl = document.getElementById("adminCommentsStats");

  if (!adminDB) {
    container.innerHTML = "<p class='admin-error-msg'>Firebase non disponible.</p>";
    return;
  }

  container.innerHTML = "<p class='admin-loading'>⏳ Chargement des commentaires...</p>";
  statsEl.style.display = "none";

  try {
    const snapshot = await adminDB
      .collection("comments")
      .orderBy("timestamp", "desc")
      .get();

    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML = "<p class='admin-no-data'>Aucun commentaire pour le moment.</p>";
      return;
    }

    const count = snapshot.size;
    document.getElementById("commentCount").textContent =
      count + (count > 1 ? " commentaires" : " commentaire");
    statsEl.style.display = "block";

    snapshot.forEach((doc) => {
      const el = createAdminCommentEl(doc.id, doc.data());
      container.appendChild(el);
    });
  } catch (err) {
    console.error("Erreur chargement commentaires:", err);
    container.innerHTML =
      "<p class='admin-error-msg'>Erreur : " + escapeHtml(err.message) + "</p>";
  }
}

// ============================================
// Créer un élément commentaire pour l'admin
// ============================================
function createAdminCommentEl(id, comment) {
  const div = document.createElement("div");
  div.className = "admin-comment-item";
  div.dataset.id = id;

  let dateStr = "Date inconnue";
  if (comment.timestamp) {
    try {
      dateStr = new Date(comment.timestamp.toDate()).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      dateStr = comment.date || "Date inconnue";
    }
  } else if (comment.date) {
    dateStr = comment.date;
  }

  div.innerHTML = `
    <div class="admin-comment-meta">
      <span class="admin-comment-author">👤 <strong>${escapeHtml(comment.name || "Anonyme")}</strong></span>
      <span class="admin-comment-date">🕐 ${escapeHtml(dateStr)}</span>
    </div>
    <p class="admin-comment-text">${escapeHtml(comment.text || "")}</p>
    <div class="admin-comment-actions">
      <button
        class="admin-btn admin-btn-delete"
        onclick="deleteAdminComment('${escapeHtml(id)}', this)"
      >🗑️ Supprimer</button>
    </div>
  `;
  return div;
}

// ============================================
// Supprimer un commentaire (admin — sans vérif propriétaire)
// ============================================
async function deleteAdminComment(commentId, btn) {
  if (!confirm("Supprimer définitivement ce commentaire ?")) return;
  if (!adminDB) return;

  btn.disabled = true;
  btn.textContent = "⏳ Suppression...";

  try {
    await adminDB.collection("comments").doc(commentId).delete();

    const item = document.querySelector(`.admin-comment-item[data-id="${commentId}"]`);
    if (item) {
      item.style.transition = "opacity 0.3s";
      item.style.opacity = "0";
      setTimeout(() => item.remove(), 300);
    }

    // Mettre à jour le compteur
    const remaining = document.querySelectorAll(".admin-comment-item").length - 1;
    document.getElementById("commentCount").textContent =
      remaining + (remaining > 1 ? " commentaires" : " commentaire");

    if (remaining <= 0) {
      setTimeout(() => {
        document.getElementById("adminComments").innerHTML =
          "<p class='admin-no-data'>Aucun commentaire pour le moment.</p>";
        document.getElementById("adminCommentsStats").style.display = "none";
      }, 350);
    }
  } catch (err) {
    console.error("Erreur suppression:", err);
    alert("Erreur lors de la suppression : " + err.message);
    btn.disabled = false;
    btn.textContent = "🗑️ Supprimer";
  }
}

// ============================================
// Utilitaire : échapper le HTML (sécurité XSS)
// ============================================
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

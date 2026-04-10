// ============================================
// ⚠️  CHANGEZ VOTRE CODE ADMIN ICI !
// ============================================
// Mettez le SHA-256 hash de votre mot de passe (pas le mot de passe lui-même !).
// Pour générer votre hash : ouvrez /admin.html et cliquez sur "Générer mon hash".
// ============================================
const ADMIN_CODE_HASH = "e57604404f40cdf174f4a7f8756845db72f1aaab0b77c817434671851d75df08";

// ============================================
// Compte Firebase Auth interne pour l'accès admin Firestore
// ⚠️ Créez ce compte dans Firebase Console → Authentication → Ajouter un utilisateur
// ============================================
const ADMIN_FIREBASE_EMAIL    = "admin-internal@craft-genius.local";
const ADMIN_FIREBASE_PASSWORD = "2444666668888888";

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
let adminAuth = null;

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
    adminAuth = firebase.auth();
  }

  // Masquer le générateur de hash si un hash est déjà configuré
  if (ADMIN_CODE_HASH) {
    const hashGen = document.querySelector(".admin-hash-generator");
    if (hashGen) hashGen.style.display = "none";
  }

  // Vérifier si déjà connecté en session (survit aux rafraîchissements)
  if (sessionStorage.getItem("adminLoggedIn") === "true") {
    // Reconnexion Firebase si la session admin est déjà active
    if (adminAuth && !adminAuth.currentUser) {
      adminAuth.signInWithEmailAndPassword(ADMIN_FIREBASE_EMAIL, ADMIN_FIREBASE_PASSWORD)
        .catch(e => console.warn("Auth admin:", e.message));
    }
    showDashboard();
  }

  // Boutons
  document
    .getElementById("adminLoginBtn")
    .addEventListener("click", handleLogin);
  document.getElementById("adminCodeInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });
  document
    .getElementById("adminLogoutBtn")
    .addEventListener("click", handleLogout);
  document
    .getElementById("saveSettings")
    .addEventListener("click", saveSettings);
  document
    .getElementById("refreshComments")
    .addEventListener("click", loadAllComments);
  document
    .getElementById("refreshUsers")
    .addEventListener("click", loadAllUsers);
  document
    .getElementById("usersSearchInput")
    .addEventListener("input", filterUsers);
  document
    .getElementById("aiOverlayToggle")
    .addEventListener("change", () => { markDirty(); updateToggleLabel(); });
});

// ============================================
// Dirty state (modifications non sauvegardées)
// ============================================
let settingsDirty = false;

function markDirty() {
  settingsDirty = true;
  const bar = document.querySelector(".admin-save-bar");
  if (bar) bar.classList.add("admin-save-bar--dirty");
}

function markClean() {
  settingsDirty = false;
  const bar = document.querySelector(".admin-save-bar");
  if (bar) bar.classList.remove("admin-save-bar--dirty");
}

// ============================================
// Connexion Admin
// ============================================
async function handleLogin() {
  const input = document.getElementById("adminCodeInput");
  const errorEl = document.getElementById("adminError");
  const btn = document.getElementById("adminLoginBtn");

  const enteredCode = input.value;
  console.log("handleLogin appelé, longueur du code:", enteredCode.length);

  if (!enteredCode) {
    shakeInput();
    return;
  }

  if (!ADMIN_CODE_HASH) {
    errorEl.textContent =
      "⚠️ Aucun hash configuré — lisez les commentaires dans admin.js";
    errorEl.style.display = "block";
    return;
  }

  btn.textContent = "⏳";
  btn.disabled = true;

  try {
    const enteredHash = await sha256(enteredCode);
    console.log("Hash calculé  :", enteredHash);
    console.log("Hash attendu  :", ADMIN_CODE_HASH);
    if (enteredHash === ADMIN_CODE_HASH) {
      sessionStorage.setItem("adminLoggedIn", "true");
      errorEl.style.display = "none";
      // Connexion Firebase Auth pour satisfaire les règles Firestore
      if (adminAuth && !adminAuth.currentUser) {
        adminAuth.signInWithEmailAndPassword(ADMIN_FIREBASE_EMAIL, ADMIN_FIREBASE_PASSWORD)
          .catch(e => console.warn("Auth admin:", e.message));
      }
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
    console.error("Erreur sha256:", err);
    errorEl.textContent = "❌ Erreur : " + err.message + " (vérifiez la console F12)";
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
  if (settingsDirty) {
    document.getElementById("logoutConfirmModal").style.display = "flex";
    document.getElementById("logoutSaveQuit").onclick = async () => {
      document.getElementById("logoutConfirmModal").style.display = "none";
      await saveSettings();
      doLogout();
    };
    document.getElementById("logoutDiscard").onclick = () => {
      document.getElementById("logoutConfirmModal").style.display = "none";
      markClean();
      doLogout();
    };
    document.getElementById("logoutCancel").onclick = () => {
      document.getElementById("logoutConfirmModal").style.display = "none";
    };
    return;
  }
  doLogout();
}

function doLogout() {
  markClean();
  sessionStorage.removeItem("adminLoggedIn");
  sessionStorage.removeItem("adminCode");
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
  await loadAllUsers();
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
    await adminDB
      .collection("siteSettings")
      .doc("main")
      .set({ aiOverlayVisible }, { merge: true });
    showSaveStatus("✅ Sauvegardé !", "success");
    markClean();
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
    container.innerHTML =
      "<p class='admin-error-msg'>Firebase non disponible.</p>";
    return;
  }

  container.innerHTML =
    "<p class='admin-loading'>⏳ Chargement des commentaires...</p>";
  statsEl.style.display = "none";

  try {
    const snapshot = await adminDB
      .collection("comments")
      .orderBy("timestamp", "desc")
      .get();

    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML =
        "<p class='admin-no-data'>Aucun commentaire pour le moment.</p>";
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

    const item = document.querySelector(
      `.admin-comment-item[data-id="${commentId}"]`,
    );
    if (item) {
      item.style.transition = "opacity 0.3s";
      item.style.opacity = "0";
      setTimeout(() => item.remove(), 300);
    }

    // Mettre à jour le compteur
    const remaining =
      document.querySelectorAll(".admin-comment-item").length - 1;
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

// ============================================
// Gestion des utilisateurs + IA illimitée
// ============================================
let allUsersCache = [];

async function loadAllUsers() {
  const container = document.getElementById("adminUsers");
  const statsEl   = document.getElementById("adminUsersStats");
  if (!adminDB) {
    container.innerHTML = "<p class='admin-error-msg'>Firebase non disponible.</p>";
    return;
  }

  container.innerHTML = "<p class='admin-loading'>⏳ Chargement des utilisateurs...</p>";
  statsEl.style.display = "none";

  try {
    const snapshot = await adminDB.collection("users").get();
    allUsersCache = [];
    snapshot.forEach(doc => allUsersCache.push({ id: doc.id, ...doc.data() }));
    allUsersCache.sort((a, b) => (a.email || "").localeCompare(b.email || ""));

    const unlimited = allUsersCache.filter(u => u.aiUnlimited).length;
    document.getElementById("userCount").textContent =
      allUsersCache.length + (allUsersCache.length > 1 ? " utilisateurs" : " utilisateur");
    document.getElementById("unlimitedCount").textContent =
      unlimited + " IA illimité" + (unlimited > 1 ? "s" : "");
    statsEl.style.display = "flex";

    renderUsers(allUsersCache);
  } catch (err) {
    console.error("Erreur chargement utilisateurs:", err);
    container.innerHTML = "<p class='admin-error-msg'>Erreur : " + escapeHtml(err.message) + "</p>";
  }
}

function filterUsers() {
  const q = document.getElementById("usersSearchInput").value.toLowerCase();
  const filtered = allUsersCache.filter(u =>
    (u.email || "").toLowerCase().includes(q) ||
    (u.displayName || "").toLowerCase().includes(q)
  );
  renderUsers(filtered);
}

function renderUsers(users) {
  const container = document.getElementById("adminUsers");
  if (users.length === 0) {
    container.innerHTML = "<p class='admin-no-data'>Aucun utilisateur trouvé.</p>";
    return;
  }
  container.innerHTML = "";
  users.forEach(user => container.appendChild(createUserEl(user)));
}

function createUserEl(user) {
  const div = document.createElement("div");
  div.className = "admin-user-item" + (user.aiUnlimited ? " admin-user-unlimited" : "");
  div.dataset.id = user.id;

  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("fr-FR")
    : "Inconnue";

  div.innerHTML = `
    <div class="admin-user-info">
      <div class="admin-user-avatar">${(user.displayName || user.email || "?")[0].toUpperCase()}</div>
      <div class="admin-user-details">
        <span class="admin-user-name">${escapeHtml(user.displayName || "Sans nom")}</span>
        <span class="admin-user-email">${escapeHtml(user.email || user.id)}</span>
        <span class="admin-user-date">Inscrit le ${escapeHtml(joined)}</span>
      </div>
    </div>
    <div class="admin-user-actions">
      ${user.aiUnlimited
        ? `<span class="admin-ai-badge admin-ai-badge--on">⚡ IA illimitée</span>
           <button class="admin-btn admin-btn-revoke" onclick="setAiUnlimited('${escapeHtml(user.id)}', false, this)">Révoquer</button>`
        : `<span class="admin-ai-badge admin-ai-badge--off">🔒 Limité</span>
           <button class="admin-btn admin-btn-grant" onclick="setAiUnlimited('${escapeHtml(user.id)}', true, this)">Accorder ⚡</button>`
      }
    </div>
  `;
  return div;
}

async function setAiUnlimited(userId, value, btn) {
  if (!adminDB) return;
  btn.disabled = true;
  btn.textContent = "⏳";
  try {
    await adminDB.collection("users").doc(userId).set(
      { aiUnlimited: value },
      { merge: true }
    );
    // Mettre à jour le cache local
    const cached = allUsersCache.find(u => u.id === userId);
    if (cached) cached.aiUnlimited = value;

    // Re-render la ligne
    const item = document.querySelector(`.admin-user-item[data-id="${userId}"]`);
    if (item) {
      const newEl = createUserEl(allUsersCache.find(u => u.id === userId));
      item.replaceWith(newEl);
    }

    // Mettre à jour le compteur
    const unlimited = allUsersCache.filter(u => u.aiUnlimited).length;
    document.getElementById("unlimitedCount").textContent =
      unlimited + " IA illimité" + (unlimited > 1 ? "s" : "");
  } catch (err) {
    console.error("Erreur mise à jour IA illimitée:", err);
    alert("Erreur : " + err.message);
    btn.disabled = false;
    btn.textContent = value ? "Accorder ⚡" : "Révoquer";
  }
}

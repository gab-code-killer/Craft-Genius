// Système de commentaires avec Firebase

let commentsDB = null;
let currentUser = null;
let currentUsername = null;
const externalBlockedWords = [];

const blockedWords = [
  "con",
  "cons",
  "connard",
  "connards",
  "connasse",
  "connasses",
  "fdp",
  "fils de pute",
  "fils de p",
  "salope",
  "salopes",
  "salaud",
  "salauds",
  "ta gueule",
  "pute",
  "putain",
  "putains",
  "encule",
  "enculé",
  "enculee",
  "enculée",
  "encules",
  "enculés",
  "batard",
  "bâtard",
  "batards",
  "bâtards",
  "bordel",
  "merde",
  "merdes",
  "nique",
  "niquer",
  "nique ta",
  "ferme ta gueule",
  "shit",
  "damn",
  "dumbass",
  "bitch",
  "bitches",
  "asshole",
  "assholes",
  "bastard",
  "bastards",
  "motherfucker",
  "motherfuckers",
  "wtf",
  "stfu",
  "fuck",
  "fucked",
  "fucking",
  "fucker",
  "fuk",
];

function getText(key, fallback) {
  if (typeof window.getUiText === "function") {
    return window.getUiText(key, fallback);
  }
  if (window.appTranslations && window.currentLang) {
    return window.appTranslations[window.currentLang]?.[key] ?? fallback ?? key;
  }
  return fallback ?? key;
}

function getLocale() {
  return window.currentLang === "en" ? "en-US" : "fr-FR";
}

function generateLocalCommentId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isCommentOwner(comment) {
  return Boolean(currentUser && comment?.userId && comment.userId === currentUser.uid);
}

function getCommentValidationError(text) {
  if (!text) {
    return getText("commentEmpty", "Veuillez entrer un commentaire");
  }

  if (text.length < 5) {
    return getText(
      "commentTooShort",
      "Le commentaire doit contenir au moins 5 caractères",
    );
  }

  if (containsBlockedWord(text)) {
    return getText(
      "commentBlockedLanguage",
      "⚠️ Votre commentaire contient un langage inapproprié.",
    );
  }

  return null;
}

function normalizeForFilter(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function loadExternalProfanityList() {
  try {
    const response = await fetch("profanity-en.json", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const words = await response.json();
    if (!Array.isArray(words)) {
      return;
    }

    words.forEach((word) => {
      if (typeof word !== "string") {
        return;
      }
      const trimmedWord = word.trim();
      if (trimmedWord.length >= 3) {
        externalBlockedWords.push(trimmedWord);
      }
    });
  } catch (error) {
    console.log("Liste externe de mots bloqués non chargée");
  }
}

function containsBlockedWord(text) {
  const normalizedText = normalizeForFilter(text);
  const allBlockedWords = [...blockedWords, ...externalBlockedWords];

  return allBlockedWords.some((word) => {
    const normalizedWord = normalizeForFilter(word);
    const cleanedWord = normalizedWord.replace(/\*/g, "").trim();
    if (cleanedWord.length < 3) {
      return false;
    }

    const escapedWord = escapeRegExp(cleanedWord);
    const pattern = new RegExp(`(^|[^a-z0-9])${escapedWord}([^a-z0-9]|$)`);
    return pattern.test(normalizedText);
  });
}

// Initialiser Firestore si Firebase est prêt
document.addEventListener("DOMContentLoaded", function () {
  loadExternalProfanityList();

  setTimeout(() => {
    // Vérifier d'abord si utilisateur est connecté via localStorage
    const userFromStorage = localStorage.getItem("user");
    if (userFromStorage) {
      try {
        const userData = JSON.parse(userFromStorage);
        currentUsername = userData.username;
        currentUser = { uid: userData.uid, email: userData.email };
        updateCommentFormForUser();
      } catch (e) {
        console.log("Erreur parsing utilisateur depuis localStorage");
        updateCommentFormForUser(); // Afficher le message "pas connecté"
      }
    } else {
      updateCommentFormForUser(); // Afficher le message "pas connecté"
    }

    if (typeof firebase !== "undefined" && firebase.firestore) {
      commentsDB = firebase.firestore();

      // Récupérer l'utilisateur actuel
      if (typeof firebase !== "undefined" && firebase.auth) {
        const auth = firebase.auth();
        auth.onAuthStateChanged((user) => {
          currentUser = user;

          if (user) {
            // Récupérer le pseudo depuis Firestore
            commentsDB
              .collection("users")
              .doc(user.uid)
              .get()
              .then((doc) => {
                if (doc.exists) {
                  currentUsername = doc.data().username;
                } else {
                  currentUsername = user.email.split("@")[0];
                }
                updateCommentFormForUser();
                loadComments();
              })
              .catch((error) => {
                console.error("Erreur récupération pseudo:", error);
                loadComments();
              });
          } else {
            currentUsername = null;
            updateCommentFormForUser();
            loadComments();
          }
        });
      } else {
        loadComments();
      }
    } else {
      console.log("Firebase non disponible, utilisation du localStorage");
      loadCommentsLocal();
    }
  }, 1000);

  setupCommentForm();
  setupCharCounter();
  setupCommentActions();
});

function updateCommentFormForUser() {
  const commentNameInput = document.getElementById("commentName");
  const commentNameGroup = document.getElementById("commentNameGroup");
  const commentFormContainer = document.getElementById("commentFormContainer");
  const notConnectedMessage = document.getElementById("notConnectedMessage");

  if (
    commentNameGroup &&
    commentNameInput &&
    commentFormContainer &&
    notConnectedMessage
  ) {
    if (currentUser && currentUsername) {
      // Utilisateur connecté - afficher le formulaire, masquer le message
      commentFormContainer.style.display = "block";
      notConnectedMessage.style.display = "none";
      commentNameGroup.style.display = "none";
      commentNameInput.value = currentUsername;
    } else {
      // Utilisateur non connecté - afficher le message, masquer le formulaire
      commentFormContainer.style.display = "none";
      notConnectedMessage.style.display = "block";
    }
  }
}

function setupCharCounter() {
  const commentText = document.getElementById("commentText");
  const charCount = document.getElementById("charCount");

  commentText.addEventListener("input", function () {
    charCount.textContent = this.value.length + "/500";
  });
}

function setupCommentForm() {
  const submitBtn = document.getElementById("submitComment");
  submitBtn.addEventListener("click", submitComment);

  // Permet d'envoyer avec Ctrl+Entrée
  document
    .getElementById("commentText")
    .addEventListener("keydown", function (e) {
      if (e.ctrlKey && e.key === "Enter") {
        submitComment();
      }
    });
}

function setupCommentActions() {
  const commentsContainer = document.getElementById("commentsContainer");
  if (!commentsContainer) {
    return;
  }

  commentsContainer.addEventListener("click", async (event) => {
    const actionButton = event.target.closest(".comment-action-btn");
    if (!actionButton) {
      return;
    }

    const action = actionButton.dataset.action;
    const commentId = actionButton.dataset.id;
    const source = actionButton.dataset.source || "firebase";

    if (!commentId) {
      return;
    }

    if (action === "edit") {
      await editComment(commentId, source);
      return;
    }

    if (action === "delete") {
      await deleteComment(commentId, source);
    }
  });
}

function submitComment() {
  let name = document.getElementById("commentName").value.trim();
  const text = document.getElementById("commentText").value.trim();

  // Si l'utilisateur n'est pas connecté, montrer l'erreur
  if (!currentUser) {
    showMessage(
      getText(
        "commentLoginRequired",
        "🔒 Vous devez être connecté pour poster un commentaire",
      ),
      "error",
    );
    return;
  }

  // Si utilisateur connecté, utiliser son pseudo
  if (currentUser && currentUsername) {
    name = currentUsername;
  }

  const validationError = getCommentValidationError(text);
  if (validationError) {
    showMessage(validationError, "error");
    return;
  }

  // Création du commentaire avec structure améliorée
  const comment = {
    name: name,
    text: text,
    userId: currentUser?.uid || null, // Ajouter l'ID utilisateur si connecté
    timestamp: firebase.firestore.FieldValue.serverTimestamp(), // Utiliser le timestamp serveur
    date: new Date().toLocaleString(getLocale(), {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }),
    likes: 0, // Pour les futurs like/votes
    replies: [], // Pour les futures réponses
  };

  // Sauvegarder
  if (commentsDB) {
    // Utiliser Firebase
    commentsDB
      .collection("comments")
      .add(comment)
      .then((docRef) => {
        showMessage(
          getText("commentPostedSuccess", "✅ Commentaire publié avec succès!"),
          "success",
        );
        clearForm();
        loadComments();
      })
      .catch((error) => {
        console.error("Erreur Firebase:", error);
        // Fallback sur localStorage
        const fallbackComment = {
          ...comment,
          id: generateLocalCommentId(),
          timestamp: new Date().toISOString(),
        };
        saveCommentLocal(fallbackComment);
        showMessage(
          getText(
            "commentSavedLocalSuccess",
            "✅ Commentaire sauvegardé localement!",
          ),
          "success",
        );
        clearForm();
        loadCommentsLocal();
      });
  } else {
    // Utiliser localStorage
    const fallbackComment = {
      ...comment,
      id: generateLocalCommentId(),
      timestamp: new Date().toISOString(),
    };
    saveCommentLocal(fallbackComment);
    showMessage(
      getText("commentPostedLocalSuccess", "✅ Commentaire publié!"),
      "success",
    );
    clearForm();
    loadCommentsLocal();
  }
}

function clearForm() {
  document.getElementById("commentName").value = "";
  document.getElementById("commentText").value = "";
  document.getElementById("charCount").textContent = "0/500";
}

function showMessage(message, type) {
  const messageDiv = document.getElementById("commentMessage");
  messageDiv.textContent = message;
  messageDiv.className = "comment-message " + type;

  setTimeout(() => {
    messageDiv.style.display = "none";
  }, 4000);
}

// === CHARGEMENT AVEC FIREBASE ===
function loadComments() {
  const container = document.getElementById("commentsContainer");

  if (!commentsDB) {
    loadCommentsLocal();
    return;
  }

  commentsDB
    .collection("comments")
    .orderBy("timestamp", "desc")
    .limit(50)
    .onSnapshot(
      (snapshot) => {
        container.innerHTML = "";

        if (snapshot.empty) {
          container.innerHTML = `<p class="no-comments">${getText("noComments", "Aucun commentaire pour le moment. Soyez le premier! 👇")}</p>`;
          return;
        }

        snapshot.forEach((doc) => {
          const comment = doc.data();
          const html = createCommentHTML(comment, doc.id, "firebase");
          container.innerHTML += html;
        });
      },
      (error) => {
        console.error("Erreur chargement:", error);
        loadCommentsLocal();
      },
    );
}

// === CHARGEMENT AVEC LOCALSTORAGE ===
function loadCommentsLocal() {
  const container = document.getElementById("commentsContainer");
  const comments = JSON.parse(
    localStorage.getItem("craftGenius_comments") || "[]",
  );

  container.innerHTML = "";

  if (comments.length === 0) {
    container.innerHTML = `<p class="no-comments">${getText("noComments", "Aucun commentaire pour le moment. Soyez le premier! 👇")}</p>`;
    return;
  }

  let shouldSave = false;
  comments.forEach((comment) => {
    if (!comment.id) {
      comment.id = generateLocalCommentId();
      shouldSave = true;
    }
  });

  if (shouldSave) {
    localStorage.setItem("craftGenius_comments", JSON.stringify(comments));
  }

  // Trier par date décroissante
  comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  comments.forEach((comment) => {
    const html = createCommentHTML(comment, comment.id, "local");
    container.innerHTML += html;
  });
}

function saveCommentLocal(comment) {
  const comments = JSON.parse(
    localStorage.getItem("craftGenius_comments") || "[]",
  );
  comments.push({
    ...comment,
    id: comment.id || generateLocalCommentId(),
  });
  localStorage.setItem("craftGenius_comments", JSON.stringify(comments));
}

async function editComment(commentId, source) {
  if (!currentUser) {
    showMessage(
      getText(
        "commentLoginRequired",
        "🔒 Vous devez être connecté pour poster un commentaire",
      ),
      "error",
    );
    return;
  }

  if (source === "firebase" && commentsDB) {
    try {
      const commentRef = commentsDB.collection("comments").doc(commentId);
      const commentDoc = await commentRef.get();

      if (!commentDoc.exists) {
        showMessage(getText("commentNotFound", "Commentaire introuvable."), "error");
        return;
      }

      const comment = commentDoc.data();
      if (!isCommentOwner(comment)) {
        showMessage(
          getText(
            "commentNotOwner",
            "❌ Vous ne pouvez modifier que vos propres commentaires.",
          ),
          "error",
        );
        return;
      }

      const updatedText = window.prompt(
        getText("commentEditPrompt", "Modifiez votre commentaire :"),
        comment.text || "",
      );

      if (updatedText === null) {
        return;
      }

      const nextText = updatedText.trim();
      const validationError = getCommentValidationError(nextText);
      if (validationError) {
        showMessage(validationError, "error");
        return;
      }

      await commentRef.update({
        text: nextText,
        date: new Date().toLocaleString(getLocale(), {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        }),
        editedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      showMessage(
        getText("commentEditedSuccess", "✅ Commentaire modifié avec succès!"),
        "success",
      );
    } catch (error) {
      console.error("Erreur modification commentaire:", error);
      showMessage(
        getText("commentEditError", "❌ Erreur lors de la modification."),
        "error",
      );
    }
    return;
  }

  const comments = JSON.parse(localStorage.getItem("craftGenius_comments") || "[]");
  const index = comments.findIndex((comment) => comment.id === commentId);

  if (index === -1) {
    showMessage(getText("commentNotFound", "Commentaire introuvable."), "error");
    return;
  }

  const comment = comments[index];
  if (!isCommentOwner(comment)) {
    showMessage(
      getText(
        "commentNotOwner",
        "❌ Vous ne pouvez modifier que vos propres commentaires.",
      ),
      "error",
    );
    return;
  }

  const updatedText = window.prompt(
    getText("commentEditPrompt", "Modifiez votre commentaire :"),
    comment.text || "",
  );

  if (updatedText === null) {
    return;
  }

  const nextText = updatedText.trim();
  const validationError = getCommentValidationError(nextText);
  if (validationError) {
    showMessage(validationError, "error");
    return;
  }

  comments[index] = {
    ...comment,
    text: nextText,
    date: new Date().toLocaleString(getLocale(), {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }),
    editedAt: new Date().toISOString(),
  };

  localStorage.setItem("craftGenius_comments", JSON.stringify(comments));
  loadCommentsLocal();
  showMessage(
    getText("commentEditedSuccess", "✅ Commentaire modifié avec succès!"),
    "success",
  );
}

async function deleteComment(commentId, source) {
  if (!currentUser) {
    showMessage(
      getText(
        "commentLoginRequired",
        "🔒 Vous devez être connecté pour poster un commentaire",
      ),
      "error",
    );
    return;
  }

  const confirmDelete = window.confirm(
    getText(
      "commentDeleteConfirm",
      "Voulez-vous vraiment supprimer ce commentaire ?",
    ),
  );

  if (!confirmDelete) {
    return;
  }

  if (source === "firebase" && commentsDB) {
    try {
      const commentRef = commentsDB.collection("comments").doc(commentId);
      const commentDoc = await commentRef.get();

      if (!commentDoc.exists) {
        showMessage(getText("commentNotFound", "Commentaire introuvable."), "error");
        return;
      }

      const comment = commentDoc.data();
      if (!isCommentOwner(comment)) {
        showMessage(
          getText(
            "commentNotOwnerDelete",
            "❌ Vous ne pouvez supprimer que vos propres commentaires.",
          ),
          "error",
        );
        return;
      }

      await commentRef.delete();
      showMessage(
        getText("commentDeletedSuccess", "🗑️ Commentaire supprimé."),
        "success",
      );
    } catch (error) {
      console.error("Erreur suppression commentaire:", error);
      showMessage(
        getText("commentDeleteError", "❌ Erreur lors de la suppression."),
        "error",
      );
    }
    return;
  }

  const comments = JSON.parse(localStorage.getItem("craftGenius_comments") || "[]");
  const index = comments.findIndex((comment) => comment.id === commentId);

  if (index === -1) {
    showMessage(getText("commentNotFound", "Commentaire introuvable."), "error");
    return;
  }

  const comment = comments[index];
  if (!isCommentOwner(comment)) {
    showMessage(
      getText(
        "commentNotOwnerDelete",
        "❌ Vous ne pouvez supprimer que vos propres commentaires.",
      ),
      "error",
    );
    return;
  }

  comments.splice(index, 1);
  localStorage.setItem("craftGenius_comments", JSON.stringify(comments));
  loadCommentsLocal();
  showMessage(
    getText("commentDeletedSuccess", "🗑️ Commentaire supprimé."),
    "success",
  );
}

function createCommentHTML(comment, commentId, source = "firebase") {
  const canManage = isCommentOwner(comment) && Boolean(commentId);
  const dateText = escapeHtml(
    String(comment.date || getText("commentJustNow", "juste à l'instant")),
  );
  const editedLabel = comment.editedAt
    ? ` · ${escapeHtml(getText("commentEdited", "modifié"))}`
    : "";
  const actionsHTML = canManage
    ? `
      <div class="comment-actions">
        <button class="comment-action-btn" data-action="edit" data-id="${escapeHtml(String(commentId))}" data-source="${escapeHtml(source)}">
          ${escapeHtml(getText("commentEdit", "Modifier"))}
        </button>
        <button class="comment-action-btn delete" data-action="delete" data-id="${escapeHtml(String(commentId))}" data-source="${escapeHtml(source)}">
          ${escapeHtml(getText("commentDelete", "Supprimer"))}
        </button>
      </div>
    `
    : "";

  return `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-name">👤 ${escapeHtml(comment.name)}</span>
                <span class="comment-date">${dateText}${editedLabel}</span>
            </div>
            <div class="comment-text">${escapeHtml(comment.text)}</div>
            ${actionsHTML}
        </div>
    `;
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

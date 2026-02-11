// Système de commentaires avec Firebase

let commentsDB = null;
let currentUser = null;
let currentUsername = null;

function getText(key, fallback) {
    if (typeof window.getUiText === 'function') {
        return window.getUiText(key, fallback);
    }
    if (window.appTranslations && window.currentLang) {
        return window.appTranslations[window.currentLang]?.[key] ?? fallback ?? key;
    }
    return fallback ?? key;
}

function getLocale() {
    return window.currentLang === 'en' ? 'en-US' : 'fr-FR';
}

// Initialiser Firestore si Firebase est prêt
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        // Vérifier d'abord si utilisateur est connecté via localStorage
        const userFromStorage = localStorage.getItem('user');
        if (userFromStorage) {
            try {
                const userData = JSON.parse(userFromStorage);
                currentUsername = userData.username;
                currentUser = { uid: userData.uid, email: userData.email };
                updateCommentFormForUser();
            } catch (e) {
                console.log('Erreur parsing utilisateur depuis localStorage');
                updateCommentFormForUser(); // Afficher le message "pas connecté"
            }
        } else {
            updateCommentFormForUser(); // Afficher le message "pas connecté"
        }

        if (typeof firebase !== 'undefined' && firebase.firestore) {
            commentsDB = firebase.firestore();
            
            // Récupérer l'utilisateur actuel
            if (typeof firebase !== 'undefined' && firebase.auth) {
                const auth = firebase.auth();
                auth.onAuthStateChanged((user) => {
                    currentUser = user;
                    
                    if (user) {
                        // Récupérer le pseudo depuis Firestore
                        commentsDB.collection('users').doc(user.uid).get()
                            .then((doc) => {
                                if (doc.exists) {
                                    currentUsername = doc.data().username;
                                } else {
                                    currentUsername = user.email.split('@')[0];
                                }
                                updateCommentFormForUser();
                                loadComments();
                            })
                            .catch((error) => {
                                console.error('Erreur récupération pseudo:', error);
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
            console.log('Firebase non disponible, utilisation du localStorage');
            loadCommentsLocal();
        }
    }, 1000);

    setupCommentForm();
    setupCharCounter();
});

function updateCommentFormForUser() {
    const commentNameInput = document.getElementById('commentName');
    const commentNameGroup = document.getElementById('commentNameGroup');
    const commentFormContainer = document.getElementById('commentFormContainer');
    const notConnectedMessage = document.getElementById('notConnectedMessage');
    
    if (commentNameGroup && commentNameInput && commentFormContainer && notConnectedMessage) {
        if (currentUser && currentUsername) {
            // Utilisateur connecté - afficher le formulaire, masquer le message
            commentFormContainer.style.display = 'block';
            notConnectedMessage.style.display = 'none';
            commentNameGroup.style.display = 'none';
            commentNameInput.value = currentUsername;
        } else {
            // Utilisateur non connecté - afficher le message, masquer le formulaire
            commentFormContainer.style.display = 'none';
            notConnectedMessage.style.display = 'block';
        }
    }
}

function setupCharCounter() {
    const commentText = document.getElementById('commentText');
    const charCount = document.getElementById('charCount');

    commentText.addEventListener('input', function() {
        charCount.textContent = this.value.length + '/500';
    });
}

function setupCommentForm() {
    const submitBtn = document.getElementById('submitComment');
    submitBtn.addEventListener('click', submitComment);

    // Permet d'envoyer avec Ctrl+Entrée
    document.getElementById('commentText').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            submitComment();
        }
    });
}

function submitComment() {
    let name = document.getElementById('commentName').value.trim();
    const text = document.getElementById('commentText').value.trim();
    const messageDiv = document.getElementById('commentMessage');

    // Si l'utilisateur n'est pas connecté, montrer l'erreur
    if (!currentUser) {
        showMessage(getText('commentLoginRequired', '🔒 Vous devez être connecté pour poster un commentaire'), 'error');
        return;
    }

    // Si utilisateur connecté, utiliser son pseudo
    if (currentUser && currentUsername) {
        name = currentUsername;
    }

    if (!text) {
        showMessage(getText('commentEmpty', 'Veuillez entrer un commentaire'), 'error');
        return;
    }
    if (text.length < 5) {
        showMessage(getText('commentTooShort', 'Le commentaire doit contenir au moins 5 caractères'), 'error');
        return;
    }

    // Création du commentaire avec structure améliorée
    const comment = {
        name: name,
        text: text,
        userId: currentUser?.uid || null,  // Ajouter l'ID utilisateur si connecté
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),  // Utiliser le timestamp serveur
        date: new Date().toLocaleString(getLocale(), {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        }),
        likes: 0,  // Pour les futurs like/votes
        replies: []  // Pour les futures réponses
    };

    // Sauvegarder
    if (commentsDB) {
        // Utiliser Firebase
        commentsDB.collection('comments').add(comment)
            .then((docRef) => {
                showMessage(getText('commentPostedSuccess', '✅ Commentaire publié avec succès!'), 'success');
                clearForm();
                loadComments();
            })
            .catch((error) => {
                console.error('Erreur Firebase:', error);
                // Fallback sur localStorage
                const fallbackComment = { ...comment, timestamp: new Date().toISOString() };
                saveCommentLocal(fallbackComment);
                showMessage(getText('commentSavedLocalSuccess', '✅ Commentaire sauvegardé localement!'), 'success');
                clearForm();
                loadCommentsLocal();
            });
    } else {
        // Utiliser localStorage
        const fallbackComment = { ...comment, timestamp: new Date().toISOString() };
        saveCommentLocal(fallbackComment);
        showMessage(getText('commentPostedLocalSuccess', '✅ Commentaire publié!'), 'success');
        clearForm();
        loadCommentsLocal();
    }
}

function clearForm() {
    document.getElementById('commentName').value = '';
    document.getElementById('commentText').value = '';
    document.getElementById('charCount').textContent = '0/500';
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('commentMessage');
    messageDiv.textContent = message;
    messageDiv.className = 'comment-message ' + type;
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 4000);
}

// === CHARGEMENT AVEC FIREBASE ===
function loadComments() {
    const container = document.getElementById('commentsContainer');
    
    if (!commentsDB) {
        loadCommentsLocal();
        return;
    }

    commentsDB.collection('comments')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .onSnapshot(
            (snapshot) => {
                container.innerHTML = '';
                
                if (snapshot.empty) {
                    container.innerHTML = `<p class="no-comments">${getText('noComments', 'Aucun commentaire pour le moment. Soyez le premier! 👇')}</p>`;
                    return;
                }

                snapshot.forEach((doc) => {
                    const comment = doc.data();
                    const html = createCommentHTML(comment);
                    container.innerHTML += html;
                });
            },
            (error) => {
                console.error('Erreur chargement:', error);
                loadCommentsLocal();
            }
        );
}

// === CHARGEMENT AVEC LOCALSTORAGE ===
function loadCommentsLocal() {
    const container = document.getElementById('commentsContainer');
    const comments = JSON.parse(localStorage.getItem('craftGenius_comments') || '[]');
    
    container.innerHTML = '';

    if (comments.length === 0) {
        container.innerHTML = `<p class="no-comments">${getText('noComments', 'Aucun commentaire pour le moment. Soyez le premier! 👇')}</p>`;
        return;
    }

    // Trier par date décroissante
    comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    comments.forEach((comment) => {
        const html = createCommentHTML(comment);
        container.innerHTML += html;
    });
}

function saveCommentLocal(comment) {
    const comments = JSON.parse(localStorage.getItem('craftGenius_comments') || '[]');
    comments.push(comment);
    localStorage.setItem('craftGenius_comments', JSON.stringify(comments));
}

function createCommentHTML(comment) {
    return `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-name">👤 ${escapeHtml(comment.name)}</span>
                <span class="comment-date">${comment.date || getText('commentJustNow', "juste à l'instant")}</span>
            </div>
            <div class="comment-text">${escapeHtml(comment.text)}</div>
        </div>
    `;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

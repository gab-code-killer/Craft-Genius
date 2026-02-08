// ============================================
// Configuration Firebase
// ============================================
// IMPORTANT: Remplacez ces valeurs par votre configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDV9nR4R9DrLBF7xkQzihLtzl8cOipUaC0",
    authDomain: "craft-genius-201e6.firebaseapp.com",
    projectId: "craft-genius-201e6",
    storageBucket: "craft-genius-201e6.firebasestorage.app",
    messagingSenderId: "476192035823",
    appId: "1:476192035823:web:9f3c8a72fa2eef9bb99c1a"
};

// Initialiser Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// ============================================
// Variables DOM
// ============================================
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginFormElement = document.getElementById('loginFormElement');
const signupFormElement = document.getElementById('signupFormElement');
const loadingSpinner = document.getElementById('loadingSpinner');

// ============================================
// Toggle entre Login et Signup
// ============================================
function toggleAuth() {
    loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
    signupForm.style.display = signupForm.style.display === 'none' ? 'block' : 'none';
    clearMessages();
}

// ============================================
// Afficher/Masquer les messages
// ============================================
function showMessage(element, message, type) {
    const messageEl = element;
    messageEl.textContent = message;
    messageEl.classList.add('show');
    
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 5000);
}

function clearMessages() {
    document.getElementById('loginError').classList.remove('show');
    document.getElementById('loginSuccess').classList.remove('show');
    document.getElementById('signupError').classList.remove('show');
    document.getElementById('signupSuccess').classList.remove('show');
}

// ============================================
// Afficher/Masquer le spinner
// ============================================
function showLoading(show = true) {
    loadingSpinner.style.display = show ? 'flex' : 'none';
    loginFormElement.style.display = show ? 'none' : 'block';
    signupFormElement.style.display = show ? 'none' : 'block';
}

// ============================================
// LOGIN
// ============================================
loginFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const successEl = document.getElementById('loginSuccess');
    
    // Validation
    if (!email || !password) {
        showMessage(errorEl, '❌ Veuillez remplir tous les champs', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // Connexion avec Firebase
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Récupérer les données utilisateur de Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            // Sauvegarder les données utilisateur en localStorage
            localStorage.setItem('user', JSON.stringify({
                uid: user.uid,
                email: user.email,
                username: userData.username,
                createdAt: userData.createdAt
            }));
        }
        
        showMessage(successEl, '✅ Connexion réussie! Redirection...', 'success');
        
        // Redirection après 1.5 secondes
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        showLoading(false);
        let errorMessage = '❌ Erreur de connexion';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = '❌ Email non trouvé';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = '❌ Mot de passe incorrect';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = '❌ Email invalide';
        }
        
        showMessage(errorEl, errorMessage, 'error');
        console.error('Erreur login:', error);
    }
});

// ============================================
// SIGNUP/INSCRIPTION
// ============================================
signupFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const errorEl = document.getElementById('signupError');
    const successEl = document.getElementById('signupSuccess');
    
    // Validation
    if (!username || !email || !password || !confirmPassword) {
        showMessage(errorEl, '❌ Veuillez remplir tous les champs', 'error');
        return;
    }
    
    if (username.length < 3) {
        showMessage(errorEl, '❌ Le pseudo doit avoir au moins 3 caractères', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage(errorEl, '❌ Le mot de passe doit avoir au moins 6 caractères', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage(errorEl, '❌ Les mots de passe ne correspondent pas', 'error');
        return;
    }
    
    // Valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage(errorEl, '❌ Email invalide', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // Créer le compte Firebase
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Sauvegarder les données utilisateur dans Firestore
        await db.collection('users').doc(user.uid).set({
            username: username,
            email: email,
            createdAt: new Date(),
            favorites: [],
            history: []
        });
        
        // Sauvegarder en localStorage
        localStorage.setItem('user', JSON.stringify({
            uid: user.uid,
            email: email,
            username: username,
            createdAt: new Date()
        }));
        
        showMessage(successEl, '✅ Compte créé avec succès! Redirection...', 'success');
        
        // Redirection après 1.5 secondes
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        showLoading(false);
        let errorMessage = '❌ Erreur lors de l\'inscription';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = '❌ Cet email est déjà utilisé';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = '❌ Le mot de passe est trop faible';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = '❌ Email invalide';
        }
        
        showMessage(errorEl, errorMessage, 'error');
        console.error('Erreur signup:', error);
    }
});

// ============================================
// Vérifier l'état de connexion à la charge
// ============================================
auth.onAuthStateChanged((user) => {
    if (user) {
        // L'utilisateur est connecté, rediriger vers index
        window.location.href = 'index.html';
    }
});

// ============================================
// Gérer le thème (similaire à index.html)
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Définir le thème par défaut
    document.documentElement.setAttribute('data-theme', 'light');
    
    // Récupérer le thème sauvegardé s'il existe
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
});

# 🎮 Craft Genius - Guide Firebase

## 📦 Installation et Configuration Firebase

### Étape 1: Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Cliquez sur **"Add project"** / **"Ajouter un projet"**
3. Entrez votre nom de projet (ex: `craft-genius`)
4. Acceptez les conditions et créez le projet

### Étape 2: Activer Firebase Authentication

1. Dans la Firebase Console, allez à **Authentication** → **Get Started**
2. Activez la méthode **Email/Password**

### Étape 3: Créer une base de données Firestore

1. Allez à **Firestore Database** → **Create Database**
2. Choisissez **Mode Test** (pour développement)
3. Sélectionnez la région la plus proche

### Étape 4: Récupérer vos identifiants Firebase

1. Allez à **Project Settings** (⚙️ en bas à gauche)
2. Sous **"Your apps"**, créez une app web (</> icon)
3. Copiez la configuration Firebase:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Étape 5: Configurer vos fichiers

#### Dans `script.js` (ligne ~143):
Remplacez le `firebaseConfig` avec vos vrais identifiants

#### Dans `auth.js` (ligne ~11):
Remplacez le `firebaseConfig` avec vos vrais identifiants

### Étape 6: Configurer les règles Firestore

1. Allez à **Firestore** → **Rules**
2. Remplacez le contenu par:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Règles pour la collection users
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    
    // Règles pour la collection comments
    match /comments/{document=**} {
      // Lire tous les commentaires
      allow read: if true;
      
      // Créer un commentaire (l'utilisateur peut être connecté ou non)
      allow create: if request.resource.data.text.size() > 0 && 
                       request.resource.data.name != null;
      
      // Supprimer son propre commentaire (si on a un userId)
      allow delete: if request.auth != null && 
                       request.auth.uid == resource.data.userId;
      
      // Modifier son propre commentaire
      allow update: if request.auth != null && 
                       request.auth.uid == resource.data.userId;
    }
  }
}
```

3. Cliquez sur **"Publish"**

### Étape 7: Configurer les règles Authentication

1. Allez à **Authentication** → **Settings**
2. Sous **"Authorized domains"**, ajoutez:
   - `localhost`
   - `localhost:8000`
   - Votre domaine de production (si existant)

---

## 🚀 Utilisation

### Page de connexion:
- URL: `/auth.html`
- Permet de **créer un compte** ou **se connecter**

### Dans `index.html`:
- Un bouton **🔒 Se connecter** erscheint dans la navbar
- Une fois connecté, affiche le **👤 pseudo** avec menu de profil
- Menu profil avec **🚪 Déconnexion**

### Données stockées:

**Collections Firestore:**
```
users/
  {uid}/
    - username: string
    - email: string
    - createdAt: timestamp
    - favorites: array
    - history: array

comments/
  {commentId}/
    - name: string (nom du commentateur)
    - text: string (contenu du commentaire)
    - userId: string (uid de l'utilisateur, null si non connecté)
    - timestamp: timestamp (serveur)
    - date: string (formatée)
    - likes: number (pour futurs votes)
    - replies: array (pour futures réponses)
```

---

## ✅ Checklist de configuration

- [ ] Projet Firebase créé
- [ ] Authentication Email/Password activée
- [ ] Firestore Database créée
- [ ] Identifiants Firebase copiés dans `script.js`
- [ ] Identifiants Firebase copiés dans `auth.js`
- [ ] Règles Firestore configurées
- [ ] Domaines autorisés configurés
- [ ] Tester l'inscription sur `/auth.html`
- [ ] Tester la connexion

---

## 🆘 Dépannage

### "Firebase is not defined"
→ Vérifiez que les scripts Firebase sont chargés dans le HTML

### "Erreur de déconnexion"
→ Vérifiez que l'utilisateur est bien authentifié

### "Email déjà utilisé"
→ Cet email est déjà enregistré, utilisez un autre ou connectez-vous

### Firestore rulees error
→ Vérifiez que les règles Firestore permettent la lecture/écriture pour l'utilisateur connecté

---

## 📱 Structure des fichiers

```
Craft-Genius/
├── index.html          ← Fichier principal
├── auth.html           ← Page d'authentification
├── script.js           ← JavaScript principal + Firebase config
├── auth.js             ← JavaScript authentification
├── style.css           ← Styles principaux
├── auth.css            ← Styles authentification
└── README.md           ← Ce fichier
```

---

## 🔒 Sécurité

⚠️ **Important:**
- Ne commitez JAMAIS vos vrais identifiants Firebase sur GitHub
- Créez un fichier `.env.local` pour stocker les secrets de développement
- En production, utilisez les variables d'environnement de votre hébergeur

### Pour développement local:
1. Créez `.env.local`:
```
VITE_FIREBASE_API_KEY=xxxxx
VITE_FIREBASE_AUTH_DOMAIN=xxxxx
...
```

2. Chargez les variables dans votre build

---

Bon développement! 🚀

// Système de traduction multi-langues
const translations = {
  fr: {
    // Navigation
    home: "Accueil",
    commands: "Commandes",
    guides: "Guides",
    tips: "Astuces",
    recipes: "Recettes",
    
    // Hero
    heroTitle: "⚡ Craft Genius",
    heroSubtitle: "Ton assistant ultime pour Minecraft - Commandes, Recettes & Astuces",
    heroButton: "Commencer",
    
    // Commands
    commandsTitle: "Trouvez Votre Commande",
    commandsSubtitle: "Décrivez ce que vous voulez faire et l'IA trouvera la commande pour vous",
    warningText: "⚠️ Attention : Écrivez les mots sans fautes d'orthographe pour de meilleurs résultats",
    commandPlaceholder: "Ex: Je veux donner 64 diamants à mon ami...",
    searchButton: "🔍 Trouver la commande",
    commandFound: "✅ Commande trouvée !",
    copyButton: "📋 Copier",
    popularCommands: "Commandes populaires",
    
    // Recipes
    recipesTitle: "Trouveur de Recettes",
    recipesSubtitle: "Décrivez ce que vous voulez crafter et l'IA trouvera la recette pour vous",
    recipePlaceholder: "Ex: Je veux fabriquer une épée en diamant...",
    searchRecipeButton: "🔍 Trouver la recette",
    recipeFound: "✅ Recette trouvée !",
    popularRecipes: "Recettes populaires",
    
    // Guides
    guidesTitle: "Guide de Survie",
    survivalGuide: "Survie",
    survivalDesc: "Apprenez à survivre dans le monde de Minecraft",
    constructionGuide: "Construction",
    constructionDesc: "Techniques et idées de construction",
    miningGuide: "Minage",
    miningDesc: "Stratégies pour trouver des ressources",
    redstoneGuide: "Redstone",
    redstoneDesc: "Maîtrisez les circuits redstone",
    multiplayerGuide: "Multijoueur",
    multiplayerDesc: "Serveurs, plugins et mode multijoueur",
    seeGuide: "Voir le guide",
    closeButton: "✖ Fermer",
    
    // Tips
    tipsTitle: "Astuces Rapides",
    tip1Title: "Astuce #1",
    tip1Text: "Minez au niveau Y=-59 pour trouver plus de diamants",
    tip2Title: "Astuce #2",
    tip2Text: "Utilisez de la farine d'os pour accélérer la croissance des cultures",
    tip3Title: "Astuce #3",
    tip3Text: "Créez un bouclier avec des planches et du fer pour vous protéger",
    tip4Title: "Astuce #4",
    tip4Text: "Utilisez des rails propulsés avec de la redstone pour voyager rapidement",
    
    // Footer
    footerCopyright: "© 2025 Craft Genius - L'assistant Minecraft intelligent",
    footerCredit: "Créé par Gabriel Cardon | Site non affilié à Mojang Studios ou Microsoft"
  },
  
  en: {
    // Navigation
    home: "Home",
    commands: "Commands",
    guides: "Guides",
    tips: "Tips",
    recipes: "Recipes",
    
    // Hero
    heroTitle: "⚡ Craft Genius",
    heroSubtitle: "Your ultimate Minecraft assistant - Commands, Recipes & Tips",
    heroButton: "Get Started",
    
    // Commands
    commandsTitle: "Find Your Command",
    commandsSubtitle: "Describe what you want to do and AI will find the command for you",
    warningText: "⚠️ Warning: Write words without spelling mistakes for better results",
    commandPlaceholder: "Ex: I want to give 64 diamonds to my friend...",
    searchButton: "🔍 Find command",
    commandFound: "✅ Command found!",
    copyButton: "📋 Copy",
    popularCommands: "Popular commands",
    
    // Recipes
    recipesTitle: "Recipe Finder",
    recipesSubtitle: "Describe what you want to craft and AI will find the recipe for you",
    recipePlaceholder: "Ex: I want to craft a diamond sword...",
    searchRecipeButton: "🔍 Find recipe",
    recipeFound: "✅ Recipe found!",
    popularRecipes: "Popular recipes",
    
    // Guides
    guidesTitle: "Survival Guide",
    survivalGuide: "Survival",
    survivalDesc: "Learn to survive in the Minecraft world",
    constructionGuide: "Building",
    constructionDesc: "Building techniques and ideas",
    miningGuide: "Mining",
    miningDesc: "Strategies to find resources",
    redstoneGuide: "Redstone",
    redstoneDesc: "Master redstone circuits",
    multiplayerGuide: "Multiplayer",
    multiplayerDesc: "Servers, plugins and multiplayer mode",
    seeGuide: "View guide",
    closeButton: "✖ Close",
    
    // Tips
    tipsTitle: "Quick Tips",
    tip1Title: "Tip #1",
    tip1Text: "Mine at Y=-59 level to find more diamonds",
    tip2Title: "Tip #2",
    tip2Text: "Use bone meal to speed up crop growth",
    tip3Title: "Tip #3",
    tip3Text: "Create a shield with planks and iron to protect yourself",
    tip4Title: "Tip #4",
    tip4Text: "Use powered rails with redstone to travel quickly",
    
    // Footer
    footerCopyright: "© 2025 Craft Genius - The smart Minecraft assistant",
    footerCredit: "Created by Gabriel Cardon | Not affiliated with Mojang Studios or Microsoft"
  }
};

let currentLang = 'fr';

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', function() {
  
  // Settings Menu
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsMenu = document.getElementById('settingsMenu');
  const settingsOverlay = document.getElementById('settingsOverlay');
  const closeSettings = document.getElementById('closeSettings');

  // Vérifier que les éléments existent
  if (!settingsBtn || !settingsMenu || !settingsOverlay || !closeSettings) {
    console.error('Éléments du menu de paramètres manquants');
    return;
  }

  // Ouvrir/Fermer le menu des paramètres
  settingsBtn.addEventListener('click', () => {
    settingsMenu.classList.toggle('show');
    settingsOverlay.classList.toggle('show');
  });

  // Empêcher la fermeture quand on clique dans le menu
  settingsMenu.addEventListener('click', (e) => {
    // Ne rien faire - empêche la propagation
  });

  // Empêcher aussi la propagation sur le settings-body
  const settingsBody = settingsMenu.querySelector('.settings-body');
  if (settingsBody) {
    settingsBody.addEventListener('click', (e) => {
      // Ne rien faire - empêche la propagation
    });
  }

  closeSettings.addEventListener('click', () => {
    settingsMenu.classList.remove('show');
    settingsOverlay.classList.remove('show');
  });

  settingsOverlay.addEventListener('click', (e) => {
    // Fermer seulement si on clique directement sur l'overlay
    if (e.target === settingsOverlay) {
      settingsMenu.classList.remove('show');
      settingsOverlay.classList.remove('show');
    }
  });

  // Theme Toggle
  document.documentElement.setAttribute('data-theme', 'light');

  // Trouver les boutons de thème
  const themeButtons = document.querySelectorAll('.theme-option');

  // Event listeners pour les boutons de thème
  themeButtons.forEach((btn) => {
    btn.addEventListener('click', function(e) {
      const theme = this.dataset.theme;
      
      document.documentElement.setAttribute('data-theme', theme);
      
      // Mettre à jour les boutons actifs
      themeButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    }, true);
  });

  // Language Toggle
  const langButtons = document.querySelectorAll('.setting-option[data-lang]');
  
  langButtons.forEach((btn) => {
    btn.addEventListener('click', function(e) {
      const lang = this.dataset.lang;
      
      translatePage(lang);
      
      // Mettre à jour les boutons actifs
      langButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    }, true);
  });
});

function translatePage(lang) {
  currentLang = lang;
  const t = translations[lang];
  
  // Navigation
  document.querySelectorAll('.nav-links a')[0].textContent = t.home;
  document.querySelectorAll('.nav-links a')[1].textContent = t.commands;
  document.querySelectorAll('.nav-links a')[2].textContent = t.guides;
  document.querySelectorAll('.nav-links a')[3].textContent = t.tips;
  document.querySelectorAll('.nav-links a')[4].textContent = t.recipes;
  
  // Hero
  document.querySelector('.hero-content h1').textContent = t.heroTitle;
  document.querySelector('.hero-content p').textContent = t.heroSubtitle;
  document.querySelector('.btn-primary').textContent = t.heroButton;
  
  // Commands section
  document.querySelector('#commandes h2').textContent = t.commandsTitle;
  document.querySelectorAll('#commandes .subtitle')[0].textContent = t.commandsSubtitle;
  document.querySelectorAll('#commandes .subtitle')[1].textContent = t.warningText;
  document.querySelector('#commandDescription').placeholder = t.commandPlaceholder;
  document.querySelector('#searchCommand').textContent = t.searchButton;
  if (document.querySelector('#commandResult h3')) {
    document.querySelector('#commandResult h3').textContent = t.commandFound;
  }
  document.querySelector('#copyCommand').textContent = t.copyButton;
  document.querySelector('#commandes .popular-commands h3').textContent = t.popularCommands;
  
  // Recipes section
  document.querySelector('#recettes h2').textContent = t.recipesTitle;
  document.querySelectorAll('#recettes .subtitle')[0].textContent = t.recipesSubtitle;
  document.querySelectorAll('#recettes .subtitle')[1].textContent = t.warningText;
  document.querySelector('#recipeDescription').placeholder = t.recipePlaceholder;
  document.querySelector('#searchRecipe').textContent = t.searchRecipeButton;
  if (document.querySelector('#recipeResult h3')) {
    document.querySelector('#recipeResult h3').textContent = t.recipeFound;
  }
  document.querySelector('#recettes .popular-commands h3').textContent = t.popularRecipes;
  
  // Guides section
  document.querySelector('#guides h2').textContent = t.guidesTitle;
  const guideCards = document.querySelectorAll('#guides .card');
  guideCards[0].querySelector('h3').textContent = t.survivalGuide;
  guideCards[0].querySelector('p').textContent = t.survivalDesc;
  guideCards[1].querySelector('h3').textContent = t.constructionGuide;
  guideCards[1].querySelector('p').textContent = t.constructionDesc;
  guideCards[2].querySelector('h3').textContent = t.miningGuide;
  guideCards[2].querySelector('p').textContent = t.miningDesc;
  guideCards[3].querySelector('h3').textContent = t.redstoneGuide;
  guideCards[3].querySelector('p').textContent = t.redstoneDesc;
  if (guideCards[4]) {
    guideCards[4].querySelector('h3').textContent = t.multiplayerGuide;
    guideCards[4].querySelector('p').textContent = t.multiplayerDesc;
  }
  document.querySelectorAll('#guides .btn-secondary').forEach(btn => {
    btn.textContent = t.seeGuide;
  });
  document.querySelectorAll('.btn-close').forEach(btn => {
    btn.textContent = t.closeButton;
  });
  
  // Tips section
  document.querySelector('#astuces h2').textContent = t.tipsTitle;
  const tips = document.querySelectorAll('.tip');
  tips[0].querySelector('h4').textContent = t.tip1Title;
  tips[0].querySelector('p').textContent = t.tip1Text;
  tips[1].querySelector('h4').textContent = t.tip2Title;
  tips[1].querySelector('p').textContent = t.tip2Text;
  tips[2].querySelector('h4').textContent = t.tip3Title;
  tips[2].querySelector('p').textContent = t.tip3Text;
  tips[3].querySelector('h4').textContent = t.tip4Title;
  tips[3].querySelector('p').textContent = t.tip4Text;
  
  // Footer
  document.querySelectorAll('footer p')[0].textContent = t.footerCopyright;
  document.querySelectorAll('footer p')[1].textContent = t.footerCredit;
  
  // Update theme option text
  const themeOptions = document.querySelectorAll('.theme-option span:not(.option-icon)');
  if (themeOptions[0]) themeOptions[0].textContent = lang === 'fr' ? 'Clair' : 'Light';
  if (themeOptions[1]) themeOptions[1].textContent = lang === 'fr' ? 'Sombre' : 'Dark';
  
  // Update active button (old system)
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-lang') === lang) {
      btn.classList.add('active');
    }
  });
}

// Language selector event listeners
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const lang = this.getAttribute('data-lang');
    translatePage(lang);
  });
});

// Effet de scroll doux pour la navigation
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Mise en surbrillance du menu actif au scroll
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-links a");

function highlightNav() {
  let current = "";
  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (window.scrollY >= sectionTop - 200) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    link.style.color = "white";
    link.style.fontWeight = "normal";
    if (link.getAttribute("href") === `#${current}`) {
      link.style.color = "#3498db";
      link.style.fontWeight = "bold";
    }
  });
}

window.addEventListener("scroll", highlightNav);

// Animation au scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -100px 0px",
};

const observer = new IntersectionObserver(function (entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

// Appliquer l animation aux cartes
document.querySelectorAll(".card, .tip, .recipe-item").forEach((element) => {
  element.style.opacity = "0";
  element.style.transform = "translateY(20px)";
  element.style.transition = "opacity 0.6s ease, transform 0.6s ease";
  observer.observe(element);
});

// Effet sur le bouton principal
const btnPrimary = document.querySelector(".btn-primary");
if (btnPrimary) {
  btnPrimary.addEventListener("click", function () {
    document.querySelector("#guides").scrollIntoView({
      behavior: "smooth",
    });
  });
}

// Effet sur les boutons des cartes - Afficher les guides
document.querySelectorAll(".btn-secondary").forEach((button) => {
  button.addEventListener("click", function () {
    const card = this.closest(".card");
    const guideType = card.getAttribute("data-guide");

    // Masquer tous les guides
    document.querySelectorAll(".guide-content").forEach((guide) => {
      guide.style.display = "none";
    });

    // Afficher le guide sélectionné
    const selectedGuide = document.getElementById("guide-" + guideType);
    if (selectedGuide) {
      selectedGuide.style.display = "block";
      selectedGuide.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// Fermer les guides
document.querySelectorAll(".btn-close").forEach((button) => {
  button.addEventListener("click", function () {
    const guideContent = this.closest(".guide-content");
    guideContent.style.display = "none";

    // Scroll vers les cartes
    document.querySelector("#guides").scrollIntoView({ behavior: "smooth" });
  });
});

// Clé API Hugging Face depuis variable d'environnement
const HF_TOKEN = process.env.HF_TOKEN;

// Fonction IA avec Hugging Face
async function findCommand(description) {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `Tu es un expert Minecraft. L'utilisateur décrit ce qu'il veut faire et tu réponds UNIQUEMENT avec la commande Minecraft et son explication.

Format STRICT:
COMMANDE: [commande ici]
EXPLICATION: [explication ici]

Exemples de commandes:
- /give @p diamond 64 : donner items
- /gamemode creative : changer mode
- /tp @p ~ ~10 ~ : téléporter
- /time set day : changer heure
- /weather clear : changer météo
- /effect give @p speed 60 2 : effets
- /summon zombie : invoquer entités
- /fill ~ ~ ~ ~10 ~10 ~10 stone : remplir zones

Demande: ${description}

Réponds maintenant:`,
          parameters: {
            max_new_tokens: 200,
            temperature: 0.7,
            return_full_text: false,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Erreur API Hugging Face: " + response.status);
    }

    const data = await response.json();
    const text = data[0].generated_text;

    // Parser la réponse
    const commandMatch = text.match(/COMMANDE:\s*(.+)/);
    const explanationMatch = text.match(/EXPLICATION:\s*(.+)/s);

    if (commandMatch && explanationMatch) {
      return {
        command: commandMatch[1].trim().split("\n")[0],
        explanation: explanationMatch[1].trim(),
      };
    }

    // Fallback vers IA locale si le format n'est pas bon
    return findCommandLocal(description);
  } catch (error) {
    console.log("Erreur API, utilisation IA locale:", error);
    return findCommandLocal(description);
  }
}

// Base de données JSON complète de TOUTES les commandes Minecraft
const minecraftCommands = {
  "give": {
    "patterns": ["donner", "give", "obtenir", "avoir", "item"],
    "syntax": "/give <joueur> <item> [quantité]",
    "description": "Donne un item à un joueur",
    "exemples": ["/give @p diamond 64", "/give @p iron_ingot 32"]
  },
  "gamemode": {
    "patterns": ["mode", "gamemode", "créatif", "creative", "survie", "survival", "aventure", "spectateur"],
    "syntax": "/gamemode <mode>",
    "description": "Change le mode de jeu",
    "modes": ["survival", "creative", "adventure", "spectator"]
  },
  "teleport": {
    "patterns": ["téléporter", "teleport", "tp", "aller"],
    "syntax": "/tp <joueur> <x> <y> <z>",
    "description": "Téléporte un joueur à des coordonnées"
  },
  "time": {
    "patterns": ["temps", "time", "jour", "day", "nuit", "night"],
    "syntax": "/time set <valeur>",
    "description": "Change l'heure du jeu",
    "valeurs": ["day", "night", "noon", "midnight"]
  },
  "weather": {
    "patterns": ["météo", "weather", "pluie", "rain", "orage", "clear"],
    "syntax": "/weather <type>",
    "description": "Change la météo",
    "types": ["clear", "rain", "thunder"]
  },
  "effect": {
    "patterns": ["effet", "effect", "potion"],
    "syntax": "/effect give <joueur> <effet> [durée] [niveau]",
    "description": "Applique un effet de potion"
  },
  "summon": {
    "patterns": ["invoquer", "summon", "spawn", "apparaître", "apparaitre", "faire apparaître"],
    "syntax": "/summon <entité> [x] [y] [z]",
    "description": "Fait apparaître une entité"
  },
  "xp": {
    "patterns": ["xp", "experience", "niveau", "level"],
    "syntax": "/xp add <joueur> <quantité> [points|levels]",
    "description": "Donne de l'expérience"
  },
  "kill": {
    "patterns": ["tuer", "kill", "mourir", "suicide", "mort"],
    "syntax": "/kill [joueur]",
    "description": "Tue un joueur ou une entité"
  },
  "clear": {
    "patterns": ["clear", "effacer", "vider", "supprimer inventaire", "nettoyer"],
    "syntax": "/clear [joueur] [item] [quantité]",
    "description": "Vide l'inventaire d'un joueur"
  },
  "fill": {
    "patterns": ["fill", "remplir", "construire", "zone"],
    "syntax": "/fill <x1> <y1> <z1> <x2> <y2> <z2> <bloc>",
    "description": "Remplit une zone avec un bloc"
  },
  "setblock": {
    "patterns": ["setblock", "placer bloc", "mettre bloc", "poser"],
    "syntax": "/setblock <x> <y> <z> <bloc>",
    "description": "Place un bloc à une position"
  },
  "enchant": {
    "patterns": ["enchant", "enchanter", "enchantement"],
    "syntax": "/enchant <joueur> <enchantement> [niveau]",
    "description": "Enchante l'objet en main"
  },
  "difficulty": {
    "patterns": ["difficulté", "difficulty", "difficile", "facile", "paisible", "normal"],
    "syntax": "/difficulty <niveau>",
    "description": "Change la difficulté du jeu",
    "niveaux": ["peaceful", "easy", "normal", "hard"]
  },
  "locate": {
    "patterns": ["locate", "trouver", "chercher", "localiser"],
    "syntax": "/locate structure <structure>",
    "description": "Localise une structure"
  },
  "clone": {
    "patterns": ["clone", "cloner", "copier", "dupliquer"],
    "syntax": "/clone <x1> <y1> <z1> <x2> <y2> <z2> <x> <y> <z>",
    "description": "Clone une zone"
  },
  "particle": {
    "patterns": ["particle", "particule", "effet visuel"],
    "syntax": "/particle <type> <x> <y> <z>",
    "description": "Crée des particules"
  },
  "setworldspawn": {
    "patterns": ["spawn", "point apparition", "point de départ"],
    "syntax": "/setworldspawn [x] [y] [z]",
    "description": "Définit le point d'apparition du monde"
  },
  "seed": {
    "patterns": ["seed", "graine"],
    "syntax": "/seed",
    "description": "Affiche la graine du monde"
  },
  "spawnpoint": {
    "patterns": ["spawnpoint", "point spawn", "lit"],
    "syntax": "/spawnpoint [joueur] [x] [y] [z]",
    "description": "Définit le point d'apparition d'un joueur"
  },
  "spreadplayers": {
    "patterns": ["disperser", "spread"],
    "syntax": "/spreadplayers <x> <z> <distance> <portée> <joueurs>",
    "description": "Disperse des joueurs aléatoirement"
  },
  "playsound": {
    "patterns": ["son", "sound", "jouer son", "musique"],
    "syntax": "/playsound <son> <source> <joueur>",
    "description": "Joue un son"
  },
  "stopsound": {
    "patterns": ["arrêter son", "stop son"],
    "syntax": "/stopsound <joueur>",
    "description": "Arrête tous les sons"
  },
  "title": {
    "patterns": ["titre", "title", "texte écran"],
    "syntax": "/title <joueur> title <texte>",
    "description": "Affiche un titre à l'écran"
  },
  "tellraw": {
    "patterns": ["message json", "tellraw"],
    "syntax": "/tellraw <joueur> <json>",
    "description": "Envoie un message JSON"
  },
  "gamerule": {
    "patterns": ["règle", "gamerule", "règle de jeu"],
    "syntax": "/gamerule <règle> [valeur]",
    "description": "Modifie une règle du jeu"
  },
  "scoreboard": {
    "patterns": ["score", "scoreboard", "tableau"],
    "syntax": "/scoreboard objectives add <nom> <critère>",
    "description": "Gère les tableaux de scores"
  },
  "attribute": {
    "patterns": ["attribut", "attribute", "stat"],
    "syntax": "/attribute <joueur> <attribut> <action>",
    "description": "Modifie les attributs d'une entité"
  },
  "data": {
    "patterns": ["data", "données", "nbt"],
    "syntax": "/data get entity <entité>",
    "description": "Manipule les données NBT"
  },
  "execute": {
    "patterns": ["execute", "exécuter"],
    "syntax": "/execute as <joueur> run <commande>",
    "description": "Exécute une commande avec conditions"
  },
  "function": {
    "patterns": ["function", "fonction"],
    "syntax": "/function <nom>",
    "description": "Exécute une fonction"
  },
  "tag": {
    "patterns": ["tag", "étiquette"],
    "syntax": "/tag <joueur> add <tag>",
    "description": "Gère les tags des entités"
  },
  "team": {
    "patterns": ["équipe", "team"],
    "syntax": "/team add <nom>",
    "description": "Gère les équipes"
  },
  "worldborder": {
    "patterns": ["bordure", "worldborder", "limite monde"],
    "syntax": "/worldborder set <taille>",
    "description": "Modifie la bordure du monde"
  },
  "ban": {
    "patterns": ["ban", "bannir", "exclure"],
    "syntax": "/ban <joueur> [raison]",
    "description": "Bannit un joueur"
  },
  "pardon": {
    "patterns": ["pardon", "débannir"],
    "syntax": "/pardon <joueur>",
    "description": "Débannit un joueur"
  },
  "kick": {
    "patterns": ["kick", "expulser", "éjecter"],
    "syntax": "/kick <joueur> [raison]",
    "description": "Expulse un joueur du serveur"
  },
  "op": {
    "patterns": ["op", "opérateur", "admin"],
    "syntax": "/op <joueur>",
    "description": "Donne les droits opérateur"
  },
  "deop": {
    "patterns": ["deop", "retirer op"],
    "syntax": "/deop <joueur>",
    "description": "Retire les droits opérateur"
  },
  "whitelist": {
    "patterns": ["whitelist", "liste blanche"],
    "syntax": "/whitelist add <joueur>",
    "description": "Gère la liste blanche"
  }
};

// Traductions complètes FR -> EN pour items/mobs Minecraft
const itemTranslations = {
  // Items populaires
  "diamant": "diamond", "diamants": "diamond",
  "fer": "iron_ingot", "lingot de fer": "iron_ingot",
  "or": "gold_ingot", "lingot d'or": "gold_ingot",
  "émeraude": "emerald", "emeraudes": "emerald",
  "netherite": "netherite_ingot",
  "charbon": "coal",
  "redstone": "redstone",
  "lapis": "lapis_lazuli",
  "bâton": "stick", "batons": "stick",
  "planches": "planks", "bois": "planks",
  "pierre": "stone",
  "cobblestone": "cobblestone",
  "terre": "dirt",
  "sable": "sand",
  "gravier": "gravel",
  "verre": "glass",
  "laine": "wool",
  "pain": "bread",
  "pomme": "apple",
  "pomme en or": "golden_apple",
  "viande": "beef", "steak": "beef",
  "poulet": "chicken",
  "porc": "porkchop",
  "épée": "sword", "epee": "sword",
  "pioche": "pickaxe",
  "hache": "axe",
  "pelle": "shovel",
  "houe": "hoe",
  "bouclier": "shield",
  "arc": "bow",
  "flèche": "arrow", "fleche": "arrow",
  "torche": "torch", "torches": "torch",
  "coffre": "chest",
  "coffre ender": "ender_chest",
  "lit": "bed",
  "porte": "door",
  "échelle": "ladder", "echelle": "ladder",
  "rails": "rails",
  "wagonnet": "minecart",
  "bateau": "boat",
  "tnt": "tnt",
  "obsidienne": "obsidian",
  "livre": "book",
  "papier": "paper",
  
  // Mobs
  "zombie": "zombie", "zombies": "zombie",
  "squelette": "skeleton", "squelettes": "skeleton",
  "creeper": "creeper", "creepers": "creeper",
  "araignée": "spider", "araignees": "spider", "araignee": "spider",
  "enderman": "enderman", "endermen": "enderman",
  "loup": "wolf", "loups": "wolf", "chien": "wolf",
  "chat": "cat", "chats": "cat",
  "vache": "cow", "vaches": "cow",
  "cochon": "pig", "cochons": "pig",
  "mouton": "sheep", "moutons": "sheep",
  "cheval": "horse", "chevaux": "horse",
  "âne": "donkey",
  "villageois": "villager",
  "golem de fer": "iron_golem", "golem": "iron_golem",
  "dragon": "ender_dragon",
  "wither": "wither",
  "fantôme": "phantom", "fantome": "phantom",
  "noyé": "drowned",
  "sorcière": "witch", "sorciere": "witch",
  "blaze": "blaze",
  "ghast": "ghast",
  "slime": "slime",
  "gardien": "guardian",
  "shulker": "shulker",
  "piglin": "piglin",
  "hoglin": "hoglin",
  "abeille": "bee", "abeilles": "bee",
  "renard": "fox", "renards": "fox",
  "panda": "panda", "pandas": "panda",
  "ours polaire": "polar_bear",
  "lama": "llama",
  "perroquet": "parrot",
  "lapin": "rabbit",
  
  // Effets
  "vitesse": "speed",
  "lenteur": "slowness",
  "hâte": "haste",
  "force": "strength",
  "faiblesse": "weakness",
  "régénération": "regeneration", "regeneration": "regeneration",
  "résistance": "resistance",
  "saut": "jump_boost",
  "nausée": "nausea",
  "vision nocturne": "night_vision",
  "invisibilité": "invisibility", "invisibilite": "invisibility",
  "cécité": "blindness",
  "poison": "poison",
  "wither": "wither",
  "résistance au feu": "fire_resistance",
  "respiration aquatique": "water_breathing",
  "chance": "luck",
  "lévitation": "levitation",
  
  // Blocs
  "herbe": "grass_block",
  "bedrock": "bedrock",
  "eau": "water",
  "lave": "lava",
  "sable": "sand",
  "grès": "sandstone",
  
  // Gamemodes
  "survie": "survival",
  "créatif": "creative", "creatif": "creative",
  "aventure": "adventure",
  "spectateur": "spectator"
};

// IA locale avec système JSON
function findCommandLocal(description) {
  const text = description.toLowerCase();
  
  // Fonction pour trouver un item/mob/effet dans le texte
  function findInText(dict) {
    for (let [fr, en] of Object.entries(dict)) {
      if (text.includes(fr)) return en;
    }
    return null;
  }
  
  // Fonction pour extraire les nombres
  function getNumber(defaultVal = "1") {
    const match = text.match(/\d+/);
    return match ? match[0] : defaultVal;
  }
  
  // Chercher quelle commande correspond
  for (let [cmdName, cmdData] of Object.entries(minecraftCommands)) {
    for (let pattern of cmdData.patterns) {
      if (text.includes(pattern)) {
        // Construire la commande selon le type
        return buildCommand(cmdName, text, cmdData);
      }
    }
  }
  
  return {
    command: "/help",
    explanation: 'Commande non reconnue. Essayez: "donner diamants", "mode créatif", "téléporter", "tuer", etc.'
  };
}

// Construit la commande selon le type
function buildCommand(cmdName, text, cmdData) {
  const qty = text.match(/\d+/) ? text.match(/\d+/)[0] : "64";
  const coords = text.match(/-?\d+/g);
  
  switch(cmdName) {
    case "give":
      const item = findInText(itemTranslations) || "diamond";
      return {
        command: `/give @p ${item} ${qty}`,
        explanation: `Donne ${qty} ${item} au joueur.`
      };
      
    case "gamemode":
      let mode = findInText(itemTranslations);
      if (!cmdData.modes || !cmdData.modes.includes(mode)) mode = "creative";
      return {
        command: `/gamemode ${mode}`,
        explanation: `Change le mode de jeu en ${mode}.`
      };
      
    case "teleport":
      if (coords && coords.length >= 3) {
        return {
          command: `/tp @p ${coords[0]} ${coords[1]} ${coords[2]}`,
          explanation: `Téléporte à X:${coords[0]} Y:${coords[1]} Z:${coords[2]}.`
        };
      }
      return {
        command: `/tp @p ~ ~10 ~`,
        explanation: `Téléporte 10 blocs vers le haut.`
      };
      
    case "time":
      const time = text.includes("nuit") || text.includes("night") ? "night" : "day";
      return {
        command: `/time set ${time}`,
        explanation: `Change l'heure en ${time}.`
      };
      
    case "weather":
      let w = "clear";
      if (text.includes("pluie")) w = "rain";
      if (text.includes("orage")) w = "thunder";
      return {
        command: `/weather ${w}`,
        explanation: `Change la météo en ${w}.`
      };
      
    case "effect":
      const effect = findInText(itemTranslations) || "speed";
      return {
        command: `/effect give @p ${effect} 60 2`,
        explanation: `Applique l'effet ${effect} niveau 2 pendant 60 secondes.`
      };
      
    case "summon":
      const mob = findInText(itemTranslations) || "zombie";
      return {
        command: `/summon ${mob}`,
        explanation: `Fait apparaître un ${mob}.`
      };
      
    case "xp":
      const amt = qty || "100";
      return {
        command: `/xp add @p ${amt} levels`,
        explanation: `Ajoute ${amt} niveaux d'XP.`
      };
      
    case "kill":
      return {
        command: `/kill @p`,
        explanation: `Tue le joueur instantanément.`
      };
      
    case "clear":
      const clearItem = findInText(itemTranslations);
      if (clearItem) {
        return {
          command: `/clear @p ${clearItem}`,
          explanation: `Enlève ${clearItem} de l'inventaire.`
        };
      }
      return {
        command: `/clear @p`,
        explanation: `Vide complètement l'inventaire.`
      };
      
    case "fill":
      const fillBlock = findInText(itemTranslations) || "stone";
      if (coords && coords.length >= 6) {
        return {
          command: `/fill ${coords[0]} ${coords[1]} ${coords[2]} ${coords[3]} ${coords[4]} ${coords[5]} ${fillBlock}`,
          explanation: `Remplit la zone avec ${fillBlock}.`
        };
      }
      return {
        command: `/fill ~-5 ~-1 ~-5 ~5 ~-1 ~5 ${fillBlock}`,
        explanation: `Crée un sol 10x10 de ${fillBlock}.`
      };
      
    case "setblock":
      const block = findInText(itemTranslations) || "stone";
      if (coords && coords.length >= 3) {
        return {
          command: `/setblock ${coords[0]} ${coords[1]} ${coords[2]} ${block}`,
          explanation: `Place ${block} aux coordonnées.`
        };
      }
      return {
        command: `/setblock ~ ~ ~ ${block}`,
        explanation: `Place ${block} à votre position.`
      };
      
    case "enchant":
      const enchants = {"tranchant": "sharpness", "protection": "protection", "solidité": "unbreaking", "efficacité": "efficiency", "fortune": "fortune", "toucher de soie": "silk_touch", "réparation": "mending"};
      let enchant = "sharpness";
      for (let [fr, en] of Object.entries(enchants)) {
        if (text.includes(fr)) { enchant = en; break; }
      }
      const lvl = qty || "5";
      return {
        command: `/enchant @p ${enchant} ${lvl}`,
        explanation: `Enchante avec ${enchant} niveau ${lvl}.`
      };
      
    case "difficulty":
      let diff = "normal";
      if (text.includes("paisible") || text.includes("peaceful")) diff = "peaceful";
      if (text.includes("facile") || text.includes("easy")) diff = "easy";
      if (text.includes("difficile") || text.includes("hard")) diff = "hard";
      return {
        command: `/difficulty ${diff}`,
        explanation: `Change la difficulté en ${diff}.`
      };
      
    case "locate":
      const structures = {"village": "village", "temple": "temple", "forteresse": "fortress", "bastion": "bastion_remnant", "portail": "ruined_portal", "manoir": "mansion"};
      let structure = "village";
      for (let [fr, en] of Object.entries(structures)) {
        if (text.includes(fr)) { structure = en; break; }
      }
      return {
        command: `/locate structure ${structure}`,
        explanation: `Trouve le ${structure} le plus proche.`
      };
      
    case "particle":
      const particles = {"flamme": "flame", "coeur": "heart", "explosion": "explosion", "fumée": "smoke", "eau": "water_splash"};
      let particle = "heart";
      for (let [fr, en] of Object.entries(particles)) {
        if (text.includes(fr)) { particle = en; break; }
      }
      return {
        command: `/particle ${particle} ~ ~ ~ 1 1 1 0.1 100`,
        explanation: `Crée des particules ${particle}.`
      };
      
    case "seed":
      return {
        command: `/seed`,
        explanation: `Affiche la graine du monde.`
      };
      
    case "spawnpoint":
      return {
        command: `/spawnpoint @p ~ ~ ~`,
        explanation: `Définit votre point d'apparition ici.`
      };
      
    case "playsound":
      return {
        command: `/playsound entity.experience_orb.pickup master @p`,
        explanation: `Joue un son d'XP.`
      };
      
    case "title":
      return {
        command: `/title @p title {"text":"Bonjour!","color":"gold"}`,
        explanation: `Affiche un titre à l'écran.`
      };
      
    case "gamerule":
      return {
        command: `/gamerule keepInventory true`,
        explanation: `Active la conservation de l'inventaire à la mort.`
      };
      
    case "kick":
      return {
        command: `/kick <joueur>`,
        explanation: `Expulse un joueur du serveur.`
      };
      
    case "op":
      return {
        command: `/op <joueur>`,
        explanation: `Donne les droits opérateur à un joueur.`
      };
      
    default:
      return {
        command: `/${cmdName}`,
        explanation: cmdData.description
      };
  }
}

function findInText(dict) {
  const text = document.getElementById("commandDescription").value.toLowerCase();
  for (let [fr, en] of Object.entries(dict)) {
    if (text.includes(fr)) return en;
  }
  return null;
}



// Gestionnaire du bouton de recherche - INITIALISÉ AU CHARGEMENT
const searchButton = document.getElementById("searchCommand");
const commandInput = document.getElementById("commandDescription");
const resultDiv = document.getElementById("commandResult");
const commandCodeElement = document.getElementById("commandCode");
const commandExplanationElement = document.getElementById("commandExplanation");

// Fonction pour effectuer la recherche
async function performSearch() {
  const description = commandInput.value.trim();

  if (description === "") {
    alert("Veuillez décrire ce que vous voulez faire !");
    return;
  }

  // Afficher un message de chargement
  commandCodeElement.textContent = "⏳ Analyse en cours...";
  commandExplanationElement.textContent =
    "L'IA est en train de trouver la commande parfaite pour vous...";
  resultDiv.style.display = "block";
  resultDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });

  // Désactiver le bouton pendant la recherche
  searchButton.disabled = true;
  searchButton.textContent = "⏳ Recherche...";

  try {
    // Trouver la commande avec l'IA
    const result = await findCommand(description);

    // Stocker dans les analytics
    trackSearch('command', description, result.command);

    // Afficher le résultat
    commandCodeElement.textContent = result.command;
    commandExplanationElement.textContent = result.explanation;
  } catch (error) {
    commandCodeElement.textContent = "/help";
    commandExplanationElement.textContent =
      "Une erreur est survenue. Veuillez réessayer.";
  } finally {
    // Réactiver le bouton
    searchButton.disabled = false;
    searchButton.textContent = "🔍 Trouver la commande";
  }
}

if (searchButton) {
  searchButton.addEventListener("click", performSearch);
}

// Ajouter l'événement Enter sur le champ de texte
if (commandInput) {
  commandInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      performSearch();
    }
  });
}

// Gestionnaire du bouton copier
const copyButton = document.getElementById("copyCommand");
if (copyButton) {
  copyButton.addEventListener("click", function () {
    const command = commandCodeElement.textContent;
    navigator.clipboard.writeText(command).then(() => {
      const originalText = copyButton.textContent;
      copyButton.textContent = "✅ Copié !";
      setTimeout(() => {
        copyButton.textContent = originalText;
      }, 2000);
    });
  });
}

// Gestionnaire des exemples de commandes
document.querySelectorAll(".example-command").forEach((example) => {
  example.addEventListener("click", function () {
    const command = this.getAttribute("data-command");
    commandInput.value = this.querySelector(".example-text").textContent;
    searchButton.click();
  });
});

// Base de données JSON complète des recettes Minecraft
const minecraftRecipes = {
  // Outils en bois
  "épée en bois": { name: "Épée en bois", materials: "2 Planches de bois\n1 Bâton", craft: "Disposez les planches verticalement au-dessus du bâton" },
  "pioche en bois": { name: "Pioche en bois", materials: "3 Planches de bois\n2 Bâtons", craft: "3 planches en haut, 2 bâtons en colonne au centre" },
  "hache en bois": { name: "Hache en bois", materials: "3 Planches de bois\n2 Bâtons", craft: "3 planches en L, 2 bâtons en colonne" },
  "pelle en bois": { name: "Pelle en bois", materials: "1 Planche de bois\n2 Bâtons", craft: "1 planche en haut, 2 bâtons en colonne" },
  
  // Outils en pierre
  "épée en pierre": { name: "Épée en pierre", materials: "2 Cobblestones\n1 Bâton", craft: "2 cobblestones verticalement, 1 bâton en bas" },
  "pioche en pierre": { name: "Pioche en pierre", materials: "3 Cobblestones\n2 Bâtons", craft: "3 cobblestones en haut, 2 bâtons en colonne" },
  "hache en pierre": { name: "Hache en pierre", materials: "3 Cobblestones\n2 Bâtons", craft: "3 cobblestones en L, 2 bâtons en colonne" },
  
  // Outils en fer
  "épée en fer": { name: "Épée en fer", materials: "2 Lingots de fer\n1 Bâton", craft: "2 lingots verticalement, 1 bâton en bas" },
  "pioche en fer": { name: "Pioche en fer", materials: "3 Lingots de fer\n2 Bâtons", craft: "3 lingots en haut, 2 bâtons en colonne" },
  "hache en fer": { name: "Hache en fer", materials: "3 Lingots de fer\n2 Bâtons", craft: "3 lingots en L, 2 bâtons en colonne" },
  "pelle en fer": { name: "Pelle en fer", materials: "1 Lingot de fer\n2 Bâtons", craft: "1 lingot en haut, 2 bâtons en colonne" },
  
  // Outils en diamant
  "épée en diamant": { name: "Épée en diamant", materials: "2 Diamants\n1 Bâton", craft: "2 diamants verticalement, 1 bâton en bas" },
  "pioche en diamant": { name: "Pioche en diamant", materials: "3 Diamants\n2 Bâtons", craft: "3 diamants en haut, 2 bâtons en colonne" },
  "hache en diamant": { name: "Hache en diamant", materials: "3 Diamants\n2 Bâtons", craft: "3 diamants en L, 2 bâtons en colonne" },
  "pelle en diamant": { name: "Pelle en diamant", materials: "1 Diamant\n2 Bâtons", craft: "1 diamant en haut, 2 bâtons en colonne" },
  
  // Armures
  "casque en fer": { name: "Casque en fer", materials: "5 Lingots de fer", craft: "Forme de U inversé" },
  "plastron en fer": { name: "Plastron en fer", materials: "8 Lingots de fer", craft: "Remplir sauf centre du haut" },
  "jambières en fer": { name: "Jambières en fer", materials: "7 Lingots de fer", craft: "2 colonnes de 3, 1 au centre du haut" },
  "bottes en fer": { name: "Bottes en fer", materials: "4 Lingots de fer", craft: "2 colonnes de 2 sur les côtés" },
  
  "casque en diamant": { name: "Casque en diamant", materials: "5 Diamants", craft: "Forme de U inversé" },
  "plastron en diamant": { name: "Plastron en diamant", materials: "8 Diamants", craft: "Remplir sauf centre du haut" },
  "jambières en diamant": { name: "Jambières en diamant", materials: "7 Diamants", craft: "2 colonnes de 3, 1 au centre du haut" },
  "bottes en diamant": { name: "Bottes en diamant", materials: "4 Diamants", craft: "2 colonnes de 2 sur les côtés" },
  
  // Blocs et structures
  "table de craft": { name: "Table de craft", materials: "4 Planches de bois", craft: "Carré 2x2 de planches" },
  "four": { name: "Four", materials: "8 Cobblestones", craft: "Carré 3x3 sans le centre" },
  "coffre": { name: "Coffre", materials: "8 Planches de bois", craft: "Carré 3x3 sans le centre" },
  "lit": { name: "Lit", materials: "3 Planches de bois\n3 Laines", craft: "3 laines en haut, 3 planches en bas" },
  "porte en bois": { name: "Porte en bois", materials: "6 Planches de bois", craft: "Rectangle 2x3 de planches" },
  "porte en fer": { name: "Porte en fer", materials: "6 Lingots de fer", craft: "Rectangle 2x3 de lingots" },
  "échelle": { name: "Échelle", materials: "7 Bâtons", craft: "2 colonnes de 3, 3 bâtons au milieu" },
  "bibliothèque": { name: "Bibliothèque", materials: "6 Planches de bois\n3 Livres", craft: "3 livres au centre, planches autour" },
  
  // Items spéciaux
  "torche": { name: "Torche", materials: "1 Charbon ou Charbon de bois\n1 Bâton", craft: "Charbon au-dessus du bâton" },
  "table d'enchantement": { name: "Table d'enchantement", materials: "4 Obsidiennes\n2 Diamants\n1 Livre", craft: "Livre en haut, diamants sur les côtés, obsidiennes en bas" },
  "enclume": { name: "Enclume", materials: "3 Blocs de fer\n4 Lingots de fer", craft: "3 blocs en haut, 1 lingot au centre, 3 lingots en bas" },
  "livre": { name: "Livre", materials: "3 Papiers\n1 Cuir", craft: "Papiers en colonne, cuir à côté" },
  "papier": { name: "Papier", materials: "3 Cannes à sucre", craft: "3 cannes en ligne horizontale" },
  
  // Combat
  "bouclier": { name: "Bouclier", materials: "6 Planches de bois\n1 Lingot de fer", craft: "Lingot en haut au centre, planches en V" },
  "arc": { name: "Arc", materials: "3 Bâtons\n3 Ficelles", craft: "Bâtons en diagonale, ficelles en bordure droite" },
  "flèche": { name: "Flèche (x4)", materials: "1 Silex\n1 Bâton\n1 Plume", craft: "Silex en haut, bâton au centre, plume en bas" },
  
  // Redstone
  "tnt": { name: "TNT", materials: "5 Poudre à canon\n4 Sable", craft: "Alternez poudre et sable en damier" },
  "répéteur": { name: "Répéteur de redstone", materials: "3 Pierres\n2 Torches de redstone\n1 Redstone", craft: "Torches sur les côtés, redstone au centre, pierres en bas" },
  "comparateur": { name: "Comparateur de redstone", materials: "3 Pierres\n3 Torches de redstone\n1 Quartz du Nether", craft: "Quartz au centre, torches en T, pierres en bas" },
  "piston": { name: "Piston", materials: "3 Planches de bois\n4 Cobblestones\n1 Lingot de fer\n1 Redstone", craft: "Planches en haut, lingot au centre, cobblestones sur les côtés, redstone en bas" },
  "torche de redstone": { name: "Torche de redstone", materials: "1 Redstone\n1 Bâton", craft: "Redstone au-dessus du bâton" },
  
  // Transport
  "rails": { name: "Rails (x16)", materials: "6 Lingots de fer\n1 Bâton", craft: "2 colonnes de 3 lingots, bâton au centre" },
  "rails propulsés": { name: "Rails propulsés (x6)", materials: "6 Lingots d'or\n1 Bâton\n1 Redstone", craft: "2 colonnes de 3 lingots d'or, bâton au centre, redstone en bas" },
  "wagonnet": { name: "Wagonnet", materials: "5 Lingots de fer", craft: "Forme de U avec 5 lingots" },
  "bateau": { name: "Bateau", materials: "5 Planches de bois", craft: "Forme de U avec 5 planches" },
  
  // Utilitaires
  "seau": { name: "Seau", materials: "3 Lingots de fer", craft: "Forme de V avec 3 lingots" },
  "briquet": { name: "Briquet", materials: "1 Lingot de fer\n1 Silex", craft: "Fer en haut à gauche, silex en bas à droite" },
  "cisailles": { name: "Cisailles", materials: "2 Lingots de fer", craft: "Diagonale de lingots" },
  "canne à pêche": { name: "Canne à pêche", materials: "3 Bâtons\n2 Ficelles", craft: "Bâtons en diagonale, ficelles du bout" },
  "horloge": { name: "Horloge", materials: "4 Lingots d'or\n1 Redstone", craft: "Croix de lingots, redstone au centre" },
  "boussole": { name: "Boussole", materials: "4 Lingots de fer\n1 Redstone", craft: "Croix de lingots, redstone au centre" },
  
  // Nourriture
  "pain": { name: "Pain", materials: "3 Blés", craft: "3 blés en ligne horizontale" },
  "gâteau": { name: "Gâteau", materials: "3 Seaux de lait\n2 Sucres\n1 Œuf\n3 Blés", craft: "Lait en haut, sucre-œuf-sucre au milieu, blé en bas" },
  "soupe de champignons": { name: "Soupe de champignons", materials: "1 Champignon rouge\n1 Champignon brun\n1 Bol", craft: "Champignons en haut, bol en bas" },
  
  // Blocs décoratifs et de stockage
  "verre": { name: "Verre", materials: "Faire fondre du Sable dans un four", craft: "Sable + Four + Charbon" },
  "pierre lumineuse": { name: "Pierre lumineuse", materials: "4 Poussières lumineuses", craft: "Carré 2x2 de poussières" },
  "lanterne": { name: "Lanterne", materials: "8 Pépites de fer\n1 Torche", craft: "Torche au centre, pépites autour" },
  "bloc d'or": { name: "Bloc d'or", materials: "9 Lingots d'or", craft: "Carré 3x3 de lingots d'or" },
  "bloc de fer": { name: "Bloc de fer", materials: "9 Lingots de fer", craft: "Carré 3x3 de lingots de fer" },
  "bloc de diamant": { name: "Bloc de diamant", materials: "9 Diamants", craft: "Carré 3x3 de diamants" },
  "bloc d'émeraude": { name: "Bloc d'émeraude", materials: "9 Émeraudes", craft: "Carré 3x3 d'émeraudes" },
  "bloc de charbon": { name: "Bloc de charbon", materials: "9 Charbons", craft: "Carré 3x3 de charbons" },
  "bloc de redstone": { name: "Bloc de redstone", materials: "9 Redstones", craft: "Carré 3x3 de redstones" },
  "bloc de lapis": { name: "Bloc de lapis-lazuli", materials: "9 Lapis-lazuli", craft: "Carré 3x3 de lapis" }
};

// Traductions pour recherche de recettes
const recipeTranslations = {
  "epee": "épée", "epée": "épée",
  "diamant": "diamant", "diamants": "diamant",
  "fer": "fer",
  "bois": "bois",
  "pierre": "pierre",
  "bloc d'or": "bloc d'or", "bloc or": "bloc d'or",
  "bloc de fer": "bloc de fer", "bloc fer": "bloc de fer",
  "bloc de diamant": "bloc de diamant", "bloc diamant": "bloc de diamant",
  "bloc d'émeraude": "bloc d'émeraude", "bloc emeraude": "bloc d'émeraude",
  "pioche": "pioche",
  "hache": "hache",
  "pelle": "pelle",
  "coffre": "coffre",
  "table": "table",
  "enchantement": "enchantement",
  "tnt": "tnt",
  "four": "four",
  "lit": "lit",
  "porte": "porte",
  "torche": "torche",
  "rails": "rails",
  "wagonnet": "wagonnet",
  "bateau": "bateau",
  "bouclier": "bouclier",
  "arc": "arc",
  "fleche": "flèche", "flèche": "flèche",
  "armure": "armure",
  "casque": "casque",
  "plastron": "plastron",
  "jambiere": "jambières", "jambières": "jambières",
  "botte": "bottes", "bottes": "bottes",
  "seau": "seau",
  "echelle": "échelle", "échelle": "échelle",
  "bibliotheque": "bibliothèque", "bibliothèque": "bibliothèque",
  "livre": "livre",
  "papier": "papier",
  "pain": "pain",
  "gateau": "gâteau", "gâteau": "gâteau",
  "enclume": "enclume",
  "piston": "piston",
  "repeteur": "répéteur", "répéteur": "répéteur",
  "comparateur": "comparateur",
  "redstone": "redstone",
  "verre": "verre",
  "lanterne": "lanterne"
};

// Fonction pour trouver une recette
function findRecipe(description) {
  const text = description.toLowerCase();
  
  // Chercher d'abord les expressions exactes (priorité aux blocs)
  const exactMatches = [
    "bloc d'or", "bloc de fer", "bloc de diamant", "bloc d'émeraude",
    "table d'enchantement", "porte en bois", "porte en fer"
  ];
  
  for (let exactTerm of exactMatches) {
    if (text.includes(exactTerm)) {
      if (minecraftRecipes[exactTerm]) {
        return minecraftRecipes[exactTerm];
      }
    }
  }
  
  // Chercher directement dans les recettes
  for (let [key, recipe] of Object.entries(minecraftRecipes)) {
    if (text.includes(key)) {
      return recipe;
    }
  }
  
  // Chercher avec traductions
  for (let [fr, en] of Object.entries(recipeTranslations)) {
    if (text.includes(fr)) {
      for (let [key, recipe] of Object.entries(minecraftRecipes)) {
        if (key.includes(en)) {
          return recipe;
        }
      }
    }
  }
  
  return {
    name: "Recette non trouvée",
    materials: "Essayez avec des termes plus précis",
    craft: "Exemples : 'épée en diamant', 'table d'enchantement', 'coffre', 'tnt', 'arc', 'bloc d'or'"
  };
}

// Gestionnaire du bouton de recherche de recette
const searchRecipeButton = document.getElementById("searchRecipe");
const recipeInput = document.getElementById("recipeDescription");
const recipeResultDiv = document.getElementById("recipeResult");
const recipeNameElement = document.getElementById("recipeName");
const recipeIngredientsElement = document.getElementById("recipeIngredients");
const recipeInstructionsElement = document.getElementById("recipeInstructions");

// Fonction pour effectuer la recherche de recette
async function performRecipeSearch() {
  const description = recipeInput.value.trim();

  if (description === "") {
    alert("Veuillez décrire ce que vous voulez crafter !");
    return;
  }

  // Afficher un message de chargement
  recipeNameElement.textContent = "⏳ Recherche en cours...";
  recipeIngredientsElement.textContent = "Analyse de votre demande...";
  recipeInstructionsElement.textContent = "";
  recipeResultDiv.style.display = "block";
  recipeResultDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });

  // Désactiver le bouton pendant la recherche
  searchRecipeButton.disabled = true;
  searchRecipeButton.textContent = "⏳ Recherche...";

  // Simuler un petit délai pour l'effet
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // Trouver la recette
    const result = findRecipe(description);

    // Stocker dans les analytics
    trackSearch('recipe', description, result.name);

    // Afficher le résultat
    recipeNameElement.textContent = result.name;
    recipeIngredientsElement.textContent = result.materials;
    recipeInstructionsElement.textContent = result.craft;
  } catch (error) {
    recipeNameElement.textContent = "Erreur";
    recipeIngredientsElement.textContent = "Une erreur est survenue";
    recipeInstructionsElement.textContent = "Veuillez réessayer.";
  } finally {
    // Réactiver le bouton
    searchRecipeButton.disabled = false;
    searchRecipeButton.textContent = "🔍 Trouver la recette";
  }
}

if (searchRecipeButton) {
  searchRecipeButton.addEventListener("click", performRecipeSearch);
}

// Ajouter l'événement Enter sur le champ de texte des recettes
if (recipeInput) {
  recipeInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      performRecipeSearch();
    }
  });
}

// Gestionnaire des exemples de recettes
document.querySelectorAll(".example-command[data-recipe]").forEach((example) => {
  example.addEventListener("click", function () {
    const recipe = this.getAttribute("data-recipe");
    recipeInput.value = "Je veux crafter " + recipe;
    searchRecipeButton.click();
  });
});

console.log("Guide Minecraft charge avec succes!");
console.log("Bon jeu et bonne exploration!");


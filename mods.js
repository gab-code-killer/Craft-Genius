// ============================================================
// Mods Forge — mods.js  (interface style CurseForge)
// ============================================================

const PAGE_SIZE = 50;

let currentPage     = 0;
let totalCount      = 0;
let currentSearch   = "";
let currentCategory = "";
let currentVersion  = "";
let currentLoader   = "";
let currentSort     = "2";
let isLoading       = false;
let showFavoritesMode = false;

// ── Éléments DOM ─────────────────────────────────────────────
const modsGrid       = document.getElementById("modsGrid");
const modsLoading    = document.getElementById("modsLoading");
const modsError      = document.getElementById("modsError");
const modsErrorMsg   = document.getElementById("modsErrorMsg");
const modsRetryBtn   = document.getElementById("modsRetryBtn");
const modsCount      = document.getElementById("modsCount");
const modsPageInfo   = document.getElementById("modsPageInfo");
const modsPagination = document.getElementById("modsPagination");
const modsPrevBtn    = document.getElementById("modsPrevBtn");
const modsNextBtn    = document.getElementById("modsNextBtn");
const modsPageNums   = document.getElementById("modsPageNumbers");
const modsSearchInput= document.getElementById("modsSearchInput");
const modsSearchBtn  = document.getElementById("modsSearchBtn");
const filterVersion  = document.getElementById("filterVersion");
const filterSort     = document.getElementById("filterSort");

// ── Utilitaires ───────────────────────────────────────────────
function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K";
  return String(n);
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1)   return "Aujourd''hui";
  if (days < 30)  return `il y a ${days} j`;
  if (days < 365) return `il y a ${Math.floor(days / 30)} mois`;
  return `il y a ${Math.floor(days / 365)} an(s)`;
}

function releaseLabel(type) {
  if (type === 1) return { text: "Release", cls: "tag-release" };
  if (type === 2) return { text: "Beta",    cls: "tag-beta" };
  return                  { text: "Alpha",  cls: "tag-alpha" };
}

// ── Rendu d'une carte mod ─────────────────────────────────────
function renderCard(mod) {
  const dl  = formatNumber(mod.downloadCount || 0);
  const ago = timeAgo(mod.dateModified);
  const ver = mod.latestFiles?.[0]?.gameVersion || "";
  const rel = mod.latestFiles?.[0]
    ? releaseLabel(mod.latestFiles[0].releaseType)
    : null;

  const logo = mod.logo
    ? `<img src="${mod.logo}" alt="${mod.name}" class="mod-card-logo" loading="lazy" />`
    : `<div class="mod-card-logo mod-card-logo-fallback">🧩</div>`;

  const relTag = rel
    ? `<span class="mod-ver-tag ${rel.cls}">${rel.text}</span>`
    : "";
  const verTag = ver
    ? `<span class="mod-ver-tag tag-ver">${ver}</span>`
    : "";

  const cats = mod.categories?.slice(0, 2).map(
    c => `<span class="mod-cat-chip">${c.name}</span>`
  ).join("") || "";

  const url = mod.links?.websiteUrl || `https://www.curseforge.com/minecraft/mc-mods/${mod.slug}`;
  const isFav = isFavorite(mod.id);

  return `
    <div class="mod-card-cf-wrap">
      <a class="mod-card-cf" href="${url}" target="_blank" rel="noopener noreferrer">
        <div class="mod-card-cf-logo">${logo}</div>
        <div class="mod-card-cf-body">
          <div class="mod-card-cf-top">
            <span class="mod-card-cf-name">${mod.name}</span>
            <span class="mod-card-cf-author">par ${mod.authors?.join(", ") || "?"}</span>
          </div>
          <p class="mod-card-cf-desc">${mod.summary || ""}</p>
          <div class="mod-card-cf-footer">
            <div class="mod-card-cf-tags">${relTag}${verTag}${cats}</div>
            <div class="mod-card-cf-stats">
              <span title="Téléchargements">⬇ ${dl}</span>
              <span title="Mis à jour">🕒 ${ago}</span>
            </div>
          </div>
        </div>
      </a>
      <button class="mod-fav-btn ${isFav ? "active" : ""}" data-id="${mod.id}" data-name="${mod.name.replace(/"/g,"&quot;")}" data-slug="${mod.slug}" data-logo="${mod.logo || ""}" data-url="${url}" title="${isFav ? "Retirer des favoris" : "Ajouter aux favoris"}">⭐</button>
    </div>`;
}

// ── États visuels ─────────────────────────────────────────────
function showLoading() {
  modsLoading.style.display   = "flex";
  modsError.style.display     = "none";
  modsGrid.style.display      = "none";
  modsPagination.style.display= "none";
}

function showError(msg) {
  modsLoading.style.display   = "none";
  modsError.style.display     = "flex";
  modsGrid.style.display      = "none";
  modsPagination.style.display= "none";
  modsErrorMsg.textContent    = msg;
}

function showGrid() {
  modsLoading.style.display   = "none";
  modsError.style.display     = "none";
  modsGrid.style.display      = "grid";
  modsPagination.style.display= "flex";
}

// ── Pagination ────────────────────────────────────────────────
function renderPagination() {
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  modsPrevBtn.disabled = currentPage === 0;
  modsNextBtn.disabled = currentPage >= totalPages - 1;

  modsPageInfo.textContent = `Page ${currentPage + 1} / ${totalPages || 1}`;

  modsPageNums.innerHTML = "";
  const range = [];
  const delta = 2;
  for (let i = Math.max(0, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
    range.push(i);
  }
  if (range[0] > 0) {
    range.unshift("...");
    range.unshift(0);
  }
  if (range[range.length - 1] < totalPages - 1) {
    range.push("...");
    range.push(totalPages - 1);
  }

  range.forEach(p => {
    if (p === "...") {
      const span = document.createElement("span");
      span.textContent = "…";
      span.className = "mods-page-dots";
      modsPageNums.appendChild(span);
      return;
    }
    const btn = document.createElement("button");
    btn.textContent = p + 1;
    btn.className   = "mods-page-num" + (p === currentPage ? " active" : "");
    btn.addEventListener("click", () => { currentPage = p; fetchMods(); });
    modsPageNums.appendChild(btn);
  });
}

// ── Fetch mods ────────────────────────────────────────────────
async function fetchMods() {
  if (isLoading) return;
  isLoading = true;
  showLoading();
  window.scrollTo({ top: 0, behavior: "smooth" });

  const params = new URLSearchParams({
    page:      currentPage,
    pageSize:  PAGE_SIZE,
    sortField: currentSort,
  });
  if (currentSearch)   params.set("searchFilter", currentSearch);
  if (currentCategory) params.set("categoryId",   currentCategory);
  if (currentVersion)  params.set("gameVersion",  currentVersion);
  if (currentLoader)   params.set("modLoader",    currentLoader);

  try {
    const res  = await fetch(`/api/mods?${params.toString()}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Erreur inconnue");

    totalCount = data.pagination?.totalCount || data.mods.length;
    const from = currentPage * PAGE_SIZE + 1;
    const to   = Math.min(from + data.mods.length - 1, totalCount);

    modsCount.textContent = `${totalCount.toLocaleString("fr")} mods trouvés  (${from}–${to})`;
    modsGrid.innerHTML    = data.mods.map(renderCard).join("");
    bindFavButtons();

    renderPagination();
    showGrid();
  } catch (err) {
    showError(err.message);
  } finally {
    isLoading = false;
  }
}

// ── Événements ────────────────────────────────────────────────

function triggerSearch() {
  currentSearch = modsSearchInput.value.trim();
  currentPage   = 0;
  fetchMods();
}
modsSearchBtn.addEventListener("click", triggerSearch);
modsSearchInput.addEventListener("keydown", e => { if (e.key === "Enter") triggerSearch(); });

filterVersion.addEventListener("change", () => {
  currentVersion = filterVersion.value;
  currentPage    = 0;
  fetchMods();
});
filterSort.addEventListener("change", () => {
  currentSort = filterSort.value;
  currentPage = 0;
  fetchMods();
});

// Loader buttons
document.querySelectorAll(".mods-loader-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mods-loader-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentLoader = btn.dataset.loader;
    currentPage   = 0;
    fetchMods();
  });
});

document.querySelectorAll(".mods-cat-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mods-cat-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.cat;
    currentPage     = 0;
    fetchMods();
  });
});

modsPrevBtn.addEventListener("click", () => { if (currentPage > 0) { currentPage--; fetchMods(); } });
modsNextBtn.addEventListener("click", () => {
  if (currentPage < Math.ceil(totalCount / PAGE_SIZE) - 1) {
    currentPage++;
    fetchMods();
  }
});

modsRetryBtn.addEventListener("click", fetchMods);

const hamburger = document.getElementById("hamburger");
const navLinks  = document.getElementById("navLinks");
if (hamburger && navLinks) {
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navLinks.classList.toggle("active");
  });
}

// ── Favoris (localStorage) ────────────────────────────────────
function getFavorites() {
  try { return JSON.parse(localStorage.getItem("modFavorites") || "[]"); }
  catch (_) { return []; }
}
function saveFavorites(favs) {
  localStorage.setItem("modFavorites", JSON.stringify(favs));
  updateFavCount();
}
function isFavorite(id) {
  return getFavorites().some(f => f.id === id);
}
function toggleFavorite(mod) {
  let favs = getFavorites();
  if (favs.some(f => f.id === mod.id)) {
    favs = favs.filter(f => f.id !== mod.id);
  } else {
    favs.push(mod);
  }
  saveFavorites(favs);
  return favs.some(f => f.id === mod.id);
}
function updateFavCount() {
  const el = document.getElementById("modsFavCount");
  if (el) el.textContent = getFavorites().length;
}
function bindFavButtons() {
  document.querySelectorAll(".mod-fav-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault(); e.stopPropagation();
      const mod = { id: Number(btn.dataset.id), name: btn.dataset.name, slug: btn.dataset.slug, logo: btn.dataset.logo, url: btn.dataset.url };
      const isNowFav = toggleFavorite(mod);
      btn.classList.toggle("active", isNowFav);
      btn.title = isNowFav ? "Retirer des favoris" : "Ajouter aux favoris";
    });
  });
}

// Bouton "Voir mes favoris"
const modsFavToggle = document.getElementById("modsFavToggle");
if (modsFavToggle) {
  modsFavToggle.addEventListener("click", () => {
    showFavoritesMode = !showFavoritesMode;
    if (showFavoritesMode) {
      const favs = getFavorites();
      modsCount.textContent = `${favs.length} mod(s) en favoris`;
      modsPagination.style.display = "none";
      modsLoading.style.display    = "none";
      modsError.style.display      = "none";
      if (favs.length === 0) {
        modsGrid.style.display = "grid";
        modsGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;opacity:.6;">Aucun favori pour l'instant.<br>Clique sur ⭐ sur un mod pour l'ajouter.</div>`;
      } else {
        modsGrid.style.display = "grid";
        modsGrid.innerHTML = favs.map(f => `
          <div class="mod-card-cf-wrap">
            <a class="mod-card-cf" href="${f.url}" target="_blank" rel="noopener noreferrer">
              <div class="mod-card-cf-logo">${f.logo ? `<img src="${f.logo}" alt="${f.name}" class="mod-card-logo" loading="lazy"/>` : `<div class="mod-card-logo mod-card-logo-fallback">🧩</div>`}</div>
              <div class="mod-card-cf-body">
                <div class="mod-card-cf-top"><span class="mod-card-cf-name">${f.name}</span></div>
              </div>
            </a>
            <button class="mod-fav-btn active" data-id="${f.id}" data-name="${f.name}" data-slug="${f.slug || ""}" data-logo="${f.logo || ""}" data-url="${f.url}" title="Retirer des favoris">⭐</button>
          </div>`).join("");
        bindFavButtons();
      }
      modsFavToggle.textContent = `← Retour aux mods`;
    } else {
      modsFavToggle.textContent = `Voir mes favoris (${getFavorites().length})`;
      fetchMods();
    }
  });
}
updateFavCount();

// ── Bandeaux conseils ─────────────────────────────────────────
const TIPS = [
  // ── Objets & recettes ────────────────────────────────────────
  {
    icon: "💡",
    title: "Voir toutes les recettes en jeu ?",
    text: `Installe <a href="https://www.curseforge.com/minecraft/mc-mods/jei" target="_blank" rel="noopener noreferrer">Just Enough Items (JEI)</a> — il affiche dans Minecraft les recettes de craft de tous tes mods installés.`,
  },
  {
    icon: "🍎",
    title: "Suivre la faim et la saturation",
    text: `<a href="https://www.curseforge.com/minecraft/mc-mods/appleskin" target="_blank" rel="noopener noreferrer">AppleSkin</a> affiche visuellement ta saturation et les gains de faim de chaque aliment — indispensable pour survivre.`,
  },
  {
    icon: "📦",
    title: "Trier ton inventaire en un clic",
    text: `<a href="https://www.curseforge.com/minecraft/mc-mods/inventory-sorter" target="_blank" rel="noopener noreferrer">Inventory Sorter</a> trie automatiquement ton inventaire ou un coffre d'un simple clic molette.`,
  },
  {
    icon: "🖱️",
    title: "Déplacer plusieurs objets à la fois",
    text: `<a href="https://www.curseforge.com/minecraft/mc-mods/mouse-tweaks" target="_blank" rel="noopener noreferrer">Mouse Tweaks</a> améliore le glisser-déposer dans les inventaires — gain de temps énorme pour les crafts en masse.`,
  },
  {
    icon: "🚛",
    title: "Transporter des blocs et des mobs",
    text: `<a href="https://www.curseforge.com/minecraft/mc-mods/carry-on" target="_blank" rel="noopener noreferrer">Carry On</a> te permet de porter des blocs (coffres, machines) et même des animaux directement dans tes bras.`,
  },
  {
    icon: "🗄️",
    title: "Des coffres plus grands ?",
    text: `<a href="https://www.curseforge.com/minecraft/mc-mods/iron-chests" target="_blank" rel="noopener noreferrer">Iron Chests</a> ajoute des coffres en fer, or, diamant, émeraude… chacun plus grand que le précédent.`,
  },
  {
    icon: "🗂️",
    title: "Organiser tes ressources efficacement",
    text: `<a href="https://www.curseforge.com/minecraft/mc-mods/storage-drawers" target="_blank" rel="noopener noreferrer">Storage Drawers</a> crée des tiroirs visuels pour stocker de grandes quantités de ressources d'un seul type.`,
  },
  {
    icon: "🎒",
    title: "Plus d'inventaire en déplacement",
    text: `<a href="https://www.curseforge.com/minecraft/mc-mods/sophisticated-backpacks" target="_blank" rel="noopener noreferrer">Sophisticated Backpacks</a> ajoute des sacs à dos améliorables avec filtres, tri automatique et même craft intégré.`,
  },
  // ── Construction & décoration ────────────────────────────────
  {
    icon: "🏗️",
    title: "Des blocs décoratifs variés",
    text: `<a href="https://www.curseforge.com/minecraft/mc-mods/chisel" target="_blank" rel="noopener noreferrer">Chisel</a> ajoute des dizaines de variantes visuelles pour chaque bloc — parfait pour des constructions détaillées.`,
  },
  {
    icon: "🌉",
    title: "Construire des ponts rapidement",
    text: `<a href="https://www.curseforge.com/minecraft/mc-mods/macaws-bridges" target="_blank" rel="noopener noreferrer">Macaw's Bridges</a> ajoute des ponts en bois, pierre, métal dans différents styles architecturaux.`,
  },
  {
    icon: "🚪",
    title: "Plus de styles de portes",
    text: `<a href="https://www.curseforge.com/minecraft/mc-mods/macaws-doors" target="_blank" rel="noopener noreferrer">Macaw's Doors</a> ajoute des dizaines de portes différentes — coulissantes, en verre, métal, bois exotique…`,
  },
  {
    icon: "🏡",
    title: "Variété dans tes constructions",
    text: `Mélange plusieurs types de blocs, escaliers, dalles et murs pour créer du relief. Les détails font toute la différence entre une maison basique et une vraie construction.`,
  },
  {
    icon: "🌿",
    title: "Rendre tes zones plus vivantes",
    text: `Ajoute végétation, fontaines et chemins entre tes bâtiments. Ça transforme complètement l'ambiance d'une base ou d'un village.`,
  },
  // ── Animaux & biomes ─────────────────────────────────────────
  {
    icon: "🐾",
    title: "Plus d'animaux réalistes",
    text: `<a href="https://www.curseforge.com/minecraft/mc-mods/alexs-mobs" target="_blank" rel="noopener noreferrer">Alex's Mobs</a> ajoute des dizaines d'animaux uniques avec des comportements réalistes dans leurs biomes naturels.`,
  },
  {
    icon: "🌍",
    title: "Plus de diversité de paysages",
    text: `<a href="https://www.curseforge.com/minecraft/mc-mods/biomes-o-plenty" target="_blank" rel="noopener noreferrer">Biomes O' Plenty</a> ajoute plus de 80 nouveaux biomes — forêts tropicales, toundras, marécages mystiques…`,
  },
  {
    icon: "🐟",
    title: "Enrichir les zones aquatiques",
    text: `Installe des mods aquatiques pour ajouter des poissons, requins et créatures marines. Idéal pour construire un aquarium ou un zoo sous-marin.`,
  },
  {
    icon: "🦁",
    title: "Construire un zoo réaliste",
    text: `Place chaque animal dans son biome naturel (forêt, savane, rivière) avec des enclos personnalisés. Ajoute des panneaux explicatifs pour un vrai aspect parc animalier.`,
  },
  // ── Exploration & déplacement ────────────────────────────────
  {
    icon: "🗺️",
    title: "Minimap et carte du monde",
    text: `<a href="https://www.curseforge.com/minecraft/mc-mods/journeymap" target="_blank" rel="noopener noreferrer">JourneyMap</a> ajoute une minimap et une carte complète du monde. Marque tes points d'intérêt pour ne jamais te perdre.`,
  },
  {
    icon: "🪨",
    title: "Se téléporter rapidement",
    text: `<a href="https://www.curseforge.com/minecraft/mc-mods/waystones" target="_blank" rel="noopener noreferrer">Waystones</a> ajoute des pierres de téléportation que tu poses dans le monde — reviens à ta base en un instant.`,
  },
  {
    icon: "🧭",
    title: "Trouver les biomes et structures",
    text: `<a href="https://www.curseforge.com/minecraft/mc-mods/natures-compass" target="_blank" rel="noopener noreferrer">Nature's Compass</a> et <a href="https://www.curseforge.com/minecraft/mc-mods/explorers-compass" target="_blank" rel="noopener noreferrer">Explorer's Compass</a> localisent biomes et structures importantes en quelques secondes.`,
  },
  {
    icon: "🎒",
    title: "Bien préparer ses expéditions",
    text: `Pars toujours avec beaucoup de nourriture, potions de soin et un lit. Pose un waystone ou un sac de couchage près de tes zones d'exploration.`,
  },
  // ── Machines & automatisation ────────────────────────────────
  {
    icon: "⚙️",
    title: "Machines et mécanismes complexes",
    text: `<a href="https://www.curseforge.com/minecraft/mc-mods/create" target="_blank" rel="noopener noreferrer">Create</a> est le mod d'automatisation le plus complet — convoyeurs, engrenages, presses, moulins à vent… tout en vanilla style.`,
  },
  {
    icon: "🌾",
    title: "Fermes automatiques",
    text: `Installe des mods de ferme automatique pour récolter cultures et animaux sans effort. Combiné avec Create ou des pipes, tu peux tout automatiser.`,
  },
  {
    icon: "🔄",
    title: "Tri automatique des coffres",
    text: `Installe des mods de tri (pipes, convoyeurs, hoppers améliorés) pour organizater tes coffres automatiquement. Fini de chercher où tu as mis tes matériaux.`,
  },
  {
    icon: "🪵",
    title: "Récolter intelligemment",
    text: `Des mods de récolte intelligente coupent les arbres entiers, récoltent toute la canne à sucre d'un coup ou ramassent automatiquement les plantations à maturité.`,
  },
  // ── Général ──────────────────────────────────────────────────
  {
    icon: "⚠️",
    title: "Sauvegarde avant d'installer un mod !",
    text: `Certains mods peuvent corrompre une sauvegarde existante. Fais une copie de ton dossier <code>.minecraft/saves</code> avant toute installation.`,
  },
  {
    icon: "🔧",
    title: "Forge ou Fabric ?",
    text: `<strong>Forge</strong> = le plus de mods disponibles. <strong>Fabric</strong> = plus léger et mis à jour plus vite. Ils ne sont pas compatibles entre eux — choisis avant d'installer quoi que ce soit.`,
  },
  {
    icon: "📋",
    title: "Vérifier la compatibilité des mods",
    text: `Tous tes mods doivent être sur la <strong>même version de Minecraft</strong> et le <strong>même loader</strong> (Forge/Fabric). Un seul mod incompatible peut empêcher le jeu de démarrer.`,
  },
  {
    icon: "🚀",
    title: "Jeu qui lag avec des mods ?",
    text: `Installe <a href="https://www.curseforge.com/minecraft/mc-mods/sodium" target="_blank" rel="noopener noreferrer">Sodium</a> (Fabric) ou <a href="https://www.curseforge.com/minecraft/mc-mods/rubidium" target="_blank" rel="noopener noreferrer">Rubidium</a> (Forge) pour booster les FPS sans changer le gameplay.`,
  },
  {
    icon: "📦",
    title: "Gérer tes mods facilement",
    text: `Utilise l'application <a href="https://www.curseforge.com/download/app" target="_blank" rel="noopener noreferrer">CurseForge App</a> pour installer et mettre à jour tes mods en un clic, sans risque de conflit.`,
  },
];

(function initTips() {
  const tip     = document.getElementById("modsTip");
  const icon    = document.getElementById("modsTipIcon");
  const content = document.getElementById("modsTipContent");
  const prev    = document.getElementById("modsTipPrev");
  const next    = document.getElementById("modsTipNext");
  const close   = document.getElementById("modsTipClose");
  if (!tip) return;

  if (localStorage.getItem("tipsClosed_v2")) { tip.style.display = "none"; return; }

  let idx = parseInt(localStorage.getItem("tipIndex_v2") || "0", 10) % TIPS.length;
  let autoTimer;

  function show(i) {
    idx = (i + TIPS.length) % TIPS.length;
    const t = TIPS[idx];
    icon.textContent  = t.icon;
    content.innerHTML = `<strong>${t.title}</strong>${t.text}`;
    localStorage.setItem("tipIndex_v2", idx);
  }

  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => show(idx + 1), 15000);
  }

  prev.addEventListener("click",  () => { show(idx - 1); startAuto(); });
  next.addEventListener("click",  () => { show(idx + 1); startAuto(); });
  close.addEventListener("click", () => {
    clearInterval(autoTimer);
    tip.style.display = "none";
    localStorage.setItem("tipsClosed_v2", "1");
  });

  show(idx);
  startAuto();
})();

// ── Chargement des versions Mojang ───────────────────────────
async function loadVersions() {
  const FALLBACK = ["1.21.4","1.21.1","1.21","1.20.6","1.20.4","1.20.2","1.20.1","1.20",
    "1.19.4","1.19.2","1.19","1.18.2","1.18.1","1.18","1.17.1","1.17",
    "1.16.5","1.16.4","1.16.3","1.16.2","1.16.1","1.16",
    "1.15.2","1.15","1.14.4","1.14","1.13.2","1.13","1.12.2","1.12"];

  function populate(versions) {
    filterVersion.innerHTML = '<option value="">Toutes</option>';
    versions.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v; opt.textContent = v;
      filterVersion.appendChild(opt);
    });
  }

  try {
    const res  = await fetch("https://launchermeta.mojang.com/mc/game/version_manifest_v2.json");
    const data = await res.json();
    const releases = data.versions.filter(v => v.type === "release").map(v => v.id);
    populate(releases.length ? releases : FALLBACK);
  } catch (_) {
    populate(FALLBACK);
  }
}

// ── Lancement ─────────────────────────────────────────────────
loadVersions();
fetchMods();

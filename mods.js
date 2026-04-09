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
  {
    icon: "💡",
    title: "Voir toutes les recettes en jeu ?",
    text: `Installe <a href="https://www.curseforge.com/minecraft/mc-mods/jei" target="_blank" rel="noopener noreferrer">Just Enough Items (JEI)</a> — il affiche dans Minecraft les recettes de craft de tous tes mods installés.`,
  },
  {
    icon: "⚠️",
    title: "Sauvegarde ton monde avant d'installer un mod !",
    text: `Certains mods peuvent corrompre une sauvegarde existante. Fais une copie de ton dossier <code>.minecraft/saves</code> avant toute installation.`,
  },
  {
    icon: "🔧",
    title: "Forge ou Fabric ?",
    text: `<strong>Forge</strong> = le plus de mods disponibles. <strong>Fabric</strong> = plus léger et mis à jour plus vite. Ils ne sont pas compatibles entre eux — choisis avant d'installer quoi que ce soit.`,
  },
  {
    icon: "📦",
    title: "Gérer tes mods facilement",
    text: `Utilise l'application <a href="https://www.curseforge.com/download/app" target="_blank" rel="noopener noreferrer">CurseForge App</a> pour installer et mettre à jour tes mods en un clic, sans risque de conflit.`,
  },
  {
    icon: "🚀",
    title: "Jeu qui lag avec des mods ?",
    text: `Installe <a href="https://www.curseforge.com/minecraft/mc-mods/sodium" target="_blank" rel="noopener noreferrer">Sodium</a> (Fabric) ou <a href="https://www.curseforge.com/minecraft/mc-mods/rubidium" target="_blank" rel="noopener noreferrer">Rubidium</a> (Forge) pour booster les FPS sans changer le gameplay.`,
  },
  {
    icon: "📋",
    title: "Vérifier la compatibilité des mods",
    text: `Tous tes mods doivent être sur la <strong>même version de Minecraft</strong> et le <strong>même loader</strong> (Forge/Fabric). Un seul mod incompatible peut empêcher le jeu de démarrer.`,
  },
  {
    icon: "🗺️",
    title: "Minimap dans tous tes modpacks",
    text: `<a href="https://www.curseforge.com/minecraft/mc-mods/journeymap" target="_blank" rel="noopener noreferrer">JourneyMap</a> ajoute une minimap et une carte du monde complète. Compatible avec la majorité des mods.`,
  },
];

(function initTips() {
  const tip     = document.getElementById("modsTip");
  const icon    = document.getElementById("modsTipIcon");
  const content = document.getElementById("modsTipContent");
  const counter = document.getElementById("modsTipCounter");
  const prev    = document.getElementById("modsTipPrev");
  const next    = document.getElementById("modsTipNext");
  const close   = document.getElementById("modsTipClose");
  if (!tip) return;

  if (localStorage.getItem("tipsClosed")) { tip.style.display = "none"; return; }

  let idx = parseInt(localStorage.getItem("tipIndex") || "0", 10) % TIPS.length;

  function show(i) {
    idx = (i + TIPS.length) % TIPS.length;
    const t = TIPS[idx];
    icon.textContent   = t.icon;
    content.innerHTML  = `<strong>${t.title}</strong>${t.text}`;
    counter.textContent = `${idx + 1} / ${TIPS.length}`;
    localStorage.setItem("tipIndex", idx);
  }

  prev.addEventListener("click",  () => show(idx - 1));
  next.addEventListener("click",  () => show(idx + 1));
  close.addEventListener("click", () => {
    tip.style.display = "none";
    localStorage.setItem("tipsClosed", "1");
  });

  show(idx);
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

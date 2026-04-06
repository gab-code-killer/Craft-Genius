// ============================================================
// Mods Forge — mods.js  (interface style CurseForge)
// ============================================================

const PAGE_SIZE = 50;

let currentPage     = 0;
let totalCount      = 0;
let currentSearch   = "";
let currentCategory = "";
let currentVersion  = "";
let currentSort     = "2";
let isLoading       = false;

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

  return `
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
    </a>`;
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

  try {
    const res  = await fetch(`/api/mods?${params.toString()}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Erreur inconnue");

    totalCount = data.pagination?.totalCount || data.mods.length;
    const from = currentPage * PAGE_SIZE + 1;
    const to   = Math.min(from + data.mods.length - 1, totalCount);

    modsCount.textContent = `${totalCount.toLocaleString("fr")} mods trouvés  (${from}–${to})`;
    modsGrid.innerHTML    = data.mods.map(renderCard).join("");

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

// ── Lancement ─────────────────────────────────────────────────
fetchMods();

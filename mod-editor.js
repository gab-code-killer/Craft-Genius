// ============================================================
// Mod Editor â€” Page d'accueil
// ============================================================

// â”€â”€ Firebase â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const firebaseConfig = {
  apiKey: "AIzaSyDV9nR4R9DrLBF7xkQzihLtzl8cOipUaC0",
  authDomain: "craft-genius-201e6.firebaseapp.com",
  projectId: "craft-genius-201e6",
  storageBucket: "craft-genius-201e6.firebasestorage.app",
  messagingSenderId: "476192035823",
  appId: "1:476192035823:web:9f3c8a72fa2eef9bb99c1a",
};

let meDB   = null;
let meUser = null; // utilisateur Firebase connectÃ©

function initFirebase() {
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  meDB = firebase.firestore();

  firebase.auth().onAuthStateChanged(user => {
    meUser = user || null;
    updateUserBadge();
    renderRecentList(); // recharger depuis Firestore si connectÃ©
  });
}

function updateUserBadge() {
  const badge = document.getElementById('meUserBadge');
  if (!badge) return;
  if (meUser) {
    badge.textContent = `\u2601\uFE0F ${meUser.displayName || meUser.email}`;
    badge.title = 'Projets synchronis\u00E9s avec votre compte';
  } else {
    badge.textContent = '\uD83D\uDCBE Mode local';
    badge.title = 'Connectez-vous pour synchroniser vos projets';
  }

  // Afficher le bouton Minecraft seulement si connecté avec Microsoft
  const btnLaunch = document.getElementById('btnLaunchMinecraft');
  if (!btnLaunch) return;
  const isMicrosoft = meUser && meUser.providerData &&
    meUser.providerData.some(p => p.providerId === 'microsoft.com');
  btnLaunch.style.display = isMicrosoft ? 'flex' : 'none';
}

// ── Éléments ─────────────────────────────────────────────────────────────────
const btnNewProject  = document.getElementById('btnNewProject');
const btnImport      = document.getElementById('btnImport');
const importFileInput= document.getElementById('importFileInput');
const meOverlay      = document.getElementById('meOverlay');
const meModal        = document.getElementById('meModal');
const meModalClose   = document.getElementById('meModalClose');
const meModalCancel  = document.getElementById('meModalCancel');
const meModalCreate  = document.getElementById('meModalCreate');
const modNameInput   = document.getElementById('modName');
const modIdInput     = document.getElementById('modId');
const modIdPreview   = document.getElementById('modIdPreview');
const idLockBtn      = document.getElementById('idLockBtn');

// Lancer Minecraft
document.getElementById('btnLaunchMinecraft').addEventListener('click', () => {
  window.location.href = 'minecraft://';
});

let idLocked = true;

// â”€â”€ Convertir un nom en ID â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function nameToId(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
}

// â”€â”€ Mise Ã  jour de la prÃ©visualisation de l'ID â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function updateIdPreview() {
  const id = modIdInput.value || '\u2014';
  modIdPreview.innerHTML = `ID : <code>${id}</code>`;
  meModalCreate.disabled = !(modNameInput.value.trim() && modIdInput.value.trim());
}

// â”€â”€ Synchronisation Nom â†’ ID â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
modNameInput.addEventListener('input', () => {
  if (idLocked) modIdInput.value = nameToId(modNameInput.value);
  updateIdPreview();
});

modIdInput.addEventListener('input', () => {
  idLocked = false;
  idLockBtn.textContent = '\uD83D\uDD13';
  idLockBtn.classList.add('unlocked');
  updateIdPreview();
});

idLockBtn.addEventListener('click', () => {
  idLocked = !idLocked;
  if (idLocked) {
    idLockBtn.textContent = '\uD83D\uDD12';
    idLockBtn.classList.remove('unlocked');
    modIdInput.value = nameToId(modNameInput.value);
    updateIdPreview();
  } else {
    idLockBtn.textContent = '\uD83D\uDD13';
    idLockBtn.classList.add('unlocked');
  }
});

// â”€â”€ Ouvrir/Fermer la modale â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function openModal() {
  meOverlay.classList.add('open');
  meModal.style.display = 'block';
  requestAnimationFrame(() => requestAnimationFrame(() => meModal.classList.add('open')));
  modNameInput.focus();
}

function closeModal() {
  meModal.classList.remove('open');
  meOverlay.classList.remove('open');
  setTimeout(() => { meModal.style.display = 'none'; }, 220);
  resetModal();
}

function resetModal() {
  modNameInput.value = '';
  modIdInput.value   = '';
  modIdPreview.innerHTML = 'ID : <code>\u2014</code>';
  idLocked = true;
  idLockBtn.textContent = '\uD83D\uDD12';
  idLockBtn.classList.remove('unlocked');
  meModalCreate.disabled = true;
}

btnNewProject.addEventListener('click', openModal);
meModalClose.addEventListener('click', closeModal);
meModalCancel.addEventListener('click', closeModal);
meOverlay.addEventListener('click', closeModal);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && meModal.classList.contains('open')) closeModal();
});

// â”€â”€ CrÃ©er le projet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
meModalCreate.addEventListener('click', async () => {
  const name    = modNameInput.value.trim();
  const id      = modIdInput.value.trim();
  const version = document.getElementById('modVersion').value;
  const loader  = document.querySelector('input[name="loader"]:checked').value;

  if (!name || !id) return;

  meModalCreate.disabled = true;
  meModalCreate.textContent = '\u23F3 Cr\u00E9ation...';

  const project = { name, id, version, loader, createdAt: Date.now() };

  await saveProject(project);
  closeModal();
  renderRecentList();
  openWorkspace(project);
});

// â”€â”€ Import fichier JSON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
btnImport.addEventListener('click', () => importFileInput.click());

importFileInput.addEventListener('change', () => {
  const file = importFileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const name = data.name || file.name.replace('.json', '') || 'Projet import\u00E9';
      const id   = data.id   || nameToId(name);
      const project = {
        name, id,
        version:  data.version || '1.21',
        loader:   data.loader  || 'forge',
        createdAt: Date.now(),
        imported: true,
      };
      await saveProject(project);
      renderRecentList();
      showToast(`\uD83D\uDCC2 "${name}" import\u00E9 avec succ\u00E8s !`);
    } catch {
      showToast('\u274C Fichier JSON invalide', true);
    }
  };
  reader.readAsText(file);
  importFileInput.value = '';
});

// â”€â”€ Persistance : Firebase (si connectÃ©) ou localStorage â”€â”€â”€â”€â”€â”€
const STORAGE_KEY = 'craftGenius_modProjects';

async function saveProject(project) {
  if (meUser && meDB) {
    // â”€â”€ Firestore â”€â”€
    try {
      await meDB
        .collection('users').doc(meUser.uid)
        .collection('modProjects').doc(project.id)
        .set(project);
    } catch (err) {
      console.error('Firestore save error:', err);
      // fallback local si erreur rÃ©seau
      saveProjectLocal(project);
    }
  } else {
    // â”€â”€ localStorage â”€â”€
    saveProjectLocal(project);
  }
}

function saveProjectLocal(project) {
  const projects = getProjectsLocal();
  const existing = projects.findIndex(p => p.id === project.id);
  if (existing >= 0) projects[existing] = { ...projects[existing], ...project };
  else projects.unshift(project);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, 20)));
}

async function deleteProject(id) {
  if (meUser && meDB) {
    try {
      await meDB
        .collection('users').doc(meUser.uid)
        .collection('modProjects').doc(id)
        .delete();
    } catch (err) {
      console.error('Firestore delete error:', err);
    }
  }
  // Supprimer aussi du localStorage (synchro double-sÃ©curitÃ©)
  const projects = getProjectsLocal().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  renderRecentList();
}

function getProjectsLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

// â”€â”€ Afficher les projets rÃ©cents â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function renderRecentList() {
  const list  = document.getElementById('meRecentList');
  const empty = document.getElementById('meRecentEmpty');

  list.innerHTML = '<li class="me-recent-loading">\u23F3 Chargement...</li>';

  let projects = [];

  if (meUser && meDB) {
    try {
      const snap = await meDB
        .collection('users').doc(meUser.uid)
        .collection('modProjects')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();
      projects = snap.docs.map(d => d.data());
    } catch (err) {
      console.error('Firestore load error:', err);
      projects = getProjectsLocal();
    }
  } else {
    projects = getProjectsLocal();
  }

  list.innerHTML = '';

  if (projects.length === 0) {
    empty.classList.add('visible');
    return;
  }
  empty.classList.remove('visible');

  projects.forEach(p => {
    const li = document.createElement('li');
    li.className = 'me-recent-item';
    const date = new Date(p.createdAt).toLocaleDateString('fr-FR');
    li.innerHTML = `
      <div>
        <div class="me-recent-item-name">${escHtml(p.name)}</div>
        <div class="me-recent-item-meta">ID : ${escHtml(p.id)} \u00B7 ${escHtml(p.loader)} ${escHtml(p.version)} \u00B7 ${date}</div>
      </div>
      <button class="me-recent-item-del" title="Supprimer">&times;</button>
    `;
    li.querySelector('.me-recent-item-del').addEventListener('click', e => {
      e.stopPropagation();
      deleteProject(p.id);
    });
    li.addEventListener('click', e => {
      if (e.target.classList.contains('me-recent-item-del')) return;
      openWorkspace(p);
    });
    list.appendChild(li);
  });
}

// â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showToast(msg, isError = false) {
  const existing = document.getElementById('meToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'meToast';
  Object.assign(toast.style, {
    position: 'fixed', bottom: '28px', left: '50%',
    transform: 'translateX(-50%) translateY(20px)',
    background: isError ? '#3a0a0a' : '#0f1a10',
    border: `1px solid ${isError ? '#a03030' : '#306030'}`,
    color: isError ? '#f09090' : '#90e090',
    padding: '12px 22px', borderRadius: '10px',
    fontSize: '0.88rem', fontWeight: '700',
    zIndex: '9999', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    transition: 'all 0.3s', whiteSpace: 'nowrap', opacity: '0',
  });
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';
  }));
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Workspace ─────────────────────────────────────────────────────
let currentProject = null;
let wsElements = [];

const meHome        = document.getElementById('meHome');
const meWorkspace   = document.getElementById('meWorkspace');
const wsProjectName = document.getElementById('wsProjectName');
const wsProjectMeta = document.getElementById('wsProjectMeta');
const wsBtnBack     = document.getElementById('wsBtnBack');

const ELEMENT_ICONS = {
  block: 'textures/cobblestone.png',
};

const ELEMENT_NAMES = {
  block: 'Bloc',
};

function addElement(type) {
  const count = wsElements.filter(e => e.type === type).length + 1;
  const baseName = ELEMENT_NAMES[type] || type;
  const el = { type, name: `${baseName}_${count}`, uid: Date.now() };
  wsElements.push(el);
  renderElements();
}

function renderElements() {
  const list = document.getElementById('wsElementsList');
  list.innerHTML = '';
  if (wsElements.length === 0) {
    list.innerHTML = '<li class="mew-elements-empty">Aucun élément pour l\'instant</li>';
    return;
  }
  wsElements.forEach(el => {
    const li = document.createElement('li');
    li.className = 'mew-element-item';
    const icon = ELEMENT_ICONS[el.type] || '';
    li.innerHTML = icon
      ? `<img src="${escHtml(icon)}" alt="" width="20" height="20"><span>${escHtml(el.name)}</span>`
      : `<span>${escHtml(el.name)}</span>`;
    list.appendChild(li);
  });
}

function openWorkspace(project) {
  currentProject = project;
  wsElements = [];
  wsProjectName.textContent = project.name;
  wsProjectMeta.textContent = `${project.loader} · ${project.version}`;
  renderElements();
  meHome.style.display      = 'none';
  meWorkspace.style.display = 'flex';
  showToast(`✅ Projet "${project.name}" ouvert !`);
}

function closeWorkspace() {
  currentProject = null;
  wsElements = [];
  meWorkspace.style.display = 'none';
  meHome.style.display      = 'flex';
}

wsBtnBack.addEventListener('click', closeWorkspace);

// ── Lancer Minecraft ──────────────────────────────────────────
const wsBtnLaunch = document.getElementById('wsBtnLaunch');

function generateLauncherScript(project) {
  const pseudoPrompt = 'MonPseudo'; // placeholder remplacé à la génération
  return `// ============================================================
// Launcher Minecraft — généré par Craft Genius Mod Editor
// Projet : ${project.name}  |  ID : ${project.id}
// Version : ${project.version}  |  Loader : ${project.loader}
// ============================================================
// Prérequis : Node.js + npm install minecraft-launcher-core
// Lancement  : node launch-${escHtml(project.id)}.js
// ============================================================

const { Client, Authenticator } = require('minecraft-launcher-core');
const path = require('path');

const launcher = new Client();

const opts = {
  // Mode offline (pas besoin d'un vrai compte Microsoft)
  authorization: Authenticator.getAuth("${pseudoPrompt}"),

  // Dossier .minecraft (créé automatiquement)
  root: path.join(process.env.APPDATA || process.env.HOME, '.craftgenius-test'),

  version: {
    number: "${project.version}",
    type: "release"
  },

  memory: {
    max: "4G",
    min: "2G"
  }
};

console.log('[Craft Genius] Lancement de Minecraft ${project.version} (${project.loader})...');
console.log('[Craft Genius] Dossier :', opts.root);
console.log('');

launcher.launch(opts);

launcher.on('debug',    (e) => console.log('[debug]', e));
launcher.on('data',     (e) => console.log('[mc]', e));
launcher.on('progress', (e) => {
  const pct = e.total ? Math.round((e.task / e.total) * 100) : 0;
  process.stdout.write(\`\\r[téléchargement] \${e.type} — \${pct}%   \`);
});
launcher.on('close', (code) => {
  console.log('\\n[Craft Genius] Minecraft fermé (code ' + code + ')');
});
`;
}

wsBtnLaunch.addEventListener('click', () => {
  if (!currentProject) return;

  // Afficher une modale d'info avant de télécharger le script
  const overlay = document.createElement('div');
  overlay.id = 'launchOverlay';
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0',
    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
    zIndex: '500', display: 'flex', alignItems: 'center', justifyContent: 'center',
  });

  const box = document.createElement('div');
  Object.assign(box.style, {
    background: '#0f1a10', border: '2px solid #2a5a20',
    borderRadius: '14px', padding: '28px 32px', maxWidth: '480px', width: '90vw',
    boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
    fontFamily: 'inherit', color: '#90e090',
  });

  const pseudo = prompt('Ton pseudo Minecraft (mode offline) :', 'MonPseudo') || 'MonPseudo';

  overlay.remove();

  // Générer le script avec le pseudo fourni
  let script = generateLauncherScript(currentProject);
  script = script.replace('"MonPseudo"', JSON.stringify(pseudo));

  const blob = new Blob([script], { type: 'text/javascript' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `launch-${currentProject.id}.js`;
  a.click();
  URL.revokeObjectURL(url);

  showToast('📥 Script téléchargé ! Lance-le avec : node launch-' + currentProject.id + '.js');
});

document.querySelectorAll('.mew-type-card').forEach(card => {
  card.addEventListener('click', () => {
    const type = card.dataset.type;
    addElement(type);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  meModal.style.display = 'none';
  meModalCreate.disabled = true;
  initFirebase();

  // Charger les versions Minecraft depuis Mojang
  const modVersionSelect = document.getElementById('modVersion');
  if (modVersionSelect) {
    const FALLBACK = ["1.21.4","1.21.1","1.21","1.20.6","1.20.4","1.20.2","1.20.1","1.20",
      "1.19.4","1.19.2","1.19","1.18.2","1.18","1.17.1","1.17",
      "1.16.5","1.16","1.15.2","1.15","1.14.4","1.14","1.13.2","1.13",
      "1.12.2","1.12","1.11.2","1.11","1.10.2","1.10","1.9.4","1.9","1.8.9","1.8","1.7.10"];

    function populateVersions(versions) {
      modVersionSelect.innerHTML = '';
      versions.forEach((v, i) => {
        const opt = document.createElement('option');
        opt.value = v; opt.textContent = v;
        if (i === 0) opt.selected = true;
        modVersionSelect.appendChild(opt);
      });
    }

    fetch('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json')
      .then(r => r.json())
      .then(data => {
        const releases = data.versions.filter(v => v.type === 'release').map(v => v.id);
        populateVersions(releases.length ? releases : FALLBACK);
      })
      .catch(() => populateVersions(FALLBACK));
  }
});

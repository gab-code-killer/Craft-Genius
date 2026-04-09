/**
 * Extraction automatique des recettes de craft depuis CurseForge.
 *
 * Usage:
 *   node extract-recipes.js <modId1> <modId2> ...
 *   node extract-recipes.js 228756 310806 238222
 *
 * Les IDs se trouvent dans l'URL CurseForge, ex:
 *   https://www.curseforge.com/minecraft/mc-mods/thermal-expansion → ID = 69163
 *
 * Prérequis:
 *   .env contenant: CURSEFORGE_API_KEY=...
 *   npm install  (installe adm-zip + dotenv)
 *
 * Résultat: dossier recipes/<slug>.json pour chaque mod
 */

require('dotenv').config();
const fs    = require('fs');
const path  = require('path');
const AdmZip = require('adm-zip');
const fetch = globalThis.fetch || require('node-fetch');

// ── Config ───────────────────────────────────────────────────

const API_KEY    = process.env.CURSEFORGE_API_KEY;
const OUTPUT_DIR = path.join(__dirname, 'recipes');

// Types de recettes qu'on garde
const SUPPORTED_TYPES = [
  'minecraft:crafting_shaped',
  'minecraft:crafting_shapeless',
  'minecraft:smelting',
  'minecraft:blasting',
  'minecraft:smoking',
  'minecraft:campfire_cooking',
  'minecraft:stonecutting',
  'minecraft:smithing',
  'minecraft:smithing_transform',
];

// ── Helpers API CurseForge ───────────────────────────────────

async function cfFetch(endpoint) {
  const res = await fetch(`https://api.curseforge.com/v1${endpoint}`, {
    headers: {
      'x-api-key': API_KEY,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`CurseForge ${endpoint} → ${res.status}: ${text.slice(0, 120)}`);
  }
  return res.json();
}

async function getModInfo(modId) {
  const { data } = await cfFetch(`/mods/${modId}`);
  return data;
}

async function getDownloadUrl(modId, mod) {
  // On cherche le fichier le plus récent parmi latestFiles
  const files = mod.latestFiles || [];
  if (files.length === 0) throw new Error('Aucun fichier disponible pour ce mod');

  // Préférer le release le plus récent
  files.sort((a, b) => b.fileDate.localeCompare(a.fileDate));
  const file = files[0];

  // Essayer d'abord downloadUrl direct
  if (file.downloadUrl) return file.downloadUrl;

  // Sinon, appel API download-url
  try {
    const { data: url } = await cfFetch(`/mods/${modId}/files/${file.id}/download-url`);
    if (url) return url;
  } catch (_) {}

  throw new Error(
    `L'auteur de ce mod a désactivé le téléchargement tiers.\n` +
    `Télécharge manuellement le JAR et lance:\n` +
    `  node extract-recipes.js --jar path/to/mod.jar`
  );
}

// ── Download ─────────────────────────────────────────────────

async function downloadBuffer(url) {
  console.log(`  ↓ Téléchargement...`);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'CraftGenius-RecipeExtractor/1.0' },
  });
  if (!res.ok) throw new Error(`Téléchargement échoué: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  console.log(`  ↓ ${(buf.length / 1024 / 1024).toFixed(1)} MB reçus`);
  return buf;
}

// ── Extraction JAR ───────────────────────────────────────────

function extractRecipesFromBuffer(jarBuffer) {
  const zip     = new AdmZip(jarBuffer);
  const entries = zip.getEntries();
  const recipes = [];

  for (const entry of entries) {
    const name = entry.entryName;
    // Cherche: data/<modid>/recipes/<name>.json
    if (!/^data\/[^/]+\/recipes\/.+\.json$/.test(name)) continue;

    let json;
    try {
      json = JSON.parse(entry.getData().toString('utf8'));
    } catch (_) {
      continue; // JSON invalide → on skippe
    }

    if (!json || !json.type) continue;

    // Normaliser le type (enlever le namespace si non-minecraft pour affichage)
    const recipeId = name
      .replace(/^data\//, '')  // "thermal/recipes/machine_frame.json"
      .replace(/\.json$/, '');

    recipes.push({ id: recipeId, ...json });
  }

  return recipes;
}

// ── Lecture JAR local (mode --jar) ────────────────────────────

async function processLocalJar(jarPath, slug) {
  if (!fs.existsSync(jarPath)) throw new Error(`Fichier introuvable: ${jarPath}`);
  console.log(`\n→ JAR local: ${path.basename(jarPath)}`);
  const buffer  = fs.readFileSync(jarPath);
  const recipes = extractRecipesFromBuffer(buffer);
  console.log(`  ${recipes.length} recettes trouvées`);
  saveOutput(slug || path.basename(jarPath, '.jar'), null, null, recipes);
}

// ── Traitement d'un mod via API ───────────────────────────────

async function processMod(modId) {
  console.log(`\n→ Mod #${modId}`);

  const mod = await getModInfo(modId);
  console.log(`  Nom  : ${mod.name}`);
  console.log(`  Slug : ${mod.slug}`);

  const outFile = path.join(OUTPUT_DIR, `${mod.slug}.json`);

  const url    = await getDownloadUrl(modId, mod);
  const buffer = await downloadBuffer(url);
  const recipes = extractRecipesFromBuffer(buffer);

  const supported  = recipes.filter(r => SUPPORTED_TYPES.includes(r.type));
  const otherTypes = [...new Set(recipes.filter(r => !SUPPORTED_TYPES.includes(r.type)).map(r => r.type))];

  console.log(`  ${supported.length} recettes standard extraites`);
  if (otherTypes.length) {
    console.log(`  (${recipes.length - supported.length} recettes de types custom ignorés: ${otherTypes.slice(0,5).join(', ')})`);
  }

  saveOutput(mod.slug, modId, mod.name, supported, outFile);
}

function saveOutput(slug, modId, name, recipes, outFile) {
  if (!outFile) outFile = path.join(OUTPUT_DIR, `${slug}.json`);
  const output = {
    slug,
    modId:       modId || null,
    name:        name  || slug,
    extractedAt: new Date().toISOString(),
    count:       recipes.length,
    recipes,
  };
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2), 'utf8');
  console.log(`  ✓ Sauvegardé → recipes/${slug}.json`);
}

// ── Récupère les N mods les plus populaires via API ──────────

async function fetchTopMods(total = 100, gameVersion = '') {
  const MINECRAFT_GAME_ID = 432;
  const CLASS_ID_MODS     = 6;
  const PAGE_SIZE         = 50;
  const mods = [];

  for (let index = 0; index < total; index += PAGE_SIZE) {
    const batch = Math.min(PAGE_SIZE, total - index);
    const params = new URLSearchParams({
      gameId:    MINECRAFT_GAME_ID,
      classId:   CLASS_ID_MODS,
      sortField: 2,        // Popularity
      sortOrder: 'desc',
      index,
      pageSize:  batch,
    });
    if (gameVersion) params.set('gameVersion', gameVersion);

    const { data, pagination } = await cfFetch(`/mods/search?${params}`);
    mods.push(...data);
    console.log(`  API: ${mods.length}/${Math.min(total, pagination.totalCount)} mods récupérés`);
    if (mods.length >= pagination.totalCount) break;
  }

  return mods;
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  if (!API_KEY) {
    console.error('❌ CURSEFORGE_API_KEY manquant dans .env');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node extract-recipes.js --top 100');
    console.log('  node extract-recipes.js --top 200 --version 1.20.1');
    console.log('  node extract-recipes.js --jar path/to/mod.jar [slug]');
    console.log('  node extract-recipes.js 69163 323076');
    process.exit(0);
  }

  // ── Mode --jar ──────────────────────────────────────────────
  if (args[0] === '--jar') {
    await processLocalJar(args[1], args[2]);
    return;
  }

  // ── Mode --top N ────────────────────────────────────────────
  if (args[0] === '--top') {
    const total      = parseInt(args[1] || '100', 10);
    const versionIdx = args.indexOf('--version');
    const gameVersion = versionIdx !== -1 ? args[versionIdx + 1] : '';

    console.log(`\n🔍 Récupération des ${total} mods les plus populaires${gameVersion ? ` (${gameVersion})` : ''}...`);
    const mods = await fetchTopMods(total, gameVersion);

    // Sauter les mods déjà traités
    const toProcess = mods.filter(m => {
      const out = path.join(OUTPUT_DIR, `${m.slug}.json`);
      if (fs.existsSync(out)) {
        console.log(`  ⏭ ${m.name} — déjà extrait, ignoré`);
        return false;
      }
      return true;
    });

    console.log(`\n📦 ${toProcess.length} mod(s) à traiter (${mods.length - toProcess.length} déjà faits)\n`);

    let ok = 0, fail = 0, skip = 0;
    for (const mod of toProcess) {
      console.log(`\n→ [${ok + fail + skip + 1}/${toProcess.length}] ${mod.name} (#${mod.id})`);
      try {
        const url    = await getDownloadUrl(mod.id, mod);
        const buffer = await downloadBuffer(url);
        const all    = extractRecipesFromBuffer(buffer);
        const supported = all.filter(r => SUPPORTED_TYPES.includes(r.type));
        console.log(`  ${supported.length} recettes extraites`);
        saveOutput(mod.slug, mod.id, mod.name, supported);
        ok++;
      } catch (e) {
        if (e.message.includes('désactivé le téléchargement')) {
          console.warn(`  ⚠ Download bloqué par l'auteur, ignoré`);
          skip++;
        } else {
          console.error(`  ✗ ${e.message}`);
          fail++;
        }
      }
      // Pause de 300ms pour ne pas spammer l'API
      await new Promise(r => setTimeout(r, 300));
    }

    console.log(`\n═══════════════════════════════════════`);
    console.log(`✓ ${ok} extrait(s)  ⚠ ${skip} bloqué(s)  ✗ ${fail} erreur(s)`);
    console.log(`  Résultats dans: recipes/`);
    return;
  }

  // ── Mode IDs manuels ────────────────────────────────────────
  let ok = 0, fail = 0;
  for (const arg of args) {
    const modId = parseInt(arg, 10);
    if (isNaN(modId)) { console.error(`⚠ "${arg}" ignoré`); continue; }
    try {
      await processMod(modId);
      ok++;
    } catch (e) {
      console.error(`  ✗ ${e.message}`);
      fail++;
    }
  }

  console.log(`\n═══════════════════════════════`);
  console.log(`✓ ${ok} mod(s) traité(s), ${fail} erreur(s)`);
  console.log(`  Recettes dans: recipes/`);
}

main().catch(e => { console.error(e); process.exit(1); });

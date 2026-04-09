// ============================================================
// /api/recipes  — Extrait les recettes d'un mod CurseForge
// GET ?modId=<id>
// ============================================================

const AdmZip = require('adm-zip');

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

const MAX_SIZE = 45 * 1024 * 1024; // 45 MB max

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.CURSEFORGE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Clé API non configurée" });

  const { modId } = req.query;
  if (!modId || isNaN(Number(modId))) {
    return res.status(400).json({ error: "Paramètre modId manquant ou invalide" });
  }

  // 1. Infos du mod
  let mod;
  try {
    const r = await fetch(`https://api.curseforge.com/v1/mods/${modId}`, {
      headers: { 'x-api-key': apiKey, 'Accept': 'application/json' },
    });
    if (!r.ok) throw new Error(`CurseForge ${r.status}`);
    ({ data: mod } = await r.json());
  } catch (e) {
    return res.status(502).json({ error: `Impossible de récupérer le mod: ${e.message}` });
  }

  // 2. URL de téléchargement du dernier fichier
  const files = (mod.latestFiles || [])
    .slice()
    .sort((a, b) => new Date(b.fileDate) - new Date(a.fileDate));

  if (files.length === 0) {
    return res.status(404).json({ error: "Aucun fichier disponible pour ce mod", modName: mod.name });
  }

  const file = files[0];
  let url = file.downloadUrl;

  if (!url) {
    try {
      const r = await fetch(
        `https://api.curseforge.com/v1/mods/${modId}/files/${file.id}/download-url`,
        { headers: { 'x-api-key': apiKey, 'Accept': 'application/json' } }
      );
      const d = await r.json();
      url = d.data;
    } catch (_) {}
  }

  if (!url) {
    return res.status(404).json({
      error: "L'auteur a désactivé le téléchargement tiers pour ce mod.",
      modName: mod.name,
    });
  }

  // 3. Vérification taille (HEAD)
  try {
    const head = await fetch(url, { method: 'HEAD' });
    const len  = parseInt(head.headers.get('content-length') || '0', 10);
    if (len > MAX_SIZE) {
      return res.status(413).json({
        error: `Ce mod est trop volumineux pour l'extraction en ligne (${Math.round(len / 1024 / 1024)} MB).`,
        modName: mod.name,
      });
    }
  } catch (_) { /* non-bloquant */ }

  // 4. Téléchargement du JAR
  let buffer;
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'CraftGenius/1.0' },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    buffer = Buffer.from(await r.arrayBuffer());
  } catch (e) {
    return res.status(502).json({ error: `Échec du téléchargement: ${e.message}`, modName: mod.name });
  }

  // 5. Extraction des recettes depuis le JAR (ZIP)
  const recipes = [];
  try {
    const zip = new AdmZip(buffer);
    for (const entry of zip.getEntries()) {
      if (!/^data\/[^/]+\/recipes\/.+\.json$/.test(entry.entryName)) continue;
      try {
        const json = JSON.parse(entry.getData().toString('utf8'));
        if (!json?.type || !SUPPORTED_TYPES.includes(json.type)) continue;
        const id = entry.entryName.replace(/\.json$/, '');
        recipes.push({ id, ...json });
      } catch (_) {}
    }
  } catch (e) {
    return res.status(500).json({ error: `Erreur d'extraction: ${e.message}`, modName: mod.name });
  }

  return res.status(200).json({
    modName: mod.name,
    slug:    mod.slug,
    count:   recipes.length,
    recipes,
  });
};

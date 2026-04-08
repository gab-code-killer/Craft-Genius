// ============================================================
// Proxy Mojang versions manifest — /api/versions
// Retourne uniquement les versions "release" triées décroissantes
// ============================================================

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=3600"); // cache 1h sur Vercel

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const response = await fetch(
      "https://launchermeta.mojang.com/mc/game/version_manifest.json"
    );
    if (!response.ok) throw new Error("Mojang API error: " + response.status);

    const data = await response.json();

    // Garder uniquement les versions "release" (pas les snapshots/pre/rc)
    const releases = data.versions
      .filter(v => v.type === "release")
      .map(v => v.id);

    return res.status(200).json({ versions: releases });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

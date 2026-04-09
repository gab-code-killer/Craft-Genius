// ============================================================
// Proxy CurseForge API — /api/mods
// Paramètres GET :
//   page         (défaut: 0)
//   pageSize     (défaut: 50)
//   searchFilter (texte libre)
//   categoryId   (id catégorie CurseForge)
//   gameVersion  (ex: "1.20.1")
//   sortField    (2=Popularity, 3=LastUpdated, 6=TotalDownloads, 1=Featured)
//   sortOrder    ("desc" ou "asc")
// ============================================================

const MINECRAFT_GAME_ID = 432;
const CLASS_ID_MODS     = 6;      // "Mods" sur CurseForge

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.CURSEFORGE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Clé API CurseForge non configurée." });

  const {
    page        = 0,
    pageSize    = 50,
    searchFilter = "",
    categoryId  = "",
    gameVersion = "",
    modLoader   = "",
    sortField   = 2,   // Popularity par défaut
    sortOrder   = "desc",
  } = req.query;

  // CurseForge modLoaderType: 0=Any, 1=Forge, 2=Cauldron, 3=LiteLoader, 4=Fabric, 5=Quilt, 6=NeoForge
  const loaderMap = { forge: 1, fabric: 4, quilt: 5, neoforge: 6 };

  const params = new URLSearchParams({
    gameId:    MINECRAFT_GAME_ID,
    classId:   CLASS_ID_MODS,
    index:     Number(page) * Number(pageSize),
    pageSize:  Math.min(Number(pageSize), 50),
    sortField,
    sortOrder,
  });

  if (searchFilter) params.set("searchFilter", searchFilter);
  if (categoryId)   params.set("categoryId", categoryId);
  if (gameVersion)  params.set("gameVersion", gameVersion);
  if (modLoader && loaderMap[modLoader]) params.set("modLoaderType", loaderMap[modLoader]);

  try {
    const response = await fetch(
      `https://api.curseforge.com/v1/mods/search?${params.toString()}`,
      {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: `CurseForge API error: ${err}` });
    }

    const data = await response.json();

    // On renvoie uniquement les champs nécessaires pour alléger la réponse
    const mods = (data.data || []).map(mod => ({
      id:           mod.id,
      name:         mod.name,
      slug:         mod.slug,
      summary:      mod.summary,
      downloadCount: mod.downloadCount,
      thumbsUpCount: mod.thumbsUpCount,
      logo:         mod.logo?.thumbnailUrl || null,
      categories:   mod.categories?.map(c => ({ id: c.id, name: c.name })) || [],
      authors:      mod.authors?.map(a => a.name) || [],
      latestFiles:  mod.latestFilesIndexes?.slice(0, 3).map(f => ({
        gameVersion: f.gameVersion,
        releaseType: f.releaseType, // 1=Release, 2=Beta, 3=Alpha
      })) || [],
      dateModified: mod.dateModified,
      links:        { websiteUrl: mod.links?.websiteUrl || null },
    }));

    return res.status(200).json({
      mods,
      pagination: {
        index:       data.pagination?.index || 0,
        pageSize:    data.pagination?.pageSize || 50,
        resultCount: data.pagination?.resultCount || mods.length,
        totalCount:  data.pagination?.totalCount || mods.length,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

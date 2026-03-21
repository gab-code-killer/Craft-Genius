/**
 * Extraction des textures Minecraft nécessaires pour la grille de craft.
 * Usage: node extract-textures.js
 * Génère: dossier textures/ avec des fichiers PNG individuels
 * (NE génère PAS de gros fichier JS pour éviter de geler VS Code)
 */

const fs = require('fs');
const path = require('path');
const VERSION = '1.21';

// Correspondance: notre clé interne → ID Minecraft
const TEXTURE_MAP = {
  // Matériaux de craft (grille)
  'diamond':        'minecraft:diamond',
  'iron_ingot':     'minecraft:iron_ingot',
  'gold_ingot':     'minecraft:gold_ingot',
  'stick':          'minecraft:stick',
  'plank':          'minecraft:oak_planks',
  'cobblestone':    'minecraft:cobblestone',
  'obsidian':       'minecraft:obsidian',
  'book':           'minecraft:book',
  'string':         'minecraft:string',
  'charcoal':       'minecraft:charcoal',
  'redstone':       'minecraft:redstone',
  'sand':           'minecraft:sand',
  'gunpowder':      'minecraft:gunpowder',
  'flint':          'minecraft:flint',
  'feather':        'minecraft:feather',
  'wool':           'minecraft:white_wool',
  'iron_block':     'minecraft:iron_block',
  'lapis':          'minecraft:lapis_lazuli',
  'rs_torch':       'minecraft:redstone_torch',
  'stone':          'minecraft:stone',
  'torch':          'minecraft:torch',
  'paper':          'minecraft:paper',
  'leather':        'minecraft:leather',
  'sugarcane':      'minecraft:sugar_cane',
  'wheat':          'minecraft:wheat',
  'iron_nugget':    'minecraft:iron_nugget',
  'glowstone_dust': 'minecraft:glowstone_dust',
  'emerald':        'minecraft:emerald',
  'nether_quartz':  'minecraft:quartz',
  'gold_nugget':    'minecraft:gold_nugget',

  // Items résultats
  'diamond_sword':       'minecraft:diamond_sword',
  'iron_sword':          'minecraft:iron_sword',
  'stone_sword':         'minecraft:stone_sword',
  'wooden_sword':        'minecraft:wooden_sword',
  'golden_sword':        'minecraft:golden_sword',
  'diamond_pickaxe':     'minecraft:diamond_pickaxe',
  'iron_pickaxe':        'minecraft:iron_pickaxe',
  'stone_pickaxe':       'minecraft:stone_pickaxe',
  'wooden_pickaxe':      'minecraft:wooden_pickaxe',
  'diamond_axe':         'minecraft:diamond_axe',
  'iron_axe':            'minecraft:iron_axe',
  'stone_axe':           'minecraft:stone_axe',
  'wooden_axe':          'minecraft:wooden_axe',
  'diamond_shovel':      'minecraft:diamond_shovel',
  'iron_shovel':         'minecraft:iron_shovel',
  'stone_shovel':        'minecraft:stone_shovel',
  'wooden_shovel':       'minecraft:wooden_shovel',
  'diamond_helmet':      'minecraft:diamond_helmet',
  'iron_helmet':         'minecraft:iron_helmet',
  'diamond_chestplate':  'minecraft:diamond_chestplate',
  'iron_chestplate':     'minecraft:iron_chestplate',
  'diamond_leggings':    'minecraft:diamond_leggings',
  'iron_leggings':       'minecraft:iron_leggings',
  'diamond_boots':       'minecraft:diamond_boots',
  'iron_boots':          'minecraft:iron_boots',
  'crafting_table':      'minecraft:crafting_table',
  'furnace':             'minecraft:furnace',
  'chest':               'minecraft:chest',
  'white_bed':           'minecraft:white_bed',
  'oak_door':            'minecraft:oak_door',
  'iron_door':           'minecraft:iron_door',
  'ladder':              'minecraft:ladder',
  'bookshelf':           'minecraft:bookshelf',
  'enchanting_table':    'minecraft:enchanting_table',
  'anvil':               'minecraft:anvil',
  'shield':              'minecraft:shield',
  'bow':                 'minecraft:bow',
  'arrow':               'minecraft:arrow',
  'tnt':                 'minecraft:tnt',
  'repeater':            'minecraft:repeater',
  'comparator':          'minecraft:comparator',
  'piston':              'minecraft:piston',
  'rail':                'minecraft:rail',
  'powered_rail':        'minecraft:powered_rail',
  'minecart':            'minecraft:minecart',
  'oak_boat':            'minecraft:oak_boat',
  'bucket':              'minecraft:bucket',
  'clock':               'minecraft:clock',
  'compass':             'minecraft:compass',
  'bread':               'minecraft:bread',
  'cake':                'minecraft:cake',
  'glowstone':           'minecraft:glowstone',
  'lantern':             'minecraft:lantern',
  'gold_block':          'minecraft:gold_block',
  'diamond_block':       'minecraft:diamond_block',
  'emerald_block':       'minecraft:emerald_block',
  'coal_block':          'minecraft:coal_block',
  'redstone_block':      'minecraft:redstone_block',
  'lapis_block':         'minecraft:lapis_block',
  'shears':              'minecraft:shears',
  'fishing_rod':         'minecraft:fishing_rod',
};

console.log(`Chargement des textures Minecraft ${VERSION}...`);

let allItems;
try {
  const data = require(`minecraft-textures/dist/textures/json/${VERSION}.json`);
  allItems = data.items;
  if (!allItems) throw new Error('Pas de champ "items" trouvé');
} catch (e) {
  console.error('Erreur:', e.message);
  process.exit(1);
}

// Construire un index id → texture
const idToTexture = {};
for (const item of Object.values(allItems)) {
  if (item.id && item.texture) {
    idToTexture[item.id] = item.texture;
  }
}

console.log(`Index construit: ${Object.keys(idToTexture).length} textures disponibles`);

// Créer le dossier textures/
const outDir = path.join(__dirname, 'textures');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

// Extraire chaque texture comme fichier PNG individuel
let found = 0;
let missing = [];

for (const [ourKey, mcId] of Object.entries(TEXTURE_MAP)) {
  const tex = idToTexture[mcId];
  if (tex) {
    // Convertir data:image/png;base64,XXXX en fichier PNG
    const base64 = tex.replace(/^data:image\/png;base64,/, '');
    const buf = Buffer.from(base64, 'base64');
    fs.writeFileSync(path.join(outDir, ourKey + '.png'), buf);
    found++;
  } else {
    missing.push(`${ourKey} (${mcId})`);
  }
}

console.log(`\n✅ ${found}/${Object.keys(TEXTURE_MAP).length} PNG écrits dans textures/`);
if (missing.length > 0) {
  console.log(`⚠️  Manquants: ${missing.join(', ')}`);
}
console.log('\n✅ Terminé ! Les fichiers PNG sont dans le dossier textures/');


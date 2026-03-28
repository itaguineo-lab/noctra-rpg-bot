const players = {};

// Atributos base de cada classe no nível 1
const baseStats = {
    warrior: { hp: 120, atk: 18, def: 20, crit: 2, agi: 10 },
    archer:  { hp: 100, atk: 22, def: 15, crit: 7, agi: 15 },
    mage:    { hp: 90,  atk: 20, def: 12, crit: 5, agi: 12 }
};

function getPlayer(id, className = 'archer') {
    if (!players[id]) {
        players[id] = {
            // Identificação
            id: id,
            name: null,          // será definido depois
            class: className,
            vip: false,
            vipExpires: null,

            // Progressão
            level: 1,
            xp: 0,
            gold: 0,
            runas: 0,
            glorias: 0,

            // Energia
            energy: 20,
            maxEnergy: 20,
            lastEnergy: Date.now(),

            // Atributos (base + equipamentos + almas)
            hp: baseStats[className].hp,
            maxHp: baseStats[className].hp,
            atk: baseStats[className].atk,
            def: baseStats[className].def,
            crit: baseStats[className].crit,
            agi: baseStats[className].agi,

            // Equipamentos (slots)
            equipment: {
                weapon: null,
                armor: null,
                helmet: null,
                boots: null,
                ring: null,
                necklace: null,
                bag: null
            },

            // Almas (2 slots)
            souls: [null, null],

            // Inventário
            inventory: [],
            maxInventory: 20,

            // Mapa atual
            currentMap: "Clareira Sombria"
        };
    }
    return players[id];
}

function savePlayer(id, data) {
    players[id] = data;
}

// Recalcula todos os atributos baseados em classe, nível e equipamentos
function recalculateStats(player) {
    const base = baseStats[player.class];
    // Crescimento por nível
    let totalHp = base.hp + (player.level - 1) * 8;
    let totalAtk = base.atk + (player.level - 1) * 2;
    let totalDef = base.def + (player.level - 1);
    let totalCrit = base.crit + (player.level - 1) * 0.5;
    let totalAgi = base.agi + (player.level - 1) * 0.5;

    // Soma bônus dos equipamentos
    for (const slot in player.equipment) {
        const item = player.equipment[slot];
        if (item) {
            totalAtk += item.atk || 0;
            totalDef += item.def || 0;
            totalCrit += item.crit || 0;
            totalHp += item.hp || 0;
            // Mochila aumenta capacidade, não combate
            if (slot === 'bag') {
                player.maxInventory = 20 + (item.extraSlots || 0);
            }
        }
    }

    // Aplica
    player.atk = Math.floor(totalAtk);
    player.def = Math.floor(totalDef);
    player.crit = Math.min(100, totalCrit); // cap 100%
    player.agi = Math.floor(totalAgi);
    player.maxHp = Math.floor(totalHp);
    if (player.hp > player.maxHp) player.hp = player.maxHp;
}

module.exports = { getPlayer, savePlayer, recalculateStats };

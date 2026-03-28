const players = {};

// Atributos iniciais por classe (para futura implementação)
const baseStats = {
    warrior: { hp: 120, atk: 18, def: 20, crit: 2, agi: 10 },
    archer: { hp: 100, atk: 22, def: 15, crit: 7, agi: 15 },
    mage:   { hp: 90,  atk: 20, def: 12, crit: 5, agi: 12 }
};

function getPlayer(id, className = 'archer') {
    if (!players[id]) {
        const stats = baseStats[className];
        players[id] = {
            // Dados básicos
            name: null,          // será definido depois
            class: className,
            level: 1,
            xp: 0,
            gold: 0,
            energy: 20,
            maxEnergy: 20,
            lastEnergy: Date.now(),
            vip: false,          // será ativado depois

            // Atributos de combate (base)
            hp: stats.hp,
            maxHp: stats.hp,
            atk: stats.atk,
            def: stats.def,
            crit: stats.crit,
            agi: stats.agi,

            // Equipamentos (slots)
            weapon: null,
            armor: null,
            helmet: null,
            boots: null,
            ring: null,
            necklace: null,
            bag: null,

            // Almas (2 slots)
            souls: [null, null],

            // Inventário
            inventory: [],
            maxInventory: 20
        };
    }
    return players[id];
}

function savePlayer(id, data) {
    players[id] = data;
}

module.exports = { getPlayer, savePlayer };
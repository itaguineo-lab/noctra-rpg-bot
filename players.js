const players = {};

// Atributos base de cada classe no nível 1 (sem AGI)
const baseStats = {
    warrior: { hp: 120, atk: 18, def: 20, crit: 2 },
    archer:  { hp: 100, atk: 22, def: 15, crit: 7 },
    mage:    { hp: 90,  atk: 20, def: 12, crit: 5 }
};

function getPlayer(id, className = 'archer') {
    if (!players[id]) {
        players[id] = {
            id: id,
            name: null,
            class: className,
            vip: false,
            vipExpires: null,
            level: 1,
            xp: 0,
            gold: 0,
            runas: 0,
            glorias: 0,
            energy: 20,
            maxEnergy: 20,
            lastEnergy: Date.now(),
            hp: baseStats[className].hp,
            maxHp: baseStats[className].hp,
            atk: baseStats[className].atk,
            def: baseStats[className].def,
            crit: baseStats[className].crit,
            equipment: {
                weapon: null,
                armor: null,
                helmet: null,
                boots: null,
                ring: null,
                necklace: null,
                bag: null
            },
            souls: [null, null],
            inventory: [],
            maxInventory: 20,
            currentMap: "Clareira Sombria"
        };
    }
    return players[id];
}

function savePlayer(id, data) {
    players[id] = data;
}

function recalculateStats(player) {
    const base = baseStats[player.class];
    let totalHp = base.hp + (player.level - 1) * 8;
    let totalAtk = base.atk + (player.level - 1) * 2;
    let totalDef = base.def + (player.level - 1);
    let totalCrit = base.crit + (player.level - 1) * 0.5;

    for (const slot in player.equipment) {
        const item = player.equipment[slot];
        if (item) {
            totalAtk += item.atk || 0;
            totalDef += item.def || 0;
            totalCrit += item.crit || 0;
            totalHp += item.hp || 0;
            if (slot === 'bag' && item.extraSlots) {
                player.maxInventory = 20 + item.extraSlots;
            }
        }
    }

    player.atk = Math.floor(totalAtk);
    player.def = Math.floor(totalDef);
    player.crit = Math.min(100, Math.floor(totalCrit * 10) / 10);
    player.maxHp = Math.floor(totalHp);
    if (player.hp > player.maxHp) player.hp = player.maxHp;
}

module.exports = { getPlayer, savePlayer, recalculateStats };
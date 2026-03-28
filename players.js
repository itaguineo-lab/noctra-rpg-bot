const players = {};

// Atributos base de cada classe no nível 1
const baseStats = {
    warrior: { hp: 120, atk: 18, def: 20, crit: 2 },
    archer:  { hp: 100, atk: 22, def: 15, crit: 7 },
    mage:    { hp: 90,  atk: 20, def: 12, crit: 5 }
};

function getPlayer(id, className = 'archer') {
    if (!players[id]) {
        players[id] = {
            // Identificação
            id: id,
            name: null,
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
            
            // Atributos
            hp: baseStats[className].hp,
            maxHp: baseStats[className].hp,
            atk: baseStats[className].atk,
            def: baseStats[className].def,
            crit: baseStats[className].crit,
            
            // Equipamentos
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
            soulsCooldown: {},
            
            // Inventário
            inventory: [],
            maxInventory: 20,
            
            // Skins
            skin: null,
            skins: [],
            
            // Consumíveis
            consumables: {
                potionHp: 0,
                potionEnergy: 0,
                tonicStrength: 0,
                tonicDefense: 0,
                tonicPrecision: 0
            },
            
            // Chaves de Masmorra
            keys: 0,
            keyLastDaily: null,
            
            // Renomear/Mudar Classe (1ª vez grátis)
            renamed: false,
            classChanged: false,
            
            // Mapa atual
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

    // Bônus de equipamentos
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

    // Bônus de skins (cosméticos podem dar bônus pequenos)
    if (player.skin && player.skin.bonus) {
        totalAtk += player.skin.bonus.atk || 0;
        totalDef += player.skin.bonus.def || 0;
        totalCrit += player.skin.bonus.crit || 0;
    }

    player.atk = Math.floor(totalAtk);
    player.def = Math.floor(totalDef);
    player.crit = Math.min(100, Math.floor(totalCrit * 10) / 10);
    player.maxHp = Math.floor(totalHp);
    if (player.hp > player.maxHp) player.hp = player.maxHp;
}

function giveDailyKeys(player) {
    const today = new Date().toDateString();
    if (player.keyLastDaily !== today) {
        player.keys += 3;
        player.keyLastDaily = today;
        return true;
    }
    return false;
}

module.exports = { getPlayer, savePlayer, recalculateStats, giveDailyKeys };
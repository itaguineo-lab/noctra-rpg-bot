const raridades = [
    { name: "Comum", emoji: "⚪", chance: 50, mult: 1.0, price: 10 },
    { name: "Incomum", emoji: "🟢", chance: 30, mult: 1.2, price: 20 },
    { name: "Raro", emoji: "🔵", chance: 15, mult: 1.5, price: 40 },
    { name: "Épico", emoji: "🟣", chance: 5, mult: 2.0, price: 80 }
];

const itemTypes = [
    { slot: "weapon", baseAtk: 5, baseDef: 0, baseCrit: 0, baseHp: 0 },
    { slot: "armor", baseAtk: 0, baseDef: 5, baseCrit: 0, baseHp: 0 },
    { slot: "helmet", baseAtk: 0, baseDef: 3, baseCrit: 0, baseHp: 5 },
    { slot: "boots", baseAtk: 0, baseDef: 2, baseCrit: 0, baseHp: 3 },
    { slot: "ring", baseAtk: 2, baseDef: 0, baseCrit: 2, baseHp: 0 },
    { slot: "necklace", baseAtk: 1, baseDef: 1, baseCrit: 1, baseHp: 2 }
];

function getRarity() {
    const roll = Math.random() * 100;
    let total = 0;
    for (const r of raridades) {
        total += r.chance;
        if (roll <= total) return r;
    }
    return raridades[0];
}

function generateItem(playerLevel, forcedType = null) {
    const type = forcedType || itemTypes[Math.floor(Math.random() * itemTypes.length)];
    const rarity = getRarity();
    
    // Bônus baseado no nível e raridade
    const levelBonus = Math.floor(playerLevel * 0.5);
    const atk = Math.floor((type.baseAtk + levelBonus) * rarity.mult);
    const def = Math.floor((type.baseDef + levelBonus) * rarity.mult);
    const crit = Math.floor((type.baseCrit + levelBonus/2) * rarity.mult);
    const hp = Math.floor((type.baseHp + levelBonus) * rarity.mult);

    return {
        id: Date.now() + Math.random(), // id único
        name: `${rarity.name} ${type.slot.charAt(0).toUpperCase() + type.slot.slice(1)}`,
        slot: type.slot,
        rarity: rarity.name,
        emoji: rarity.emoji,
        atk: atk,
        def: def,
        crit: crit,
        hp: hp,
        price: Math.floor(rarity.price * (playerLevel / 5 + 1))
    };
}

module.exports = { generateItem, raridades, itemTypes };
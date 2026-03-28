const raridades = [
    { name: "Comum", emoji: "⚪", chance: 45, mult: 1.0, price: 10 },
    { name: "Incomum", emoji: "🟢", chance: 30, mult: 1.2, price: 20 },
    { name: "Raro", emoji: "🔵", chance: 15, mult: 1.5, price: 40 },
    { name: "Épico", emoji: "🟣", chance: 7, mult: 2.0, price: 80 },
    { name: "Lendário", emoji: "🟡", chance: 2.5, mult: 2.5, price: 150 },
    { name: "Mítico", emoji: "🔴", chance: 0.5, mult: 3.0, price: 300 }
];

const itemTypes = [
    { slot: "weapon", namePrefix: "Espada", atkBase: 5, defBase: 0, critBase: 0, hpBase: 0 },
    { slot: "armor", namePrefix: "Armadura", atkBase: 0, defBase: 5, critBase: 0, hpBase: 0 },
    { slot: "helmet", namePrefix: "Elmo", atkBase: 0, defBase: 3, critBase: 0, hpBase: 5 },
    { slot: "boots", namePrefix: "Botas", atkBase: 0, defBase: 2, critBase: 0, hpBase: 3 },
    { slot: "ring", namePrefix: "Anel", atkBase: 2, defBase: 0, critBase: 2, hpBase: 0 },
    { slot: "necklace", namePrefix: "Colar", atkBase: 1, defBase: 1, critBase: 1, hpBase: 2 },
    { slot: "bag", namePrefix: "Mochila", atkBase: 0, defBase: 0, critBase: 0, hpBase: 0, extraSlots: 5 }
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

    const levelBonus = Math.floor(playerLevel * 0.5);
    const atk = Math.floor((type.atkBase + levelBonus) * rarity.mult);
    const def = Math.floor((type.defBase + levelBonus) * rarity.mult);
    const crit = Math.floor((type.critBase + levelBonus/2) * rarity.mult);
    const hp = Math.floor((type.hpBase + levelBonus) * rarity.mult);
    const extraSlots = type.extraSlots ? Math.floor(type.extraSlots * rarity.mult) : 0;

    const name = `${rarity.name} ${type.namePrefix}`;

    return {
        id: Date.now() + Math.random() + Math.floor(Math.random() * 1000),
        name: name,
        slot: type.slot,
        rarity: rarity.name,
        emoji: rarity.emoji,
        atk: atk,
        def: def,
        crit: crit,
        hp: hp,
        extraSlots: extraSlots,
        price: Math.floor(rarity.price * (playerLevel / 5 + 1))
    };
}

module.exports = { generateItem, raridades, itemTypes };
const raridades = [
    { name: "Comum", emoji: "⚪", chance: 50, mult: 1, price: 10 },
    { name: "Incomum", emoji: "🟢", chance: 30, mult: 1.2, price: 20 },
    { name: "Raro", emoji: "🔵", chance: 15, mult: 1.5, price: 40 },
    { name: "Épico", emoji: "🟣", chance: 5, mult: 2, price: 80 }
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

function generateItem(playerLevel) {
    const rarity = getRarity();
    const baseAtk = Math.floor(playerLevel * 2);
    const variation = Math.floor(baseAtk * 0.5 * (Math.random() * 0.8 + 0.6));
    const atk = baseAtk + variation;
    return {
        name: `${rarity.name} Arma`,
        rarity: rarity.name,
        emoji: rarity.emoji,
        atk: atk,
        price: rarity.price
    };
}

module.exports = { generateItem };
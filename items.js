const raridades = [
  { name: "Comum", emoji: "⚪", chance: 50, mult: 1 },
  { name: "Incomum", emoji: "🟢", chance: 30, mult: 1.2 },
  { name: "Raro", emoji: "🔵", chance: 15, mult: 1.5 },
  { name: "Épico", emoji: "🟣", chance: 5, mult: 2 }
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
  const atk = Math.floor(baseAtk * rarity.mult);

  return {
    name: "Arma Sombria",
    atk,
    rarity: rarity.name,
    emoji: rarity.emoji
  };
}

module.exports = { generateItem };
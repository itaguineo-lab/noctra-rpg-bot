const maps = [
  {
    name: "🌿 Clareira",
    level: 1,
    enemies: [
      { name: "Rato", hp: 50, atk: 8 }
    ]
  },
  {
    name: "🌑 Pântano",
    level: 5,
    enemies: [
      { name: "Ghoul", hp: 120, atk: 15 }
    ]
  }
];

function getMap(player) {
  return maps.find(m => player.level >= m.level) || maps[0];
}

module.exports = { getMap };
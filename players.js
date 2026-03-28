const players = {};

function getPlayer(id) {
  if (!players[id]) {
    players[id] = {
      hp: 100,
      maxHp: 100,
      atk: 10,
      def: 5,
      gold: 0,
      xp: 0,
      level: 1,
      energy: 20,
      lastEnergy: Date.now(),

      inventory: [],
      weapon: null,
      maxInventory: 10
    };
  }
  return players[id];
}

module.exports = { getPlayer };
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
      lastEnergy: Date.now()
    };
  }
  return players[id];
}

module.exports = { getPlayer };

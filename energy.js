function updateEnergy(player) {
  const now = Date.now();
  const diff = Math.floor((now - player.lastEnergy) / 60000);

  if (diff > 0) {
    player.energy = Math.min(player.energy + diff, 20);
    player.lastEnergy = now;
  }
}

function useEnergy(player) {
  if (player.energy <= 0) return false;
  player.energy -= 1;
  return true;
}

module.exports = { updateEnergy, useEnergy };

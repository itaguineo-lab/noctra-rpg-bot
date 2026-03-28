function updateEnergy(player) {
    const now = Date.now();
    const interval = player.vip ? 3 * 60 * 1000 : 6 * 60 * 1000; // 3 ou 6 minutos
    const diff = Math.floor((now - player.lastEnergy) / interval);
    if (diff > 0) {
        player.energy = Math.min(player.energy + diff, player.maxEnergy);
        player.lastEnergy = now;
    }
}

function useEnergy(player, amount = 1) {
    if (player.energy < amount) return false;
    player.energy -= amount;
    return true;
}

module.exports = { updateEnergy, useEnergy };
function checkLevelUp(player) {
  const neededXp = player.level * 50;

  if (player.xp >= neededXp) {
    player.xp -= neededXp;
    player.level += 1;

    player.maxHp += 10;
    player.atk += 2;
    player.def += 1;

    return true;
  }

  return false;
}

module.exports = { checkLevelUp };
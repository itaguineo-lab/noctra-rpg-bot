function xpToNext(level) {
  return level * 50; // curva simples (depois ajustamos)
}

function checkLevelUp(player) {
  let up = false;

  while (player.xp >= xpToNext(player.level)) {
    player.xp -= xpToNext(player.level);
    player.level += 1;

    player.maxHp += 10;
    player.atk += 2;
    player.def += 1;

    up = true;
  }

  return up;
}

module.exports = { checkLevelUp, xpToNext };
function randomEnemy() {
  const enemies = [
    { name: "Lobo Sombrio", hp: 80, atk: 12 },
    { name: "Rato Gigante", hp: 60, atk: 10 }
  ];
  return enemies[Math.floor(Math.random() * enemies.length)];
}

function fight(player) {
  const enemy = randomEnemy();

  let playerHp = player.hp;
  let enemyHp = enemy.hp;

  while (playerHp > 0 && enemyHp > 0) {
    enemyHp -= player.atk;
    playerHp -= enemy.atk;
  }

  const win = playerHp > 0;

  if (win) {
    const gold = Math.floor(Math.random() * 10) + 5;
    const xp = Math.floor(Math.random() * 5) + 3;

    player.gold += gold;
    player.xp += xp;

    return {
      result: "win",
      enemy: enemy.name,
      gold,
      xp
    };
  } else {
    return {
      result: "lose",
      enemy: enemy.name
    };
  }
}

module.exports = { fight };

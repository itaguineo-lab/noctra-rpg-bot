function randomEnemy(playerLevel) {
    const enemies = [
        { name: "Lobo Sombrio", hp: 80, atk: 12, def: 5, exp: 20, gold: 15 },
        { name: "Rato Gigante", hp: 60, atk: 10, def: 3, exp: 15, gold: 10 }
    ];
    // aqui poderia filtrar por nível do mapa
    return enemies[Math.floor(Math.random() * enemies.length)];
}

function calculateDamage(atk, def) {
    const damage = Math.max(1, atk * (1 - def / (def + 100)));
    return Math.floor(damage);
}

function fightTurn(player, enemy) {
    // Jogador ataca
    const playerDamage = calculateDamage(player.atk + (player.weapon?.atk || 0), enemy.def);
    enemy.hp -= playerDamage;

    if (enemy.hp <= 0) return { win: true, message: `Você causou ${playerDamage} de dano e derrotou ${enemy.name}!` };

    // Inimigo ataca
    const enemyDamage = calculateDamage(enemy.atk, player.def);
    player.hp -= enemyDamage;

    if (player.hp <= 0) return { win: false, message: `${enemy.name} causou ${enemyDamage} de dano e te derrotou.` };

    return { win: null, message: `Você causou ${playerDamage} de dano. ${enemy.name} causou ${enemyDamage}.` };
}

module.exports = { randomEnemy, calculateDamage, fightTurn };
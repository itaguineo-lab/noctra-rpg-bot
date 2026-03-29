
/**
 * Calcula o XP necessário para o próximo nível (Curva Exponencial)
 */
function getXpToNextLevel(level) {
    return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Verifica se o jogador subiu de nível e aplica melhorias
 */
function checkLevelUp(player) {
    let leveledUp = false;
    let xpNeeded = getXpToNextLevel(player.level);

    while (player.xp >= xpNeeded) {
        player.xp -= xpNeeded;
        player.level++;
        leveledUp = true;
        xpNeeded = getXpToNextLevel(player.level);
    }

    if (leveledUp) {
        // Ao subir de nível, recupera HP e energia
        player.hp = player.maxHp;
        player.energy = player.maxEnergy;
    }

    return leveledUp;
}

module.exports = { getXpToNextLevel, checkLevelUp };

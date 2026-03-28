function xpToNext(level) {
    // Fórmula: level * 100 + (level-1)^2 * 20
    return Math.floor(level * 100 + Math.pow(level - 1, 2) * 20);
}

function checkLevelUp(player) {
    let up = false;
    while (player.xp >= xpToNext(player.level)) {
        player.xp -= xpToNext(player.level);
        player.level++;
        // Aumenta atributos (a recalculateStats fará o resto)
        player.maxHp += 8;
        player.hp += 8;
        player.atk += 2;
        player.def += 1;
        player.crit += 0.5;
        player.agi += 0.5;
        // Arredondar
        player.crit = Math.round(player.crit * 10) / 10;
        player.agi = Math.round(player.agi * 10) / 10;
        up = true;
    }
    return up;
}

module.exports = { xpToNext, checkLevelUp };
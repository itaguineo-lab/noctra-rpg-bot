function xpToNext(level) {
    return level * 50; // temporário, depois balancear
}

function checkLevelUp(player) {
    let up = false;
    while (player.xp >= xpToNext(player.level)) {
        player.xp -= xpToNext(player.level);
        player.level++;
        player.maxHp += 10;
        player.hp += 10;      // também recupera HP
        player.atk += 2;
        player.def += 1;
        up = true;
    }
    return up;
}

module.exports = { checkLevelUp, xpToNext };
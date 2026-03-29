const { getPlayer, recalculateStats } = require('../core/player/playerService');
const { updateEnergy } = require('../services/energyService');
const { xpToNext } = require('../core/player/progression');
const { progressBar, formatNumber } = require('./formatters');

/**
 * Obtém o player já com energia atualizada e status  recalculados
 */
function getPlayerSafe(id) {
    const player = getPlayer(id);
    updateEnergy(player);
    recalculateStats(player);
    return player;
}

/**
 * Verifica eventos globais ativos (Sazonal)
 */
function getActiveEvents() {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const events = [];

    if (month === 9) events.push('🎃 Halloween');
    if (month === 11) events.push('🎄 Natal');
    
    return events.length > 0 ? events.join(' | ') : 'Nenhum';
}

/**
 * Gera o bloco de texto padrão do Menu Principal (usado em vários comandos)
 */
function getMainMenuText(player, username) {
    const xpNeeded = xpToNext(player.level);
    const vipStatus = player.vip ? '✨ *VIP*' : '👤 Comum';
    
    let text = `🌙 *NOCTRA RPG*\n`;
    text += `━━━━━━━━━━━━━━\n`;
    text += `🤴 *${player.name || username}* | ${vipStatus}\n`;
    text += `🏹 Classe: ${player.class.charAt(0).toUpperCase() + player.class.slice(1)}\n`;
    text += `🆙 Nível: ${player.level}\n\n`;
    
    text += `❤️ HP: ${player.hp}/${player.maxHp}\n`;
    text += `[${progressBar(player.hp, player.maxHp, 8)}]\n\n`;
    
    text += `✨ XP: ${formatNumber(player.xp)} / ${formatNumber(xpNeeded)}\n`;
    text += `[${progressBar(player.xp, xpNeeded, 8)}]\n\n`;
    
    text += `⚡ Energia: ${player.energy}/${player.maxEnergy}\n`;
    text += `💰 Ouro: ${formatNumber(player.gold)} | 💎 Nox: ${player.nox}\n`;
    text += `━━━━━━━━━━━━━━\n`;
    text += `🌍 Local: *${player.currentMap}*`;

    return text;
}

module.exports = { 
    getPlayerSafe, 
    getActiveEvents, 
    getMainMenuText 
};

const { RARITY_COLORS } = require('./constants');
const { getMap } = require('../../data/maps');
const { xpToNext } = require('../../data/level');
const { progressBar, formatNumber } = require('../../utils');

function getRarityColor(rarity) {
    return RARITY_COLORS[rarity] || '⚪';
}

function formatItemName(item) {
    if (!item) return '❓ Item inválido';
    const colorEmoji = getRarityColor(item.rarity);
    return `${colorEmoji} *${item.name}*`;
}

function getActiveEvents() {
    const events = [];
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();
    
    if (month >= 2 && month <= 5) events.push('🍂 Outono');
    if ((month === 2 && day >= 20) || (month === 3 && day <= 10)) events.push('🐣 Páscoa');
    if (Math.random() < 0.125) events.push('🌕 Lua Cheia');
    
    return events;
}

function getRewardMultipliers(player) {
    let xpMult = 1.0;
    let goldMult = 1.0;
    const events = getActiveEvents();
    if (events.includes('🍂 Outono')) { goldMult += 0.2; xpMult += 0.1; }
    if (events.includes('🐣 Páscoa')) { xpMult += 0.2; goldMult += 0.1; }
    if (events.includes('🌕 Lua Cheia')) { xpMult += 0.3; goldMult += 0.3; }
    
    const vipActive = player.vip && player.vipExpires && new Date() < new Date(player.vipExpires);
    if (vipActive) {
        xpMult += 0.5;
        goldMult += 0.5;
    }
    
    return { xpMult: Math.min(3.0, xpMult), goldMult: Math.min(3.0, goldMult) };
}

function getMainMenuText(player, username = null) {
    const xpNeeded = xpToNext(player.level);
    const xpPercent = Math.floor((player.xp / xpNeeded) * 100);
    const xpBar = progressBar(player.xp, xpNeeded, 8);
    const hpBar = progressBar(player.hp, player.maxHp, 8);
    const energyBar = progressBar(player.energy, player.maxEnergy, 8);
    
    const events = getActiveEvents();
    const eventText = events.length > 0 ? events.join(' | ') : 'Nenhum';
    
    const vipActive = player.vip && player.vipExpires && new Date() < new Date(player.vipExpires);
    const vipText = vipActive ? `✨ VIP até ${new Date(player.vipExpires).toLocaleDateString()}\n` : '';
    
    const nameDisplay = player.name || username || 'Aventureiro';
    
    return (
        `🌙 *Noctra*\n\n` +
        `*${nameDisplay}* (${player.class.charAt(0).toUpperCase() + player.class.slice(1)})\n` +
        `Nv. ${player.level} | XP: ${formatNumber(player.xp)} (Faltam: ${formatNumber(xpNeeded - player.xp)})\n` +
        `[${xpBar}] ${xpPercent}%\n\n` +
        `❤️ HP: ${player.hp}/${player.maxHp}\n` +
        `[${hpBar}] ${Math.floor((player.hp/player.maxHp)*100)}%\n` +
        `⚡ Energia: ${player.energy}/${player.maxEnergy}\n` +
        `[${energyBar}] ${Math.floor((player.energy/player.maxEnergy)*100)}%\n\n` +
        `⚔️ ATK ${player.atk} | 🛡️ DEF ${player.def} | ✨ CRIT ${player.crit}%\n\n` +
        `🎉 EVENTOS: ${eventText}\n` +
        `${vipText}` +
        `🗝️ Chaves: ${player.keys}\n` +
        `💎 Nox: ${player.nox}\n` +
        `💰 Gold: ${formatNumber(player.gold)}\n` +
        `🗺️ Mapa: ${getMap(player).name} (Lv ${getMap(player).level})`
    );
}

module.exports = { 
    getRarityColor, 
    formatItemName, 
    getActiveEvents, 
    getRewardMultipliers, 
    getMainMenuText 
};
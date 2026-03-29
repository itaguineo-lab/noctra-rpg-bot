const { progressBar, formatNumber } = require('./formatters');
const { xpToNext } = require('./level');
const { getMap } = require('./maps');
const { getPlayer, updateEnergy, recalculateStats } = require('./players');

function getPlayerUpdated(id) { const p = getPlayer(id); updateEnergy(p); return p; }
function getPlayerSafe(id) { const p = getPlayer(id); updateEnergy(p); recalculateStats(p); return p; }

function getActiveEvents() {
    const events = [];
    const now = new Date(), month = now.getMonth(), day = now.getDate();
    if (month >= 2 && month <= 5) events.push('🍂 Outono');
    if ((month === 2 && day >= 20) || (month === 3 && day <= 10)) events.push('🐣 Páscoa');
    if (Math.random() < 0.125) events.push('🌕 Lua Cheia');
    return events;
}

function getRewardMultipliers(player) {
    let xpMult = 1, goldMult = 1;
    const events = getActiveEvents();
    if (events.includes('🍂 Outono')) { goldMult += 0.2; xpMult += 0.1; }
    if (events.includes('🐣 Páscoa')) { xpMult += 0.2; goldMult += 0.1; }
    if (events.includes('🌕 Lua Cheia')) { xpMult += 0.3; goldMult += 0.3; }
    const vipActive = player.vip && player.vipExpires && new Date() < new Date(player.vipExpires);
    if (vipActive) { xpMult += 0.5; goldMult += 0.5; }
    return { xpMult: Math.min(3, xpMult), goldMult: Math.min(3, goldMult) };
}

function getMainMenuText(player, username) {
    const xpNeeded = xpToNext(player.level);
    const xpBar = progressBar(player.xp, xpNeeded, 8);
    const hpBar = progressBar(player.hp, player.maxHp, 8);
    const energyBar = progressBar(player.energy, player.maxEnergy, 8);
    const events = getActiveEvents();
    const eventText = events.length ? events.join(' | ') : 'Nenhum';
    const vipActive = player.vip && player.vipExpires && new Date() < new Date(player.vipExpires);
    const vipText = vipActive ? `✨ VIP até ${new Date(player.vipExpires).toLocaleDateString()}\n` : '';
    const nameDisplay = player.name || username || 'Aventureiro';
    return (
        `🌙 *Noctra*\n\n*${nameDisplay}* (${player.class.charAt(0).toUpperCase() + player.class.slice(1)})\n` +
        `Nv. ${player.level} | XP: ${formatNumber(player.xp)} (Faltam: ${formatNumber(xpNeeded - player.xp)})\n[${xpBar}] ${Math.floor(player.xp/xpNeeded*100)}%\n\n` +
        `❤️ HP: ${player.hp}/${player.maxHp}\n[${hpBar}] ${Math.floor(player.hp/player.maxHp*100)}%\n` +
        `⚡ Energia: ${player.energy}/${player.maxEnergy}\n[${energyBar}] ${Math.floor(player.energy/player.maxEnergy*100)}%\n\n` +
        `⚔️ ATK ${player.atk} | 🛡️ DEF ${player.def} | ✨ CRIT ${player.crit}%\n\n` +
        `🎉 EVENTOS: ${eventText}\n${vipText}🗝️ Chaves: ${player.keys}\n💎 Nox: ${player.nox}\n💰 Gold: ${formatNumber(player.gold)}\n` +
        `🗺️ Mapa: ${getMap(player).name} (Lv ${getMap(player).level})`
    );
}

module.exports = { getPlayerUpdated, getPlayerSafe, getActiveEvents, getRewardMultipliers, getMainMenuText };
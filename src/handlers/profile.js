const { getPlayerSafe, formatItemName, getMainMenuText } = require('../utils/helpers');
const { getRarityEmoji } = require('../../data/souls');
const { progressBar, formatNumber } = require('../../utils');
const { xpToNext } = require('../../data/level');
const { getMap } = require('../../data/maps');
const { Markup } = require('telegraf');
const { SLOT_EMOJIS } = require('../utils/constants');

async function handleProfile(ctx) {
    try {
        const player = getPlayerSafe(ctx.from.id);
        const xpNeeded = xpToNext(player.level);
        const xpBar = progressBar(player.xp, xpNeeded, 8);
        const hpBar = progressBar(player.hp, player.maxHp, 8);
        const map = getMap(player);
        
        let equipText = '';
        if (player.equipment) {
            for (const [slot, item] of Object.entries(player.equipment)) {
                if (item) {
                    equipText += `   ${SLOT_EMOJIS[slot]} ${formatItemName(item)}\n`;
                    equipText += `      ⚔️ +${item.atk} | 🛡️ +${item.def} | ✨ +${item.crit} | ❤️ +${item.hp}\n`;
                } else {
                    equipText += `   ${SLOT_EMOJIS[slot]} Vazio\n`;
                }
            }
        }
        
        let soulsText = '';
        if (player.souls) {
            for (let i = 0; i < player.souls.length; i++) {
                const soul = player.souls[i];
                if (soul) {
                    soulsText += `   ${getRarityEmoji(soul.rarity)} ${soul.name} (${soul.rarity})\n`;
                    soulsText += `      ${soul.description}\n`;
                } else {
                    soulsText += `   ⬜ Slot ${i+1} vazio\n`;
                }
            }
        }
        
        const skinText = player.skin ? `🎨 Skin: ${player.skin.emoji} ${player.skin.name}\n` : '🎨 Skin: Nenhuma\n';
        
        const profileMsg =
            `👤 *${player.name || ctx.from.first_name}* (${player.class.charAt(0).toUpperCase() + player.class.slice(1)})\n` +
            `Nível ${player.level} | XP: ${formatNumber(player.xp)} / ${formatNumber(xpNeeded)}\n` +
            `[${xpBar}] ${Math.floor((player.xp/xpNeeded)*100)}%\n\n` +
            `❤️ HP: ${player.hp}/${player.maxHp}\n` +
            `[${hpBar}] ${Math.floor((player.hp/player.maxHp)*100)}%\n\n` +
            `⚔️ ATK: ${player.atk} | 🛡️ DEF: ${player.def}\n` +
            `✨ CRIT: ${player.crit}%\n\n` +
            `💰 Gold: ${formatNumber(player.gold)} | 💎 Nox: ${player.nox} | 🏅 Glórias: ${player.glorias || 0}\n` +
            `⚡ Energia: ${player.energy}/${player.maxEnergy}\n` +
            `🗝️ Chaves: ${player.keys}\n` +
            `🗺️ Mapa: ${map.name} (Lv ${map.level})\n\n` +
            `${skinText}\n` +
            `*Equipamentos:*\n${equipText}\n` +
            `💀 *Almas Equipadas (${player.souls?.filter(s => s !== null).length || 0}/2):*\n${soulsText}`;
        
        const keyboard = [
            [Markup.button.callback('📝 Renomear', 'rename_action'), Markup.button.callback('🔄 Mudar Classe', 'change_class_action')],
            [Markup.button.callback('◀️ Voltar', 'menu')]
        ];
        
        const { mainMenu } = require('../menus/mainMenu');
        await ctx.editMessageText(profileMsg, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(keyboard) });
    } catch (err) {
        console.error('Erro no perfil:', err);
        await ctx.answerCbQuery('Erro ao carregar perfil.');
    }
}

async function handleRenameAction(ctx) {
    await ctx.answerCbQuery();
    await ctx.reply('Digite seu novo nome usando o comando: /rename <novo_nome>');
}

async function handleChangeClassAction(ctx) {
    await ctx.answerCbQuery();
    await ctx.reply('Escolha sua nova classe:\n/class guerreiro\n/class arqueiro\n/class mago');
}

module.exports = { handleProfile, handleRenameAction, handleChangeClassAction };
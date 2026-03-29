const { getPlayerSafe } = require('../utils/helpers');
const { inventoryCategoryMenu } = require('../menus/inventoryMenu');
const { getRarityColor, formatItemName } = require('../utils/helpers');
const { getRarityEmoji } = require('../../data/souls');

async function handleInventory(ctx) {
    try {
        const player = getPlayerSafe(ctx.from.id);
        let text = `🎒 *INVENTÁRIO*\n\n`;
        text += `⚔️ ATK ${player.atk} | 🛡️ DEF ${player.def} | ❤️ HP ${player.maxHp} | ✨ CRIT ${player.crit}%\n\n`;
        text += `Escolha uma categoria:`;
        await ctx.editMessageText(text, inventoryCategoryMenu());
    } catch (err) {
        console.error('Erro ao abrir inventário:', err);
        await ctx.answerCbQuery('Erro ao carregar inventário.');
    }
}

async function handleInvWeapons(ctx) {
    try {
        const player = getPlayerSafe(ctx.from.id);
        const weapons = (player.inventory || []).filter(i => i && i.slot === 'weapon');
        let text = `⚔️ *ARMAS* (${weapons.length})\n\n`;
        if (weapons.length === 0) {
            text += 'Nenhuma arma no inventário.';
        } else {
            weapons.forEach(w => {
                text += `${getRarityColor(w.rarity)} ${w.name} (${w.rarity})\n`;
                text += `   ⚔️ +${w.atk || 0} | 🛡️ +${w.def || 0} | ✨ +${w.crit || 0} | ❤️ +${w.hp || 0}\n`;
                text += `   /equip_${w.id}\n\n`;
            });
        }
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...inventoryCategoryMenu() });
    } catch (err) {
        console.error('Erro ao listar armas:', err);
        await ctx.answerCbQuery('Erro ao carregar armas.');
    }
}

// Similar para inv_armors, inv_jewelry, inv_consumables, inv_souls, inv_skins...

module.exports = {
    handleInventory,
    handleInvWeapons,
    handleInvArmors,
    handleInvJewelry,
    handleInvConsumables,
    handleInvSouls,
    handleInvSkins
};
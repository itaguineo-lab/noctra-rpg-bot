const { getPlayerSafe } = require('../utils/helpers');
const { inventoryCategoryMenu } = require('../menus/inventoryMenu');
const { getRarityColor } = require('../utils/constants');
const { formatItemName } = require('../utils/formatters');
const { getRarityEmoji } = require('../utils/constants');

async function handleInventory(ctx) {
    // ... (código existente)
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

// ... (resto dos handlers)

module.exports = {
    handleInventory,
    handleInvWeapons,
    handleInvArmors,
    handleInvJewelry,
    handleInvConsumables,
    handleInvSouls,
    handleInvSkins
};
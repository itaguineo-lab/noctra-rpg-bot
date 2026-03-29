const { getPlayerSafe } = require('../utils/helpers');
const { inventoryCategoryMenu } = require('../menus/inventoryMenu');
const { getRarityEmoji } = require('../utils/constants');

async function handleInventory(ctx) {
    await ctx.editMessageText('🎒 *Seu Inventário*\nEscolha uma categoria:', { 
        parse_mode: 'Markdown', 
        ...inventoryCategoryMenu() 
    });
}

async function handleInvWeapons(ctx) {
    await renderCategory(ctx, 'weapon', '⚔️ ARMAS');
}

async function handleInvArmors(ctx) {
    await renderCategory(ctx, 'armor', '🛡️ ARMADURAS');
}

async function handleInvJewelry(ctx) {
    await renderCategory(ctx, 'accessory', '📿 ACESSÓRIOS');
}

async function handleInvConsumables(ctx) {
    try {
        const player = getPlayerSafe(ctx.from.id);
        const cons = player.consumables || {};
        let text = `🧪 *CONSUMÍVEIS*\n\n`;
        text += `❤️ Poções HP: ${cons.potionHp || 0}\n`;
        text += `⚡ Poções Energia: ${cons.potionEnergy || 0}\n`;
        text += `💪 Tônicos Atk: ${cons.tonicStrength || 0}\n`;
        
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...inventoryCategoryMenu() });
    } catch (err) {
        await ctx.answerCbQuery('Erro ao carregar consumíveis.');
    }
}

async function renderCategory(ctx, slot, title) {
    try {
        const player = getPlayerSafe(ctx.from.id);
        const items = (player.inventory || []).filter(i => i && i.slot === slot);
        let text = `*${title}* (${items.length})\n\n`;
        
        if (items.length === 0) {
            text += 'Nenhum item nesta categoria.';
        } else {
            items.forEach(w => {
                text += `${getRarityEmoji(w.rarity)} *${w.name}*\n`;
                text += `   ⚔️ +${w.atk || 0} | 🛡️ +${w.def || 0} | ✨ +${w.crit || 0}%\n`;
                text += `   /equip_${w.id}\n\n`;
            });
        }
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...inventoryCategoryMenu() });
    } catch (err) {
        console.error(`Erro ao listar ${title}:`, err);
        await ctx.answerCbQuery('Erro ao carregar itens.');
    }
}

module.exports = { 
    handleInventory, handleInvWeapons, handleInvArmors, 
    handleInvJewelry, handleInvConsumables 
};

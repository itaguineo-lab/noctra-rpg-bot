const { getPlayer, savePlayer } = require('../data/players');
const { villageItems, castleItems, arenaItems } = require('../data/shop');
const { shopTabsMenu, renderShop } = require('../menus/shopMenu');
const { mainMenu } = require('../menus/mainMenu');

async function handleShop(ctx) {
    await ctx.editMessageText('🛒 *Bem-vindo à Loja!*\nEscolha uma categoria:', { parse_mode: 'Markdown', ...shopTabsMenu() });
}

async function handleShopVillage(ctx) {
    const player = getPlayer(ctx.from.id);
    const { text, keyboard } = renderShop('🏠 Vila (Ouro)', villageItems, player);
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
}

async function handleShopCastle(ctx) {
    const player = getPlayer(ctx.from.id);
    const { text, keyboard } = renderShop('🏰 Castelo (Nox)', castleItems, player);
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
}

async function handleShopArena(ctx) {
    const player = getPlayer(ctx.from.id);
    const { text, keyboard } = renderShop('⚔️ Matadores (Glórias)', arenaItems, player);
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
}

async function handleBuy(ctx) {
    const itemId = ctx.match[1];
    const player = getPlayer(ctx.from.id);
    let item = null;
    let category = null;
    
    if ((item = villageItems.find(i => i.id === itemId))) category = 'village';
    else if ((item = castleItems.find(i => i.id === itemId))) category = 'castle';
    else if ((item = arenaItems.find(i => i.id === itemId))) category = 'arena';
    
    if (!item) return ctx.answerCbQuery('Item não encontrado.');

    const cost = item.price;
    let currency = player[item.currency];
    if (currency < cost) {
        await ctx.answerCbQuery(`❌ Você não tem ${item.currency === 'gold' ? 'ouro' : (item.currency === 'nox' ? 'Nox' : 'Glórias')} suficiente!`, true);
        return;
    }

    player[item.currency] -= cost;
    
    if (item.type === 'consumable') {
        const qty = item.quantity || 1;
        if (item.effect === 'hp') player.consumables.potionHp = (player.consumables.potionHp || 0) + qty;
        else if (item.effect === 'energy') player.consumables.potionEnergy = (player.consumables.potionEnergy || 0) + qty;
        else if (item.effect === 'buff_atk') player.consumables.tonicStrength = (player.consumables.tonicStrength || 0) + qty;
        else if (item.effect === 'buff_def') player.consumables.tonicDefense = (player.consumables.tonicDefense || 0) + qty;
        else if (item.effect === 'buff_crit') player.consumables.tonicPrecision = (player.consumables.tonicPrecision || 0) + qty;
    } else if (item.type === 'key') {
        player.keys += item.value;
    } else if (item.type === 'vip') {
        const now = new Date();
        const expire = new Date(now.getTime() + item.days * 24 * 60 * 60 * 1000);
        player.vip = true;
        player.vipExpires = expire.toISOString();
        player.maxEnergy = 40;
        player.energy = Math.min(player.energy, 40);
        player.maxInventory += 10;
    }

    savePlayer(ctx.from.id, player);
    await ctx.answerCbQuery(`✅ Comprou: ${item.name}!`);
    
    if (category === 'village') await handleShopVillage(ctx);
    else if (category === 'castle') await handleShopCastle(ctx);
    else if (category === 'arena') await handleShopArena(ctx);
}

module.exports = { handleShop, handleShopVillage, handleShopCastle, handleShopArena, handleBuy };
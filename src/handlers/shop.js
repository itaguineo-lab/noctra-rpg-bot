const { getPlayer, savePlayer } = require('../../data/players');
const { villageItems, castleItems, arenaItems } = require('../../data/shop');
const { shopTabsMenu, renderShop } = require('../menus/shopMenu');

async function handleShop(ctx) {
    const player = getPlayer(ctx.from.id);
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
    // ... lógica de compra
}

module.exports = {
    handleShop,
    handleShopVillage,
    handleShopCastle,
    handleShopArena,
    handleBuy
};
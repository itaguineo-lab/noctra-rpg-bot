const { Markup } = require('telegraf');
function shopTabsMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('🏠 Vila (Ouro)', 'shop_village')],
        [Markup.button.callback('🏰 Castelo (Nox)', 'shop_castle')],
        [Markup.button.callback('⚔️ Matadores (Glórias)', 'shop_arena')],
        [Markup.button.callback('◀️ Voltar', 'menu')]
    ]);
}
function renderShop(category, items) {
    let text = `🛒 *${category}*\n\n`;
    const keyboard = [];
    for (const item of items) {
        const symbol = item.currency === 'gold' ? '💰' : (item.currency === 'nox' ? '💎' : '🏅');
        text += `${item.name} — ${item.price} ${symbol}\n   ${item.description}\n`;
        keyboard.push([Markup.button.callback(`Comprar ${item.name}`, `buy_${item.id}`)]);
    }
    keyboard.push([Markup.button.callback('◀️ Voltar', 'shop')]);
    return { text, keyboard: Markup.inlineKeyboard(keyboard) };
}
module.exports = { shopTabsMenu, renderShop };
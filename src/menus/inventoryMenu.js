const { Markup } = require('telegraf');

/**
 * Menu principal do Inventário
 */
function inventoryCategoryMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ Armas', 'inv_weapons'), Markup.button.callback('🛡️ Armaduras', 'inv_armors')],
        [Markup.button.callback('💀 Almas (Skills)', 'inv_souls')],
        [Markup.button.callback('🧪 Consumíveis', 'inv_consumables')],
        [Markup.button.callback('◀️ Voltar ao Menu', 'menu')]
    ]);
}

/**
 * Renderiza a lista de itens de uma categoria com botões de ação
 */
function renderInventoryCategory(title, items, type) {
    let text = `🎒 *${title}*\\n\\n`;
    const keyboard = [];

    if (items.length === 0) {
        text += "_Vazio..._";
    } else {
        items.forEach(item => {
            text += `🔹 *${item.name}*\\n`;
            if (type === 'soul') {
                text += `   ✨ ${item.description}\\n`;
                keyboard.push([Markup.button.callback(`Equipar ${item.name}`, `equip_soul_${item.id}`)]);
            } else {
                text += `   Lvl: ${item.level} | ⚔️${item.atk || 0} 🛡️${item.def || 0}\\n`;
                keyboard.push([Markup.button.callback(`Equipar ${item.name}`, `equip_item_${item.id}`)]);
            }
        });
    }

    keyboard.push([Markup.button.callback('◀️ Voltar', 'inventory')]);
    return { text, keyboard: Markup.inlineKeyboard(keyboard) };
}

module.exports = { inventoryCategoryMenu, renderInventoryCategory };

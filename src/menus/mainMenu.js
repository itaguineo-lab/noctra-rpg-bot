const { Markup } = require('telegraf');

function mainMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ Caçar', 'hunt'), Markup.button.callback('🗺️ Viajar', 'travel')],
        [Markup.button.callback('🎒 Inventário', 'inventory'), Markup.button.callback('👤 Perfil', 'profile')],
        [Markup.button.callback('🛒 Loja', 'shop'), Markup.button.callback('🏛️ Masmorra', 'dungeon')],
        [Markup.button.callback('🏆 Arena', 'arena'), Markup.button.callback('🤝 Guilda', 'guild')],
        [Markup.button.callback('⚡ Energia', 'energy'), Markup.button.callback('💎 VIP', 'vip')],
        [Markup.button.callback('🎁 Baú Diário', 'daily'), Markup.button.callback('👥 Online', 'online')]
    ]);
}

module.exports = { mainMenu };

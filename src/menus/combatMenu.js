const { Markup } = require('telegraf');

function combatMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ Atacar', 'combat_attack')],
        [Markup.button.callback('🧪 Consumíveis', 'combat_items')],
        [Markup.button.callback('💀 Almas', 'combat_souls')],
        [Markup.button.callback('🏃 Fugir', 'combat_flee')]
    ]);
}

function consumablesMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('💚 Poção de Vida', 'use_potion_hp')],
        [Markup.button.callback('🔋 Poção de Energia', 'use_potion_energy')],
        [Markup.button.callback('💪 Tônico de Força', 'use_tonic_strength')],
        [Markup.button.callback('🛡️ Tônico de Defesa', 'use_tonic_defense')],
        [Markup.button.callback('🎯 Tônico de Precisão', 'use_tonic_precision')],
        [Markup.button.callback('◀️ Voltar', 'combat_back')]
    ]);
}

function soulsMenu(fight, canUseSoul) {
    const buttons = [];
    if (fight.player.souls) {
        for (const soul of fight.player.souls) {
            if (soul) {
                const canUse = canUseSoul(fight, soul);
                const status = canUse ? '🟢' : '⏳';
                buttons.push([Markup.button.callback(`${status} ${soul.name}`, `use_soul_${soul.id}`)]);
            }
        }
    }
    buttons.push([Markup.button.callback('◀️ Voltar', 'combat_back')]);
    return Markup.inlineKeyboard(buttons);
}

module.exports = { combatMenu, consumablesMenu, soulsMenu };
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
        [Markup.button.callback('❤️ Poção HP', 'use_potion_hp'), Markup.button.callback('⚡ Poção Energia', 'use_potion_energy')],
        [Markup.button.callback('💪 Tônico Atk', 'use_tonic_strength'), Markup.button.callback('🛡️ Tônico Def', 'use_tonic_defense')],
        [Markup.button.callback('◀️ Voltar', 'combat_back')]
    ]);
}

/**
 * Gera o menu de almas baseado no que o jogador tem equipado
 * @param {Object} fight Objeto da luta atual contendo o player
 */
function soulsMenu(fight) {
    const buttons = [];
    const souls = fight.player.souls || [];

    souls.forEach((soul, index) => {
        if (soul) {
            // Verifica se a alma pode ser usada (ex: cooldown)
            const status = soul.ready ? '🟢' : '⏳'; 
            buttons.push([Markup.button.callback(`${status} ${soul.name}`, `use_soul_${index}`)]);
        } else {
            buttons.push([Markup.button.callback('❌ Slot Vazio', 'combat_void')]);
        }
    });

    buttons.push([Markup.button.callback('◀️ Voltar', 'combat_back')]);

    return Markup.inlineKeyboard(buttons);
}

module.exports = { combatMenu, consumablesMenu, soulsMenu };

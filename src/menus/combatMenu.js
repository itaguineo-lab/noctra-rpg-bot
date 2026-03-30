const { Markup } = require('telegraf');

function combatMenu(fight = null) {
    const playerLowHp =
        fight &&
        fight.player &&
        fight.player.hp <= fight.player.maxHp * 0.3;

    const enemyLowHp =
        fight &&
        fight.enemy &&
        fight.enemy.hp <= fight.enemy.maxHp * 0.25;

    const attackLabel = enemyLowHp
        ? '⚔️ Finalizar'
        : '⚔️ Atacar';

    const itemLabel = playerLowHp
        ? '🧪 Curar'
        : '🧪 Consumíveis';

    return Markup.inlineKeyboard([
        [
            Markup.button.callback(
                attackLabel,
                'combat_attack'
            )
        ],
        [
            Markup.button.callback(
                itemLabel,
                'combat_items'
            ),
            Markup.button.callback(
                '💀 Almas',
                'combat_souls'
            )
        ],
        [
            Markup.button.callback(
                '🏃 Fugir',
                'combat_flee'
            )
        ]
    ]);
}

function consumablesMenu(player = null) {
    const inventory = player?.inventory || [];

    const hasHpPotion = inventory.some(
        item => item?.id === 'potion_hp'
    );

    const hasEnergyPotion = inventory.some(
        item => item?.id === 'potion_energy'
    );

    return Markup.inlineKeyboard([
        [
            Markup.button.callback(
                hasHpPotion
                    ? '❤️ Poção HP'
                    : '❌ Sem HP',
                'use_potion_hp'
            ),
            Markup.button.callback(
                hasEnergyPotion
                    ? '⚡ Energia'
                    : '❌ Sem Energia',
                'use_potion_energy'
            )
        ],
        [
            Markup.button.callback(
                '💪 Tônico Atk',
                'use_tonic_strength'
            ),
            Markup.button.callback(
                '🛡️ Tônico Def',
                'use_tonic_defense'
            )
        ],
        [
            Markup.button.callback(
                '◀️ Voltar',
                'combat_back'
            )
        ]
    ]);
}

function soulsMenu(fight) {
    const buttons = [];

    const souls = fight?.player?.souls || [];

    if (!souls.length) {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback(
                    '❌ Sem almas',
                    'combat_void'
                )
            ],
            [
                Markup.button.callback(
                    '◀️ Voltar',
                    'combat_back'
                )
            ]
        ]);
    }

    souls.forEach((soul, index) => {
        if (!soul) {
            buttons.push([
                Markup.button.callback(
                    '❌ Slot vazio',
                    'combat_void'
                )
            ]);
            return;
        }

        const ready =
            soul.ready !== false &&
            !soul.cooldown;

        const status = ready ? '🟢' : '⏳';

        const label =
            `${status} ${soul.emoji || '💀'} ${soul.name}`;

        buttons.push([
            Markup.button.callback(
                label,
                `use_soul_${index}`
            )
        ]);
    });

    buttons.push([
        Markup.button.callback(
            '◀️ Voltar',
            'combat_back'
        )
    ]);

    return Markup.inlineKeyboard(buttons);
}

module.exports = {
    combatMenu,
    consumablesMenu,
    soulsMenu
};
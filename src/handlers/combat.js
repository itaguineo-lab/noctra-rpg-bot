const { getPlayer, savePlayer, recalculateStats } = require('../core/player/playerService');
const { addXp } = require('../core/player/progression');
const { createFight, processPlayerTurn, processEnemyTurn, attemptFlee } = require('../core/combat/combatEngine');
const { combatMenu } = require('../menus/combatMenu');

let getRandomEnemy = null;

// Tenta resolver o gerador de inimigos sem quebrar o projeto caso o caminho mude
try {
    ({ getRandomEnemy } = require('../core/world/enemies'));
} catch (error) {
    try {
        ({ getRandomEnemy } = require('../core/world/maps'));
    } catch (fallbackError) {
        console.error('Não foi possível carregar getRandomEnemy de enemies/maps.');
    }
}

const activeFights = new Map();

function getFight(ctx) {
    return activeFights.get(ctx.from.id);
}

function renderFightText(fight) {
    return (
        `⚔️ *Combate em andamento*\n\n` +
        `👤 *${fight.player.name}*\n` +
        `❤️ HP: ${fight.player.hp}/${fight.player.maxHp}\n\n` +
        `👾 *${fight.enemy.name}* (Lv ${fight.enemy.level})\n` +
        `❤️ HP: ${fight.enemy.hp}/${fight.enemy.maxHp}\n\n` +
        `${fight.logs.join('\n')}`
    );
}

async function safeEdit(ctx, text, options = {}) {
    try {
        await ctx.editMessageText(text, options);
    } catch (error) {
        await ctx.reply(text, options);
    }
}

async function finishFight(ctx, fight) {
    const player = getPlayer(ctx.from.id);

    if (fight.status === 'win') {
        const rewards = fight.rewards || { xp: 0, nox: 0 };

        player.xp += rewards.xp || 0;
        player.nox = (player.nox || 0) + (rewards.nox || 0);

        addXp(player, 0); // força checagem de level up usando o estado atual

        recalculateStats(player);
        player.hp = player.maxHp;

        savePlayer(ctx.from.id, player);

        activeFights.delete(ctx.from.id);

        return safeEdit(
            ctx,
            `🏆 *Vitória!*\n\n${fight.logs.join('\n')}\n\n` +
            `+${rewards.xp || 0} XP\n+${rewards.nox || 0} Nox`,
            {
                parse_mode: 'Markdown',
                ...combatMenu()
            }
        );
    }

    if (fight.status === 'loss') {
        player.hp = Math.max(1, Math.floor(player.maxHp * 0.25));
        savePlayer(ctx.from.id, player);

        activeFights.delete(ctx.from.id);

        return safeEdit(
            ctx,
            `☠️ *Derrota...*\n\n${fight.logs.join('\n')}\n\n` +
            `Você recuou para recuperar forças.`,
            {
                parse_mode: 'Markdown',
                ...combatMenu()
            }
        );
    }

    if (fight.status === 'fled') {
        savePlayer(ctx.from.id, player);
        activeFights.delete(ctx.from.id);

        return safeEdit(
            ctx,
            `🏃 *Fuga bem-sucedida!*\n\n${fight.logs.join('\n')}`,
            {
                parse_mode: 'Markdown',
                ...combatMenu()
            }
        );
    }

    return null;
}

async function handleHunt(ctx) {
    try {
        const player = getPlayer(ctx.from.id);

        if (player.energy < 1) {
            return ctx.answerCbQuery('❌ Sem energia suficiente!', true);
        }

        if (typeof getRandomEnemy !== 'function') {
            return ctx.answerCbQuery('❌ Sistema de inimigos indisponível.', true);
        }

        const enemy = getRandomEnemy(player.currentMap || 'default', player.level);

        if (!enemy) {
            return ctx.answerCbQuery('❌ Nenhum inimigo encontrado.', true);
        }

        const fight = createFight(player, enemy);
        activeFights.set(ctx.from.id, fight);

        player.energy -= 1;
        savePlayer(ctx.from.id, player);

        const text =
            `⚔️ *Inimigo encontrado!*\n\n` +
            `👾 *${enemy.name}* (Lv ${enemy.level || 1})\n` +
            `❤️ HP: ${enemy.hp}\n\n` +
            `O que deseja fazer?`;

        await safeEdit(ctx, text, {
            parse_mode: 'Markdown',
            ...combatMenu()
        });
    } catch (error) {
        console.error('Erro ao caçar:', error);
        await ctx.reply('Erro ao iniciar combate.');
    }
}

async function handleCombatAttack(ctx) {
    try {
        const fight = getFight(ctx);

        if (!fight) {
            return ctx.answerCbQuery('Nenhum combate ativo.', true);
        }

        if (fight.status !== 'active') {
            return finishFight(ctx, fight);
        }

        processPlayerTurn(fight);

        if (fight.status === 'win') {
            return finishFight(ctx, fight);
        }

        processEnemyTurn(fight);

        if (fight.status !== 'active') {
            return finishFight(ctx, fight);
        }

        await safeEdit(ctx, renderFightText(fight), {
            parse_mode: 'Markdown',
            ...combatMenu()
        });
    } catch (error) {
        console.error('Erro no ataque:', error);
        await ctx.reply('Erro ao atacar.');
    }
}

async function handleCombatFlee(ctx) {
    try {
        const fight = getFight(ctx);

        if (!fight) {
            return ctx.answerCbQuery('Nenhum combate ativo.', true);
        }

        attemptFlee(fight);

        if (fight.status === 'fled') {
            return finishFight(ctx, fight);
        }

        processEnemyTurn(fight);

        if (fight.status !== 'active') {
            return finishFight(ctx, fight);
        }

        await safeEdit(ctx, renderFightText(fight), {
            parse_mode: 'Markdown',
            ...combatMenu()
        });
    } catch (error) {
        console.error('Erro ao fugir:', error);
        await ctx.reply('Erro ao tentar fugir.');
    }
}

async function handleCombatItems(ctx) {
    try {
        const fight = getFight(ctx);

        if (!fight) {
            return ctx.answerCbQuery('Nenhum combate ativo.', true);
        }

        await ctx.answerCbQuery('Inventário em combate em breve.', true);
    } catch (error) {
        console.error('Erro em combate > itens:', error);
    }
}

async function handleCombatSouls(ctx) {
    try {
        const fight = getFight(ctx);

        if (!fight) {
            return ctx.answerCbQuery('Nenhum combate ativo.', true);
        }

        await ctx.answerCbQuery('Souls em combate em breve.', true);
    } catch (error) {
        console.error('Erro em combate > souls:', error);
    }
}

async function handleUseSoul(ctx) {
    try {
        const fight = getFight(ctx);

        if (!fight) {
            return ctx.answerCbQuery('Nenhum combate ativo.', true);
        }

        await ctx.answerCbQuery('Uso de soul será conectado na próxima etapa.', true);
    } catch (error) {
        console.error('Erro ao usar soul:', error);
    }
}

async function handleUseConsumable(ctx) {
    try {
        const fight = getFight(ctx);

        if (!fight) {
            return ctx.answerCbQuery('Nenhum combate ativo.', true);
        }

        await ctx.answerCbQuery('Uso de item será conectado na próxima etapa.', true);
    } catch (error) {
        console.error('Erro ao usar consumível:', error);
    }
}

module.exports = {
    activeFights,
    handleHunt,
    handleCombatAttack,
    handleCombatFlee,
    handleCombatItems,
    handleCombatSouls,
    handleUseSoul,
    handleUseConsumable
};
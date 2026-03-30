const { calculateDamage } = require('./damageCalc');

function trimLogs(logs, max = 8) {
    return logs.slice(-max);
}

function createFight(player, enemy) {
    return {
        player: {
            id: player.id,
            name: player.name,
            hp: player.hp,
            maxHp: player.maxHp,
            atk: player.atk,
            def: player.def,
            crit: player.crit || 5,
            souls: player.souls || [],
            shield: 0,
            shieldDuration: 0
        },

        enemy: {
            id: enemy.id || enemy.name,
            name: enemy.name,
            hp: enemy.hp,
            maxHp: enemy.hp,
            atk: enemy.atk,
            def: enemy.def,
            crit: enemy.crit || 5,
            level: enemy.level || 1,
            xp: enemy.xp || 0,
            gold: enemy.gold || 0,
            frozen: false
        },

        turn: 1,
        status: 'active',
        rewards: null,
        logs: [`⚔️ Um ${enemy.name} surgiu das sombras!`]
    };
}

function processPlayerTurn(fight) {
    if (fight.status !== 'active') return null;

    const result = calculateDamage(
        fight.player,
        fight.enemy
    );

    fight.enemy.hp = Math.max(
        0,
        fight.enemy.hp - result.damage
    );

    fight.logs.push(
        result.isCrit
            ? `💥 CRÍTICO! Causaste *${result.damage}* dano!`
            : `🗡️ Causaste *${result.damage}* dano!`
    );

    if (fight.enemy.hp <= 0) {
        fight.status = 'win';

        fight.rewards = {
            xp: fight.enemy.xp,
            nox: fight.enemy.gold
        };

        fight.logs.push(
            `💀 ${fight.enemy.name} foi derrotado!`
        );
    }

    fight.logs = trimLogs(fight.logs);

    return result;
}

function processEnemyTurn(fight) {
    if (fight.status !== 'active') return null;

    if (fight.enemy.frozen) {
        fight.enemy.frozen = false;

        fight.logs.push(
            `❄️ ${fight.enemy.name} está congelado!`
        );

        return null;
    }

    const result = calculateDamage(
        fight.enemy,
        fight.player
    );

    let damage = result.damage;

    if (fight.player.shieldDuration > 0) {
        damage = Math.floor(
            damage * (1 - fight.player.shield)
        );

        fight.player.shieldDuration--;

        if (fight.player.shieldDuration <= 0) {
            fight.player.shield = 0;
        }
    }

    fight.player.hp = Math.max(
        0,
        fight.player.hp - damage
    );

    fight.logs.push(
        `👹 ${fight.enemy.name} causou *${damage}* dano!`
    );

    if (fight.player.hp <= 0) {
        fight.status = 'loss';

        fight.logs.push(
            `☠️ Foste derrotado por ${fight.enemy.name}...`
        );
    }

    fight.turn++;
    fight.logs = trimLogs(fight.logs);

    return {
        ...result,
        damage
    };
}

function attemptFlee(fight) {
    if (fight.status !== 'active') return false;

    const successChance = 0.6;

    const success = Math.random() <= successChance;

    if (success) {
        fight.status = 'fled';

        fight.logs.push(
            `🏃 Fugiste com sucesso.`
        );
    } else {
        fight.logs.push(
            `🚫 Não conseguiste fugir!`
        );
    }

    fight.logs = trimLogs(fight.logs);

    return success;
}

module.exports = {
    createFight,
    processPlayerTurn,
    processEnemyTurn,
    attemptFlee
};
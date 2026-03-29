function calculateDamage(atk, def) {
    return Math.max(1, Math.floor(atk * (1 - def / (def + 100))));
}

function calculateCritDamage(baseDamage, critChance, critBonus = 0) {
    const isCrit = Math.random() * 100 <= critChance;
    if (isCrit) return { damage: Math.floor(baseDamage * (1.5 + critBonus)), isCrit: true };
    return { damage: baseDamage, isCrit: false };
}

function startCombat(player, enemy) {
    return {
        player: {
            hp: player.hp, maxHp: player.maxHp, atk: player.atk, def: player.def, crit: player.crit,
            critBonus: 0, shield: 0, shieldDuration: 0,
            souls: player.souls?.filter(s => s !== null) || [],
            soulsUsed: {}, frozen: false, buffAtk: null, buffDef: null, buffCrit: null
        },
        enemy: { ...enemy, hp: enemy.hp, maxHp: enemy.hp, atk: enemy.atk, def: enemy.def, exp: enemy.exp, gold: enemy.gold, frozen: false },
        turn: 0, ended: false, winner: null
    };
}

function playerAttack(state) {
    let playerAtk = state.player.atk, playerDef = state.player.def, playerCrit = state.player.crit;
    if (state.player.buffAtk?.duration > 0) { playerAtk = Math.floor(playerAtk * (1 + state.player.buffAtk.value / 100)); state.player.buffAtk.duration--; }
    if (state.player.buffDef?.duration > 0) { playerDef = Math.floor(playerDef * (1 + state.player.buffDef.value / 100)); state.player.buffDef.duration--; }
    if (state.player.buffCrit?.duration > 0) { playerCrit += state.player.buffCrit.value; state.player.buffCrit.duration--; }

    let enemyDamage = 0;
    const baseDamage = calculateDamage(playerAtk, state.enemy.def);
    const { damage, isCrit } = calculateCritDamage(baseDamage, playerCrit, state.player.critBonus);
    state.enemy.hp -= damage;
    let message = `⚔️ Você causou *${damage}* de dano${isCrit ? ' (CRÍTICO!)' : ''}.`;

    if (state.enemy.frozen) {
        message += `\n❄️ Inimigo congelado perdeu o turno!`;
        state.enemy.frozen = false;
    } else {
        let rawDamage = calculateDamage(state.enemy.atk, playerDef);
        if (state.player.shieldDuration > 0 && state.player.shield > 0) {
            rawDamage = Math.floor(rawDamage * (1 - state.player.shield));
            message += `\n🛡️ Escudo reduziu dano para *${rawDamage}*!`;
            state.player.shieldDuration--;
            if (state.player.shieldDuration <= 0) state.player.shield = 0;
        }
        state.player.hp -= rawDamage;
        enemyDamage = rawDamage;
        message += `\n🐺 Inimigo causou *${enemyDamage}* de dano.`;
    }

    if (state.enemy.hp <= 0) {
        state.ended = true; state.winner = 'player';
        return { message, ended: true, winner: 'player', damage, enemyDamage };
    }
    if (state.player.hp <= 0) {
        const phoenix = state.player.souls.find(s => s && s.effect?.type === 'revive');
        if (phoenix && !state.player.soulsUsed[phoenix.id]) {
            state.player.soulsUsed[phoenix.id] = true;
            state.player.hp = Math.floor(state.player.maxHp * 0.3);
            message += `\n🐦‍🔥 Fênix reviveu você com ${state.player.hp} HP!`;
            return { message, ended: false, damage, enemyDamage };
        }
        state.ended = true; state.winner = 'enemy';
        return { message, ended: true, winner: 'enemy', damage, enemyDamage };
    }
    return { message, ended: false, damage, enemyDamage };
}

function playerFlee(state) {
    if (Math.random() < 0.5) {
        state.ended = true; state.winner = 'fled';
        return { message: '🏃 Você fugiu com sucesso!', success: true };
    }
    const damage = calculateDamage(state.enemy.atk, state.player.def);
    state.player.hp -= damage;
    let message = `🏃 Fuga falhou! Inimigo causou *${damage}* de dano.`;
    if (state.player.hp <= 0) {
        state.ended = true; state.winner = 'enemy';
        message += '\n💀 Você foi derrotado.';
    }
    return { message, success: false };
}

function canUseSoul(state, soul) { return !state.player.soulsUsed[soul.id]; }

function useSoul(state, soul) {
    if (!canUseSoul(state, soul)) return { success: false, message: `⏳ ${soul.name} já usada!` };
    state.player.soulsUsed[soul.id] = true;
    const { activateSoul } = require('./souls');
    const result = activateSoul(soul, state);
    if (state.enemy.hp <= 0) { state.ended = true; state.winner = 'player'; result.message += '\n✨ Inimigo derrotado!'; result.ended = true; }
    return result;
}

module.exports = { calculateDamage, calculateCritDamage, startCombat, playerAttack, playerFlee, canUseSoul, useSoul };
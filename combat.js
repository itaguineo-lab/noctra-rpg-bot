function calculateDamage(atk, def) {
    const damage = Math.max(1, Math.floor(atk * (1 - def / (def + 100))));
    return damage;
}

function calculateCritDamage(baseDamage, critChance, critBonus = 0) {
    const isCrit = Math.random() * 100 <= critChance;
    if (isCrit) {
        const finalDamage = Math.floor(baseDamage * (1.5 + critBonus));
        return { damage: finalDamage, isCrit: true };
    }
    return { damage: baseDamage, isCrit: false };
}

function startCombat(player, enemy) {
    return {
        player: {
            hp: player.hp,
            maxHp: player.maxHp,
            atk: player.atk,
            def: player.def,
            crit: player.crit,
            critBonus: 0,
            shield: 0,
            shieldDuration: 0,
            souls: player.souls.filter(s => s !== null),
            soulsUsed: {},
            frozen: false
        },
        enemy: {
            ...enemy,
            hp: enemy.hp,
            maxHp: enemy.hp,
            atk: enemy.atk,
            def: enemy.def,
            exp: enemy.exp,
            gold: enemy.gold,
            frozen: false
        },
        turn: 0,
        ended: false,
        winner: null
    };
}

function playerAttack(state) {
    let enemyDamage = 0;
    let enemyFrozen = state.enemy.frozen;
    
    const baseDamage = calculateDamage(state.player.atk, state.enemy.def);
    const { damage, isCrit } = calculateCritDamage(baseDamage, state.player.crit, state.player.critBonus);
    state.enemy.hp -= damage;
    let message = `⚔️ Você causou *${damage}* de dano${isCrit ? ' (CRÍTICO!)' : ''}.`;
    
    if (enemyFrozen) {
        message += `\n❄️ Inimigo está congelado e perdeu o turno!`;
        state.enemy.frozen = false;
    } else {
        const enemyBaseDamage = calculateDamage(state.enemy.atk, state.player.def);
        let rawDamage = Math.floor(enemyBaseDamage);
        
        if (state.player.shieldDuration > 0 && state.player.shield > 0) {
            rawDamage = Math.floor(rawDamage * (1 - state.player.shield));
            message += `\n🛡️ Escudo reduziu o dano para *${rawDamage}*!`;
            state.player.shieldDuration--;
            if (state.player.shieldDuration <= 0) state.player.shield = 0;
        }
        
        state.player.hp -= rawDamage;
        enemyDamage = rawDamage;
        message += `\n🐺 Inimigo causou *${enemyDamage}* de dano.`;
    }
    
    if (state.enemy.hp <= 0) {
        state.ended = true;
        state.winner = 'player';
        return { message, ended: true, winner: 'player', damage, enemyDamage };
    }
    
    if (state.player.hp <= 0) {
        const phoenixSoul = state.player.souls.find(s => s && s.effect.type === 'revive');
        if (phoenixSoul && !state.player.soulsUsed[phoenixSoul.id]) {
            state.player.soulsUsed[phoenixSoul.id] = true;
            state.player.hp = Math.floor(state.player.maxHp * 0.3);
            message += `\n🐦‍🔥 *Alma da Fênix* reviveu você com ${state.player.hp} HP!`;
            return { message, ended: false, damage, enemyDamage };
        }
        state.ended = true;
        state.winner = 'enemy';
        return { message, ended: true, winner: 'enemy', damage, enemyDamage };
    }
    
    return { message, ended: false, damage, enemyDamage };
}

function playerFlee(state) {
    const chance = 0.5;
    if (Math.random() < chance) {
        state.ended = true;
        state.winner = 'fled';
        return { message: '🏃 Você fugiu com sucesso!', success: true };
    } else {
        const enemyBaseDamage = calculateDamage(state.enemy.atk, state.player.def);
        const enemyDamage = Math.floor(enemyBaseDamage);
        state.player.hp -= enemyDamage;
        let message = `🏃 Fuga falhou! O inimigo causou *${enemyDamage}* de dano.`;
        if (state.player.hp <= 0) {
            state.ended = true;
            state.winner = 'enemy';
            message += '\n💀 Você foi derrotado.';
        }
        return { message, success: false };
    }
}

function canUseSoul(state, soul) {
    if (state.player.soulsUsed[soul.id]) return false;
    return true;
}

function useSoul(state, soul) {
    if (!canUseSoul(state, soul)) {
        return { success: false, message: `⏳ ${soul.name} já foi usada neste combate!` };
    }
    
    state.player.soulsUsed[soul.id] = true;
    const result = require('./souls').activateSoul(soul, state);
    
    if (state.enemy.hp <= 0) {
        state.ended = true;
        state.winner = 'player';
        result.message += '\n✨ O inimigo foi derrotado!';
        result.ended = true;
    }
    
    return result;
}

module.exports = { 
    calculateDamage, 
    calculateCritDamage, 
    startCombat, 
    playerAttack, 
    playerFlee,
    canUseSoul,
    useSoul
};
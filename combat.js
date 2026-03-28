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
    // Copiamos os atributos atuais para o estado de combate
    return {
        player: {
            hp: player.hp,
            maxHp: player.maxHp,
            atk: player.atk,
            def: player.def,
            crit: player.crit,
            agi: player.agi,
            critBonus: 0 // será aumentado por almas
        },
        enemy: {
            ...enemy,
            hp: enemy.hp,
            maxHp: enemy.hp,
            atk: enemy.atk,
            def: enemy.def,
            exp: enemy.exp,
            gold: enemy.gold
        },
        turn: 0,
        ended: false,
        winner: null,
        messages: []
    };
}

function playerAttack(state) {
    // Jogador ataca
    const baseDamage = calculateDamage(state.player.atk, state.enemy.def);
    const { damage, isCrit } = calculateCritDamage(baseDamage, state.player.crit, state.player.critBonus);
    state.enemy.hp -= damage;
    let message = `⚔️ Você causou *${damage}* de dano${isCrit ? ' (CRÍTICO!)' : ''}.`;

    if (state.enemy.hp <= 0) {
        state.ended = true;
        state.winner = 'player';
        return { message, ended: true, winner: 'player' };
    }

    // Inimigo contra-ataca
    const enemyBaseDamage = calculateDamage(state.enemy.atk, state.player.def);
    const enemyDamage = Math.floor(enemyBaseDamage);
    state.player.hp -= enemyDamage;
    message += `\n🐺 Inimigo causou *${enemyDamage}* de dano.`;

    if (state.player.hp <= 0) {
        state.ended = true;
        state.winner = 'enemy';
        return { message, ended: true, winner: 'enemy' };
    }

    return { message, ended: false };
}

function playerFlee(state) {
    const chance = 1.0;
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

module.exports = { calculateDamage, calculateCritDamage, startCombat, playerAttack, playerFlee };
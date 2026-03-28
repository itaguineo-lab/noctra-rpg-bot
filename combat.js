const { calculateDamage } = require('./combatUtils'); // vou criar

function calculateDamage(atk, def) {
    const damage = Math.max(1, Math.floor(atk * (1 - def / (def + 100))));
    return damage;
}

function startCombat(player, enemy) {
    return {
        player: { ...player }, // cópia dos stats atuais (hp, etc)
        enemy: { ...enemy },
        turn: 0,
        ended: false,
        winner: null
    };
}

function playerAttack(state) {
    const damage = calculateDamage(state.player.atk, state.enemy.def);
    state.enemy.hp -= damage;
    if (state.enemy.hp <= 0) {
        state.ended = true;
        state.winner = 'player';
        return { damage, enemyDied: true };
    }
    // inimigo contra-ataca
    const enemyDamage = calculateDamage(state.enemy.atk, state.player.def);
    state.player.hp -= enemyDamage;
    if (state.player.hp <= 0) {
        state.ended = true;
        state.winner = 'enemy';
        return { damage, enemyDamage, playerDied: true };
    }
    return { damage, enemyDamage };
}

function useItem(state, item) {
    // aplicar efeito do item (cura, buff, etc)
    // simplificado: apenas poção de vida
    if (item.type === 'potion') {
        const heal = item.value;
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
        return { healed: heal };
    }
    // outros itens...
}

module.exports = { startCombat, playerAttack, calculateDamage, useItem };
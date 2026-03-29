
const { calculateDamage } = require('./damageCalc');

/**
 * Inicia uma estrutura de combate limpa
 */
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
            souls: player.souls || [null, null]
        },
        enemy: {
            name: enemy.name,
            hp: enemy.hp,
            maxHp: enemy.hp,
            atk: enemy.atk,
            def: enemy.def,
            level: enemy.level || 1,
            gold: enemy.gold,
            xp: enemy.xp
        },
        turn: 1,
        logs: [`⚔️ Um ${enemy.name} selvagem apareceu!`],
        status: 'active' // active, win, loss, fled
    };
}

/**
 * Executa o turno do Jogador
 */
function processPlayerTurn(fight) {
    const result = calculateDamage(fight.player.atk, fight.enemy.def, fight.player.crit);
    fight.enemy.hp = Math.max(0, fight.enemy.hp - result.damage);
    
    let log = `🗡️ Causaste *${result.damage}* de dano!`;
    if (result.isCrit) log = `💥 *CRÍTICO!* ` + log;
    
    fight.logs.push(log);

    if (fight.enemy.hp <= 0) {
        fight.status = 'win';
        fight.logs.push(`💀 ${fight.enemy.name} foi derrotado!`);
    }
    
    return result;
}

/**
 * Executa o turno do Inimigo
 */
function processEnemyTurn(fight) {
    if (fight.status !== 'active') return null;

    const result = calculateDamage(fight.enemy.atk, fight.player.def, 5);
    fight.player.hp = Math.max(0, fight.player.hp - result.damage);
    
    fight.logs.push(`👹 ${fight.enemy.name} causou *${result.damage}* de dano!`);

    if (fight.player.hp <= 0) {
        fight.status = 'loss';
        fight.logs.push(`❌ Foste derrotado por ${fight.enemy.name}...`);
    }

    fight.turn++;
    return result;
}

/**
 * Tenta fugir da batalha
 */
function attemptFlee(fight) {
    const success = Math.random() > 0.4; // 60% de chance de sucesso
    if (success) {
        fight.status = 'fled';
        fight.logs.push(`🏃 Fugiste do combate com sucesso!`);
    } else {
        fight.logs.push(`🚫 Falhaste ao tentar fugir!`);
    }
    return success;
}

module.exports = { 
    createFight, 
    processPlayerTurn, 
    processEnemyTurn, 
    attemptFlee 
};

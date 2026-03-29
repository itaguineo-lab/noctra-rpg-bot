
const { generateItem } = require('../../data/items');
const { checkLevelUp } = require('../../data/level');

/**
 * Gera as recompensas de uma vitória em combate.
 * @param {Object} player - O jogador.
 * @param {Object} enemy - O inimigo derrotado.
 */
function calculateBattleRewards(player, enemy) {
    // Multiplicadores VIP (50% de bônus)
    const multiplier = player.vip ? 1.5 : 1.0;
    
    const rewards = {
        gold: Math.floor(enemy.gold * multiplier),
        xp: Math.floor(enemy.xp * multiplier),
        item: null,
        levelUp: false
    };

    // Aplica recompensas básicas
    player.gold += rewards.gold;
    player.xp += rewards.xp;

    // Lógica de Drop de Item (ex: 20% de chance de cair algo)
    const dropChance = 0.20;
    if (Math.random() <= dropChance) {
        rewards.item = generateItem(player.level);
        player.inventory.push(rewards.item);
    }

    // Verifica se subiu de nível
    if (checkLevelUp(player)) {
        rewards.levelUp = true;
    }

    return rewards;
}

/**
 * Formata a mensagem de recompensa para o usuário.
 */
function formatRewardMessage(rewards) {
    let msg = `🎉 *Vitória!*\n\n`;
    msg += `💰 +${rewards.gold} Ouro\n`;
    msg += `✨ +${rewards.xp} XP\n`;
    
    if (rewards.item) {
        msg += `🎁 *Drop:* ${rewards.item.emoji} ${rewards.item.name} (${rewards.item.rarity})\n`;
    }
    
    if (rewards.levelUp) {
        msg += `\n🆙 *LEVEL UP!* Você agora está no nível ${rewards.levelUp}!`;
    }
    
    return msg;
}

module.exports = { calculateBattleRewards, formatRewardMessage };

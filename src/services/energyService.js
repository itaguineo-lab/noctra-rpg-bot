
const { savePlayer } = require('../../data/players');

/**
 * Calcula e aplica a regeneração de energia baseada no tempo decorrido.
 * @param {Object} player - O objeto do jogador.
 * @returns {boolean} - Retorna verdadeiro se houve alguma alteração.
 */
function updateEnergy(player) {
    const now = Date.now();
    const lastUpdate = player.lastEnergyUpdate || now;
    
    // VIP regenera em 3 min (180000ms), Normal em 6 min (360000ms)
    const regenInterval = player.vip ? 3 * 60 * 1000 : 6 * 60 * 1000;
    const elapsed = now - lastUpdate;

    if (elapsed >= regenInterval) {
        const energyToRegen = Math.floor(elapsed / regenInterval);
        
        if (player.energy < player.maxEnergy) {
            player.energy = Math.min(player.maxEnergy, player.energy + energyToRegen);
            // Atualiza o timestamp apenas pelo tempo "consumido" pela regeneração
            player.lastEnergyUpdate = lastUpdate + (energyToRegen * regenInterval);
            return true;
        }
    }
    return false;
}

/**
 * Consome energia do jogador para uma ação.
 */
function consumeEnergy(player, amount) {
    if (player.energy >= amount) {
        player.energy -= amount;
        // Se o jogador estava com energia cheia, inicia o contador de regeneração agora
        if (player.energy + amount === player.maxEnergy) {
            player.lastEnergyUpdate = Date.now();
        }
        return true;
    }
    return false;
}

module.exports = { updateEnergy, consumeEnergy };

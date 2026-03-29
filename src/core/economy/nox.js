/**
 * Gerencia a moeda premium NOX
 */

/**
 * Adiciona Nox ao jogador (via compra real ou recompensa de evento)
 */
function addNox(player, amount) {
    if (amount <= 0) return false;
    player.nox += Math.floor(amount);
    return true;
}

/**
 * Tenta remover Nox do jogador para uma compra
 */
function spendNox(player, amount) {
    if (player.nox >= amount) {
        player.nox -= amount;
        return true;
    }
    return false;
}

/**
 * Verifica se o jogador é VIP e se o bônus de Nox deve ser aplicado
 */
function getVipNoxBonus(baseAmount) {
    // Exemplo: VIPs ganham 20% a mais de Nox em eventos
    return Math.floor(baseAmount * 1.2);
}

module.exports = { addNox, spendNox, getVipNoxBonus };

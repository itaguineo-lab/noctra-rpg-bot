
const { savePlayer } = require('../player/playerService');

/**
 * Valida e processa a compra de um item
 * @param {Object} player - Objeto do jogador
 * @param {Object} item - Item vindo do data/shop.js
 * @returns {Object} - { success: boolean, message: string }
 */
function processPurchase(player, item) {
    // 1. Verificar se tem dinheiro suficiente
    const currency = item.currency || 'gold';
    if (player[currency] < item.price) {
        const coinName = currency === 'gold' ? 'Ouro' : 'Nox';
        return { success: false, message: `❌ Não tens ${coinName} suficiente!` };
    }

    // 2. Cobrar o jogador
    player[currency] -= item.price;

    // 3. Aplicar o efeito baseado no tipo de item
    switch (item.type) {
        case 'consumable':
            // Inicializa o objeto de consumíveis se não existir
            if (!player.consumables) player.consumables = {};
            const key = item.effectKey; // ex: 'potionHp'
            player.consumables[key] = (player.consumables[key] || 0) + (item.quantity || 1);
            break;

        case 'equipment':
            // Equipamentos comprados vão para o inventário
            player.inventory.push({
                ...item.stats,
                id: `shop_${Date.now()}`,
                name: item.name,
                rarity: item.rarity || 'Comum'
            });
            break;

        case 'vip':
            const daysInMs = item.days * 24 * 60 * 60 * 1000;
            const currentExpire = player.vipExpires ? new Date(player.vipExpires).getTime() : Date.now();
            
            player.vip = true;
            player.vipExpires = new Date(currentExpire + daysInMs).toISOString();
            // Bónus imediato de VIP
            player.maxEnergy = 40;
            break;

        default:
            return { success: false, message: "❌ Tipo de item desconhecido." };
    }

    return { success: true, message: `✅ Compraste ${item.name} com sucesso!` };
}

module.exports = { processPurchase };

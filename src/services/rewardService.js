const { savePlayer } = require('../core/player/playerService');
const { generateItem } = require('../core/items');
const { soulsList } = require('../core/player/souls');
const { getRewardMultipliers } = require('../utils/helpers');

function processVictory(player, enemy) {
    const multipliers = getRewardMultipliers(player);
    
    // Cálculo de recompensas base
    const xpGained = Math.floor(enemy.exp * multipliers.xp);
    const goldGained = Math.floor(enemy.gold * multipliers.gold);
    
    player.xp += xpGained;
    player.gold += goldGained;

    let loot = [];
    let droppedSoul = null;

    // 1. Lógica de Drop de Itens (Comuns e Bosses)
    // Bosses têm 100% de chance de item, monstros comuns 20%
    const itemDropChance = enemy.isBoss ? 1.0 : 0.2;
    if (Math.random() < itemDropChance) {
        const newItem = generateItem(player.level);
        player.inventory.push(newItem);
        loot.push(newItem.name);
    }

    // 2. Lógica de Drop de Almas (EXCLUSIVO BOSSES)
    if (enemy.isBoss && enemy.possibleSouls) {
        const soulRoll = Math.random();
        if (soulRoll < 0.30) { // 30% de chance de cair a alma do boss
            const soulId = enemy.possibleSouls[Math.floor(Math.random() * enemy.possibleSouls.length)];
            const soulTemplate = soulsList.find(s => s.id === soulId);
            
            if (soulTemplate) {
                droppedSoul = { 
                    ...soulTemplate, 
                    id: Date.now(), // ID único para o inventário
                    type: 'soul' 
                };
                player.inventory.push(droppedSoul);
            }
        }
    }

    savePlayer(player.id, player);

    return {
        xp: xpGained,
        gold: goldGained,
        loot: loot,
        droppedSoul: droppedSoul
    };
}

module.exports = { processVictory };

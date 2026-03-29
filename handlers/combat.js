const { getPlayer, savePlayer, recalculateStats } = require('../../data/players');
const { getRandomEnemy } = require('../../data/maps');
const { 
    startCombat, 
    playerAttack, 
    playerFlee, 
    canUseSoul, 
    useSoul, 
    calculateDamage 
} = require('../../data/combatLogic');
const { checkLevelUp } = require('../../data/level');
const { generateItem } = require('../../data/items');
const { dropSoul } = require('../../data/souls');
const { getRewardMultipliers, getMainMenuText } = require('../utils/helpers');
const { formatItemName, formatSoulName } = require('../utils/formatters');
const { combatMenu, consumablesMenu, soulsMenu } = require('../menus/combatMenu');
const { mainMenu } = require('../menus/mainMenu');

const activeFights = new Map();

// ========== HANDLERS ==========
async function handleHunt(ctx) {
    try {
        const player = getPlayer(ctx.from.id);
        // ... (código existente)
    } catch (err) {
        console.error('Erro ao caçar:', err);
        await ctx.reply('Ocorreu um erro. Tente novamente.');
    }
}

// ... (resto do código do handler)

module.exports = {
    activeFights,
    handleHunt,
    handleCombatAttack,
    handleCombatFlee,
    handleCombatItems,
    handleCombatSouls,
    handleUseSoul,
    handleUseConsumable
};
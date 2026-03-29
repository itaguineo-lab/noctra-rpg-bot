const { getPlayer, savePlayer, recalculateStats } = require('../players');
const { getRandomEnemy } = require('../maps');
const { startCombat, playerAttack, playerFlee, canUseSoul, useSoul, calculateDamage } = require('../combatLogic');
const { checkLevelUp } = require('../level');
const { generateItem } = require('../items');
const { dropSoul, formatSoulName } = require('../souls');
const { getRewardMultipliers, getMainMenuText } = require('../helpers');
const { formatItemName } = require('../formatters');
const { combatMenu, consumablesMenu, soulsMenu } = require('../menus/combatMenu');
const { mainMenu } = require('../menus/mainMenu');

const activeFights = new Map();

async function handleHunt(ctx) {
    try {
        const player = getPlayer(ctx.from.id);
        // ... implementar (já temos no código anterior)
    } catch (err) { console.error(err); await ctx.reply('Erro ao caçar.'); }
}

// ... outros handlers (combat_attack, combat_flee, etc)

module.exports = { activeFights, handleHunt, handleCombatAttack, handleCombatFlee, handleCombatItems, handleCombatSouls, handleUseSoul, handleUseConsumable };

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
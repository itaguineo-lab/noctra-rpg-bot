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
const { dropSoul, formatSoulName } = require('../../data/souls');
const { getRewardMultipliers, getMainMenuText } = require('../utils/helpers');
const { formatItemName } = require('../utils/formatters');
const { combatMenu, consumablesMenu, soulsMenu } = require('../menus/combatMenu');
const { mainMenu } = require('../menus/mainMenu');

const activeFights = new Map();

// ... resto do código do handler (como já estava)
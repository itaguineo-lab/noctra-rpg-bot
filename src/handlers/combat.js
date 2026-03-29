const { getPlayer, savePlayer } = require('../../data/players');
const { getRandomEnemy } = require('../../data/maps');
const { combatMenu } = require('../menus/combatMenu');

const activeFights = new Map();

async function handleHunt(ctx) {
    try {
        const player = getPlayer(ctx.from.id);
        
        if (player.energy < 1) {
            return ctx.answerCbQuery('❌ Sem energia suficiente!', true);
        }

        const enemy = getRandomEnemy(player.currentMap, player.level);
        
        activeFights.set(ctx.from.id, {
            player: { ...player },
            enemy: { ...enemy },
            turn: 1
        });

        player.energy -= 1;
        savePlayer(ctx.from.id, player);

        const text = `⚔️ *Inimigo encontrado!*\n\n👾 *${enemy.name}* (Lv ${enemy.level})\n❤️ HP: ${enemy.hp}\n\nO que deseja fazer?`;
        
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...combatMenu() });
    } catch (err) {
        console.error('Erro ao caçar:', err);
        await ctx.reply('Erro ao iniciar combate.');
    }
}

module.exports = { 
    activeFights, 
    handleHunt,
    // Deixe os outros como placeholders por enquanto se ainda não os criou
    handleCombatAttack: async (ctx) => ctx.answerCbQuery('Atacando...'),
    handleCombatFlee: async (ctx) => ctx.answerCbQuery('Fugindo...')
};

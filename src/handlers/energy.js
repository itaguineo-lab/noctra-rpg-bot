const { getPlayerUpdated } = require('../utils/helpers');
const { progressBar } = require('../../utils');
const { mainMenu } = require('../menus/mainMenu');

async function handleEnergy(ctx) {
    try {
        const player = getPlayerUpdated(ctx.from.id);
        const bar = progressBar(player.energy, player.maxEnergy, 8);
        await ctx.editMessageText(
            `⚡ *Energia*: ${player.energy}/${player.maxEnergy}\n` +
            `[${bar}] ${Math.floor((player.energy/player.maxEnergy)*100)}%\n\n` +
            `Regeneração: ${player.vip ? '1 a cada 3 min' : '1 a cada 6 min'}\n` +
            `Compre poções de energia na loja.` + '\n\n' + getMainMenuText(player, ctx.from.first_name),
            { parse_mode: 'Markdown', ...mainMenu() }
        );
    } catch (err) {
        console.error('Erro na energia:', err);
        await ctx.answerCbQuery('Erro ao mostrar energia.');
    }
}

module.exports = { handleEnergy };
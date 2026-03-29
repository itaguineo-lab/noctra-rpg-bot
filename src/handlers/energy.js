const { getPlayerUpdated, getMainMenuText } = require('../utils/helpers');
const { progressBar } = require('../utils/formatters'); // Corrigido path
const { mainMenu } = require('../menus/mainMenu');

async function handleEnergy(ctx) {
    try {
        const player = getPlayerUpdated(ctx.from.id);
        const bar = progressBar(player.energy, player.maxEnergy, 8);
        
        let msg = `⚡ *Energia*: ${player.energy}/${player.maxEnergy}\n`;
        msg += `[${bar}] ${Math.floor((player.energy/player.maxEnergy)*100)}%\n\n`;
        msg += `Regeneração: ${player.vip ? '1 a cada 3 min' : '1 a cada 6 min'}\n`;
        msg += `Compre poções de energia na loja.\n\n`;
        msg += getMainMenuText(player, ctx.from.first_name);

        await ctx.editMessageText(msg, { parse_mode: 'Markdown', ...mainMenu() });
    } catch (err) {
        console.error('Erro na energia:', err);
        await ctx.answerCbQuery('Erro ao mostrar energia.');
    }
}

module.exports = { handleEnergy };

const { getPlayerUpdated, getMainMenuText } = require('../utils/helpers');
const { giveDailyChest, savePlayer } = require('../../data/players'); // Adicionado savePlayer
const { mainMenu } = require('../menus/mainMenu');

async function handleDaily(ctx) {
    try {
        const player = getPlayerUpdated(ctx.from.id);
        const reward = giveDailyChest(player);
        
        if (!reward) {
            await ctx.answerCbQuery('🎁 Você já pegou seu baú hoje! Volte amanhã.', true);
            return;
        }

        savePlayer(ctx.from.id, player);
        
        let msg = `🎁 *Baú Diário!*\n\n💰 +${reward.gold} ouro\n🗝️ +${reward.keys} chaves`;
        if (reward.nox) msg += `\n💎 +${reward.nox} Nox`;
        
        msg += '\n\n' + getMainMenuText(player, ctx.from.first_name);
        
        await ctx.editMessageText(msg, { parse_mode: 'Markdown', ...mainMenu() });
    } catch (err) {
        console.error('Erro no baú diário:', err);
        await ctx.answerCbQuery('Erro ao abrir baú.');
    }
}

module.exports = { handleDaily };

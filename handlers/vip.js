const { getPlayerSafe, getMainMenuText } = require('../utils/helpers');
const { mainMenu } = require('../menus/mainMenu');

async function handleVip(ctx) {
    try {
        const player = getPlayerSafe(ctx.from.id);
        let msg = `💎 *VIP*\n\n`;
        const vipActive = player.vip && player.vipExpires && new Date() < new Date(player.vipExpires);
        if (vipActive) {
            const expiry = new Date(player.vipExpires).toLocaleDateString();
            msg += `✨ VIP ativo até ${expiry}\n\n`;
            msg += `*Benefícios:*\n`;
            msg += `- Energia máxima 40\n`;
            msg += `- Regeneração 1/3 min\n`;
            msg += `- +50% XP e Gold\n`;
            msg += `- +10 slots de inventário\n`;
            msg += `- Baú diário extra\n`;
        } else {
            msg += `Você não é VIP.\n\n`;
            msg += `*Benefícios:*\n`;
            msg += `- Energia máxima 40\n`;
            msg += `- Regeneração 1/3 min\n`;
            msg += `- +50% XP e Gold\n`;
            msg += `- +10 slots de inventário\n`;
            msg += `- Baú diário extra\n\n`;
            msg += `Compre VIP na loja (aba Castelo)!\n`;
        }
        await ctx.editMessageText(msg, { parse_mode: 'Markdown', ...mainMenu() });
    } catch (err) {
        console.error('Erro no VIP:', err);
        await ctx.answerCbQuery('Erro ao mostrar VIP.');
    }
}

module.exports = { handleVip };
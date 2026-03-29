const { getPlayer, savePlayer, recalculateStats } = require('../../data/players');
const { CLASSES } = require('../utils/constants');

async function handleClass(ctx) {
    const args = ctx.message.text.split(' ');
    
    if (args.length < 2) {
        return ctx.reply('❓ *Como usar:* /class [guerreiro/arqueiro/mago]', { parse_mode: 'Markdown' });
    }

    const className = args[1].toLowerCase();
    if (!CLASSES.includes(className)) {
        return ctx.reply('❌ Classe inválida! Escolha entre: guerreiro, arqueiro ou mago.');
    }

    try {
        const player = getPlayer(ctx.from.id);
        
        // Verifica se é a primeira troca ou se tem Nox suficiente
        if (!player.classChanged) {
            player.classChanged = true;
            player.class = className;
            recalculateStats(player);
            savePlayer(ctx.from.id, player);
            await ctx.reply(`✨ Classe alterada para *${className.charAt(0).toUpperCase() + className.slice(1)}*!\n(Primeira troca gratuita realizada)`);
        } else {
            if (player.nox >= 500) {
                player.nox -= 500;
                player.class = className;
                recalculateStats(player);
                savePlayer(ctx.from.id, player);
                await ctx.reply(`✅ Classe alterada para *${className.charAt(0).toUpperCase() + className.slice(1)}*!\nCusto: 💎 500 Nox.`);
            } else {
                await ctx.reply(`❌ Nox insuficientes! Você precisa de 💎 500 Nox para trocar de classe novamente.`);
            }
        }
    } catch (err) {
        console.error('Erro ao trocar classe:', err);
        await ctx.reply('Erro ao processar sua troca de classe.');
    }
}

module.exports = { handleClass };

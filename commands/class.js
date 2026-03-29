const { getPlayer, savePlayer, recalculateStats } = require('../players');
const { CLASSES } = require('../constants');

async function handleClass(ctx) {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) return ctx.reply('Use: /class guerreiro, arqueiro ou mago');
    const className = args[1].toLowerCase();
    if (!CLASSES.includes(className)) return ctx.reply('Classe inválida. Opções: guerreiro, arqueiro, mago');
    const player = getPlayer(ctx.from.id);
    if (!player.classChanged) {
        player.classChanged = true;
        player.class = className;
        recalculateStats(player);
        savePlayer(ctx.from.id, player);
        ctx.reply(`✅ Classe alterada para ${className.charAt(0).toUpperCase() + className.slice(1)}! (1ª vez grátis)`);
    } else if (player.nox >= 500) {
        player.nox -= 500;
        player.class = className;
        recalculateStats(player);
        savePlayer(ctx.from.id, player);
        ctx.reply(`✅ Classe alterada! (-500 Nox)`);
    } else {
        ctx.reply(`❌ Nox insuficientes! Mudar classe custa 500 Nox.`);
    }
}
module.exports = { handleClass };
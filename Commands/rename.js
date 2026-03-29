const { getPlayer, savePlayer } = require('../../data/players');

async function handleRename(ctx) {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        return ctx.reply('Use: /rename <novo_nome>');
    }
    const newName = args.slice(1).join(' ');
    const player = getPlayer(ctx.from.id);
    
    if (!player.renamed) {
        player.renamed = true;
        player.name = newName;
        savePlayer(ctx.from.id, player);
        ctx.reply(`✅ Nome alterado para "${newName}"! (1ª vez grátis)`);
    } else {
        if (player.nox >= 100) {
            player.nox -= 100;
            player.name = newName;
            savePlayer(ctx.from.id, player);
            ctx.reply(`✅ Nome alterado para "${newName}"! (-100 Nox)`);
        } else {
            ctx.reply(`❌ Nox insuficientes! Renomear custa 100 Nox.`);
        }
    }
}

module.exports = { handleRename };
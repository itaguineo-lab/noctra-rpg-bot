const { getPlayer, savePlayer } = require('../../data/players');

async function handleRename(ctx) {
    const args = ctx.message.text.split(' ');
    
    if (args.length < 2) {
        return ctx.reply('📝 *Uso:* /rename [seu novo nome]', { parse_mode: 'Markdown' });
    }

    const newName = args.slice(1).join(' ');
    if (newName.length > 20) return ctx.reply('❌ O nome deve ter no máximo 20 caracteres.');

    try {
        const player = getPlayer(ctx.from.id);
        
        if (!player.renamed) {
            player.renamed = true;
            player.name = newName;
            savePlayer(ctx.from.id, player);
            await ctx.reply(`✅ Nome alterado para *"${newName}"*!\n(Primeira troca gratuita)`);
        } else {
            if (player.nox >= 100) {
                player.nox -= 100;
                player.name = newName;
                savePlayer(ctx.from.id, player);
                await ctx.reply(`✅ Nome alterado para *"${newName}"*!\nCusto: 💎 100 Nox.`);
            } else {
                await ctx.reply('❌ Você não tem 💎 100 Nox para renomear seu personagem.');
            }
        }
    } catch (err) {
        console.error('Erro no comando rename:', err);
        await ctx.reply('Erro ao tentar renomear seu personagem.');
    }
}

module.exports = { handleRename };

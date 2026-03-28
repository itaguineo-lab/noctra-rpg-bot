const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const { getPlayer } = require('./players');
const { updateEnergy, useEnergy } = require('./energy');
const { randomEnemy, fightTurn } = require('./combat');
const { checkLevelUp, xpToNext } = require('./level');
const { progressBar } = require('./utils');
const { generateItem } = require('./items');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Servidor para manter o bot acordado (Replit)
const app = express();
app.get('/', (req, res) => res.send('Nocta Online!'));
app.listen(process.env.PORT || 3000);

// Menu principal
function mainMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ Caçar', 'hunt')],
        [Markup.button.callback('🎒 Inventário', 'inventory')],
        [Markup.button.callback('👤 Perfil', 'profile')],
        [Markup.button.callback('⚡ Energia', 'energy')]
    ]);
}

// Comando /start
bot.start(async (ctx) => {
    const player = getPlayer(ctx.from.id);
    updateEnergy(player);
    await ctx.reply(
        `🌙 *Bem-vindo a Nocta, ${ctx.from.first_name}!*\n\n` +
        `Você é um aventureiro em um mundo de noite eterna.\n` +
        `Use os botões para explorar.`,
        { parse_mode: 'Markdown', ...mainMenu() }
    );
});

// Ação de caçar
bot.action('hunt', async (ctx) => {
    const player = getPlayer(ctx.from.id);
    updateEnergy(player);
    
    if (!useEnergy(player)) {
        return ctx.editMessageText('⚠️ Energia insuficiente! Aguarde a regeneração.', mainMenu());
    }

    const enemy = randomEnemy(player.level);
    // Aqui você precisa gerenciar o estado de combate (session)
    // Por enquanto, vamos só simular um turno
    const result = fightTurn(player, enemy);
    
    if (result.win === true) {
        // Ganhou: ganha XP, ouro, chance de drop
        player.xp += enemy.exp;
        player.gold += enemy.gold;
        const levelUp = checkLevelUp(player);
        let msg = `✅ Você derrotou ${enemy.name}!\n💰 +${enemy.gold} ouro\n✨ +${enemy.exp} XP\n`;
        if (levelUp) msg += `🎉 *UP! Agora nível ${player.level}!* 🎉\n`;
        await ctx.editMessageText(msg, mainMenu());
    } else if (result.win === false) {
        // Morreu: perder algo? ou só resetar HP
        player.hp = player.maxHp;
        await ctx.editMessageText(`💀 Você foi derrotado por ${enemy.name}...\nSeu HP foi restaurado.`, mainMenu());
    } else {
        // Combate contínuo (aqui você deveria guardar estado e mostrar opções)
        await ctx.editMessageText(result.message + '\n\n[Combate em andamento...]', mainMenu());
    }
});

// Outros actions: inventory, profile, energy
// ...

bot.launch();
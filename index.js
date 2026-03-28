const { getPlayer } = require('./players');
const { updateEnergy, useEnergy } = require('./energy');
const { fight } = require('./combat');

const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);

const app = express();

app.get('/', (req, res) => {
  res.send('NOCTRA RPG ONLINE');
});

app.listen(process.env.PORT || 3000);

// MENU

bot.start((ctx) => {
  ctx.reply(
    '🌑 NOCTRA RPG\n\nEscolha sua ação:',
    Markup.inlineKeyboard([
      [Markup.button.callback('⚔️ Caçar', 'hunt')],
      [Markup.button.callback('🧭 Explorar', 'explore')],
      [Markup.button.callback('👤 Status', 'status')],
    ])
  );
});

// AÇÕES

bot.action('hunt', async (ctx) => {
  await ctx.answerCbQuery();

  const player = getPlayer(ctx.from.id);

  updateEnergy(player);

  if (!useEnergy(player)) {
    return ctx.reply('❌ Sem energia! Aguarde regenerar.');
  }

  const result = fight(player);

  if (result.result === 'win') {
    ctx.reply(
      `⚔️ Você derrotou ${result.enemy}!\n\n💰 +${result.gold} gold\n✨ +${result.xp} XP`
    );
  } else {
    ctx.reply(`💀 Você foi derrotado por ${result.enemy}`);
  }
});

bot.action('explore', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply('🧭 Explorando...');
});

bot.action('status', async (ctx) => {
  await ctx.answerCbQuery();

  const player = getPlayer(ctx.from.id);
  updateEnergy(player);

  ctx.reply(
    `👤 STATUS\n\n❤️ HP: ${player.hp}/${player.maxHp}\n⚔️ ATK: ${player.atk}\n🛡️ DEF: ${player.def}\n\n⚡ Energia: ${player.energy}/20\n💰 Gold: ${player.gold}\n✨ XP: ${player.xp}`
  );
});

bot.launch();
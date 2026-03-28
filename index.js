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
  ctx.reply('⚔️ Você encontrou um inimigo!');
});

bot.action('explore', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply('🧭 Explorando...');
});

bot.action('status', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply('👤 HP: 100 | ATK: 10 | DEF: 5');
});

bot.launch();
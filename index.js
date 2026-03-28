const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const { getPlayer } = require('./players');
const { updateEnergy, useEnergy } = require('./energy');
const { fight } = require('./combat');
const { checkLevelUp, xpToNext } = require('./level');
const { progressBar } = require('./utils');

const bot = new Telegraf(process.env.BOT_TOKEN);

// servidor (Render)
const app = express();
app.get('/', (req, res) => res.send('NOCTRA ONLINE'));
app.listen(process.env.PORT || 3000);

// ================= MENU =================

function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ Caçar', 'hunt')],
    [Markup.button.callback('👤 Status', 'status')]
  ]);
}

bot.start((ctx) => {
  ctx.reply('🌑 NOCTRA RPG\n\nEscolha uma ação:', mainMenu());
});

// ================= CAÇAR =================

bot.action('hunt', async (ctx) => {
  await ctx.answerCbQuery();

  const player = getPlayer(ctx.from.id);
  updateEnergy(player);

  if (!useEnergy(player)) {
    return ctx.editMessageText(
      '❌ Sem energia!\n\nAguarde regenerar.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🏠 Menu', 'menu')]
      ])
    );
  }

  const result = fight(player);
  const leveledUp = checkLevelUp(player);
  const xpMax = xpToNext(player.level);

  let msg = `⚔️ COMBATE\n\n`;

  if (result.result === 'win') {
    msg += `🏆 Vitória contra ${result.enemy}\n\n`;
    msg += `✨ +${result.xp} XP\n💰 +${result.gold} Gold\n\n`;
  } else {
    msg += `💀 Derrota para ${result.enemy}\n\n`;
  }

  msg += `📊 Level ${player.level}\n`;
  msg += progressBar(player.xp, xpMax) + `\n`;
  msg += `${player.xp}/${xpMax} XP\n\n`;

  msg += `❤️ HP: ${player.hp}/${player.maxHp}\n`;
  msg += `⚡ Energia: ${player.energy}/20`;

  if (leveledUp) {
    msg += `\n\n🔥 LEVEL UP!`;
  }

  ctx.editMessageText(
    msg,
    Markup.inlineKeyboard([
      [Markup.button.callback('⚔️ Caçar novamente', 'hunt')],
      [Markup.button.callback('🏠 Menu', 'menu')]
    ])
  );
});

// ================= STATUS =================

bot.action('status', async (ctx) => {
  await ctx.answerCbQuery();

  const player = getPlayer(ctx.from.id);
  updateEnergy(player);

  const xpMax = xpToNext(player.level);

  const msg =
    `👤 PERSONAGEM\n\n` +
    `📊 Level: ${player.level}\n` +
    progressBar(player.xp, xpMax) + `\n` +
    `${player.xp}/${xpMax} XP\n\n` +
    `❤️ HP: ${player.hp}/${player.maxHp}\n` +
    `⚔️ ATK: ${player.atk}\n` +
    `🛡️ DEF: ${player.def}\n\n` +
    `⚡ Energia: ${player.energy}/20\n` +
    `💰 Gold: ${player.gold}`;

  ctx.editMessageText(
    msg,
    Markup.inlineKeyboard([
      [Markup.button.callback('⚔️ Caçar', 'hunt')],
      [Markup.button.callback('🏠 Menu', 'menu')]
    ])
  );
});

// ================= MENU =================

bot.action('menu', async (ctx) => {
  await ctx.answerCbQuery();

  ctx.editMessageText(
    '🌑 NOCTRA RPG\n\nEscolha uma ação:',
    mainMenu()
  );
});

bot.launch();
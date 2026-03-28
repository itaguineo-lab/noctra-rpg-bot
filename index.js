const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const { getPlayer } = require('./players');
const { updateEnergy, useEnergy } = require('./energy');
const { fight } = require('./combat');
const { checkLevelUp, xpToNext } = require('./level');
const { progressBar } = require('./utils');
const { generateItem } = require('./items');

const bot = new Telegraf(process.env.BOT_TOKEN);

// servidor
const app = express();
app.get('/', (req, res) => res.send('NOCTRA ONLINE'));
app.listen(process.env.PORT || 3000);

// MENU

function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ Caçar', 'hunt')],
    [Markup.button.callback('🎒 Inventário', 'inventory')],
    [Markup.button.callback('👤 Status', 'status')]
  ]);
}

bot.start((ctx) => {
  ctx.reply('🌑 NOCTRA RPG\n\nEscolha uma ação:', mainMenu());
});

// CAÇAR

bot.action('hunt', async (ctx) => {
  await ctx.answerCbQuery();

  const player = getPlayer(ctx.from.id);
  updateEnergy(player);

  if (!useEnergy(player)) {
    return ctx.editMessageText(
      '❌ Sem energia!',
      Markup.inlineKeyboard([[Markup.button.callback('🏠 Menu', 'menu')]])
    );
  }

  const result = fight(player);
  const leveledUp = checkLevelUp(player);
  const xpMax = xpToNext(player.level);

  let msg = `⚔️ COMBATE\n\n`;

  if (result.result === 'win') {
    msg += `🏆 Vitória contra ${result.enemy}\n\n`;
    msg += `✨ +${result.xp} XP\n💰 +${result.gold} Gold\n`;

    if (Math.random() < 0.5) {
  if (player.inventory.length >= player.maxInventory) {
    msg += `\n🎒 Inventário cheio!`;
  } else {
    const item = generateItem(player.level);
    player.inventory.push(item);

    msg += `\n🎁 Item encontrado!\n`;
    msg += `${item.emoji} ${item.name} (+${item.atk} ATK)\n`;
  }

    msg += `\n`;
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
      [Markup.button.callback('🎒 Inventário', 'inventory')],
      [Markup.button.callback('🏠 Menu', 'menu')]
    ])
  );
});

// INVENTÁRIO

bot.action('inventory', async (ctx) => {
  await ctx.answerCbQuery();

`🎒 Inventário: ${player.inventory.length}/${player.maxInventory}\n`

  const player = getPlayer(ctx.from.id);

  if (player.inventory.length === 0) {
    return ctx.editMessageText(
      '🎒 Inventário vazio',
      Markup.inlineKeyboard([[Markup.button.callback('🏠 Menu', 'menu')]])
    );
  }

  let buttons = player.inventory.map((item, i) => [
    Markup.button.callback(
      `${item.emoji} ${item.name} (+${item.atk}) 💰${item.price}`,
      `item_${i}`
    )
  ]);

  buttons.push([Markup.button.callback('🏠 Menu', 'menu')]);

  ctx.editMessageText(
    `🎒 Inventário (${player.inventory.length}/${player.maxInventory})`,
    Markup.inlineKeyboard(buttons)
  );
});

// EQUIPAR

bot.action(/equip_(.+)/, async (ctx) => {
  await ctx.answerCbQuery();

  const index = ctx.match[1];
  const player = getPlayer(ctx.from.id);

  const item = player.inventory[index];
  if (!item) return;

  player.weapon = item;

  ctx.editMessageText(
    `⚔️ Equipado:\n\n${item.emoji} ${item.name}\n+${item.atk} ATK`,
    Markup.inlineKeyboard([[Markup.button.callback('🏠 Menu', 'menu')]])
  );
});

// STATUS

bot.action('status', async (ctx) => {
  await ctx.answerCbQuery();

  const player = getPlayer(ctx.from.id);
  updateEnergy(player);

  const xpMax = xpToNext(player.level);

  ctx.editMessageText(
    `👤 PERSONAGEM\n\n` +
    `📊 Level: ${player.level}\n` +
    progressBar(player.xp, xpMax) + `\n` +
    `${player.xp}/${xpMax} XP\n\n` +
    `❤️ HP: ${player.hp}/${player.maxHp}\n` +
    `⚔️ ATK: ${player.atk + (player.weapon ? player.weapon.atk : 0)}\n` +
    `🛡️ DEF: ${player.def}\n\n` +
    `⚡ Energia: ${player.energy}/20\n` +
    `💰 Gold: ${player.gold}`,
    Markup.inlineKeyboard([
      [Markup.button.callback('⚔️ Caçar', 'hunt')],
      [Markup.button.callback('🎒 Inventário', 'inventory')],
      [Markup.button.callback('🏠 Menu', 'menu')]
    ])
  );
});

// MENU

bot.action('menu', async (ctx) => {
  await ctx.answerCbQuery();

  ctx.editMessageText(
    '🌑 NOCTRA RPG\n\nEscolha uma ação:',
    mainMenu()
  );

bot.action(/item_(.+)/, async (ctx) => {
  await ctx.answerCbQuery();

  const index = ctx.match[1];
  const player = getPlayer(ctx.from.id);
  const item = player.inventory[index];

  if (!item) return;

  ctx.editMessageText(
    `${item.emoji} ${item.name}\n\n⚔️ ATK: +${item.atk}\n💰 Valor: ${item.price}`,
    Markup.inlineKeyboard([
      [Markup.button.callback('⚔️ Equipar', `equip_${index}`)],
      [Markup.button.callback('💰 Vender', `sell_${index}`)],
      [Markup.button.callback('⬅️ Voltar', 'inventory')]
    ])

bot.action(/sell_(.+)/, async (ctx) => {
  await ctx.answerCbQuery();

  const index = ctx.match[1];
  const player = getPlayer(ctx.from.id);

  const item = player.inventory[index];
  if (!item) return;

  player.gold += item.price;
  player.inventory.splice(index, 1);

  ctx.editMessageText(
    `💰 Item vendido!\n+${item.price} Gold`,
    Markup.inlineKeyboard([
      [Markup.button.callback('🎒 Inventário', 'inventory')],
      [Markup.button.callback('🏠 Menu', 'menu')]
    ])
  );
  );
});

bot.launch();

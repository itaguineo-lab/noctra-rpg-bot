require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const express = require('express');

// Inicialização do Bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Utils e Helpers
const { getPlayerSafe, getMainMenuText } = require('./src/utils/helpers');

// Menus
const { mainMenu } = require('./src/menus/mainMenu');

// Handlers (Importando da nova estrutura)
const { 
    handleHunt, 
    handleCombatAttack, 
    handleCombatFlee, 
    handleCombatItems, 
    handleCombatSouls, 
    handleUseSoul,
    handleUseConsumable 
} = require('./src/handlers/combat');

const { 
    handleInventory, 
    handleInvWeapons, 
    handleInvArmors, 
    handleInvSouls 
} = require('./src/handlers/inventory');

const { handleShop, handleBuy, handleShopVillage, handleShopCastle } = require('./src/handlers/shop');
const { handleTravel, handleTravelTo } = require('./src/handlers/travel');
const { handleProfile } = require('./src/handlers/profile');
const { handleDaily } = require('./src/handlers/daily');
const { handleVip } = require('./src/handlers/vip');
const { handleEnergy } = require('./src/handlers/energy');

// Comandos de Texto
const { handleRename } = require('./src/commands/rename');
const { handleClass } = require('./src/commands/class');
const { handleEquip } = require('./src/commands/equip');

// ========== CONFIGURAÇÃO DE COMANDOS ==========
bot.start(async (ctx) => {
    const player = getPlayerSafe(ctx.from.id, ctx.from.first_name);
    await ctx.reply(getMainMenuText(player, ctx.from.first_name), {
        parse_mode: 'Markdown',
        ...mainMenu()
    });
});

bot.command('rename', handleRename);
bot.command('class', handleClass);
bot.command('equip', handleEquip);

// ========== ACTION HANDLERS (CALLBACK QUERIES) ==========

// Menu Principal e Navegação
bot.action('menu', async (ctx) => {
    const player = getPlayerSafe(ctx.from.id);
    await ctx.editMessageText(getMainMenuText(player, ctx.from.first_name), {
        parse_mode: 'Markdown',
        ...mainMenu()
    });
});

// Combate
bot.action('hunt', handleHunt);
bot.action('combat_attack', handleCombatAttack);
bot.action('combat_flee', handleCombatFlee);
bot.action('combat_items', handleCombatItems);
bot.action('combat_souls', handleCombatSouls);
bot.action(/^use_soul_(.+)$/, handleUseSoul);
bot.action(/^use_potion_(.+)$/, handleUseConsumable);

// Inventário
bot.action('inventory', handleInventory);
bot.action('inv_weapons', handleInvWeapons);
bot.action('inv_armors', handleInvArmors);
bot.action('inv_souls', handleInvSouls);

// Loja e Economia
bot.action('shop', handleShop);
bot.action('shop_village', handleShopVillage);
bot.action('shop_castle', handleShopCastle);
bot.action(/^buy_(.+)$/, handleBuy);

// Viagem e Perfil
bot.action('travel', handleTravel);
bot.action(/^travel_to_(.+)$/, handleTravelTo);
bot.action('profile', handleProfile);
bot.action('vip', handleVip);
bot.action('daily', handleDaily);
bot.action('energy', handleEnergy);

// Servidor Express para manter o bot vivo (opcional para hosts como Render/Heroku)
const app = express();
app.get('/', (req, res) => res.send('Noctra RPG Bot Ativo!'));
app.listen(process.env.PORT || 3000);

bot.launch().then(() => console.log('🌙 Noctra RPG inicializado com sucesso!'));

// Handle de encerramento gracioso
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

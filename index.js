require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');

// ================== VALIDAÇÃO DE AMBIENTE ==================
if (!process.env.BOT_TOKEN) {
    throw new Error('❌ BOT_TOKEN não configurado no Render / .env');
}

// ================== INICIALIZAÇÃO ==================
const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 3000;

// ================== IMPORTS ==================

// Utils
const { getPlayerSafe, getMainMenuText } = require('./src/utils/helpers');

// Menus
const { mainMenu } = require('./src/menus/mainMenu');

// Handlers
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

const {
    handleShop,
    handleBuy,
    handleShopVillage,
    handleShopCastle
} = require('./src/handlers/shop');

const { handleTravel, handleTravelTo } = require('./src/handlers/travel');
const { handleProfile } = require('./src/handlers/profile');
const { handleDaily } = require('./src/handlers/daily');
const { handleVip } = require('./src/handlers/vip');
const { handleEnergy } = require('./src/handlers/energy');

// Commands
const { handleRename } = require('./src/commands/rename');
const { handleClass } = require('./src/commands/class');
const { handleEquip } = require('./src/commands/equip');

// ================== HELPERS ==================
async function safeEditOrReply(ctx, text, options = {}) {
    try {
        if (ctx.callbackQuery?.message) {
            await ctx.editMessageText(text, options);
        } else {
            await ctx.reply(text, options);
        }
    } catch (error) {
        console.error('⚠️ Falha ao editar mensagem, enviando nova:', error.message);

        try {
            await ctx.reply(text, options);
        } catch (replyError) {
            console.error('❌ Falha ao responder:', replyError.message);
        }
    }
}

// ================== START ==================
bot.start(async (ctx) => {
    try {
        const player = getPlayerSafe(ctx.from.id, ctx.from.first_name);

        await ctx.reply(
            getMainMenuText(player, ctx.from.first_name),
            {
                parse_mode: 'Markdown',
                ...mainMenu()
            }
        );
    } catch (error) {
        console.error('❌ Erro no /start:', error);
        await ctx.reply('⚠️ Erro ao iniciar o Noctra.');
    }
});

// ================== COMMANDS ==================
bot.command('rename', handleRename);
bot.command('class', handleClass);
bot.command('equip', handleEquip);

// ================== MENU PRINCIPAL ==================
bot.action('menu', async (ctx) => {
    try {
        const player = getPlayerSafe(ctx.from.id);

        await safeEditOrReply(
            ctx,
            getMainMenuText(player, ctx.from.first_name),
            {
                parse_mode: 'Markdown',
                ...mainMenu()
            }
        );
    } catch (error) {
        console.error('❌ Erro no menu:', error);
    }
});

// ================== COMBATE ==================
bot.action('hunt', handleHunt);
bot.action('combat_attack', handleCombatAttack);
bot.action('combat_flee', handleCombatFlee);
bot.action('combat_items', handleCombatItems);
bot.action('combat_souls', handleCombatSouls);
bot.action(/^use_soul_(.+)$/, handleUseSoul);
bot.action(/^use_potion_(.+)$/, handleUseConsumable);

// ================== INVENTÁRIO ==================
bot.action('inventory', handleInventory);
bot.action('inv_weapons', handleInvWeapons);
bot.action('inv_armors', handleInvArmors);
bot.action('inv_souls', handleInvSouls);

// ================== LOJA ==================
bot.action('shop', handleShop);
bot.action('shop_village', handleShopVillage);
bot.action('shop_castle', handleShopCastle);
bot.action(/^buy_(.+)$/, handleBuy);

// ================== OUTROS ==================
bot.action('travel', handleTravel);
bot.action(/^travel_to_(.+)$/, handleTravelTo);
bot.action('profile', handleProfile);
bot.action('vip', handleVip);
bot.action('daily', handleDaily);
bot.action('energy', handleEnergy);

// ================== ERRO GLOBAL ==================
bot.catch(async (error, ctx) => {
    console.error('❌ Erro global do bot:', error);

    try {
        await ctx.reply('⚠️ Ocorreu um erro interno no Noctra.');
    } catch (replyError) {
        console.error('❌ Falha ao enviar erro ao usuário:', replyError);
    }
});

// ================== EXPRESS / RENDER ==================
app.get('/', (req, res) => {
    res.status(200).send('🌙 Noctra RPG Bot Ativo');
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'online',
        bot: 'Noctra',
        uptime: process.uptime()
    });
});

app.listen(PORT, () => {
    console.log(`🌐 Servidor web ativo na porta ${PORT}`);
});

// ================== BOT LAUNCH ==================
bot.launch()
    .then(() => {
        console.log('🌙 Noctra RPG inicializado com sucesso!');
    })
    .catch((error) => {
        console.error('❌ Falha ao iniciar bot:', error);
        process.exit(1);
    });

// ================== SHUTDOWN ==================
process.once('SIGINT', () => {
    console.log('🛑 Encerrando bot...');
    bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
    console.log('🛑 Encerrando bot...');
    bot.stop('SIGTERM');
});
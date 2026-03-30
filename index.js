require('dotenv').config();

const { Telegraf } = require('telegraf');

// ===== HANDLERS =====
const {
    handleHunt,
    handleAttack,
    handleFlee
} = require('./src/handlers/combat');

const {
    handleProfile
} = require('./src/handlers/profile');

const {
    handleInventory
} = require('./src/handlers/inventory');

const {
    handleShop
} = require('./src/handlers/shop');

const {
    handleTravel
} = require('./src/handlers/travel');

// ===== MENUS =====
const {
    mainMenu
} = require('./src/menus/mainMenu');

// ===== BOT =====
const bot = new Telegraf(process.env.BOT_TOKEN);

// ===== START =====
bot.start(async (ctx) => {
    await ctx.reply(
        `🌑 *Bem-vindo ao Noctra RPG*\n\n` +
        `Seu destino começa agora.\n` +
        `Escolha sua próxima ação:`,
        {
            parse_mode: 'Markdown',
            ...mainMenu()
        }
    );
});

// ===== COMMANDS =====
bot.command('hunt', handleHunt);
bot.command('profile', handleProfile);
bot.command('inventory', handleInventory);
bot.command('shop', handleShop);
bot.command('travel', handleTravel);

// ===== MENU ACTIONS =====
bot.action('hunt', handleHunt);
bot.action('attack', handleAttack);
bot.action('flee', handleFlee);

bot.action('profile', handleProfile);
bot.action('inventory', handleInventory);
bot.action('shop', handleShop);
bot.action('travel', handleTravel);

// ===== GLOBAL ERROR HANDLER =====
bot.catch((err, ctx) => {
    console.error('❌ Erro no bot:', err);

    try {
        ctx.reply('❌ Ocorreu um erro interno no Noctra.');
    } catch (e) {
        console.error('Erro ao responder usuário:', e);
    }
});

// ===== LAUNCH =====
bot.launch()
    .then(() => {
        console.log('✅ Noctra RPG online');
    })
    .catch((err) => {
        console.error('❌ Falha ao iniciar bot:', err);
    });

// ===== SAFE SHUTDOWN =====
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
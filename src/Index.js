const { Telegraf, Markup } = require('telegraf');
const express = require('express');

// Data
const { getPlayer, savePlayer, giveDailyKeys } = require('../data/players');
const { updateEnergy } = require('../data/energy');

// Utils
const { getPlayerUpdated, getPlayerSafe, getMainMenuText } = require('./utils/helpers');

// Menus
const { mainMenu } = require('./menus/mainMenu');

// Commands
const { handleClass } = require('./commands/class');
const { handleRename } = require('./commands/rename');
const { handleEquip, handleEquipSoul } = require('./commands/equip');

// Handlers
const { 
    activeFights, 
    handleHunt, 
    handleCombatAttack, 
    handleCombatFlee, 
    handleCombatItems, 
    handleCombatSouls, 
    handleUseSoul,
    handleUseConsumable
} = require('./handlers/combat');
const { 
    handleInventory, 
    handleInvWeapons, 
    handleInvArmors, 
    handleInvJewelry, 
    handleInvConsumables, 
    handleInvSouls, 
    handleInvSkins 
} = require('./handlers/inventory');
const { 
    handleShop, 
    handleShopVillage, 
    handleShopCastle, 
    handleShopArena, 
    handleBuy 
} = require('./handlers/shop');
const { 
    handleTravel, 
    handleTravelTo, 
    handleTravelLocked 
} = require('./handlers/travel');
const { 
    handleProfile, 
    handleRenameAction, 
    handleChangeClassAction 
} = require('./handlers/profile');
const { handleEnergy } = require('./handlers/energy');
const { handleVip } = require('./handlers/vip');
const { handleDaily } = require('./handlers/daily');
const { handleOnline } = require('./handlers/online');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Servidor para manter o bot acordado
const app = express();
app.get('/', (req, res) => res.send('Noctra Online!'));
app.listen(process.env.PORT || 3000);

// ========== COMANDOS ==========
bot.start(async (ctx) => {
    try {
        const player = getPlayerUpdated(ctx.from.id);
        giveDailyKeys(player);
        savePlayer(ctx.from.id, player);
        await ctx.reply(
            getMainMenuText(player, ctx.from.first_name),
            { parse_mode: 'Markdown', ...mainMenu() }
        );
    } catch (err) {
        console.error('Erro no start:', err);
        await ctx.reply('❌ Erro ao iniciar. Tente novamente.');
    }
});

bot.command('class', handleClass);
bot.command('rename', handleRename);
bot.command(/^equip_(\d+)/, handleEquip);
bot.command(/^equip_soul_(\d+)/, handleEquipSoul);

// ========== AÇÕES DO MENU ==========
bot.action('hunt', handleHunt);
bot.action('combat_attack', handleCombatAttack);
bot.action('combat_flee', handleCombatFlee);
bot.action('combat_items', handleCombatItems);
bot.action('combat_souls', handleCombatSouls);
bot.action('combat_back', async (ctx) => {
    const fight = activeFights.get(ctx.from.id);
    if (!fight || fight.ended) {
        const player = getPlayerSafe(ctx.from.id);
        return ctx.editMessageText(getMainMenuText(player, ctx.from.first_name), { parse_mode: 'Markdown', ...mainMenu() });
    }
    const { combatMenu } = require('./menus/combatMenu');
    const msg = `❤️ Seu HP: ${fight.player.hp}/${fight.player.maxHp}\n` +
                `🐺 HP inimigo: ${fight.enemy.hp}/${fight.enemy.maxHp}\n` +
                `🌀 Turno: ${fight.turn + 1}\n\n` +
                `Escolha sua ação:`;
    await ctx.editMessageText(msg, combatMenu());
});
bot.action(/^use_soul_(.+)$/, handleUseSoul);
bot.action(/^use_potion_hp$/, (ctx) => handleUseConsumable(ctx, 'potionHp', (fight) => {
    const heal = 50;
    fight.player.hp = Math.min(fight.player.maxHp, fight.player.hp + heal);
    return `💚 Você usou Poção de Vida e curou *${heal}* HP!`;
}));
bot.action(/^use_potion_energy$/, (ctx) => handleUseConsumable(ctx, 'potionEnergy', (fight, player) => {
    player.energy = Math.min(player.maxEnergy, player.energy + 15);
    savePlayer(ctx.from.id, player);
    return `🔋 Você usou Poção de Energia e recuperou *15* energia!`;
}));
bot.action(/^use_tonic_strength$/, (ctx) => handleUseConsumable(ctx, 'tonicStrength', (fight) => {
    fight.player.buffAtk = { value: 20, duration: 3 };
    return `💪 Tônico de Força ativado! +20% ATK por 3 turnos.`;
}));
bot.action(/^use_tonic_defense$/, (ctx) => handleUseConsumable(ctx, 'tonicDefense', (fight) => {
    fight.player.buffDef = { value: 20, duration: 3 };
    return `🛡️ Tônico de Defesa ativado! +20% DEF por 3 turnos.`;
}));
bot.action(/^use_tonic_precision$/, (ctx) => handleUseConsumable(ctx, 'tonicPrecision', (fight) => {
    fight.player.buffCrit = { value: 15, duration: 3 };
    return `🎯 Tônico de Precisão ativado! +15% CRIT por 3 turnos.`;
}));

// Inventário
bot.action('inventory', handleInventory);
bot.action('inv_weapons', handleInvWeapons);
bot.action('inv_armors', handleInvArmors);
bot.action('inv_jewelry', handleInvJewelry);
bot.action('inv_consumables', handleInvConsumables);
bot.action('inv_souls', handleInvSouls);
bot.action('inv_skins', handleInvSkins);

// Perfil
bot.action('profile', handleProfile);
bot.action('rename_action', handleRenameAction);
bot.action('change_class_action', handleChangeClassAction);

// Loja
bot.action('shop', handleShop);
bot.action('shop_village', handleShopVillage);
bot.action('shop_castle', handleShopCastle);
bot.action('shop_arena', handleShopArena);
bot.action(/^buy_(.+)$/, handleBuy);

// Viajar
bot.action('travel', handleTravel);
bot.action(/^travel_to_(.+)$/, handleTravelTo);
bot.action('travel_locked', handleTravelLocked);

// Outros
bot.action('energy', handleEnergy);
bot.action('vip', handleVip);
bot.action('daily', handleDaily);
bot.action('online', handleOnline);

// Em breve
['dungeon', 'arena', 'guild'].forEach(action => {
    bot.action(action, async (ctx) => {
        await ctx.answerCbQuery('🚧 Em breve na Fase 3!', true);
    });
});

// Voltar ao menu
bot.action('menu', async (ctx) => {
    try {
        const player = getPlayerSafe(ctx.from.id);
        await ctx.editMessageText(getMainMenuText(player, ctx.from.first_name), { parse_mode: 'Markdown', ...mainMenu() });
    } catch (err) {
        console.error('Erro ao voltar:', err);
        await ctx.reply('Erro ao voltar ao menu.');
    }
});

bot.launch();
console.log('Noctra iniciado com sucesso!');
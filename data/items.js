const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const { getPlayer, savePlayer, recalculateStats, giveDailyKeys, giveDailyChest } = require('./players');
const { updateEnergy, useEnergy } = require('./energy');
const { getRandomEnemy, getMap, getMapByName, maps } = require('./maps');
const { startCombat, playerAttack, playerFlee, canUseSoul, useSoul, applyBuff } = require('./combat');
const { checkLevelUp, xpToNext } = require('./level');
const { progressBar, formatNumber } = require('./utils');
const { generateItem } = require('./items');
const { dropSoul, formatSoulName, getRarityEmoji } = require('./souls');
const { villageItems, castleItems, arenaItems } = require('./shop');

const bot = new Telegraf(process.env.BOT_TOKEN);
const activeFights = new Map();

// Servidor
const app = express();
app.get('/', (req, res) => res.send('Noctra Online!'));
app.listen(process.env.PORT || 3000);

// ========== FUNÇÕES AUXILIARES ==========
function getPlayerUpdated(id) {
    const player = getPlayer(id);
    updateEnergy(player);
    return player;
}

function getPlayerSafe(id) {
    const player = getPlayer(id);
    updateEnergy(player);
    recalculateStats(player);
    return player;
}

function getRarityColor(rarity) {
    const colors = {
        'Comum': '⚪', 'Incomum': '🟢', 'Raro': '🔵',
        'Épico': '🟣', 'Lendário': '🟡', 'Mítico': '🔴'
    };
    return colors[rarity] || '⚪';
}

function formatItemName(item) {
    return `${getRarityColor(item.rarity)} *${item.name}*`;
}

function getActiveEvents() {
    const events = [];
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();
    if (month >= 2 && month <= 5) events.push('🍂 Outono');
    if ((month === 2 && day >= 20) || (month === 3 && day <= 10)) events.push('🐣 Páscoa');
    if (Math.random() < 0.125) events.push('🌕 Lua Cheia');
    return events;
}

// Multiplicador de XP e gold baseado em eventos e VIP
function getRewardMultipliers(player) {
    let xpMult = 1.0;
    let goldMult = 1.0;
    const events = getActiveEvents();
    if (events.includes('🍂 Outono')) { goldMult += 0.2; xpMult += 0.1; }
    if (events.includes('🐣 Páscoa')) { xpMult += 0.2; goldMult += 0.1; }
    if (events.includes('🌕 Lua Cheia')) { xpMult += 0.3; goldMult += 0.3; }
    if (player.vip && player.vipExpires && new Date() < new Date(player.vipExpires)) {
        xpMult += 0.5;
        goldMult += 0.5;
    }
    return { xpMult, goldMult };
}

function getMainMenuText(player, username = null) {
    const xpNeeded = xpToNext(player.level);
    const xpPercent = Math.floor((player.xp / xpNeeded) * 100);
    const xpBar = progressBar(player.xp, xpNeeded, 8);
    const hpBar = progressBar(player.hp, player.maxHp, 8);
    const energyBar = progressBar(player.energy, player.maxEnergy, 8);
    const events = getActiveEvents();
    const eventText = events.length > 0 ? events.join(' | ') : 'Nenhum';
    const vipActive = player.vip && player.vipExpires && new Date() < new Date(player.vipExpires);
    const vipText = vipActive ? `✨ VIP até ${new Date(player.vipExpires).toLocaleDateString()}\n` : '';
    const nameDisplay = player.name || username || 'Aventureiro';

    return (
        `🌙 *Noctra*\n\n` +
        `*${nameDisplay}* (${player.class.charAt(0).toUpperCase() + player.class.slice(1)})\n` +
        `Nv. ${player.level} | XP: ${formatNumber(player.xp)} (Faltam: ${formatNumber(xpNeeded - player.xp)})\n` +
        `[${xpBar}] ${xpPercent}%\n\n` +
        `❤️ HP: ${player.hp}/${player.maxHp}\n` +
        `[${hpBar}] ${Math.floor((player.hp/player.maxHp)*100)}%\n` +
        `⚡ Energia: ${player.energy}/${player.maxEnergy}\n` +
        `[${energyBar}] ${Math.floor((player.energy/player.maxEnergy)*100)}%\n\n` +
        `⚔️ ATK ${player.atk} | 🛡️ DEF ${player.def} | ✨ CRIT ${player.crit}%\n\n` +
        `🎉 EVENTOS: ${eventText}\n` +
        `${vipText}` +
        `🗝️ Chaves: ${player.keys}\n` +
        `💎 Nox: ${player.nox}\n` +
        `💰 Gold: ${formatNumber(player.gold)}\n` +
        `🗺️ Mapa: ${getMap(player).name} (Lv ${getMap(player).level})`
    );
}

// ========== MENUS ==========
function mainMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ Caçar', 'hunt'), Markup.button.callback('🗺️ Viajar', 'travel')],
        [Markup.button.callback('🎒 Inventário', 'inventory'), Markup.button.callback('👤 Perfil', 'profile')],
        [Markup.button.callback('🛒 Loja', 'shop'), Markup.button.callback('🏛️ Masmorra', 'dungeon')],
        [Markup.button.callback('🏆 Arena', 'arena'), Markup.button.callback('🤝 Guilda', 'guild')],
        [Markup.button.callback('⚡ Energia', 'energy'), Markup.button.callback('💎 VIP', 'vip')],
        [Markup.button.callback('🎁 Baú Diário', 'daily'), Markup.button.callback('👥 Online', 'online')]
    ]);
}

function combatMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ Atacar', 'combat_attack')],
        [Markup.button.callback('🧪 Consumíveis', 'combat_items')],
        [Markup.button.callback('💀 Almas', 'combat_souls')],
        [Markup.button.callback('🏃 Fugir', 'combat_flee')]
    ]);
}

function consumablesMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('💚 Poção de Vida', 'use_potion_hp')],
        [Markup.button.callback('🔋 Poção de Energia', 'use_potion_energy')],
        [Markup.button.callback('💪 Tônico de Força', 'use_tonic_strength')],
        [Markup.button.callback('🛡️ Tônico de Defesa', 'use_tonic_defense')],
        [Markup.button.callback('🎯 Tônico de Precisão', 'use_tonic_precision')],
        [Markup.button.callback('◀️ Voltar', 'combat_back')]
    ]);
}

function soulsMenu(fight) {
    const buttons = [];
    for (const soul of fight.player.souls) {
        if (soul) {
            const canUse = canUseSoul(fight, soul);
            const status = canUse ? '🟢' : '⏳';
            buttons.push([Markup.button.callback(`${status} ${soul.name}`, `use_soul_${soul.id}`)]);
        }
    }
    buttons.push([Markup.button.callback('◀️ Voltar', 'combat_back')]);
    return Markup.inlineKeyboard(buttons);
}

function inventoryCategoryMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ Armas', 'inv_weapons'), Markup.button.callback('🛡️ Armaduras', 'inv_armors')],
        [Markup.button.callback('💍 Joias', 'inv_jewelry'), Markup.button.callback('🧪 Consumíveis', 'inv_consumables')],
        [Markup.button.callback('💀 Almas', 'inv_souls'), Markup.button.callback('🎨 Skins', 'inv_skins')],
        [Markup.button.callback('◀️ Voltar', 'menu')]
    ]);
}

// ========== LOJA ==========
function shopTabsMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('🏠 Vila (Ouro)', 'shop_village')],
        [Markup.button.callback('🏰 Castelo (Nox)', 'shop_castle')],
        [Markup.button.callback('⚔️ Matadores (Glórias)', 'shop_arena')],
        [Markup.button.callback('◀️ Voltar', 'menu')]
    ]);
}

function renderShop(category, items, player) {
    let text = `🛒 *${category}*\n\n`;
    const keyboard = [];
    for (const item of items) {
        let price = item.price;
        let currencySymbol = item.currency === 'gold' ? '💰' : (item.currency === 'nox' ? '💎' : '🏅');
        text += `${item.name} — ${price} ${currencySymbol}\n`;
        text += `   ${item.description}\n`;
        keyboard.push([Markup.button.callback(`Comprar ${item.name}`, `buy_${item.id}`)]);
    }
    keyboard.push([Markup.button.callback('◀️ Voltar', 'shop')]);
    return { text, keyboard: Markup.inlineKeyboard(keyboard) };
}

bot.action('shop', async (ctx) => {
    const player = getPlayerSafe(ctx.from.id);
    await ctx.editMessageText('🛒 *Bem-vindo à Loja!*\nEscolha uma categoria:', { parse_mode: 'Markdown', ...shopTabsMenu() });
});

bot.action('shop_village', async (ctx) => {
    const player = getPlayerSafe(ctx.from.id);
    const { text, keyboard } = renderShop('🏠 Vila (Ouro)', villageItems, player);
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
});

bot.action('shop_castle', async (ctx) => {
    const player = getPlayerSafe(ctx.from.id);
    const { text, keyboard } = renderShop('🏰 Castelo (Nox)', castleItems, player);
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
});

bot.action('shop_arena', async (ctx) => {
    const player = getPlayerSafe(ctx.from.id);
    const { text, keyboard } = renderShop('⚔️ Matadores (Glórias)', arenaItems, player);
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
});

// Compras
bot.action(/^buy_(.+)$/, async (ctx) => {
    const itemId = ctx.match[1];
    const player = getPlayer(ctx.from.id);
    let item = null;
    let category = null;
    if ((item = villageItems.find(i => i.id === itemId))) category = 'village';
    else if ((item = castleItems.find(i => i.id === itemId))) category = 'castle';
    else if ((item = arenaItems.find(i => i.id === itemId))) category = 'arena';
    if (!item) return ctx.answerCbQuery('Item não encontrado.');

    const cost = item.price;
    let currency = player[item.currency];
    if (currency < cost) {
        await ctx.answerCbQuery(`❌ Você não tem ${item.currency === 'gold' ? 'ouro' : (item.currency === 'nox' ? 'Nox' : 'Glórias')} suficiente!`, true);
        return;
    }

    // Processar compra
    player[item.currency] -= cost;
    if (item.type === 'consumable') {
        const qty = item.quantity || 1;
        player.consumables[item.effect] = (player.consumables[item.effect] || 0) + qty;
        if (item.effect === 'hp') player.consumables.potionHp += qty;
        else if (item.effect === 'energy') player.consumables.potionEnergy += qty;
        else if (item.effect === 'buff_atk') player.consumables.tonicStrength += qty;
        else if (item.effect === 'buff_def') player.consumables.tonicDefense += qty;
        else if (item.effect === 'buff_crit') player.consumables.tonicPrecision += qty;
    } else if (item.type === 'key') {
        player.keys += item.value;
    } else if (item.type === 'vip') {
        const now = new Date();
        const expire = new Date(now.getTime() + item.days * 24 * 60 * 60 * 1000);
        player.vip = true;
        player.vipExpires = expire.toISOString();
        player.maxEnergy = 40;
        player.energy = Math.min(player.energy, 40);
        player.maxInventory += 10;
    } else if (item.type === 'skin') {
        // Skin placeholder – mais tarde implementaremos
    }

    savePlayer(ctx.from.id, player);
    await ctx.answerCbQuery(`✅ Comprou: ${item.name}!`);
    // Volta para a loja da mesma categoria
    if (category === 'village') await bot.actions.shop_village(ctx);
    else if (category === 'castle') await bot.actions.shop_castle(ctx);
    else await bot.actions.shop_arena(ctx);
});

// ========== BAÚ DIÁRIO ==========
bot.action('daily', async (ctx) => {
    const player = getPlayerUpdated(ctx.from.id);
    const reward = giveDailyChest(player);
    if (!reward) {
        await ctx.answerCbQuery('🎁 Você já pegou seu baú hoje! Volte amanhã.', true);
        return;
    }
    savePlayer(ctx.from.id, player);
    let msg = `🎁 *Baú Diário!*\n\n💰 +${reward.gold} ouro\n🗝️ +${reward.keys} chaves`;
    if (reward.nox) msg += `\n💎 +${reward.nox} Nox`;
    await ctx.editMessageText(msg + '\n\n' + getMainMenuText(player, ctx.from.first_name), { parse_mode: 'Markdown', ...mainMenu() });
});

// ========== VIP ==========
bot.action('vip', async (ctx) => {
    const player = getPlayerSafe(ctx.from.id);
    let msg = `💎 *VIP*\n\n`;
    if (player.vip && player.vipExpires && new Date() < new Date(player.vipExpires)) {
        const expiry = new Date(player.vipExpires).toLocaleDateString();
        msg += `✨ VIP ativo até ${expiry}\n\n`;
        msg += `Benefícios:\n- Energia máxima 40\n- Regeneração 1/3 min\n- +50% XP e Gold\n- +10 slots de inventário\n- Baú diário extra\n`;
    } else {
        msg += `Você não é VIP.\n\n`;
        msg += `*Benefícios:*\n- Energia máxima 40\n- Regeneração 1/3 min\n- +50% XP e Gold\n- +10 slots de inventário\n- Baú diário extra\n\n`;
        msg += `Compre VIP na loja (aba Castelo)!\n`;
    }
    await ctx.editMessageText(msg, { parse_mode: 'Markdown', ...mainMenu() });
});

// ========== COMBATE (com uso de consumíveis e buffs) ==========
bot.action('use_potion_hp', async (ctx) => {
    await useConsumable(ctx, 'potionHp', (fight) => {
        const heal = 50;
        fight.player.hp = Math.min(fight.player.maxHp, fight.player.hp + heal);
        return `💚 Você usou Poção de Vida e curou *${heal}* HP!`;
    });
});

bot.action('use_potion_energy', async (ctx) => {
    await useConsumable(ctx, 'potionEnergy', (fight, player) => {
        player.energy = Math.min(player.maxEnergy, player.energy + 15);
        savePlayer(ctx.from.id, player);
        return `🔋 Você usou Poção de Energia e recuperou *15* energia!`;
    });
});

bot.action('use_tonic_strength', async (ctx) => {
    await useConsumable(ctx, 'tonicStrength', (fight) => {
        fight.player.buffAtk = { value: 20, duration: 3 };
        return `💪 Tônico de Força ativado! +20% ATK por 3 turnos.`;
    });
});

bot.action('use_tonic_defense', async (ctx) => {
    await useConsumable(ctx, 'tonicDefense', (fight) => {
        fight.player.buffDef = { value: 20, duration: 3 };
        return `🛡️ Tônico de Defesa ativado! +20% DEF por 3 turnos.`;
    });
});

bot.action('use_tonic_precision', async (ctx) => {
    await useConsumable(ctx, 'tonicPrecision', (fight) => {
        fight.player.buffCrit = { value: 15, duration: 3 };
        return `🎯 Tônico de Precisão ativado! +15% CRIT por 3 turnos.`;
    });
});

// Helper para usar consumíveis em combate
async function useConsumable(ctx, type, effectFn) {
    const fight = activeFights.get(ctx.from.id);
    if (!fight || fight.ended) {
        const player = getPlayerSafe(ctx.from.id);
        return ctx.editMessageText(getMainMenuText(player, ctx.from.first_name), { parse_mode: 'Markdown', ...mainMenu() });
    }
    const player = getPlayer(ctx.from.id);
    const consumable = player.consumables[type];
    if (!consumable || consumable <= 0) {
        await ctx.answerCbQuery('❌ Você não tem este consumível!', true);
        return;
    }
    player.consumables[type]--;
    savePlayer(ctx.from.id, player);
    const message = effectFn(fight, player);
    // Inimigo ataca após o uso
    const enemyDamage = require('./combat').calculateDamage(fight.enemy.atk, fight.player.def);
    fight.player.hp -= enemyDamage;
    let response = message + `\n🐺 Inimigo causou *${enemyDamage}* de dano.`;
    if (fight.player.hp <= 0) {
        fight.ended = true;
        fight.winner = 'enemy';
        activeFights.delete(ctx.from.id);
        const playerLost = getPlayer(ctx.from.id);
        playerLost.hp = Math.floor(playerLost.maxHp * 0.5);
        savePlayer(ctx.from.id, playerLost);
        await ctx.editMessageText(response + `\n💀 *Você foi derrotado!*` + '\n\n' + getMainMenuText(playerLost, ctx.from.first_name), 
            { parse_mode: 'Markdown', ...mainMenu() });
        return;
    }
    fight.turn++;
    const msg = response + `\n\n❤️ Seu HP: ${fight.player.hp}/${fight.player.maxHp}\n` +
                `🐺 HP inimigo: ${fight.enemy.hp}/${fight.enemy.maxHp}\n` +
                `🌀 Turno: ${fight.turn + 1}\n\n` +
                `Escolha sua próxima ação:`;
    await ctx.editMessageText(msg, combatMenu());
}

// Ações de combate (ataque, fuga, almas) – mesmas da versão anterior, mas com multiplicadores de eventos e buffs
// (não repetirei aqui para não estender demais, mas você deve integrar os multiplicadores nos ganhos de XP/gold)

// (O restante do index.js continua igual, com as funções de combate e outras ações)
// Nota: no momento de dar XP/gold, use getRewardMultipliers(player) para ajustar.

// ========== COMANDO DE START (ajustado para Noctra) ==========
bot.start(async (ctx) => {
    const player = getPlayerUpdated(ctx.from.id);
    giveDailyKeys(player);
    savePlayer(ctx.from.id, player);
    await ctx.reply(
        getMainMenuText(player, ctx.from.first_name),
        { parse_mode: 'Markdown', ...mainMenu() }
    );
});

// ... (todos os outros callbacks permanecem iguais, só ajustar "Nocta" para "Noctra" nas mensagens)

bot.launch();
console.log('Noctra iniciado com sucesso!');
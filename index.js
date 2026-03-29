const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const { getPlayer, savePlayer, recalculateStats, giveDailyKeys, giveDailyChest } = require('./players');
const { updateEnergy, useEnergy } = require('./energy');
const { getRandomEnemy, getMap, getMapByName, maps } = require('./maps');
const { startCombat, playerAttack, playerFlee, canUseSoul, useSoul, calculateDamage } = require('./combat');
const { checkLevelUp, xpToNext } = require('./level');
const { progressBar, formatNumber } = require('./utils');
const { generateItem } = require('./items');
const { dropSoul, formatSoulName, getRarityEmoji } = require('./souls');
const { villageItems, castleItems, arenaItems } = require('./shop');

const bot = new Telegraf(process.env.BOT_TOKEN);
const activeFights = new Map();

// Servidor para manter o bot acordado
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
        'Comum': '⚪',
        'Incomum': '🟢',
        'Raro': '🔵',
        'Épico': '🟣',
        'Lendário': '🟡',
        'Mítico': '🔴'
    };
    return colors[rarity] || '⚪';
}

function formatItemName(item) {
    if (!item) return '❓ Item inválido';
    const colorEmoji = getRarityColor(item.rarity);
    return `${colorEmoji} *${item.name}*`;
}

function getActiveEvents() {
    const events = [];
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();
    
    if (month >= 2 && month <= 5) events.push('🍂 Outono');
    if ((month === 2 && day >= 20) || (month === 3 && day <= 10)) events.push('🐣 Páscoa');
    const moonPhase = Math.floor(Math.random() * 8);
    if (moonPhase === 0) events.push('🌕 Lua Cheia');
    
    return events;
}

function getRewardMultipliers(player) {
    let xpMult = 1.0;
    let goldMult = 1.0;
    const events = getActiveEvents();
    if (events.includes('🍂 Outono')) { goldMult += 0.2; xpMult += 0.1; }
    if (events.includes('🐣 Páscoa')) { xpMult += 0.2; goldMult += 0.1; }
    if (events.includes('🌕 Lua Cheia')) { xpMult += 0.3; goldMult += 0.3; }
    
    const vipActive = player.vip && player.vipExpires && new Date() < new Date(player.vipExpires);
    if (vipActive) {
        xpMult += 0.5;
        goldMult += 0.5;
    }
    
    return { xpMult: Math.min(3.0, xpMult), goldMult: Math.min(3.0, goldMult) };
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
    if (fight.player.souls) {
        for (const soul of fight.player.souls) {
            if (soul) {
                const canUse = canUseSoul(fight, soul);
                const status = canUse ? '🟢' : '⏳';
                buttons.push([Markup.button.callback(`${status} ${soul.name}`, `use_soul_${soul.id}`)]);
            }
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

bot.command('class', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) return ctx.reply('Use: /class guerreiro, arqueiro ou mago');
    const className = args[1].toLowerCase();
    if (!['guerreiro', 'arqueiro', 'mago'].includes(className)) {
        return ctx.reply('Classe inválida. Opções: guerreiro, arqueiro, mago');
    }
    const player = getPlayer(ctx.from.id);
    
    if (!player.classChanged) {
        player.classChanged = true;
        player.class = className;
        recalculateStats(player);
        savePlayer(ctx.from.id, player);
        ctx.reply(`✅ Classe alterada para ${className.charAt(0).toUpperCase() + className.slice(1)}! (1ª vez grátis)`);
    } else {
        if (player.nox >= 500) {
            player.nox -= 500;
            player.class = className;
            recalculateStats(player);
            savePlayer(ctx.from.id, player);
            ctx.reply(`✅ Classe alterada para ${className.charAt(0).toUpperCase() + className.slice(1)}! (-500 Nox)`);
        } else {
            ctx.reply(`❌ Nox insuficientes! Mudar classe custa 500 Nox.`);
        }
    }
});

bot.command('rename', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) return ctx.reply('Use: /rename <novo_nome>');
    const newName = args.slice(1).join(' ');
    const player = getPlayer(ctx.from.id);
    
    if (!player.renamed) {
        player.renamed = true;
        player.name = newName;
        savePlayer(ctx.from.id, player);
        ctx.reply(`✅ Nome alterado para "${newName}"! (1ª vez grátis)`);
    } else {
        if (player.nox >= 100) {
            player.nox -= 100;
            player.name = newName;
            savePlayer(ctx.from.id, player);
            ctx.reply(`✅ Nome alterado para "${newName}"! (-100 Nox)`);
        } else {
            ctx.reply(`❌ Nox insuficientes! Renomear custa 100 Nox.`);
        }
    }
});

// ========== COMBATE ==========
bot.action('hunt', async (ctx) => {
    try {
        const player = getPlayerUpdated(ctx.from.id);
        if (!useEnergy(player)) {
            await ctx.answerCbQuery('⚠️ Energia insuficiente!');
            return ctx.editMessageText(getMainMenuText(player, ctx.from.first_name), { parse_mode: 'Markdown', ...mainMenu() });
        }
        savePlayer(ctx.from.id, player);

        const enemy = getRandomEnemy(player);
        const combatState = startCombat(player, enemy);
        activeFights.set(ctx.from.id, combatState);

        const msg = `⚔️ *Combate iniciado!*\n\n` +
                    `🐺 *${enemy.name}* (Nv. ${enemy.minLevel})\n` +
                    `❤️ ${enemy.hp} HP | ⚔️ ${enemy.atk} ATK | 🛡️ ${enemy.def} DEF\n\n` +
                    `❤️ Seu HP: ${player.hp}/${player.maxHp}\n` +
                    `⚡ Energia: ${player.energy}/${player.maxEnergy}\n` +
                    `🌀 Turno: 1\n\n` +
                    `Escolha sua ação:`;
        await ctx.editMessageText(msg, combatMenu());
    } catch (err) {
        console.error('Erro ao caçar:', err);
        await ctx.reply('Ocorreu um erro. Tente novamente.');
    }
});

bot.action('combat_attack', async (ctx) => {
    try {
        const fight = activeFights.get(ctx.from.id);
        if (!fight || fight.ended) {
            const player = getPlayerSafe(ctx.from.id);
            return ctx.editMessageText(getMainMenuText(player, ctx.from.first_name), { parse_mode: 'Markdown', ...mainMenu() });
        }
        
        fight.turn++;
        const result = playerAttack(fight);
        let response = result.message + `\n🌀 Turno: ${fight.turn + 1}`;

        if (result.ended) {
            activeFights.delete(ctx.from.id);
            if (result.winner === 'player') {
                const player = getPlayer(ctx.from.id);
                const enemy = fight.enemy;
                const multipliers = getRewardMultipliers(player);
                const xpGain = Math.floor(enemy.exp * multipliers.xpMult);
                const goldGain = Math.floor(enemy.gold * multipliers.goldMult);
                
                player.xp += xpGain;
                player.gold += goldGain;
                const levelUp = checkLevelUp(player);
                player.hp = fight.player.hp;
                recalculateStats(player);

                let reward = `\n✅ *Vitória!*\n💰 +${goldGain} ouro\n✨ +${xpGain} XP`;
                if (multipliers.xpMult > 1 || multipliers.goldMult > 1) {
                    reward += `\n🎁 Bônus: ${Math.round((multipliers.xpMult - 1) * 100)}% XP / ${Math.round((multipliers.goldMult - 1) * 100)}% Gold`;
                }
                if (levelUp) reward += `\n🎉 *UP! Agora nível ${player.level}!* 🎉`;

                let dropMsg = '';
                if (Math.random() < 0.3) {
                    const item = generateItem(player.level);
                    if (item) {
                        player.inventory.push(item);
                        dropMsg = `\n📦 *Drop:* ${formatItemName(item)}\n   ⚔️ +${item.atk} | 🛡️ +${item.def} | ✨ +${item.crit} | ❤️ +${item.hp}`;
                    }
                }

                let soulDropMsg = '';
                const droppedSoul = dropSoul(player.level, player.level);
                if (droppedSoul) {
                    player.inventory.push(droppedSoul);
                    soulDropMsg = `\n💀 *Alma Dropada:* ${formatSoulName(droppedSoul)}\n   ${droppedSoul.description}`;
                }

                savePlayer(ctx.from.id, player);
                await ctx.editMessageText(response + reward + dropMsg + soulDropMsg + '\n\n' + getMainMenuText(player, ctx.from.first_name), 
                    { parse_mode: 'Markdown', ...mainMenu() });
            } else if (result.winner === 'enemy') {
                const player = getPlayer(ctx.from.id);
                player.hp = Math.floor(player.maxHp * 0.5);
                savePlayer(ctx.from.id, player);
                await ctx.editMessageText(response + `\n💀 *Você foi derrotado!* Seu HP foi reduzido a ${player.hp}/${player.maxHp}.` + '\n\n' + getMainMenuText(player, ctx.from.first_name), 
                    { parse_mode: 'Markdown', ...mainMenu() });
            }
        } else {
            const msg = response + `\n\n❤️ Seu HP: ${fight.player.hp}/${fight.player.maxHp}\n` +
                        `🐺 HP inimigo: ${fight.enemy.hp}/${fight.enemy.maxHp}\n\n` +
                        `Escolha sua próxima ação:`;
            await ctx.editMessageText(msg, combatMenu());
        }
    } catch (err) {
        console.error('Erro no ataque:', err);
        await ctx.answerCbQuery('Erro interno. Tente novamente.');
    }
});

bot.action('combat_flee', async (ctx) => {
    try {
        const fight = activeFights.get(ctx.from.id);
        if (!fight) {
            const player = getPlayerSafe(ctx.from.id);
            return ctx.editMessageText(getMainMenuText(player, ctx.from.first_name), { parse_mode: 'Markdown', ...mainMenu() });
        }

        const result = playerFlee(fight);
        activeFights.delete(ctx.from.id);
        
        if (result.success) {
            const player = getPlayerSafe(ctx.from.id);
            await ctx.editMessageText(result.message + '\n\n' + getMainMenuText(player, ctx.from.first_name), 
                { parse_mode: 'Markdown', ...mainMenu() });
        } else {
            const player = getPlayer(ctx.from.id);
            player.hp = fight.player.hp;
            if (player.hp <= 0) {
                player.hp = Math.floor(player.maxHp * 0.5);
                savePlayer(ctx.from.id, player);
                await ctx.editMessageText(result.message + `\n💀 Você foi derrotado!` + '\n\n' + getMainMenuText(player, ctx.from.first_name), 
                    { parse_mode: 'Markdown', ...mainMenu() });
            } else {
                savePlayer(ctx.from.id, player);
                await ctx.editMessageText(result.message + '\n\n' + getMainMenuText(player, ctx.from.first_name), 
                    { parse_mode: 'Markdown', ...mainMenu() });
            }
        }
    } catch (err) {
        console.error('Erro ao fugir:', err);
        await ctx.answerCbQuery('Erro interno. Tente novamente.');
    }
});

bot.action('combat_items', async (ctx) => {
    const fight = activeFights.get(ctx.from.id);
    if (!fight || fight.ended) {
        const player = getPlayerSafe(ctx.from.id);
        return ctx.editMessageText(getMainMenuText(player, ctx.from.first_name), { parse_mode: 'Markdown', ...mainMenu() });
    }
    
    const player = getPlayer(ctx.from.id);
    let text = `🧪 *CONSUMÍVEIS*\n\n`;
    text += `💚 Poção de Vida: ${player.consumables?.potionHp || 0} (cura 50 HP)\n`;
    text += `🔋 Poção de Energia: ${player.consumables?.potionEnergy || 0} (restaura 15 energia)\n`;
    text += `💪 Tônico de Força: ${player.consumables?.tonicStrength || 0} (+20% ATK por 3 turnos)\n`;
    text += `🛡️ Tônico de Defesa: ${player.consumables?.tonicDefense || 0} (+20% DEF por 3 turnos)\n`;
    text += `🎯 Tônico de Precisão: ${player.consumables?.tonicPrecision || 0} (+15% CRIT por 3 turnos)\n\n`;
    text += `❤️ Seu HP: ${fight.player.hp}/${fight.player.maxHp}\n`;
    text += `🐺 HP inimigo: ${fight.enemy.hp}/${fight.enemy.maxHp}\n\n`;
    text += `Usar um consumível gasta o turno.`;
    
    await ctx.editMessageText(text, consumablesMenu());
});

bot.action('combat_souls', async (ctx) => {
    const fight = activeFights.get(ctx.from.id);
    if (!fight || fight.ended) {
        const player = getPlayerSafe(ctx.from.id);
        return ctx.editMessageText(getMainMenuText(player, ctx.from.first_name), { parse_mode: 'Markdown', ...mainMenu() });
    }
    
    let text = `💀 *ALMAS EQUIPADAS*\n\n`;
    text += `❤️ Seu HP: ${fight.player.hp}/${fight.player.maxHp}\n`;
    text += `🐺 HP inimigo: ${fight.enemy.hp}/${fight.enemy.maxHp}\n`;
    text += `🌀 Turno: ${fight.turn + 1}\n\n`;
    text += `🟢 = Disponível | ⏳ = Já usada\n\n`;
    
    if (fight.player.souls) {
        for (const soul of fight.player.souls) {
            if (soul) {
                const canUse = canUseSoul(fight, soul);
                const status = canUse ? '🟢 Disponível' : '⏳ Em recarga';
                text += `${getRarityEmoji(soul.rarity)} *${soul.name}* (${soul.rarity})\n`;
                text += `   ${soul.description}\n`;
                text += `   ${status}\n\n`;
            }
        }
    }
    
    if (!fight.player.souls || fight.player.souls.filter(s => s !== null).length === 0) {
        text += `Nenhuma alma equipada.\n`;
        text += `Equipe almas no inventário para usar habilidades especiais!\n`;
    }
    
    await ctx.editMessageText(text, soulsMenu(fight));
});

bot.action('combat_back', async (ctx) => {
    const fight = activeFights.get(ctx.from.id);
    if (!fight || fight.ended) {
        const player = getPlayerSafe(ctx.from.id);
        return ctx.editMessageText(getMainMenuText(player, ctx.from.first_name), { parse_mode: 'Markdown', ...mainMenu() });
    }
    
    const msg = `❤️ Seu HP: ${fight.player.hp}/${fight.player.maxHp}\n` +
                `🐺 HP inimigo: ${fight.enemy.hp}/${fight.enemy.maxHp}\n` +
                `🌀 Turno: ${fight.turn + 1}\n\n` +
                `Escolha sua ação:`;
    await ctx.editMessageText(msg, combatMenu());
});

bot.action(/^use_soul_(.+)$/, async (ctx) => {
    try {
        const soulId = ctx.match[1];
        const fight = activeFights.get(ctx.from.id);
        if (!fight || fight.ended) {
            const player = getPlayerSafe(ctx.from.id);
            return ctx.editMessageText(getMainMenuText(player, ctx.from.first_name), { parse_mode: 'Markdown', ...mainMenu() });
        }
        
        const soul = fight.player.souls?.find(s => s && s.id === soulId);
        if (!soul) {
            await ctx.answerCbQuery('Alma não encontrada!');
            return;
        }
        
        fight.turn++;
        const result = useSoul(fight, soul);
        
        if (result.ended) {
            activeFights.delete(ctx.from.id);
            if (fight.winner === 'player') {
                const player = getPlayer(ctx.from.id);
                const enemy = fight.enemy;
                const multipliers = getRewardMultipliers(player);
                const xpGain = Math.floor(enemy.exp * multipliers.xpMult);
                const goldGain = Math.floor(enemy.gold * multipliers.goldMult);
                
                player.xp += xpGain;
                player.gold += goldGain;
                const levelUp = checkLevelUp(player);
                player.hp = fight.player.hp;
                recalculateStats(player);
                
                let reward = `\n✅ *Vitória!*\n💰 +${goldGain} ouro\n✨ +${xpGain} XP`;
                if (multipliers.xpMult > 1 || multipliers.goldMult > 1) {
                    reward += `\n🎁 Bônus: ${Math.round((multipliers.xpMult - 1) * 100)}% XP / ${Math.round((multipliers.goldMult - 1) * 100)}% Gold`;
                }
                if (levelUp) reward += `\n🎉 *UP! Agora nível ${player.level}!* 🎉`;
                
                let dropMsg = '';
                if (Math.random() < 0.3) {
                    const item = generateItem(player.level);
                    if (item) {
                        player.inventory.push(item);
                        dropMsg = `\n📦 *Drop:* ${formatItemName(item)}\n   ⚔️ +${item.atk} | 🛡️ +${item.def} | ✨ +${item.crit} | ❤️ +${item.hp}`;
                    }
                }
                
                let soulDropMsg = '';
                const droppedSoul = dropSoul(player.level, player.level);
                if (droppedSoul) {
                    player.inventory.push(droppedSoul);
                    soulDropMsg = `\n💀 *Alma Dropada:* ${formatSoulName(droppedSoul)}\n   ${droppedSoul.description}`;
                }
                
                savePlayer(ctx.from.id, player);
                await ctx.editMessageText(result.message + reward + dropMsg + soulDropMsg + '\n\n' + getMainMenuText(player, ctx.from.first_name), 
                    { parse_mode: 'Markdown', ...mainMenu() });
            } else {
                const player = getPlayer(ctx.from.id);
                player.hp = Math.floor(player.maxHp * 0.5);
                savePlayer(ctx.from.id, player);
                await ctx.editMessageText(result.message + `\n💀 *Você foi derrotado!*` + '\n\n' + getMainMenuText(player, ctx.from.first_name), 
                    { parse_mode: 'Markdown', ...mainMenu() });
            }
        } else {
            const msg = result.message + `\n\n❤️ Seu HP: ${fight.player.hp}/${fight.player.maxHp}\n` +
                        `🐺 HP inimigo: ${fight.enemy.hp}/${fight.enemy.maxHp}\n` +
                        `🌀 Turno: ${fight.turn + 1}\n\n` +
                        `Escolha sua próxima ação:`;
            await ctx.editMessageText(msg, combatMenu());
        }
    } catch (err) {
        console.error('Erro ao usar alma:', err);
        await ctx.answerCbQuery('Erro ao usar alma.');
    }
});

// Helper para usar consumíveis em combate
async function useConsumable(ctx, type, effectFn) {
    const fight = activeFights.get(ctx.from.id);
    if (!fight || fight.ended) {
        const player = getPlayerSafe(ctx.from.id);
        return ctx.editMessageText(getMainMenuText(player, ctx.from.first_name), { parse_mode: 'Markdown', ...mainMenu() });
    }
    const player = getPlayer(ctx.from.id);
    const consumable = player.consumables?.[type];
    if (!consumable || consumable <= 0) {
        await ctx.answerCbQuery('❌ Você não tem este consumível!', true);
        return;
    }
    player.consumables[type]--;
    savePlayer(ctx.from.id, player);
    const message = effectFn(fight, player);
    
    const enemyDamage = calculateDamage(fight.enemy.atk, fight.player.def);
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

// ========== PERFIL ==========
bot.action('profile', async (ctx) => {
    try {
        const player = getPlayerSafe(ctx.from.id);
        const xpNeeded = xpToNext(player.level);
        const xpBar = progressBar(player.xp, xpNeeded, 8);
        const hpBar = progressBar(player.hp, player.maxHp, 8);
        const map = getMap(player);
        
        const slotEmojis = {
            weapon: '⚔️', armor: '🛡️', helmet: '⛑️', boots: '👢',
            ring: '💍', necklace: '📿', bag: '🎒'
        };
        let equipText = '';
        if (player.equipment) {
            for (const [slot, item] of Object.entries(player.equipment)) {
                if (item) {
                    equipText += `   ${slotEmojis[slot]} ${formatItemName(item)}\n`;
                    equipText += `      ⚔️ +${item.atk} | 🛡️ +${item.def} | ✨ +${item.crit} | ❤️ +${item.hp}\n`;
                } else {
                    equipText += `   ${slotEmojis[slot]} Vazio\n`;
                }
            }
        }
        
        let soulsText = '';
        if (player.souls) {
            for (let i = 0; i < player.souls.length; i++) {
                const soul = player.souls[i];
                if (soul) {
                    soulsText += `   ${getRarityEmoji(soul.rarity)} ${soul.name} (${soul.rarity})\n`;
                    soulsText += `      ${soul.description}\n`;
                } else {
                    soulsText += `   ⬜ Slot ${i+1} vazio\n`;
                }
            }
        }
        
        const skinText = player.skin ? `🎨 Skin: ${player.skin.emoji} ${player.skin.name}\n` : '🎨 Skin: Nenhuma\n';
        
        const profileMsg =
            `👤 *${player.name || ctx.from.first_name}* (${player.class.charAt(0).toUpperCase() + player.class.slice(1)})\n` +
            `Nível ${player.level} | XP: ${formatNumber(player.xp)} / ${formatNumber(xpNeeded)}\n` +
            `[${xpBar}] ${Math.floor((player.xp/xpNeeded)*100)}%\n\n` +
            `❤️ HP: ${player.hp}/${player.maxHp}\n` +
            `[${hpBar}] ${Math.floor((player.hp/player.maxHp)*100)}%\n\n` +
            `⚔️ ATK: ${player.atk} | 🛡️ DEF: ${player.def}\n` +
            `✨ CRIT: ${player.crit}%\n\n` +
            `💰 Gold: ${formatNumber(player.gold)} | 💎 Nox: ${player.nox} | 🏅 Glórias: ${player.glorias || 0}\n` +
            `⚡ Energia: ${player.energy}/${player.maxEnergy}\n` +
            `🗝️ Chaves: ${player.keys}\n` +
            `🗺️ Mapa: ${map.name} (Lv ${map.level})\n\n` +
            `${skinText}\n` +
            `*Equipamentos:*\n${equipText}\n` +
            `💀 *Almas Equipadas (${player.souls?.filter(s => s !== null).length || 0}/2):*\n${soulsText}`;
        
        const keyboard = [
            [Markup.button.callback('📝 Renomear', 'rename_action'), Markup.button.callback('🔄 Mudar Classe', 'change_class_action')],
            [Markup.button.callback('◀️ Voltar', 'menu')]
        ];
        
        await ctx.editMessageText(profileMsg, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(keyboard) });
    } catch (err) {
        console.error('Erro no perfil:', err);
        await ctx.answerCbQuery('Erro ao carregar perfil.');
    }
});

bot.action('rename_action', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Digite seu novo nome usando o comando: /rename <novo_nome>');
});

bot.action('change_class_action', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Escolha sua nova classe:\n/class guerreiro\n/class arqueiro\n/class mago');
});

// ========== INVENTÁRIO POR CATEGORIAS (CORRIGIDO) ==========
bot.action('inventory', async (ctx) => {
    try {
        const player = getPlayerSafe(ctx.from.id);
        let text = `🎒 *INVENTÁRIO*\n\n`;
        text += `⚔️ ATK ${player.atk} | 🛡️ DEF ${player.def} | ❤️ HP ${player.maxHp} | ✨ CRIT ${player.crit}%\n\n`;
        text += `Escolha uma categoria:`;
        await ctx.editMessageText(text, inventoryCategoryMenu());
    } catch (err) {
        console.error('Erro ao abrir inventário:', err);
        await ctx.answerCbQuery('Erro ao carregar inventário.');
    }
});

bot.action('inv_weapons', async (ctx) => {
    try {
        const player = getPlayerSafe(ctx.from.id);
        const weapons = (player.inventory || []).filter(i => i && i.slot === 'weapon');
        let text = `⚔️ *ARMAS* (${weapons.length})\n\n`;
        if (weapons.length === 0) {
            text += 'Nenhuma arma no inventário.';
        } else {
            weapons.forEach(w => {
                text += `${getRarityColor(w.rarity)} ${w.name} (${w.rarity})\n`;
                text += `   ⚔️ +${w.atk || 0} | 🛡️ +${w.def || 0} | ✨ +${w.crit || 0} | ❤️ +${w.hp || 0}\n`;
                text += `   /equip_${w.id}\n\n`;
            });
        }
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...inventoryCategoryMenu() });
    } catch (err) {
        console.error('Erro ao listar armas:', err);
        await ctx.answerCbQuery('Erro ao carregar armas.');
    }
});

bot.action('inv_armors', async (ctx) => {
    try {
        const player = getPlayerSafe(ctx.from.id);
        const armors = (player.inventory || []).filter(i => i && ['armor', 'helmet', 'boots'].includes(i.slot));
        let text = `🛡️ *ARMADURAS* (${armors.length})\n\n`;
        if (armors.length === 0) {
            text += 'Nenhuma armadura no inventário.';
        } else {
            armors.forEach(a => {
                text += `${getRarityColor(a.rarity)} ${a.name} (${a.rarity})\n`;
                text += `   ⚔️ +${a.atk || 0} | 🛡️ +${a.def || 0} | ✨ +${a.crit || 0} | ❤️ +${a.hp || 0}\n`;
                text += `   /equip_${a.id}\n\n`;
            });
        }
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...inventoryCategoryMenu() });
    } catch (err) {
        console.error('Erro ao listar armaduras:', err);
        await ctx.answerCbQuery('Erro ao carregar armaduras.');
    }
});

bot.action('inv_jewelry', async (ctx) => {
    try {
        const player = getPlayerSafe(ctx.from.id);
        const jewelry = (player.inventory || []).filter(i => i && ['ring', 'necklace'].includes(i.slot));
        let text = `💍 *JOIAS* (${jewelry.length})\n\n`;
        if (jewelry.length === 0) {
            text += 'Nenhuma joia no inventário.';
        } else {
            jewelry.forEach(j => {
                text += `${getRarityColor(j.rarity)} ${j.name} (${j.rarity})\n`;
                text += `   ⚔️ +${j.atk || 0} | 🛡️ +${j.def || 0} | ✨ +${j.crit || 0} | ❤️ +${j.hp || 0}\n`;
                text += `   /equip_${j.id}\n\n`;
            });
        }
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...inventoryCategoryMenu() });
    } catch (err) {
        console.error('Erro ao listar joias:', err);
        await ctx.answerCbQuery('Erro ao carregar joias.');
    }
});

bot.action('inv_consumables', async (ctx) => {
    try {
        const player = getPlayerSafe(ctx.from.id);
        let text = `🧪 *CONSUMÍVEIS*\n\n`;
        text += `💚 Poção de Vida: ${player.consumables?.potionHp || 0}\n`;
        text += `🔋 Poção de Energia: ${player.consumables?.potionEnergy || 0}\n`;
        text += `💪 Tônico de Força: ${player.consumables?.tonicStrength || 0}\n`;
        text += `🛡️ Tônico de Defesa: ${player.consumables?.tonicDefense || 0}\n`;
        text += `🎯 Tônico de Precisão: ${player.consumables?.tonicPrecision || 0}\n`;
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...inventoryCategoryMenu() });
    } catch (err) {
        console.error('Erro ao listar consumíveis:', err);
        await ctx.answerCbQuery('Erro ao carregar consumíveis.');
    }
});

bot.action('inv_souls', async (ctx) => {
    try {
        const player = getPlayerSafe(ctx.from.id);
        const souls = (player.inventory || []).filter(i => i && i.type === 'soul');
        let text = `💀 *ALMAS* (${souls.length})\n\n`;
        if (souls.length === 0) {
            text += 'Nenhuma alma no inventário.';
        } else {
            souls.forEach(s => {
                text += `${getRarityEmoji(s.rarity)} ${s.name} (${s.rarity})\n`;
                text += `   ${s.description}\n`;
                text += `   /equip_soul_${s.id}\n\n`;
            });
        }
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...inventoryCategoryMenu() });
    } catch (err) {
        console.error('Erro ao listar almas:', err);
        await ctx.answerCbQuery('Erro ao carregar almas.');
    }
});

bot.action('inv_skins', async (ctx) => {
    try {
        const player = getPlayerSafe(ctx.from.id);
        let text = `🎨 *SKINS* (${player.skins?.length || 0})\n\n`;
        if (player.skins && player.skins.length > 0) {
            player.skins.forEach(s => {
                text += `${s.emoji} ${s.name} (${s.rarity})\n`;
                text += `   /equip_skin_${s.id}\n\n`;
            });
        }
        if (player.skin) text += `\n✨ *Equipada:* ${player.skin.emoji} ${player.skin.name}\n`;
        if (!player.skins || player.skins.length === 0) text += 'Nenhuma skin no inventário.';
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...inventoryCategoryMenu() });
    } catch (err) {
        console.error('Erro ao listar skins:', err);
        await ctx.answerCbQuery('Erro ao carregar skins.');
    }
});

// Comando para equipar item
bot.command(/^equip_(\d+)/, async (ctx) => {
    try {
        const itemId = parseFloat(ctx.match[1]);
        const player = getPlayer(ctx.from.id);
        const item = player.inventory.find(i => i && i.id == itemId);
        if (!item) return ctx.reply('Item não encontrado.');

        const current = player.equipment[item.slot];
        if (current) {
            player.inventory.push(current);
        }
        player.equipment[item.slot] = item;
        player.inventory = player.inventory.filter(i => i && i.id != itemId);
        recalculateStats(player);
        savePlayer(ctx.from.id, player);
        ctx.reply(`✅ *Equipado:* ${item.name}`, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error('Erro ao equipar:', err);
        ctx.reply('Erro ao equipar item.');
    }
});

// Comando para equipar alma
bot.command(/^equip_soul_(\d+)/, async (ctx) => {
    try {
        const soulId = parseFloat(ctx.match[1]);
        const player = getPlayer(ctx.from.id);
        const soul = player.inventory.find(i => i && i.id == soulId && i.type === 'soul');
        if (!soul) return ctx.reply('Alma não encontrada.');
        
        const emptySlot = player.souls.findIndex(s => s === null);
        if (emptySlot === -1) {
            return ctx.reply('❌ Você já tem 2 almas equipadas! Desequipe uma primeiro.');
        }
        
        player.souls[emptySlot] = soul;
        player.inventory = player.inventory.filter(i => i && i.id != soulId);
        savePlayer(ctx.from.id, player);
        ctx.reply(`✅ *Alma equipada:* ${soul.name}`, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error('Erro ao equipar alma:', err);
        ctx.reply('Erro ao equipar alma.');
    }
});

// ========== VIAJAR ==========
bot.action('travel', async (ctx) => {
    try {
        const player = getPlayerUpdated(ctx.from.id);
        let text = `🗺️ *Escolha seu destino:*\n\n`;
        const keyboard = [];
        for (const map of maps) {
            const isUnlocked = player.level >= map.level;
            const status = isUnlocked ? '✅' : '🔒';
            const btnText = `${status} ${map.name} (Lv ${map.level})`;
            if (isUnlocked) {
                keyboard.push([Markup.button.callback(btnText, `travel_to_${map.name}`)]);
            } else {
                keyboard.push([Markup.button.callback(btnText, 'travel_locked')]);
            }
        }
        keyboard.push([Markup.button.callback('◀️ Voltar', 'menu')]);

        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(keyboard) });
    } catch (err) {
        console.error('Erro ao viajar:', err);
        await ctx.answerCbQuery('Erro ao carregar mapas.');
    }
});

bot.action(/^travel_to_(.+)$/, async (ctx) => {
    try {
        const mapName = ctx.match[1];
        const player = getPlayer(ctx.from.id);
        const map = getMapByName(mapName);
        if (!map) return ctx.answerCbQuery('Mapa inválido!');
        if (player.level < map.level) {
            return ctx.answerCbQuery(`Você precisa ser nível ${map.level} para ir para ${mapName}.`);
        }
        player.currentMap = mapName;
        savePlayer(ctx.from.id, player);
        await ctx.editMessageText(`🗺️ Você viajou para *${mapName}*.`, { parse_mode: 'Markdown', ...mainMenu() });
    } catch (err) {
        console.error('Erro ao viajar:', err);
        await ctx.answerCbQuery('Erro ao viajar.');
    }
});

bot.action('travel_locked', async (ctx) => {
    await ctx.answerCbQuery('Este mapa ainda está bloqueado! Suba de nível para desbloquear.', true);
});

// ========== LOJA ==========
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

    player[item.currency] -= cost;
    
    if (item.type === 'consumable') {
        const qty = item.quantity || 1;
        if (item.effect === 'hp') player.consumables.potionHp = (player.consumables.potionHp || 0) + qty;
        else if (item.effect === 'energy') player.consumables.potionEnergy = (player.consumables.potionEnergy || 0) + qty;
        else if (item.effect === 'buff_atk') player.consumables.tonicStrength = (player.consumables.tonicStrength || 0) + qty;
        else if (item.effect === 'buff_def') player.consumables.tonicDefense = (player.consumables.tonicDefense || 0) + qty;
        else if (item.effect === 'buff_crit') player.consumables.tonicPrecision = (player.consumables.tonicPrecision || 0) + qty;
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
    }

    savePlayer(ctx.from.id, player);
    await ctx.answerCbQuery(`✅ Comprou: ${item.name}!`);
    
    if (category === 'village') await bot.actions.shop_village(ctx);
    else if (category === 'castle') await bot.actions.shop_castle(ctx);
    else if (category === 'arena') await bot.actions.shop_arena(ctx);
});

// ========== BAÚ DIÁRIO ==========
bot.action('daily', async (ctx) => {
    try {
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
    } catch (err) {
        console.error('Erro no baú diário:', err);
        await ctx.answerCbQuery('Erro ao abrir baú.');
    }
});

// ========== ENERGIA ==========
bot.action('energy', async (ctx) => {
    try {
        const player = getPlayerUpdated(ctx.from.id);
        const bar = progressBar(player.energy, player.maxEnergy, 8);
        await ctx.editMessageText(
            `⚡ *Energia*: ${player.energy}/${player.maxEnergy}\n` +
            `[${bar}] ${Math.floor((player.energy/player.maxEnergy)*100)}%\n\n` +
            `Regeneração: ${player.vip ? '1 a cada 3 min' : '1 a cada 6 min'}\n` +
            `Compre poções de energia na loja.` + '\n\n' + getMainMenuText(player, ctx.from.first_name),
            { parse_mode: 'Markdown', ...mainMenu() }
        );
    } catch (err) {
        console.error('Erro na energia:', err);
        await ctx.answerCbQuery('Erro ao mostrar energia.');
    }
});

// ========== VIP ==========
bot.action('vip', async (ctx) => {
    try {
        const player = getPlayerSafe(ctx.from.id);
        let msg = `💎 *VIP*\n\n`;
        const vipActive = player.vip && player.vipExpires && new Date() < new Date(player.vipExpires);
        if (vipActive) {
            const expiry = new Date(player.vipExpires).toLocaleDateString();
            msg += `✨ VIP ativo até ${expiry}\n\n`;
            msg += `*Benefícios:*\n`;
            msg += `- Energia máxima 40\n`;
            msg += `- Regeneração 1/3 min\n`;
            msg += `- +50% XP e Gold\n`;
            msg += `- +10 slots de inventário\n`;
            msg += `- Baú diário extra\n`;
        } else {
            msg += `Você não é VIP.\n\n`;
            msg += `*Benefícios:*\n`;
            msg += `- Energia máxima 40\n`;
            msg += `- Regeneração 1/3 min\n`;
            msg += `- +50% XP e Gold\n`;
            msg += `- +10 slots de inventário\n`;
            msg += `- Baú diário extra\n\n`;
            msg += `Compre VIP na loja (aba Castelo)!\n`;
        }
        await ctx.editMessageText(msg, { parse_mode: 'Markdown', ...mainMenu() });
    } catch (err) {
        console.error('Erro no VIP:', err);
        await ctx.answerCbQuery('Erro ao mostrar VIP.');
    }
});

// ========== ONLINE ==========
bot.action('online', async (ctx) => {
    const onlineCount = Object.keys(activeFights).length + Math.floor(Math.random() * 50);
    const playersOnline = Math.max(1, onlineCount);
    await ctx.answerCbQuery(`👥 ${playersOnline} jogadores online!`, true);
});

// ========== EM BREVE ==========
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
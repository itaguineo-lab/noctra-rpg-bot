const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const { getPlayer, savePlayer, recalculateStats, giveDailyKeys } = require('./players');
const { updateEnergy, useEnergy } = require('./energy');
const { getRandomEnemy, getMap, getMapByName, maps } = require('./maps');
const { startCombat, playerAttack, playerFlee, canUseSoul, useSoul } = require('./combat');
const { checkLevelUp, xpToNext } = require('./level');
const { progressBar, formatNumber } = require('./utils');
const { generateItem } = require('./items');
const { dropSoul, formatSoulName, getRarityEmoji } = require('./souls');

const bot = new Telegraf(process.env.BOT_TOKEN);
const activeFights = new Map();
const invPages = new Map();

// Servidor para manter o bot acordado
const app = express();
app.get('/', (req, res) => res.send('Nocta Online!'));
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
    const colorEmoji = getRarityColor(item.rarity);
    return `${colorEmoji} *${item.name}*`;
}

function getActiveEvents() {
    const events = [];
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();
    
    // Outono (Mar-Jun no hemisfério sul)
    if (month >= 2 && month <= 5) events.push('🍂 Outono');
    // Páscoa (Mar-Abr)
    if ((month === 2 && day >= 20) || (month === 3 && day <= 10)) events.push('🐣 Páscoa');
    // Lua Cheia (simulado)
    const moonPhase = Math.floor(Math.random() * 8);
    if (moonPhase === 0) events.push('🌕 Lua Cheia');
    
    return events;
}

function getMainMenuText(player, username = null) {
    const xpNeeded = xpToNext(player.level);
    const xpPercent = Math.floor((player.xp / xpNeeded) * 100);
    const xpBar = progressBar(player.xp, xpNeeded, 8);
    const hpBar = progressBar(player.hp, player.maxHp, 8);
    const energyBar = progressBar(player.energy, player.maxEnergy, 8);
    
    const events = getActiveEvents();
    const eventText = events.length > 0 ? events.join(' | ') : 'Nenhum';
    
    const vipText = player.vipExpires ? `✨ VIP até ${new Date(player.vipExpires).toLocaleDateString()}\n` : '';
    
    const nameDisplay = player.name || username || 'Aventureiro';
    
    return (
        `🌙 *Nocta*\n\n` +
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
        `💎 Nox: ${player.nox || 0}\n` +
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
        [Markup.button.callback('👥 Online', 'online')]
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

// ========== COMANDOS ==========
bot.start(async (ctx) => {
    const player = getPlayerUpdated(ctx.from.id);
    giveDailyKeys(player);
    savePlayer(ctx.from.id, player);
    await ctx.reply(
        getMainMenuText(player, ctx.from.first_name),
        { parse_mode: 'Markdown', ...mainMenu() }
    );
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
                player.xp += enemy.exp;
                player.gold += enemy.gold;
                const levelUp = checkLevelUp(player);
                player.hp = fight.player.hp;
                recalculateStats(player);

                let reward = `\n✅ *Vitória!*\n💰 +${enemy.gold} ouro\n✨ +${enemy.exp} XP`;
                if (levelUp) reward += `\n🎉 *UP! Agora nível ${player.level}!* 🎉`;

                let dropMsg = '';
                if (Math.random() < 0.3) {
                    const item = generateItem(player.level);
                    player.inventory.push(item);
                    dropMsg = `\n📦 *Drop:* ${formatItemName(item)}\n   ⚔️ +${item.atk} | 🛡️ +${item.def} | ✨ +${item.crit} | ❤️ +${item.hp}`;
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
    
    for (const soul of fight.player.souls) {
        if (soul) {
            const canUse = canUseSoul(fight, soul);
            const status = canUse ? '🟢 Disponível' : '⏳ Em recarga';
            text += `${getRarityEmoji(soul.rarity)} *${soul.name}* (${soul.rarity})\n`;
            text += `   ${soul.description}\n`;
            text += `   ${status}\n\n`;
        }
    }
    
    if (fight.player.souls.filter(s => s !== null).length === 0) {
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
        
        const soul = fight.player.souls.find(s => s && s.id === soulId);
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
                player.xp += enemy.exp;
                player.gold += enemy.gold;
                const levelUp = checkLevelUp(player);
                player.hp = fight.player.hp;
                recalculateStats(player);
                
                let reward = `\n✅ *Vitória!*\n💰 +${enemy.gold} ouro\n✨ +${enemy.exp} XP`;
                if (levelUp) reward += `\n🎉 *UP! Agora nível ${player.level}!* 🎉`;
                
                let dropMsg = '';
                if (Math.random() < 0.3) {
                    const item = generateItem(player.level);
                    player.inventory.push(item);
                    dropMsg = `\n📦 *Drop:* ${formatItemName(item)}\n   ⚔️ +${item.atk} | 🛡️ +${item.def} | ✨ +${item.crit} | ❤️ +${item.hp}`;
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
        for (const [slot, item] of Object.entries(player.equipment)) {
            if (item) {
                equipText += `   ${slotEmojis[slot]} ${formatItemName(item)}\n`;
                equipText += `      ⚔️ +${item.atk} | 🛡️ +${item.def} | ✨ +${item.crit} | ❤️ +${item.hp}\n`;
            } else {
                equipText += `   ${slotEmojis[slot]} Vazio\n`;
            }
        }
        
        let soulsText = '';
        for (let i = 0; i < player.souls.length; i++) {
            const soul = player.souls[i];
            if (soul) {
                soulsText += `   ${getRarityEmoji(soul.rarity)} ${soul.name} (${soul.rarity})\n`;
                soulsText += `      ${soul.description}\n`;
            } else {
                soulsText += `   ⬜ Slot ${i+1} vazio\n`;
            }
        }
        
        const skinText = player.skin ? `🎨 Skin: ${player.skin.emoji} ${player.skin.name}\n` : '🎨 Skin: Nenhuma\n';
        
        const profileMsg =
            `👤 *${player.name || ctx.from.first_name}* (${player.class.charAt(0).toUpperCase() + player.class.slice(1)})\n` +
            `Nível ${player.level} | XP: ${formatNumber(player.xp)} / ${formatNumber(xpNeeded)}\n` +
            `[${xpBar}] ${Math.floor((player.xp/xpNeeded)*100)}%\n` +
            `❤️ HP: ${player.hp}/${player.maxHp} [${hpBar}] ${Math.floor((player.hp/player.maxHp)*100)}%\n\n` +
            `⚔️ ATK: ${player.atk} | 🛡️ DEF: ${player.def}\n` +
            `✨ CRIT: ${player.crit}%\n\n` +
            `💰 Gold: ${formatNumber(player.gold)} | 💎 Nox: ${player.nox || 0} | 🏅 Glórias: ${player.glorias || 0}\n` +
            `⚡ Energia: ${player.energy}/${player.maxEnergy}\n` +
            `🗝️ Chaves: ${player.keys}\n` +
            `🗺️ Mapa: ${map.name} (Lv ${map.level})\n\n` +
            `${skinText}\n` +
            `*Equipamentos:*\n${equipText}\n` +
            `💀 *Almas Equipadas (${player.souls.filter(s => s !== null).length}/2):*\n${soulsText}`;
        
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

// ========== INVENTÁRIO POR CATEGORIAS ==========
bot.action('inventory', async (ctx) => {
    const player = getPlayerSafe(ctx.from.id);
    let text = `🎒 *INVENTÁRIO*\n\n`;
    text += `⚔️ ATK ${player.atk} | 🛡️ DEF ${player.def} | ❤️ HP ${player.maxHp} | ✨ CRIT ${player.crit}%\n\n`;
    text += `Escolha uma categoria:`;
    await ctx.editMessageText(text, inventoryCategoryMenu());
});

bot.action('inv_weapons', async (ctx) => {
    const player = getPlayerSafe(ctx.from.id);
    const weapons = player.inventory.filter(i => i.slot === 'weapon');
    let text = `⚔️ *ARMAS* (${weapons.length})\n\n`;
    weapons.forEach(w => {
        text += `${getRarityColor(w.rarity)} ${w.name} (${w.rarity})\n`;
        text += `   ⚔️ +${w.atk} | 🛡️ +${w.def} | ✨ +${w.crit} | ❤️ +${w.hp}\n`;
        text += `   /equip_${w.id}\n\n`;
    });
    if (weapons.length === 0) text += 'Nenhuma arma no inventário.';
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...inventoryCategoryMenu() });
});

bot.action('inv_armors', async (ctx) => {
    const player = getPlayerSafe(ctx.from.id);
    const armors = player.inventory.filter(i => ['armor', 'helmet', 'boots'].includes(i.slot));
    let text = `🛡️ *ARMADURAS* (${armors.length})\n\n`;
    armors.forEach(a => {
        text += `${getRarityColor(a.rarity)} ${a.name} (${a.rarity})\n`;
        text += `   ⚔️ +${a.atk} | 🛡️ +${a.def} | ✨ +${a.crit} | ❤️ +${a.hp}\n`;
        text += `   /equip_${a.id}\n\n`;
    });
    if (armors.length === 0) text += 'Nenhuma armadura no inventário.';
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...inventoryCategoryMenu() });
});

bot.action('inv_jewelry', async (ctx) => {
    const player = getPlayerSafe(ctx.from.id);
    const jewelry = player.inventory.filter(i => ['ring', 'necklace'].includes(i.slot));
    let text = `💍 *JOIAS* (${jewelry.length})\n\n`;
    jewelry.forEach(j => {
        text += `${getRarityColor(j.rarity)} ${j.name} (${j.rarity})\n`;
        text += `   ⚔️ +${j.atk} | 🛡️ +${j.def} | ✨ +${j.crit} | ❤️ +${j.hp}\n`;
        text += `   /equip_${j.id}\n\n`;
    });
    if (jewelry.length === 0) text += 'Nenhuma joia no inventário.';
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...inventoryCategoryMenu() });
});

bot.action('inv_consumables', async (ctx) => {
    const player = getPlayerSafe(ctx.from.id);
    let text = `🧪 *CONSUMÍVEIS*\n\n`;
    text += `💚 Poção de Vida: ${player.consumables?.potionHp || 0}\n`;
    text += `🔋 Poção de Energia: ${player.consumables?.potionEnergy || 0}\n`;
    text += `💪 Tônico de Força: ${player.consumables?.tonicStrength || 0}\n`;
    text += `🛡️ Tônico de Defesa: ${player.consumables?.tonicDefense || 0}\n`;
    text += `🎯 Tônico de Precisão: ${player.consumables?.tonicPrecision || 0}\n`;
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...inventoryCategoryMenu() });
});

bot.action('inv_souls', async (ctx) => {
    const player = getPlayerSafe(ctx.from.id);
    const souls = player.inventory.filter(i => i.type === 'soul');
    let text = `💀 *ALMAS* (${souls.length})\n\n`;
    souls.forEach(s => {
        text += `${getRarityEmoji(s.rarity)} ${s.name} (${s.rarity})\n`;
        text += `   ${s.description}\n`;
        text += `   /equip_soul_${s.id}\n\n`;
    });
    if (souls.length === 0) text += 'Nenhuma alma no inventário.';
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...inventoryCategoryMenu() });
});

bot.action('inv_skins', async (ctx) => {
    const player = getPlayerSafe(ctx.from.id);
    let text = `🎨 *SKINS* (${player.skins?.length || 0})\n\n`;
    if (player.skins) {
        player.skins.forEach(s => {
            text += `${s.emoji} ${s.name} (${s.rarity})\n`;
            text += `   /equip_skin_${s.id}\n\n`;
        });
    }
    if (player.skin) text += `\n✨ *Equipada:* ${player.skin.emoji} ${player.skin.name}\n`;
    if (!player.skins || player.skins.length === 0) text += 'Nenhuma skin no inventário.';
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...inventoryCategoryMenu() });
});

// Comando para equipar item
bot.command(/^equip_(\d+)/, async (ctx) => {
    try {
        const itemId = parseFloat(ctx.match[1]);
        const player = getPlayer(ctx.from.id);
        const item = player.inventory.find(i => i.id == itemId);
        if (!item) return ctx.reply('Item não encontrado.');

        const current = player.equipment[item.slot];
        if (current) {
            player.inventory.push(current);
        }
        player.equipment[item.slot] = item;
        player.inventory = player.inventory.filter(i => i.id != itemId);
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
        const soul = player.inventory.find(i => i.id == soulId && i.type === 'soul');
        if (!soul) return ctx.reply('Alma não encontrada.');
        
        const emptySlot = player.souls.findIndex(s => s === null);
        if (emptySlot === -1) {
            return ctx.reply('❌ Você já tem 2 almas equipadas! Desequipe uma primeiro.');
        }
        
        player.souls[emptySlot] = soul;
        player.inventory = player.inventory.filter(i => i.id != soulId);
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

// ========== ONLINE ==========
bot.action('online', async (ctx) => {
    const onlineCount = Object.keys(activeFights).length + Math.floor(Math.random() * 100);
    const playersOnline = Math.max(1, onlineCount);
    await ctx.answerCbQuery(`👥 ${playersOnline} jogadores online!`, true);
});

// ========== EM BREVE ==========
['shop', 'dungeon', 'arena', 'guild', 'vip', 'use_potion_hp', 'use_potion_energy', 
 'use_tonic_strength', 'use_tonic_defense', 'use_tonic_precision'].forEach(action => {
    bot.action(action, async (ctx) => {
        await ctx.answerCbQuery('🚧 Em breve!');
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
console.log('Nocta iniciado com sucesso!');
const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const { getPlayer, savePlayer, recalculateStats } = require('./players');
const { updateEnergy, useEnergy } = require('./energy');
const { getRandomEnemy, getMap, getMapByName } = require('./maps');
const { startCombat, playerAttack, playerFlee } = require('./combat');
const { checkLevelUp, xpToNext } = require('./level');
const { progressBar, formatNumber } = require('./utils');
const { generateItem } = require('./items');

const bot = new Telegraf(process.env.BOT_TOKEN);
const activeFights = new Map();

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

// Cores dos equipamentos por raridade
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

// Formata o nome do item com cor
function formatItemName(item) {
    const colorEmoji = getRarityColor(item.rarity);
    return `${colorEmoji} *${item.name}*`;
}

// Monta o texto do menu principal com barras de HP e XP
// No index.js, modificar getMainMenuText()
function getMainMenuText(player) {
    const xpNeeded = xpToNext(player.level);
    const xpPercent = Math.floor((player.xp / xpNeeded) * 100);
    const xpBar = progressBar(player.xp, xpNeeded, 10);
    const hpBar = progressBar(player.hp, player.maxHp, 10);
    const energyBar = progressBar(player.energy, player.maxEnergy, 10);
    
    // Evento sazonal (simulado)
    const events = getActiveEvents();
    const eventText = events.length > 0 ? `🎉 EVENTOS: ${events.join(' | ')}\n` : '';
    
    // Data VIP
    const vipText = player.vipExpires ? `✨ VIP até ${new Date(player.vipExpires).toLocaleDateString()}\n` : '';
    
    return (
        `🌙 *Nocta*\n\n` +
        `👤 ${player.name || ctx.from.first_name} (${player.class})\n` +
        `Nv. ${player.level} | XP: ${formatNumber(player.xp)} (Faltam: ${formatNumber(xpNeeded - player.xp)})\n` +
        `[${xpBar}] ${xpPercent}%\n\n` +
        `❤️ HP: ${player.hp}/${player.maxHp} [${hpBar}] ${Math.floor((player.hp/player.maxHp)*100)}%\n` +
        `⚡ Energia: ${player.energy}/${player.maxEnergy} [${energyBar}] ${Math.floor((player.energy/player.maxEnergy)*100)}%\n` +
        `⚔️ ATK ${player.atk} | 🛡️ DEF ${player.def} | ✨ CRIT ${player.crit}%\n\n` +
        `${eventText}` +
        `${vipText}` +
        `🗝️ Chaves: ${player.keys || 0}\n` +
        `💎 Runas: ${player.runas}\n` +
        `💰 Gold: ${formatNumber(player.gold)}\n` +
        `🗺️ Mapa: ${getMap(player).name} (Lv ${getMap(player).level})\n`
    );
}

// Eventos sazonais
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
    if (Math.random() < 0.1) events.push('🌕 Lua Cheia');
    
    return events;
}

// ========== MENUS ==========
function mainMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ Caçar', 'hunt')],
        [Markup.button.callback('🗺️ Viajar', 'travel')],
        [Markup.button.callback('🎒 Inventário', 'inventory')],
        [Markup.button.callback('👤 Perfil', 'profile')],
        [Markup.button.callback('🛒 Loja', 'shop')],
        [Markup.button.callback('🏛️ Masmorra', 'dungeon')],
        [Markup.button.callback('🏆 Arena', 'arena')],
        [Markup.button.callback('🤝 Guilda', 'guild')],
        [Markup.button.callback('⚡ Energia', 'energy')],
        [Markup.button.callback('💎 VIP', 'vip')]
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

// Adicione no início com os outros imports
const { dropSoul, formatSoulName, getRarityEmoji } = require('./souls');
const { canUseSoul, useSoul } = require('./combat');

// Adicione o menu de almas
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

// Ação de usar alma
bot.action(/^use_soul_(.+)$/, async (ctx) => {
    try {
        const soulId = ctx.match[1];
        const fight = activeFights.get(ctx.from.id);
        if (!fight || fight.ended) {
            const player = getPlayerSafe(ctx.from.id);
            return ctx.editMessageText(getMainMenuText(player), { parse_mode: 'Markdown', ...mainMenu() });
        }
        
        const soul = fight.player.souls.find(s => s && s.id === soulId);
        if (!soul) {
            await ctx.answerCbQuery('Alma não encontrada!');
            return;
        }
        
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
                
                // Drop de itens
                let dropMsg = '';
                if (Math.random() < 0.3) {
                    const item = generateItem(player.level);
                    player.inventory.push(item);
                    dropMsg = `\n📦 *Drop:* ${formatItemName(item)}\n   ⚔️ +${item.atk} | 🛡️ +${item.def} | ✨ +${item.crit} | ❤️ +${item.hp}`;
                }
                
                // Drop de alma
                let soulDropMsg = '';
                const droppedSoul = dropSoul(player.level, player.level);
                if (droppedSoul) {
                    player.inventory.push(droppedSoul);
                    soulDropMsg = `\n💀 *Alma Dropada:* ${formatSoulName(droppedSoul)}\n   ${droppedSoul.description}`;
                }
                
                savePlayer(ctx.from.id, player);
                await ctx.editMessageText(result.message + reward + dropMsg + soulDropMsg + '\n\n' + getMainMenuText(player), 
                    { parse_mode: 'Markdown', ...mainMenu() });
            } else {
                const player = getPlayer(ctx.from.id);
                player.hp = Math.floor(player.maxHp * 0.5);
                savePlayer(ctx.from.id, player);
                await ctx.editMessageText(result.message + `\n💀 *Você foi derrotado!*` + '\n\n' + getMainMenuText(player), 
                    { parse_mode: 'Markdown', ...mainMenu() });
            }
        } else {
            const msg = result.message + `\n\n❤️ Seu HP: ${fight.player.hp}/${fight.player.maxHp}\n` +
                        `🐺 HP inimigo: ${fight.enemy.hp}/${fight.enemy.maxHp}\n\n` +
                        `Escolha sua próxima ação:`;
            await ctx.editMessageText(msg, combatMenu());
        }
    } catch (err) {
        console.error('Erro ao usar alma:', err);
        await ctx.answerCbQuery('Erro ao usar alma.');
    }
});

// Ação de abrir menu de almas no combate
bot.action('combat_souls', async (ctx) => {
    const fight = activeFights.get(ctx.from.id);
    if (!fight || fight.ended) {
        const player = getPlayerSafe(ctx.from.id);
        return ctx.editMessageText(getMainMenuText(player), { parse_mode: 'Markdown', ...mainMenu() });
    }
    
    let text = `💀 *ALMAS EQUIPADAS*\n\n`;
    text += `❤️ Seu HP: ${fight.player.hp}/${fight.player.maxHp}\n`;
    text += `🐺 HP inimigo: ${fight.enemy.hp}/${fight.enemy.maxHp}\n`;
    text += `⚡ Turno: ${fight.turn + 1}\n\n`;
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

// Ação de voltar do menu de almas para o combate
bot.action('combat_back', async (ctx) => {
    const fight = activeFights.get(ctx.from.id);
    if (!fight || fight.ended) {
        const player = getPlayerSafe(ctx.from.id);
        return ctx.editMessageText(getMainMenuText(player), { parse_mode: 'Markdown', ...mainMenu() });
    }
    
    const msg = `❤️ Seu HP: ${fight.player.hp}/${fight.player.maxHp}\n` +
                `🐺 HP inimigo: ${fight.enemy.hp}/${fight.enemy.maxHp}\n\n` +
                `Escolha sua ação:`;
    await ctx.editMessageText(msg, combatMenu());
});

// Modifique o perfil para mostrar almas equipadas
bot.action('profile', async (ctx) => {
    try {
        const player = getPlayerSafe(ctx.from.id);
        const xpNeeded = xpToNext(player.level);
        const xpBar = progressBar(player.xp, xpNeeded);
        const hpBar = progressBar(player.hp, player.maxHp);
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
        
        // Mostrar almas equipadas
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
        
        const profileMsg =
            `👤 *${ctx.from.first_name}* (${player.class.charAt(0).toUpperCase() + player.class.slice(1)})\n` +
            `Nível ${player.level} | XP: ${formatNumber(player.xp)} / ${formatNumber(xpNeeded)}\n` +
            `[${xpBar}] ${Math.floor((player.xp/xpNeeded)*100)}%\n` +
            `❤️ HP: ${player.hp}/${player.maxHp} [${hpBar}] ${Math.floor((player.hp/player.maxHp)*100)}%\n\n` +
            `⚔️ ATK: ${player.atk} | 🛡️ DEF: ${player.def}\n` +
            `✨ CRIT: ${player.crit}%\n\n` +
            `💰 Ouro: ${formatNumber(player.gold)} | 💎 Runas: ${player.runas} | 🏅 Glórias: ${player.glorias}\n` +
            `⚡ Energia: ${player.energy}/${player.maxEnergy}\n` +
            `🗺️ Mapa: ${map.name} (Lv ${map.level})\n\n` +
            `*Equipamentos:*\n${equipText}\n\n` +
            `💀 *Almas Equipadas (${player.souls.filter(s => s !== null).length}/2):*\n${soulsText}`;
        
        await ctx.editMessageText(profileMsg, { parse_mode: 'Markdown', ...mainMenu() });
    } catch (err) {
        console.error('Erro no perfil:', err);
        await ctx.answerCbQuery('Erro ao carregar perfil.');
    }
});

// ========== COMANDOS ==========
bot.start(async (ctx) => {
    const player = getPlayerUpdated(ctx.from.id);
    await ctx.reply(
        getMainMenuText(player),
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
    player.class = className;
    recalculateStats(player);
    savePlayer(ctx.from.id, player);
    ctx.reply(`✅ Classe alterada para ${className.charAt(0).toUpperCase() + className.slice(1)}!`);
});

// ========== CAÇAR E COMBATE ==========
bot.action('hunt', async (ctx) => {
    try {
        const player = getPlayerUpdated(ctx.from.id);
        if (!useEnergy(player)) {
            await ctx.answerCbQuery('⚠️ Energia insuficiente!');
            return ctx.editMessageText(getMainMenuText(player), { parse_mode: 'Markdown', ...mainMenu() });
        }
        savePlayer(ctx.from.id, player);

        const enemy = getRandomEnemy(player);
        const combatState = startCombat(player, enemy);
        activeFights.set(ctx.from.id, combatState);

        const msg = `⚔️ *Combate iniciado!*\n\n` +
                    `🐺 *${enemy.name}* (Nv. ${enemy.minLevel})\n` +
                    `❤️ ${enemy.hp} HP | ⚔️ ${enemy.atk} ATK | 🛡️ ${enemy.def} DEF\n\n` +
                    `❤️ Seu HP: ${player.hp}/${player.maxHp}\n` +
                    `⚡ Energia: ${player.energy}/${player.maxEnergy}\n\n` +
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
            return ctx.editMessageText(getMainMenuText(player), { parse_mode: 'Markdown', ...mainMenu() });
        }

        const result = playerAttack(fight);
        let response = result.message;

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
                    dropMsg = `\n📦 *Drop:* ${formatItemName(item)}\n` +
                              `   ⚔️ +${item.atk} | 🛡️ +${item.def} | ✨ +${item.crit} | ❤️ +${item.hp}`;
                }
                savePlayer(ctx.from.id, player);

                await ctx.editMessageText(response + reward + dropMsg + '\n\n' + getMainMenuText(player), 
                    { parse_mode: 'Markdown', ...mainMenu() });
            } else if (result.winner === 'enemy') {
                const player = getPlayer(ctx.from.id);
                player.hp = Math.floor(player.maxHp * 0.5);
                savePlayer(ctx.from.id, player);
                await ctx.editMessageText(response + `\n💀 *Você foi derrotado!* Seu HP foi reduzido a ${player.hp}/${player.maxHp}.` + '\n\n' + getMainMenuText(player), 
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
            return ctx.editMessageText(getMainMenuText(player), { parse_mode: 'Markdown', ...mainMenu() });
        }

        const result = playerFlee(fight);
        
        // SEMPRE sair do combate, independente do resultado
        activeFights.delete(ctx.from.id);
        
        if (result.success) {
            // Fuga bem sucedida
            const player = getPlayerSafe(ctx.from.id);
            await ctx.editMessageText(result.message + '\n\n' + getMainMenuText(player), 
                { parse_mode: 'Markdown', ...mainMenu() });
        } else {
            // Fuga falhou, mas ainda sai do combate
            const player = getPlayer(ctx.from.id);
            player.hp = fight.player.hp; // atualiza HP do jogador com o dano da fuga
            if (player.hp <= 0) {
                player.hp = Math.floor(player.maxHp * 0.5);
                savePlayer(ctx.from.id, player);
                await ctx.editMessageText(result.message + `\n💀 Você foi derrotado!` + '\n\n' + getMainMenuText(player), 
                    { parse_mode: 'Markdown', ...mainMenu() });
            } else {
                savePlayer(ctx.from.id, player);
                await ctx.editMessageText(result.message + '\n\n' + getMainMenuText(player), 
                    { parse_mode: 'Markdown', ...mainMenu() });
            }
        }
    } catch (err) {
        console.error('Erro ao fugir:', err);
        await ctx.answerCbQuery('Erro interno. Tente novamente.');
    }
});

// ========== PERFIL ==========
bot.action('profile', async (ctx) => {
    try {
        const player = getPlayerSafe(ctx.from.id);
        const xpNeeded = xpToNext(player.level);
        const xpBar = progressBar(player.xp, xpNeeded);
        const hpBar = progressBar(player.hp, player.maxHp);
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

        const profileMsg =
            `👤 *${ctx.from.first_name}* (${player.class.charAt(0).toUpperCase() + player.class.slice(1)})\n` +
            `Nível ${player.level} | XP: ${formatNumber(player.xp)} / ${formatNumber(xpNeeded)}\n` +
            `[${xpBar}] ${Math.floor((player.xp/xpNeeded)*100)}%\n` +
            `❤️ HP: ${player.hp}/${player.maxHp} [${hpBar}] ${Math.floor((player.hp/player.maxHp)*100)}%\n\n` +
            `⚔️ ATK: ${player.atk} | 🛡️ DEF: ${player.def}\n` +
            `✨ CRIT: ${player.crit}%\n\n` +
            `💰 Ouro: ${formatNumber(player.gold)} | 💎 Runas: ${player.runas} | 🏅 Glórias: ${player.glorias}\n` +
            `⚡ Energia: ${player.energy}/${player.maxEnergy}\n` +
            `🗺️ Mapa: ${map.name} (Lv ${map.level})\n\n` +
            `*Equipamentos:*\n${equipText}`;

        await ctx.editMessageText(profileMsg, { parse_mode: 'Markdown', ...mainMenu() });
    } catch (err) {
        console.error('Erro no perfil:', err);
        await ctx.answerCbQuery('Erro ao carregar perfil.');
    }
});

// ========== INVENTÁRIO COM EQUIPAR E DESEQUIPAR ==========
// Guarda a página atual do inventário
const invPages = new Map();

bot.action('inventory', async (ctx) => {
    try {
        const player = getPlayerSafe(ctx.from.id);
        
        // Mostra itens equipados primeiro
        let text = `🎒 *INVENTÁRIO* (${player.inventory.length}/${player.maxInventory})\n\n`;
        
        // Seção: Itens Equipados
        text += `⚔️ *EQUIPADOS*\n`;
        const slotEmojis = {
            weapon: '⚔️', armor: '🛡️', helmet: '⛑️', boots: '👢',
            ring: '💍', necklace: '📿', bag: '🎒'
        };
        
        let hasEquipped = false;
        for (const [slot, item] of Object.entries(player.equipment)) {
            if (item) {
                hasEquipped = true;
                text += `   ${slotEmojis[slot]} ${formatItemName(item)}\n`;
                text += `      ⚔️ +${item.atk} | 🛡️ +${item.def} | ✨ +${item.crit} | ❤️ +${item.hp}\n`;
            }
        }
        if (!hasEquipped) {
            text += `   Nenhum item equipado\n`;
        }
        
        // Seção: Itens no Inventário
        text += `\n📦 *NO INVENTÁRIO*\n`;
        
        if (player.inventory.length === 0) {
            text += `   Nenhum item no inventário\n`;
        } else {
            const itemsPerPage = 4;
            const totalPages = Math.ceil(player.inventory.length / itemsPerPage);
            let page = invPages.get(ctx.from.id) || 1;
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;
            
            const start = (page - 1) * itemsPerPage;
            const itemsToShow = player.inventory.slice(start, start + itemsPerPage);
            
            if (totalPages > 1) {
                text += `Página ${page} de ${totalPages}\n`;
            }
            
            itemsToShow.forEach((item) => {
                text += `\n${getRarityColor(item.rarity)} *${item.name}* (${item.rarity})\n`;
                text += `   ⚔️ +${item.atk} | 🛡️ +${item.def} | ✨ +${item.crit} | ❤️ +${item.hp}\n`;
            });
            
            // Botões de paginação para o inventário
            const navButtons = [];
            if (page > 1) {
                navButtons.push(Markup.button.callback('◀️ Anterior', 'inv_prev'));
            }
            if (page < totalPages) {
                navButtons.push(Markup.button.callback('Próximo ▶️', 'inv_next'));
            }
            
            invPages.set(ctx.from.id, page);
            
            // Montar teclado com botões de equipar para cada item
            const keyboard = [];
            
            // Adiciona botões para cada item da página atual
            itemsToShow.forEach((item) => {
                keyboard.push([Markup.button.callback(`⚔️ Equipar ${item.name}`, `equip_item_${item.id}`)]);
            });
            
            // Adiciona botões de paginação
            if (navButtons.length > 0) {
                keyboard.push(navButtons);
            }
            
            // Botões para desequipar
            const unequipButtons = [];
            for (const [slot, item] of Object.entries(player.equipment)) {
                if (item) {
                    const slotName = {
                        weapon: 'Arma', armor: 'Armadura', helmet: 'Capacete', 
                        boots: 'Botas', ring: 'Anel', necklace: 'Colar', bag: 'Mochila'
                    }[slot];
                    unequipButtons.push(Markup.button.callback(`🔄 Desequipar ${slotName}`, `unequip_${slot}`));
                }
            }
            if (unequipButtons.length > 0) {
                keyboard.push(unequipButtons);
            }
            
            keyboard.push([Markup.button.callback('◀️ Voltar ao Menu', 'menu')]);
            
            await ctx.editMessageText(text, { 
                parse_mode: 'Markdown', 
                ...Markup.inlineKeyboard(keyboard) 
            });
            return;
        }
        
        // Se não tem itens no inventário, mostra só os equipados
        const keyboard = [];
        
        // Botões para desequipar
        const unequipButtons = [];
        for (const [slot, item] of Object.entries(player.equipment)) {
            if (item) {
                const slotName = {
                    weapon: 'Arma', armor: 'Armadura', helmet: 'Capacete', 
                    boots: 'Botas', ring: 'Anel', necklace: 'Colar', bag: 'Mochila'
                }[slot];
                unequipButtons.push(Markup.button.callback(`🔄 Desequipar ${slotName}`, `unequip_${slot}`));
            }
        }
        if (unequipButtons.length > 0) {
            keyboard.push(unequipButtons);
        }
        keyboard.push([Markup.button.callback('◀️ Voltar ao Menu', 'menu')]);
        
        await ctx.editMessageText(text, { 
            parse_mode: 'Markdown', 
            ...Markup.inlineKeyboard(keyboard) 
        });
    } catch (err) {
        console.error('Erro no inventário:', err);
        await ctx.answerCbQuery('Erro ao carregar inventário.');
    }
});

// Navegação do inventário
bot.action('inv_prev', async (ctx) => {
    let page = invPages.get(ctx.from.id) || 1;
    if (page > 1) page--;
    invPages.set(ctx.from.id, page);
    await ctx.answerCbQuery();
    await bot.actions.inventory(ctx);
});

bot.action('inv_next', async (ctx) => {
    let page = invPages.get(ctx.from.id) || 1;
    const player = getPlayerSafe(ctx.from.id);
    const totalPages = Math.ceil(player.inventory.length / 4);
    if (page < totalPages) page++;
    invPages.set(ctx.from.id, page);
    await ctx.answerCbQuery();
    await bot.actions.inventory(ctx);
});

// Ação de equipar via botão
bot.action(/^equip_item_(.+)$/, async (ctx) => {
    try {
        const itemId = parseFloat(ctx.match[1]);
        const player = getPlayer(ctx.from.id);
        const item = player.inventory.find(i => i.id == itemId);
        if (!item) {
            await ctx.answerCbQuery('Item não encontrado!');
            return;
        }

        // Desequipa item atual se existir
        const current = player.equipment[item.slot];
        if (current) {
            player.inventory.push(current);
        }
        
        // Equipa novo item
        player.equipment[item.slot] = item;
        player.inventory = player.inventory.filter(i => i.id != itemId);
        recalculateStats(player);
        savePlayer(ctx.from.id, player);
        
        await ctx.answerCbQuery(`✅ ${item.name} equipado!`);
        
        // Reseta a página do inventário
        invPages.delete(ctx.from.id);
        
        // Atualiza o inventário
        await bot.actions.inventory(ctx);
    } catch (err) {
        console.error('Erro ao equipar:', err);
        await ctx.answerCbQuery('Erro ao equipar item.');
    }
});

// Ação de desequipar via botão
bot.action(/^unequip_(.+)$/, async (ctx) => {
    try {
        const slot = ctx.match[1];
        const player = getPlayer(ctx.from.id);
        const item = player.equipment[slot];
        
        if (!item) {
            await ctx.answerCbQuery('Nada equipado neste slot!');
            return;
        }
        
        // Verifica espaço no inventário
        if (player.inventory.length >= player.maxInventory) {
            await ctx.answerCbQuery('❌ Inventário cheio! Venda ou descarte itens primeiro.');
            return;
        }
        
        // Move para o inventário
        player.inventory.push(item);
        player.equipment[slot] = null;
        recalculateStats(player);
        savePlayer(ctx.from.id, player);
        
        const slotName = {
            weapon: 'Arma', armor: 'Armadura', helmet: 'Capacete', 
            boots: 'Botas', ring: 'Anel', necklace: 'Colar', bag: 'Mochila'
        }[slot];
        
        await ctx.answerCbQuery(`🔄 ${item.name} removido!`);
        
        // Atualiza o inventário
        await bot.actions.inventory(ctx);
    } catch (err) {
        console.error('Erro ao desequipar:', err);
        await ctx.answerCbQuery('Erro ao desequipar item.');
    }
});

// ========== VIAJAR ==========
bot.action('travel', async (ctx) => {
    try {
        const player = getPlayerUpdated(ctx.from.id);
        const { maps } = require('./maps');
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
        const { getMapByName } = require('./maps');
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
        const bar = progressBar(player.energy, player.maxEnergy);
        await ctx.editMessageText(
            `⚡ *Energia*: ${player.energy}/${player.maxEnergy}\n` +
            `[${bar}] ${Math.floor((player.energy/player.maxEnergy)*100)}%\n\n` +
            `Regeneração: ${player.vip ? '1 a cada 3 min' : '1 a cada 6 min'}\n` +
            `Compre poções de energia na loja.` + '\n\n' + getMainMenuText(player),
            { parse_mode: 'Markdown', ...mainMenu() }
        );
    } catch (err) {
        console.error('Erro na energia:', err);
        await ctx.answerCbQuery('Erro ao mostrar energia.');
    }
});

// ========== EM BREVE ==========
['shop', 'dungeon', 'arena', 'guild', 'vip', 'combat_items', 'combat_souls'].forEach(action => {
    bot.action(action, async (ctx) => {
        await ctx.answerCbQuery('🚧 Em breve!');
    });
});

// Voltar ao menu
bot.action('menu', async (ctx) => {
    try {
        const player = getPlayerSafe(ctx.from.id);
        await ctx.editMessageText(getMainMenuText(player), { parse_mode: 'Markdown', ...mainMenu() });
    } catch (err) {
        console.error('Erro ao voltar:', err);
        await ctx.reply('Erro ao voltar ao menu.');
    }
});

bot.launch();
console.log('Nocta iniciado com sucesso!');

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

// Servidor para manter o bot acordado (Replit)
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

// Formata o nome do item com cor (usando emoji de cor)
function formatItemName(item) {
    const colorEmoji = getRarityColor(item.rarity);
    return `${colorEmoji} *${item.name}* (${item.rarity})`;
}

// Monta o texto do menu principal com barras de HP e XP
function getMainMenuText(player) {
    const xpNeeded = xpToNext(player.level);
    const xpPercent = Math.floor((player.xp / xpNeeded) * 100);
    const xpBar = progressBar(player.xp, xpNeeded, 10);
    const hpBar = progressBar(player.hp, player.maxHp, 10);

    return (
        `🌙 *Nocta*\n\n` +
        `👤 ${player.class.charAt(0).toUpperCase() + player.class.slice(1)} Nv. ${player.level}\n` +
        `❤️ HP: ${player.hp}/${player.maxHp} [${hpBar}] ${Math.floor((player.hp/player.maxHp)*100)}%\n` +
        `✨ XP: ${formatNumber(player.xp)}/${formatNumber(xpNeeded)} [${xpBar}] ${xpPercent}%\n` +
        `⚡ Energia: ${player.energy}/${player.maxEnergy}\n` +
        `💰 Ouro: ${formatNumber(player.gold)}\n` +
        `🗺️ ${getMap(player).name}\n`
    );
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
            } else if (result.winner === 'fled') {
                const player = getPlayerSafe(ctx.from.id);
                await ctx.editMessageText(response + '\n\n' + getMainMenuText(player), 
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
        if (result.success || fight.ended) {
            activeFights.delete(ctx.from.id);
            if (fight.winner === 'enemy') {
                const player = getPlayer(ctx.from.id);
                player.hp = Math.floor(player.maxHp * 0.5);
                savePlayer(ctx.from.id, player);
                await ctx.editMessageText(result.message + `\n💀 Você foi derrotado!` + '\n\n' + getMainMenuText(player), 
                    { parse_mode: 'Markdown', ...mainMenu() });
            } else {
                const player = getPlayerSafe(ctx.from.id);
                await ctx.editMessageText(result.message + '\n\n' + getMainMenuText(player), 
                    { parse_mode: 'Markdown', ...mainMenu() });
            }
        } else {
            const msg = result.message + `\n\n❤️ Seu HP: ${fight.player.hp}/${fight.player.maxHp}\n` +
                        `🐺 HP inimigo: ${fight.enemy.hp}/${fight.enemy.maxHp}\n\n` +
                        `Escolha sua próxima ação:`;
            await ctx.editMessageText(msg, combatMenu());
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

// ========== INVENTÁRIO COM BOTÕES EQUIPAR ==========
bot.action('inventory', async (ctx) => {
    try {
        const player = getPlayerSafe(ctx.from.id);
        if (player.inventory.length === 0) {
            return ctx.editMessageText('🎒 Seu inventário está vazio.\n\n' + getMainMenuText(player), 
                { parse_mode: 'Markdown', ...mainMenu() });
        }

        // Limita a 10 itens por página (evita mensagem muito longa)
        const itemsPerPage = 5;
        const totalPages = Math.ceil(player.inventory.length / itemsPerPage);
        let page = parseInt(ctx.session?.invPage) || 1;
        if (isNaN(page)) page = 1;
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;

        const start = (page - 1) * itemsPerPage;
        const itemsToShow = player.inventory.slice(start, start + itemsPerPage);

        let text = `🎒 *Inventário* (${player.inventory.length}/${player.maxInventory})\n`;
        if (totalPages > 1) {
            text += `Página ${page} de ${totalPages}\n`;
        }
        text += `\n`;

        // Monta teclado com botões de equipar
        const keyboard = [];
        itemsToShow.forEach((item) => {
            text += `${getRarityColor(item.rarity)} *${item.name}* (${item.rarity})\n`;
            text += `   ⚔️ +${item.atk} | 🛡️ +${item.def} | ✨ +${item.crit} | ❤️ +${item.hp}\n`;
            // Adiciona botão de equipar para cada item
            keyboard.push([Markup.button.callback(`⚔️ Equipar ${item.name}`, `equip_item_${item.id}`)]);
            text += `\n`;
        });

        // Botões de paginação
        const navButtons = [];
        if (page > 1) {
            navButtons.push(Markup.button.callback('◀️ Anterior', 'inv_prev'));
        }
        if (page < totalPages) {
            navButtons.push(Markup.button.callback('Próximo ▶️', 'inv_next'));
        }
        if (navButtons.length > 0) {
            keyboard.push(navButtons);
        }
        keyboard.push([Markup.button.callback('◀️ Voltar ao Menu', 'menu')]);

        // Guarda a página atual na sessão (usando um Map simples)
        if (!ctx.session) ctx.session = {};
        ctx.session.invPage = page;

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
    if (!ctx.session) ctx.session = {};
    let page = ctx.session.invPage || 1;
    if (page > 1) page--;
    ctx.session.invPage = page;
    await ctx.answerCbQuery();
    await bot.actions.inventory(ctx);
});

bot.action('inv_next', async (ctx) => {
    if (!ctx.session) ctx.session = {};
    let page = ctx.session.invPage || 1;
    const player = getPlayerSafe(ctx.from.id);
    const totalPages = Math.ceil(player.inventory.length / 5);
    if (page < totalPages) page++;
    ctx.session.invPage = page;
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
        
        // Atualiza o inventário para mostrar a lista atualizada
        await bot.actions.inventory(ctx);
    } catch (err) {
        console.error('Erro ao equipar:', err);
        await ctx.answerCbQuery('Erro ao equipar item.');
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
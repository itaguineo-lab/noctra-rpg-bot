const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const { getPlayer, savePlayer, recalculateStats } = require('./players');
const { updateEnergy, useEnergy } = require('./energy');
const { getRandomEnemy, getMap, getMapByName } = require('./maps');
const { startCombat, playerAttack, playerFlee, calculateDamage } = require('./combat');
const { checkLevelUp, xpToNext } = require('./level');
const { progressBar, formatNumber } = require('./utils');
const { generateItem } = require('./items');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Estado de combate
const activeFights = new Map();

// Servidor para manter o bot acordado
const app = express();
app.get('/', (req, res) => res.send('Nocta Online!'));
app.listen(process.env.PORT || 3000);

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

// Helper para garantir energia atualizada
function ensureEnergyUpdated(player) {
    updateEnergy(player);
    savePlayer(player.id, player);
}

// ========== COMANDOS ==========
bot.start(async (ctx) => {
    const player = getPlayer(ctx.from.id);
    ensureEnergyUpdated(player);
    await ctx.reply(
        `🌙 *Bem-vindo a Nocta, ${ctx.from.first_name}!*\n\n` +
        `Você é um aventureiro em um mundo de noite eterna.\n` +
        `Escolha sua classe com /class <guerreiro|arqueiro|mago>.\n` +
        `Por enquanto você é Arqueiro.`,
        { parse_mode: 'Markdown', ...mainMenu() }
    );
});

// Comando para mudar classe (opcional)
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

// ========== AÇÕES DO MENU ==========

// Caçar
bot.action('hunt', async (ctx) => {
    const player = getPlayer(ctx.from.id);
    ensureEnergyUpdated(player);
    if (!useEnergy(player)) {
        return ctx.editMessageText('⚠️ *Energia insuficiente!* Aguarde a regeneração.', { parse_mode: 'Markdown', ...mainMenu() });
    }

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
});

// Atacar no combate
bot.action('combat_attack', async (ctx) => {
    const fight = activeFights.get(ctx.from.id);
    if (!fight || fight.ended) {
        return ctx.editMessageText('Nenhum combate ativo.', mainMenu());
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
            recalculateStats(player); // recalcula depois do level up
            let reward = `\n✅ *Vitória!*\n💰 +${enemy.gold} ouro\n✨ +${enemy.exp} XP`;
            if (levelUp) reward += `\n🎉 *UP! Agora nível ${player.level}!* 🎉`;

            // Chance de drop (30%)
            if (Math.random() < 0.3) {
                const item = generateItem(player.level);
                player.inventory.push(item);
                reward += `\n📦 Drop: ${item.emoji} ${item.name} (${item.rarity})`;
            }
            savePlayer(ctx.from.id, player);
            await ctx.editMessageText(response + reward, mainMenu());
        } else if (result.winner === 'enemy') {
            const player = getPlayer(ctx.from.id);
            player.hp = Math.floor(player.maxHp * 0.5);
            savePlayer(ctx.from.id, player);
            await ctx.editMessageText(response + `\n💀 *Você foi derrotado!* Seu HP foi reduzido a ${player.hp}/${player.maxHp}.`, mainMenu());
        } else if (result.winner === 'fled') {
            await ctx.editMessageText(response, mainMenu());
        }
    } else {
        const msg = response + `\n\n❤️ Seu HP: ${fight.player.hp}/${fight.player.maxHp}\n` +
                    `🐺 HP inimigo: ${fight.enemy.hp}/${fight.enemy.maxHp}\n\n` +
                    `Escolha sua próxima ação:`;
        await ctx.editMessageText(msg, combatMenu());
    }
});

// Fugir
bot.action('combat_flee', async (ctx) => {
    const fight = activeFights.get(ctx.from.id);
    if (!fight) return ctx.editMessageText('Sem combate.', mainMenu());

    const result = playerFlee(fight);
    if (result.success || fight.ended) {
        activeFights.delete(ctx.from.id);
        if (fight.winner === 'enemy') {
            const player = getPlayer(ctx.from.id);
            player.hp = Math.floor(player.maxHp * 0.5);
            savePlayer(ctx.from.id, player);
            await ctx.editMessageText(result.message + `\n💀 Você foi derrotado!`, mainMenu());
        } else {
            await ctx.editMessageText(result.message, mainMenu());
        }
    } else {
        const msg = result.message + `\n\n❤️ Seu HP: ${fight.player.hp}/${fight.player.maxHp}\n` +
                    `🐺 HP inimigo: ${fight.enemy.hp}/${fight.enemy.maxHp}\n\n` +
                    `Escolha sua próxima ação:`;
        await ctx.editMessageText(msg, combatMenu());
    }
});

// Perfil
bot.action('profile', async (ctx) => {
    const player = getPlayer(ctx.from.id);
    ensureEnergyUpdated(player);
    recalculateStats(player); // garantir stats atualizados

    const xpNeeded = xpToNext(player.level);
    const xpBar = progressBar(player.xp, xpNeeded);
    const map = getMap(player);

    let equipText = '';
    const slotEmojis = {
        weapon: '⚔️', armor: '🛡️', helmet: '⛑️', boots: '👢',
        ring: '💍', necklace: '📿', bag: '🎒'
    };
    for (const [slot, item] of Object.entries(player.equipment)) {
        if (item) {
            equipText += `   ${slotEmojis[slot]} ${item.name} (${item.rarity})\n`;
        } else {
            equipText += `   ${slotEmojis[slot]} Vazio\n`;
        }
    }

    const profileMsg =
        `👤 *${ctx.from.first_name}* (${player.class.charAt(0).toUpperCase() + player.class.slice(1)})\n` +
        `Nível ${player.level} | XP: ${formatNumber(player.xp)} / ${formatNumber(xpNeeded)}\n` +
        `[${xpBar}] ${Math.floor((player.xp/xpNeeded)*100)}%\n\n` +
        `❤️ HP: ${player.hp}/${player.maxHp}\n` +
        `⚔️ ATK: ${player.atk} | 🛡️ DEF: ${player.def}\n` +
        `✨ CRIT: ${player.crit}% | ⚡ AGI: ${player.agi}\n\n` +
        `💰 Ouro: ${formatNumber(player.gold)} | 💎 Runas: ${player.runas} | 🏅 Glórias: ${player.glorias}\n` +
        `⚡ Energia: ${player.energy}/${player.maxEnergy}\n` +
        `🗺️ Mapa: ${map.name} (Lv ${map.level})\n\n` +
        `*Equipamentos:*\n${equipText}`;

    await ctx.editMessageText(profileMsg, { parse_mode: 'Markdown', ...mainMenu() });
});

// Inventário
bot.action('inventory', async (ctx) => {
    const player = getPlayer(ctx.from.id);
    ensureEnergyUpdated(player);

    if (player.inventory.length === 0) {
        return ctx.editMessageText('🎒 Seu inventário está vazio.', mainMenu());
    }

    let text = `🎒 *Inventário* (${player.inventory.length}/${player.maxInventory})\n\n`;
    // Mostrar apenas os 5 primeiros por simplicidade (pode depois paginar)
    const itemsToShow = player.inventory.slice(0, 10);
    itemsToShow.forEach((item) => {
        text += `${item.emoji} *${item.name}* (${item.rarity})\n`;
        text += `   ⚔️ +${item.atk} | 🛡️ +${item.def} | ✨ +${item.crit} | ❤️ +${item.hp}\n`;
        text += `   /equip_${item.id}\n\n`;
    });
    text += `Use /equip_<id> para equipar. Ex: /equip_${player.inventory[0]?.id}`;

    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainMenu() });
});

// Comando para equipar (exemplo)
bot.command(/^equip_(\d+)/, async (ctx) => {
    const itemId = ctx.match[1];
    const player = getPlayer(ctx.from.id);
    const item = player.inventory.find(i => i.id == itemId);
    if (!item) return ctx.reply('Item não encontrado.');

    // Verificar slot
    const current = player.equipment[item.slot];
    if (current) {
        // Devolve o equipado para o inventário
        player.inventory.push(current);
    }
    player.equipment[item.slot] = item;
    player.inventory = player.inventory.filter(i => i.id != itemId);
    recalculateStats(player);
    savePlayer(ctx.from.id, player);
    ctx.reply(`✅ Equipado: ${item.name}`);
});

// Viajar
bot.action('travel', async (ctx) => {
    const player = getPlayer(ctx.from.id);
    ensureEnergyUpdated(player);

    let text = `🗺️ *Escolha seu destino:*\n\n`;
    const keyboard = [];
    const { maps } = require('./maps');
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
});

bot.action(/^travel_to_(.+)$/, async (ctx) => {
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
});

bot.action('travel_locked', async (ctx) => {
    await ctx.answerCbQuery('Este mapa ainda está bloqueado! Suba de nível para desbloquear.', true);
});

// Energia
bot.action('energy', async (ctx) => {
    const player = getPlayer(ctx.from.id);
    ensureEnergyUpdated(player);
    const bar = progressBar(player.energy, player.maxEnergy);
    await ctx.editMessageText(
        `⚡ *Energia*: ${player.energy}/${player.maxEnergy}\n` +
        `[${bar}] ${Math.floor((player.energy/player.maxEnergy)*100)}%\n\n` +
        `Regeneração: ${player.vip ? '1 a cada 3 min' : '1 a cada 6 min'}\n` +
        `Compre poções de energia na loja.`,
        { parse_mode: 'Markdown', ...mainMenu() }
    );
});

// Botões "em breve"
const emBreve = ['shop', 'dungeon', 'arena', 'guild', 'vip'];
emBreve.forEach(action => {
    bot.action(action, async (ctx) => {
        await ctx.answerCbQuery('🚧 Em breve!');
    });
});

// Voltar ao menu principal
bot.action('menu', async (ctx) => {
    await ctx.editMessageText('🌙 *Menu Principal*', { parse_mode: 'Markdown', ...mainMenu() });
});

// Inicialização
bot.launch();
console.log('Bot Nocta iniciado!');
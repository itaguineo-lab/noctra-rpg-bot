const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const { getPlayer, savePlayer } = require('./players');
const { updateEnergy, useEnergy } = require('./energy');
const { getRandomEnemy } = require('./maps');
const { startCombat, playerAttack, calculateDamage } = require('./combat');
const { checkLevelUp, xpToNext } = require('./level');
const { progressBar, formatNumber } = require('./utils');
const { generateItem } = require('./items');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Estado de combate (simples, armazenado em memória)
const activeFights = new Map(); // key: userId, value: combatState

// Servidor para manter o bot acordado
const app = express();
app.get('/', (req, res) => res.send('Nocta Online!'));
app.listen(process.env.PORT || 3000);

// ========== MENUS ==========
// ... imports existentes ...

// Função para gerar o teclado do menu principal
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

// Callbacks básicos (por enquanto apenas mostram mensagens de "em breve")
bot.action('travel', async (ctx) => {
    await ctx.answerCbQuery('🚧 Em breve!');
    // Aqui chamaremos o sistema de viagem depois
});
bot.action('shop', async (ctx) => {
    await ctx.answerCbQuery('🚧 Em breve!');
});
bot.action('dungeon', async (ctx) => {
    await ctx.answerCbQuery('🚧 Em breve!');
});
bot.action('arena', async (ctx) => {
    await ctx.answerCbQuery('🚧 Em breve!');
});
bot.action('guild', async (ctx) => {
    await ctx.answerCbQuery('🚧 Em breve!');
});
bot.action('vip', async (ctx) => {
    await ctx.answerCbQuery('🚧 Em breve!');
});

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
    const player = getPlayer(ctx.from.id);
    updateEnergy(player);
    await ctx.reply(
        `🌙 *Bem-vindo a Nocta, ${ctx.from.first_name}!*\n\n` +
        `Você é um aventureiro em um mundo de noite eterna.\n` +
        `Use os botões para explorar.`,
        { parse_mode: 'Markdown', ...mainMenu() }
    );
});

// Ação principal: Caçar
bot.action('hunt', async (ctx) => {
    const player = getPlayer(ctx.from.id);
    updateEnergy(player); // implementar depois
    if (!useEnergy(player)) {
        return ctx.editMessageText('⚠️ *Energia insuficiente!* Aguarde a regeneração.', { parse_mode: 'Markdown', ...mainMenu() });
    }

    const enemy = getRandomEnemy(player); // de maps.js
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

    // Escolher inimigo
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

// Ação de ataque no combate
bot.action('combat_attack', async (ctx) => {
    const fight = activeFights.get(ctx.from.id);
    if (!fight || fight.ended) {
        return ctx.editMessageText('Nenhum combate ativo.', mainMenu());
    }

    const result = playerAttack(fight);
    let response = `⚔️ Você causou *${result.damage}* de dano!\n`;
    if (result.enemyDamage) response += `🐺 Inimigo causou *${result.enemyDamage}* de dano!\n`;

    if (fight.ended) {
        if (fight.winner === 'player') {
            // Vitória
            const enemy = fight.enemy;
            const player = getPlayer(ctx.from.id);
            player.xp += enemy.exp;
            player.gold += enemy.gold;
            const levelUp = checkLevelUp(player);
            player.hp = fight.player.hp; // atualiza hp do player original

            let reward = `✅ *Vitória!*\n💰 +${enemy.gold} ouro\n✨ +${enemy.exp} XP\n`;
            if (levelUp) reward += `🎉 *UP! Agora nível ${player.level}!* 🎉\n`;

            // Chance de drop (30%)
            if (Math.random() < 0.3) {
                const item = generateItem(player.level);
                player.inventory.push(item);
                reward += `📦 Drop: ${item.emoji} ${item.name} (${item.rarity})\n`;
            }

            activeFights.delete(ctx.from.id);
            await ctx.editMessageText(response + reward, mainMenu());
        } else {
            // Derrota
            const player = getPlayer(ctx.from.id);
            player.hp = Math.floor(player.maxHp * 0.5); // perde metade do HP
            activeFights.delete(ctx.from.id);
            await ctx.editMessageText(response + `💀 *Você foi derrotado!* Seu HP foi reduzido a ${player.hp}/${player.maxHp}.`, mainMenu());
        }
    } else {
        // Combate continua
        await ctx.editMessageText(
            response + `\n❤️ Seu HP: ${fight.player.hp}/${fight.player.maxHp}\n` +
            `🐺 HP inimigo: ${fight.enemy.hp}/${fight.enemy.maxHp}\n\n` +
            `Escolha sua próxima ação:`,
            combatMenu()
        );
    }
});

// Ação de fugir
bot.action('combat_flee', async (ctx) => {
    const fight = activeFights.get(ctx.from.id);
    if (!fight) return ctx.editMessageText('Sem combate.', mainMenu());

    const chance = 0.5;
    if (Math.random() < chance) {
        activeFights.delete(ctx.from.id);
        await ctx.editMessageText('🏃 Você fugiu com sucesso!', mainMenu());
    } else {
        // Fuga falhou, inimigo ataca
        const enemyDamage = calculateDamage(fight.enemy.atk, fight.player.def);
        fight.player.hp -= enemyDamage;
        if (fight.player.hp <= 0) {
            activeFights.delete(ctx.from.id);
            const player = getPlayer(ctx.from.id);
            player.hp = Math.floor(player.maxHp * 0.5);
            await ctx.editMessageText(`💀 Falha na fuga! Você foi derrotado... HP reduzido a ${player.hp}/${player.maxHp}.`, mainMenu());
        } else {
            await ctx.editMessageText(`🏃 Fuga falhou! O inimigo atacou e causou ${enemyDamage} de dano.\n\nSeu HP: ${fight.player.hp}/${fight.player.maxHp}\nEscolha outra ação:`, combatMenu());
        }
    }
});

// Perfil do jogador
bot.action('profile', async (ctx) => {
    const player = getPlayer(ctx.from.id);
    updateEnergy(player);
    const xpNeeded = xpToNext(player.level);
    const xpBar = progressBar(player.xp, xpNeeded);
    const profileMsg = 
        `👤 *${ctx.from.first_name}* (${player.class.charAt(0).toUpperCase() + player.class.slice(1)})\n` +
        `Nível ${player.level} | XP: ${formatNumber(player.xp)} / ${formatNumber(xpNeeded)}\n` +
        `[${xpBar}] ${Math.floor((player.xp/xpNeeded)*100)}%\n\n` +
        `❤️ HP: ${player.hp}/${player.maxHp}\n` +
        `⚔️ ATK: ${player.atk} | 🛡️ DEF: ${player.def}\n` +
        `✨ CRIT: ${player.crit}% | ⚡ AGI: ${player.agi}\n\n` +
        `💰 Ouro: ${formatNumber(player.gold)}\n` +
        `⚡ Energia: ${player.energy}/${player.maxEnergy}\n` +
        `🗺️ Mapa: ${getMapName(player)}`; // função auxiliar
    await ctx.editMessageText(profileMsg, { parse_mode: 'Markdown', ...mainMenu() });
});

function getMapName(player) {
    // import getMap de maps
    const { getMap } = require('./maps');
    const map = getMap(player);
    return map.name;
}

// Inventário simples
bot.action('inventory', async (ctx) => {
    const player = getPlayer(ctx.from.id);
    if (player.inventory.length === 0) {
        return ctx.editMessageText('🎒 Seu inventário está vazio.', mainMenu());
    }
    let invText = `🎒 *Inventário* (${player.inventory.length}/${player.maxInventory})\n\n`;
    player.inventory.forEach((item, idx) => {
        invText += `${item.emoji} *${item.name}* (${item.rarity})\n`;
        invText += `   ⚔️ ${item.atk} | 🛡️ ${item.def} | ✨ ${item.crit} | ❤️ ${item.hp}\n`;
    });
    invText += `\nUse /equip <id> para equipar.`;
    await ctx.editMessageText(invText, { parse_mode: 'Markdown', ...mainMenu() });
});

// Energia
bot.action('energy', async (ctx) => {
    const player = getPlayer(ctx.from.id);
    updateEnergy(player);
    const bar = progressBar(player.energy, player.maxEnergy);
    await ctx.editMessageText(
        `⚡ *Energia*: ${player.energy}/${player.maxEnergy}\n` +
        `[${bar}] ${Math.floor((player.energy/player.maxEnergy)*100)}%\n\n` +
        `Regeneração: ${player.vip ? '1 a cada 3 min' : '1 a cada 6 min'}\n` +
        `Compre poções de energia na loja.`,
        { parse_mode: 'Markdown', ...mainMenu() }
    );
});

// Comando para equipar (exemplo)
bot.command('equip', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) return ctx.reply('Use: /equip <id_do_item>');
    // implementar...
});

bot.launch();
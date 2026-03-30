const { getPlayer, savePlayer } = require('../core/player/playerService');
const { villageItems, castleItems, arenaItems } = require('../data/shop');
const { shopTabsMenu, renderShop } = require('../menus/shopMenu');

function ensurePlayerEconomyFields(player) {
    if (!player.consumables) {
        player.consumables = {};
    }

    if (typeof player.keys !== 'number') {
        player.keys = 0;
    }

    if (typeof player.maxInventory !== 'number') {
        player.maxInventory = 20;
    }

    if (typeof player.vip !== 'boolean') {
        player.vip = false;
    }

    if (!player.vipExpires) {
        player.vipExpires = null;
    }

    if (typeof player.energy !== 'number') {
        player.energy = 20;
    }

    if (typeof player.maxEnergy !== 'number') {
        player.maxEnergy = 20;
    }

    return player;
}

async function safeEdit(ctx, text, options = {}) {
    try {
        await ctx.editMessageText(text, options);
    } catch (error) {
        await ctx.reply(text, options);
    }
}

async function handleShop(ctx) {
    await safeEdit(
        ctx,
        '🛒 *Bem-vindo à Loja!*\n\nEscolha uma categoria:',
        {
            parse_mode: 'Markdown',
            ...shopTabsMenu()
        }
    );
}

async function handleShopVillage(ctx) {
    const player = ensurePlayerEconomyFields(
        getPlayer(ctx.from.id)
    );

    const { text, keyboard } = renderShop(
        '🏠 Vila (Ouro)',
        villageItems,
        player
    );

    await safeEdit(ctx, text, {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

async function handleShopCastle(ctx) {
    const player = ensurePlayerEconomyFields(
        getPlayer(ctx.from.id)
    );

    const { text, keyboard } = renderShop(
        '🏰 Castelo (Nox)',
        castleItems,
        player
    );

    await safeEdit(ctx, text, {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

async function handleShopArena(ctx) {
    const player = ensurePlayerEconomyFields(
        getPlayer(ctx.from.id)
    );

    const { text, keyboard } = renderShop(
        '⚔️ Arena (Glórias)',
        arenaItems,
        player
    );

    await safeEdit(ctx, text, {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

function findItemById(itemId) {
    const pools = [villageItems, castleItems, arenaItems];

    for (const pool of pools) {
        const item = pool.find(i => i.id === itemId);
        if (item) {
            return item;
        }
    }

    return null;
}

function getCurrencyLabel(currency) {
    const map = {
        gold: 'ouro',
        nox: 'Nox',
        glory: 'glórias',
        glories: 'glórias'
    };

    return map[currency] || currency || 'moeda';
}

function getItemCost(item) {
    return Number(item.price || 0);
}

function getPlayerCurrency(player, currency) {
    if (!currency) return 0;

    return Number(player[currency] || 0);
}

function spendCurrency(player, currency, amount) {
    if (!currency) return false;

    const current = getPlayerCurrency(player, currency);

    if (current < amount) {
        return false;
    }

    player[currency] = current - amount;
    return true;
}

function addConsumable(player, effect, qty) {
    const amount = Number(qty || 1);

    if (effect === 'hp') {
        player.consumables.potionHp = (player.consumables.potionHp || 0) + amount;
        return;
    }

    if (effect === 'energy') {
        player.consumables.potionEnergy = (player.consumables.potionEnergy || 0) + amount;
        return;
    }

    if (effect === 'buff_atk') {
        player.consumables.tonicStrength = (player.consumables.tonicStrength || 0) + amount;
        return;
    }

    if (effect === 'buff_def') {
        player.consumables.tonicDefense = (player.consumables.tonicDefense || 0) + amount;
        return;
    }

    if (effect === 'buff_crit') {
        player.consumables.tonicPrecision = (player.consumables.tonicPrecision || 0) + amount;
    }
}

async function handleBuy(ctx) {
    try {
        const itemId = ctx.match?.[1];

        if (!itemId) {
            return ctx.answerCbQuery('Item inválido.', true);
        }

        const item = findItemById(itemId);

        if (!item) {
            return ctx.answerCbQuery('Item não encontrado.', true);
        }

        const player = ensurePlayerEconomyFields(
            getPlayer(ctx.from.id)
        );

        const cost = getItemCost(item);
        const currency = item.currency || 'nox';

        if (!spendCurrency(player, currency, cost)) {
            return ctx.answerCbQuery(
                `❌ Você não tem ${getCurrencyLabel(currency)} suficiente!`,
                true
            );
        }

        if (item.type === 'consumable') {
            addConsumable(player, item.effect, item.quantity || 1);
        } else if (item.type === 'key') {
            player.keys += Number(item.value || 1);
        } else if (item.type === 'vip') {
            const now = new Date();
            const days = Number(item.days || 0);
            const expire = new Date(
                now.getTime() + days * 24 * 60 * 60 * 1000
            );

            player.vip = true;
            player.vipExpires = expire.toISOString();
            player.maxEnergy = 40;
            player.energy = Math.min(player.energy, 40);
            player.maxInventory = (player.maxInventory || 20) + 10;
        }

        savePlayer(ctx.from.id, player);

        await ctx.answerCbQuery(`✅ Comprou: ${item.name}!`);

        if (item.currency === 'gold') {
            return handleShopVillage(ctx);
        }

        if (item.currency === 'nox') {
            return handleShopCastle(ctx);
        }

        if (item.currency === 'glory' || item.currency === 'glories') {
            return handleShopArena(ctx);
        }

        return handleShop(ctx);
    } catch (error) {
        console.error('Erro ao comprar item:', error);
        await ctx.answerCbQuery('Erro ao processar compra.', true);
    }
}

module.exports = {
    handleShop,
    handleShopVillage,
    handleShopCastle,
    handleShopArena,
    handleBuy
};
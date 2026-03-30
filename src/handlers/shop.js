const { getPlayer, savePlayer } = require('../core/player/playerService');
const { processPurchase } = require('../core/economy/shopLogic');

const {
    villageItems,
    castleItems,
    arenaItems
} = require('../data/shop');

const {
    shopTabsMenu,
    renderShop
} = require('../menus/shopMenu');

async function safeEdit(ctx, text, options = {}) {
    try {
        await ctx.editMessageText(text, options);
    } catch (error) {
        await ctx.reply(text, options);
    }
}

function findItem(itemId) {
    return (
        villageItems.find(i => i.id === itemId) ||
        castleItems.find(i => i.id === itemId) ||
        arenaItems.find(i => i.id === itemId)
    );
}

function getCategoryByCurrency(currency) {
    if (currency === 'gold') return 'village';
    if (currency === 'nox') return 'castle';
    if (
        currency === 'glory' ||
        currency === 'glories'
    ) {
        return 'arena';
    }

    return 'main';
}

async function renderShopByCategory(ctx, category) {
    const player = getPlayer(ctx.from.id);

    if (category === 'village') {
        const { text, keyboard } = renderShop(
            '🏠 Vila (Ouro)',
            villageItems,
            player
        );

        return safeEdit(ctx, text, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    }

    if (category === 'castle') {
        const { text, keyboard } = renderShop(
            '🏰 Castelo (Nox)',
            castleItems,
            player
        );

        return safeEdit(ctx, text, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    }

    if (category === 'arena') {
        const { text, keyboard } = renderShop(
            '⚔️ Arena (Glórias)',
            arenaItems,
            player
        );

        return safeEdit(ctx, text, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    }

    return handleShop(ctx);
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
    return renderShopByCategory(ctx, 'village');
}

async function handleShopCastle(ctx) {
    return renderShopByCategory(ctx, 'castle');
}

async function handleShopArena(ctx) {
    return renderShopByCategory(ctx, 'arena');
}

async function handleBuy(ctx) {
    try {
        const itemId = ctx.match?.[1];

        if (!itemId) {
            return ctx.answerCbQuery(
                '❌ Item inválido.',
                true
            );
        }

        const item = findItem(itemId);

        if (!item) {
            return ctx.answerCbQuery(
                '❌ Item não encontrado.',
                true
            );
        }

        const player = getPlayer(ctx.from.id);

        const result = processPurchase(
            player,
            item
        );

        if (!result.success) {
            return ctx.answerCbQuery(
                result.message,
                true
            );
        }

        savePlayer(ctx.from.id, player);

        await ctx.answerCbQuery(
            result.message
        );

        const category = getCategoryByCurrency(
            item.currency
        );

        return renderShopByCategory(
            ctx,
            category
        );

    } catch (error) {
        console.error(
            'Erro ao comprar item:',
            error
        );

        await ctx.answerCbQuery(
            '❌ Erro ao processar compra.',
            true
        );
    }
}

module.exports = {
    handleShop,
    handleShopVillage,
    handleShopCastle,
    handleShopArena,
    handleBuy
};
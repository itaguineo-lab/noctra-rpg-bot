const { getPlayer, savePlayer } = require('../data/players');
const { maps, getMapByName } = require('../data/maps');
const { Markup } = require('telegraf');
const { mainMenu } = require('../menus/mainMenu');

async function handleTravel(ctx) {
    try {
        const player = getPlayer(ctx.from.id);
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
}

async function handleTravelTo(ctx) {
    try {
        const mapName = ctx.match[1];
        const player = getPlayer(ctx.from.id);
        const map = getMapByName(mapName);

        if (!map) return ctx.answerCbQuery('Mapa inválido!');
        if (player.level < map.level) {
            return ctx.answerCbQuery(`Você precisa ser nível ${map.level} para ir para ${mapName}.`, true);
        }

        player.currentMap = mapName;
        savePlayer(ctx.from.id, player);

        await ctx.editMessageText(`🗺️ Você viajou para *${mapName}*.`, { parse_mode: 'Markdown', ...mainMenu() });
    } catch (err) {
        console.error('Erro ao viajar:', err);
        await ctx.answerCbQuery('Erro ao viajar.');
    }
}

async function handleTravelLocked(ctx) {
    await ctx.answerCbQuery('Este mapa ainda está bloqueado! Suba de nível para desbloquear.', true);
}

module.exports = { handleTravel, handleTravelTo, handleTravelLocked };

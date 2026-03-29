const { activeFights } = require('./combat');

async function handleOnline(ctx) {
    const onlineCount = Object.keys(activeFights).length + Math.floor(Math.random() * 50);
    const playersOnline = Math.max(1, onlineCount);
    await ctx.answerCbQuery(`👥 ${playersOnline} jogadores online!`, true);
}

module.exports = { handleOnline };
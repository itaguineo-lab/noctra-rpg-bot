const { getPlayer, savePlayer, recalculateStats } = require('../../data/players');

async function handleEquip(ctx) {
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
}

async function handleEquipSoul(ctx) {
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
}

module.exports = { handleEquip, handleEquipSoul };
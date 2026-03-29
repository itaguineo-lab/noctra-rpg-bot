const { getPlayer, savePlayer, recalculateStats } = require('../../data/players');

async function handleEquip(ctx) {
    try {
        // Captura o ID do item do comando (ex: /equip_12345)
        const itemId = ctx.match ? ctx.match[1] : ctx.message.text.split('_')[1];
        const player = getPlayer(ctx.from.id);
        
        const itemIndex = player.inventory.findIndex(i => i && i.id == itemId);
        if (itemIndex === -1) return ctx.reply('❌ Item não encontrado no seu inventário.');

        const item = player.inventory[itemIndex];
        const currentEquip = player.equipment[item.slot];

        // Se já tiver algo equipado, volta para o inventário
        if (currentEquip) {
            player.inventory.push(currentEquip);
        }

        // Equipa o novo item e remove do inventário
        player.equipment[item.slot] = item;
        player.inventory.splice(itemIndex, 1);

        recalculateStats(player);
        savePlayer(ctx.from.id, player);

        await ctx.reply(`⚔️ *Equipado:* ${item.name}`, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error('Erro ao equipar:', err);
        await ctx.reply('Houve um erro ao tentar equipar este item.');
    }
}

async function handleEquipSoul(ctx) {
    try {
        const soulId = ctx.match ? ctx.match[1] : ctx.message.text.split('_')[1];
        const player = getPlayer(ctx.from.id);
        
        const soulIndex = player.inventory.findIndex(i => i && i.id == soulId && i.type === 'soul');
        if (soulIndex === -1) return ctx.reply('❌ Alma não encontrada no seu inventário.');
        
        const soul = player.inventory[soulIndex];
        const emptySlot = player.souls.findIndex(s => s === null);

        if (emptySlot === -1) {
            return ctx.reply('❌ Seus slots de almas estão cheios! Desequipe uma primeiro.');
        }
        
        player.souls[emptySlot] = soul;
        player.inventory.splice(soulIndex, 1);
        
        savePlayer(ctx.from.id, player);
        await ctx.reply(`💀 *Alma equipada:* ${soul.name}`, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error('Erro ao equipar alma:', err);
        await ctx.reply('Houve um erro ao tentar equipar esta alma.');
    }
}

module.exports = { handleEquip, handleEquipSoul };

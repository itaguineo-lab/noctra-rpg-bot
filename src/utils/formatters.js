const { getRarityEmoji } = require('../../data/souls');

function formatSoulDisplay(soul) {
    if (!soul) return null;
    return `${getRarityEmoji(soul.rarity)} *${soul.name}* (${soul.rarity})`;
}

function formatEquipmentDisplay(item, slotEmoji) {
    if (!item) return `${slotEmoji} Vazio`;
    return `${slotEmoji} ${item.name} (${item.rarity})\n   ⚔️ +${item.atk} | 🛡️ +${item.def} | ✨ +${item.crit} | ❤️ +${item.hp}`;
}

module.exports = { formatSoulDisplay, formatEquipmentDisplay };
const RARITY_COLORS = { Comum: '⚪', Incomum: '🟢', Raro: '🔵', Épico: '🟣', Lendário: '🟡', Mítico: '🔴' };
const RARITY_EMOJIS = RARITY_COLORS;
const SLOT_EMOJIS = { weapon: '⚔️', armor: '🛡️', helmet: '⛑️', boots: '👢', ring: '💍', necklace: '📿', bag: '🎒' };
const CLASSES = ['guerreiro', 'arqueiro', 'mago'];
function getRarityColor(r) { return RARITY_COLORS[r] || '⚪'; }
function getRarityEmoji(r) { return RARITY_EMOJIS[r] || '⚪'; }
module.exports = { RARITY_COLORS, RARITY_EMOJIS, SLOT_EMOJIS, CLASSES, getRarityColor, getRarityEmoji };
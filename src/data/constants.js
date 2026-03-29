const RARITY_COLORS = {
    'Comum': '⚪',
    'Incomum': '🟢',
    'Raro': '🔵',
    'Épico': '🟣',
    'Lendário': '🟡',
    'Mítico': '🔴'
};

const RARITY_EMOJIS = RARITY_COLORS;

const SLOT_EMOJIS = {
    weapon: '⚔️',
    armor: '🛡️',
    helmet: '⛑️',
    boots: '👢',
    ring: '💍',
    necklace: '📿',
    bag: '🎒'
};

const CLASSES = ['guerreiro', 'arqueiro', 'mago'];

// Multiplicadores de status por raridade (útil para o core/combat)
const RARITY_MULT = {
    'Comum': 1.0,
    'Incomum': 1.2,
    'Raro': 1.5,
    'Épico': 2.0,
    'Lendário': 2.5,
    'Mítico': 3.5
};

function getRarityColor(r) { return RARITY_COLORS[r] || '⚪'; }
function getRarityEmoji(r) { return RARITY_EMOJIS[r] || '⚪'; }

module.exports = { 
    RARITY_COLORS, 
    RARITY_EMOJIS, 
    SLOT_EMOJIS, 
    CLASSES, 
    RARITY_MULT,
    getRarityColor, 
    getRarityEmoji 
};

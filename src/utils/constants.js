// Cores por raridade
const RARITY_COLORS = {
    'Comum': '⚪',
    'Incomum': '🟢',
    'Raro': '🔵',
    'Épico': '🟣',
    'Lendário': '🟡',
    'Mítico': '🔴'
};

// Emojis por raridade (para almas)
const RARITY_EMOJIS = {
    'Comum': '⚪',
    'Incomum': '🟢',
    'Raro': '🔵',
    'Épico': '🟣',
    'Lendário': '🟡',
    'Mítico': '🔴'
};

// Emojis por slot de equipamento
const SLOT_EMOJIS = {
    weapon: '⚔️', 
    armor: '🛡️', 
    helmet: '⛑️', 
    boots: '👢',
    ring: '💍', 
    necklace: '📿', 
    bag: '🎒'
};

// Classes disponíveis
const CLASSES = ['guerreiro', 'arqueiro', 'mago'];

// Funções para acessar
function getRarityColor(rarity) {
    return RARITY_COLORS[rarity] || '⚪';
}

function getRarityEmoji(rarity) {
    return RARITY_EMOJIS[rarity] || '⚪';
}

module.exports = { 
    RARITY_COLORS, 
    RARITY_EMOJIS, 
    SLOT_EMOJIS, 
    CLASSES,
    getRarityColor,
    getRarityEmoji
};

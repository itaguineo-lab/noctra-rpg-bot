const { getRarityColor } = require('./constants');

function progressBar(current, max, size = 10) {
    const percent = current / max;
    const filled = Math.round(size * percent);
    const empty = size - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatItemName(item) {
    if (!item) return '❓ Item inválido';
    const colorEmoji = getRarityColor(item.rarity);
    return `${colorEmoji} *${item.name}*`;
}

function formatSoulName(soul) {
    if (!soul) return '❓ Alma inválida';
    const emoji = getRarityColor(soul.rarity);
    return `${emoji} *${soul.name}*`;
}

module.exports = { 
    progressBar, 
    formatNumber, 
    formatItemName, 
    formatSoulName 
};
const { getRarityColor } = require('./constants');
function progressBar(cur, max, size = 10) { const p = cur / max; const f = Math.round(size * p); return '█'.repeat(f) + '░'.repeat(size - f); }
function formatNumber(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function formatItemName(item) { if (!item) return '❓'; return `${getRarityColor(item.rarity)} *${item.name}*`; }
function formatSoulName(soul) { if (!soul) return '❓'; return `${getRarityColor(soul.rarity)} *${soul.name}*`; }
module.exports = { progressBar, formatNumber, formatItemName, formatSoulName };
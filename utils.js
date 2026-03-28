function progressBar(current, max, size = 10) {
    const percent = current / max;
    const filled = Math.round(size * percent);
    const empty = size - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports = { progressBar, formatNumber };

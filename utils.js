function progressBar(current, max, size = 10) {
    const percent = current / max;
    const filled = Math.round(size * percent);
    const empty = size - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

module.exports = { progressBar };
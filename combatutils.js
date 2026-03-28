function calculateDamage(atk, def) {
    const damage = Math.max(1, Math.floor(atk * (1 - def / (def + 100))));
    return damage;
}

module.exports = { calculateDamage };
/**
 * Calcula o dano final de um ataque.
 * @param {number} atk - Ataque do atacante
 * @param {number} def - Defesa do defensor
 * @param {number} critChance - Chance de crítico (0-100)
 */
function calculateDamage(atk, def, critChance = 5) {
    // Variação de dano entre 90% e 110%
    const variance = 0.9 + Math.random() * 0.2;
    let finalDmg = atk * variance;

    // Sistema de Crítico (Dano x1.5)
    const isCrit = (Math.random() * 100) <= critChance;
    if (isCrit) {
        finalDmg *= 1.5;
    }

    // Redução por Defesa (A defesa bloqueia até 50% do valor de def do dano base)
    // O dano mínimo é sempre 1.
    const dmgAfterDef = Math.max(1, Math.floor(finalDmg - (def * 0.5)));

    return {
        damage: dmgAfterDef,
        isCrit: isCrit
    };
}

module.exports = { calculateDamage };

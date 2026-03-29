const soulsList = [
    { id: 'soul_wolf', name: 'Alma do Lobo Sombrio', rarity: 'Comum', emoji: '🐺', description: 'Ataque feroz.', effect: { type: 'damage', multiplier: 1.3 }, dropChance: 0.15, minLevel: 1 },
    { id: 'soul_rat', name: 'Alma do Rato', rarity: 'Comum', emoji: '🐀', description: 'Mordida venenosa.', effect: { type: 'damage', multiplier: 1.2 }, dropChance: 0.15, minLevel: 1 },
    { id: 'soul_heal', name: 'Alma Curadora', rarity: 'Comum', emoji: '💚', description: 'Cura 30% HP.', effect: { type: 'heal', multiplier: 0.3 }, dropChance: 0.12, minLevel: 3 },
    { id: 'soul_guardian', name: 'Alma do Guardião', rarity: 'Incomum', emoji: '🛡️', description: 'Reduz 30% dano por 2 turnos.', effect: { type: 'shield', multiplier: 0.3, duration: 2 }, dropChance: 0.08, minLevel: 8 },
    { id: 'soul_solar', name: 'Alma Solar', rarity: 'Incomum', emoji: '☀️', description: '1.7× dano.', effect: { type: 'damage', multiplier: 1.7 }, dropChance: 0.08, minLevel: 8 },
    { id: 'soul_frost', name: 'Alma do Gelo', rarity: 'Incomum', emoji: '❄️', description: '60% congelar.', effect: { type: 'freeze', chance: 0.6 }, dropChance: 0.08, minLevel: 10 },
    { id: 'soul_vampire', name: 'Alma Vampírica', rarity: 'Raro', emoji: '🦇', description: 'Rouba 50% vida.', effect: { type: 'lifesteal', multiplier: 0.5 }, dropChance: 0.05, minLevel: 15 },
    { id: 'soul_thunder', name: 'Alma do Trovão', rarity: 'Raro', emoji: '⚡', description: '2.0× dano.', effect: { type: 'damage', multiplier: 2.0 }, dropChance: 0.05, minLevel: 20 },
    { id: 'soul_phoenix', name: 'Alma da Fênix', rarity: 'Épico', emoji: '🐦‍🔥', description: 'Revive uma vez.', effect: { type: 'revive' }, dropChance: 0.02, minLevel: 30 },
    { id: 'soul_dragon', name: 'Alma do Dragão', rarity: 'Épico', emoji: '🐉', description: '2.5× dano.', effect: { type: 'damage', multiplier: 2.5 }, dropChance: 0.02, minLevel: 35 },
    { id: 'soul_eternal', name: 'Alma Eterna', rarity: 'Lendário', emoji: '🌟', description: 'Modo Deus.', effect: { type: 'god_mode', duration: 3 }, dropChance: 0.005, minLevel: 50 },
    { id: 'soul_void', name: 'Alma do Vácuo', rarity: 'Lendário', emoji: '🌌', description: 'Executa.', effect: { type: 'execute', multiplier: 3.0 }, dropChance: 0.005, minLevel: 55 },
    { id: 'soul_creator', name: 'Alma do Criador', rarity: 'Mítico', emoji: '👑', description: 'Apocalipse.', effect: { type: 'apocalypse' }, dropChance: 0.001, minLevel: 70 }
];

function dropSoul(playerLevel) {
    if (Math.random() > 0.05) return null;
    const available = soulsList.filter(s => s.minLevel <= playerLevel);
    if (!available.length) return null;
    let total = 0;
    const weighted = available.map(s => {
        let mult = { Comum: 50, Incomum: 25, Raro: 12, Épico: 6, Lendário: 2, Mítico: 0.5 }[s.rarity] || 1;
        const w = mult * (s.dropChance * 100);
        total += w;
        return { soul: s, weight: w };
    });
    let roll = Math.random() * total;
    for (const w of weighted) {
        roll -= w.weight;
        if (roll <= 0) return { ...w.soul, id: `${w.soul.id}_${Date.now()}_${Math.random()}`, type: 'soul' };
    }
    return null;
}

function activateSoul(soul, state) {
    const e = soul.effect;
    switch (e.type) {
        case 'damage':
            const dmg = Math.floor(state.player.atk * e.multiplier);
            state.enemy.hp -= dmg;
            return { message: `✨ ${soul.name} causou *${dmg}* dano!` };
        case 'heal':
            const heal = Math.floor(state.player.maxHp * e.multiplier);
            state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
            return { message: `💚 ${soul.name} curou *${heal}* HP!` };
        case 'shield':
            state.player.shield = e.multiplier;
            state.player.shieldDuration = e.duration;
            return { message: `🛡️ ${soul.name} reduz dano por ${e.duration} turnos!` };
        case 'lifesteal':
            const d = Math.floor(state.player.atk * e.multiplier);
            const h = Math.floor(d * 0.5);
            state.enemy.hp -= d;
            state.player.hp = Math.min(state.player.maxHp, state.player.hp + h);
            return { message: `🦇 ${soul.name} causou *${d}* dano e curou *${h}* HP!` };
        case 'freeze':
            if (Math.random() <= e.chance) {
                state.enemy.frozen = true;
                return { message: `❄️ ${soul.name} congelou o inimigo!` };
            }
            return { message: `❄️ ${soul.name} falhou!` };
        default: return { message: `✨ ${soul.name} ativado!` };
    }
}

function getRarityEmoji(rarity) {
    return { Comum: '⚪', Incomum: '🟢', Raro: '🔵', Épico: '🟣', Lendário: '🟡', Mítico: '🔴' }[rarity] || '⚪';
}

function formatSoulName(soul) {
    return `${getRarityEmoji(soul.rarity)} *${soul.name}*`;
}

module.exports = { soulsList, dropSoul, activateSoul, formatSoulName, getRarityEmoji };
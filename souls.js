const soulTypes = {
    FOGO: { name: '🔥 Fogo', color: '🔴', bonus: 'chance de queimar inimigo' },
    GELO: { name: '❄️ Gelo', color: '🔵', bonus: 'congela inimigo (perde turno)' },
    TREVAS: { name: '🌑 Trevas', color: '⚫', bonus: 'rouba vida' },
    LUZ: { name: '✨ Luz', color: '🟡', bonus: 'cura ao atacar' },
    TERRA: { name: '🌍 Terra', color: '🟤', bonus: 'aumenta defesa' }
};

const soulsList = [
    // ALMAS COMUNS
    {
        id: 'soul_wolf',
        name: 'Alma do Lobo Sombrio',
        rarity: 'Comum',
        emoji: '🐺',
        type: 'FOGO',
        description: 'Invoca o espírito do lobo para um ataque feroz.',
        effect: { type: 'damage', multiplier: 1.3, description: 'Causa 1.3× de dano' },
        cooldown: 3,
        dropChance: 0.15,
        minLevel: 1
    },
    {
        id: 'soul_rat',
        name: 'Alma do Rato Gigante',
        rarity: 'Comum',
        emoji: '🐀',
        type: 'TERRA',
        description: 'Mordida rápida e venenosa.',
        effect: { type: 'damage', multiplier: 1.2, description: 'Causa 1.2× de dano' },
        cooldown: 2,
        dropChance: 0.15,
        minLevel: 1
    },
    {
        id: 'soul_heal',
        name: 'Alma Curadora',
        rarity: 'Comum',
        emoji: '💚',
        type: 'LUZ',
        description: 'Luz suave que restaura suas feridas.',
        effect: { type: 'heal', multiplier: 0.3, description: 'Cura 30% do HP máximo' },
        cooldown: 4,
        dropChance: 0.12,
        minLevel: 3
    },
    
    // ALMAS INCOMUNS
    {
        id: 'soul_guardian',
        name: 'Alma do Guardião',
        rarity: 'Incomum',
        emoji: '🛡️',
        type: 'TERRA',
        description: 'Força do Guardião da Floresta. Protege contra dano.',
        effect: { type: 'shield', multiplier: 0.3, duration: 2, description: 'Reduz 30% do dano por 2 turnos' },
        cooldown: 5,
        dropChance: 0.08,
        minLevel: 8
    },
    {
        id: 'soul_solar',
        name: 'Alma Solar',
        rarity: 'Incomum',
        emoji: '☀️',
        type: 'FOGO',
        description: 'Lança banhada na luz do deserto.',
        effect: { type: 'damage', multiplier: 1.7, description: 'Causa 1.7× de dano' },
        cooldown: 4,
        dropChance: 0.08,
        minLevel: 8
    },
    {
        id: 'soul_frost',
        name: 'Alma do Gelo',
        rarity: 'Incomum',
        emoji: '❄️',
        type: 'GELO',
        description: 'Gelo eterno que congela os inimigos.',
        effect: { type: 'freeze', chance: 0.6, description: '60% de chance de congelar o inimigo' },
        cooldown: 4,
        dropChance: 0.08,
        minLevel: 10
    },
    
    // ALMAS RARAS
    {
        id: 'soul_vampire',
        name: 'Alma Vampírica',
        rarity: 'Raro',
        emoji: '🦇',
        type: 'TREVAS',
        description: 'Suga a vida do inimigo para se curar.',
        effect: { type: 'lifesteal', multiplier: 0.5, description: 'Causa dano e cura 50% do dano causado' },
        cooldown: 5,
        dropChance: 0.05,
        minLevel: 15
    },
    {
        id: 'soul_thunder',
        name: 'Alma do Trovão',
        rarity: 'Raro',
        emoji: '⚡',
        type: 'FOGO',
        description: 'Raio celestial que atinge em área.',
        effect: { type: 'damage', multiplier: 2.0, description: 'Causa 2.0× de dano (ignora 30% da defesa)' },
        cooldown: 6,
        dropChance: 0.05,
        minLevel: 20
    },
    
    // ALMAS ÉPICAS
    {
        id: 'soul_phoenix',
        name: 'Alma da Fênix',
        rarity: 'Épico',
        emoji: '🐦‍🔥',
        type: 'FOGO',
        description: 'Renasce das cinzas com poder renovado.',
        effect: { type: 'revive', description: 'Revive com 30% HP se morrer (uma vez por combate)' },
        cooldown: 8,
        dropChance: 0.02,
        minLevel: 30
    },
    {
        id: 'soul_dragon',
        name: 'Alma do Dragão',
        rarity: 'Épico',
        emoji: '🐉',
        type: 'FOGO',
        description: 'Fúria dracônica que devasta tudo.',
        effect: { type: 'damage', multiplier: 2.5, description: 'Causa 2.5× de dano' },
        cooldown: 7,
        dropChance: 0.02,
        minLevel: 35
    },
    
    // ALMAS LENDÁRIAS
    {
        id: 'soul_eternal',
        name: 'Alma Eterna',
        rarity: 'Lendário',
        emoji: '🌟',
        type: 'LUZ',
        description: 'Poder ancestral que transcende o tempo.',
        effect: { type: 'god_mode', duration: 3, description: 'Aumenta ATK em 50% e reduz dano em 50% por 3 turnos' },
        cooldown: 10,
        dropChance: 0.005,
        minLevel: 50
    },
    {
        id: 'soul_void',
        name: 'Alma do Vácuo',
        rarity: 'Lendário',
        emoji: '🌌',
        type: 'TREVAS',
        description: 'Devora a realidade ao redor.',
        effect: { type: 'execute', multiplier: 3.0, description: 'Causa 3.0× de dano, dobra se inimigo tiver menos de 30% HP' },
        cooldown: 8,
        dropChance: 0.005,
        minLevel: 55
    },
    
    // ALMAS MÍTICAS
    {
        id: 'soul_creator',
        name: 'Alma do Criador',
        rarity: 'Mítico',
        emoji: '👑',
        type: 'LUZ',
        description: 'O poder que deu origem a todas as coisas.',
        effect: { type: 'apocalypse', description: 'Causa dano massivo e cura todo o time' },
        cooldown: 12,
        dropChance: 0.001,
        minLevel: 70
    }
];

function dropSoul(playerLevel, mapLevel) {
    const baseChance = 0.05;
    if (Math.random() > baseChance) return null;
    
    const availableSouls = soulsList.filter(s => s.minLevel <= playerLevel);
    if (availableSouls.length === 0) return null;
    
    let totalChance = 0;
    const weightedSouls = availableSouls.map(soul => {
        let multiplier = 1;
        switch (soul.rarity) {
            case 'Comum': multiplier = 50; break;
            case 'Incomum': multiplier = 25; break;
            case 'Raro': multiplier = 12; break;
            case 'Épico': multiplier = 6; break;
            case 'Lendário': multiplier = 2; break;
            case 'Mítico': multiplier = 0.5; break;
        }
        const weight = multiplier * (soul.dropChance * 100);
        totalChance += weight;
        return { soul, weight };
    });
    
    const roll = Math.random() * totalChance;
    let accumulated = 0;
    for (const item of weightedSouls) {
        accumulated += item.weight;
        if (roll <= accumulated) {
            return { 
                ...item.soul, 
                id: `${item.soul.id}_${Date.now()}_${Math.random()}`,
                type: 'soul'
            };
        }
    }
    return null;
}

function activateSoul(soul, state) {
    const effect = soul.effect;
    const result = { success: true, message: '', effectApplied: false };
    
    switch (effect.type) {
        case 'damage':
            const damage = Math.floor(state.player.atk * effect.multiplier);
            state.enemy.hp -= damage;
            result.message = `✨ *${soul.name}* causou *${damage}* de dano!`;
            result.effectApplied = true;
            break;
            
        case 'heal':
            const heal = Math.floor(state.player.maxHp * effect.multiplier);
            state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
            result.message = `💚 *${soul.name}* curou *${heal}* HP!`;
            result.effectApplied = true;
            break;
            
        case 'shield':
            state.player.shield = effect.multiplier;
            state.player.shieldDuration = effect.duration;
            result.message = `🛡️ *${soul.name}* redução de dano ativada por ${effect.duration} turnos!`;
            result.effectApplied = true;
            break;
            
        case 'lifesteal':
            const lifeDamage = Math.floor(state.player.atk * effect.multiplier);
            const healAmount = Math.floor(lifeDamage * 0.5);
            state.enemy.hp -= lifeDamage;
            state.player.hp = Math.min(state.player.maxHp, state.player.hp + healAmount);
            result.message = `🦇 *${soul.name}* causou *${lifeDamage}* de dano e curou *${healAmount}* HP!`;
            result.effectApplied = true;
            break;
            
        case 'freeze':
            const froze = Math.random() <= effect.chance;
            if (froze) {
                state.enemy.frozen = true;
                result.message = `❄️ *${soul.name}* congelou o inimigo! Ele perderá o próximo turno.`;
            } else {
                result.message = `❄️ *${soul.name}* falhou em congelar o inimigo.`;
            }
            result.effectApplied = froze;
            break;
            
        case 'revive':
            result.message = `🐦‍🔥 *${soul.name}* está pronta para reviver você!`;
            result.effectApplied = true;
            break;
            
        default:
            result.message = `✨ *${soul.name}* ativado!`;
            result.effectApplied = true;
    }
    
    return result;
}

function getRarityEmoji(rarity) {
    const emojis = {
        'Comum': '⚪',
        'Incomum': '🟢',
        'Raro': '🔵',
        'Épico': '🟣',
        'Lendário': '🟡',
        'Mítico': '🔴'
    };
    return emojis[rarity] || '⚪';
}

function formatSoulName(soul) {
    const emoji = getRarityEmoji(soul.rarity);
    return `${emoji} *${soul.name}*`;
}

module.exports = { soulsList, dropSoul, activateSoul, formatSoulName, soulTypes, getRarityEmoji };
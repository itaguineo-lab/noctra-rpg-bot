
/**
 * Definição de inimigos e Bosses.
 * Bosses possuem 'isBoss: true' e a lista de 'possibleSouls' que podem dropar.
 */
const enemies = {
    "Clareira Sombria": {
        common: [
            { name: "Lobo Sombrio", hp: 80, atk: 12, def: 5, exp: 20, gold: 15 },
            { name: "Rato Gigante", hp: 60, atk: 10, def: 3, exp: 15, gold: 10 }
        ],
        bosses: [
            { 
                name: "👑 Alfa da Matilha", 
                hp: 350, atk: 35, def: 15, exp: 150, gold: 100, 
                isBoss: true, 
                possibleSouls: ['soul_wolf'] 
            }
        ]
    },
    "Cripta em Ruínas": {
        common: [
            { name: "Esqueleto Guerreiro", hp: 150, atk: 18, def: 10, exp: 40, gold: 25 },
            { name: "Mago Esqueleto", hp: 120, atk: 22, def: 8, exp: 45, gold: 30 }
        ],
        bosses: [
            { 
                name: "👑 Necromante Ancestral", 
                hp: 800, atk: 70, def: 40, exp: 500, gold: 350, 
                isBoss: true, 
                possibleSouls: ['soul_heal', 'soul_frost'] 
            }
        ]
    }
};

/**
 * Retorna um inimigo aleatório baseado no mapa.
 * Bosses têm 10% de chance de aparecer (ou conforme sua regra).
 */
function getRandomEnemy(mapName) {
    const mapData = enemies[mapName] || enemies["Clareira Sombria"];
    const isBossRoll = Math.random() < 0.10; // 10% de chance de ser Boss

    if (isBossRoll && mapData.bosses.length > 0) {
        return { ...mapData.bosses[Math.floor(Math.random() * mapData.bosses.length)] };
    }

    const common = mapData.common[Math.floor(Math.random() * mapData.common.length)];
    return { ...common, isBoss: false };
}

module.exports = { getRandomEnemy };

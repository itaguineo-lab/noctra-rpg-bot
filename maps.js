const maps = [
    {
        name: "Clareira Sombria",
        level: 1,
        enemies: [
            { name: "Lobo Sombrio", hp: 80, atk: 12, def: 5, exp: 20, gold: 15, minLevel: 1 },
            { name: "Rato Gigante", hp: 60, atk: 10, def: 3, exp: 15, gold: 10, minLevel: 1 }
        ]
    },
    {
        name: "Cripta em Ruínas",
        level: 8,
        enemies: [
            { name: "Esqueleto Guerreiro", hp: 150, atk: 18, def: 10, exp: 40, gold: 25, minLevel: 8 },
            { name: "Mago Esqueleto", hp: 120, atk: 22, def: 8, exp: 45, gold: 30, minLevel: 8 }
        ]
    },
    {
        name: "Pântano Corrompido",
        level: 15,
        enemies: [
            { name: "Ghoul Pantanoso", hp: 230, atk: 25, def: 12, exp: 70, gold: 45, minLevel: 15 },
            { name: "Cobra Venenosa", hp: 180, atk: 28, def: 10, exp: 65, gold: 40, minLevel: 15 }
        ]
    }
];

function getMap(player) {
    return maps.find(m => player.level >= m.level) || maps[0];
}

function getRandomEnemy(player) {
    const map = getMap(player);
    const available = map.enemies.filter(e => player.level >= e.minLevel);
    if (available.length === 0) return map.enemies[0];
    return available[Math.floor(Math.random() * available.length)];
}

module.exports = { getMap, getRandomEnemy, maps };
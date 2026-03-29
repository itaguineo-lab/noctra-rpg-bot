/**
 * Configuração dos mapas do jogo.
 */
const maps = [
    { 
        name: "Clareira Sombria", 
        level: 1, 
        description: "Um local denso onde a luz raramente toca o chão.",
        emoji: "🌲"
    },
    { 
        name: "Cripta em Ruínas", 
        level: 8, 
        description: "Onde os mortos não descansam em paz.",
        emoji: "⚰️"
    },
    { 
        name: "Pântano Corrompido", 
        level: 15, 
        description: "Águas paradas que escondem criaturas venenosas.",
        emoji: "🍄"
    },
    { 
        name: "Deserto Incandescente", 
        level: 24, 
        description: "O calor é tão mortal quanto os escorpiões.",
        emoji: "🏜️"
    }
];

/**
 * Busca um mapa pelo nome.
 */
function getMapByName(name) {
    return maps.find(m => m.name === name);
}

/**
 * Valida se o jogador tem nível suficiente para entrar no mapa.
 */
function canPlayerEnter(player, mapName) {
    const map = getMapByName(mapName);
    if (!map) return false;
    return player.level >= map.level;
}

module.exports = { maps, getMapByName, canPlayerEnter };

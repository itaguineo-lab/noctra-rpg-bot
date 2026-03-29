
const fs = require('fs');
const path = require('path');

const playersFilePath = path.join(__dirname, '../data/players.json');

function loadPlayers() {
    try {
        if (!fs.existsSync(playersFilePath)) return {};
        const data = fs.readFileSync(playersFilePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Erro ao carregar jogadores:", err);
        return {};
    }
}

function savePlayer(id, player) {
    const players = loadPlayers();
    players[id] = player;
    fs.writeFileSync(playersFilePath, JSON.stringify(players, null, 2));
}

function recalculateStats(player) {
    // Atributos Base por Classe
    const baseStats = {
        guerreiro: { atk: 12, def: 10, hp: 120 },
        mago: { atk: 18, def: 4, hp: 80 },
        arqueiro: { atk: 15, def: 6, hp: 100 }
    };

    const stats = baseStats[player.class] || baseStats.guerreiro;
    
    // Escalonamento por Nível
    player.maxHp = stats.hp + (player.level * 20);
    player.atk = stats.atk + (player.level * 3);
    player.def = stats.def + (player.level * 2);

    // Adicionar Bónus de Equipamentos
    if (player.equipment) {
        Object.values(player.equipment).forEach(item => {
            if (item) {
                player.atk += item.atk || 0;
                player.def += item.def || 0;
                player.maxHp += item.hp || 0;
                player.crit = (player.crit || 5) + (item.crit || 0);
            }
        });
    }
}

module.exports = { loadPlayers, savePlayer, recalculateStats };

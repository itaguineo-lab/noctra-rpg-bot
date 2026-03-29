// Itens da loja da Vila (ouro)
const villageItems = [
    { id: 'potion_hp', name: '💚 Poção de Vida', price: 150, currency: 'gold', type: 'consumable', effect: 'hp', value: 50, description: 'Cura 50 HP' },
    { id: 'potion_energy', name: '🔋 Poção de Energia', price: 1500, currency: 'gold', type: 'consumable', effect: 'energy', value: 15, description: 'Restaura 15 energia' },
    { id: 'key', name: '🗝️ Chave de Masmorra', price: 300, currency: 'gold', type: 'key', value: 1, description: 'Acessa masmorras' },
    { id: 'tonic_strength', name: '💪 Tônico de Força', price: 200, currency: 'gold', type: 'consumable', effect: 'buff_atk', value: 20, description: '+20% ATK por 3 turnos' },
    { id: 'tonic_defense', name: '🛡️ Tônico de Defesa', price: 200, currency: 'gold', type: 'consumable', effect: 'buff_def', value: 20, description: '+20% DEF por 3 turnos' },
    { id: 'tonic_precision', name: '🎯 Tônico de Precisão', price: 200, currency: 'gold', type: 'consumable', effect: 'buff_crit', value: 15, description: '+15% CRIT por 3 turnos' }
];

// Itens da loja do Castelo (Nox)
const castleItems = [
    { id: 'vip_7d', name: '👑 VIP (7 dias)', price: 50, currency: 'nox', type: 'vip', days: 7, description: 'Energia max 40, +50% XP/gold, +10 inv, baú extra' },
    { id: 'vip_30d', name: '👑 VIP (30 dias)', price: 150, currency: 'nox', type: 'vip', days: 30, description: 'Energia max 40, +50% XP/gold, +10 inv, baú extra' },
    { id: 'skin_pack', name: '🎨 Pacote de Skins', price: 100, currency: 'nox', type: 'skin', description: '3 skins aleatórias' }
];

// Itens da loja dos Matadores (Glórias)
const arenaItems = [
    { id: 'glory_skin', name: '✨ Skin Gloriosa', price: 500, currency: 'glorias', type: 'skin', description: 'Skin exclusiva da arena' },
    { id: 'glory_potion', name: '💚 Poção de Vida (x5)', price: 100, currency: 'glorias', type: 'consumable', effect: 'hp', value: 50, quantity: 5, description: '5 poções de vida' }
];

module.exports = { villageItems, castleItems, arenaItems };
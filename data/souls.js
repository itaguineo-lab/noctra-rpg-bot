// souls.js

// Add your soul-related logic here

function createSoul(name, type) {
    return { name: name, type: type, createdAt: new Date() };
}

function retrieveSoul(soul) {
    return `${soul.name} is a ${soul.type} soul created at ${soul.createdAt}`;
}

// Example
const soul1 = createSoul('Soul of the Forgotten', 'Spirit');
console.log(retrieveSoul(soul1));
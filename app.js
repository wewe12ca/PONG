// Base de datos de objetos
const ITEMS = [
    { id: 0, name: "Blanco Estándar", color: "#ffffff", rarity: "Común" },
    { id: 1, name: "Cian Neón", color: "#00ffff", rarity: "Raro" },
    { id: 2, name: "Oro Maestro", color: "#ffd700", rarity: "Legendario" },
    { id: 3, name: "ESENCIA DIOS", color: "#ff00ff", rarity: "Dios" }
];

// Estado global del usuario
let user = {
    coins: 100,
    inventory: [0],
    equipped: 0,
    sessionCode: Math.random().toString(36).substring(2, 8).toUpperCase()
};

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'flex';
    if(id === 'menu-inventory') renderInventory();
}

function saveToLocal() {
    localStorage.setItem(user.sessionCode, JSON.stringify(user));
}

function loadSession() {
    const code = document.getElementById("session-input").value.toUpperCase();
    const data = localStorage.getItem(code);
    if(data) {
        user = JSON.parse(data);
        alert("Sesión cargada. Código: " + user.sessionCode);
        showScreen('menu-main');
    } else {
        alert("El código no existe.");
    }
}

function buyCrate(type) {
    let cost = (type === 'basic') ? 100 : 1000;
    if(user.coins < cost) return alert("Monedas insuficientes.");

    user.coins -= cost;
    let rand = Math.random() * 100;
    let reward;

    if(type === 'basic') {
        reward = rand > 20 ? ITEMS[0] : ITEMS[1]; // 80% Común, 20% Raro
    } else {
        reward = rand > 30 ? ITEMS[2] : ITEMS[3]; // 70% Legendario, 30% Dios
    }

    if(!user.inventory.includes(reward.id)) user.inventory.push(reward.id);
    alert(`¡HAS OBTENIDO: ${reward.name}!\nCódigo: ${user.sessionCode}`);
    saveToLocal();
}

function renderInventory() {
    const list = document.getElementById("inventory-list");
    list.innerHTML = "";
    user.inventory.forEach(id => {
        const item = ITEMS.find(i => i.id === id);
        const b = document.createElement("button");
        b.className = `rarity-${item.rarity}`;
        b.style.padding = "10px";
        b.innerHTML = `${item.name}<br>${item.rarity}`;
        b.onclick = () => { user.equipped = item.id; saveToLocal(); alert("Equipado"); };
        list.appendChild(b);
    });
}

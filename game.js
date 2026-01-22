const App = {
    user: {
        name: "", coins: 0, 
        unlocked: ["p_classic", "b_classic"],
        equipped: { paddle: "p_classic", ball: "b_classic" },
        usedCodes: [], hasAccount: false
    },
    // Añadidos precios base por rareza
    prices: { common: 50, epic: 200, legendary: 800, god: 2000 },
    items: {
        paddle: {
            p_classic:  { name: "Básica", color: "#ffffff", rarity: "common" },
            p_emerald:  { name: "Esmeralda", color: "#2ecc71", rarity: "common" },
            p_neon:     { name: "Cian Neón", color: "#00f2ff", rarity: "epic" },
            p_ruby:     { name: "Rubí", color: "#e74c3c", rarity: "epic" },
            p_lava:     { name: "Lava Ardiente", color: "#ff4400", rarity: "legendary" },
            p_gold:     { name: "Oro Rey", color: "#ffd700", rarity: "legendary" },
            p_god:      { name: "Zeus (GOD)", color: "linear-gradient(#fff, #ff0)", rarity: "god" }
        },
        ball: {
            b_classic:  { name: "Básica", color: "#ffffff", rarity: "common" },
            b_slime:    { name: "Slime", color: "#a2ff00", rarity: "common" },
            b_fire:     { name: "Fuego", color: "#ff4400", rarity: "epic" },
            b_ghost:    { name: "Espectro", color: "rgba(255,255,255,0.4)", rarity: "legendary" },
            b_sun:      { name: "SOL (GOD)", color: "#f1c40f", rarity: "god" }
        }
    },
    promoCodes: {
        "POBRE": 1, "PONG2026": 500, "BIENVENIDO": 200, "DIOS": 5000, "FREE": 100,
        "MODULAR": 300, "VERDE": 150, "ULTIMATE": 1000, "NUEVO": 250, "PC_GRATIS": 50,
        "RECOMPENSA": 400, "FERRAN": 1000, "YOUTUBE": 200, "TWITCH": 200, "SECRET": 777, "OPENSOURCE": 500
    },

    // --- FUNCIONES DE COMPRA DIRECTA (NUEVAS) ---
    populateStore(cat) {
        const grid = document.getElementById("store-list");
        grid.innerHTML = "";
        Object.keys(this.items[cat]).forEach(id => {
            const item = this.items[cat][id];
            const has = this.user.unlocked.includes(id);
            const cost = this.prices[item.rarity];
            grid.innerHTML += `<div class="loot-card" style="border-color:${item.color};">
                <p style="color:${item.color}">${item.name}</p>
                <small>${item.rarity.toUpperCase()}</small><br>
                ${has ? `<span>YA DESBLOQUEADO</span>` : 
                `<button onclick="App.buyItem('${cat}', '${id}', ${cost})">${cost} PC - COMPRAR</button>`}
            </div>`;
        });
    },

    buyItem(cat, id, cost) {
        if (this.user.coins >= cost) {
            this.user.coins -= cost;
            this.user.unlocked.push(id);
            alert(`🛒 ¡COMPRADO! Has desbloqueado: ${id.toUpperCase()}`);
            this.updateUI();
            this.populateStore(cat); // Refrescar la tienda
        } else {
            alert("PC Insuficientes.");
        }
    },

    // --- Resto de funciones (Lootboxes, Save/Load, Game Loop) se mantienen intactas ---
    openBox(type) { /* ... (código intacto) ... */ },
    save() { /* ... */ }, load() { /* ... */ }, updateUI() { /* ... */ },
    checkSession() { /* ... */ }, redeemCode() { /* ... */ },
    populateInventory(cat) { /* ... */ }, equip(cat, id) { /* ... */ },
};

// ... MOTOR DEL JUEGO (startGame, drawRoundedRect, etc) ...

function startGame(mode) {
    // ... (código de startGame intacto, incluyendo controles de teclado/ratón) ...
    showUI('none');
    let b = { x: 400, y: 200, dx: 5, dy: 5 };
    let p1 = 150, p2 = 150;
    if(loop) clearInterval(loop);
    const keys = {}; // Moved to local scope for clarity in multi-mode
    const handleKeyDown = (e) => keys[e.key.toUpperCase()] = true;
    const handleKeyUp = (e) => keys[e.key.toUpperCase()] = false;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    let mouseMoveHandler = null;

    if (mode === 'mouse_vs_cpu') {
        mouseMoveHandler = (e) => {
            let r = App.canvas.getBoundingClientRect();
            p1 = e.clientY - r.top - 80/2;
        };
        window.addEventListener('mousemove', mouseMoveHandler);
    }
    // ... (resto del loop intacto) ...
    loop = setInterval(() => {
        // Logica de movimiento
        if (mode === 'keyboard_1v1' || mode === 'keyboard_2v2') {
            if (keys['W']) p1 -= 6;
            if (keys['S']) p1 += 6;
            if (keys['I']) p2 -= 6;
            if (keys['K']) p2 += 6;
            p1 = Math.max(0, Math.min(400 - 80, p1));
            p2 = Math.max(0, Math.min(400 - 80, p2));
        }
        // ... (resto de fisica, dibujo y game over intacto) ...
        b.x += b.dx; b.y += b.dy;
        if (b.y < 6 || b.y > 400 - 6) b.dy *= -1;
        if (mode === 'mouse_vs_cpu') p2 += (b.y - (p2 + 80/2)) * 0.1;
        App.ctx.fillStyle = "black"; App.ctx.fillRect(0,0,800,400);
        // ... (resto de colisiones y fin de partida) ...
        if (b.x < 0 || b.x > 800) {
            clearInterval(loop);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (mouseMoveHandler) window.removeEventListener('mousemove', mouseMoveHandler); 
            // ... (logica de recompensa y showUI) ...
            showUI('game-over'); App.updateUI();
        }
    }, 1000/60);
}


function showUI(m) {
    if(m === 'main' && loop) clearInterval(loop);
    document.querySelectorAll('.ui-overlay').forEach(el => el.classList.remove('active'));
    // Mapeo de IDs de menú actualizado
    const ids = { 'main': 'main-menu', 'shop': 'shop-menu', 'inventory': 'inventory-menu', 'profile': 'profile-menu', 'game-over': 'game-over', 'title': 'title-screen', 'register': 'title-screen', 'full_store': 'full-store-menu' };
    if (ids[m]) document.getElementById(ids[m]).classList.add('active');
    if (m === 'inventory') App.populateInventory('paddle');
    // if (m === 'full_store') App.populateStore('paddle'); // Esto se manejará con los botones internos ahora
}

window.onload = () => App.init();

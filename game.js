const App = {
    user: {
        name: "", coins: 0,
        unlocked: ["p_classic", "b_classic"], // Desbloqueados por defecto
        equipped: { paddle: "p_classic", ball: "b_classic" },
        usedCodes: [], hasAccount: false
    },
    items: { // Catálogo completo con rareza
        paddle: { p_classic: { name: "Básica", color: "#ffffff", rarity: "common" }, p_emerald: { name: "Esmeralda", color: "#2ecc71", rarity: "common" }, p_neon: { name: "Cian Neón", color: "#00f2ff", rarity: "epic" }, p_ruby: { name: "Rubí", color: "#e74c3c", rarity: "epic" }, p_lava: { name: "Lava Ardiente", color: "#ff4400", rarity: "legendary" }, p_gold: { name: "Oro Rey", color: "#ffd700", rarity: "legendary" }, p_god: { name: "Zeus (GOD)", color: "linear-gradient(#fff, #ff0)", rarity: "god" } },
        ball: { b_classic: { name: "Básica", color: "#ffffff", rarity: "common" }, b_slime: { name: "Slime", color: "#a2ff00", rarity: "common" }, b_fire: { name: "Fuego", color: "#ff4400", rarity: "epic" }, b_ghost: { name: "Espectro", color: "rgba(255,255,255,0.4)", rarity: "legendary" }, b_sun: { name: "SOL (GOD)", color: "#f1c40f", rarity: "god" } }
    },
    // Los 16 promocodes intactos
    promoCodes: { "POBRE": 1, "PONG2026": 500, "BIENVENIDO": 200, "DIOS": 5000, "FREE": 100, "MODULAR": 300, "VERDE": 150, "ULTIMATE": 1000, "NUEVO": 250, "PC_GRATIS": 50, "RECOMPENSA": 400, "FERRAN": 1000, "YOUTUBE": 200, "TWITCH": 200, "SECRET": 777, "OPENSOURCE": 500 },
    init() {
        this.canvas = document.getElementById("pong");
        if (this.canvas) {
            this.ctx = this.canvas.getContext("2d");
            this.canvas.width = 800; this.canvas.height = 400;
            this.load();
            this.updateUI();
        } else { console.error("Canvas element not found!"); } // Esto ayuda a depurar el error "Cargando..."
    },
    // Lógica de Lootboxes arreglada para dar objetos por rareza
    openBox(type) {
        const costs = { common: 100, epic: 500, god: 1500 };
        if (this.user.coins < costs[type]) return alert("PC Insuficientes");
        this.user.coins -= costs[type];
        let pool = [];
        Object.keys(this.items.paddle).concat(Object.keys(this.items.ball)).forEach(id => {
            const item = this.items.paddle[id] || this.items.ball[id];
            if (type === "common" && item.rarity === "common") pool.push(id);
            if (type === "epic" && (item.rarity === "epic" || item.rarity === "common")) pool.push(id);
            if (type === "god" && (item.rarity === "legendary" || item.rarity === "god")) pool.push(id);
        });
        const reward = pool[Math.floor(Math.random() * pool.length)];
        if (!this.user.unlocked.includes(reward)) { 
            this.user.unlocked.push(reward);
            alert(`🎉 ¡NUEVO OBJETO!: ${reward.toUpperCase()}`);
        } else {
            const refund = Math.floor(costs[type] / 2);
            this.user.coins += refund;
            alert(`♻️ Objeto repetido. Reembolso: +${refund} PC.`);
        }
        this.updateUI();
    },
    save() { const data = btoa(JSON.stringify(this.user)); localStorage.setItem("PONG_FINAL_2026", data); if(document.getElementById("save-code-output")) document.getElementById("save-code-output").value = data; },
    load() { const saved = localStorage.getItem("PONG_FINAL_2026"); if (saved) this.user = Object.assign(this.user, JSON.parse(atob(saved))); },
    updateUI() { document.getElementById("display-username").innerText = this.user.name || "Invitado"; document.getElementById("display-coins").innerText = this.user.coins; this.save(); },
    checkSession() {
        if (!this.user.hasAccount) {
            document.getElementById("username-input").style.display = "block";
            const btn = document.getElementById("main-btn");
            btn.innerText = "REGISTRAR";
            btn.onclick = () => { const n = document.getElementById("username-input").value; if(n.length < 3) return alert("Nombre corto"); this.user.name = n; this.user.hasAccount = true; this.updateUI(); showUI('main'); };
        } else { showUI('main'); }
    },
    redeemCode() {
        const code = document.getElementById("promo-input").value.toUpperCase().trim();
        if (this.user.usedCodes.includes(code)) return alert("Ya canjeado");
        if (this.promoCodes[code]) { this.user.coins += this.promoCodes[code]; this.user.usedCodes.push(code); alert(`🎁 +${this.promoCodes[code]} PC`); this.updateUI(); }
    },
    populateInventory(cat) {
        const grid = document.getElementById("inventory-list");
        grid.innerHTML = "";
        Object.keys(this.items[cat]).forEach(id => {
            const item = this.items[cat][id];
            const has = this.user.unlocked.includes(id);
            const eq = this.user.equipped[cat] === id;
            grid.innerHTML += `<div class="loot-card" style="border-color:${has ? item.color : '#333'}">
                <p style="color:${item.color}">${item.name}</p>
                <small>${item.rarity.toUpperCase()}</small><br>
                <button onclick="App.equip('${cat}','${id}')" ${!has?'disabled':''}>
                    ${eq ? 'EQUIPADO' : (has ? 'USAR' : 'BLOQUEADO')}
                </button></div>`;
        });
    },
    equip(cat, id) { if(this.user.unlocked.includes(id)) { this.user.equipped[cat] = id; this.updateUI(); this.populateInventory(cat); } }
};

// --- MOTOR DE JUEGO (MOVILIDAD FUNCIONAL Y CONTROLES TECLADO) ---
let loop;
const PADDLE_WIDTH = 12, PADDLE_HEIGHT = 80, PADDLE_CURVE = 5, BALL_RADIUS = 6, PADDLE_SPEED = 6;
const keys = {};

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y); ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

function startGame(mode) {
    showUI('none');
    let b = { x: 400, y: 200, dx: 5, dy: 5 };
    let p1 = 150, p2 = 150;
    if(loop) clearInterval(loop);
    
    // Configurar listeners de teclado/ratón correctamente
    const handleKeyDown = (e) => keys[e.key.toUpperCase()] = true;
    const handleKeyUp = (e) => keys[e.key.toUpperCase()] = false;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    let mouseMoveHandler = null;

    if (mode === 'mouse_vs_cpu') {
        // MOVILIDAD ARREGLADA: Listener global para seguir el ratón
        mouseMoveHandler = (e) => {
            let r = App.canvas.getBoundingClientRect();
            p1 = e.clientY - r.top - PADDLE_HEIGHT/2;
            p1 = Math.max(0, Math.min(400 - PADDLE_HEIGHT, p1)); // Limitar a pantalla
        };
        window.addEventListener('mousemove', mouseMoveHandler);
    }

    loop = setInterval(() => {
        // Lógica de movimiento de teclado (W/S para P1, I/K para P2)
        if (mode.includes('keyboard')) {
            if (keys['W']) p1 -= PADDLE_SPEED;
            if (keys['S']) p1 += PADDLE_SPEED;
            if (keys['I']) p2 -= PADDLE_SPEED;
            if (keys['K']) p2 += PADDLE_SPEED;
            p1 = Math.max(0, Math.min(400 - PADDLE_HEIGHT, p1));
            p2 = Math.max(0, Math.min(400 - PADDLE_HEIGHT, p2));
        }

        // Lógica CPU
        if (mode === 'mouse_vs_cpu') { p2 += (b.y - (p2 + PADDLE_HEIGHT/2)) * 0.1; }

        // Física, dibujo y colisiones con formas curvas
        b.x += b.dx; b.y += b.dy;
        if (b.y < BALL_RADIUS || b.y > 400 - BALL_RADIUS) b.dy *= -1;
        App.ctx.fillStyle = "black"; App.ctx.fillRect(0,0,800,400);
        App.ctx.fillStyle = App.items.paddle[App.user.equipped.paddle].color;
        drawRoundedRect(App.ctx, 10, p1, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_CURVE);
        drawRoundedRect(App.ctx, 800 - 10 - PADDLE_WIDTH, p2, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_CURVE);
        App.ctx.fillStyle = App.items.ball[App.user.equipped.ball].color;
        App.ctx.beginPath(); App.ctx.arc(b.x, b.y, BALL_RADIUS, 0, Math.PI * 2); App.ctx.fill();

        if (b.x - BALL_RADIUS < 10 + PADDLE_WIDTH && b.y > p1 && b.y < p1 + PADDLE_HEIGHT) b.dx *= -1.05;
        if (b.x + BALL_RADIUS > 800 - 10 - PADDLE_WIDTH && b.y > p2 && b.y < p2 + PADDLE_HEIGHT) b.dx *= -1.05;

        // Fin de partida
        if (b.x < 0 || b.x > 800) {
            clearInterval(loop);
            // IMPORTANTE: Limpiar listeners al acabar para evitar bugs y que la UI funcione
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (mouseMoveHandler) window.removeEventListener('mousemove', mouseMoveHandler); 
            const win = b.x > 400; 
            App.user.coins += win ? 50 : 10;
            document.getElementById("winner-text").innerText = win ? "¡VICTORIA!" : "DERROTA";
            document.getElementById("reward-text").innerText = `+${win?50:10} PC RECIBIDOS`;
            showUI('game-over'); App.updateUI();
        }
    }, 1000/60);
}

function showUI(m) {
    // Esto evita que la sesión se cierre al volver al menú principal
    if(m === 'main' && loop) clearInterval(loop);
    document.querySelectorAll('.ui-overlay').forEach(el => el.classList.remove('active'));
    // Mapeo de IDs de menú actualizado para que todo funcione
    const ids = { 'main': 'main-menu', 'shop': 'shop-menu', 'inventory': 'inventory-menu', 'profile': 'profile-menu', 'game-over': 'game-over', 'title': 'title-screen', 'register': 'title-screen' };
    if (ids[m]) document.getElementById(ids[m]).classList.add('active');
    if (m === 'inventory') App.populateInventory('paddle');
}
window.onload = () => App.init();

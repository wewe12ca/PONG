const App = {
    user: {
        name: "", coins: 0,
        unlocked: ["p_classic", "b_classic"],
        equipped: { paddle: "p_classic", ball: "b_classic" },
        usedCodes: [], hasAccount: false
    },

    items: {
        paddle: {
            p_classic:  { name: "Básica", color: "#ffffff", rarity: "common" },
            p_emerald:  { name: "Esmeralda", color: "#2ecc71", rarity: "common" },
            p_neon:     { name: "Cian Neón", color: "#00f2ff", rarity: "epic" },
            p_ruby:     { name: "Rubí", color: "#e74c3c", rarity: "epic" },
            p_gold:     { name: "Oro Rey", color: "#ffd700", rarity: "legendary" },
            p_god:      { name: "DIOS Zeus", color: "linear-gradient(#fff, #ff0)", rarity: "god" }
        },
        ball: {
            b_classic:  { name: "Básica", color: "#ffffff", rarity: "common" },
            b_fire:     { name: "Fuego", color: "#ff4400", rarity: "epic" },
            b_ghost:    { name: "Fantasma", color: "rgba(255,255,255,0.4)", rarity: "legendary" },
            b_sun:      { name: "Sol", color: "#f1c40f", rarity: "god" }
        }
    },

    promoCodes: {
        "POBRE": 1, "PONG2026": 500, "BIENVENIDO": 200, "DIOS": 5000, "FREE": 100,
        "MODULAR": 300, "VERDE": 150, "ULTIMATE": 1000, "NUEVO": 250, "PC_GRATIS": 50,
        "RECOMPENSA": 400, "FERRAN": 1000, "YOUTUBE": 200, "TWITCH": 200, "SECRET": 777, "OPENSOURCE": 500
    },

    init() {
        this.canvas = document.getElementById("pong");
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = 800; this.canvas.height = 400;
        this.load();
        this.updateUI();
    },

    // --- SISTEMA DE LOOTBOXES ---
    openBox(type) {
        const cost = { common: 100, epic: 500, god: 1500 }[type];
        if (this.user.coins < cost) return alert("PC Insuficientes");
        this.user.coins -= cost;

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
            alert(`🎉 ¡NUEVO!: ${reward}`);
        } else {
            const refund = Math.floor(cost/2);
            this.user.coins += refund;
            alert(`♻️ Repetido. Recuperas ${refund} PC`);
        }
        this.updateUI();
    },

    // --- SESIÓN Y PERSISTENCIA ---
    createAccount() {
        const val = document.getElementById("username-input").value;
        if (val.length < 3) return;
        this.user.name = val; this.user.hasAccount = true;
        this.save(); this.updateUI(); showUI('main');
    },

    checkSession() {
        this.user.hasAccount ? showUI('main') : showUI('register');
    },

    save() {
        const data = btoa(JSON.stringify(this.user));
        localStorage.setItem("PONG_2026_FINAL", data);
        if(document.getElementById("save-code-output")) document.getElementById("save-code-output").value = data;
    },

    load() {
        const saved = localStorage.getItem("PONG_2026_FINAL");
        if (saved) this.user = Object.assign(this.user, JSON.parse(atob(saved)));
    },

    updateUI() {
        document.getElementById("display-username").innerText = this.user.name || "Invitado";
        document.getElementById("display-coins").innerText = this.user.coins;
        this.save();
    },

    redeemCode() {
        const input = document.getElementById("promo-input");
        const code = input.value.toUpperCase().trim();
        if (this.user.usedCodes.includes(code)) return alert("Ya usado");
        if (this.promoCodes[code]) {
            this.user.coins += this.promoCodes[code];
            this.user.usedCodes.push(code);
            alert(`🎁 +${this.promoCodes[code]} PC`);
            this.updateUI(); input.value = "";
        }
    },

    populateInventory(cat) {
        const grid = document.getElementById("inventory-list");
        grid.innerHTML = "";
        Object.keys(this.items[cat]).forEach(id => {
            const has = this.user.unlocked.includes(id);
            const eq = this.user.equipped[cat] === id;
            grid.innerHTML += `<div class="loot-card">
                <p style="color:${this.items[cat][id].color}">${this.items[cat][id].name}</p>
                <button onclick="App.equip('${cat}','${id}')" ${!has?'disabled':''}>
                    ${eq ? 'EQUIPADO' : (has ? 'USAR' : 'BLOQUEADO')}
                </button></div>`;
        });
    },

    equip(cat, id) { this.user.equipped[cat] = id; this.updateUI(); this.populateInventory(cat); }
};

// --- MOTOR ---
let loop;
function startGame(isCpu) {
    showUI('none');
    let b = { x: 400, y: 200, dx: 5, dy: 5 }; let p1 = 150, p2 = 150;
    if(loop) clearInterval(loop);
    loop = setInterval(() => {
        b.x += b.dx; b.y += b.dy;
        if (b.y < 0 || b.y > 390) b.dy *= -1;
        if(isCpu) p2 += (b.y - (p2 + 40)) * 0.1;
        const ctx = App.ctx;
        ctx.fillStyle = "black"; ctx.fillRect(0,0,800,400);
        ctx.fillStyle = App.items.paddle[App.user.equipped.paddle].color;
        ctx.fillRect(10, p1, 10, 80); ctx.fillRect(780, p2, 10, 80);
        ctx.fillStyle = App.items.ball[App.user.equipped.ball].color;
        ctx.fillRect(b.x, b.y, 10, 10);
        if (b.x < 20 && b.y > p1 && b.y < p1 + 80) b.dx *= -1.05;
        if (b.x > 770 && b.y > p2 && b.y < p2 + 80) b.dx *= -1.05;
        if (b.x < 0 || b.x > 800) {
            clearInterval(loop); const win = b.x > 800;
            App.user.coins += win ? 50 : 10;
            document.getElementById("winner-text").innerText = win ? "VICTORIA" : "DERROTA";
            document.getElementById("reward-text").innerText = "+PC Recibidos";
            showUI('game-over'); App.updateUI();
        }
    }, 1000/60);
    window.onmousemove = (e) => { let r = App.canvas.getBoundingClientRect(); p1 = e.clientY - r.top - 40; };
}

function showUI(m) {
    if(m === 'main' && loop) clearInterval(loop);
    document.querySelectorAll('.ui-overlay').forEach(el => el.classList.remove('active'));
    const ids = { 'register': 'register-screen', 'main': 'main-menu', 'shop': 'shop-menu', 'inventory': 'inventory-menu', 'profile': 'profile-menu', 'game-over': 'game-over', 'title': 'title-screen' };
    if (ids[m]) document.getElementById(ids[m]).classList.add('active');
    if (m === 'inventory') App.populateInventory('paddle');
}
window.onload = () => App.init();

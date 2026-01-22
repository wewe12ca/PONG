const App = {
    user: {
        name: "",
        coins: 0,
        xp: 0,
        unlocked: ["p_classic", "b_classic"],
        equipped: { paddle: "p_classic", ball: "b_classic" },
        usedCodes: [],
        hasAccount: false
    },

    // CATÁLOGO DE COSMÉTICOS AMPLIADO
    items: {
        paddle: {
            p_classic:  { name: "Básica", color: "#ffffff" },
            p_neon:     { name: "Neón Azul", color: "#00f2ff" },
            p_emerald:  { name: "Esmeralda", color: "#2ecc71" },
            p_ruby:     { name: "Rubí", color: "#e74c3c" },
            p_gold:     { name: "Oro Puro", color: "#ffd700" },
            p_void:     { name: "Vacío Negro", color: "#1a1a1a" },
            p_lava:     { name: "Lava Ardiente", color: "#ff4400" }
        },
        ball: {
            b_classic:  { name: "Estándar", color: "#ffffff", speed: 5 },
            b_fire:     { name: "Fuego", color: "#ff4400", speed: 8 },
            b_ice:      { name: "Hielo", color: "#00ffff", speed: 4 },
            b_ghost:    { name: "Fantasma", color: "rgba(255,255,255,0.3)", speed: 5 }
        }
    },

    // LOS 16 CÓDIGOS PROMOCIONALES
    promoCodes: {
        "POBRE": 1, "PONG2026": 500, "BIENVENIDO": 200, "DIOS": 5000, 
        "FREE": 100, "MODULAR": 300, "VERDE": 150, "ULTIMATE": 1000, 
        "NUEVO": 250, "PC_GRATIS": 50, "RECOMPENSA": 400, "FERRAN": 1000, 
        "YOUTUBE": 200, "TWITCH": 200, "SECRET": 777, "OPENSOURCE": 500
    },

    init() {
        this.canvas = document.getElementById("pong");
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = 800; this.canvas.height = 400;
        this.load();
        this.updateUI();
    },

    // GESTIÓN DE SESIÓN
    checkSession() {
        if (!this.user.hasAccount) {
            showUI('register');
        } else {
            showUI('main');
        }
    },

    createAccount() {
        const input = document.getElementById("username-input");
        if (input.value.trim().length < 3) return alert("Nombre demasiado corto");
        this.user.name = input.value;
        this.user.hasAccount = true;
        this.save();
        this.updateUI();
        showUI('main');
    },

    save() {
        const data = btoa(JSON.stringify(this.user));
        localStorage.setItem("PONG_FINAL_DATA_2026", data);
        if(document.getElementById("save-code-output")) {
            document.getElementById("save-code-output").value = data;
        }
    },

    load() {
        const saved = localStorage.getItem("PONG_FINAL_DATA_2026");
        if (saved) {
            const decoded = JSON.parse(atob(saved));
            this.user = Object.assign(this.user, decoded);
        }
    },

    updateUI() {
        document.getElementById("display-username").innerText = this.user.name || "Invitado";
        document.getElementById("display-coins").innerText = this.user.coins;
        this.save();
    },

    redeemCode() {
        const input = document.getElementById("promo-input");
        const code = input.value.toUpperCase().trim();
        if (this.user.usedCodes.includes(code)) return alert("Ya canjeado");
        if (this.promoCodes[code]) {
            this.user.coins += this.promoCodes[code];
            this.user.usedCodes.push(code);
            alert(`🎁 +${this.promoCodes[code]} PC recibidos`);
            this.updateUI();
            input.value = "";
        } else { alert("Código inválido"); }
    },

    populateInventory(cat) {
        const grid = document.getElementById("inventory-list");
        grid.innerHTML = "";
        Object.keys(this.items[cat]).forEach(id => {
            const has = this.user.unlocked.includes(id);
            const eq = this.user.equipped[cat] === id;
            const item = this.items[cat][id];
            grid.innerHTML += `
                <div class="loot-card">
                    <p style="color:${item.color}">${item.name}</p>
                    <button onclick="App.equip('${cat}','${id}')" ${!has?'disabled':''}>
                        ${eq ? 'EQUIPADO' : (has ? 'USAR' : 'LOCKED')}
                    </button>
                </div>`;
        });
    },

    equip(cat, id) {
        this.user.equipped[cat] = id;
        this.updateUI();
        this.populateInventory(cat);
    }
};

// MOTOR DEL JUEGO
let loop;
function startGame(isCpu) {
    showUI('none');
    let b = { x: 400, y: 200, dx: 5, dy: 5 };
    let p1 = 150, p2 = 150;
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
            clearInterval(loop);
            const win = b.x > 800;
            App.user.coins += win ? 50 : 10;
            document.getElementById("winner-text").innerText = win ? "VICTORIA" : "DERROTA";
            document.getElementById("reward-text").innerText = win ? "+50 PC" : "+10 PC";
            showUI('game-over');
            App.updateUI();
        }
    }, 1000/60);

    window.onmousemove = (e) => {
        let rect = App.canvas.getBoundingClientRect();
        p1 = e.clientY - rect.top - 40;
    };
}

function showUI(menu) {
    if(menu === 'main' && loop) clearInterval(loop);
    document.querySelectorAll('.ui-overlay').forEach(el => el.classList.remove('active'));
    const ids = { 'register': 'register-screen', 'main': 'main-menu', 'inventory': 'inventory-menu', 'profile': 'profile-menu', 'game-over': 'game-over', 'title': 'title-screen' };
    if (ids[menu]) document.getElementById(ids[menu]).classList.add('active');
    if (menu === 'inventory') App.populateInventory('paddle');
}

window.onload = () => App.init();

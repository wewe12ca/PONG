const App = {
    // ESTADO DEL JUGADOR
    user: {
        name: "JUGADOR_2026",
        coins: 0,
        xp: 0,
        unlocked: ["p_classic", "b_classic"],
        equipped: { paddle: "p_classic", ball: "b_classic" },
        usedCodes: [] // Aquí se guardan los códigos ya canjeados
    },

    // BASE DE DATOS DE COSMÉTICOS
    items: {
        paddle: {
            p_classic: { name: "Básica", color: "#ffffff" },
            p_neon: { name: "Cian Neón", color: "#00f2ff" },
            p_emerald: { name: "Esmeralda", color: "#2ecc71" },
            p_ruby: { name: "Rubí", color: "#e74c3c" },
            p_gold: { name: "Oro Rey", color: "#ffd700" },
            p_god: { name: "DIOS", color: "linear-gradient(#fff, #ff0)" }
        },
        ball: {
            b_classic: { name: "Básica", color: "#ffffff", speed: 5 },
            b_fire: { name: "Fuego", color: "#ff4400", speed: 8 },
            b_ice: { name: "Hielo", color: "#00ffff", speed: 4 }
        }
    },

    // LOS 16 PROMO CODES (Recuperados todos)
    promoCodes: {
        "POBRE": 1,
        "PONG2026": 500,
        "BIENVENIDO": 200,
        "DIOS": 5000,
        "FREE": 100,
        "MODULAR": 300,
        "VERDE": 150,
        "ULTIMATE": 1000,
        "NUEVO": 250,
        "PC_GRATIS": 50,
        "RECOMPENSA": 400,
        "FERRAN": 1000,
        "YOUTUBE": 200,
        "TWITCH": 200,
        "SECRET": 777,
        "OPENSOURCE": 500
    },

    init() {
        this.canvas = document.getElementById("pong");
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = 800;
        this.canvas.height = 400;
        this.load(); // Carga la sesión al iniciar
        this.updateUI();
    },

    // SISTEMA DE PERSISTENCIA (Para que no se borre la sesión)
    save() {
        const data = btoa(JSON.stringify(this.user));
        localStorage.setItem("PONG_SAVE_2026", data);
        if(document.getElementById("save-code-output")) {
            document.getElementById("save-code-output").value = data;
        }
    },

    load() {
        const saved = localStorage.getItem("PONG_SAVE_2026");
        if (saved) {
            try {
                const decoded = JSON.parse(atob(saved));
                // Fusionamos datos para no perder nuevas funciones
                this.user = Object.assign(this.user, decoded);
            } catch(e) { console.error("Error cargando datos"); }
        }
    },

    updateUI() {
        document.getElementById("display-username").innerText = this.user.name;
        document.getElementById("display-coins").innerText = this.user.coins;
        this.save(); // Guarda automáticamente cada vez que algo cambia
    },

    redeemCode() {
        const input = document.getElementById("promo-input");
        const code = input.value.toUpperCase().trim();
        
        if (this.user.usedCodes.includes(code)) return alert("⚠️ Código ya usado");
        
        if (this.promoCodes[code]) {
            const reward = this.promoCodes[code];
            this.user.coins += reward;
            this.user.usedCodes.push(code);
            alert(`🎁 ¡Canjeado! Has recibido ${reward} PC`);
            this.updateUI();
            input.value = "";
        } else {
            alert("❌ Código no válido");
        }
    },

    populateInventory(cat) {
        const grid = document.getElementById("inventory-list");
        grid.innerHTML = "";
        Object.keys(this.items[cat]).forEach(id => {
            const has = this.user.unlocked.includes(id);
            const eq = this.user.equipped[cat] === id;
            grid.innerHTML += `
                <div class="loot-card">
                    <p style="color:${this.items[cat][id].color}">${this.items[cat][id].name}</p>
                    <button onclick="App.equip('${cat}','${id}')" ${!has?'disabled':''}>
                        ${eq ? 'EQUIPADO' : (has?'USAR':'LOCKED')}
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
let gameLoop;
function startGame(isCpu) {
    showUI('none');
    let b = { x: 400, y: 200, dx: 5, dy: 5 };
    let p1 = 150, p2 = 150;
    
    if(gameLoop) clearInterval(gameLoop);

    gameLoop = setInterval(() => {
        b.x += b.dx; b.y += b.dy;
        if (b.y < 0 || b.y > 390) b.dy *= -1;
        if(isCpu) p2 += (b.y - (p2 + 40)) * 0.1;

        const ctx = App.ctx;
        ctx.fillStyle = "black"; ctx.fillRect(0,0,800,400);
        
        // Dibujo con cosméticos
        ctx.fillStyle = App.items.paddle[App.user.equipped.paddle].color;
        ctx.fillRect(10, p1, 10, 80); 
        ctx.fillRect(780, p2, 10, 80);
        
        ctx.fillStyle = App.items.ball[App.user.equipped.ball].color;
        ctx.fillRect(b.x, b.y, 10, 10);

        // Colisiones
        if (b.x < 20 && b.y > p1 && b.y < p1 + 80) b.dx *= -1.05;
        if (b.x > 770 && b.y > p2 && b.y < p2 + 80) b.dx *= -1.05;

        // Game Over
        if (b.x < 0 || b.x > 800) {
            clearInterval(gameLoop);
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
    // Detenemos el juego si volvemos a la UI
    if(menu !== 'none' && gameLoop) clearInterval(gameLoop);

    document.querySelectorAll('.ui-overlay').forEach(el => el.classList.remove('active'));
    const ids = { 'main': 'main-menu', 'inventory': 'inventory-menu', 'profile': 'profile-menu', 'game-over': 'game-over' };
    if (ids[menu]) document.getElementById(ids[menu]).classList.add('active');
    if (menu === 'inventory') App.populateInventory('paddle');
}

window.onload = () => App.init();

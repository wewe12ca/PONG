const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");

let ball, players = [], gameActive = false;
let currentMode, isCPU, cpuDifficulty, isCaos;
const keys = {};

const allItems = {
    'p_base': { name: 'Verde', color: '#00ff00', rarity: 'Común', type: 'paddle' },
    'p_blue': { name: 'Azul', color: '#0000ff', rarity: 'Común', type: 'paddle' },
    'p_red': { name: 'Rojo', color: '#ff0000', rarity: 'Común', type: 'paddle' },
    'p_cyan': { name: 'Cian', color: '#00fbff', rarity: 'Raro', type: 'paddle' },
    'p_pink': { name: 'Rosa', color: '#ff00ff', rarity: 'Raro', type: 'paddle' },
    'p_emerald': { name: 'Esmeralda', color: '#50c878', rarity: 'Épico', type: 'paddle' },
    'p_gold': { name: 'Oro Puro', color: '#ffd700', rarity: 'Épico', type: 'paddle' },
    'p_lava': { name: 'Lava', color: '#ff4500', rarity: 'Legendario', type: 'paddle' },
    'p_void': { name: 'Vacío', color: '#111111', rarity: 'Legendario', type: 'paddle' },
    'p_rainbow': { name: 'Arcoíris', color: 'RAINBOW', rarity: 'Legendario', type: 'paddle' },
    'b_base': { name: 'Blanca', color: '#ffffff', rarity: 'Común', type: 'ball' },
    'b_fire': { name: 'Fuego', color: '#ff6600', rarity: 'Épico', type: 'ball' },
    'b_frost': { name: 'Escarcha', color: '#00ffff', rarity: 'Legendario', type: 'ball' }
};

let userData = {
    coins: 200, username: "Jugador",
    equipped: { paddle: 'p_base', ball: 'b_base' },
    inventory: ['p_base', 'b_base'],
    usedCodes: []
};

// --- SISTEMA DE CAJAS ANIMADAS ---
function openBox(tier) {
    const prices = { 'common': 100, 'epic': 500, 'god': 1500 };
    if (userData.coins < prices[tier]) return alert("PC insuficientes");
    
    userData.coins -= prices[tier];
    updateUI();

    // Filtrar items por probabilidad según caja
    const ids = Object.keys(allItems);
    let pool = [];

    if (tier === 'common') pool = ids.filter(id => allItems[id].rarity === 'Común' || allItems[id].rarity === 'Raro');
    else if (tier === 'epic') pool = ids.filter(id => allItems[id].rarity === 'Raro' || allItems[id].rarity === 'Épico');
    else if (tier === 'god') pool = ids.filter(id => allItems[id].rarity === 'Épico' || allItems[id].rarity === 'Legendario');

    const rewardId = pool[Math.floor(Math.random() * pool.length)];
    startBoxAnim(rewardId, prices[tier]);
}

function startBoxAnim(id, cost) {
    showUI('none');
    document.getElementById("lootbox-opening").style.display = "flex";
    document.getElementById("reward-display").style.display = "none";
    document.getElementById("box-sprite").className = "box-shake";
    document.getElementById("opening-text").innerText = "ABRIENDO...";

    setTimeout(() => {
        document.getElementById("box-sprite").className = "";
        document.getElementById("opening-text").innerText = "¡OBJETO ENCONTRADO!";
        document.getElementById("reward-display").style.display = "block";
        
        const item = allItems[id];
        const card = document.getElementById("reward-card");
        card.className = `item ${item.rarity.toLowerCase()}`;
        card.innerHTML = `<small>${item.rarity}</small><h3>${item.name}</h3>`;

        if (!userData.inventory.includes(id)) {
            userData.inventory.push(id);
        } else {
            userData.coins += Math.floor(cost * 0.5);
            card.innerHTML += `<p>Repetido: +${Math.floor(cost*0.5)} PC</p>`;
        }
        updateUI();
    }, 2000);
}

// --- INVENTARIO "BONITO" ---
function populateInventory() {
    const list = document.getElementById("inventory-list");
    list.innerHTML = "";
    userData.inventory.forEach(id => {
        const item = allItems[id];
        const isEq = userData.equipped[item.type] === id;
        list.innerHTML += `
            <div class="inv-card ${item.rarity.toLowerCase()}" onclick="equip('${id}')">
                <div class="rarity-tag">${item.rarity}</div>
                <div class="item-preview" style="background:${item.color === 'RAINBOW' ? 'linear-gradient(45deg, red, blue)' : item.color}"></div>
                <b>${item.name}</b>
                <div class="status">${isEq ? '✓ EQUIPADO' : 'EQUIPAR'}</div>
            </div>`;
    });
}

function equip(id) {
    userData.equipped[allItems[id].type] = id;
    updateUI();
    populateInventory();
}

// --- LÓGICA DE JUEGO ---
function startGame(mode, cpu, diff, caos) {
    currentMode = mode; isCPU = cpu; cpuDifficulty = diff; isCaos = caos;
    gameActive = true;
    document.getElementById("top-bar").style.display = "none";
    showUI('none');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    initPlayers(); resetBall(1); requestAnimationFrame(loop);
}

function initPlayers() {
    const pW = 15, pH = canvas.height * 0.18, mid = canvas.height/2 - pH/2;
    let pCol = allItems[userData.equipped.paddle].color;
    if(pCol === 'RAINBOW') pCol = '#fff';
    players = [{ x: 40, y: mid, w: pW, h: pH, color: pCol, lives: 5, up: "w", down: "s", team: "V", ai: false }];
    if(currentMode === 2) players.push({ x: 120, y: mid, w: pW, h: pH, color: pCol, lives: 5, up: "t", down: "g", team: "V", ai: false });
    players.push({ x: canvas.width - 55, y: mid, w: pW, h: pH, color: "#ff0000", lives: 5, up: "arrowup", down: "arrowdown", team: "R", ai: isCPU });
    if(currentMode === 2) players.push({ x: canvas.width - 135, y: mid, w: pW, h: pH, color: "#ff0000", lives: 5, up: "i", down: "k", team: "R", ai: isCPU });
}

function resetBall(dir) {
    players.forEach(p => p.h = canvas.height * 0.18);
    ball = { x: canvas.width/2, y: canvas.height/2, r: 10, dx: dir*(canvas.width*0.007), dy: (Math.random()-0.5)*8 };
    if(isCaos) { ball.dx *= 1.5; modDisplay.innerText = "¡VELOCIDAD!"; setTimeout(()=>modDisplay.innerText="", 1500); }
}

function update() {
    players.forEach(p => {
        if (p.ai) p.y += (ball.y - (p.y + p.h/2)) * cpuDifficulty;
        else {
            if (keys[p.up] && p.y > 0) p.y -= 9;
            if (keys[p.down] && p.y < canvas.height - p.h) p.y += 9;
        }
    });
    if(allItems[userData.equipped.paddle].color === 'RAINBOW') {
        players.filter(p => p.team === 'V').forEach(p => p.color = `hsl(${Date.now()%360}, 100%, 50%)`);
    }
    ball.x += ball.dx; ball.y += ball.dy;
    if (ball.y <= 0 || ball.y >= canvas.height) ball.dy *= -1;
    players.forEach(p => {
        if (ball.x + ball.r > p.x && ball.x - ball.r < p.x + p.w && ball.y + ball.r > p.y && ball.y - ball.r < p.y + p.h) {
            ball.dx *= -1.05; ball.dy += (Math.random()-0.5)*4;
        }
    });
    if (ball.x < 0) score("R"); if (ball.x > canvas.width) score("V");
}

function score(t) {
    players.filter(p => p.team !== t).forEach(p => p.lives--);
    if (players.some(p => p.lives <= 0)) {
        gameActive = false; userData.coins += isCaos ? 100 : 50; updateUI();
        document.getElementById("top-bar").style.display = "flex";
        showUI('game-over');
        document.getElementById("winner-text").innerText = t === "V" ? "GANASTE" : "PERDISTE";
    } else resetBall(t === "V" ? -1 : 1);
}

function render() {
    ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.fillRect(0,0,canvas.width,canvas.height);
    players.forEach(p => { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.w, p.h); });
    ctx.fillStyle = allItems[userData.equipped.ball].color;
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
}

function loop() { if(gameActive){ update(); render(); requestAnimationFrame(loop); } }

function showUI(menu) {
    ['main-menu', 'shop-menu', 'inventory-menu', 'profile-menu', 'game-over', 'lootbox-opening'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = "none";
    });
    if (menu === 'inventory') populateInventory();
    if(menu !== 'none' && menu !== 'game-over') document.getElementById(menu + "-menu").style.display = "flex";
    if(menu === 'game-over') document.getElementById("game-over").style.display = "flex";
}

function updateUI() {
    document.getElementById("display-coins").innerText = userData.coins;
    document.getElementById("display-username").innerText = userData.username;
    document.getElementById("save-code-output").value = btoa(JSON.stringify(userData));
}

function loadFromCode() {
    try {
        userData = JSON.parse(atob(document.getElementById("load-code-input").value));
        updateUI(); alert("Sesión Cargada.");
    } catch(e) { alert("Error."); }
}

window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
updateUI();

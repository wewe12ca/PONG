const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");
const modDisplay = document.getElementById("mod-display");

let ball, players = [], gameActive = false;
let currentMode, isCPU, cpuDifficulty, isCaos;
const keys = {};

// BASE DE DATOS EXTENSA
const allItems = {
    'p_base': { name: 'Neón Verde', color: '#00ff00', rarity: 'Común', type: 'paddle' },
    'p_cyan': { name: 'Cian', color: '#00fbff', rarity: 'Raro', type: 'paddle' },
    'p_gold': { name: 'Oro Puro', color: '#ffd700', rarity: 'Épico', type: 'paddle' },
    'p_rainbow': { name: 'Legendaria', color: 'RAINBOW', rarity: 'Legendario', type: 'paddle' },
    'b_base': { name: 'Blanca', color: '#ffffff', rarity: 'Común', type: 'ball' },
    'b_fire': { name: 'Fuego', color: '#ff6600', rarity: 'Épico', type: 'ball' },
    'bg_black': { name: 'Espacio', color: '#000000', rarity: 'Común', type: 'bg' },
    'bg_purple': { name: 'Nebulosa', color: '#1a0033', rarity: 'Raro', type: 'bg' },
    'bg_ocean': { name: 'Océano', color: '#000d1a', rarity: 'Épico', type: 'bg' }
};

let userData = JSON.parse(localStorage.getItem('pong_v2026')) || {
    coins: 250, username: "Jugador",
    equipped: { paddle: 'p_base', ball: 'b_base', bg: 'bg_black' },
    inventory: ['p_base', 'b_base', 'bg_black']
};

function updateUI() {
    document.getElementById("display-coins").innerText = userData.coins;
    document.getElementById("display-username").innerText = userData.username;
    document.getElementById("save-code-output").value = btoa(JSON.stringify(userData));
    localStorage.setItem('pong_v2026', JSON.stringify(userData));
}

function enterGame() {
    document.getElementById("title-screen").style.display = "none";
    document.getElementById("top-bar").style.display = "flex";
    showUI('main');
}

function showUI(menu) {
    const screens = ['main-menu', 'shop-menu', 'inventory-menu', 'profile-menu', 'game-over'];
    screens.forEach(s => document.getElementById(s).style.display = "none");
    if (menu === 'inventory') populateInventory('paddle');
    if (menu !== 'none') document.getElementById(menu + "-menu").style.display = "flex";
}

function populateInventory(type) {
    const list = document.getElementById("inventory-list");
    list.innerHTML = "";
    userData.inventory.filter(id => allItems[id].type === type).forEach(id => {
        const item = allItems[id];
        const isEq = userData.equipped[item.type] === id;
        list.innerHTML += `
            <div class="inv-card ${item.rarity.toLowerCase()}">
                <div class="item-preview" style="background:${item.color === 'RAINBOW' ? 'linear-gradient(45deg,red,blue)' : item.color}"></div>
                <b>${item.name}</b>
                <button onclick="equip('${id}', '${type}')">${isEq ? '✓' : 'EQUIPAR'}</button>
            </div>`;
    });
}

function equip(id, type) {
    userData.equipped[type] = id;
    updateUI(); populateInventory(type);
}

function openBox(tier) {
    const prices = { common: 100, epic: 500, god: 1500 };
    if (userData.coins < prices[tier]) return alert("PC insuficientes");
    userData.coins -= prices[tier];
    const ids = Object.keys(allItems);
    let rewardId = ids[Math.floor(Math.random() * ids.length)];
    if (!userData.inventory.includes(rewardId)) userData.inventory.push(rewardId);
    else userData.coins += Math.floor(prices[tier] * 0.4);
    updateUI();
}

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
    players = [{ x: 40, y: mid, w: pW, h: pH, color: pCol === 'RAINBOW' ? '#fff' : pCol, lives: 5, up: "w", down: "s", team: "V", ai: false }];
    if(currentMode === 2) players.push({ x: 120, y: mid, w: pW, h: pH, color: pCol === 'RAINBOW' ? '#fff' : pCol, lives: 5, up: "t", down: "g", team: "V", ai: false });
    players.push({ x: canvas.width - 55, y: mid, w: pW, h: pH, color: "#ff0000", lives: 5, up: "arrowup", down: "arrowdown", team: "R", ai: isCPU });
    if(currentMode === 2) players.push({ x: canvas.width - 135, y: mid, w: pW, h: pH, color: "#ff0000", lives: 5, up: "i", down: "k", team: "R", ai: isCPU });
}

function resetBall(dir) {
    players.forEach(p => p.h = canvas.height * 0.18);
    ball = { x: canvas.width/2, y: canvas.height/2, r: 10, dx: dir*(canvas.width*0.007), dy: (Math.random()-0.5)*8 };
}

function update() {
    players.forEach(p => {
        if (p.ai) p.y += (ball.y - (p.y + p.h/2)) * cpuDifficulty;
        else {
            if (keys[p.up] && p.y > 0) p.y -= 9;
            if (keys[p.down] && p.y < canvas.height - p.h) p.y += 9;
        }
    });
    if(userData.equipped.paddle === 'p_rainbow') {
        players.filter(p => p.team === 'V').forEach(p => p.color = `hsl(${Date.now()%360}, 100%, 50%)`);
    }
    ball.x += ball.dx; ball.y += ball.dy;
    if (ball.y <= 0 || ball.y >= canvas.height) ball.dy *= -1;
    players.forEach(p => {
        if (ball.x + ball.r > p.x && ball.x - ball.r < p.x + p.w && ball.y + ball.r > p.y && ball.y - ball.r < p.y + p.h) {
            ball.dx *= -1.05;
        }
    });
    if (ball.x < 0) score("R"); if (ball.x > canvas.width) score("V");
}

function render() {
    ctx.fillStyle = allItems[userData.equipped.bg].color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(0,0,canvas.width,canvas.height);
    players.forEach(p => { ctx.fillStyle = p.color; ctx.shadowBlur = 15; ctx.shadowColor = p.color; ctx.fillRect(p.x, p.y, p.w, p.h); });
    ctx.fillStyle = allItems[userData.equipped.ball].color;
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
}

function score(t) {
    players.filter(p => p.team !== t).forEach(p => p.lives--);
    if (players.some(p => p.lives <= 0)) {
        gameActive = false; userData.coins += 50; updateUI();
        document.getElementById("top-bar").style.display = "flex";
        showUI('game-over');
        document.getElementById("winner-text").innerText = t === "V" ? "¡VICTORIA!" : "DERROTA";
    } else resetBall(t === "V" ? -1 : 1);
}

function loop() { if(gameActive){ update(); render(); requestAnimationFrame(loop); } }
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
updateUI();

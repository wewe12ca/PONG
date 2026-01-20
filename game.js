const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");
const modDisplay = document.getElementById("mod-display");

let ball, players = [], gameActive = false;
let currentMode, isCPU, cpuDifficulty, isCaos;
const keys = {};

const allItems = {
    'p_base': { name: 'Verde', color: '#00ff00', rarity: 'Común', type: 'paddle' },
    'p_blue': { name: 'Azul', color: '#0000ff', rarity: 'Común', type: 'paddle' },
    'p_cyan': { name: 'Cian', color: '#00fbff', rarity: 'Raro', type: 'paddle' },
    'p_pink': { name: 'Rosa', color: '#ff00ff', rarity: 'Raro', type: 'paddle' },
    'p_gold': { name: 'Oro Puro', color: '#ffd700', rarity: 'Épico', type: 'paddle' },
    'p_lava': { name: 'Lava', color: '#ff4500', rarity: 'Legendario', type: 'paddle' },
    'p_rainbow': { name: 'Arcoíris', color: 'RAINBOW', rarity: 'Legendario', type: 'paddle' },
    'b_base': { name: 'Blanca', color: '#ffffff', rarity: 'Común', type: 'ball' },
    'b_fire': { name: 'Fuego', color: '#ff6600', rarity: 'Épico', type: 'ball' }
};

const promoCodes = {
    'PONG2026': { type: 'coins', value: 500, label: '500 PC de Bienvenida' },
    'SKINGOLD': { type: 'item', value: 'p_gold', label: 'Pala de Oro' }
};

let userData = {
    coins: 200, username: "Jugador",
    equipped: { paddle: 'p_base', ball: 'b_base' },
    inventory: ['p_base', 'b_base'],
    usedCodes: []
};

function updateUI() {
    document.getElementById("display-coins").innerText = userData.coins;
    document.getElementById("display-username").innerText = userData.username;
    document.getElementById("save-code-output").value = btoa(JSON.stringify(userData));
}

function redeemPromo() {
    const input = document.getElementById("promo-input");
    const code = input.value.toUpperCase().trim();
    if (!promoCodes[code]) return alert("Código inválido.");
    if (userData.usedCodes.includes(code)) return alert("Ya canjeado.");

    const reward = promoCodes[code];
    if (reward.type === 'coins') userData.coins += reward.value;
    if (reward.type === 'item') userData.inventory.push(reward.value);
    
    userData.usedCodes.push(code);
    alert("🎉 Canjeado: " + reward.label);
    input.value = ""; updateUI();
}

function openBox(tier) {
    const prices = { 'common': 100, 'epic': 500, 'god': 1500 };
    if (userData.coins < prices[tier]) return alert("PC insuficientes");
    userData.coins -= prices[tier];
    const ids = Object.keys(allItems);
    let rewardId = ids[Math.floor(Math.random() * ids.length)];
    
    if (tier === 'god') {
        const gods = ids.filter(id => allItems[id].rarity === 'Legendario' || allItems[id].rarity === 'Épico');
        rewardId = gods[Math.floor(Math.random() * gods.length)];
    }

    if (!userData.inventory.includes(rewardId)) userData.inventory.push(rewardId);
    else userData.coins += Math.floor(prices[tier] * 0.5);
    updateUI();
}

function loadFromCode() {
    try {
        userData = JSON.parse(atob(document.getElementById("load-code-input").value));
        updateUI(); alert("Datos de PONG 2D cargados.");
    } catch(e) { alert("Llave inválida."); }
}

function saveUsername() {
    userData.username = document.getElementById("username-input").value || "Jugador";
    updateUI();
}

function equip(id) {
    userData.equipped[allItems[id].type] = id;
    updateUI(); populateInventory();
}

function populateInventory() {
    const list = document.getElementById("inventory-list");
    list.innerHTML = "";
    userData.inventory.forEach(id => {
        const item = allItems[id];
        const isEq = userData.equipped[item.type] === id;
        list.innerHTML += `<div class="item" style="border-color:${isEq?'#0f0':'#333'}">
            <small>${item.rarity}</small><br><b>${item.name}</b><br>
            <button onclick="equip('${id}')">${isEq ? '✓ EQUIPADO' : 'EQUIPAR'}</button>
        </div>`;
    });
}

function startGame(mode, cpu, diff, caos) {
    currentMode = mode; isCPU = cpu; cpuDifficulty = diff; isCaos = caos;
    gameActive = true; document.getElementById("top-bar").style.display = "none";
    showUI('none'); canvas.width = window.innerWidth; canvas.height = window.innerHeight;
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
        document.getElementById("game-over").style.display = "flex";
        document.getElementById("winner-text").innerText = t === "V" ? "¡VICTORIA!" : "DERROTA";
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
    ['main-menu', 'shop-menu', 'inventory-menu', 'profile-menu', 'game-over'].forEach(id => document.getElementById(id).style.display = "none");
    if (menu === 'inventory') populateInventory();
    if(menu !== 'none') document.getElementById(menu + "-menu").style.display = "flex";
}

window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
updateUI();

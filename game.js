const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");
const modDisplay = document.getElementById("mod-display");

let ball, players = [], gameActive = false;
let currentMode, isCPU, cpuDifficulty, isCaos;
const keys = {};

// --- BASE DE DATOS DE COSMÉTICOS (Actualizada) ---
const allItems = {
    'p_base': { name: 'Verde', color: '#00ff00', rarity: 'Común', type: 'paddle' },
    'p_gold': { name: 'Oro', color: '#ffd700', rarity: 'Épico', type: 'paddle' },
    'p_rainbow': { name: 'Gamer', color: 'RAINBOW', rarity: 'Legendario', type: 'paddle' },
    
    'b_base': { name: 'Blanca', color: '#ffffff', rarity: 'Común', type: 'ball', speedMult: 1.0 },
    'b_fire': { name: 'Fuego', color: '#ff6600', rarity: 'Épico', type: 'ball', speedMult: 1.0 },
    'b_ice': { name: 'Hielo', color: '#00ffff', rarity: 'Legendario', type: 'ball', speedMult: 1.3 }, // <-- ¡BOLA DE HIELO!
    
    'bg_black': { name: 'Oscuro', color: '#050505', type: 'bg' },
    'bg_purple': { name: 'Space', color: '#100020', type: 'bg' }
};

let userData = JSON.parse(localStorage.getItem('pong_v2026')) || {
    coins: 250, username: "Jugador",
    equipped: { paddle: 'p_base', ball: 'b_base', bg: 'bg_black' },
    inventory: ['p_base', 'b_base', 'bg_black']
};

// --- FUNCIONES GLOBALES PARA BOTONES (Evita que se pillen) ---
window.updateUI = function() {
    document.getElementById("display-coins").innerText = userData.coins;
    document.getElementById("display-username").innerText = userData.username;
    document.getElementById("save-code-output").value = btoa(JSON.stringify(userData));
    localStorage.setItem('pong_v2026', JSON.stringify(userData));
}
window.enterGame = function() {
    document.getElementById("title-screen").style.display = "none";
    document.getElementById("top-bar").style.display = "flex";
    showUI('main');
}
window.showUI = function(menu) {
    const screens = ['main-menu', 'shop-menu', 'inventory-menu', 'profile-menu', 'game-over', 'caos-select'];
    screens.forEach(s => { if(document.getElementById(s + "-menu")) document.getElementById(s + "-menu").style.display = "none"; });
    if (menu === 'inventory') populateInventory('paddle');
    if (menu !== 'none') document.getElementById(menu + "-menu").style.display = "flex";
}
window.populateInventory = function(type) {
    const list = document.getElementById("inventory-list");
    list.innerHTML = "";
    userData.inventory.filter(id => allItems[id].type === type).forEach(id => {
        const item = allItems[id];
        const isEq = userData.equipped[item.type] === id;
        list.innerHTML += `<div class="card ${isEq?'active':''}" onclick="equip('${id}', '${type}')"><div class="preview" style="background:${item.color==='RAINBOW'?'linear-gradient(red,blue)':item.color}"></div><p>${item.name}</p></div>`;
    });
}
window.equip = function(id, type) {
    userData.equipped[type] = id;
    updateUI(); populateInventory(type);
}
window.openBox = function(tier) {
    const prices = { common: 100, epic: 500, god: 1500 };
    if (userData.coins < prices[tier]) return alert("PC insuficientes");
    userData.coins -= prices[tier];
    const ids = Object.keys(allItems);
    let rewardId = ids[Math.floor(Math.random() * ids.length)];
    if (!userData.inventory.includes(rewardId)) userData.inventory.push(rewardId);
    else userData.coins += Math.floor(prices[tier] * 0.4);
    updateUI();
    alert("¡Objeto recibido! Revisa tu colección.");
}
window.startGame = function(mode, cpu, diff, caos) {
    currentMode = mode; isCPU = cpu; cpuDifficulty = diff; isCaos = caos;
    gameActive = true;
    document.getElementById("top-bar").style.display = "none";
    showUI('none');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    initPlayers(); resetBall(1); 
    requestAnimationFrame(loop); // <-- Usamos requestAnimationFrame para el loop principal
}

// --- LÓGICA DEL JUEGO ---
function initPlayers() {
    const pW = 15, pH = canvas.height * 0.18, mid = canvas.height/2 - pH/2;
    let pCol = allItems[userData.equipped.paddle].color;
    players = [];
    players.push({ x: 40, y: mid, w: pW, h: pH, color: pCol==='RAINBOW'?'#fff':pCol, lives: 5, team: "V", up: "w", down: "s", ai: false });
    if(currentMode === 2) players.push({ x: 120, y: mid, w: pW, h: pH, color: pCol==='RAINBOW'?'#fff':pCol, lives: 5, team: "V", up: "t", down: "g", ai: false });
    if (isCPU) players.push({ x: canvas.width-55, y: mid, w: pW, h: pH, color: "#ff2244", lives: 5, team: "R", ai: true });
    else {
        if (currentMode === 1) players.push({ x: canvas.width-55, y: mid, w: pW, h: pH, color: "#ff2244", lives: 5, team: "R", up: "arrowup", down: "arrowdown", ai: false });
        else { players.push({ x: canvas.width-55, y: mid, w: pW, h: pH, color: "#ff2244", lives: 5, team: "R", up: "i", down: "k", ai: false }); players.push({ x: canvas.width-135, y: mid, w: pW, h: pH, color: "#ff2244", lives: 5, team: "R", up: "arrowup", down: "arrowdown", ai: false }); }
    }
}

function resetBall(dir) {
    players.forEach(p => p.h = canvas.height * 0.18);
    // Multiplicador de velocidad de la bola equipada
    const equippedBall = allItems[userData.equipped.ball];
    const speed = (canvas.width * 0.007) * (equippedBall.speedMult || 1.0);
    
    ball = { x: canvas.width/2, y: canvas.height/2, r: 10, dx: dir * speed, dy: (Math.random()-0.5)*10 };
    if(isCaos) { 
        ball.dx *= 1.6;
        modDisplay.innerText = "¡MODO CAOS ACTIVO!"; 
        setTimeout(() => modDisplay.innerText = "", 1500); 
    }
}

function update() {
    if (!gameActive) return;
    
    players.forEach(p => {
        if (p.ai) { p.y += (ball.y - (p.y + p.h/2)) * cpuDifficulty; } 
        else {
            if (keys[p.up]) p.y -= 10;
            if (keys[p.down]) p.y += 10;
        }
        if (p.y < 0) p.y = 0;
        if (p.y > canvas.height - p.h) p.y = canvas.height - p.h;
    });

    ball.x += ball.dx; ball.y += ball.dy;
    if (ball.y <= 0 || ball.y >= canvas.height) ball.dy *= -1;

    players.forEach(p => {
        if (ball.x + ball.r > p.x && ball.x - ball.r < p.x + p.w && ball.y + ball.r > p.y && ball.y - ball.r < p.y + p.h) {
            ball.dx *= -1.05;
            ball.x = (ball.dx > 0) ? p.x + p.w + 5 : p.x - ball.r - 5;
            ball.dy += (Math.random()-0.5)*5;
        }
    });

    if (ball.x < 0) score("R"); if (ball.x > canvas.width) score("V");
}

function render() {
    ctx.fillStyle = allItems[userData.equipped.bg].color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.shadowBlur = 15;
    players.forEach(p => { 
        ctx.fillStyle = p.color; 
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x, p.y, p.w, p.h); 
    });
    
    ctx.fillStyle = allItems[userData.equipped.ball].color;
    ctx.shadowColor = "#fff";
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
}

function score(t) {
    players.filter(p => p.team !== t).forEach(p => p.lives--);
    if (players.some(p => p.lives <= 0)) {
        gameActive = false; userData.coins += 50; updateUI();
        document.getElementById("top-bar").style.display = "flex";
        showUI('game-over');
        document.getElementById("winner-text").innerText = t === "V" ? "GANÓ EQUIPO VERDE" : "GANÓ EQUIPO ROJO";
    } else resetBall(t === "V" ? -1 : 1);
}

function loop() {
    if (!gameActive) return;
    update();
    render();
    requestAnimationFrame(loop);
}
// Fin de funciones del juego
window.saveUsername = function() { /* ... */ const val = document.getElementById("username-input").value; if(val){userData.username=val;updateUI();alert("Nombre guardado.");}};
window.loadFromCode = function() { /* ... */ try{userData=JSON.parse(atob(document.getElementById("load-code-input").value));updateUI();alert("Sesión Cargada.");}catch(e){alert("Error.");}};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
updateUI();

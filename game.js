const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");
const modDisplay = document.getElementById("mod-display");

let ball, players = [], gameActive = false;
let currentMode, isCPU, cpuDifficulty, isCaos;
const keys = {};

const allItems = {
    'p_base': { name: 'Verde', color: '#00ff00', type: 'paddle' },
    'p_gold': { name: 'Oro', color: '#ffd700', type: 'paddle' },
    'p_rainbow': { name: 'Gamer', color: 'RAINBOW', type: 'paddle' },
    'b_base': { name: 'Blanca', color: '#ffffff', type: 'ball', speedMult: 1.0 },
    'b_fire': { name: 'Fuego', color: '#ff6600', type: 'ball', speedMult: 1.2 },
    'b_ice': { name: 'Hielo', color: '#00ffff', type: 'ball', speedMult: 1.5 },
    'bg_black': { name: 'Oscuro', color: '#050505', type: 'bg' },
    'bg_purple': { name: 'Space', color: '#100020', type: 'bg' }
};

let userData = JSON.parse(localStorage.getItem('pong_v2026')) || {
    coins: 250, username: "Jugador",
    equipped: { paddle: 'p_base', ball: 'b_base', bg: 'bg_black' },
    inventory: ['p_base', 'b_base', 'bg_black']
};

window.updateUI = function() {
    document.getElementById("display-coins").innerText = userData.coins;
    document.getElementById("display-username").innerText = userData.username;
    localStorage.setItem('pong_v2026', JSON.stringify(userData));
};

window.showUI = function(menuId) {
    // Cerramos todos los menús posibles
    const screens = ['title-screen', 'main-menu', 'caos-select-menu', 'inventory-menu', 'shop-menu', 'profile-menu', 'game-over'];
    screens.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = "none"; });
    
    // Abrimos el solicitado
    if (menuId === 'none') return;
    let target = menuId.includes('-menu') ? menuId : menuId + '-menu';
    if (menuId === 'main') target = 'main-menu';
    if (menuId === 'caos-select') target = 'caos-select-menu';
    
    const el = document.getElementById(target);
    if(el) el.style.display = "flex";
};

window.enterGame = function() {
    document.getElementById("title-screen").style.display = "none";
    document.getElementById("top-bar").style.display = "flex";
    showUI('main');
};

window.openBox = function(tier) {
    const prices = { common: 100, epic: 500, god: 1500 };
    if (userData.coins < prices[tier]) return alert("Necesitas más PC");
    
    userData.coins -= prices[tier];
    const ids = Object.keys(allItems);
    const rewardId = ids[Math.floor(Math.random() * ids.length)];
    
    if (!userData.inventory.includes(rewardId)) {
        userData.inventory.push(rewardId);
        alert("¡NUEVO! Has obtenido: " + allItems[rewardId].name);
    } else {
        const refund = Math.floor(prices[tier] * 0.5);
        userData.coins += refund;
        alert("Repetido: " + allItems[rewardId].name + ". Se te devuelven " + refund + " PC");
    }
    updateUI();
};

window.populateInventory = function(type) {
    const list = document.getElementById("inventory-list");
    list.innerHTML = "";
    userData.inventory.filter(id => allItems[id].type === type).forEach(id => {
        const item = allItems[id];
        const isEq = userData.equipped[type] === id;
        list.innerHTML += `<div class="card ${isEq?'active':''}" onclick="equip('${id}', '${type}')">
            <div class="preview" style="background:${item.color==='RAINBOW'?'linear-gradient(to right,red,orange,yellow,green,blue,indigo,violet)':item.color}"></div>
            <p>${item.name}</p>
        </div>`;
    });
};

window.equip = function(id, type) {
    userData.equipped[type] = id;
    updateUI(); populateInventory(type);
};

window.startGame = function(mode, cpu, diff, caos) {
    currentMode = mode; isCPU = cpu; cpuDifficulty = diff; isCaos = caos;
    gameActive = true;
    showUI('none');
    document.getElementById("top-bar").style.display = "none";
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    initPlayers(); resetBall(1);
    loop();
};

function initPlayers() {
    const pH = canvas.height * 0.2, mid = canvas.height/2 - pH/2;
    const pCol = allItems[userData.equipped.paddle].color === 'RAINBOW' ? '#fff' : allItems[userData.equipped.paddle].color;
    players = [
        { x: 30, y: mid, w: 20, h: pH, color: pCol, lives: 5, team: "V", up: "w", down: "s", ai: false },
        { x: canvas.width - 50, y: mid, w: 20, h: pH, color: "#ff2244", lives: 5, team: "R", up: "arrowup", down: "arrowdown", ai: isCPU }
    ];
}

function resetBall(dir) {
    const speed = (canvas.width * 0.008) * (allItems[userData.equipped.ball].speedMult || 1);
    ball = { x: canvas.width/2, y: canvas.height/2, r: 12, dx: dir * speed, dy: (Math.random()-0.5)*10 };
}

function loop() {
    if (!gameActive) return;
    // Update
    players.forEach(p => {
        if (p.ai) p.y += (ball.y - (p.y + p.h/2)) * cpuDifficulty;
        else {
            if (keys[p.up]) p.y -= 12;
            if (keys[p.down]) p.y += 12;
        }
        p.y = Math.max(0, Math.min(canvas.height - p.h, p.y));
    });

    ball.x += ball.dx; ball.y += ball.dy;
    if (ball.y <= 0 || ball.y >= canvas.height) ball.dy *= -1;

    players.forEach(p => {
        if (ball.x + ball.r > p.x && ball.x - ball.r < p.x + p.w && ball.y + ball.r > p.y && ball.y - ball.r < p.y + p.h) {
            ball.dx *= -1.1;
            ball.x = ball.dx > 0 ? p.x + p.w + 2 : p.x - ball.r - 2;
        }
    });

    if (ball.x < 0) score("R");
    if (ball.x > canvas.width) score("V");

    // Render
    ctx.fillStyle = allItems[userData.equipped.bg].color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    players.forEach(p => { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.w, p.h); });
    ctx.fillStyle = allItems[userData.equipped.ball].color === 'RAINBOW' ? '#fff' : allItems[userData.equipped.ball].color;
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
    
    // Dibujar Vidas en Canvas
    ctx.fillStyle = "white"; ctx.font = "bold 30px Arial";
    ctx.fillText("VIDAS: " + players[0].lives, 50, 50);
    ctx.fillText("VIDAS: " + players[1].lives, canvas.width - 200, 50);

    requestAnimationFrame(loop);
}

function score(winnerTeam) {
    if(winnerTeam === "V") players[1].lives--;
    else players[0].lives--;

    if (players[0].lives <= 0 || players[1].lives <= 0) {
        gameActive = false;
        userData.coins += 100;
        updateUI();
        document.getElementById("winner-text").innerText = players[0].lives <= 0 ? "GANÓ EL ROJO" : "GANÓ EL VERDE";
        showUI('game-over');
    } else {
        resetBall(winnerTeam === "V" ? -1 : 1);
    }
}

window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
updateUI();

const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");
const modDisplay = document.getElementById("mod-display");

let ball, players = [], gameActive = false;
let currentMode, isCPU, cpuDifficulty, isCaos;
const keys = {};

const allItems = {
    'p_base': { name: 'Verde', color: '#00ff00', type: 'paddle' },
    'p_gold': { name: 'Oro', color: '#ffd700', type: 'paddle' },
    'b_base': { name: 'Blanca', color: '#ffffff', type: 'ball' },
    'bg_black': { name: 'Espacio', color: '#050505', type: 'bg' }
};

let userData = JSON.parse(localStorage.getItem('pong_v2026')) || {
    coins: 100, username: "Jugador",
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
    ['main-menu', 'shop-menu', 'inventory-menu', 'profile-menu', 'game-over', 'caos-select'].forEach(s => {
        if(document.getElementById(s + "-menu")) document.getElementById(s + "-menu").style.display = "none";
    });
    if (menu === 'inventory') populateInventory('paddle');
    if (menu !== 'none') document.getElementById(menu + "-menu").style.display = "flex";
}

function startGame(mode, cpu, diff, caos) {
    currentMode = mode; isCPU = cpu; cpuDifficulty = diff; isCaos = caos;
    gameActive = true;
    document.getElementById("top-bar").style.display = "none";
    showUI('none');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    initPlayers(); resetBall(1); 
    loop();
}

function initPlayers() {
    const pW = 15, pH = canvas.height * 0.18, mid = canvas.height/2 - pH/2;
    let pCol = allItems[userData.equipped.paddle].color;
    players = [];

    // EQUIPO VERDE (Izquierda)
    players.push({ x: 40, y: mid, w: pW, h: pH, color: pCol, lives: 5, team: "V", up: "w", down: "s", ai: false });
    if(currentMode === 2) {
        players.push({ x: 120, y: mid, w: pW, h: pH, color: pCol, lives: 5, team: "V", up: "t", down: "g", ai: false });
    }

    // EQUIPO ROJO (Derecha)
    if (isCPU) {
        players.push({ x: canvas.width-55, y: mid, w: pW, h: pH, color: "#ff2244", lives: 5, team: "R", ai: true });
    } else {
        // Controles R1: I / K (En 2v2) o Flechas (En 1v1) según lógica común, pero aquí asignamos fijo lo pedido:
        if (currentMode === 1) {
            players.push({ x: canvas.width-55, y: mid, w: pW, h: pH, color: "#ff2244", lives: 5, team: "R", up: "arrowup", down: "arrowdown", ai: false });
        } else {
            players.push({ x: canvas.width-55, y: mid, w: pW, h: pH, color: "#ff2244", lives: 5, team: "R", up: "i", down: "k", ai: false });
            players.push({ x: canvas.width-135, y: mid, w: pW, h: pH, color: "#ff2244", lives: 5, team: "R", up: "arrowup", down: "arrowdown", ai: false });
        }
    }
}

function resetBall(dir) {
    players.forEach(p => p.h = canvas.height * 0.18);
    ball = { x: canvas.width/2, y: canvas.height/2, r: 10, dx: dir*(canvas.width*0.007), dy: (Math.random()-0.5)*10 };
    if(isCaos) {
        ball.dx *= 1.6;
        modDisplay.innerText = "¡MODO CAOS ACTIVO!";
        setTimeout(() => modDisplay.innerText = "", 1500);
    }
}

function update() {
    if (!gameActive) return;
    
    players.forEach(p => {
        if (p.ai) {
            p.y += (ball.y - (p.y + p.h/2)) * cpuDifficulty;
        } else {
            if (keys[p.up]) p.y -= 10;
            if (keys[p.down]) p.y += 10;
        }
        // Límites pala
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
    players.forEach(p => { 
        ctx.fillStyle = p.color; 
        ctx.fillRect(p.x, p.y, p.w, p.h); 
    });
    ctx.fillStyle = allItems[userData.equipped.ball].color;
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
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

window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
updateUI();

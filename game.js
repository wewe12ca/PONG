const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");
let ball, players = [], gameActive = false, isPaused = false;
let lastConfig = { mode: 1, cpu: false, diff: 0, caos: false };
const keys = {};

const allItems = {
    'p_base': { name: 'Verde', color: '#00ff00', type: 'paddle' },
    'p_rainbow': { name: 'Gamer', color: '#00ffff', type: 'paddle' },
    'b_base': { name: 'Blanca', color: '#ffffff', type: 'ball', speedMult: 1.0 },
    'b_fire': { name: 'Fuego', color: '#ff6600', type: 'ball', speedMult: 1.5 },
    'b_ice': { name: 'Hielo', color: '#00ffff', type: 'ball', speedMult: 2.0 },
    'bg_black': { name: 'Oscuro', color: '#050505', type: 'bg' }
};

let userData = JSON.parse(localStorage.getItem('pong_2026')) || {
    coins: 250, username: "Piloto",
    equipped: { paddle: 'p_base', ball: 'b_base', bg: 'bg_black' },
    inventory: ['p_base', 'b_base', 'bg_black']
};

window.updateUI = function() {
    document.getElementById("display-coins").innerText = userData.coins;
    document.getElementById("save-code-output").value = btoa(JSON.stringify(userData));
    localStorage.setItem('pong_2026', JSON.stringify(userData));
};

window.showUI = function(menu) {
    const ids = ['title-screen', 'main-menu', 'caos-select-menu', 'inventory-menu', 'shop-menu', 'profile-menu', 'game-over', 'pause-menu'];
    ids.forEach(id => document.getElementById(id).style.display = "none");
    if(menu !== 'none') document.getElementById(menu === 'main' ? 'main-menu' : menu + '-menu').style.display = "flex";
};

window.enterGame = function() {
    document.getElementById("title-screen").style.display = "none";
    document.getElementById("top-bar").style.display = "flex";
    showUI('main');
};

window.openBox = function(tier) {
    const prices = { common: 100, epic: 500, god: 1500 };
    if (userData.coins < prices[tier]) return alert("Sin PC");
    userData.coins -= prices[tier];
    
    let pool = Object.keys(allItems);
    if (tier === 'common') pool = pool.filter(id => !['b_fire', 'b_ice'].includes(id));
    if (tier === 'epic') pool = pool.filter(id => id !== 'b_ice');

    const reward = pool[Math.floor(Math.random() * pool.length)];
    if (!userData.inventory.includes(reward)) userData.inventory.push(reward);
    updateUI(); alert("¡Obtenido: " + allItems[reward].name + "!");
};

window.startGame = function(mode, cpu, diff, caos) {
    lastConfig = { mode, cpu, diff, caos };
    gameActive = true; isPaused = false;
    showUI('none');
    document.getElementById("top-bar").style.display = "none";
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const pH = canvas.height * 0.2;
    players = [
        { x: 30, y: canvas.height/2 - pH/2, w: 20, h: pH, color: allItems[userData.equipped.paddle].color, lives: 5, up: "w", down: "s", ai: false },
        { x: canvas.width - 50, y: canvas.height/2 - pH/2, w: 20, h: pH, color: "#ff2244", lives: 5, up: "arrowup", down: "arrowdown", ai: cpu }
    ];
    resetBall(1);
    loop();
};

window.restartGame = function() { startGame(lastConfig.mode, lastConfig.cpu, lastConfig.diff, lastConfig.caos); };

function resetBall(dir) {
    const speed = (canvas.width * 0.008) * allItems[userData.equipped.ball].speedMult * (lastConfig.caos ? 1.5 : 1);
    ball = { x: canvas.width/2, y: canvas.height/2, r: 12, dx: dir * speed, dy: 5 };
}

function loop() {
    if (!gameActive || isPaused) return;
    update(); render();
    requestAnimationFrame(loop);
}

function update() {
    players.forEach(p => {
        if (p.ai) p.y += (ball.y - (p.y + p.h/2)) * lastConfig.diff;
        else { if (keys[p.up]) p.y -= 12; if (keys[p.down]) p.y += 12; }
        p.y = Math.max(0, Math.min(canvas.height - p.h, p.y));
    });
    ball.x += ball.dx; ball.y += ball.dy;
    if (ball.y <= 0 || ball.y >= canvas.height) ball.dy *= -1;
    players.forEach(p => {
        if (ball.x + ball.r > p.x && ball.x - ball.r < p.x + p.w && ball.y + ball.r > p.y && ball.y - ball.r < p.y + p.h) {
            ball.dx *= -1.05; ball.x = ball.dx > 0 ? p.x + p.w + 5 : p.x - ball.r - 5;
        }
    });
    if (ball.x < 0) finishRound(1); if (ball.x > canvas.width) finishRound(0);
}

function render() {
    ctx.fillStyle = allItems[userData.equipped.bg].color;
    ctx.fillRect(0,0,canvas.width, canvas.height);
    players.forEach(p => { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.w, p.h); });
    ctx.fillStyle = allItems[userData.equipped.ball].color;
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "white"; ctx.fillText("VIDAS: " + players[0].lives, 50, 50);
    ctx.fillText("VIDAS: " + players[1].lives, canvas.width - 150, 50);
}

function finishRound(pIdx) {
    players[pIdx].lives--;
    if (players[pIdx].lives <= 0) {
        gameActive = false; userData.coins += 100; updateUI();
        document.getElementById("winner-text").innerText = pIdx === 1 ? "¡GANASTE!" : "PERDISTE";
        showUI('game-over');
    } else resetBall(pIdx === 0 ? 1 : -1);
}

window.addEventListener("keydown", e => { 
    keys[e.key.toLowerCase()] = true;
    if(e.key === "Escape" && gameActive) { isPaused = !isPaused; document.getElementById("pause-menu").style.display = isPaused ? "flex" : "none"; if(!isPaused) loop(); }
});
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
window.resumeGame = function() { isPaused = false; document.getElementById("pause-menu").style.display = "none"; loop(); };
window.loadFromCode = function() { try { userData = JSON.parse(atob(document.getElementById("load-code-input").value)); updateUI(); alert("Cargado"); } catch(e) { alert("Error"); } };
updateUI();

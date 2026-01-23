const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');
canvas.width = 800; canvas.height = 400;

let ball, paddles, lives, score, gameRunning = false, mode = "";
let keys = {};

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
window.addEventListener('keydown', e => { if(e.key.includes('Arrow')) keys[e.key] = true; });
window.addEventListener('keyup', e => { if(e.key.includes('Arrow')) keys[e.key] = false; });

function startGame(m) {
    mode = m; showUI('none');
    // Oculta la interfaz para una pantalla de juego limpia
    document.getElementById('ui-layer').style.display = 'none';
    document.getElementById('top-bar').style.display = 'none';
    
    lives = 5; score = 0;

    if (mode === '2v2') {
        // 2vs2: 4 jugadores manuales con controles específicos
        paddles = [
            { x: 10, y: 150, w: 15, h: 100, up: 'w', down: 's' },
            { x: 50, y: 150, w: 15, h: 100, up: 't', down: 'g' },
            { x: 735, y: 150, w: 15, h: 100, up: 'i', down: 'k' },
            { x: 775, y: 150, w: 15, h: 100, up: 'ArrowUp', down: 'ArrowDown' }
        ];
    } else {
        // Modos 1vs1 y VS CPU: Jugador 1 (W/S) y Jugador 2 (Flechas) o CPU
        paddles = [
            { x: 10, y: 150, w: 15, h: 90, up: 'w', down: 's' },
            { x: 775, y: 150, w: 15, h: 90, up: 'ArrowUp', down: 'ArrowDown', id: (mode.includes('cpu') ? 'cpu' : 'p2') }
        ];
    }
    ball = { x: 400, y: 200, r: 8, dx: 5, dy: 5 };
    gameRunning = true; loop();
}

function update() {
    let iaLevel = (mode === 'facil') ? 0.05 : (mode === 'dificil') ? 0.15 : 0.09;

    paddles.forEach(p => {
        if (p.up && keys[p.up]) p.y -= 7;
        if (p.down && keys[p.down]) p.y += 7;
        if (p.id === 'cpu') p.y += (ball.y - (p.y + p.h/2)) * iaLevel;

        if (p.y < 0) p.y = 0; if (p.y > canvas.height - p.h) p.y = canvas.height - p.h;
        if (ball.x < p.x + p.w && ball.x + ball.r > p.x && ball.y < p.y + p.h && ball.y + ball.r > p.y) {
            ball.dx *= -1.05; ball.x = p.x > 400 ? p.x - ball.r : p.x + p.w + ball.r;
        }
    });

    if (mode === 'caos') ball.dy += Math.sin(Date.now()/150) * 0.8;
    ball.x += ball.dx; ball.y += ball.dy;
    if (ball.y < 0 || ball.y > canvas.height) ball.dy *= -1;

    if (ball.x < 0) { lives--; if (lives <= 0) stopGame("DERECHA"); else resetBall(); }
    if (ball.x > canvas.width) { score++; App.coins += 25; App.updateUI(); App.save(); resetBall(); }
}

function draw() {
    // Fondo Custom
    ctx.fillStyle = "black"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (App.equipped.bg === "grid") {
        ctx.strokeStyle = "#1a1a1a";
        for(let i=0; i<800; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,400); ctx.stroke(); }
    }

    // Palas Custom (Redondeadas)
    ctx.fillStyle = App.equipped.paddle || "#00f2ff";
    paddles.forEach(p => {
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 5);
        ctx.fill();
    });

    // Bola Custom
    ctx.fillStyle = App.equipped.ball || "#ffffff";
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
}

function resetBall() { ball.x = 400; ball.y = 200; ball.dx *= -1; }
function stopGame(w) {
    gameRunning = false;
    document.getElementById('ui-layer').style.display = 'flex';
    document.getElementById('top-bar').style.display = 'flex';
    document.getElementById('game-over-content').innerHTML = `<h1>GANÓ ${w}</h1><button onclick="location.reload()">MENÚ</button>`;
    App.save(); showUI('game-over');
}
function loop() { if (gameRunning) { update(); draw(); requestAnimationFrame(loop); } }

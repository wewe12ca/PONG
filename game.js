const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');
canvas.width = 800; canvas.height = 400;

let ball, paddles, lives, score, gameRunning = false, mode = "";

function startGame(m) {
    mode = m;
    showUI('none');
    document.getElementById('ui-layer').style.display = 'none';
    lives = 3; score = 0;
    
    paddles = [{ x: 10, y: 150, w: 15, h: 80, isPlayer: true }];
    paddles.push({ x: 775, y: 150, w: 15, h: 80, isPlayer: false });

    if (mode.includes('2v2')) {
        paddles.push({ x: 50, y: 150, w: 15, h: 60, isPlayer: false, isAlly: true });
        paddles.push({ x: 735, y: 150, w: 15, h: 60, isPlayer: false });
    }

    ball = { x: 400, y: 200, r: 8, dx: 5, dy: 5 };
    gameRunning = true;

    canvas.onmousemove = (e) => {
        let rect = canvas.getBoundingClientRect();
        paddles[0].y = (e.clientY - rect.top) * (canvas.height/rect.height) - paddles[0].h/2;
    };
    loop();
}

function loop() {
    if (!gameRunning) return;
    if (mode.includes('caos')) ball.dy += Math.sin(Date.now()/200) * 0.5;

    ball.x += ball.dx; ball.y += ball.dy;
    if (ball.y < 0 || ball.y > canvas.height) ball.dy *= -1;

    paddles.forEach(p => {
        if (!p.isPlayer) {
            let speed = p.isAlly ? 0.07 : 0.1;
            p.y += (ball.y - (p.y + p.h/2)) * speed;
        }
        if (ball.x < p.x + p.w && ball.x + ball.r > p.x && ball.y < p.y + p.h && ball.y + ball.r > p.y) {
            ball.dx *= -1.05;
            ball.x = p.x > 400 ? p.x - ball.r : p.x + p.w + ball.r;
        }
    });

    if (ball.x < 0) { lives--; if (lives <= 0) stopGame("CPU"); else resetBall(); }
    if (ball.x > canvas.width) { score++; App.coins += 50; App.updateUI(); App.save(); resetBall(); }

    ctx.fillStyle = "black"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = App.equippedColor;
    paddles.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));
    ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
    ctx.fillText(`VIDAS: ${lives} | SCORE: ${score}`, 20, 20);
    requestAnimationFrame(loop);
}

function resetBall() { ball.x = 400; ball.y = 200; ball.dx = 5 * (Math.random() > 0.5 ? 1 : -1); }

function stopGame(winner) {
    gameRunning = false;
    document.getElementById('ui-layer').style.display = 'flex';
    document.getElementById('game-over-content').innerHTML = `
        <h1>GANÓ: ${winner}</h1>
        <p>Puntos: ${score} | Monedas: +${score * 10}</p>
        <button onclick="location.reload()">VOLVER AL MENÚ</button>
    `;
    App.coins += (score * 10); App.save(); App.updateUI();
    showUI('game-over');
}

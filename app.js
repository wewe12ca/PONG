const App = {
    coins: 0,
    username: "",
    powerups: { bigPaddle: false },

    init() {
        // Cargar datos guardados del 2026
        const saved = JSON.parse(localStorage.getItem('pong_data_2026'));
        if (saved) {
            this.coins = saved.coins;
            this.username = saved.username;
            this.updateUI();
            if (this.username) showUI('main-menu');
        }
    },

    save() {
        localStorage.setItem('pong_data_2026', JSON.stringify({
            coins: this.coins,
            username: this.username
        }));
    },

    checkSession() {
        const input = document.getElementById('username-input').value;
        if (input.trim() === "") return alert("Escribe tu nombre");
        this.username = input;
        this.coins = 500; // Monedas iniciales si es nuevo
        this.save();
        this.updateUI();
        showUI('main-menu');
    },

    updateUI() {
        document.getElementById('display-coins').innerText = this.coins;
        document.getElementById('display-username').innerText = this.username || "Invitado";
    },

    openBox(rarity) {
        let cost = (rarity === 'god') ? 1500 : 100;
        if (this.coins >= cost) {
            this.coins -= cost;
            if (rarity === 'god') this.powerups.bigPaddle = true;
            alert("¡Crate abierto con éxito!");
            this.save();
            this.updateUI();
        } else alert("PC Insuficientes");
    }
};

function showUI(id) {
    document.querySelectorAll('.ui-overlay').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
}

window.onload = () => App.init();

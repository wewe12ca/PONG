const App = {
    coins: 500,
    username: "",
    inventory: [],
    equippedColor: "#00f2ff",

    catalog: [
        { id: 1, name: "Neon Cypher", rarity: "comun", color: "#00f2ff", cost: 100 },
        { id: 2, name: "Laser Rose", rarity: "epico", color: "#ff00ff", cost: 500 },
        { id: 3, name: "Emerald Pulse", rarity: "epico", color: "#00ff88", cost: 500 },
        { id: 4, name: "Midas Touch", rarity: "god", color: "#ffd700", cost: 1500 }
    ],

    init() {
        const saved = JSON.parse(localStorage.getItem('pong_v2026_final'));
        if (saved) {
            this.coins = saved.coins;
            this.username = saved.username;
            this.inventory = saved.inventory || [];
            this.updateUI();
            showUI('main-menu');
        }
    },

    checkSession() {
        const name = document.getElementById('username-input').value;
        if (!name) return alert("Escribe tu nombre");
        this.username = name;
        if(this.inventory.length === 0) this.inventory.push(this.catalog[0]);
        this.save();
        this.init();
    },

    save() {
        localStorage.setItem('pong_v2026_final', JSON.stringify({
            coins: this.coins, username: this.username, inventory: this.inventory
        }));
    },

    logout() { localStorage.removeItem('pong_v2026_final'); location.reload(); },

    openBox(type) {
        let cost = type === 'god' ? 1500 : (type === 'epic' ? 500 : 100);
        if (this.coins < cost) return alert("PC Insuficientes");

        this.coins -= cost;
        let pool = this.catalog.filter(i => {
            if(type === 'god') return i.rarity === 'god';
            if(type === 'epic') return i.rarity === 'epico';
            return i.rarity === 'comun';
        });

        let prize = pool[Math.floor(Math.random() * pool.length)];
        if (!this.inventory.find(i => i.id === prize.id)) this.inventory.push(prize);
        
        alert(`¡CRATE ABIERTO!\nObtenido: ${prize.name} (${prize.rarity.toUpperCase()})`);
        this.save(); this.updateUI();
    },

    populateInventory() {
        showUI('inventory-menu');
        const list = document.getElementById('inventory-list');
        list.innerHTML = "";
        this.inventory.forEach(item => {
            let rColor = item.rarity === 'god' ? 'gold' : (item.rarity === 'epico' ? '#ff00ff' : '#00f2ff');
            list.innerHTML += `
                <div class="loot-card" style="border: 2px solid ${rColor}; padding:10px;">
                    <small style="color:${rColor}">${item.rarity.toUpperCase()}</small><br>
                    <strong>${item.name}</strong><br>
                    <button onclick="App.equip('${item.color}')">EQUIPAR</button>
                </div>`;
        });
    },

    equip(color) { this.equippedColor = color; alert("Cosmético equipado."); },

    updateUI() {
        document.getElementById('display-coins').innerText = this.coins;
        document.getElementById('display-username').innerText = this.username;
    }
};

function showUI(id) {
    document.querySelectorAll('.ui-overlay').forEach(el => el.classList.remove('active'));
    if(id !== 'none') document.getElementById(id).classList.add('active');
}

window.onload = () => App.init();

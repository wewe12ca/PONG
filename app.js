const App = {
    coins: 500,
    username: "",
    inventory: [],
    equipped: { paddle: "#00f2ff", ball: "#ffffff", bg: "black", frame: "none" },
    
    catalog: [
        { id: 1, type: "paddle", name: "Neon Blue", rarity: "comun", val: "#00f2ff" },
        { id: 2, type: "paddle", name: "Ruby Laser", rarity: "epico", val: "#ff0055" },
        { id: 3, type: "ball", name: "Fire Ball", rarity: "epico", val: "#ffaa00" },
        { id: 4, type: "bg", name: "Cyber Grid", rarity: "epico", val: "grid" },
        { id: 5, type: "frame", name: "God Aura", rarity: "god", val: "0 0 15px #ffd700" },
        { id: 6, type: "ball", name: "Ghost", rarity: "god", val: "rgba(255,255,255,0.2)" }
    ],

    init() {
        const saved = JSON.parse(localStorage.getItem('pong_2026_pro'));
        if (saved) {
            this.coins = saved.coins; this.username = saved.username;
            this.inventory = saved.inventory || [];
            this.equipped = saved.equipped || this.equipped;
            this.updateUI();
            if(this.username) showUI('main-menu');
        }
    },

    save() {
        localStorage.setItem('pong_2026_pro', JSON.stringify({
            coins: this.coins, username: this.username, 
            inventory: this.inventory, equipped: this.equipped
        }));
    },

    checkSession() {
        const n = document.getElementById('username-input').value;
        if(!n) return alert("Escribe tu nombre");
        this.username = n; this.save(); this.init();
    },

    changeName() {
        const n = document.getElementById('change-name-input').value;
        if(n) { this.username = n; this.save(); this.updateUI(); alert("Nombre cambiado"); }
    },

    redeemCode() {
        const code = prompt("Introduce PromoCode:").toUpperCase();
        const codesDB = { "WINNER": 5000, "MEE": 10000, "GODMODE": 50000, "2026": 2000, "DORADO": 15000 };
        if(codesDB[code]) { this.coins += codesDB[code]; this.save(); this.updateUI(); alert("¡Código aceptado!"); }
        else alert("Código inválido");
    },

    openBox(rarity) {
        let cost = rarity === 'god' ? 1500 : (rarity === 'epic' ? 500 : 100);
        if (this.coins < cost) return alert("PC Insuficientes");
        this.coins -= cost;
        let prize = this.catalog[Math.floor(Math.random()*this.catalog.length)];
        if(!this.inventory.find(i => i.id === prize.id)) this.inventory.push(prize);
        alert(`¡BOTÍN! Has ganado: ${prize.name}`);
        this.save(); this.updateUI();
    },

    populateInventory(type) {
        showUI('inventory-menu');
        const list = document.getElementById('inventory-list');
        list.innerHTML = "";
        const filtered = this.inventory.filter(i => i.type === type);
        filtered.forEach(item => {
            let col = item.rarity === 'god' ? 'gold' : (item.rarity === 'epico' ? '#ff00ff' : '#00f2ff');
            list.innerHTML += `<div class="loot-card" style="border-color:${col}; font-size:12px;">
                ${item.name}<br>
                <button onclick="App.equip('${item.type}', '${item.val}')" style="font-size:9px;">EQUIPAR</button>
            </div>`;
        });
    },

    equip(type, val) { this.equipped[type] = val; this.save(); this.updateUI(); alert("Equipado"); },

    updateUI() {
        document.getElementById('display-coins').innerText = this.coins;
        document.getElementById('display-username').innerText = this.username;
        document.getElementById('user-pill-frame').style.boxShadow = this.equipped.frame === "none" ? "" : this.equipped.frame;
    }
};

function showUI(id) {
    document.querySelectorAll('.ui-overlay').forEach(el => el.classList.remove('active'));
    if(id !== 'none') document.getElementById(id).classList.add('active');
}
window.onload = () => App.init();

const App = {
    coins: 500,
    username: "",
    inventory: [],
    equippedColor: "#00f2ff",
    catalog: [
        { id: 1, name: "Neon Blue", rarity: "comun", color: "#00f2ff" },
        { id: 2, name: "Ruby Laser", rarity: "epico", color: "#ff0055" },
        { id: 3, name: "Jade Mist", rarity: "epico", color: "#00ff88" },
        { id: 4, name: "Golden God", rarity: "god", color: "#ffd700" }
    ],

    init() {
        const saved = JSON.parse(localStorage.getItem('pong_final_2026'));
        if (saved) {
            this.coins = saved.coins;
            this.username = saved.username;
            this.inventory = saved.inventory || [this.catalog[0]];
            this.equippedColor = saved.equippedColor || "#00f2ff";
            this.updateUI();
            if(this.username) showUI('main-menu');
        }
    },

    save() {
        localStorage.setItem('pong_final_2026', JSON.stringify({
            coins: this.coins, username: this.username, 
            inventory: this.inventory, equippedColor: this.equippedColor
        }));
    },

    checkSession() {
        const name = document.getElementById('username-input').value;
        if (!name) return alert("Escribe tu nombre");
        this.username = name;
        this.inventory = [this.catalog[0]];
        this.save(); this.init();
    },

    redeemCode() {
        const code = prompt("Introduce PromoCode (Prueba: 2026):").toUpperCase();
        if (code === "2026") {
            this.coins += 2000; alert("¡Felicidades! +2000 PC");
        } else { alert("Código inválido"); }
        this.save(); this.updateUI();
    },

    openBox(type) {
        let cost = type === 'god' ? 1500 : (type === 'epic' ? 500 : 100);
        if (this.coins < cost) return alert("Dinero insuficiente");
        this.coins -= cost;
        let prize = this.catalog[Math.floor(Math.random()*this.catalog.length)];
        if (!this.inventory.find(i => i.id === prize.id)) this.inventory.push(prize);
        alert(`¡BOX ABIERTA!\nGanaste: ${prize.name}`);
        this.save(); this.updateUI();
    },

    populateInventory() {
        showUI('inventory-menu');
        const list = document.getElementById('inventory-list');
        list.innerHTML = "";
        this.inventory.forEach(item => {
            let col = item.rarity === 'god' ? 'gold' : (item.rarity === 'epico' ? '#ff00ff' : '#00f2ff');
            list.innerHTML += `<div class="loot-card" style="border-color:${col}">
                <small style="color:${col}">${item.rarity.toUpperCase()}</small><br>${item.name}<br>
                <button onclick="App.equip('${item.color}')" style="font-size:10px;">EQUIPAR</button>
            </div>`;
        });
    },

    equip(color) { this.equippedColor = color; this.save(); alert("Equipado"); },

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

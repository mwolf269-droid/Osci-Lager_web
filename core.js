/* core.js - DEMO VERSION für GitHub Pages */
const core = {
    stockData: {},
    storageData: {
        used: 45,
        total: 1024,
        ssid: "Demo-WiFi",
        ip: "192.168.178.50",
        rssi: -55,
        temp: 38.5
    },
    
    r3: n => Math.round(parseFloat(n) * 1000) / 1000,
    r2: n => Math.round(parseFloat(n) * 100) / 100,
    getSafeId: p => p.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
    getDt: () => new Date().toLocaleDateString('de-DE', {day:'2-digit', month:'2-digit'}),

    async init() {
        console.log("Demo-Core init (LocalStorage Mode)");
        await this.load();
        this.loadStatus();
        if(typeof ui !== 'undefined') {
            ui.checkBackupReminder();
            ui.renderTable();
        }
    },

    async load() {
        // Simulation: Lade aus LocalStorage oder nutze Test-Daten
        const saved = localStorage.getItem('osci_lager_demo_data');
        if (saved) {
            this.stockData = JSON.parse(saved);
        } else {
            // Standard-Testdaten beim ersten Start
            this.stockData = {
                "Natriumchlorid (NaCl)": { qty: 4500, h: [{v: 500, t: "01.04."}, {v: 450, t: "10.04."}] },
                "Jod (I)": { qty: 15.5, h: [{v: 2.1, t: "05.04."}] },
                "Fluor (F)": { qty: 800, h: [] },
                "_config": { lastBackup: Date.now() }
            };
            this.save();
        }
        if(document.getElementById('status')) document.getElementById('status').innerText = "● Demo-Modus (Lokal)";
    },

    loadStatus() {
        // Simulierter Hardware-Status
        if(typeof ui !== 'undefined' && ui.updateManualSettings) ui.updateManualSettings();
    },

    async factoryReset() {
        if (confirm("Demo-Daten wirklich zurücksetzen?")) {
            localStorage.removeItem('osci_lager_demo_data');
            location.reload();
        }
    },

    async save() {
        // Simulation: Speichere in LocalStorage
        localStorage.setItem('osci_lager_demo_data', JSON.stringify(this.stockData));
        console.log("Demo: Daten lokal gespeichert");
        if(typeof ui !== 'undefined') ui.renderTable();
    },

    ensureProd(p) { if (!this.stockData[p]) this.stockData[p] = { qty: 0, h: [] }; },

    addVol(p, val) { 
        this.ensureProd(p); 
        this.stockData[p].qty = this.r3(parseFloat(this.stockData[p].qty || 0) + val); 
        this.save(); 
    },

    removeAmt(p, val) {
        this.ensureProd(p);
        if(val > 0) {
            this.stockData[p].qty = this.r3(Math.max(0, parseFloat(this.stockData[p].qty || 0) - val));
            if (!this.stockData[p].h) this.stockData[p].h = [];
            this.stockData[p].h.push({ v: this.r3(val), t: this.getDt() });
            if (this.stockData[p].h.length > 12) this.stockData[p].h.shift();
            this.save();
        }
    }
};

/* core.js - ROBUSTE DEMO VERSION */
const core = {
    stockData: {},
    storageData: { used: 120, total: 1024, ssid: "Demo-V1.2", ip: "192.168.1.1", rssi: -60, temp: 42 },

    r3: n => Math.round(parseFloat(n) * 1000) / 1000,
    r2: n => Math.round(parseFloat(n) * 100) / 100,
    getSafeId: p => p.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
    getDt: () => new Date().toLocaleDateString('de-DE', {day:'2-digit', month:'2-digit'}),

    async init() {
        console.log("Core: Initialisiere Demo-Modus...");
        await this.load();
        
        // Falls nach dem Laden immer noch nichts da ist, erzwinge Testdaten
        if (Object.keys(this.stockData).length <= 1) { 
            this.applyDemoData(); 
        }

        if(typeof ui !== 'undefined') {
            ui.checkBackupReminder();
            ui.renderTable();
        }
    },

    async load() {
        const saved = localStorage.getItem('osci_lager_storage');
        if (saved) {
            this.stockData = JSON.parse(saved);
            console.log("Core: Daten aus LocalStorage geladen.");
        }
    },

    applyDemoData() {
        console.log("Core: Erstelle erste Test-Bestände...");
        this.stockData = {
            "Natriumchlorid (NaCl)": { qty: 4200.5, h: [{v: 400, t: "12.03."}, {v: 350, t: "28.03."}] },
            "Jod (I)": { qty: 12.4, h: [{v: 1.5, t: "10.03."}, {v: 1.8, t: "25.03."}] },
            "Magnesiumchlorid (MgCl2)": { qty: 850, h: [] },
            "Fluor (F)": { qty: 0.5, h: [{v: 200, t: "01.03."}] }, // Test für rot blinken
            "ICP Ocean Check": { qty: 3, h: [] },
            "_config": { lastBackup: Date.now() },
            "_custom": { "Mein Spezial-Mix": { u: "ml", d: 1, s: [] } }
        };
        this.save();
    },

    async save() {
        localStorage.setItem('osci_lager_storage', JSON.stringify(this.stockData));
        if(typeof ui !== 'undefined' && ui.renderTable) ui.renderTable();
    },

    async loadStatus() {
        if(typeof ui !== 'undefined' && ui.updateManualSettings) ui.updateManualSettings();
    },

    ensureProd(p) { if (!this.stockData[p]) this.stockData[p] = { qty: 0, h: [] }; },

    addVol(p, val) { 
        this.ensureProd(p); 
        this.stockData[p].qty = this.r3(parseFloat(this.stockData[p].qty || 0) + val); 
        this.save(); 
    },

    removeAmt(p, val) {
        this.ensureProd(p);
        this.stockData[p].qty = this.r3(Math.max(0, parseFloat(this.stockData[p].qty || 0) - val));
        if (!this.stockData[p].h) this.stockData[p].h = [];
        this.stockData[p].h.push({ v: this.r3(val), t: this.getDt() });
        this.save();
    },

    async factoryReset() {
        if (confirm("Demo zurücksetzen?")) {
            localStorage.clear();
            location.reload();
        }
    }
};

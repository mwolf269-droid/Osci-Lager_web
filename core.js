const core = {
    stockData: {},
    storageData: {},
    r3: n => Math.round(parseFloat(n) * 1000) / 1000, // 3 Stellen (Logs/Bestand)
    r2: n => Math.round(parseFloat(n) * 100) / 100,   // 2 Stellen (Wiegen)
    getSafeId: p => p.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
    getDt: () => new Date().toLocaleDateString('de-DE', {day:'2-digit', month:'2-digit'}),

    async init() {
        console.log("Core init...");
        await this.load();
        this.loadStatus();
        if(typeof ui !== 'undefined') ui.checkBackupReminder();
    },

    async load() {
        try {
            const res = await fetch('/api/load');
            this.stockData = await res.json();
            if(document.getElementById('status')) document.getElementById('status').innerText = "● Synchronisiert";
            if(typeof ui !== 'undefined') ui.renderTable();
        } catch (e) {
            console.error("Lagerdaten konnten nicht geladen werden", e);
            if(document.getElementById('status')) document.getElementById('status').innerText = "● Verbindungsfehler";
        }
    },

    async loadStatus() {
        try {
            const res = await fetch('/api/status');
            this.storageData = await res.json();
            if(typeof ui !== 'undefined' && ui.updateManualSettings) ui.updateManualSettings();
        } catch (e) { console.warn("Hardware-Status nicht erreichbar"); }
    },

    async factoryReset() {
        if (confirm("!!! ACHTUNG !!!\n\nAlle Lagerbestände und WLAN-Daten werden gelöscht!")) {
            await fetch('/api/factory_reset', { method: "POST" });
            location.reload();
        }
    },

    async save() {
        try {
            await fetch('/api/save', { 
                method: "POST", 
                headers: { "Content-Type": "application/json" }, 
                body: JSON.stringify(this.stockData)
            });
            this.loadStatus();
            if(typeof ui !== 'undefined') ui.renderTable();
        } catch (e) { console.error("Speichern fehlgeschlagen", e); }
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
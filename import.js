const importer = {
    process() {
        console.log("Starte Import-Prozess...");
        const textArea = document.getElementById('importText');
        const text = textArea.value.trim();
        if (!text) {
            alert("Bitte zuerst Text in das Feld einfügen.");
            return;
        }

        let itemsFound = [];

        // --- VERSUCH 1: HORIZONTALE TABELLE (NaCl MgCl2 ...) ---
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length >= 2) {
            const headers = lines[0].split(/\t|\s{2,}/).map(h => h.trim()).filter(h => h !== "");
            const values = lines[1].split(/\t|\s{2,}/).map(v => v.trim()).filter(v => v !== "");
            if (headers.length > 1 && values.length > 1) {
                headers.forEach((hName, index) => {
                    const rawValue = values[index];
                    if (!hName || !rawValue) return;
                    let amount = parseFloat(rawValue.replace(/[^\d,.-]/g, '').replace(',', '.'));
                    if (!isNaN(amount) && amount > 0) {
                        let pMatch = this.matchProduct(hName);
                        if (pMatch) itemsFound.push({ id: pMatch, amount: amount });
                    }
                });
            }
        }

        // --- VERSUCH 2: STREAM / VERTIKAL (Trace-Analyse) ---
        if (itemsFound.length === 0) {
            const amountRegex = /([\d,.-]+)\s*(ml|m|Stk|g)\b/gi;
            let match;
            while ((match = amountRegex.exec(text)) !== null) {
                const amount = parseFloat(match[1].replace(',', '.'));
                const searchRange = 50;
                const startPos = Math.max(0, match.index - searchRange);
                const textBefore = text.substring(startPos, match.index);
                let pMatch = this.matchProductInText(textBefore);
                if (pMatch && !isNaN(amount) && amount > 0) {
                    itemsFound.push({ id: pMatch, amount: amount });
                }
            }
        }

        // --- VERARBEITUNG ---
        if (itemsFound.length > 0) {
            let summary = [];
            const currentDate = (typeof core !== 'undefined' && core.getDt) ? core.getDt() : "--";

            itemsFound.forEach(item => {
                const pD = ui.getProdData(item.id);
                core.ensureProd(item.id);
                
                // Wert abziehen
                core.stockData[item.id].qty = core.r3(Math.max(0, parseFloat(core.stockData[item.id].qty || 0) - item.amount));
                
                // In History loggen
                if (!core.stockData[item.id].h) core.stockData[item.id].h = [];
                core.stockData[item.id].h.push({ v: core.r3(item.amount), t: currentDate });
                
                if (core.stockData[item.id].h.length > 12) core.stockData[item.id].h.shift();
                
                summary.push({ name: item.id, amount: item.amount, unit: pD.u });
            });

            core.save();
            ui.showImportSummary(summary);
            textArea.value = "";
        } else {
            alert("Keine passenden Produkte im Text erkannt. Bitte prüfen Sie den kopierten Text.");
        }
    },

    matchProduct(str) {
        str = str.trim().toLowerCase();
        for (let cat in productStructure) {
            for (let p in productStructure[cat]) {
                const symbol = p.match(/\(([^)]+)\)/)?.[1]?.toLowerCase() || "";
                if (str === "1" && symbol === "i") return p;
                if (symbol === str || p.toLowerCase().includes(str)) return p;
            }
        }
        return null;
    },

    matchProductInText(text) {
        let bestMatch = null;
        let lastPos = -1;
        for (let cat in productStructure) {
            for (let p in productStructure[cat]) {
                const symbol = p.match(/\(([^)]+)\)/)?.[1] || "";
                const name = p.split('(')[0].trim();
                const sRegex = new RegExp(`\\b${symbol.replace('+', '\\+')}\\b`, 'i');
                const nRegex = new RegExp(`\\b${name}\\b`, 'i');
                let sMatch = symbol ? text.search(sRegex) : -1;
                let nMatch = text.search(nRegex);
                if (symbol.toLowerCase() === "i") {
                    const iodStrict = /(?<![\d.])\b1\b(?![\d.])/;
                    let fMatch = text.search(iodStrict);
                    if (fMatch > sMatch) sMatch = fMatch;
                }
                let currentPos = Math.max(sMatch, nMatch);
                if (currentPos > lastPos) {
                    lastPos = currentPos;
                    bestMatch = p;
                }
            }
        }
        return bestMatch;
    }
};

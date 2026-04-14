const measuring = {
    fill() {
        const pSel = document.getElementById('prodSelect'); 
        if (!pSel) return;
        
        pSel.innerHTML = '<option value="">Produkt wählen...</option>'; 

        for (const cat in productStructure) {
            let group = document.createElement('optgroup'); 
            group.label = cat;
            
            for (const p in productStructure[cat]) {
                const pD = productStructure[cat][p];
                if (!["Mischbettharz", "ICP Ocean Check", "ICP Ocean Check Pro"].includes(p)) {
                    let opt = document.createElement('option'); 
                    opt.value = p; 
                    opt.innerText = p; 
                    group.appendChild(opt);
                }
            }
            if (group.children.length > 0) pSel.appendChild(group);
        }
    },

    calculate() {
        const p = document.getElementById('prodSelect').value; 
        if (!p) return;
        const pD = ui.getProdData(p);
        const weight = parseFloat(document.getElementById('weightInput').value) || 0;
        const tara = parseFloat(document.getElementById('gebindeSelect').value) || 0;
        
        // Berechnung mit 2 Nachkommastellen (r2)
        const res = core.r2((weight - tara) / pD.d);
        document.getElementById('calcResult').innerText = Math.max(0, res);
    },

    updateStock() {
        let p = document.getElementById('prodSelect').value; 
        if (!p) return;
        const pD = ui.getProdData(p);
        const weight = parseFloat(document.getElementById('weightInput').value) || 0;
        const tara = parseFloat(document.getElementById('gebindeSelect').value) || 0;
        
        // Ergebnis auf 2 Stellen runden
        const res = core.r2((weight - tara) / pD.d);
        
        core.ensureProd(p); 
        core.stockData[p].qty = Math.max(0, res); 
        core.save();
        
        document.getElementById('weightInput').value = ""; 
        document.getElementById('calcResult').innerText = "0";
        alert(p + " wurde auf " + Math.max(0, res) + pD.u + " gesetzt.");
    }
};
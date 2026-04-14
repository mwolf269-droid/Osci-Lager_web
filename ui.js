const ui = {
    currentProduct: null,

    toggleColl(el) { 
        el.classList.toggle("active"); 
        let c = el.nextElementSibling; 
        if (c) c.style.display = (c.style.display === "block") ? "none" : "block"; 
    },

    closeModals() { 
        document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = "none"); 
        ui.currentProduct = null;
    },

    updateManualSettings() {
        const storageEl = document.getElementById('manualStorageInfo');
        const footerEl = document.getElementById('espStorageInfo');
        if (core.storageData && core.storageData.total > 0) {
            const d = core.storageData;
            const used = (d.used / 1024).toFixed(1);
            const total = (d.total / 1024).toFixed(1);
            const perc = ((d.used / d.total) * 100).toFixed(1);
            const lastB = (core.stockData._config && core.stockData._config.lastBackup) 
                          ? new Date(core.stockData._config.lastBackup).toLocaleDateString('de-DE') : "Nie";
            
            if (footerEl) footerEl.innerText = `💾 ${used}KB / ${total}KB (${perc}%) | 📶 ${d.ssid || 'ESP'} | 🌐 ${d.ip || '---'}`;
            if (storageEl) {
                storageEl.innerHTML = `
                    <b>💾 Speicher:</b> ${used} KB / ${total} KB (${perc}%)<br>
                    <b>📶 WLAN:</b> ${d.ssid || 'Setup'} (${d.rssi || 0} dBm)<br>
                    <b>🌐 IP-Adresse:</b> ${d.ip || '---'}<br>
                    <b>🌡️ Chip-Temp:</b> ${d.temp || '--'} °C<br>
                    <b>📅 Letztes Backup:</b> ${lastB}`;
            }
        }
    },

    async openWlanModal() {
        const list = document.getElementById('wifiList');
        if(!list) return;
        list.innerHTML = "<p style='color:#888;'>Scanne Netzwerke...</p>";
        document.getElementById('wlanModal').style.display = "flex";
        try {
            const res = await fetch('/api/scan');
            const nets = await res.json();
            let html = "";
            nets.forEach(n => {
                html += `<div class="history-item" style="cursor:pointer; justify-content:space-between; margin-bottom:5px; padding:12px;" onclick="document.getElementById('wifiSSID').value='${n.s}'">
                    <span>${n.s}</span><small style="color:var(--primary);">${n.r} dBm</small></div>`;
            });
            list.innerHTML = html || "<p>Keine Netze gefunden.</p>";
        } catch (e) { list.innerHTML = "<p>Scan fehlgeschlagen.</p>"; }
    },

    async saveWlan() {
        const s = document.getElementById('wifiSSID').value;
        const p = document.getElementById('wifiPW').value;
        if (!s) return alert("SSID fehlt");
        const formData = new FormData();
        formData.append("ssid", s); formData.append("pw", p);
        try {
            await fetch('/api/wifi', { method: 'POST', body: formData });
            alert("WLAN gespeichert. ESP32 verbindet sich neu.");
            location.reload();
        } catch (e) { alert("Fehler"); }
    },

    downloadBackup() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(core.stockData));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", "osci_lager_backup.json");
        document.body.appendChild(dlAnchor); dlAnchor.click(); dlAnchor.remove();
        if(!core.stockData._config) core.stockData._config = {};
        core.stockData._config.lastBackup = Date.now();
        core.save();
    },

    restoreBackup(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                core.stockData = JSON.parse(e.target.result);
                core.save(); alert("Wiederhergestellt!"); location.href = "index.html";
            } catch (err) { alert("Fehler"); }
        };
        reader.readAsText(file);
    },

    checkBackupReminder() {
        const banner = document.getElementById('backupReminder');
        if(!banner) return;
        if (!core.stockData._config || !core.stockData._config.lastBackup) { banner.style.display = "block"; return; }
        const days = (Date.now() - core.stockData._config.lastBackup) / (1000 * 60 * 60 * 24);
        banner.style.display = (days > 14) ? "block" : "none";
    },

    openCustomProdModal() {
        document.getElementById('customProdName').value = "";
        document.getElementById('customProdModal').style.display = "flex";
    },

    saveCustomProd() {
        const name = document.getElementById('customProdName').value.trim();
        const unit = document.getElementById('customProdUnit').value;
        if (name) {
            if (!core.stockData._custom) core.stockData._custom = {};
            core.stockData._custom[name] = { u: unit, d: 1, s: [] }; 
            core.save(); ui.closeModals();
        }
    },

    deleteCustomProd(p) {
        if (confirm(`Produkt "${p}" löschen?`)) {
            if (core.stockData._custom) delete core.stockData._custom[p];
            if (core.stockData[p]) delete core.stockData[p];
            core.save();
        }
    },

    calculateTrendSlope(history) {
        const data = (history || []).map(e => typeof e === 'object' ? e.v : e);
        if (data.length < 2) return 0;
        let sumX=0, sumY=0, sumXY=0, sumX2=0, n=data.length;
        for (let i=0; i<n; i++) { sumX+=i; sumY+=data[i]; sumXY+=i*data[i]; sumX2+=i*i; }
        return (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX);
    },

    openAddModal(p) {
        ui.currentProduct = p;
        const pD = ui.getProdData(p);
        const isCustom = (core.stockData._custom && core.stockData._custom[p]);
        if (isCustom || !pD.s || pD.s.length === 0) {
            document.getElementById('addCustomVolTitle').innerText = p;
            document.getElementById('addCustomUnit').innerText = pD.u;
            document.getElementById('addCustomInput').value = "";
            document.getElementById('addCustomVolModal').style.display = "flex";
            setTimeout(() => document.getElementById('addCustomInput').focus(), 150);
        } else {
            document.getElementById('addModalTitle').innerText = p;
            const opts = document.getElementById('addModalOptions'); opts.innerHTML = "";
            pD.s.forEach(size => {
                const btn = document.createElement('button');
                btn.className = "big-btn btn-blue"; btn.style.marginBottom = "10px";
                btn.innerText = size + pD.u + " hinzufügen";
                btn.onclick = () => { core.addVol(ui.currentProduct, size); ui.closeModals(); };
                opts.appendChild(btn);
            });
            document.getElementById('addModal').style.display = "flex";
        }
    },

    confirmAddCustom() {
        const val = parseFloat(document.getElementById('addCustomInput').value);
        if (ui.currentProduct && !isNaN(val) && val > 0) {
            core.addVol(ui.currentProduct, val);
            ui.closeModals();
        }
    },

    openRemModal(p) {
        // ICP SPEZIAL
        if (p.toLowerCase().includes("icp")) { core.removeAmt(p, 1); return; }
        
        ui.currentProduct = p;
        const pD = ui.getProdData(p);
        document.getElementById('remModalTitle').innerText = p;
        document.getElementById('modalUnit').innerText = pD.u;
        document.getElementById('remInput').value = "";
        document.getElementById('remModal').style.display = "flex";
        setTimeout(() => document.getElementById('remInput').focus(), 150);
    },

    confirmRem() {
        const val = parseFloat(document.getElementById('remInput').value);
        if (ui.currentProduct && !isNaN(val) && val > 0) {
            core.removeAmt(ui.currentProduct, val);
            ui.closeModals();
        } else {
            alert("Bitte eine gültige Menge eingeben.");
        }
    },

    getProdData(n) { 
        if (core.stockData._custom && core.stockData._custom[n]) return core.stockData._custom[n];
        for (let c in productStructure) if (productStructure[c][n]) return productStructure[c][n];
        return { d: 1, u: "ml", s: [], l: "" }; 
    },

    renderTable() {
        const container = document.getElementById('lagerContainer');
        if(!container) return;
        container.innerHTML = "";
        for (const cat in productStructure) { ui.drawCard(container, cat, productStructure[cat], false); }
        ui.drawCard(container, "Eigene Produkte", core.stockData._custom || {}, true);
        this.updateManualSettings();
    },

    drawCard(container, title, prods, isCustom) {
        let catCard = document.createElement('div'); catCard.className = 'cat-card';
        let headerBtn = isCustom ? `<span style="font-size:0.7rem; cursor:pointer; color:var(--primary); border:1px solid #444; padding:2px 8px; border-radius:6px;" onclick="ui.openCustomProdModal()">Produkt hinzufügen +</span>` : "";
        let html = `<div class="cat-header"><span>${title}</span>${headerBtn}</div><div class="card-body">`;
        if (Object.keys(prods).length === 0 && isCustom) html += `<div style="padding:20px; color:#555; text-align:center; font-size:0.8rem;">Keine eigenen Produkte vorhanden.</div>`;
        for (const p in prods) {
            const pD = prods[p]; const data = core.stockData[p] || { qty: 0, h: [] }; const sId = core.getSafeId(p);
            const slope = ui.calculateTrendSlope(data.h || []);
            let trend = (data.h||[]).length >= 2 ? (slope > 0.01 ? `<span class='trend-icon up'>↑</span>` : (slope < -0.01 ? `<span class='trend-icon down'>↓</span>` : `<span class='trend-icon stable'>→</span>`)) : '';
            let avg = (data.h||[]).length ? core.r3(data.h.slice(-5).reduce((a,b)=>a+(typeof b==='object'?b.v:b),0)/Math.min(data.h.length,5)) : 0;
            const pSafe = p.replace(/'/g, "\\'");
            html += `<div class="prod-row" onclick="ui.toggleHistory('${sId}')"><div class="td-name"><span class="prod-link">${p}</span><div style="display:flex; gap:5px; margin-top:4px;">${pD.l ? `<a href="${pD.l}" target="_blank" class="shop-btn" onclick="event.stopPropagation()">Shop</a>` : ''}${isCustom ? `<span class="shop-btn del" onclick="event.stopPropagation(); ui.deleteCustomProd('${pSafe}')">Löschen</span>` : ''}</div></div><div class="td-stand"><div class="stock-val-container">${trend}<span class="stock-val ${avg > 0 && (data.qty||0) < avg ?'low-stock':''}">${data.qty||0}${pD.u}</span></div><span class="avg-info">${avg > 0 ? 'Ø ' + avg : ''}</span></div><div><button class="btn-sm btn-plus" onclick="event.stopPropagation(); ui.openAddModal('${pSafe}')">+</button></div><div><button class="btn-sm btn-minus" onclick="event.stopPropagation(); ui.openRemModal('${pSafe}')">−</button></div></div><div id="hist-row-${sId}" class="history-row"><div class="history-container"><span style="color:var(--primary); font-size:0.7rem; font-weight:bold; width:100%; display:block; margin-bottom:5px;">LOGS:</span>${(data.h && data.h.length > 0) ? data.h.slice(-12).reverse().map((e, i) => `<div class="history-item"><span>${typeof e==='object'?e.t:'--'}</span> <b>${typeof e==='object'?e.v:e}${pD.u}</b><button class="history-del" onclick="event.stopPropagation(); core.stockData['${pSafe}'].h.splice(${data.h.length-1-i},1); core.save();">×</button></div>`).join('') : "Keine Einträge"}</div></div>`;
        }
        html += `</div>`; catCard.innerHTML = html; container.appendChild(catCard);
        if (typeof window.measuring !== 'undefined' && typeof measuring.fill === 'function') measuring.fill();
    },

    toggleHistory(sId) {
        const row = document.getElementById('hist-row-' + sId);
        if (row) {
            const isActive = row.classList.contains('active');
            document.querySelectorAll('.history-row').forEach(r => r.classList.remove('active'));
            if (!isActive) row.classList.add('active');
        }
    },

    showImportSummary(items) {
        const list = document.getElementById('importSummaryList'); if (!list) return;
        let html = '<table style="width:100%; font-size:0.85rem; color:white; border-collapse:collapse;">';
        items.forEach(item => { html += `<tr style="border-bottom:1px solid #222;"><td style="padding:10px; text-align:left; color:#aaa;">${item.name}</td><td style="padding:10px; text-align:right; color:var(--danger); font-weight:bold;">-${item.amount} ${item.unit}</td></tr>`; });
        html += '</table>'; list.innerHTML = html; document.getElementById('importSummaryModal').style.display = "flex";
    }
};
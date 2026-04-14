# Osci-Motion Lagerverwaltung (Demo)

Dies ist eine webbasierte Lagerverwaltung für Aquaristik-Zusätze, optimiert für die Nutzung auf einem ESP32 oder als Standalone-Webapp.

## 🚀 Live Demo
Du kannst die App direkt hier testen: 
`https://DEIN-NUTZERNAME.github.io/DEIN-REPO-NAME/](https://mwolf269-droid.github.io/Osci-Lager_web/`

## ✨ Features
- **Lagerbestand:** Überwachung von Korallenzusätzen, Traces und ICP-Tests.
- **Import-Assistent:** Erkennt automatisch Werte aus Osci-Motion Tabellen oder ReefManager-Screenshots (OCR).
- **Statistiken:** Visualisierung des Verbrauchs mit Chart.js und Trend-Analyse.
- **Präzisions-Wiegen:** Umrechnung von Gramm (Waage) in Milliliter über die spezifische Dichte.
- **Responsive Design:** Optimiert für mobile Endgeräte (PWA-ready).

## 🛠️ Technik
- HTML5 / CSS3 (Variables, Flexbox, Grid)
- Pure JavaScript (Vanilla)
- Chart.js für die Statistiken
- Mock-Backend via `localStorage` für die Demo-Version.

## 📦 Installation (für eigene Hardware)
1. Alle Dateien auf den SPIFFS/LittleFS deines ESP32 laden.
2. Die `core.js` von der Demo-Version zurück auf die API-Version (fetch) stellen.

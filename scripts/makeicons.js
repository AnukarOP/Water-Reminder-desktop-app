#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Crea un file .icns a partire da un'immagine PNG
 * 
 * Utilizzo:
 * node create-icns.js [inputPNG] [outputICNS]
 * 
 * Esempio:
 * node create-icns.js input.png assets/icons/app-icon.icns
 */

// Verifica che lo script sia eseguito su macOS
if (process.platform !== 'darwin') {
  console.error('Questo script funziona solo su macOS, che ha gli strumenti sips e iconutil.');
  process.exit(1);
}

// Prendi gli argomenti da riga di comando
const args = process.argv.slice(2);
const inputPNG = args[0];
const outputICNS = args[1];

// Verifica che siano stati forniti entrambi gli argomenti
if (!inputPNG || !outputICNS) {
  console.error('Utilizzo: node create-icns.js [inputPNG] [outputICNS]');
  process.exit(1);
}

// Verifica che il file di input esista
if (!fs.existsSync(inputPNG)) {
  console.error(`Il file ${inputPNG} non esiste.`);
  process.exit(1);
}

// Crea le directory necessarie
const outputDir = path.dirname(outputICNS);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Nome della cartella .iconset temporanea
const iconsetName = 'MyIcon.iconset';

// Crea la cartella .iconset
if (fs.existsSync(iconsetName)) {
  // Rimuovi la cartella se esiste già
  fs.rmSync(iconsetName, { recursive: true, force: true });
}
fs.mkdirSync(iconsetName);

// Dimensioni delle icone da generare
const sizes = [16, 32, 128, 256, 512];

try {
  console.log('Inizio creazione set di icone...');
  
  // Genera icone di varie dimensioni
  sizes.forEach(size => {
    const doubleSize = size * 2;
    
    // Icona normale
    console.log(`Creazione icona ${size}x${size}...`);
    execSync(`sips -z ${size} ${size} "${inputPNG}" --out "${iconsetName}/icon_${size}x${size}.png"`);
    
    // Icona Retina (2x)
    console.log(`Creazione icona ${size}x${size}@2x...`);
    execSync(`sips -z ${doubleSize} ${doubleSize} "${inputPNG}" --out "${iconsetName}/icon_${size}x${size}@2x.png"`);
  });
  
  // Converti il set di icone in un file .icns
  console.log('Conversione set di icone in formato .icns...');
  execSync(`iconutil -c icns "${iconsetName}" -o "${outputICNS}"`);
  
  console.log(`File .icns creato con successo: ${outputICNS}`);
} catch (error) {
  console.error('Errore durante la creazione del file .icns:', error.message);
  process.exit(1);
} finally {
  // Pulisci rimuovendo la cartella temporanea
  console.log('Pulizia: rimozione cartella temporanea...');
  fs.rmSync(iconsetName, { recursive: true, force: true });
}

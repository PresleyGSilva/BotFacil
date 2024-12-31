const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const whatsapp = require('./whatsapp'); // Script que gerencia o WhatsApp Web

let mainWindow;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Inicialização do Electron
app.on('ready', () => {
    createMainWindow();
    whatsapp.startClient(mainWindow); // Inicia a conexão com o WhatsApp
});

// Fecha o aplicativo no Windows
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// Reabre o aplicativo no macOS
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

// Gerencia eventos enviados pelo frontend
ipcMain.on('save-config', (event, data) => {
    const configPath = path.join(__dirname, 'config.json');
    fs.writeFile(configPath, JSON.stringify(data, null, 2), (err) => {
        if (err) {
            console.error('Erro ao salvar configurações:', err);
            event.reply('save-config-reply', { success: false, message: 'Erro ao salvar configurações!' });
        } else {
            console.log('Configurações salvas com sucesso!');
            event.reply('save-config-reply', { success: true, message: 'Configurações salvas com sucesso!' });
        }
    });
});

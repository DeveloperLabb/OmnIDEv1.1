const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let uvicornProcess;

function startUvicornServer() {
  uvicornProcess = spawn('uvicorn', ['main_api:app', '--reload', '--host', 'localhost', '--port', '8000'], {
    shell: true
  });

  uvicornProcess.stdout.on('data', (data) => {
    console.log(`Uvicorn: ${data}`);
  });

  uvicornProcess.stderr.on('data', (data) => {
    console.error(`Uvicorn Error: ${data}`);
  });
}

ipcMain.handle('dialog:openFile', async (event, options) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: options?.filters || []
  });
  if (canceled) return null;
  return filePaths[0];
});

ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (canceled) return null;
  return filePaths[0];
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // In development, load from Vite dev server
  mainWindow.loadURL('http://localhost:5173');

  // Enable DevTools only in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Set CSP headers
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; connect-src 'self' http://localhost:8000; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
        ]
      }
    });
  });
}

app.whenReady().then(() => {
  startUvicornServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (uvicornProcess) {
      uvicornProcess.kill();
    }
    app.quit();
  }
});

app.on('before-quit', () => {
  if (uvicornProcess) {
    uvicornProcess.kill();
  }
});

process.on('SIGTERM', () => {
  if (uvicornProcess) {
    uvicornProcess.kill();
  }
  app.quit();
});
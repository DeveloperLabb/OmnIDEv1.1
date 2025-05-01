const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const process = require('process');
const ps = require('ps-node'); // You'll need to add this: npm install ps-node

let mainWindow;
let uvicornProcess;
let viteDevProcess;

// Helper function to kill processes by name
function killProcessByName(name) {
  return new Promise((resolve) => {
    ps.lookup({
      command: name
    }, (err, resultList) => {
      if (err) {
        console.log(`Error finding ${name} processes:`, err);
        return resolve();
      }
      
      resultList.forEach((process) => {
        console.log(`Killing ${name} process PID: ${process.pid}`);
        ps.kill(process.pid, 'SIGTERM', (err) => {
          if (err) console.log(`Failed to kill ${name} process ${process.pid}:`, err);
        });
      });
      resolve();
    });
  });
}

// Kill any existing Python/uvicorn processes before starting new ones
async function cleanupExistingProcesses() {
  console.log('Cleaning up existing processes...');
  
  // Kill any existing uvicorn/python processes
  if (process.platform === 'win32') {
    await new Promise((resolve) => {
      exec('taskkill /F /IM uvicorn.exe /T', (error) => {
        if (error) console.log('No uvicorn processes found to kill');
        resolve();
      });
      
      exec('taskkill /F /IM python.exe /T', (error) => {
        if (error) console.log('No python processes found to kill');
        resolve();
      });
    });
  } else {
    await killProcessByName('uvicorn');
    await killProcessByName('python');
  }
}

function startUvicornServer() {
  const options = {
    shell: true,
    detached: false, // Don't detach to keep control over process
  };
  
  // Use different spawn args based on platform
  if (process.platform === 'win32') {
    uvicornProcess = spawn('uvicorn', ['main_api:app', '--host', 'localhost', '--port', '8000'], options);
  } else {
    uvicornProcess = spawn('uvicorn', ['main_api:app', '--host', 'localhost', '--port', '8000'], options);
  }

  // Disable auto-reload to avoid spawning multiple processes
  // Note the removal of the '--reload' flag

  uvicornProcess.stdout.on('data', (data) => {
    console.log(`Uvicorn: ${data.toString().trim()}`);
  });

  uvicornProcess.stderr.on('data', (data) => {
    console.error(`Uvicorn Error: ${data.toString().trim()}`);
  });
  
  uvicornProcess.on('close', (code) => {
    console.log(`Uvicorn process exited with code ${code}`);
    uvicornProcess = null;
  });
  
  uvicornProcess.on('error', (error) => {
    console.error(`Error starting uvicorn: ${error.message}`);
    uvicornProcess = null;
  });
  
  // Ensure the process is killed when the main process exits
  uvicornProcess.unref();
}

function terminateAllProcesses() {
  console.log('Terminating all processes...');
  
  // Properly kill the uvicorn process with all its child processes
  if (uvicornProcess) {
    console.log('Killing uvicorn process...');
    try {
      // On Windows, we need to use a process group to kill all child processes
      if (process.platform === 'win32') {
        exec(`taskkill /pid ${uvicornProcess.pid} /T /F`, (error) => {
          if (error) console.log(`Failed to kill uvicorn process: ${error}`);
        });
      } else {
        // On Unix, we can kill the process group
        process.kill(-uvicornProcess.pid, 'SIGTERM');
      }
    } catch (err) {
      console.error('Error killing uvicorn process:', err);
    }
    uvicornProcess = null;
  }
  
  // Also clean up any potential remaining processes
  cleanupExistingProcesses();
  
  // Kill the Vite dev server too (if in development)
  if (process.env.NODE_ENV === 'development') {
    exec('npx vite --help', (error, stdout, stderr) => {
      if (!error) {
        if (process.platform === 'win32') {
          exec('taskkill /F /IM node.exe /T', (error) => {
            if (error) console.log('Failed to kill node processes:', error);
          });
        } else {
          exec('pkill -f vite', (error) => {
            if (error) console.log('Failed to kill vite process:', error);
          });
        }
      }
    });
  }
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
  
  mainWindow.on('closed', () => {
    console.log('Main window closed');
    mainWindow = null;
  });
}

// Start app only after cleaning up any existing processes
app.whenReady().then(async () => {
  // First clean up any existing processes
  await cleanupExistingProcesses();
  
  // Start uvicorn server and wait until it's ready
  startUvicornServer();
  
  // Wait a moment for uvicorn to initialize before starting the Electron window
  setTimeout(() => {
    createWindow();
  }, 1500);
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Ensure all processes are properly terminated when the app is closed
app.on('window-all-closed', () => {
  console.log('All windows closed');
  terminateAllProcesses();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  console.log('App quitting');
  terminateAllProcesses();
});

app.on('will-quit', () => {
  console.log('App will quit');
  terminateAllProcesses();
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  terminateAllProcesses();
  app.quit();
});

process.on('SIGINT', () => {
  console.log('SIGINT received');
  terminateAllProcesses();
  app.quit();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  terminateAllProcesses();
  app.quit();
});
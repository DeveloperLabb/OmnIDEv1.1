const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const process = require('process');
const ps = require('ps-node'); // You'll need to add this: npm install ps-node

// At the top of the file, add this line
process.env.NODE_ENV = process.env.NODE_ENV || (app.isPackaged ? 'production' : 'development');

console.log(`Running in ${process.env.NODE_ENV} mode`);

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

// Add this function to start the packaged Python API instead of uvicorn directly

function startPackagedPythonApi() {
  // In development mode, use uvicorn directly
  if (process.env.NODE_ENV === 'development') {
    startUvicornServer();
    return;
  }
  
  // In production mode, use the packaged Python executable
  console.log('Starting packaged Python API...');
  
  // This is the correct path to access resources in the packaged app
  const pythonApiPath = path.join(
    app.isPackaged ? process.resourcesPath : app.getAppPath(), 
    'python_api', 
    'OmnIDE' + (process.platform === 'win32' ? '.exe' : '')
  );
  
  console.log(`Python API path: ${pythonApiPath}`);
  
  try {
    if (process.platform === 'win32') {
      // On Windows, use the built-in admin privileges from the manifest
      // The exe already has the uac_admin=True from PyInstaller and
      // requestedExecutionLevel: "requireAdministrator" from electron-builder
      const options = {
        detached: false,
        shell: true, // Use shell on Windows
        windowsHide: false, // Make sure the console window isn't hidden
        windowsVerbatimArguments: true
      };
      
      // Quote the path to handle spaces properly
      const quotedPath = `"${pythonApiPath}"`;
      uvicornProcess = spawn(quotedPath, [], options);
      
      // Add flag to track the first startup message
      let startupMessageShown = false;
      
      uvicornProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        // Only log the startup message once
        if (output.includes('Uvicorn running on') && !startupMessageShown) {
          console.log(`Python API: ${output}`);
          startupMessageShown = true;
        } else if (!output.includes('Will watch for changes')) {
          // Don't log watch messages
          console.log(`Python API: ${output}`);
        }
      });
    } else {
      // For non-Windows platforms
      // On Unix systems, we could use sudo but it would require password input
      // Alternative: use pkexec or gksudo if available
      const options = {
        detached: false,
        shell: true
      };
      
      uvicornProcess = spawn(pythonApiPath, [], options);
      
      uvicornProcess.stdout.on('data', (data) => {
        console.log(`Python API: ${data.toString().trim()}`);
      });
    }
    
    uvicornProcess.stderr.on('data', (data) => {
      console.error(`Python API Error: ${data.toString().trim()}`);
    });
    
    uvicornProcess.on('close', (code) => {
      console.log(`Python API process exited with code ${code}`);
      uvicornProcess = null;
    });
    
    uvicornProcess.on('error', (error) => {
      console.error(`Error starting Python API: ${error.message}`);
      uvicornProcess = null;
    });
  } catch (error) {
    console.error(`Failed to start Python API executable: ${error.message}`);
  }
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

  // Add dev server URL logging
  console.log('Loading URL:', !app.isPackaged ? 'http://localhost:5173' : `file://${path.join(__dirname, '../dist/index.html')}`);

  // In development, load from Vite dev server, otherwise load from built files
  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development mode
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(`file://${path.join(__dirname, '../dist/index.html')}`);
  }

  // Add error handling for page loading
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load page:', errorDescription);
    // Try reconnecting if in development mode
    if (!app.isPackaged) {
      setTimeout(() => {
        console.log('Attempting to reconnect to Vite dev server...');
        mainWindow.loadURL('http://localhost:5173');
      }, 3000);
    }
  });
}

// In electron/main.js
app.whenReady().then(async () => {
  // First clean up any existing processes
  await cleanupExistingProcesses();
  
  // Create and show window immediately
  createWindow();

  // In dev mode, open developer tools automatically
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
  
  // Start Python API in the background
  startPackagedPythonApi();
  
  // In development mode, don't wait for API to be ready
  if (!app.isPackaged) {
    console.log('Development mode: Electron and Vite connected');
  } else {
    // Only in production, monitor API health
    if (mainWindow) {
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.executeJavaScript(`
          const apiCheckInterval = setInterval(() => {
            fetch('http://localhost:8000/api/health-check')
              .then(response => {
                if (response.ok) {
                  clearInterval(apiCheckInterval);
                  console.log('Backend API is ready');
                  window.dispatchEvent(new CustomEvent('api-ready'));
                }
              })
              .catch(e => {
                console.log('Waiting for backend API...');
              });
          }, 1000);
        `);
      });
    }
  }
  
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
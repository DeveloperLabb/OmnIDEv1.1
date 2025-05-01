const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: async (options) => {
    return await ipcRenderer.invoke('dialog:openFile', options);
  },
  selectDirectory: async () => {
    return await ipcRenderer.invoke('dialog:openDirectory');
  }
});
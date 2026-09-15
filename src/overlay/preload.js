const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('overlayAPI', {
  select: (rect) => ipcRenderer.send('overlay:selected', rect),
  cancel: () => ipcRenderer.send('overlay:cancel'),
});

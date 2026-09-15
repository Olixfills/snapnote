const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('thumbnailAPI', {
  onImage: (cb) => ipcRenderer.on('thumbnail:image', (_e, dataUrl) => cb(dataUrl)),
  edit: () => ipcRenderer.send('thumbnail:edit'),
  dismiss: () => ipcRenderer.send('thumbnail:dismiss'),
  copied: () => ipcRenderer.send('thumbnail:copied'),
  reportError: (message) => ipcRenderer.send('thumbnail:rendererError', message),
});

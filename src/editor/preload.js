const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('editorAPI', {
  onImage: (cb) => ipcRenderer.on('editor:image', (_e, dataUrl) => cb(dataUrl)),
  cancel: () => ipcRenderer.send('editor:cancel'),
  copied: () => ipcRenderer.send('editor:copied'),
  reportError: (message) => ipcRenderer.send('editor:rendererError', message),
});

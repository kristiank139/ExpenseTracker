const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  getJsonData: (filePath, unique_ids) => ipcRenderer.invoke('get-json-data', filePath, unique_ids),
  onProgress: (callback) => ipcRenderer.on('progress-update', (event, value) => callback(value)),
  onProgressTotal: (callback) => ipcRenderer.on('progress-total', (event, value) => callback(value))
});

contextBridge.exposeInMainWorld('paymentAPI', {
  addPayment: (payment, type) => ipcRenderer.invoke('add-payment', payment, type),
  getPayments: () => ipcRenderer.invoke('get-payments')
});

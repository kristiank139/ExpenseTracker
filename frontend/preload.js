const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  getJsonData: (filePath) => ipcRenderer.invoke('get-json-data', filePath)
});

contextBridge.exposeInMainWorld('paymentAPI', {
  addPayment: (payment) => ipcRenderer.invoke('add-payment', payment),
  getPayments: () => ipcRenderer.invoke('get-payments')
});

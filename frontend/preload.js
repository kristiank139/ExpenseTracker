const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  getJsonData: (filePath, unique_ids) => ipcRenderer.invoke('get-json-data', filePath, unique_ids)
});

contextBridge.exposeInMainWorld('paymentAPI', {
  addPayment: (payment) => ipcRenderer.invoke('add-payment', payment),
  getPayments: () => ipcRenderer.invoke('get-payments')
});

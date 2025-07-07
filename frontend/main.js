const { app, BrowserWindow, ipcMain, dialog } = require('electron/main')
const { spawn } = require('child_process');
const path = require('path');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  })

  win.loadURL('http://localhost:3000')
  win.webContents.openDevTools()
}

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'CSV Files', extensions: ['csv']},
      { name: 'All files', extensions: ['*']}
    ]
  });

  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});

ipcMain.handle('get-json-data', async (event, filePath) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', ['/Users/krist/Documents/proge/Serious-projects/ExpenseTracker/backend/expense_tracker.py', filePath]);

    let dataString = '';
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.on('close', () => {
      try {
        const jsonData = JSON.parse(dataString);
        console.log('Sending to renderer:', jsonData);
        resolve(jsonData);
      } catch (error) {
        console.error('Failed to parse JSON:', error);
        reject(error);
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python error: ${data.toString()}`);
    });
  });
});

app.whenReady().then(() => {
  createWindow()
  

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow() 
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
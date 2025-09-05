const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { spawn } = require('child_process');
const path = require('path');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1600,
    height: 1200,
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

    const pythonPath = path.resolve(__dirname, '../backend/venv/bin/python3');

    const scriptPath = path.resolve(__dirname, '../backend/expense_tracker.py');

    const pythonProcess = spawn(pythonPath, [scriptPath, filePath]);

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
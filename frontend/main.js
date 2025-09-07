const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbDir = path.join(app.getPath('userData'), 'database');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, 'payments.sqlite');
const db = new Database(dbPath);
const log = require('electron-log');

db.prepare(`
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    unique_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    category TEXT,
    type TEXT
  )
`).run();

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

function addPayment(payment, type) {

  const stmt = db.prepare(`
    INSERT INTO payments (date, unique_id, amount, description, category, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

   stmt.run(payment.date, payment.unique_id, payment.amount, payment.description, payment.category, type);
}

function getPayments() {
  // Dynamically get columns except id
  const columns = db.prepare('PRAGMA table_info(payments)').all()
      .map(col => col.name)
      .filter(name => name !== 'id')
      .join(', ');

  const rows = db.prepare(`SELECT ${columns} FROM payments ORDER BY date DESC`).all();
  return rows;
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

ipcMain.handle('add-payment', (event, payment, type) => {
  addPayment(payment, type);
});

ipcMain.handle('get-payments', () => {
  return getPayments();
});

ipcMain.handle('get-json-data', async (event, filePath, unique_ids) => {
  return new Promise((resolve, reject) => {

    const pythonPath = path.resolve(__dirname, '../backend/venv/bin/python3');

    const scriptPath = path.resolve(__dirname, '../backend/expense_tracker.py');

    log.info(`Spawning Python process: ${pythonPath} ${scriptPath} ${filePath} ${unique_ids}`);
    const pythonProcess = spawn(pythonPath, [scriptPath, filePath, unique_ids]);

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
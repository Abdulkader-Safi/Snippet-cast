// Electron shell: loads the Vite dev server with --dev, otherwise the built dist/.
const { app, BrowserWindow, shell } = require('electron')
const path = require('node:path')

const DEV_URL = 'http://localhost:5173'
const isDev = process.argv.includes('--dev')

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0a0a0f',
    webPreferences: { contextIsolation: true, sandbox: true },
  })

  // External links open in the system browser, not inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    // Vite may still be booting when Electron starts; retry until it answers.
    win.webContents.on('did-fail-load', () => setTimeout(() => win.loadURL(DEV_URL), 500))
    win.loadURL(DEV_URL)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

const { app, BrowserWindow } = require('electron')
const path = require('path')
try {
  require('electron-reloader')(module)
} catch (_) {}

let window;
function createWindow() {
  window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  window.loadFile('index.html')
  return window
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.whenReady().then(() => {
  window = createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) window = createWindow()
  })


})


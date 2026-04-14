const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')
const http = require('http')

// ===== DÉSACTIVER LES WARNINGS DE SÉCURITÉ =====
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true
app.commandLine.appendSwitch('ignore-certificate-errors')
// ================================================

let server = null

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    show: true,
    backgroundColor: '#d4e8ff'
  })

  // Ouvrir les outils de développement
  mainWindow.webContents.openDevTools()

  // Serveur HTTP local pour servir les fichiers
  const distPath = path.join(__dirname, 'dist')
  
  server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url
    filePath = path.join(distPath, filePath)
    
    try {
      const content = fs.readFileSync(filePath)
      const ext = path.extname(filePath)
      const contentType = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.ico': 'image/x-icon'
      }[ext] || 'text/plain'
      
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(content)
    } catch (err) {
      res.writeHead(404)
      res.end('File not found')
    }
  })
  
  server.listen(0, 'localhost', () => {
    const port = server.address().port
    console.log(`✅ Serveur démarré sur http://localhost:${port}`)
    mainWindow.loadURL(`http://localhost:${port}`)
  })
}

app.whenReady().then(() => {
  console.log('✅ Electron prêt')
  createWindow()
})

app.on('window-all-closed', () => {
  if (server) server.close()
  if (process.platform !== 'darwin') app.quit()
})
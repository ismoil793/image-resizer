const path = require('path')
const os = require('os')
const fs = require('fs')
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const resizeImg = require('resize-img');

const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';

// App topbar menu
const APP_MENU = [
    ...(isMac ? [{
        label: app.name,
        submenu: [
            {
                label: 'About'
            }
        ]
    }] : []),
    {
        label: 'File',
        submenu: [
            {
                label: 'Quit',
                click: () => app.quit(),
                accelerator: 'CmdOrCtrl+W'
            }
        ]
    },
    ...(!isMac ? [{
        label: 'Help',
        submenu: [
            {
                label: 'About',
                click: createAboutWindow
            }
        ]
    }] : [])
]

function createAboutWindow() {
    const aboutWindow = new BrowserWindow({
        title: 'About Image Resizer',
        width: 300,
        height: 300
    });

    aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));
}

let mainWindow

// create the main window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'Image Resizer',
        width: isDev ? 1200 : 600,
        height: 700,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // open devtools if in dev env
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
}


app.whenReady().then(() => {
    createMainWindow()

    // Implement menu
    const mainMenu = Menu.buildFromTemplate(APP_MENU)
    Menu.setApplicationMenu(mainMenu)

    // Remove mainWindow from memory on close
    mainWindow.on('close', () => {
        mainWindow = null
    })

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow()
        }
    })
})
    .catch(console.log)

//---alternatively
// app.on('ready', () => {
// createMainWindow()
// })

// Respond to ipcRenderer
ipcMain.on('image:resize', (e, options) => {
    options.dest = path.join(os.homedir(), 'image-resizer')
    resizeImage(options)
})

// Resize the image
async function resizeImage({ imgPath, width, height, dest }) {
    try {
        const newPath = await resizeImg(fs.readFileSync(imgPath), {
            width: +width,
            height: +height,
        })

        // Create filename
        const filename = path.basename(imgPath)

        // Create dest folder if not exist
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }

        // Write file to dest
        fs.writeFileSync(path.join(dest, filename), newPath);

        // Send success to render
        mainWindow.webContents.send('image:done')

        // Open dest folder
        shell.openPath(dest);

    } catch (e) {
        console.log(e);
    }
}

app.on('window-all-closed', () => {
    if (!isMac) {
        app.quit()
    }
})


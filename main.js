const {app, BrowserWindow, Menu, ipcMain} = require('electron');
const fetch = require('node-fetch');
const Promise = require('bluebird');
const path = require('path');
const url = require('url');
const fs = Promise.promisifyAll(require('fs'));

const volPath = base = process.platform == 'darwin' ? '/Volumes' : 'D:/'
let volChecker = null;
let volDisconChecker = null;

async function checkVolumes() {
    let volumes = await fs.readdirAsync(volPath);
    return volumes.includes('SDCARD');
}

async function volumeChecker() {
    if (await checkVolumes()) {
        console.log('SDCARD connected');
        clearInterval(volChecker);
        volChecker = null;
        volDisconChecker = setInterval(volumeDisconnectChecker, 1000);
        mainWindow.webContents.send('device:connected');
    }
}

async function volumeDisconnectChecker() {
    if (!(await checkVolumes())) {
        console.log('SDCARD disconnected');
        clearInterval(volDisconChecker);
        volChecker = setInterval(volumeChecker, 600);
        mainWindow.webContents.send('device:disconnected');
    }
}


const {menuTemplate} = require('./mainmenu');

require('electron-reload')(__dirname);

process.env.NODE_ENV = 'production';

let mainWindow;
let photoBrowseWindow;

function createMainWindow() {
    // create main window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // load index.html
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));
    // mainWindow.loadURL('http://127.0.0.1:5000/');

    // build menu from template
    const mainMenu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(mainMenu);

    mainWindow.on('closed', () => {
        app.quit();
    });
}

function createAddWindow() {
    // create main window
    addWindow = new BrowserWindow({
        width: 300,
        height: 200,
        title: 'Add shopping list item',
        webPreferences: {
            nodeIntegration: true
        }
        // icon: '/img/icon.jpg'
    });

    // load index.html
    addWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    addWindow.on('closed', () => {
        addWindow = null;
    });

    addWindow.on('close', () => {
        addWindow = null;
    })
}

// quit when all windows closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});


// catch item:add
ipcMain.on('item:add', (e, item) => {
    console.log(`HERE: ${item}`)
    win.webContents.send('item:add', item);
    addWindow.close();
});

ipcMain.on('page:loaded', e => {
    if (volChecker != null) {
        clearInterval(volChecker);
        volChecker = null;
    }
    if (volDisconChecker != null) {
        clearInterval(volDisconChecker);
        volDisconChecker = null;
    }
    volChecker = setInterval(volumeChecker, 600);
    loadSampleIDs();
});

async function sendImagesIn(imgPath) {
    const items = await fs.readdirAsync(imgPath);

    for (let file of items) {
        if (!file.endsWith('.jpg')) {
            console.log(`Skipping non-jpg ${file}`);
            continue;
        }
        if (file.startsWith('.')) {
            console.log(`Skipping . file ${file}`)
            continue;
        }
        const URL = url.format({
            pathname: path.join(imgPath, file),
            protocol: 'file:',
            slashes: true
        });
        mainWindow.webContents.send('load:image', URL);
    }
}

function loadSampleIDs() {
    fetch('https://test.bard.edu:5000/api/sampleIDs/current')
    .then(resp => resp.json())
    .then(samples => mainWindow.webContents.send('loaded:sampleIDs', samples));
}

ipcMain.on('load:images', e => {
    const basePath = path.join(volPath, 'SDCARD/img');
    sendImagesIn(basePath);
});

ipcMain.on('load:test', e => {
    const testPath = path.join(__dirname, 'img/test');
    sendImagesIn(testPath);
});

// run create window on start
app.on('ready', createMainWindow);

module.exports = function(app) {
    module.app = app;
}

// setTimeout(() => {
//     console.log("Sending device:connected to " + mainWindow);
//     mainWindow.webContents.send('device:connected');
// }, 3000);


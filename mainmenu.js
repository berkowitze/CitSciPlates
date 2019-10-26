const {app} = require('electron');

let menuTemplate;

const fileMenu = {
    label: 'File', 
    submenu: [
        {
            label: 'Add item',
            accelerator: process.platform == 'darwin' ? 'Command+N' : 'Ctrl+N',
            click() {
                createAddWindow()
            }
        },
        {
            label: 'Clear items',
            click() {
                win.webContents.send('item:clear');
            }
        },
        {
            label: 'Quit',
            accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
            click() {
                app.quit();
            }
        },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },

    ]
}


if (process.platform == 'darwin') {
    menuTemplate = [{label: 'hi'}, fileMenu];
}
else {
    menuTemplate = [fileMenu]
}

if (process.env.NODE_ENV !== 'production') {
    menuTemplate.push({
        label: 'Developer tools',
        submenu: [
            {
                label: 'Toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }
        ]
    })
}

module.exports = {menuTemplate}
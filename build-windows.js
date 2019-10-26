const electronInstaller = require('electron-winstaller');

async function winBuild() {
    try {
        await electronInstaller.createWindowsInstaller({
            appDirectory: '.'
        });
        console.log('Windows exe created');
    } catch (e) {
        console.log(`Error creating windows installer: ${e.message}`);
    }
}

winBuild();

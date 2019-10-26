const {ipcRenderer} = require('electron');
const ul = document.querySelector('ul#items');

function loadImages() {
    ipcRenderer.send('load:images');
}

function testMode() {
    resetPage();
    ipcRenderer.send('load:test');
    switchState('#images');
}

function deviceConnected(e) {
    resetPage();
    console.log('received device:connected');
    loadImages();
    switchState('#images');
}

function deviceDisconnected(e) {
    console.log('received device:disconnected');
    M.toast({
        html: 'Device disconnected...',
        displayLength: 5000
    })
    switchState('#waiting');
}

function gotSamples(e, samples) {
    debugger;
}

ipcRenderer.on('device:connected', deviceConnected);
ipcRenderer.on('device:disconnected', deviceDisconnected);

ipcRenderer.on('loaded:sampleIDs', gotSamples);
ipcRenderer.on('item:clear', e => {
    ul.innerHTML = '';
    ul.className = '';
});

ipcRenderer.on('load:image', (e, imgPath) => {
    const img = $('<img>');
    img.attr('src', imgPath);
    ul.appendChild(img.get(0));
    images.push(imgPath);
    updateProgress();
});

ul.addEventListener('dblclick', e => {
    // e.target.remove();
    // if (ul.children.length == 0) {
    //     ul.className = '';
    // }
});
let sortIndex = null;
let sortModal;
let images = [];
const catToImages = new Map();  // category -> list of paths
const imageToCat = new Map();   // path -> category
catToImages['trash'] = [];

function switchState(to) {
    $('div.state').removeClass('active');
    $(to).addClass('active');
}

function watersamplesChanged(e) {
    const selElem = $('select');
    const sel = M.FormSelect.getInstance(selElem);
    const samples = sel.getSelectedValues();
    for (let wsid of catToImages.keys()) {
        if (wsid == 'trash') {
            continue;
        }
        const imgs = catToImages.get(wsid);
        if (imgs != null && imgs != undefined && imgs.size > 0) {
            if (!samples.includes(wsid)) {
                M.toast({
                    html: `Images categorized under ${wsid} will need to be recategorized`
                });
                catToImages.delete(wsid);
                for (let img of imgs) {
                    if (imageToCat.has(img)) {
                        imageToCat.delete(img);
                    }
                }
                updateProgress();
            }
        }
    }
    if (samples.length > 0) {
        const first = samples[0];
        const room = first.split('-')[0];
        for (let wsid of samples) {
            if (wsid.split('-')[0] !== room) {
                M.toast({
                    html: 'Samples from different rooms selected.<br/>Make sure you have the correct samples selected!',
                    displayDuration: 5000
                });
                return;
            }
        }
    }
    $('#sampleids').html('');
    for (let wsid of samples) {
        const p = `<p>
                       <label>
                           <input class='with-gap'
                                  type="radio"
                                  name="wsid"
                                  value="${wsid}"/>
                           <span>${wsid}</span>
                       </label>
                   </p>`
        $('#sampleids').html($('#sampleids').html() + p);
    }
    if (samples.length > 0) {
      $('#wsid-select button#start-sorting').prop('disabled', false);
    }
    else {
      $('#wsid-select button#start-sorting').prop('disabled', true);
      $('#wsid-select button#start-selecting').prop('disabled', true);
    }
}

function startSorting() {
    sortIndex = 0;
    sortModal.open();
    goToImage();
}

function goToImage() {
    const selElem = $('select');
    const sel = M.FormSelect.getInstance(selElem);
    const samples = sel.getSelectedValues();
    if (sortIndex >= images.length) {
        M.toast({
            html: 'No next image',
            displayDuration: 1000
        })
        return;
    }
    else if (sortIndex < 0) {
        M.toast({
            html: 'No previous image',
            displayDuration: 1000
        })
        return;
    }
    const imgPath = images[sortIndex]
    const sortEl = $(sortModal.el);
    const imgEl = sortEl.find('#sortImage');
    imgEl.get(0).innerHTML = '';

    const image = $('<img>');
    image.attr('src', imgPath);
    sortEl.find('#sortImage').append(image);

    const options = $('<form>');
    options.append($(`<p class='categorizer'>
         <label>
             <input class='with-gap'
                    type="radio"
                    name="wsid"
                    value="trash"/>
             <span>Trash</span>
         </label>
     </p>`));
    for (let sid of samples) {
        const p = `<p class='categorizer'>
               <label>
                   <input class='with-gap'
                          type="radio"
                          name="wsid"
                          value="${sid}"/>
                   <span>${sid}</span>
               </label>
           </p>`
        const pEl = $(p);
        options.append(pEl);
    }
    if (imageToCat.has(imgPath)) {
        const cat = imageToCat.get(imgPath);
        a = options.find(`:radio[value=${cat}]`);
        a.prop('checked', true);
    }
    options.get(0).addEventListener('change', imageCategorized);
    $('.modal-footer p#img-descr').text(`${sortIndex + 1}/${images.length}`);
    $('.modal-footer #img-form').html(options);
}

function imageCategorized(e) {
    const newCat = $(`[name=${e.target.name}]:checked`).val();
    const imPath = images[sortIndex];
    const oldCat = imageToCat.get(imPath);
    if (oldCat !== undefined) {
        catToImages.get(oldCat).delete(imPath);
    }

    imageToCat.set(imPath, newCat);
    if (!catToImages.has(newCat)) {
        catToImages.set(newCat, new Set([imPath]));
    }
    else {
        catToImages.get(newCat).add(imPath);
    }

    updateProgress();
}

function allCategorized() {
    const categorized = imageToCat.size;
    const total = images.length;
    return {
        complete: categorized == total,
        categorized: categorized,
        total: total
    }
}

function updateProgress() {
    const {complete, categorized, total} = allCategorized();
    if (!complete) {
        $('span#descr').text('Start sorting');
        $('span#progress').text(`${categorized} / ${total} categorized.`);
        $('button#selecting-descr').prop('disabled', true);
    }
    else {
        $('span#descr').text('Images categorized');
        $('span#progress').text('Click to recategorize');
        $('button#start-selecting').prop('disabled', false);
    }
}

function modalKeyPress(e) {
    if (!sortModal.isOpen) {
        return;
    }
    console.log('hi');
    const pressed = String.fromCharCode(e.which);
    if (pressed.toLowerCase() == 'n') {
        nextImage();
    }
    else if (pressed.toLowerCase() == 'b') {
        prevImage();
    }
    else if (pressed.toLowerCase() == 'm') {
        nextUncatImage();
    }
}

function modalKeyDown(e) {
    if (!sortModal.isOpen) {
        return;
    }
    if (e.key == 'ArrowLeft' || e.key == 'ArrowRight') {
        $(e.target).blur();
        return false;
    }
}

function nextImage() {
    sortIndex = (sortIndex + 1) % images.length;
    goToImage();
}

function nextUncatImage() {
    const categorized = imageToCat.size;
    const total = images.length;
    if (categorized == total) {
        M.toast({
            html: 'No more uncategorized photos'
        });
        return;
    }

    while (true) {
        sortIndex = (sortIndex + 1) % images.length;
        const imPath = images[sortIndex];
        if (!imageToCat.has(imPath)) break;
    }
    goToImage();
}

function prevImage() {
    sortIndex = (sortIndex - 1) % images.length;
    if (sortIndex == -1) {
        sortIndex = images.length - 1;
    }
    goToImage();
}

function resetPage() {
    catToImages.clear();
    imageToCat.clear();
    images.length = 0;
    sortIndex = null;
    $('#img-form').html('');
    $('ul#items img').remove();
}

function streakingFromChanged(e) {
    a = $('#streaking-from :radio:checked');
    console.log(a);
    if (a.val() == 'water-sample') {
        $('select#sample-selector').prop('disabled', false);
        $('select').formSelect();
    }
}

function startSelecting() {
    console.log('selecting started, not implemented');
}

$(document).ready(function(){
    $('select').formSelect();
    $('select').on('change', watersamplesChanged);
    $('#wsid-select button#start-sorting').click(startSorting);
    $('#wsid-select button#start-selecting').click(startSelecting);
    $('#next-btn').click(nextImage);
    $('#prev-btn').click(prevImage);
    $('#next-uncat-btn').click(nextUncatImage);
    $('#streaking-from').on('change', streakingFromChanged);
    document.addEventListener('keypress', modalKeyPress);
    document.addEventListener('keydown', modalKeyDown);
    $('.modal').modal();
    sortModal = M.Modal.getInstance(document.querySelector('#sortModal'));
    const {ipcRenderer} = require('electron');
    ipcRenderer.send('page:loaded');
});

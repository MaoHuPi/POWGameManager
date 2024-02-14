/*
 * 2023 © MaoHuPi
 * maohupiWireworldGame/fileIO.js
 * modified from MaoHuPi - textEditor
 */
let developerMod = false;

let pickerTitle = 'POW Game Manager Project',
    // pickerAcceptMime = 'application/zip',
    pickerAcceptMime = 'application/pow',
    // pickerAcceptExtension = ['.pow', '.zip'];
    pickerAcceptExtension = ['.pow'];
let pickerOptions = {
    excludeAcceptAllOption: true, 
    id: 'POWGameManagerProject',
    types: [
        {
            description: pickerTitle,
            accept: {
                [pickerAcceptMime]: pickerAcceptExtension
            }
        }
    ],
    // startIn: 'documents'
};

const dropMask = document.querySelector('#viewCanvas');

function cancelEvent(event) {
    event.stopPropagation();
    event.preventDefault();
}
function dragOver(event) {
    cancelEvent(event);
    dropMask.setAttribute('dragover', 'true');
}
function dragLeave(event) {
    cancelEvent(event);
    dropMask.setAttribute('dragover', 'false');
}
window.fileEntry = undefined;
async function dropFile(event) {
    dropMask.setAttribute('dragover', 'false');
    var dataTransfer = event.dataTransfer;
    window.fileEntry = undefined;
    try {
        if (dataTransfer.items.length > 0) {
            var item = dataTransfer.items[0];
            if (item.kind === 'file') {
                cancelEvent(event);
                let entry = await item.getAsFileSystemHandle();
                if (entry.kind === 'file') {
                    let file = await entry.getFile();
                    window.fileEntry = entry;
                    loadFile(file, 'file', file.name);
                }
            }
        }
    }
    catch (error) {
        if (developerMod) {
            console.error(error);
        }
        if (dataTransfer.files && dataTransfer.files.length > 0) {
            cancelEvent(event);
            let file = dataTransfer.files[0];
            loadFile(file, 'file', file.name);
        }
    }
}
window.addEventListener("dragenter", dragOver, false);
window.addEventListener("dragover", dragOver, false);
window.addEventListener("dragleave", dragLeave, false);
window.addEventListener("drop", dropFile, false);

async function saveFile(dataBuffer, fileName = 'project.pow') {
    let errorFlag = false;
    try {
        if (!window.fileEntry && 'showSaveFilePicker' in window) {
            window.fileEntry = await window.showSaveFilePicker({ ...pickerOptions, suggestedName: fileName });
            updateLocalFile(window.fileEntry, dataBuffer);
        } else if (window.fileEntry) {
            updateLocalFile(window.fileEntry, dataBuffer);
        } else {
            errorFlag = true;
        }
    } catch (error) {
        if (developerMod) {
            console.error(error);
        }
        // errorFlag = true;
    }
    if (errorFlag) {
        let dlLink = document.createElement('a');
        let blob = new Blob([dataBuffer], { type: "application/zip" });
        dlLink.download = fileName;
        dlLink.href = URL.createObjectURL(blob);
        dlLink.click();
    }
    alert('File Saved!');
}
async function openFile() {
    if (window.showOpenFilePicker) {
        let [entry] = await showOpenFilePicker(pickerOptions);
        if (entry) {
            let file = await entry.getFile();
            window.fileEntry = entry;
            loadFile(file, 'file', file.name);
        }
    } else {
        let input = document.createElement('input');
        input.type = 'file';
        input.setAttribute('description', pickerTitle);
        input.setAttribute('accept', pickerAcceptExtension);
        input.onchange = async (event) => {
            window.fileEntry = undefined;

            if (input.files && input.files.length > 0) {
                let file = input.files[0];
                loadFile(file, 'file', file.name);
            }
        }
        input.click();
    }
}
async function loadFile(arrayBufferOrFile, type = 'arrayBuffer', fileName = 'project.pow') {
    changeProjectName(fileName);
    // if (type == 'file') {
    //     let file = arrayBufferOrFile;
    //     try {
    //         let text = await file.text();
    //         await loadFile(text, 'arrayBuffer', fileName);
    //     }
    //     catch (error) {
    //         if (developerMod) {
    //             console.error(error);
    //         }
    //         let reader = new FileReader();
    //         reader.onloadend = async () => {
    //             await loadFile(reader.result, 'arrayBuffer', fileName);
    //         }
    //         reader.readAsArrayBuffer(file);
    //     }
    // } else if (type == 'arrayBuffer') {
    importProject(arrayBufferOrFile);
    // }
}
async function updateLocalFile(entry, content) {
    let writable = await entry.createWritable();
    await writable.write(content);
    await writable.close();
}
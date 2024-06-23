// Listener for when the extension is installed
chrome.runtime.onInstalled.addListener(createContextMenu);

// Listener for when a context menu item is clicked
chrome.contextMenus.onClicked.addListener(handleContextMenuClick);

function createContextMenu() {
    chrome.contextMenus.create({
        id: "saveMHTML",
        title: "Save as MHTML",
        contexts: ["page"]
    });

    chrome.contextMenus.create({
        id: "uploadMHTML",
        title: "Upload as MHTML",
        contexts: ["page"]
    });
}

function handleContextMenuClick(info, tab) {
    if (tab.status !== "complete") {
        createNotification('The content is not ready yet. Please wait for the page to finish loading.');
        return;
    }

    if (info.menuItemId === "saveMHTML") {
        saveMHTML(tab, defaultHandleFileLoad);
    } else if (info.menuItemId === "uploadMHTML") {
        saveMHTML(tab, handleApiUpload);
    }
}

function waitForTabToLoad(tab) {
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
        if (tabId === tab.id && changeInfo.status === "complete") {
            chrome.tabs.onUpdated.removeListener(listener);
            saveMHTML(tab);
        }
    });
}

function saveMHTML(tab, handleFileLoadCallback) {
    chrome.pageCapture.saveAsMHTML({tabId: tab.id}, (mhtmlData) => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
        }

        let url = new URL(tab.url);
        let domain_name = url.hostname.replace(/\./g, '_');

        chrome.tabs.sendMessage(tab.id, {
            method: "hash",
            data: [url.pathname, tab.title]
        }, (response) => {
            handleResponse(response, mhtmlData, domain_name, handleFileLoadCallback);
        });
    });
}

function handleResponse(response, mhtmlData, domain_name, handleFileLoadCallback) {
    if (chrome.runtime.lastError) {
        createNotification("An error occurred while saving the page. Please try again or refresh the webpage.");
        console.error(chrome.runtime.lastError.message);
        return;
    }

    if (response) {
        let [sha256_path, sha256_title] = response;
        let date = new Date();
        let date_suffix = date.getFullYear() + "_" + (date.getMonth() + 1).toString().padStart(2, '0') + "_" + date.getDate().toString().padStart(2, '0');
        let filename = domain_name + "_" + sha256_path + "_" + sha256_title + "_" + date_suffix + ".mhtml";
        let blob = new Blob([mhtmlData], {type: 'application/mhtml'});

        console.log('Blob size:', blob.size);

        let reader = new FileReader();
        reader.onload = function () {
            handleFileLoadCallback(reader, filename);
        };
        reader.readAsDataURL(blob);
    } else {
        createNotification('The content is not ready yet. Please wait for the page to finish loading.');
    }
}

function defaultHandleFileLoad(reader, filename) {
    let dataUrl = reader.result;
    dataUrl = dataUrl.replace(/Content-Location: (blob:https?:\/\/[^\s]+)/g, (a, href) => {
        const r = new RegExp(href.split('').join('(=\\r\\n)?'), 'g');
        return dataUrl.replace(r, href.replace('blob:', 'cid:blob.'));
    });

    chrome.downloads.download({
        url: dataUrl, filename: filename, saveAs: true
    }, (downloadId) => {
        handleDownload(downloadId, dataUrl, filename);
    });
}

function handleDownload(downloadId, dataUrl, filename) {
    if (chrome.runtime.lastError) {
        handleFilenameIssue(dataUrl, filename);
    } else {
        console.log('Download started with ID:', downloadId);
        createNotification('The page has been saved as MHTML.');
    }
}

function handleFilenameIssue(dataUrl, filename) {
    console.warn('filename issue', filename);

    filename = filename.substring(0, filename.length - 5)
        .substring(0, 254)
        .replace(/[*?"<>|:~]/gi, '-') + '.mhtml';

    chrome.downloads.download({
        url: dataUrl, saveAs: true, filename: filename
    }, (downloadId) => {
        if (chrome.runtime.lastError) {
            console.warn('filename issue', filename);
            chrome.downloads.download({
                url: dataUrl, saveAs: true, filename: 'page.mhtml'
            });
        }
    });
}

function createNotification(message) {
    chrome.notifications.create(`Save as MHTML Notification - ${Date.now()}`, {
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Save as MHTML',
        message: message
    });
}

function handleApiUpload(reader, filename) {
    let dataUrl = reader.result;
    dataUrl = dataUrl.replace(/Content-Location: (blob:https?:\/\/[^\s]+)/g, (a, href) => {
        const r = new RegExp(href.split('').join('(=\\r\\n)?'), 'g');
        return dataUrl.replace(r, href.replace('blob:', 'cid:blob.'));
    });

    // Convert data URL to Blob
    const byteCharacters = atob(dataUrl.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {type: 'application/mhtml'});

    // Create a FormData object
    const formData = new FormData();
    formData.append('file', blob, filename);

    // Send a POST request to your API
    fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
}
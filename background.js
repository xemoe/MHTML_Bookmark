chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "saveMHTML",
        title: "Save as MHTML",
        contexts: ["page"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "saveMHTML") {
        saveMHTML(tab);
    }
});

function saveMHTML(tab) {
    chrome.pageCapture.saveAsMHTML({tabId: tab.id}, (mhtmlData) => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
        }

        let filename = tab.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.mhtml';
        let blob = new Blob([mhtmlData], {type: 'application/mhtml'});

        // debug blob size
        console.log('Blob size:', blob.size);

        let reader = new FileReader();
        reader.onload = function() {
            let dataUrl = reader.result;
            chrome.downloads.download({
                url: dataUrl,
                filename: filename,
                saveAs: true
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    console.warn('filename issue', filename);
                    filename = filename.substr(0, filename.length - 5)
                        .substr(0, 254)
                        .replace(/[*?"<>|:~]/gi, '-') + '.mhtml';

                    chrome.downloads.download({
                        url: dataUrl,
                        saveAs: true,
                        filename: filename
                    }, (downloadId) => {
                        if (chrome.runtime.lastError) {
                            console.warn('filename issue', filename);
                            chrome.downloads.download({
                                url: dataUrl,
                                saveAs: true,
                                filename: 'page.mhtml'
                            });
                        }
                    });
                } else {
                    console.log('Download started with ID:', downloadId);
                }
            });
        };
        reader.readAsDataURL(blob);
    });
}
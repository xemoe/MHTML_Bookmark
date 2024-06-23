chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "saveMHTML", title: "Save as MHTML", contexts: ["page"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "saveMHTML") {
        // Wait for the tab to finish loading before saving as MHTML
        if (tab.status === "complete") {
            saveMHTML(tab);
        } else {
            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                if (tabId === tab.id && changeInfo.status === "complete") {
                    chrome.tabs.onUpdated.removeListener(listener);
                    saveMHTML(tab);
                }
            });
        }
    }
});

function saveMHTML(tab) {
    chrome.pageCapture.saveAsMHTML({tabId: tab.id}, (mhtmlData) => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
        }

        // Parse the URL to get the domain name and replace "." with "_"
        let url = new URL(tab.url);
        let domain_name = url.hostname.replace(/\./g, '_');

        // Send a message to the content script to generate SHA-256 hash for the path and title
        chrome.tabs.sendMessage(tab.id, {
            method: "hash",
            data: [url.pathname, tab.title]
        }, (response) => {

            if (chrome.runtime.lastError) {
                chrome.notifications.create(`Save as MHTML Notification - ${Date.now()}`, {
                    type: 'basic',
                    iconUrl: 'icon48.png',
                    title: 'Save as MHTML',
                    message: "An error occurred while saving the page. Please try again or refresh the webpage."
                });
                console.error(chrome.runtime.lastError.message);
                return;
            }

            if (response) {
                let [sha256_path, sha256_title] = response;
                let date = new Date();
                let date_suffix = date.getFullYear() + "_" + (date.getMonth() + 1).toString().padStart(2, '0') + "_" + date.getDate().toString().padStart(2, '0');
                let filename = domain_name + "_" + sha256_path + "_" + sha256_title + "_" + date_suffix + ".mhtml";
                let blob = new Blob([mhtmlData], {type: 'application/mhtml'});

                //
                // debug blob size
                //
                console.log('Blob size:', blob.size);

                let reader = new FileReader();
                reader.onload = function () {
                    let dataUrl = reader.result;
                    dataUrl = dataUrl.replace(/Content-Location: (blob:https?:\/\/[^\s]+)/g, (a, href) => {
                        const r = new RegExp(href.split('').join('(=\\r\\n)?'), 'g');
                        return dataUrl.replace(r, href.replace('blob:', 'cid:blob.'));
                    });

                    // Create a download item from the data URL
                    chrome.downloads.download({
                        url: dataUrl, filename: filename, saveAs: true
                    }, (downloadId) => {
                        if (chrome.runtime.lastError) {
                            console.warn('filename issue', filename);
                            filename = filename.substr(0, filename.length - 5)
                                .substr(0, 254)
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
                        } else {
                            console.log('Download started with ID:', downloadId);
                            chrome.notifications.create(`Save as MHTML Notification - ${Date.now()}`, {
                                type: 'basic',
                                iconUrl: 'icon48.png',
                                title: 'Save as MHTML',
                                message: 'The page has been saved as MHTML.'
                            });
                        }
                    });
                };
                reader.readAsDataURL(blob);
            } else {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icon48.png',
                    title: 'Save as MHTML',
                    message: 'The content is not ready yet. Please wait for the page to finish loading.'
                });
            }
        })
    });
}
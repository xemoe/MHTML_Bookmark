chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.method === "hash") {
        Promise.all(request.data.map(data =>
            window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
                .then(hash => Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join(''))
        )).then(hashes => {
            sendResponse(hashes);
            return true;  // Will respond asynchronously.
        });
        return true;  // Will respond asynchronously.
    }
});
# Save / Upload MHTML Chrome Extension

This is a Chrome extension that allows users to save the current webpage as an MHTML file or upload it to an API server. <br/>
The extension adds two options to the context menu: "Save as MHTML" and "Upload as MHTML".

## Features

- **Save as MHTML**: This option allows users to save the current webpage as an MHTML file. The file is downloaded to the user's local system.
- **Upload as MHTML**: This option allows users to upload the current webpage as an MHTML file to an API server.

## Usage

1. Right-click on the webpage you want to save or upload.
2. Select either "Save as MHTML" or "Upload as MHTML" from the context menu.

## Permissions

The extension requires the following permissions:

- `activeTab`: To access the current tab.
- `contextMenus`: To add items to the context menu.
- `downloads`: To download the MHTML file.
- `pageCapture`: To capture the current webpage as MHTML.
- `notifications`: To display notifications.

## Installation
To install the extension, follow the standard procedure for installing Chrome extensions.

1. Clone the repository or download the ZIP file.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click on "Load unpacked" and select the extension directory.


Please note that the "Upload as MHTML" feature requires a server-side API to receive the POST request. <br/>
The API URL is currently set to 'http://localhost:3001/api/upload' and should be updated to your actual API URL.

## Code Structure

The extension consists of three main JavaScript files:

- `background.js`: This file contains the main logic for creating the context menu and handling the user's selection. It also contains the functions for saving the webpage as MHTML and uploading it to the API.

- `content.js`: This file contains a message listener for hashing the URL path and title of the webpage.

- `manifest.json`: This file contains the metadata for the extension, including its name, version, description, permissions, and the paths to the JavaScript and icon files.

---

## TODO

- [ ] Add support for custom API URLs set by the user.
- [ ] Add support for browser shortcut keys. (e.g., Ctrl + S for saving as MHTML, Ctrl + U for uploading as MHTML)
- [ ] Add support for shortcut keys set by the user.
- [ ] Add detection for existing MHTML url in [bookmark service](https://github.com/xemoe/bookmark_service).

### Suggestions for Improvement

- **Error Handling:** Improve error handling in your extension. For instance, you could add more detailed <br/>
  error messages to help users troubleshoot issues. Also, consider retry mechanisms for network requests.
- **Progress Indicator:** When the user chooses to upload an MHTML file, it might take some time for <br/>
  the operation to complete. Showing a progress indicator would improve the user experience.
- **Extension Icon:** Use the extension's icon to show the status of the last operation (success, failure, in progress).


## Contributing

Contributions are welcome. Please open an issue or submit a pull request on GitHub.
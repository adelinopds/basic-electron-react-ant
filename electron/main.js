const { 
	app, 
	protocol, 
	BrowserWindow, 
	session, 
	ipcMain, 
	Menu 
} = require('electron')
const {
	default: installExtension,
	REACT_DEVELOPER_TOOLS
} = require('electron-devtools-installer')
const Store = require('secure-electron-store').default
const path = require('path')
const fs = require('fs')
const Protocol = require('./protocol')
const isDev = process.env.NODE_ENV === "development"
const hostDevelopment = 'http://localhost:9090/' 

let mainWindow

async function createWindow(){
	if(!isDev) protocol.registerBufferProtocol(Protocol.scheme, Protocol.requestHandler)

	mainWindow= new BrowserWindow({
		width: 800,
		height: 600,
		title: "SG-APP initializing..",
		webPreferences: {
			devTools: isDev,
			nodeIntegration: false,
			nodeIntegrationInSubFrames: false,
			nodeIntegrationInWorker: false,
			contextIsolation: true,
			enableRemoteModule: false,
			additionalArguments: [`storePath:${app.getPath("userData")}`],
			preload: path.join(__dirname, "preload.js"),
			disableBlinkFeactures: "Auxclick"
		}
	})

	const store = new Store({ path: app.getPath("userData")	})
	const storeCallback = (success, initialStore) => {
		console.warn(`${!success ? "Un-s" : "S"}uccessfully retrieved store in main process.`)
		console.log(initialStore)
	} 
	store.mainBindings(ipcMain, mainWindow, fs, storeCallback)

	mainWindow.loadURL(
		isDev
			? hostDevelopment
			: `${Protocol.scheme}://rse/index.html`
	)

	if(isDev) { 
		mainWindow.webContents.once("dom-ready", async () => {
		await installExtension(REACT_DEVELOPER_TOOLS)
			.then(name => console.log(`ADDED Extensin: ${name}`))
			.catch(err => console.warn("Error occurred: ", err ))
			.finally(() => {
				require("electron-debug")() 
				mainWindow.webContents.openDevTools()
			})
		})
	}

	mainWindow.on("closed", () => mainWindow = null)

	const SES = session
	const partition = "default"
	SES.fromPartition(partition)
		.setPermissionCheckHandler((webContents, permission, permCallback) => {
			let allowedPermissions = []

			if (allowedPermissions.includes(permission)) {
        permCallback(true)
      } else {
        console.error(
          `The application tried to request permission for '${permission}'. This permission was not whitelisted and has been blocked.`
        )

        permCallback(false)
      }
		} )

}//end func createWindow

protocol.registerSchemesAsPrivileged([{
  scheme: Protocol.scheme,
  privileges: {
    standard: true,
    secure: true
  }
}])

app.on("ready", createWindow)

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  } else {
    //i18nextBackend.clearMainBindings(ipcMain);
    //ContextMenu.clearMainBindings(ipcMain);
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});
// https://electronjs.org/docs/tutorial/security#12-disable-or-limit-navigation
app.on("web-contents-created", (event, contents) => {
  contents.on("will-navigate", (contentsEvent, navigationUrl) => { /* eng-disable LIMIT_NAVIGATION_JS_CHECK  */
    const parsedUrl = new URL(navigationUrl);
    const validOrigins = [selfHost];

    // Log and prevent the app from navigating to a new page if that page's origin is not whitelisted
    if (!validOrigins.includes(parsedUrl.origin)) {
      console.error(
        `The application tried to redirect to the following address: '${parsedUrl}'. This origin is not whitelisted and the attempt to navigate was blocked.`
      );

      contentsEvent.preventDefault();
      return;
    }
  });

  contents.on("will-redirect", (contentsEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const validOrigins = [];

    // Log and prevent the app from redirecting to a new page
    if (!validOrigins.includes(parsedUrl.origin)) {
      console.error(
        `The application tried to redirect to the following address: '${navigationUrl}'. This attempt was blocked.`
      );

      contentsEvent.preventDefault();
      return;
    }
  });

  // https://electronjs.org/docs/tutorial/security#11-verify-webview-options-before-creation
  contents.on("will-attach-webview", (contentsEvent, webPreferences, params) => {
    // Strip away preload scripts if unused or verify their location is legitimate
    delete webPreferences.preload;
    delete webPreferences.preloadURL;

    // Disable Node.js integration
    webPreferences.nodeIntegration = false;
  });

  // https://electronjs.org/docs/tutorial/security#13-disable-or-limit-creation-of-new-windows
  contents.on("new-window", (contentsEvent, navigationUrl) => { /* eng-disable LIMIT_NAVIGATION_JS_CHECK */
    const parsedUrl = new URL(navigationUrl);
    const validOrigins = [];

    // Log and prevent opening up a new window
    if (!validOrigins.includes(parsedUrl.origin)) {
      console.error(
        `The application tried to open a new window at the following address: '${navigationUrl}'. This attempt was blocked.`
      );

      contentsEvent.preventDefault();
      return;
    }
  });
});
// https://electronjs.org/docs/tutorial/security#16-filter-the-remote-module
app.on("remote-require", (event, webContents, moduleName) => {
  event.preventDefault();
});
// built-ins are modules such as "app"
app.on("remote-get-builtin", (event, webContents, moduleName) => {
  event.preventDefault();
});
app.on("remote-get-global", (event, webContents, globalName) => {
  event.preventDefault();
});
app.on("remote-get-current-window", (event, webContents) => {
  event.preventDefault();
});
app.on("remote-get-current-web-contents", (event, webContents) => {
  event.preventDefault();
});
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
const hostDevelopment = 'http://localhost:9090' 

let mainWindow

async function createWindow(){
	isDev && protocol.registerBufferProtocol(Protocol.scheme, Protocol.requestHandler)

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

	const store = new Store({ patch: app.getPath("userData")	})
	const storeCallback = (success, initialStore) => {
		console.warn(`${!success ? "Un-s" : "S"}uccessfully retrieved store in main process.`)
		console.log(initialStore)
	} 
	store.mainBindings(ipcMain, mainWindow, fs, storeCallback)


	if(isDev){
		mainWindow.loadURL(hostDevelopment)
	}else{
		mainWindow.loadFile(`${Protocol.scheme}`)
	}

	isDev && mainWindow.webContents.once("dom-ready", async () => {
		await installExtension([REACT_DEVELOPER_TOOLS])
			.then(name => console.log(`ADDED Extensin: ${name}`))
			.catch(err => console.warn("Error occurred: ", err ))
			.finally(() => {
				require("electron-debug")() 
				mainWindow.webContents.openDevTools()
			})
	})

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


}//fim FN createWindow

protocol.registerSchemesAsPrivileged([{
  scheme: Protocol.scheme,
  privileges: {
    standard: true,
    secure: true
  }
}])

app.on("ready", createWindow)


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
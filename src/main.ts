import {app, BrowserWindow, ipcMain} from 'electron';
import path from 'path';
import log from 'electron-log/main';
import {updateElectronApp, UpdateSourceType} from "update-electron-app";
import pcsclite from 'pcsclite'
import {handleIDCard} from "./idCard/handleIDCard";
import {handleMedCard} from "./medCard/handleMedCard";
import {
    ActivateApplicationDataResponse,
    ReadCardCommand
} from "./types/types";
import {Loading} from "quasar";
// import chokidar, {FSWatcher} from 'chokidar';
// import fs from "fs";
// @ts-expect-error no types
import started from "electron-squirrel-startup";
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// if (require('electron-squirrel-startup')) {
//     app.quit();
// }

if (started) {
    app.quit();
}

updateElectronApp({
    updateSource: {
        type: UpdateSourceType.ElectronPublicUpdateService,
        repo: 'dev-uros/e-kasa-desktop-companion',
        host: 'https://update.electronjs.org',
    },
    updateInterval: '1 hour',
    logger: log
})


const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    // Open the DevTools in development mode.
    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools({
            mode: 'detach',
        });
    }

    return mainWindow;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// Get a cross-platform path for the user's Documents directory
// const documentsPath = app.getPath('documents'); // Can be 'desktop', 'downloads', 'home', etc.
// const directoryToWatch = path.join(documentsPath, 'scanner');



// let watcher: FSWatcher
const scanDocument = (browserWindow: BrowserWindow) => {
    // watcher = chokidar.watch(directoryToWatch, {ignoreInitial: true});
    //
    // return new Promise((resolve, reject) => {
    //     watcher.on('add', (path) => {
    //         console.log(path)
    //         fs.readFile(path, (err, data) => {
    //             if (err) {
    //                 console.error('Error reading file:', err);
    //                 return reject(err.message);
    //             }
    //
    //             // Convert file content to Base64
    //             const base64Content = data.toString('base64');
    //             browserWindow.webContents.send('document-scanned', base64Content);
    //
    //             cancelWatcher();
    //             return resolve(true);
    //
    //         });
    //     })
    // })
}


const cancelWatcher = () => {
    // watcher.close().then(() => {
    //     log.info('watcher is closing')
    // }).catch((e)=>{
    //     log.error(e.message);
    // })
}

ipcMain.on('scan-document', async (event) => {
    // const browserWindow = BrowserWindow.fromWebContents(event.sender);
    //
    // browserWindow.webContents.send('insert-document-in-scanner');
    // try {
    //     await scanDocument(browserWindow)
    //     console.log('skeniram se')
    // } catch (e) {
    //     log.error(e);
    // }
})

ipcMain.on('cancel-document-scan', async (event) => {
    // const browserWindow = BrowserWindow.fromWebContents(event.sender);
    //
    // watcher.close().then(() => {
    //     log.info('watcher is closing')
    // }).catch((e)=>{
    //     log.error(e.message);
    // })

})
// @ts-ignore
let pcsc;

// @ts-ignore
let cardReader;
const initCardReader = async (browserWindow: BrowserWindow, readCommand: ReadCardCommand) => {


    log.info('Initializing card read')
    pcsc = await pcsclite()


    browserWindow.webContents.send('insert-card-reader-into-device');
    Loading.show({message: 'Ubacite citac licne karte u kompjuter'});

    pcsc.on('reader', reader => {

        cardReader = reader;

        log.info('New reader detected', reader.name)

        reader.on('error', err => {
            log.error('Error(', reader.name, '):', err.message)
        })

        reader.on('status', (status) => {
            log.info('Status(', reader.name, '):', status)
            const changes = reader.state ^ status.state
            if (changes) {
                if ((changes & reader.SCARD_STATE_EMPTY) && (status.state & reader.SCARD_STATE_EMPTY)) {
                    //emituj event - Molimo ubacite licnu kartu u citac

                    browserWindow.webContents.send('insert-card-into-reader');

                    log.info('Card removed')
                    reader.disconnect(reader.SCARD_LEAVE_CARD, err => {
                        if (err) {
                            log.error('Error(', reader.name, '):', err.message)
                            browserWindow.webContents.send('display-error', err.message);
                            reader.close()

                            // @ts-ignore
                            pcsc.close()
                            return;
                        } else {
                            log.info('Disconnected')
                            return;
                        }
                    })
                } else if ((changes & reader.SCARD_STATE_PRESENT) && (status.state & reader.SCARD_STATE_PRESENT)) {
                    //emituj event loading
                    console.log('LOGUJEM STATUS')
                    console.log();
                    log.info('Card inserted')
                    browserWindow.webContents.send('card-inserted-into-reader');

                    reader.connect({share_mode: reader.SCARD_SHARE_SHARED}, async (err, protocol) => {
                        if (err) {
                            log.error('Error(', reader.name, '):', err.message)

                            browserWindow.webContents.send('display-error', err.message);
                            reader.close()

                            // @ts-ignore
                            pcsc.close()
                            return;
                        } else {

                            if (readCommand === ReadCardCommand.READ_ID_CARD) {
                                try {
                                    browserWindow.webContents.send('reading-id-card');

                                    // @ts-ignore
                                    const idCardData = await handleIDCard(pcsc, reader, protocol, browserWindow)
                                    reader.close()

                                    // @ts-ignore
                                    pcsc.close()
                                    browserWindow.webContents.send('card-data-loaded', idCardData)
                                } catch (e) {
                                    log.error('Error(', reader.name, '):', e.message)
                                    browserWindow.webContents.send('display-error', e.message);
                                    reader.close()

                                    // @ts-ignore
                                    pcsc.close()
                                }
                                return;
                            }

                            if (readCommand === ReadCardCommand.READ_MED_CARD) {
                                try {
                                    browserWindow.webContents.send('reading-med-card');


                                    // @ts-ignore
                                    const medCardData = await handleMedCard(pcsc, reader, protocol, browserWindow)
                                    reader.close()

                                    // @ts-ignore
                                    pcsc.close()
                                    browserWindow.webContents.send('card-data-loaded', medCardData)
                                } catch (e) {

                                    log.error('Error(', reader.name, '):', e.message)

                                    browserWindow.webContents.send('display-error', e.message);
                                    reader.close()

                                    // @ts-ignore
                                    pcsc.close()
                                }
                                return;
                            }
                            browserWindow.webContents.send('display-error', 'Ubačeni tip kartice nije podržan');
                            reader.close()

                            // @ts-ignore
                            pcsc.close()
                            return;

                        }
                    })
                }
            }
        })

        reader.on('end', () => {
            log.info('Reader', reader.name, 'removed')
        })
    })


    pcsc.on('error', err => {

        log.info('PCSC error', err.message)

    })


}


ipcMain.on('initialize-card-reader', async (event, cardReaderCommand: ReadCardCommand) => {

    const browserWindow = BrowserWindow.fromWebContents(event.sender);

    if (cardReaderCommand === ReadCardCommand.CANCEL_CARD_READ) {
        cancelCardRead()
        return
    }
    try {
        await initCardReader(browserWindow, cardReaderCommand);

    } catch (e) {

        log.error(e);
    }

})


const cancelCardRead = () => {
    console.log('USAO U CANCEL')

    // @ts-ignore
    if (pcsc) {

        // @ts-ignore
        pcsc.close();
    }

    // @ts-ignore
    if (cardReader) {

        // @ts-ignore
        cardReader.close()
    }

}

const submitForm = async (browserWindow: BrowserWindow, appActivationKey: string) => {
    // const $q = useQuasar();
    const submitFormUrl = process.env.NODE_ENV === 'development' ?
        'http://localhost:3000/desktop-client/activate' :
        'https://ekasa-websocket.urosminic.com/desktop-client/activate'

    const data = {
        activation_key: appActivationKey
    }
    try {
        const response = await fetch(submitFormUrl, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization" : `Bearer ${appActivationKey}`
            },
            body: JSON.stringify(data)
        });
        // const jsonResponse = await response.json() as ActivateApplicationDataResponse;
        const status = response.status;

        switch (status) {
            case 200:
                browserWindow.webContents.send('app-activated', appActivationKey)
                break;
            case 401:
                browserWindow.webContents.send('app-key-invalid', 'Aktivacioni ključ nije validan')
                break;
            default:
                browserWindow.webContents.send('activation-api-server-error', 'Došlo je do greške, molimo obratite se IT podršci!')
                break;
        }

    } catch (e) {
        browserWindow.webContents.send('activation-api-server-error', 'Došlo je do greške, molimo obratite se IT podršci!')
    }

}

ipcMain.on('activate-app', async (event, activationKey) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender);

    console.log('udje ovde');
    console.log({activationKey})
    await submitForm(browserWindow, activationKey);
})

ipcMain.handle('get-web-socket-url', () => {
     if(app.isPackaged){
         return 'wss://ekasa-websocket.urosminic.com/desktop-client';
     }else{
         return 'ws://localhost:3000/desktop-client';
     }
})
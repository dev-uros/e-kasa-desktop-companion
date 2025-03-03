import {app, BrowserWindow, ipcMain, shell} from 'electron';
import net from 'node:net';
import path from 'path';
import log from 'electron-log/main';
import {updateElectronApp, UpdateSourceType} from "update-electron-app";
import pcsclite from 'pcsclite'
import {handleIDCard} from "./idCard/handleIDCard";
import {handleMedCard} from "./medCard/handleMedCard";
import {
    ActivateApplicationDataResponse, PosPaymentMessage,
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


const FS = String.fromCharCode(0x1C); // Field Separator (0x1C)
const RS = String.fromCharCode(0x1E);
const ETX = String.fromCharCode(0x03); // End of Text (e0x03)
let HOST = "";
const PORT = 1401;

let client: net.Socket

const initLogSending = () => {
    const logFilePath = log.transports.file.getFile().path;

    // Open the default email client
    shell.openExternal(`mailto:minic.uros.94@gmail.com?subject=OkoiOko Desktop Companion Logs&body=Pored prozora za slanje mejla, otvoren je i prozor koji sadrži log fajl ove aplikacije. Stavite ga kao prilog mejla i pošaljite`)
        .then(() => {
            // Open the log file location so user can attach it manually
            shell.showItemInFolder(logFilePath);
        });


}
const setPosIpAddress = (browserWindow: BrowserWindow, posIpAddress: string) => {

    if (!client) {
        HOST = posIpAddress;
        log.info('Client does not exist, setting pos ip address:' + posIpAddress)
        return
    }

    if (client && client.destroyed) {
        HOST = posIpAddress;
        log.info('Client exists, is destroyed connection, setting pos ip address:' + posIpAddress)
        return
    }

    browserWindow.webContents.send('display-error', 'Ne možete promeniti IP adresu POS uređaja dok je komunikacija sa uređajem u toku!');
}

const connectAsync = () => {
    return new Promise((resolve, reject) => {
        console.log('pokusava da napravim konekciju')
        const timeout = setTimeout(() => {
            log.info("Connection timeout: terminating process.");
            client.destroy();
            resolve(false);
        }, 5000); // 5-second timeout

        client.connect(PORT, HOST, () => {
            clearTimeout(timeout);
            log.info('Povezano na Pos, cistim timeout')
            resolve(true)
        });
        client.on("error", (err) => {
            clearTimeout(timeout);
            log.info('Greška pri povezivanju na Pos, čistim timeout')

            resolve(false)
        });
    });
};

let lastMessageTimeStamp: null | number = null;

const initPosPayment = async (browserWindow: BrowserWindow, makePosPaymentMessage: PosPaymentMessage) => {
    browserWindow.webContents.send('pos-payment-initialized');

    //(treba da primi iznos, broj rata, transaction id)

    if(!lastMessageTimeStamp){
        lastMessageTimeStamp = Date.now()
    }else{
        const newMessageTimeStamp = Date.now();
        if(newMessageTimeStamp - lastMessageTimeStamp < 5000){
            browserWindow.webContents.send('display-error', 'Pos terminal nije spreman za novu komandu, pokušajte ponovo');

            return;
        }
    }


    log.info('Attempting to connect...');

    client = new net.Socket();

    const connectionState = await connectAsync();

    if(!connectionState){
        browserWindow.webContents.send('display-error', 'Neuspešno povizivanje sa pos uređajem');

        return;
    }

    log.info(`Connected to ${HOST}:${PORT}`);

    //payment
    const now = new Date();
    const serbianTime = now.toLocaleString('sv-SE', {timeZone: 'Europe/Belgrade', hour12: false});
    const transactionDate = serbianTime.slice(2, 10).replace(/-/g, ""); // YYMMDD
    const transactionTime = serbianTime.slice(11, 19).replace(/:/g, "");

    //slati sa web-a
    const transactionId = makePosPaymentMessage.transactionId;
    const ecrId = "000001";
    const messageType = 'REQ';
    const transactionType = "00"
    const amount = makePosPaymentMessage.amount
        //
    let installmentsAddition = '';
    if (makePosPaymentMessage.installmentsCount !== "00") {
        log.info(`Entered ${makePosPaymentMessage.installmentsCount} installments`)
        installmentsAddition = `${FS}C${makePosPaymentMessage.installmentsCount}00`
    } else {
        log.info(`Entered NO installments`)
        installmentsAddition = `${FS}CFFFF`

    }
    const statusCode = '000';
    const message = `${transactionId}${ecrId}${messageType}${transactionType}${transactionDate}${transactionTime}${statusCode}${FS}A${amount}${installmentsAddition}${ETX}`;

    client.write(message, () => {
        log.info('Message sent: ' + message)
    });
// Handle incoming data

    client.on("data", (data) => {
        const response = data.toString();

        if (response === transactionId) {
            log.info('ACK received: ' + response);


        } else {
            log.info(`Response received:${response.trim()}`);
            const statusCode = response.slice(31, 34);
            let responseMessage;
            switch (statusCode) {
                case "000":
                    log.info("Plaćanje uspešno");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Plaćanje uspešno",
                        response: response.trim(),
                        request: message
                    };

                    break;
                case "100":
                    log.info("Nema papira u fiskalnom štampaču");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Nema papira u fiskalnom štampaču",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "110":
                    log.info("Nema komunikacije sa bankom");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Nema komunikacije sa bankom",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "120":
                    log.info("Neispravan format poruke");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Neispravan format poruke",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "200":
                    log.info("Transakcija nije podržana");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Transakcija nije podržana",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "210":
                    log.info("Kartica nije podržana");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Kartica nije podržana",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "211":
                    log.info("Neispravna kartica");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Neispravna kartica",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "212":
                    log.info("Kartica je istekla");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Kartica je istekla",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "220":
                    log.info("Neispravan broj računa");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Neispravan broj računa",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "230":
                    log.info("Neispravan kod valute");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Neispravan kod valute",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "231":
                    log.info("Predautorizacija je istekla");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Predautorizacija je istekla",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "232":
                    log.info("Predautorizacija nije pronađena");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Predautorizacija nije pronađena",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "233":
                    log.info("Predautorizacija je već završena");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Predautorizacija je već završena",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "234":
                    log.info("Predautorizacija je već otkazana");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Predautorizacija je već otkazana",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "300":
                    log.info("Nedostaje kripto ključ");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Nedostaje kripto ključ",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "400":
                    log.info("Memorija terminala je puna");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Memorija terminala je puna",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "401":
                    log.info("Memorija terminala je prazna");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Memorija terminala je prazna",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "410":
                    log.info("Greška u memoriji terminala");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Greška u memoriji terminala",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "500":
                    log.info("Korisnik je otkazao plaćanje");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Korisnik je otkazao plaćanje",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "510":
                    log.info("Vreme isteklo pre autorizacije");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Vreme isteklo pre autorizacije",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "600":
                    log.info("Terminal je zauzet");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Terminal je zauzet",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "601":
                    log.info("Terminal je zauzet – preuzimanje podataka u toku");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Terminal je zauzet – preuzimanje podataka u toku",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "602":
                    log.info("Terminal je zauzet – obrada dnevnog izveštaja u toku");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Terminal je zauzet – obrada dnevnog izveštaja u toku",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "700":
                    log.info("Poslednja transakcija nije dostupna");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Poslednja transakcija nije dostupna",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "800":
                    log.info("Storno transakcije");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Storno transakcije",
                        response: response.trim(),
                        request: message
                    };
                    break;
                case "900":
                    log.info("Opšta greška terminala");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Opšta greška terminala",
                        response: response.trim(),
                        request: message
                    };
                    break;
                default:
                    log.info("Nepoznat status kod");
                    responseMessage = {
                        statusCode: statusCode,
                        statusCodeDisplay: "Nepoznat status kod",
                        response: response.trim(),
                        request: message
                    };
            }
            log.info('Transaction complete sending ACK back: ' + transactionId)
            client.write(transactionId)
            if (statusCode === "000") {
                disconnectPos();
                // setTimeout(() => {
                //     log.info('Disconnecting POS by timeout 7sec')
                //     disconnectPos();
                // }, 7000)
            } else {
                disconnectPos();
            }
            lastMessageTimeStamp = Date.now();
            browserWindow.webContents.send('pos-transaction-finished', responseMessage);


        }

    });

// Handle connection close
    client.on("close", () => {
        log.info("Connection closed");
    });

// Handle errors
    client.on("error", (err) => {
        log.error("Error:", err.message);
        lastMessageTimeStamp = Date.now();
        browserWindow.webContents.send('display-error', err.message);

        client.destroy();
    });

}

function getCurrentDateTime() {
    const now = new Date();

    const year = now.getFullYear().toString().slice(2); // Get last two digits of the year
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Get month, zero-padded
    const day = String(now.getDate()).padStart(2, '0'); // Get day, zero-padded
    const hour = String(now.getHours()).padStart(2, '0'); // Get hour, zero-padded
    const minute = String(now.getMinutes()).padStart(2, '0'); // Get minute, zero-padded
    const second = String(now.getSeconds()).padStart(2, '0'); // Get second, zero-padded

    const date = `${year}${month}${day}`;
    const time = `${hour}${minute}${second}`;

    return {
        date,
        time
    };
}

const disconnectPos = async () => {
    client.destroy();
    log.log('Client DESTROYED')

}


ipcMain.on('initialize-pos-make-payment', async (event, makePosPaymentMessage) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender);

    try {
        await initPosPayment(browserWindow, makePosPaymentMessage);

    } catch (e) {
        log.error(e);

    }

})

ipcMain.on('disconnect-pos', async (event) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender);

    try {
        await disconnectPos(browserWindow);

    } catch (e) {
        log.error(e);

    }

})


const cancelCardRead = () => {

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
                "Authorization": `Bearer ${appActivationKey}`
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

    await submitForm(browserWindow, activationKey);
})

ipcMain.handle('get-web-socket-url', () => {
    if (app.isPackaged) {
        return 'wss://ekasa-websocket.urosminic.com/desktop-client';
    } else {
        return 'ws://localhost:3000/desktop-client';
    }
})

ipcMain.on('set-pos-ip-address', (event, posIpAddress) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender);

    setPosIpAddress(browserWindow, posIpAddress);
})

ipcMain.on('init-log-sending', (event) => {
    initLogSending();
})
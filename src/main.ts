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


const initLogSending = () => {
    const logFilePath = log.transports.file.getFile().path;

    shell.showItemInFolder(logFilePath);
    // Open the default email client
    // shell.openExternal(`mailto:minic.uros.94@gmail.com?subject=OkoiOko Desktop Companion Logs&body=Pored prozora za slanje mejla, otvoren je i prozor koji sadrži log fajl ove aplikacije. Stavite ga kao prilog mejla i pošaljite`)
    //     .then(() => {
    //         // Open the log file location so user can attach it manually
    //         shell.showItemInFolder(logFilePath);
    //     });


}

const FS = String.fromCharCode(0x1C); // Field Separator (0x1C)
const RS = String.fromCharCode(0x1E);
const ETX = String.fromCharCode(0x03); // End of Text (e0x03)
let HOST = "";
const PORT = 1401;

let client: net.Socket
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
    log.info('DID NOT SET POS IP ADDRESS: ' + posIpAddress);
    log.info(client.readyState)

    browserWindow.webContents.send('display-error', 'Ne možete promeniti IP adresu POS uređaja dok je komunikacija sa uređajem u toku!');
}

const connectAsync = () => {
    return new Promise((resolve, reject) => {

        log.info('pokusava da napravi konekciju')
        log.info('HOST: ' + HOST)
        log.info('PORT:' + PORT)

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
        client.once("error", (err) => {
            clearTimeout(timeout);
            log.info('Greška pri povezivanju na Pos, čistim timeout')
            log.info('Error message:' + err.message)
            log.info('Error name:' + err.name)
            log.info('Error stack:' + err.stack)


            log.info('CLIENT DESTROYED')
            client.destroy();
            client.removeAllListeners();

            log.info('CLIENT READY STATE: ' + client.readyState)
            log.info('CLIENT DESTROYED: ' + client.destroyed)
            log.info('CLIENT CLOSED: ' + client.closed)

            resolve(false)
        });
    });
};

let lastMessageTimeStamp: null | number = null;

const initPosPayment = async (browserWindow: BrowserWindow, makePosPaymentMessage: PosPaymentMessage) => {
    browserWindow.webContents.send('pos-payment-initialized');

    //(treba da primi iznos, broj rata, transaction id)

    if (!lastMessageTimeStamp) {
        lastMessageTimeStamp = Date.now()
    } else {
        const newMessageTimeStamp = Date.now();
        if (newMessageTimeStamp - lastMessageTimeStamp < 5000) {
            browserWindow.webContents.send('display-error', 'Pos terminal nije spreman za novu komandu, pokušajte ponovo');

            return;
        }
    }

    if (client) {
        log.info('destroying previous client')
        client.destroy()
        client.removeAllListeners();
        log.info('removing listeners from previous client')
    }

    log.info('Attempting to connect...');

    client = new net.Socket();

    const connectionState = await connectAsync();

    if (!connectionState) {
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
                const responseDetailCode = response.slice(95, 99);
                switch (responseDetailCode) {
                    case "050":
                        log.info("Opšti");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Opšti",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "051":
                        log.info("Kartica je istekla");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Kartica je istekla",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "052":
                        log.info("Prekoračen broj pokušaja unosa PIN-a");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Prekoračen broj pokušaja unosa PIN-a",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "053":
                        log.info("Deljenje nije dozvoljeno");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Deljenje nije dozvoljeno",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "054":
                        log.info("Nedostaje sigurnosni modul");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nedostaje sigurnosni modul",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "055":
                        log.info("Nevažeća transakcija");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nevažeća transakcija",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "056":
                        log.info("Transakciju ne podržava institucija");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Transakciju ne podržava institucija",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "057":
                        log.info("Izgubljena ili ukradena kartica");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Izgubljena ili ukradena kartica",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "058":
                        log.info("Nevažeći status kartice");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nevažeći status kartice",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "059":
                        log.info("Ograničen status");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Ograničen status",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "060":
                        log.info("Račun nije pronađen u bazi korisnika");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Račun nije pronađen u bazi korisnika",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "061":
                        log.info("Zapis pozitivnog stanja računa nije pronađen");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Zapis pozitivnog stanja računa nije pronađen",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "062":
                        log.info("Greška pri ažuriranju pozitivnog stanja računa");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Greška pri ažuriranju pozitivnog stanja računa",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "063":
                        log.info("Nevažeći tip autorizacije u bazi institucije");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nevažeći tip autorizacije u bazi institucije",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "064":
                        log.info("Loši podaci sa trake");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Loši podaci sa trake",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "065":
                        log.info("Ispravka nije dozvoljena u bazi institucije");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Ispravka nije dozvoljena u bazi institucije",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "066":
                        log.info("Nevažeći iznos unapred za kreditnu karticu");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nevažeći iznos unapred za kreditnu karticu",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "067":
                        log.info("Nevažeći datum transakcije");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nevažeći datum transakcije",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "068":
                        log.info("Greška u fajlu dnevnika transakcija");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Greška u fajlu dnevnika transakcija",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "069":
                        log.info("Loše uređena poruka");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Loše uređena poruka",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "070":
                        log.info("Nema zapisa u bazi institucije");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nema zapisa u bazi institucije",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "071":
                        log.info("Nevažeće usmeravanje ka glavnoj aplikaciji");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nevažeće usmeravanje ka glavnoj aplikaciji",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "072":
                        log.info("Kartica na nacionalnoj negativnoj listi");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Kartica na nacionalnoj negativnoj listi",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "073":
                        log.info("Nevažeće usmeravanje autorizacionog servisa");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nevažeće usmeravanje autorizacionog servisa",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "074":
                        log.info("Nije moguće autorizovati");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nije moguće autorizovati",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "075":
                        log.info("Nevažeća dužina PAN-a");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nevažeća dužina PAN-a",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "076":
                        log.info("Nedovoljna sredstva na računu sa pozitivnim stanjem");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nedovoljna sredstva na računu sa pozitivnim stanjem",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "077":
                        log.info("Preautorizacija popunjena");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Preautorizacija popunjena",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "078":
                        log.info("Duplikat transakcije primljen");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Duplikat transakcije primljen",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "079":
                        log.info("Maksimalan broj online povraćaja dostignut");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Maksimalan broj online povraćaja dostignut",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "080":
                        log.info("Maksimalan broj offline povraćaja dostignut");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Maksimalan broj offline povraćaja dostignut",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "081":
                        log.info("Maksimalan kredit po povraćaju dostignut");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Maksimalan kredit po povraćaju dostignut",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "082":
                        log.info("Maksimalan broj upotreba dostignut");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Maksimalan broj upotreba dostignut",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "083":
                        log.info("Maksimalan iznos povraćaja dostignut");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Maksimalan iznos povraćaja dostignut",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "084":
                        log.info("Korisnik izabrao razlog negativne kartice");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Korisnik izabrao razlog negativne kartice",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "085":
                        log.info("Upit nije dozvoljen—nema stanja");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Upit nije dozvoljen—nema stanja",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "086":
                        log.info("Prekoračen limit");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Prekoračen limit",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "087":
                        log.info("Maksimalan broj povraćaja dostignut");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Maksimalan broj povraćaja dostignut",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "088":
                        log.info("Pozvati");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Pozvati",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "089":
                        log.info("Status kartice je 0 (neaktivna) ili 9 (zatvorena)");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Status kartice je 0 (neaktivna) ili 9 (zatvorena)",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "090":
                        log.info("Fajl za preusmeravanje je pun");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Fajl za preusmeravanje je pun",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "091":
                        log.info("Problem pri pristupu negativnoj listi kartica");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Problem pri pristupu negativnoj listi kartica",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "092":
                        log.info("Iznos unapred manji od minimalnog");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Iznos unapred manji od minimalnog",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "093":
                        log.info("Kašnjenje u plaćanju");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Kašnjenje u plaćanju",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "094":
                        log.info("Prekoračen limit ili raspoloživa sredstva");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Prekoračen limit ili raspoloživa sredstva",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "095":
                        log.info("Iznos je preko maksimuma");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Iznos je preko maksimuma",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "096":
                        log.info("PIN je obavezan");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "PIN je obavezan",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "097":
                        log.info("Mod 10 provera");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Mod 10 provera",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "098":
                        log.info("Prinudno knjiženje");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Prinudno knjiženje",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "099":
                        log.info("Nije moguće pristupiti pozitivnom računu u bazi");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nije moguće pristupiti pozitivnom računu u bazi",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "100":
                        log.info("Nije moguće obraditi transakciju");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nije moguće obraditi transakciju",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "101":
                        log.info("Nije moguće autorizovati—pozvati");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nije moguće autorizovati—pozvati",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "102":
                        log.info("Pozvati");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Pozvati",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "103":
                        log.info("Problem pri pristupu negativnoj listi kartica");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Problem pri pristupu negativnoj listi kartica",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "104":
                        log.info("Problem pri pristupu računu korisnika");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Problem pri pristupu računu korisnika",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "105":
                        log.info("Kartica nije podržana");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Kartica nije podržana",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "106":
                        log.info("Iznos je preko maksimuma");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Iznos je preko maksimuma",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "107":
                        log.info("Prekoračen dnevni limit");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Prekoračen dnevni limit",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "108":
                        log.info("Parametri autorizacije kartice nisu pronađeni");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Parametri autorizacije kartice nisu pronađeni",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "109":
                        log.info("Iznos unapred manji od minimalnog");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Iznos unapred manji od minimalnog",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "110":
                        log.info("Broj korišćenja");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Broj korišćenja",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "111":
                        log.info("Kašnjenje u plaćanju");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Kašnjenje u plaćanju",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "112":
                        log.info("Prekoračen limit");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Prekoračen limit",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "113":
                        log.info("Vreme je isteklo");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Vreme je isteklo",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "115":
                        log.info("Fajl dnevnika transakcija je pun");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Fajl dnevnika transakcija je pun",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "120":
                        log.info("Problem sa podacima o korišćenju kartice");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Problem sa podacima o korišćenju kartice",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "121":
                        log.info("Problem sa administrativnim podacima kartice");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Problem sa administrativnim podacima kartice",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "122":
                        log.info("PIN ne može biti potvrđen; sigurnosni modul nije dostupan");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "PIN ne može biti potvrđen; sigurnosni modul nije dostupan",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "130":
                        log.info("ARQC preusmeravanje");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "ARQC preusmeravanje",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "131":
                        log.info("CVR preusmeravanje");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "CVR preusmeravanje",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "132":
                        log.info("TVR preusmeravanje");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "TVR preusmeravanje",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "133":
                        log.info("Preusmeravanje po razlogu online koda");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Preusmeravanje po razlogu online koda",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "134":
                        log.info("Fallback preusmeravanje");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Fallback preusmeravanje",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "150":
                        log.info("Trgovac nije registrovan");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Trgovac nije registrovan",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "200":
                        log.info("Nevažeći račun");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nevažeći račun",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "201":
                        log.info("Netačan PIN");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Netačan PIN",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "202":
                        log.info("Unapred je manji od minimuma");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Unapred je manji od minimuma",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "203":
                        log.info("Potreban administrativni karton");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Potreban administrativni karton",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "204":
                        log.info("Unesite manji iznos");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Unesite manji iznos",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "205":
                        log.info("Nevažeći iznos unapred");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nevažeći iznos unapred",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "206":
                        log.info("Podaci o autorizaciji korisnika nisu pronađeni");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Podaci o autorizaciji korisnika nisu pronađeni",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "207":
                        log.info("Nevažeći datum transakcije");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nevažeći datum transakcije",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "208":
                        log.info("Nevažeći datum isteka");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nevažeći datum isteka",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "209":
                        log.info("Nevažeći kod transakcije");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nevažeći kod transakcije",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "251":
                        log.info("Povrat gotovine prelazi dnevni limit");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Povrat gotovine prelazi dnevni limit",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "400":
                        log.info("ARQC neuspeh");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "ARQC neuspeh",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "401":
                        log.info("Greška parametra sigurnosnog modula");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Greška parametra sigurnosnog modula",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "402":
                        log.info("Greška sigurnosnog modula");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Greška sigurnosnog modula",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "403":
                        log.info("Ključne informacije čipa nisu pronađene");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Ključne informacije čipa nisu pronađene",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "404":
                        log.info("Neuspeh ATC provere");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Neuspeh ATC provere",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "405":
                        log.info("CVR odbijeno");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "CVR odbijeno",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "406":
                        log.info("TVR odbijeno");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "TVR odbijeno",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "407":
                        log.info("Odbijanje po online kodu");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Odbijanje po online kodu",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "408":
                        log.info("Fallback odbijeno");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Fallback odbijeno",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "800":
                        log.info("Greška u formatu");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Greška u formatu",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "801":
                        log.info("Nevažeći podaci");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nevažeći podaci",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "802":
                        log.info("Nevažeći broj zaposlenog");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nevažeći broj zaposlenog",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "809":
                        log.info("Nevažeće zatvaranje transakcije");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nevažeće zatvaranje transakcije",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "810":
                        log.info("Isteklo vreme transakcije");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Isteklo vreme transakcije",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "811":
                        log.info("Sistemska greška");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Sistemska greška",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "820":
                        log.info("Nevažeći identifikator terminala");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nevažeći identifikator terminala",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "821":
                        log.info("Nevažeća dužina odgovora");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nevažeća dužina odgovora",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "878":
                        log.info("Greška u dužini PIN-a");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Greška u dužini PIN-a",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "889":
                        log.info("Greška sinhronizacije KMAC ključa");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Greška sinhronizacije KMAC ključa",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "898":
                        log.info("Nevažeći MAC");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Nevažeći MAC",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "899":
                        log.info("Greška sekvence—resinkronizacija");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Greška sekvence—resinkronizacija",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "900":
                        log.info("Prekoračen broj pokušaja unosa PIN-a");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Prekoračen broj pokušaja unosa PIN-a",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "901":
                        log.info("Kartica je istekla");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Kartica je istekla",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "902":
                        log.info("Kod hvatanja iz negativne liste");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Kod hvatanja iz negativne liste",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "903":
                        log.info("Status kartice je 3 (ukradena)");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Status kartice je 3 (ukradena)",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "904":
                        log.info("Unapred je manji od minimuma");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Unapred je manji od minimuma",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "905":
                        log.info("Prekoračen broj korišćenja");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Prekoračen broj korišćenja",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "906":
                        log.info("Kašnjenje u plaćanju");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Kašnjenje u plaćanju",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "907":
                        log.info("Prekoračen limit");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Prekoračen limit",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "908":
                        log.info("Iznos je preko maksimuma");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Iznos je preko maksimuma",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "909":
                        log.info("Hvatanje");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Hvatanje",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "910":
                        log.info("Hvatanje po ARQC");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Hvatanje po ARQC",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "911":
                        log.info("Hvatanje po CVR");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Hvatanje po CVR",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    case "912":
                        log.info("Hvatanje po TVR");
                        responseMessage = {
                            statusCode: responseDetailCode,
                            statusCodeDisplay: "Hvatanje po TVR",
                            response: response.trim(),
                            request: message
                        };
                        break;
                    default:
                        log.info("Plaćanje uspešno");
                        responseMessage = {
                            statusCode: statusCode,
                            statusCodeDisplay: "Plaćanje uspešno",
                            response: response.trim(),
                            request: message
                        };

                        break;
                }
                disconnectPos();

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
        client.removeAllListeners();
        log.info("Cleared all client listeners")

    });

// Handle errors
    client.on("error", (err) => {
        log.error("Error message:", err.message);
        log.error("Error name:", err.name);
        log.error("Error stack:", err.stack);

        lastMessageTimeStamp = Date.now();
        browserWindow.webContents.send('display-error', err.message);

        log.info('CLIENT DESTROYED');
        client.destroy();

        log.info('CLIENT READY STATE: ' + client.readyState)
        log.info('CLIENT DESTROYED: ' + client.destroyed)
        log.info('CLIENT CLOSED: ' + client.closed)
    });

}


const disconnectPos = async () => {
    if (client) {
        if (!client.destroyed) {
            log.log('Client ENDED')

            client.end();
            log.info('CLIENT READY STATE: ' + client.readyState)
            log.info('CLIENT DESTROYED: ' + client.destroyed)
            log.info('CLIENT CLOSED: ' + client.closed)
        }
    }


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
        await disconnectPos();

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
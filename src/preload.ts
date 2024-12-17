// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import {ipcRenderer, contextBridge} from 'electron'
import {CardData, MedCardData, ReadCardCommand} from "./types/types";

contextBridge.exposeInMainWorld('api', {
    getWebSocketUrl: async () => {
        return await ipcRenderer.invoke('get-web-socket-url')
    },
    initCardReader:  (cardReadCommand: ReadCardCommand)=>{
         ipcRenderer.send('initialize-card-reader', cardReadCommand);
    },
    scanDocument: (cardReadCommand: ReadCardCommand)=> {
        ipcRenderer.send('scan-document')
    },
    cancelDocumentScan: () => ipcRenderer.send('cancel-document-scan'),
    cancelCardRead:  (cardReadCommand: ReadCardCommand)=>{
        ipcRenderer.send('initialize-card-reader', cardReadCommand);
    },
    activateApp: (activationKey: string)=> {
        ipcRenderer.send('activate-app', activationKey)
    },
    onInsertCardReaderIntoDevice: (callback: ()=>void) => ipcRenderer.on('insert-card-reader-into-device', () => callback()),
    onInsertCardIntoCardReader: (callback: ()=>void) => ipcRenderer.on('insert-card-into-reader', () => callback()),
    onCardInserted: (callback: ()=>void) => ipcRenderer.on('card-inserted-into-reader', () => callback()),
    onReaderError: (callback: (value: string)=>void) => ipcRenderer.on('display-error', (_event, value) => callback(value)),
    onCardDataLoaded: (callback: (cardData: CardData & MedCardData)=>void) => ipcRenderer.on('card-data-loaded', (_event, cardData) => callback(cardData)),
    onDocumentScanned: (callback: (documentBase64: string)=>void) => ipcRenderer.on('document-scanned', (_event, documentBase64) => callback(documentBase64)),
    onInsertDocumentInScanner: (callback: ()=>void) => ipcRenderer.on('insert-document-in-scanner', () => callback()),
    onAppActivated: (callback: (value: string)=>void) => ipcRenderer.on('app-activated', (_event, value) => callback(value)),
    onAppKeyInvalid: (callback: (value: string)=>void) => ipcRenderer.on('app-key-invalid', (_event, value) => callback(value)),
    onAppActivationApiServerError: (callback: (value: string)=>void) => ipcRenderer.on('activation-api-server-error', (_event, value) => callback(value)),




})
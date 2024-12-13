import {CardData, MedCardData, ReadCardCommand} from "./types/types";
/// <reference types="vite/client" />
/// <reference types="electron" />


declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;


declare global{
    declare interface Window {

        api: {
            initCardReader: (cardReadCommand: ReadCardCommand) => void
            cancelCardRead: (cardReadCommand: ReadCardCommand) => void
            cancelDocumentScan: () => void
            scanDocument: (cardReadCommand: ReadCardCommand) => void
            activateApp: (activationKey: string) => void
            onInsertCardReaderIntoDevice(callback: () => void): void
            onInsertCardIntoCardReader(callback: () => void): void
            onCardInserted(callback: () => void): void
            onReaderError(callback: (error: string) => void): void
            onCardDataLoaded(callback: (cardData: MedCardData & CardData) => void): void
            onDocumentScanned(callback: (documentBase64: string) => void): void
            onInsertDocumentInScanner(callback: () => void): void
            onAppActivated(callback: (appKey: string) => void): void
            onAppKeyInvalid(callback: (message: string) => void): void
            onAppActivationApiServerError(callback: (message: string) => void): void



        }
    }
}

export {}; // This ensures the file is treated as a module

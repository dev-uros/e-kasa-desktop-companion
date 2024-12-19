import {Ref, ref, watch} from "vue";
import {CardData, ConnectionTypes, MedCardData, MessageTypes, ReadCardCommand} from "../types/types";
import useNotificationMessage, {NotificationType} from "./notification";
import {Loading} from "quasar";

export default function useWebSocket() {

    let webSocket: WebSocket;

    const webSocketReadyState = ref();

    const pingIntervalId = ref();

    const latestPong = ref(null);

    const latestPing = ref(null);

    const cardData: Ref<CardData & MedCardData> = ref();

    const documentBase64 = ref()

    const respondTo = ref();

    let appCode = ''

    let webSocketUrlWs = '';

    const initWebSocket = (webSocketUrl: string) => {


        webSocketUrlWs = webSocketUrl;
        appCode = '123456';

        webSocket = new WebSocket(webSocketUrl)

        setWebSocketReadyState()

        webSocket.addEventListener('open', handleWebSocketOpened);

        webSocket.addEventListener('message', handleWebSocketIncomingMessage)

        webSocket.addEventListener('error', handleWebSocketError);

        webSocket.addEventListener('close', handleWebSocketClose)

        addEventListener('beforeunload', handleBeforeUnload)

    }

    const setWebSocketReadyState = () => {
        webSocketReadyState.value = webSocket.readyState;
    }
    const setPing = () => {
        sendMessage({
            messageType: MessageTypes.PING,
            connectionType: ConnectionTypes.DESKTOP,
            appCode: appCode
        });
        latestPing.value = Date.now();


        setTimeout(() => {
            if (latestPong.value - latestPing.value >= 10000) {
                handleWebSocketClose();
            }
        }, 10000)
    }

    const handleWebSocketOpened = () => {
        setWebSocketReadyState()

        sendMessage({
            messageType: MessageTypes.CONNECTION_OPEN,
            connectionType: ConnectionTypes.DESKTOP,
            appCode: appCode
        });

        pingIntervalId.value = setInterval(setPing, 30000)

        console.log('ws opened');
    }

    const handleWebSocketIncomingMessage = (event: MessageEvent) => {
        console.log(event);
        const message = JSON.parse(event.data);

        if (message.messageType === MessageTypes.PONG) {
            latestPong.value = Date.now();
        } else if(message.messageType === MessageTypes.CONNECTION_CLOSE){
            if(respondTo.value){
                respondTo.value = null;
                window.api.cancelCardRead(ReadCardCommand.CANCEL_CARD_READ)
                Loading.hide()
                useNotificationMessage(NotificationType.ERROR, 'Očitavanje otkazano sa web aplikacije')
            }

        }else if(message.messageType === ReadCardCommand.READ_ID_CARD){
            documentBase64.value = null
            cardData.value = null;
            respondTo.value = message.respondTo
            console.log(message);
            window.api.initCardReader(message.messageType)

            console.log(JSON.parse(event.data))
        }  else if(message.messageType === ReadCardCommand.READ_MED_CARD){
            documentBase64.value = null
            cardData.value = null;

            respondTo.value = message.respondTo
            console.log(message);
            window.api.initCardReader(message.messageType)

            console.log(JSON.parse(event.data))
        }else if(message.messageType === ReadCardCommand.CANCEL_CARD_READ){
                console.log('CANCEL IZ WS')
                respondTo.value = null;
                window.api.cancelCardRead(ReadCardCommand.CANCEL_CARD_READ)
                Loading.hide()
                useNotificationMessage(NotificationType.ERROR, 'Očitavanje otkazano sa web aplikacije')

        }else if(message.messageType === ReadCardCommand.SCAN_DOCUMENT){
            documentBase64.value = null
            cardData.value = null;

            respondTo.value = message.respondTo
            console.log(message);
            window.api.scanDocument(ReadCardCommand.SCAN_DOCUMENT);

            console.log(JSON.parse(event.data))
        }else if(message.messageType === ReadCardCommand.CANCEL_SCAN_DOCUMENT){
            console.log('CANCEL IZ WS')
            respondTo.value = null;
            window.api.cancelDocumentScan()
            Loading.hide()
            useNotificationMessage(NotificationType.ERROR, 'Skeniranje otkazano sa web aplikacije')
        }
        console.log('ws new incoming message');
    }

    const handleWebSocketError = () => {
        setWebSocketReadyState()

        console.log('ws error')
    }

    const handleWebSocketClose = () => {

        useNotificationMessage(NotificationType.ERROR, 'Došlo je do greške, molimo pokušajte ponovo da se povežete!')

        Loading.hide();
        setWebSocketReadyState()

        clearInterval(pingIntervalId.value)

        removeEventListener('open', handleWebSocketOpened)
        removeEventListener('message', handleWebSocketIncomingMessage)
        removeEventListener('error', handleWebSocketError)
        removeEventListener('close', handleWebSocketClose)
        removeEventListener('beforeunload', handleWebSocketClose)

        webSocket.close();
        pingIntervalId.value = null;
        // webSocket = null;

        console.log('ws closed')
    }

    const handleBeforeUnload = () => {

        if(webSocket.readyState === 1 && respondTo.value){
            sendMessage({
                messageType: MessageTypes.CONNECTION_CLOSE,
                connectionType: ConnectionTypes.DESKTOP,
                respondTo: respondTo.value
            });
        }
        setWebSocketReadyState()

        clearInterval(pingIntervalId.value)

        removeEventListener('open', handleWebSocketOpened)
        removeEventListener('message', handleWebSocketIncomingMessage)
        removeEventListener('error', handleWebSocketError)
        removeEventListener('close', handleWebSocketClose)
        removeEventListener('beforeunload', handleWebSocketClose)

        webSocket.close();
        pingIntervalId.value = null;
        // webSocket = null;

        console.log('ws closed')
    }

    const sendMessage = (data: object) => {
        console.log('saljem ping pong')
        webSocket.send(JSON.stringify({
            ...data
        }));
    }

    const reconnectAttempts = ref(0);
    watch(webSocketReadyState, (value, oldValue, onCleanup) => {
        if(value === 3){
            reconnectAttempts.value++;
            console.log(reconnectAttempts.value)
            if(reconnectAttempts.value < 3){
                setTimeout(()=> {
                    initWebSocket(webSocketUrlWs)
                }, 5000)

            }else{
                reconnectAttempts.value = 0;
            }
        }
        if(value === 1){
            reconnectAttempts.value = 0;

        }
    })
    return {
        webSocketReadyState,
        initWebSocket,
        handleWebSocketClose,
        cardData,
        sendMessage,
        respondTo,
        documentBase64,
        reconnectAttempts
    }
}
<script setup lang="ts">
import ActivateApplicationForm from "./components/ActivateApplicationForm.vue";
import {Loading, useQuasar} from "quasar";
import {onMounted, onUnmounted, provide, ref,} from "vue";
import useWebSocket from "./composables/ws";
import {CardType, ConnectionTypes, MessageTypes} from "./types/types";
import useNotificationMessage, {NotificationType} from "./composables/notification";
import ApplicationToolbar from "./components/ApplicationToolbar.vue";
import ReadIdCardList from "./components/ReadIdCardList.vue";
import ReadMedCardList from "./components/ReadMedCardList.vue";
import ScannedDocument from "./components/ScannedDocument.vue";

const $q = useQuasar();
const {initWebSocket, webSocketReadyState, handleWebSocketClose, cardData, sendMessage, respondTo, documentBase64, reconnectAttempts} = useWebSocket()
provide('webSocketReadyState', webSocketReadyState);
provide('initWebSocket', initWebSocket)
provide('reconnectAttempts', reconnectAttempts)

const applicationKey = ref($q.localStorage.getItem('activationKey'));


const setApplicationKey = async() => {
  applicationKey.value = $q.localStorage.getItem('activationKey')
  const webSocketUrl = await window.api.getWebSocketUrl();
  initWebSocket(`${webSocketUrl}?authToken=${applicationKey.value}`);
}

onMounted(async () => {
  const webSocketUrl = await window.api.getWebSocketUrl();
  console.log(applicationKey.value);
  if (applicationKey.value) {
    initWebSocket(`${webSocketUrl}?authToken=${applicationKey.value}`);
  }
})



window.api.onInsertCardReaderIntoDevice(()=>{
  Loading.show({message: 'Molimo ubacite čitač kartica u uređaj'});
  sendMessage({
    messageType: MessageTypes.INSERT_READER_INTO_DEVICE,
    connectionType: ConnectionTypes.DESKTOP,
    respondTo: respondTo.value
  });
})

window.api.onInsertCardIntoCardReader(()=>{
  Loading.show({message: 'Molimo ubacite karticu u čitač'});
  sendMessage({
    messageType: MessageTypes.INSERT_CARD_INTO_READER,
    connectionType: ConnectionTypes.DESKTOP,
    respondTo: respondTo.value

  });
})

window.api.onInsertDocumentInScanner(()=>{
  Loading.show({message: 'Molimo ubacite dokument u skener i pritisnite skeniraj na uređaju'});
  sendMessage({
    messageType: MessageTypes.INSERT_DOCUMENT_IN_SCANNER,
    connectionType: ConnectionTypes.DESKTOP,
    respondTo: respondTo.value

  });
})

window.api.onReaderError((error)=>{
  useNotificationMessage(NotificationType.ERROR, error)
  Loading.hide();
  sendMessage({
    messageType: MessageTypes.ERROR,
    connectionType: ConnectionTypes.DESKTOP,
    respondTo: respondTo.value,
    error: error

  });
})

window.api.onCardDataLoaded((data)=>{
  Loading.hide()
  useNotificationMessage(NotificationType.SUCCESS, 'Uspešno učitani podaci kartice')


  cardData.value = data

  sendMessage({
    messageType: MessageTypes.CARD_DATA_READ,
    connectionType: ConnectionTypes.DESKTOP,
    respondTo: respondTo.value,
    data:data

  });
})

window.api.onCardInserted(()=>{
  Loading.show({message: 'Kartica se očitava'});
  sendMessage({
    messageType: MessageTypes.CARD_IS_BEING_READ,
    connectionType: ConnectionTypes.DESKTOP,
    respondTo: respondTo.value

  });
})


window.api.onDocumentScanned((result)=>{
  Loading.hide()
  useNotificationMessage(NotificationType.SUCCESS, 'Uspešno skeniran dokument')


  documentBase64.value = result

  sendMessage({
    messageType: MessageTypes.DOCUMENT_SCANNED,
    connectionType: ConnectionTypes.DESKTOP,
    respondTo: respondTo.value,
    data:result
  });
})

onUnmounted(() => {
  handleWebSocketClose();
})
</script>

<template>
  <q-layout view="hHh lpR fFf">

    <q-header elevated class="bg-transparent text-black">
      <q-toolbar>
        <q-toolbar-title>
          <q-avatar square>
            <img src="images/logo.png">
          </q-avatar>
          Desktop Companion
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page padding>
        <ActivateApplicationForm v-if="!applicationKey" @application-activated="setApplicationKey"/>
        <q-card v-else>
          <ApplicationToolbar  :is-app-activated="!!applicationKey"/>

          <q-card-section>
            <ReadIdCardList v-if="cardData && cardData.cardType === CardType.ID_CARD" :card-data="cardData"/>
            <ReadMedCardList v-if="cardData && cardData.cardType === CardType.MED_CARD" :card-data="cardData"/>
            <ScannedDocument v-if="documentBase64" :document="documentBase64"/>

          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>

  </q-layout>
</template>

<style scoped>

</style>
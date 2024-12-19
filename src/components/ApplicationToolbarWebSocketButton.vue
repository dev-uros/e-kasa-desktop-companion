<script setup lang="ts">
import BaseTooltip from "./BaseTooltip.vue";
import {inject, ref} from "vue";
import {useQuasar} from "quasar";

const $q = useQuasar();
const webSocketReadyState = inject('webSocketReadyState');

const initWebSocket = inject('initWebSocket');

const reconnectAttempts = inject('reconnectAttempts');

const applicationKey = ref($q.localStorage.getItem('activationKey'));

const reconnectToWebSocket = async () => {
  const webSocketUrl = await window.api.getWebSocketUrl();

  initWebSocket(`${webSocketUrl}?authToken=${applicationKey.value}`);
}

</script>

<template>
  <q-btn v-if="reconnectAttempts > 0 && reconnectAttempts !== 3" size="sm" rounded  :loading="true" color="primary" style="width: 200px">
    <template v-slot:loading>
      <q-spinner-hourglass class="on-left" />
      Automatsko Povezivanje...
    </template>
  </q-btn>
  <q-btn icon-right="close" size="sm" color="negative" rounded label="Nije povezana" v-else-if="!webSocketReadyState || webSocketReadyState === 3"
         @click="reconnectToWebSocket">
    <BaseTooltip tooltip="Poveži"/>
  </q-btn>
  <q-chip v-else-if="webSocketReadyState === 1">
    <span>Povezana</span>
    <q-badge class="q-ml-md" rounded color="positive"/>
  </q-chip>
  <q-chip v-else-if="webSocketReadyState === 2">
    <span>Zatvara se</span>
    <q-badge class="q-ml-md" rounded color="positive"/>
  </q-chip>
  <q-chip v-else-if="webSocketReadyState === 0">
    <span>Povezuje se</span>
    <q-badge class="q-ml-md" rounded color="positive"/>
  </q-chip>

</template>

<style scoped>

</style>
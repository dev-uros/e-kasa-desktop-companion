<script setup lang="ts">
import BaseTooltip from "./BaseTooltip.vue";
import {inject} from "vue";

const webSocketReadyState = inject('webSocketReadyState');

const initWebSocket = inject('initWebSocket')
</script>

<template>
  <q-btn icon-right="close" size="sm" color="negative" rounded label="Nije povezana" v-if="!webSocketReadyState || webSocketReadyState === 3"
         @click="initWebSocket">
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
<script setup lang="ts">
import ApplicationToolbarActiveStateChip from "./ApplicationToolbarActiveStateChip.vue";
import ApplicationToolbarWebSocketButton from "./ApplicationToolbarWebSocketButton.vue";

interface Props {
  isAppActivated: boolean
}

defineProps<Props>()

</script>

<template>
  <q-toolbar class="bg-secondary">

    <ApplicationToolbarActiveStateChip :is-app-activated="isAppActivated"/>

    <ApplicationToolbarWebSocketButton/>

  </q-toolbar>

</template>

<style scoped>

</style>
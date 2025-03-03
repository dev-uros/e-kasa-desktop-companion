<script setup lang="ts">
import ApplicationToolbarActiveStateChip from "./ApplicationToolbarActiveStateChip.vue";
import ApplicationToolbarWebSocketButton from "./ApplicationToolbarWebSocketButton.vue";
import {ref} from "vue";
import {useQuasar} from "quasar";

interface Props {
  isAppActivated: boolean
}

defineProps<Props>()

const $q = useQuasar();
const posIpAddress = ref($q.localStorage.getItem('posIpAddress') ?? '192.168.0.125')
if(!$q.localStorage.getItem('posIpAddress')){
  window.api.setPosIpAddress(String(posIpAddress.value));

}


const setPosIpAddress = (value: string, initialValue: string) => {
  window.api.setPosIpAddress(value);
  $q.localStorage.setItem('posIpAddress', value)
}
</script>

<template>
  <q-toolbar class="bg-secondary flex justify-between">

    <div class="flex items-start">
      <ApplicationToolbarActiveStateChip :is-app-activated="isAppActivated"/>

      <ApplicationToolbarWebSocketButton/>
    </div>


    <div class="flex items-end">
      <q-chip>
        <span>POS IP adresa: {{ posIpAddress }}</span>
        <q-badge class="q-ml-md" rounded color="info"/>
        <q-popup-edit v-model="posIpAddress" buttons v-slot="scope" @save="setPosIpAddress">
          <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set" />
        </q-popup-edit>
      </q-chip>
    </div>


  </q-toolbar>

</template>

<style scoped>

</style>
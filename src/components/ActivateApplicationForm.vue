<script setup lang="ts">
import {reactive} from "vue";
import {useFetch} from "../composables/fetch";
import {
  HttpMethod,
  ActivateApplicationDataResponse,
  ActivateApplicationDataRequest,
  MessageTypes, ConnectionTypes
} from "../types/types";
import useNotificationMessage, {NotificationType} from "../composables/notification";
import {Loading, useQuasar} from "quasar";

const $q = useQuasar();
const emit = defineEmits<{
  applicationActivated: []
}>()

const activateApplicationData = reactive({
  appActivationKey: '',
});


const submitFormUrl = process.env.NODE_ENV === 'development' ?
    'http://localhost:3000/desktop-client/activate' :
    'https://94.127.2.98:3000/desktop-client/activate'
const submitForm = async () => {
  Loading.show();

  await window.api.activateApp(activateApplicationData.appActivationKey);


}

window.api.onAppActivated((appKey)=>{
  Loading.hide()

    $q.localStorage.set('activationKey', appKey);

    useNotificationMessage(NotificationType.SUCCESS, 'Uspešno aktivirana aplikacija')
    emit('applicationActivated')
})

window.api.onAppKeyInvalid((message)=>{
  Loading.hide()

  useNotificationMessage(NotificationType.ERROR, message)
})

window.api.onAppActivationApiServerError((message)=>{
  Loading.hide()

  useNotificationMessage(NotificationType.ERROR, message)
})
</script>

<template>
  <q-form
      @submit="submitForm"
      class="q-gutter-md"
  >

    <q-input
        filled
        v-model.trim="activateApplicationData.appActivationKey"
        label="* Ključ"
        hint="Unesite aktivacioni ključ aplikacije"
        lazy-rules
        :rules="[ val => val && val.length > 0 || 'Morate uneti aktivacioni ključ!']"
    />

    <div>
      <q-btn label="Aktiviraj" type="submit" color="primary"/>
    </div>
  </q-form>

</template>

<style scoped>

</style>
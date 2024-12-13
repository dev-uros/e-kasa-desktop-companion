<script setup lang="ts">
import {computed} from "vue";

interface Props {
  isAppActivated: boolean,
}

const props = defineProps<Props>()

const isAppActivatedDisplay = computed(function (){
  if(props.isAppActivated){
    return {
      spanText: 'Aktivirana',
      badgeColor: 'positive'
    }
  }else{
    return {
      spanText: 'Nije aktivirana',
      badgeColor: 'negative'
    }
  }
})
</script>

<template>
  <q-chip>
    <span>{{ isAppActivatedDisplay.spanText }}</span>
    <q-badge class="q-ml-md" rounded :color="isAppActivatedDisplay.badgeColor"/>
  </q-chip>
</template>

<style scoped>

</style>
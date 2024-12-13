<script setup lang="ts">
interface Props {
  appCode: string,
}

defineProps<Props>()
</script>

<template>
  <q-toolbar-title class="text-white text-bold">
    Aplikacija: {{ appCode }}
  </q-toolbar-title>
</template>

<style scoped>

</style>
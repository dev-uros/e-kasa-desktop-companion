<script setup lang="ts">
interface Props{
  document: string
}

defineProps<Props>()
</script>

<template>
  <embed class="full-width"
         id="scannedDocument"
         title="Skenirani dokument"
         :src="'data:application/pdf;base64,' + document" style="height: 500px;">
</template>

<style scoped>

</style>
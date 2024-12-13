<template>
  <q-tooltip
      class="bg-primary"
      anchor="bottom middle"
      :offset="[10, 10]"
  >
    {{ tooltip }}
  </q-tooltip>
</template>

<script setup lang="ts">
interface TooltipProps {
  tooltip: string
}

withDefaults(defineProps<TooltipProps>(), {
  tooltip: 'Tekst!',
})
</script>
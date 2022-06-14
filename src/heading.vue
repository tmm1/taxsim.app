<script setup>
const props = defineProps({
  class: String,
})
</script>

<template>
  <div :class="['relative mt-3 mb-6', props.class]">
    <div class="absolute inset-0 flex items-center" aria-hidden="true">
      <div class="w-full border-t border-gray-300" />
    </div>
    <div class="relative flex justify-center">
      <span class="bg-white px-3 text-lg font-medium text-gray-900"> <slot /> </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue';
defineProps<{ label: string; help?: string; checked: boolean; disabled?: boolean }>();
defineEmits<{ change: [boolean] }>();
const id = useId();
</script>
<template>
  <label class="mode-row" :for="id">
    <span class="mode-text"><span class="mode-label">{{ label }}</span><span v-if="help" class="mode-help">{{ help }}</span></span>
    <input :id="id" class="switch" type="checkbox" role="switch" :checked="checked" :disabled="disabled" @change="$emit('change', ($event.target as HTMLInputElement).checked)">
  </label>
</template>

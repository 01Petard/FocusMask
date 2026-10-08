<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
const props = defineProps<{ id: string; modelValue: string; options: { value: string; label: string }[]; disabled?: boolean; labelledby: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const open = ref(false); const root = ref<HTMLElement>(); const trigger = ref<HTMLButtonElement>(); const index = ref(0);
const selected = computed(() => props.options.find(option => option.value === props.modelValue));
async function show() {
  if (props.disabled) return;
  open.value = true; index.value = Math.max(0, props.options.findIndex(option => option.value === props.modelValue));
  await nextTick(); focusOption();
}
function focusOption() { (root.value?.querySelectorAll<HTMLButtonElement>('[role="option"]')[index.value])?.focus(); }
function choose(value: string) { emit('update:modelValue', value); open.value = false; trigger.value?.focus(); }
function key(event: KeyboardEvent) {
  if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    if (!open.value) { void show(); return; }
    index.value = event.key === 'Home' ? 0 : event.key === 'End' ? props.options.length - 1 : (index.value + (event.key === 'ArrowDown' ? 1 : -1) + props.options.length) % props.options.length;
    focusOption();
  } else if (event.key === 'Escape') { event.preventDefault(); open.value = false; trigger.value?.focus(); }
  else if (event.key === 'Tab') open.value = false;
}
function outside(event: PointerEvent) { if (!root.value?.contains(event.target as Node)) open.value = false; }
watch(() => props.disabled, disabled => { if (disabled) open.value = false; });
onMounted(() => document.addEventListener('pointerdown', outside));
onUnmounted(() => document.removeEventListener('pointerdown', outside));
</script>
<template>
  <div ref="root" class="custom-select" @keydown="key">
    <button :id="id" ref="trigger" class="custom-select-trigger" type="button" :disabled="disabled" aria-haspopup="listbox" :aria-expanded="open" :aria-controls="`${id}-list`" :aria-labelledby="`${labelledby} ${id}-value`" @click="open ? open = false : show()"><span :id="`${id}-value`">{{ selected?.label || options[0]?.label }}</span><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 7.5 5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg></button>
    <ul v-if="open" :id="`${id}-list`" class="custom-select-menu" role="listbox" :aria-labelledby="labelledby"><li v-for="option in options" :key="option.value" role="presentation"><button type="button" role="option" tabindex="-1" :aria-selected="option.value === modelValue" @click="choose(option.value)"><span>{{ option.label }}</span><svg v-if="option.value === modelValue" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4 10 4 4 8-8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg></button></li></ul>
  </div>
</template>

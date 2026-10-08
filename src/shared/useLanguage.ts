import { computed, onUnmounted, ref } from 'vue';
import { getLanguage, subscribeLanguage, t as translate, type TextKey } from './i18n';
export function useLanguage() {
  const language = ref(getLanguage());
  const unsubscribe = subscribeLanguage(value => { language.value = value; });
  onUnmounted(unsubscribe);
  const t = (key: TextKey) => { void language.value; return translate(key); };
  const languageOptions = computed(() => [
    { value: 'auto', label: t('languageAuto') }, { value: 'zh-CN', label: '简体中文' }, { value: 'en', label: 'English' }
  ]);
  return { t, language, languageOptions };
}

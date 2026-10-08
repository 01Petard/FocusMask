import { createApp } from 'vue';
import Options from './Options.vue';
import '../shared/app.css';
import { setupLanguage } from '../shared/bridge';
setupLanguage(); createApp(Options).mount('#app');

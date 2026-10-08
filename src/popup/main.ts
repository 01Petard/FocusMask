import { createApp } from 'vue';
import Popup from './Popup.vue';
import '../shared/app.css';
import { setupLanguage } from '../shared/bridge';
setupLanguage(); createApp(Popup).mount('#app');

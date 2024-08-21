import { createApp } from 'vue';
import App from './App.vue';
import { definePreset } from '@primevue/themes'
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';


const LightBluePreset = definePreset(Aura, {
  semantic: {
      primary: {
          50: '#06b6d4',
          100: '#06b6d4',
          200: '#06b6d4',
          300: '#06b6d4',
          400: '#06b6d4',
          500: '#06b6d4',
          600: '#06b6d4',
          700: '#06b6d4',
          800: '#06b6d4',
          900: '#06b6d4',
          950: '#06b6d4'
      }
  }
});

const app = createApp(App);

app.use(PrimeVue, {
  theme: {
      preset: LightBluePreset,
      options: {
        darkModeSelector: '.my-app-dark',
      }
  }
});

app.mount('#app');



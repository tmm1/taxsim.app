import {createApp} from 'vue'
import App from './App.vue'
import {plugin, defaultConfig} from '@formkit/vue'
import {generateClasses} from '@formkit/themes'
import theme from './theme.js'
import './index.css'

createApp(App)
  .use(
    plugin,
    defaultConfig({
      config: {
        classes: generateClasses(theme),
      },
    })
  )
  .mount('#app')

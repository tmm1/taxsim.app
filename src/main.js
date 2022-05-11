import {createApp} from 'vue'
import App from './App.vue'
import {plugin, defaultConfig} from '@formkit/vue'
import {generateClasses} from '@formkit/themes'
import theme from './theme.js'
import numeric from './numeric.js'
import amount from './amount.js'
import './index.css'

createApp(App)
  .use(
    plugin,
    defaultConfig({
      inputs: {
        numeric,
        amount,
      },
      config: {
        classes: generateClasses(theme),
      },
    })
  )
  .mount('#app')

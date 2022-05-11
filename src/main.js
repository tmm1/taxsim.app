import {createApp, h} from 'vue'
import App from './App.vue'
import {plugin, defaultConfig} from '@formkit/vue'
import {generateClasses} from '@formkit/themes'
import theme from './theme.js'
import numericInput from './numeric.js'
import amountInput from './amount.js'
import './index.css'

const nformat = Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format

let amount = (props, context) => {
  return h('span', props, nformat(props.value))
}
amount.props = ['value']

createApp(App)
  .component('amount', amount)
  .use(
    plugin,
    defaultConfig({
      inputs: {
        numeric: numericInput,
        amount: amountInput,
      },
      config: {
        classes: generateClasses(theme),
      },
    })
  )
  .mount('#app')

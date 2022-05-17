import {createApp, h} from 'vue'
import App from './App.vue'
import heading from './heading.vue'
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

let amount = (props, {slots}) => {
  let n = parseInt(slots.default()[0].children)
  if (props.prefix == '-') n *= -1
  let out = nformat(n)
  if (out == '$NaN') out = '$0'
  if (props.prefix != '-') out = (props.prefix || '') + out
  return h('span', props, out.replace(/-/g, '‑'))
}
amount.props = ['prefix']

createApp(App)
  .component('amount', amount)
  .component('heading', heading)
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

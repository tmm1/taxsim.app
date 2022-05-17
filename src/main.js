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

let amount = ({prefix, ...props}, {slots}) => {
  let n = parseInt(slots.default()[0].children)
  if (prefix == '-') n *= -1
  let out = nformat(n)
  if (out == '$NaN') out = '$0'
  out = out.replace(/-/g, '‑')
  switch (prefix) {
    case '-':
      break
    case '=':
      out = '=' + String.fromCharCode(160) + out
      break
    default:
      out = (prefix || '') + out
  }
  return h('span', props, out)
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

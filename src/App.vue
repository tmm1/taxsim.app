<script setup>
import {ref, reactive, toRaw} from 'vue'

const url = new URL(window.location)
const params = url.searchParams || {get: () => null}
const schemaLaws = [
  {
    $formkit: 'numeric',
    outerClass: 'col-span-1 md:col-span-2',
    inputClass: 'font-bold',
    name: 'year',
    id: 'year',
    value: params.get('year') || '2020',
    min: 1960,
    max: new Date().getFullYear() + 1,
    help: 'Federal tax calculations are available from 1960 onwards',
  },
  {
    $formkit: 'select',
    name: 'state',
    help: 'State tax calculations are available from 1977 onwards',
    value: params.get('state') || 0,
    outerClass: 'w-full col-span-1 md:col-span-2 xsticky xtop-[2em] bg-white',
    options: {
      0: '',
      1: 'Alabama',
      2: 'Alaska',
      3: 'Arizona',
      4: 'Arkansas',
      5: 'California',
      6: 'Colorado',
      7: 'Connecticut',
      8: 'Delaware',
      9: 'DC',
      10: 'Florida',
      11: 'Georgia',
      12: 'Hawaii',
      13: 'Idaho',
      14: 'Illinois',
      15: 'Indiana',
      16: 'Iowa',
      17: 'Kansas',
      18: 'Kentucky',
      19: 'Louisiana',
      20: 'Maine',
      21: 'Maryland',
      22: 'Massachusetts',
      23: 'Michigan',
      24: 'Minnesota',
      25: 'Mississippi',
      26: 'Missouri',
      27: 'Montana',
      28: 'Nebraska',
      29: 'Nevada',
      30: 'New Hampshire',
      31: 'New Jersey',
      32: 'New Mexico',
      33: 'New York',
      34: 'North Carolina',
      35: 'North Dakota',
      36: 'Ohio',
      37: 'Oklahoma',
      38: 'Oregon',
      39: 'Pennsylvania',
      40: 'Rhode Island',
      41: 'South Carolina',
      42: 'South Dakota',
      43: 'Tennessee',
      44: 'Texas',
      45: 'Utah',
      46: 'Vermont',
      47: 'Virginia',
      48: 'Washington',
      49: 'West Virginia',
      50: 'Wisconsin',
      51: 'Wyoming',
    },
  },
]

const schemaDemographics = [
  {
    $formkit: 'radio',
    name: 'mstat',
    id: 'mstat',
    label: 'Filing Status',
    outerClass: 'col-start-1 col-span-1',
    options: {
      single: 'Single',
      married: 'Married',
      marriedFilingSeparately: 'Married Filing Separately',
      headOfHousehold: 'Head of Household',
      dependent: 'Dependent Taxpayer',
    },
    value: params.get('mstat') || 'single',
  },
  {
    $el: 'div',
    children: [
      {
        $formkit: 'numeric',
        name: 'page',
        label: 'Age',
        min: 0,
        placeholder: '0',
        value: params.get('page'),
        help: '$: "Age of taxpayer as of 12/31/" + $get(year).value',
      },
      {
        $formkit: 'numeric',
        name: 'sage',
        label: 'Spouse Age',
        min: 0,
        placeholder: '0',
        value: params.get('sage'),
        if: '$get(mstat).value == "married" || $get(mstat).value == "marriedFilingSeparately"',
        help: '$: "Age of spouse as of 12/31/" + $get(year).value',
      },
    ],
  },
  {
    $formkit: 'numeric',
    name: 'depx',
    id: 'depx',
    label: '# of Dependents',
    value: params.get('depx'),
    placeholder: '0',
    min: 0,
    if: '$get(mstat).value == "headOfHousehold" || $get(mstat).value == "married" || $get(mstat).value == "marriedFilingSeparately"',
    help: {
      if: '$get(year).value * 1 <= 2017',
      then: 'Affects personal exemption calculation',
    },
  },
  {
    $el: 'div',
    children: [
      {
        $el: 'div',
        attrs: {
          class: 'mb-1 font-bold text-sm',
        },
        children: 'Age of Dependents',
        if: '$get(depx).value * 1 > 0',
      },
      {
        $el: 'div',
        attrs: {
          class: 'text-xs text-gray-500 -mt-1 mb-2',
        },
        if: '$get(depx).value * 1 > 0',
        children: 'Affects EITC, CTC and CCC.',
      },
      {
        $formkit: 'numeric',
        name: 'age1',
        value: params.get('age1') || '1',
        min: 1,
        if: '$get(depx).value * 1 > 0',
      },
      {
        $formkit: 'numeric',
        name: 'age2',
        value: params.get('age2') || '1',
        outerClass: '-mt-3',
        min: 1,
        if: '$get(depx).value * 1 > 1',
      },
      {
        $formkit: 'numeric',
        name: 'age3',
        value: params.get('age3') || '1',
        min: 1,
        outerClass: '-mt-3',
        if: '$get(depx).value * 1 > 2',
      },
      {
        $el: 'div',
        attrs: {
          class: 'text-xs text-gray-500 -mt-4 mb-4',
        },
        if: '$get(depx).value * 1 > 0',
        children: [
          'Enter youngest dependents first. Enter 1 for infants.',
          {
            if: '$get(year).value * 1 >= 1991',
            then: ' Enter 19 for students aged 20-23 to correct EITC calculation.',
          },
        ],
      },
    ],
  },
]

const incomeVars = [
  {
    name: 'pwages',
    spouse: 'swages',
    label: 'Wages and Salaries',
  },
  {
    name: 'psemp',
    spouse: 'ssemp',
    label: 'Self-employment Income',
  },
  {
    name: 'intrec',
    label: 'Taxable Interest Received',
    max: 50000,
  },
  {
    name: 'stcg',
    label: 'Short-term Capital Gain or Loss',
    type: 'gainorloss',
  },
  {
    name: 'ltcg',
    label: 'Long-term Capital Gain or Loss',
    type: 'gainorloss',
  },
  {
    name: 'pui',
    spouse: 'ui',
    label: 'Unemployment Compensation Received',
  },
  {
    name: 'pensions',
    label: 'Taxable Pensions and IRA distributions',
  },
  {
    name: 'gssi',
    label: 'Gross Social Security Benefits',
  },
]
const MAX = 500 * 1000
const STEP = 500
const schemaIncome = incomeVars.map(item => ({
  $formkit: 'amount',
  id: item.name,
  name: item.name,
  label: item.label,
  outerClass: 'col-span-2',
  min: item.type == 'gainorloss' ? -MAX : 0,
  max: item.max || MAX,
  step: STEP,
  delay: 0,
  value: params.get(item.name) || 0,
  sectionsSchema: {
    label: {
      children: [
        '$label',
        {
          $cmp: 'amount',
          props: {
            class: 'float-right',
          },
          children: '$value',
        },
      ],
    },
  },
}))

const creditsVars = [
  {
    name: 'mortgage',
    label: 'Itemized Deductions',
  },
  {
    name: 'childcare',
    label: 'Child Care Expenses',
  },
]
const creditOuts = [
  {
    name: 'v45',
    label: 'CARES Recovery Rebate',
  },
  {
    name: 'v21',
    label: 'General Tax Credit',
  },
  {
    name: 'v22',
    label: 'Child Tax Credit',
  },
  {
    name: 'v23',
    label: 'Additional CTC',
  },
  {
    name: 'v24',
    label: 'Child Care Credit',
  },
  {
    name: 'v25',
    label: 'Earned Income Credit',
  },
  {
    name: 'v14',
    label: 'Personal Exemptions',
  },
  {
    name: 'v13',
    label: 'Standard Deduction',
  },
]
const schemaCredits = creditOuts
  .map(o => ({
    $el: 'div',
    if: `$output.${o.name} * 1 > 0`,
    attrs: {
      class: 'col-span-2 font-bold text-sm rounded-md p-4 border border-gray-200 mb-4',
    },
    children: [
      o.label,
      {
        $cmp: 'amount',
        props: {
          class: 'float-right',
        },
        children: `$output.${o.name}`,
      },
    ],
  }))
  .concat(
    creditsVars.map(item => ({
      $formkit: 'amount',
      id: item.name,
      name: item.name,
      label: item.label,
      help: item.help,
      outerClass: 'col-span-2',
      max: item.max || MAX,
      step: STEP,
      delay: 0,
      value: params.get(item.name) || 0,
      sectionsSchema: {
        label: {
          children: [
            '$label',
            {
              $cmp: 'amount',
              props: {
                class: 'float-right',
              },
              children: '$value',
            },
          ],
        },
      },
    }))
  )

const output = ref(null)
const data = reactive({})

const schemaData = reactive({
  output,
  filingStatusInfo: () => {
    switch (data.mstat) {
      case 'dependent':
        return 'Typically a child with income'
      default:
        return ''
    }
  },
})

function filingStatus(input) {
  switch (input) {
    case 'single':
      return '1'
    case 'headOfHousehold':
      return '1'
    case 'married':
      return '2'
    case 'marriedFilingSeparately':
      return '6'
    case 'dependent':
      return '8'
  }
}

async function recompute(input) {
  var url = new URL(window.location)
  for (let k in data) {
    let v = data[k]
    if (v === undefined || v == 0 || v == '0') {
      url.searchParams.delete(k)
      continue
    }
    url.searchParams.set(k, v)
  }
  window.history.replaceState('', '', url)

  let res = await taxsim({
    ...input,
    mstat: filingStatus(input.mstat),
    idtl: 2,
    // idtl: 5,
  })
  // output.value = res
  // return
  let lines = res.split('\r\n')
  let keys = lines[0].split(',')
  let vals = lines[1].split(',')
  let out = {}
  for (let [i, val] of vals.entries()) {
    out[keys[i]] = val
  }
  output.value = out
}
</script>

<template>
  <FormKit type="group" v-model="data" @load="recompute" @input="recompute">
    <div class="flex flex-col md:flex-row">
      <main class="min-h-screen p-4 pt-2 mx-auto max-w-4xl">
        <div>
          <p class="text-xl md:text-2xl text-gray-600 font-bold"><a href="/">taxsim.app</a></p>
          <p class="text-sm md:text-md text-gray-500 pb-2 leading-tight">
            an interactive US Individual Income Tax simulator.
            <br />
            calcuations occur in your browser using a
            <a class="decoration-slate-300 underline" href="https://github.com/tmm1/taxsim.js">WASM build</a> of
            <a class="decoration-slate-300 underline" href="https://taxsim.nber.org">NBER TAXSIM</a>.
          </p>
          <div class="grid grid-cols-2 gap-x-4 md:grid-cols-4 pt-1">
            <FormKitSchema :schema="schemaLaws" :data="schemaData" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-x-4 md:grid-cols-4">
          <div class="relative col-start-0 col-span-2 md:col-span-4 mt-3 mb-6">
            <div class="absolute inset-0 flex items-center" aria-hidden="true">
              <div class="w-full border-t border-gray-300" />
            </div>
            <div class="relative flex justify-center">
              <span class="px-3 bg-white text-lg font-medium text-gray-900"> Demographics </span>
            </div>
          </div>

          <FormKitSchema :schema="schemaDemographics" :data="schemaData" />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <div>
            <div class="relative col-start-0 col-span-2 md:col-span-4 mt-3 mb-6">
              <div class="absolute inset-0 flex items-center" aria-hidden="true">
                <div class="w-full border-t border-gray-300" />
              </div>
              <div class="relative flex justify-center">
                <span class="px-3 bg-white text-lg font-medium text-gray-900"> Deductions &amp; Credits </span>
              </div>
            </div>

            <FormKitSchema :schema="schemaCredits" :data="schemaData" />
          </div>
          <div>
            <div class="relative col-start-0 col-span-2 md:col-span-4 mt-3 mb-6">
              <div class="absolute inset-0 flex items-center" aria-hidden="true">
                <div class="w-full border-t border-gray-300" />
              </div>
              <div class="relative flex justify-center">
                <span class="px-3 bg-white text-lg font-medium text-gray-900"> Income </span>
              </div>
            </div>

            <FormKitSchema :schema="schemaIncome" :data="schemaData" />
          </div>
        </div>
      </main>
      <aside class="flex flex-col mb-auto min-h-screen w-screen md:w-1/4 p-4 hidden">
        <div v-if="output">
          <div>
            Tax Year <span class="float-right">{{ output.year }}</span>
          </div>
          <div>AGI <amount class="float-right">{output.v10}}</amount></div>
        </div>
        <div v-if="true">
          <h2>Input</h2>
          <pre class="data">{{ data }}</pre>

          <h2>Output</h2>
          <pre class="data">{{ output }}</pre>
        </div>
      </aside>
    </div>
  </FormKit>
</template>

<style lang="postcss">
pre.data {
  @apply font-mono mx-10 my-4;
  font-size: 10pt;
  overflow-x: auto;
}
.input-numeric,
.input-amount {
  display: flex;
  flex-grow: 1;
  align-items: center;
  input {
    text-align: center;
    -moz-appearance: textfield;
  }
  input::-webkit-inner-spin-button,
  input::-webkit-outer-spin-button {
    appearance: none;
  }
  .formkit-suffix,
  .formkit-prefix {
    flex-shrink: 0;
    cursor: pointer;
    user-select: none;
    position: relative;
    width: 1.75em;
    height: 1.75em;
    text-align: center;
    margin: 0.35em;
    background: #eee;
    border: 1px solid var(--fk-color-border);
    border-radius: 50%;
  }
  .formkit-prefix span,
  .formkit-suffix span {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .formkit-prefix:hover,
  .formkit-suffix:hover {
    @apply text-blue-700;
  }
}
</style>

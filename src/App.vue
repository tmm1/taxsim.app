<script setup>
import {ref, reactive, onErrorCaptured} from 'vue'
import states from './states.js'

const federalIncomeVars = [
  {
    name: 'v10',
    label: 'AGI',
  },
  {
    name: 'v14',
    label: 'Personal Exemptions',
    prefix: '-',
  },
  {
    name: 'v13',
    label: 'Standard Deduction',
    if: '$output.v10 > 0',
    prefix: '-',
  },
  {
    name: 'v17',
    label: 'Itemized Deductions',
    if: '$output.v10 > 0',
    prefix: '-',
  },
  {
    name: 'v18',
    label: 'Taxable Income',
    onlyIf: '$output.v10 > 0',
    prefix: '=',
  },
]
const federalCreditVars = [
  {
    name: 'v28',
    label: 'Income Tax',
    if: '$output.v28 != $output.fiitax',
  },
  {
    name: 'v27',
    label: 'AMT',
    prefix: '+',
  },
  {
    name: 'v43',
    label: 'NIIT',
    prefix: '+',
  },
  {
    name: 'v21',
    label: 'General Tax Credit',
    prefix: '-',
  },
  {
    name: 'v23',
    label: 'Child Tax Credit',
    prefix: '-',
  },
  {
    name: 'v24',
    label: 'Child Care Credit',
    prefix: '-',
  },
  {
    name: 'v25',
    label: 'Earned Income Credit',
    prefix: '-',
  },
  {
    name: 'v45',
    label: 'CARES Recovery Rebate',
    prefix: '-',
  },
]
const federalTaxVars = [
  {
    name: 'fiitax',
    label: 'Income Tax Balance',
    if: '$output.tfica * 1 >= 1 || true',
  },
  {
    name: 'tfica',
    label: 'FICA Tax Withheld',
    prefix: '+',
  },
  {
    name: 'netftax',
    label: 'Net Tax',
    prefix: '=',
  },
]
const stateIncomeVars = [
  {
    name: 'v32',
    label: 'AGI',
  },
  {
    name: 'v33',
    label: 'Exemptions',
    prefix: '-',
  },
  {
    name: 'v34',
    label: 'Standard Deduction',
    if: '$output.v34 > $output.v35 && $output.v32 >= 1',
    prefix: '-',
  },
  {
    name: 'v35',
    label: 'Itemized Deductions',
    if: '$output.v35 > $output.v34 && $output.v32 >= 1',
    prefix: '-',
  },
  {
    name: 'v36',
    label: 'Taxable Income',
    onlyIf: '$output.v32 * 1 >= 1',
    prefix: '=',
  },
]
const stateTaxVars = [
  {
    name: 'stax',
    label: 'Income Tax',
    if: '$output.stax != $output.siitax',
  },
  {
    name: 'v37',
    label: 'Property Tax Credit',
    prefix: '-',
  },
  {
    name: 'v38',
    label: 'Child Care Credit',
    prefix: '-',
  },
  {
    name: 'v39',
    label: 'Earned Income Credit',
    prefix: '-',
  },
  {
    name: 'socredit',
    label: [
      {
        $cmp: 'popper',
        props: {
          hover: true,
          arrow: true,
          placement: 'right',
          content: 'Fuel Credit, Low Income Credit, etc',
        },
        children: [
          {
            $el: 'span',
            attrs: {
              class: 'border-b border-dashed',
            },
            children: 'Other Credits',
          },
        ],
      },
    ],
    prefix: '-',
    onlyIf: 'true',
  },
  {
    name: 'siitax',
    label: 'Net Tax',
    prefix: '=',
  },
]
const schemaFederal = {
  $formkit: 'numeric',
  outerClass: 'col-span-1 md:col-span-2 mb-1',
  inputClass: 'font-semibold',
  name: 'year',
  id: 'year',
  value: getParam('year') || '2020',
  min: 1960,
  max: new Date().getFullYear() + 1,
  help: 'Federal tax calculations are available from 1960 onwards',
}
const schemaState = {
  $formkit: 'select',
  name: 'state',
  id: 'state',
  value: getParam('state') || 0,
  outerClass: 'w-full col-span-1 md:col-span-2 mb-1',
  inputClass: 'font-semibold text-center md:indent-2',
  options: states,
  help: 'State tax calculations are available from 1977 onwards',
}
function varsToRows(vars) {
  return vars
    .map(o => {
      let condition =
        o.onlyIf || [o.if, `($output.${o.name} * 1 >= 1 || $output.${o.name} * 1 <= -1)`].filter(o => !!o).join(' && ')
      return [
        {
          $el: 'div',
          attrs: {
            class: 'text-left col-span-1 leading-none',
          },
          if: condition,
          children: o.label,
        },
        {
          $cmp: 'amount',
          if: condition,
          props: {
            class: 'text-right col-start-2 h-100 self-center leading-none',
            prefix: o.prefix,
          },
          children: `$output.${o.name}`,
        },
      ]
    })
    .flat()
}
const outputFederal = {
  $el: 'div',
  attrs: {
    class: 'col-span-1 md:col-span-2 rounded-md p-2 border border-gray-200 h-fit text-center',
  },
  children: [
    {
      $cmp: 'amount',
      props: {
        class: 'font-semibold',
      },
      children: '$output.netftax',
    },
    {
      $el: 'p',
      attrs: {
        class: 'text-sm text-gray-500',
      },
      children: 'Federal Tax',
    },
    {
      $el: 'div',
      attrs: {
        class: 'summary',
      },
      children: varsToRows(federalIncomeVars),
    },
    {
      $el: 'div',
      attrs: {
        class: 'summary',
      },
      children: varsToRows(federalCreditVars),
    },
    {
      $el: 'div',
      attrs: {
        class: 'summary',
      },
      children: varsToRows(federalTaxVars),
    },
  ],
}
const outputState = {
  $el: 'div',
  attrs: {
    class: 'col-span-1 md:col-span-2 rounded-md p-2 border border-gray-200 h-fit text-center',
  },
  if: '$get(state).value',
  children: [
    {
      $cmp: 'amount',
      props: {
        class: 'font-semibold',
      },
      children: '$output.siitax',
    },
    {
      $el: 'p',
      attrs: {
        class: 'text-sm text-gray-500',
      },
      children: 'State Tax',
    },
    {
      $el: 'div',
      attrs: {
        class: 'summary',
      },
      children: varsToRows(stateIncomeVars),
    },
    {
      $el: 'div',
      attrs: {
        class: 'summary',
      },
      children: varsToRows(stateTaxVars),
    },
  ],
}

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
    value: getParam('mstat') || 'single',
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
        value: getParam('page'),
        help: '$: "Age of taxpayer as of 12/31/" + $get(year).value',
      },
      {
        $formkit: 'numeric',
        name: 'sage',
        label: 'Spouse Age',
        min: 0,
        placeholder: '0',
        value: getParam('sage'),
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
    value: getParam('depx'),
    placeholder: '0',
    min: 0,
    if: '$get(mstat).value == "headOfHousehold" || $get(mstat).value == "married" || $get(mstat).value == "marriedFilingSeparately"',
    help: {
      if: '$get(year).value * 1 <= 2017',
      then: 'Affects personal exemption calculation',
      else: {
        if: '$get(year).value * 1 >= 2018',
        then: 'Affects child tax credit',
        else: '',
      },
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
        children: {
          if: '$get(year).value * 1 == 2021',
          then: 'Affects EITC, CTC and CCC',
          else: {
            if: '$get(year).value * 1 >= 2018',
            then: 'Affects EITC and CTC',
            else: 'Affects EITC',
          },
        },
      },
      {
        $formkit: 'numeric',
        name: 'age1',
        value: getParam('age1') || '1',
        min: 1,
        if: '$get(depx).value * 1 > 0',
      },
      {
        $formkit: 'numeric',
        name: 'age2',
        value: getParam('age2') || '1',
        outerClass: '-mt-3',
        min: 1,
        if: '$get(depx).value * 1 > 1',
      },
      {
        $formkit: 'numeric',
        name: 'age3',
        value: getParam('age3') || '1',
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

function aHref(text, href) {
  return {
    $el: 'a',
    attrs: {
      href,
    },
    children: text,
  }
}

const incomeVars = [
  {
    name: 'pwages',
    spouse: 'swages',
    label: 'Wages and Salaries',
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
          innerHTML: /*html*/ `Wages, salaries, and tips are reported to you on <a href="https://en.wikipedia.org/wiki/Form_W-2">Form W‑2</a>.`,
        },
      },
      {
        $el: 'div',
        children: [
          `Employers and employees split payroll taxes as per `,
          aHref('FICA', 'https://en.wikipedia.org/wiki/Federal_Insurance_Contributions_Act_tax'),
          `, to fund `,
          aHref('Medicare', 'https://en.wikipedia.org/wiki/Medicare_(United_States)'),
          ` and `,
          aHref('Social Security', 'https://en.wikipedia.org/wiki/Social_Security_(United_States)'),
          `. Your portion of the payroll tax`,
          {
            $el: 'span',
            if: '$help.tfica * 1 >= 1',
            children: [
              ' (',
              {
                $cmp: 'amount',
                children: '$help.tfica',
              },
              ')',
            ],
          },
          ` is `,
          aHref('withheld from your paycheck', 'https://www.irs.gov/individuals/employees/tax-withholding'),
          ` and paid directly to the IRS in your name.`,
        ],
      },
    ],
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
const schemaIncome = incomeVars
  .map(item => ({
    $formkit: 'amount',
    id: item.name,
    name: item.name,
    key: item.name,
    label: item.label,
    help: '$output',
    outerClass: 'col-span-2',
    if: `$addIncome || $visible.${item.name}`,
    min: item.type == 'gainorloss' ? -MAX : 0,
    max: item.max || MAX,
    step: STEP,
    delay: 0,
    value: getParam(item.name) || 0,
    sectionsSchema: {
      help: item.help
        ? {
            $el: 'div',
            if: '$help',
            attrs: {
              class: 'text-xs font-normal text-gray-500 mt-1 mb-2 leading-tight pt-2 px-3 border-t border-gray-100',
            },
            children: item.help,
          }
        : {
            $el: null,
            children: [],
          },
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
  .concat([
    {
      $el: 'button',
      attrs: {
        class:
          'block p-2 px-4 mb-6 rounded-full border border-gray-200 text-sm text-center mx-auto font-medium bg-gray-100 hover:text-blue-700',
        onClick: '$toggleAddIncome',
      },
      children: {
        if: '$addIncome',
        then: ['Done'],
        else: ['+ ', ' Add'],
      },
    },
  ])

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
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
          innerHTML: /*html*/ `The <a href="https://en.wikipedia.org/wiki/CARES_Act">CARES Act</a> provided economic stimulus rebates to all US taxpayers.`,
        },
      },
    ],
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
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
          innerHTML: /*html*/ `Income below the <a href="https://en.wikipedia.org/wiki/Standard_deduction">Standard Deduction</a> amount is tax free.`,
        },
      },
      {
        $el: 'div',
        children: [
          'The standard deduction amount varies based on filing status and other demographic factors, and increases year-by-year based on inflation. You may elect to itemize your deductions if they add up to more than the standard amount.',
        ],
      },
    ],
  },
]
const schemaCredits = creditOuts
  .map(o => ({
    $el: 'div',
    if: `$output.${o.name} * 1 > 0`,
    attrs: {
      class: 'credit-out col-span-2 font-bold text-sm rounded-md border border-gray-200 mb-4 py-3',
    },
    children: [
      {
        $el: 'div',
        attrs: {
          class: 'px-3',
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
      },
      o.help
        ? {
            $el: 'div',
            attrs: {
              class: 'text-xs font-normal text-gray-500 mt-2 leading-tight pt-2 px-3 border-t border-gray-100',
            },
            children: o.help,
          }
        : null,
    ].filter(o => !!o),
  }))
  .concat(
    creditsVars.map(item => ({
      $formkit: 'amount',
      id: item.name,
      name: item.name,
      key: item.name,
      label: item.label,
      help: item.help,
      outerClass: 'col-span-2',
      if: `$addCredits || $visible.${item.name}`,
      min: 0,
      max: item.max || MAX,
      step: STEP,
      delay: 0,
      value: getParam(item.name) || 0,
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
  .concat([
    {
      $el: 'button',
      attrs: {
        class:
          'block p-2 px-4 mb-6 rounded-full border border-gray-200 text-sm text-center mx-auto font-medium bg-gray-100 hover:text-blue-700',
        onClick: '$toggleAddCredits',
      },
      children: {
        if: '$addCredits',
        then: ['Done'],
        else: ['+ ', ' Add'],
      },
    },
  ])

const data = ref({})
const visible = ref({})
const debug = ref(!!getParam('debug'))
const output = ref({})
const addCredits = ref(false)
const addIncome = ref(false)

for (let o of [incomeVars, creditsVars].flat()) {
  if (getParam(o.name)) {
    visible.value = {...visible.value, [o.name]: true}
  }
}

const schemaData = reactive({
  visible,
  output,
  addCredits,
  addIncome,
  toggleAddIncome: () => {
    addIncome.value = !addIncome.value
  },
  toggleAddCredits: () => {
    addCredits.value = !addCredits.value
  },
  filingStatusInfo: () => {
    switch (data.value.mstat) {
      case 'dependent':
        return 'Typically a child with income'
      default:
        return ''
    }
  },
})

function getParam(name) {
  const url = new URL(window.location)
  const params = url.searchParams || {get: () => null}
  return params.get(name)
}

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
  for (let k in data.value) {
    let v = data.value[k]
    if (v === undefined || v == 0 || v == '0') {
      url.searchParams.delete(k)
      continue
    }
    url.searchParams.set(k, v)
  }
  window.history.replaceState('', '', url)
  for (let o of incomeVars) {
    if (addIncome.value && getParam(o.name)) {
      visible.value = {...visible.value, [o.name]: true}
    }
  }
  for (let o of creditsVars) {
    if (addCredits.value && getParam(o.name)) {
      visible.value = {...visible.value, [o.name]: true}
    }
  }

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
  out.netftax = parseFloat(out.fiitax) + parseFloat(out.tfica)
  out.stax = parseFloat(out.siitax) + parseFloat(out.v40)
  out.socredit = parseFloat(out.v40) - parseFloat(out.v37) - parseFloat(out.v38) - parseFloat(out.v39)
  output.value = out
  error.value = null
}

const error = ref()
onErrorCaptured(err => {
  error.value = err
})
</script>

<template>
  <FormKit type="group" v-model="data" @load="recompute" @input="recompute">
    <div class="flex flex-col md:flex-row">
      <main class="min-h-screen p-4 pt-2 mx-auto max-w-4xl">
        <div>
          <p class="text-xl md:text-2xl text-gray-600 font-bold"><a href="/">taxsim.app</a></p>
          <p class="text-sm md:text-md text-gray-500 pb-2 leading-tight -mt-[0.1em]">
            <span class="font-semibold">an interactive US Individual Income Tax simulator</span>
          </p>
          <div class="grid grid-cols-2 gap-x-4 md:gap-x-12 md:grid-cols-4 pt-3 pb-3 md:px-12">
            <FormKitSchema
              :schema="[schemaFederal, schemaState, outputFederal, outputState].flat()"
              :data="schemaData"
            />
          </div>
        </div>
        <div v-if="error">{{ error }}</div>
        <div class="grid grid-cols-2 gap-x-4 md:grid-cols-4">
          <heading class="col-start-0 col-span-2 md:col-span-4">Demographics</heading>
          <FormKitSchema :schema="schemaDemographics" :data="schemaData" />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 mb-6">
          <div>
            <heading class="col-start-0 col-span-2 md:col-span-4">Deductions &amp; Credits</heading>
            <FormKitSchema :schema="schemaCredits" :data="schemaData" />
          </div>
          <div>
            <heading class="col-start-0 col-span-2 md:col-span-4">Income</heading>
            <FormKitSchema :schema="schemaIncome" :data="schemaData" />
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4" v-if="debug">
          <div>
            <heading>Debug Input</heading>
            <pre class="data">{{ data }}</pre>
          </div>
          <div>
            <heading>Debug Output</heading>
            <pre class="data" v-if="output">{{ output }}</pre>
          </div>
        </div>
        <div class="mt-3 mb-3 border-t border-gray-100 pt-8 footer">
          <p class="text-center text-sm md:text-md text-gray-400 pb-2 leading-tight">
            taxsim.app is <a href="https://github.com/tmm1/taxsim.app">open-source</a> and free to use
            <br />
            tax scenarios are calculated locally in your browser, using a
            <a href="https://github.com/tmm1/taxsim.js">WASM build</a> of
            <a href="https://taxsim.nber.org">NBER TAXSIM</a>
          </p>
        </div>
      </main>
    </div>
  </FormKit>
</template>

<style lang="postcss">
main {
  @apply bg-white;
}
.credit-out a,
.formkit-outer[data-type='amount'] a,
.footer a {
  @apply decoration-slate-300 underline;
}
pre.data {
  @apply font-mono mx-10 my-4;
  font-size: 10pt;
  overflow-x: auto;
}
.summary {
  @apply border-t border-gray-100 pt-3 mt-2 px-2 grid grid-cols-2 gap-x-1 gap-y-1 text-xs text-gray-500 empty:hidden;
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
  .formkit-prefix button,
  .formkit-suffix button {
    @apply font-medium;
    position: absolute;
    top: 48%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .formkit-prefix:hover,
  .formkit-suffix:hover {
    @apply text-blue-700;
  }
}
:root {
  --popper-theme-background-color: #444;
  --popper-theme-text-color: #ffffff;
  --popper-theme-border-width: 0px;
  --popper-theme-border-style: solid;
  --popper-theme-border-radius: 0.5rem;
  --popper-theme-padding: 0.5rem;
}
main .popper {
  @apply text-[0.65rem];
}
</style>

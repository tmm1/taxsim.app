<script setup>
import {ref, reactive} from 'vue'

const schemaLaws = [
  {
    $formkit: 'numeric',
    'outer-class': 'w-full col-span-1',
    name: 'year',
    id: 'year',
    label: 'Tax Year',
    value: '2020',
    min: 1960,
    max: new Date().getFullYear() + 1,
    help: 'Federal tax calculations are available from 1960 onwards',
  },
  {
    $formkit: 'select',
    name: 'state',
    label: 'State',
    help: 'State tax calculations are available from 1977 onwards',
    value: 0,
    'outer-class': 'w-full col-span-1 md:col-span-3',
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
      30: 'NewHampshire',
      31: 'NewJersey',
      32: 'NewMexico',
      33: 'NewYork',
      34: 'NorthCarolina',
      35: 'NorthDakota',
      36: 'Ohio',
      37: 'Oklahoma',
      38: 'Oregon',
      39: 'Pennsylvania',
      40: 'RhodeIsland',
      41: 'SouthCarolina',
      42: 'SouthDakota',
      43: 'Tennessee',
      44: 'Texas',
      45: 'Utah',
      46: 'Vermont',
      47: 'Virginia',
      48: 'Washington',
      49: 'WestVirginia',
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
    'outer-class': 'col-span-1',
    options: {
      single: 'Single',
      married: 'Married',
      marriedFilingSeparately: 'Married Filing Separately',
      headOfHousehold: 'Head of Household',
      dependentTaxpayer: 'Dependent Taxpayer',
    },
    value: 'single',
  },
  {
    $el: 'div',
    children: [
      {
        $formkit: 'numeric',
        name: 'page',
        label: 'Age',
        min: 0,
        help: '$: "Age of taxpayer as of 12/31/" + $get(year).value',
      },
      {
        $formkit: 'numeric',
        name: 'sage',
        label: 'Spouse Age',
        min: 0,
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
    value: '0',
    min: 0,
    if: '$get(mstat).value == "headOfHousehold" || $get(mstat).value == "married" || $get(mstat).value == "marriedFilingSeparately"',
    help: 'Affects personal exemption calculation',
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
        value: '1',
        min: 1,
        if: '$get(depx).value * 1 > 0',
      },
      {
        $formkit: 'numeric',
        name: 'age2',
        value: '1',
        'outer-class': '-mt-3',
        min: 1,
        if: '$get(depx).value * 1 > 1',
      },
      {
        $formkit: 'numeric',
        name: 'age3',
        value: '1',
        min: 1,
        'outer-class': '-mt-3',
        if: '$get(depx).value * 1 > 2',
      },
      {
        $el: 'div',
        attrs: {
          class: 'text-xs text-gray-500 -mt-4',
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
    name: 'stcg',
    label: 'Short-term Capital Gain or Loss',
  },
  {
    name: 'ltcg',
    label: 'Long-term Capital Gain or Loss',
  },
]
const MAX = 500 * 1000
const STEP = 500
const schemaIncome = incomeVars.map(item => ({
  $formkit: 'amount',
  id: item.name,
  name: item.name,
  label: item.label,
  'outer-class': 'col-span-2 md:col-span-4',
  min: item.type == 'gainorloss' ? -MAX : 0,
  max: MAX,
  step: STEP,
  delay: 0,
  value: 0,
  sectionsSchema: {
    label: {
      children: [
        '$label',
        {
          $cmp: 'amount',
          props: {
            value: '$value',
            class: 'float-right',
          },
        },
      ],
    },
  },
}))

const data = reactive({
  year: 2020,
  mstat: 'married',
  depx: 2,
})
const output = ref(null)

const schema = schemaLaws.concat(schemaDemographics).concat(schemaIncome)
const schemaData = reactive({
  filingStatusInfo: () => {
    switch (data.mstat) {
      case 'dependentTaxpayer':
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
    case 'dependentTaxpayer':
      return '8'
  }
}

async function recompute(input) {
  let res = await taxsim({
    ...input,
    mstat: filingStatus(input.mstat),
    idtl: 2,
    //idtl: 5,
  })
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
  <div class="grid grid-cols-2 gap-x-4 md:grid-cols-4">
    <FormKit type="group" v-model="data" @load="recompute" @input="recompute">
      <FormKitSchema :schema="schema" :data="schemaData" />
    </FormKit>
  </div>

  <h2>Input</h2>
  <pre class="data">{{ data }}</pre>

  <h2>Output</h2>
  <pre class="data">{{ output }}</pre>
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
    width: 2em;
    height: 2em;
    text-align: center;
    margin: 0.5em;
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

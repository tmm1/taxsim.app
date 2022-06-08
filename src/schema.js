import states from './states.js'

/* constants */

const MAX = 500 * 1000
const STEP = 500

/* helpers */

function aHref(text, href) {
  return {
    $el: 'a',
    attrs: {
      href,
    },
    children: text,
  }
}

function tooltip(name, desc) {
  return {
    $cmp: 'popper',
    props: {
      hover: true,
      arrow: true,
      placement: 'right',
      class: 'tooltip',
      content: desc,
    },
    children: [
      {
        $el: 'span',
        attrs: {
          class: 'border-b border-dashed',
        },
        children: name,
      },
    ],
  }
}

function listItems() {
  return {
    $el: 'ul',
    attrs: {
      class: 'list-disc list-inside ml-3',
    },
    children: Array.from(arguments).map(o => ({
      $el: 'li',
      children: o,
    })),
  }
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

function getParam(name) {
  const url = new URL(window.location)
  const params = url.searchParams || {get: () => null}
  return params.get(name)
}

/* settings */

export const settingsList = [
  {
    name: 'numeric',
    label: 'Numeric Entry Mode',
    help: 'Replace sliders with text boxes',
  },
  {
    name: 'debug',
    label: 'Developer Mode',
    help: 'Show TAXSIM input/outputs',
  },
]

/* demographics */

export const demographics = [
  {
    $formkit: 'radio',
    name: 'mstat',
    id: 'mstat',
    label: 'Filing Status',
    outerClass: 'col-start-1 col-span-1',
    options: {
      single: 'Single',
      married: 'Married',
      //marriedFilingSeparately: 'Married Filing Separately',
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

/* income */

export const incomeVars = [
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
    name: 'pensions',
    label: 'Taxable Pensions and IRA distributions',
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
          innerHTML: /*html*/ `Distributions from pensions, IRAs, annuities and other retirement plans are reported to you on <a href="https://en.wikipedia.org/wiki/Form_1099#Variants">Form 1099‑R</a>.`,
        },
      },
    ],
  },
  {
    name: 'gssi',
    label: 'Gross Social Security Benefits',
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
          innerHTML: /*html*/ `Social security payments are reported to you on <a href="https://en.wikipedia.org/wiki/Form_1099#Variants">Form SSA‑1099</a>.`,
        },
      },
    ],
  },
  {
    name: 'pui',
    spouse: 'ui',
    label: 'Unemployment Compensation Received',
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
          innerHTML: /*html*/ `Unemployment insurance payments are reported to you on <a href="https://en.wikipedia.org/wiki/Form_1099#Variants">Form 1099‑G</a>.`,
        },
      },
    ],
  },
  {
    name: 'psemp',
    spouse: 'ssemp',
    label: 'Self-employment Income',
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
        },
        children: [
          'Self-employment income is subject to ',
          aHref('self-employment taxes', 'https://en.wikipedia.org/wiki/Self-employment#Taxation'),
        ],
      },
      {
        $el: 'div',
        children: [
          'Tax is similar to the tax on wages, except you pay both the employer and employee portion of the ',
          tooltip('FICA', 'Federal Insurance Contributions Act'),
          ' payroll tax. ',
          'Self-employment income is reported by you on Schedule C, and self-employment tax is computed on Schedule SE of your tax return.',
        ],
      },
    ],
  },
  {
    name: 'intrec',
    label: 'Taxable Interest Received',
    max: 50000,
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
          innerHTML: /*html*/ `Banks and other financial institutions report your interest income on <a href="https://en.wikipedia.org/wiki/Form_1099#Variants">Form 1099‑INT</a>.`,
        },
      },
    ],
  },
  {
    name: 'dividends',
    label: {
      if: '$get(year).value * 1 >= 2003',
      then: 'Qualified Dividend Income',
      else: 'Dividend Income',
    },
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
          innerHTML: /*html*/ `Investment funds report your dividends on <a href="https://en.wikipedia.org/wiki/Form_1099#Variants">Form 1099‑DIV</a>.`,
        },
      },
      {
        $el: 'div',
        children: {
          if: '$help.year >= 2003',
          then: [
            'Since ',
            tooltip('JGTRRA in 2003', 'Jobs and Growth Tax Relief Reconciliation Act of 2003'),
            ', ',
            aHref('Qualified Dividends', 'https://en.wikipedia.org/wiki/Qualified_dividend'),
            ' are taxed at long-term capital gain rates.',
          ],
          else: [
            'Dividend income has been subject to various ',
            aHref('surtaxes and exemptions', 'https://en.wikipedia.org/wiki/Qualified_dividend#History'),
            ' over time.',
          ],
        },
      },
    ],
  },
  {
    name: 'stcg',
    label: 'Short-term Capital Gain or Loss',
    type: 'gainorloss',
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
          innerHTML: /*html*/ `Stock brokerages report your gains and losses on <a href="https://en.wikipedia.org/wiki/Form_1099#Variants">Form 1099‑B</a>.`,
        },
      },
    ],
  },
  {
    name: 'ltcg',
    label: 'Long-term Capital Gain or Loss',
    type: 'gainorloss',
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
          innerHTML: /*html*/ `Stock brokerages report your gains and losses on <a href="https://en.wikipedia.org/wiki/Form_1099#Variants">Form 1099‑B</a>.`,
        },
      },
      {
        $el: 'div',
        children: [
          'Long-term gains from assets held for more than a year are taxed at a lower ',
          aHref('capital gains rate', 'https://en.wikipedia.org/wiki/Capital_gains_tax_in_the_United_States'),
          '.',
        ],
      },
    ],
  },
  {
    name: 'otherprop',
    label: 'Other Property Income',
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
        },
        children: ['Income from property, which is subject to ', tooltip('NIIT', 'Net Investment Income Tax'), '.'],
      },
      {
        $el: 'div',
        children: [
          listItems(
            'Unearned or limited partnership, and passive S-Corp profits',
            'Rental income',
            'Non-Qualified Dividends (ordinary dividends minus qualified dividends)'
          ),
        ],
      },
    ],
  },
  {
    name: 'nonprop',
    label: 'Other Non-Property Income',
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
        },
        children: [
          'Income from non-property sources, which is not subject to ',
          tooltip('NIIT', 'Net Investment Income Tax'),
          '.',
        ],
      },
      {
        $el: 'div',
        children: [listItems('Alimony', 'Non-wage fellowships', 'State income tax refunds (itemizers only)')],
      },
    ],
  },
  {
    name: 'transfers',
    label: 'Non-Taxable Transfer Income',
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
        },
        children: ['Income not taxed at federal level, but which may affect state property tax rebates.'],
      },
      {
        $el: 'div',
        children: [listItems('Welfare', 'Workers Compensation', 'Veterans Benefits', 'Child Support')],
      },
    ],
  },
]

export const incomeQBIVars = [
  {
    name: 'pbusinc',
    label: 'Qualified Business Income',
    if: '$get(year).value * 1 >= 2018',
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
        },
        children: [
          'Qualified business income may be eligible for up to a ',
          aHref('20% deduction', 'https://www.irs.gov/newsroom/qualified-business-income-deduction'),
          ' since the ',
          tooltip('TCJA', 'Tax Cuts and Jobs Act of 2017'),
        ],
      },
    ],
  },
  {
    name: 'scorp',
    label: 'Active SSTB S-Corp Income',
    if: '$get(year).value * 1 >= 2018',
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
        },
        children: [
          tooltip('SSTB', 'Specified Service Trade or Business'),
          ' may be eligible for up to a ',
          aHref('20% deduction', 'https://www.irs.gov/newsroom/qualified-business-income-deduction'),
          ' since the ',
          tooltip('TCJA', 'Tax Cuts and Jobs Act of 2017'),
        ],
      },
    ],
  },
  {
    name: 'pprofinc',
    label: 'Other SSTB Income',
    if: '$get(year).value * 1 >= 2018',
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
        },
        children: [
          tooltip('SSTB', 'Specified Service Trade or Business'),
          ' may be eligible for up to a ',
          aHref('20% deduction', 'https://www.irs.gov/newsroom/qualified-business-income-deduction'),
          ' since the ',
          tooltip('TCJA', 'Tax Cuts and Jobs Act of 2017'),
        ],
      },
    ],
  },
]

function incomeToInput(item) {
  return {
    $formkit: 'amount',
    id: item.name,
    name: item.name,
    key: item.name,
    label: item.label,
    inputType: {
      if: '$settings.numeric',
      then: 'number',
      else: 'range',
    },
    outerClass: 'col-span-2',
    if: [item.if, `($addIncome || $visible.${item.name})`].filter(f => !!f).join('&&'),
    min: item.type == 'gainorloss' ? -MAX : 0,
    max: item.max || MAX,
    step: STEP,
    delay: 0,
    value: getParam(item.name) || 0,
    help: '$output',
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
  }
}

export const income = incomeVars
  .concat(incomeQBIVars)
  .map(item => incomeToInput(item))
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

/* credits and deductions */

export const creditsVars = [
  {
    name: 'childcare',
    label: 'Child Care Expenses',
    max: 25000,
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
        },
        children: [
          'Expenses for child and dependent care, including some household expenses, affect the ',
          aHref('Child Care Credit', 'https://en.wikipedia.org/wiki/Child_and_Dependent_Care_Credit'),
        ],
      },
    ],
  },
  {
    name: 'rentpaid',
    label: 'Rent Paid',
    if: '$get(state).value',
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
        },
        children: ["Rent payments may be eligible for a renters' tax credit."],
      },
    ],
  },
  {
    name: 'proptax',
    label: 'Real Estate Taxes Paid',
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
        },
        children: [
          'Real estate taxes feed into ',
          aHref('itemized deductions', 'https://en.wikipedia.org/wiki/Itemized_deduction'),
          '.',
        ],
      },
      {
        $el: 'div',
        children: ['Affects ', tooltip('AMT', 'Alternative Minimum Tax'), ' and state property tax rebates.'],
      },
    ],
  },
  {
    name: 'mortgage',
    label: 'Itemized Deductions',
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
        },
        children: [
          aHref('Itemized deductions', 'https://en.wikipedia.org/wiki/Itemized_deduction'),
          ' can be claimed instead of the ',
          aHref('Standard Deduction', 'https://en.wikipedia.org/wiki/Standard_deduction'),
          '.',
        ],
      },
      {
        $el: 'div',
        children: [
          'Include entries from Schedule A which do not affect ',
          tooltip('AMT', 'Alternative Minimum Tax'),
          ':',
          listItems(
            'Home mortgage interest',
            ['Deductible medical expenses'],
            'Motor Vehicle registration fees',
            'Charitable contributions',
            'Casulty or Theft losses'
          ),
        ],
      },
    ],
  },
  {
    name: 'otheritem',
    label: ['Other Itemized Deductions'],
    max: 25000,
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
        },
        children: [
          'Other ',
          aHref('itemized deductions', 'https://en.wikipedia.org/wiki/Itemized_deduction'),
          ', which are a preference for ',
          tooltip('AMT', 'Alternative Minimum Tax'),
          '.',
        ],
      },
      {
        $el: 'div',
        children: [
          'These include the following entries from Schedule A:',
          listItems(
            'Other state and local taxes',
            [
              'Deductible medical expenses (',
              aHref('preference share only', 'https://taxsim.nber.org/taxsim-calc9/medical_deduction.html'),
              ')',
            ],
            'Miscellaneous expenses'
          ),
        ],
      },
    ],
  },
  {
    name: 'nonprop_adjust',
    label: 'Other Adjustments',
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
        },
        children: ['Adjustments to income, including'],
      },
      {
        $el: 'div',
        children: [
          listItems('Alimony Paid', 'Keogh and IRA contributions', 'Foreign Income Exclusion', 'Net Operating Losses'),
        ],
      },
    ],
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
          innerHTML: /*html*/ `The <a href="https://en.wikipedia.org/wiki/CARES_Act">CARES Act</a> provides economic stimulus rebates to all US taxpayers.`,
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
    label: 'Child & Dependent Care Credit',
  },
  {
    name: 'v25',
    label: 'Earned Income Credit',
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
          innerHTML: /*html*/ `The <a href="https://en.wikipedia.org/wiki/Earned_income_tax_credit">EITC</a> provides tax rebates for low- to moderate-income working individuals and couples, particularly those with children.`,
        },
      },
    ],
  },
  {
    name: 'v14',
    label: 'Personal Exemption',
    help: [
      {
        $el: 'div',
        attrs: {
          class: 'font-semibold mb-0.5',
          innerHTML: /*html*/ `The <a href="https://en.wikipedia.org/wiki/Personal_exemption">Personal Exemption</a> is a tax deduction, similar to but distinct from the Standard Deduction.`,
        },
      },
    ],
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

export const credits = creditOuts
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
      inputType: {
        if: '$settings.numeric',
        then: 'number',
        else: 'range',
      },
      outerClass: 'col-span-2',
      if: [item.if, `$addCredits || $visible.${item.name}`].filter(o => !!o).join(' && '),
      min: 0,
      max: item.max || MAX,
      step: STEP,
      delay: 0,
      value: getParam(item.name) || 0,
      help: '$output',
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

/* federal */

export const federalYear = {
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

const federalIncomeVars = [
  {
    name: 'v10',
    label: [tooltip('AGI', 'Adjusted Gross Income')],
  },
  {
    name: 'v14',
    label: 'Personal Exemption',
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
    label: [tooltip('AMT', 'Alternative Minimum Tax')],
    prefix: '+',
  },
  {
    name: 'v43',
    label: [tooltip('NIIT', 'Net Investment Income Tax')],
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
    label: [tooltip('CARES', 'Coronavirus Aid, Relief, and Economic Security Act'), ' Recovery Rebate'],
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
    label: [tooltip('FICA', 'Federal Insurance Contributions Act'), ' Tax Withheld'],
    prefix: '+',
  },
  {
    name: 'netftax',
    label: 'Net Tax',
    prefix: '=',
  },
]

export const federalOutput = {
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

/* state */

export const statePicker = {
  $formkit: 'select',
  name: 'state',
  id: 'state',
  value: getParam('state') || 0,
  outerClass: 'w-full col-span-1 md:col-span-2 mb-1',
  inputClass: 'font-semibold text-center md:indent-2',
  options: states,
  help: 'State tax calculations are available from 1977 onwards',
}

const stateIncomeVars = [
  {
    name: 'v32',
    label: [tooltip('AGI', 'Adjusted Gross Income')],
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
    label: [tooltip('Other Credits', 'Fuel Credit, Low Income Credit, etc')],
    prefix: '-',
  },
  {
    name: 'siitax',
    label: 'Net Tax',
    prefix: '=',
  },
]

export const stateOutput = {
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

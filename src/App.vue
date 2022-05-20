<script>
import {CogIcon, ClipboardCopyIcon, ClipboardCheckIcon} from '@heroicons/vue/outline'

export default {
  components: {CogIcon, ClipboardCopyIcon, ClipboardCheckIcon},
}
</script>

<script setup>
import {ref, reactive, onErrorCaptured, nextTick} from 'vue'
import {
  settingsList,
  incomeVars,
  creditsVars,
  credits as schemaCredits,
  demographics as schemaDemographics,
  income as schemaIncome,
  federalYear,
  federalOutput,
  statePicker,
  stateOutput,
} from './schema.js'

const settings = ref({debug: !!getParam('debug'), numeric: !!getParam('settings.numeric')})
const data = ref({settings})
const visible = ref({})
const output = ref({})
const outputRaw = ref('')
const outputCSV = ref('')
const input = ref({})
const inputCSV = ref('')
const addCredits = ref(false)
const addIncome = ref(false)
const copiedInput = ref(false)
const copiedOutput = ref(false)

for (let o of [incomeVars, creditsVars].flat()) {
  if (getParam(o.name)) {
    visible.value = {...visible.value, [o.name]: true}
  }
}

const schemaData = reactive({
  visible,
  output,
  settings,
  addCredits,
  addIncome,
  toggleAddIncome: () => {
    addIncome.value = !addIncome.value
  },
  toggleAddCredits: () => {
    addCredits.value = !addCredits.value
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
      return 1
    case 'headOfHousehold':
      return 1
    case 'married':
      return 2
    case 'marriedFilingSeparately':
      return 6
    case 'dependent':
      return 8
  }
}

async function recompute(data) {
  var url = new URL(window.location)
  for (let k in data) {
    let v = data[k]
    if (k == 'debug') {
      for (let kk in v) {
        let vv = v[kk]
        if (vv) {
          url.searchParams.set('debug.' + kk, vv)
        }
      }
    } else if (k == 'settings') {
      if (v.debug) url.searchParams.set('debug', '1')
      else {
        url.searchParams.delete('debug')
        url.searchParams.delete('debug.input')
        url.searchParams.delete('debug.output')
      }
      if (v.numeric) url.searchParams.set('settings.numeric', '1')
      else url.searchParams.delete('settings.numeric')
    } else {
      if (v === undefined || v == 0 || v == '0') {
        url.searchParams.delete(k)
        continue
      }
      url.searchParams.set(k, v)
    }
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

  let {settings, debug, nonprop, nonprop_adjust, mstat, ...vars} = data
  let inp = {
    mstat: filingStatus(mstat),
  }
  let nprop = parseFloat(nonprop || 0) - parseFloat(nonprop_adjust || 0)
  if (nprop) inp.nonprop = nprop
  for (let o in vars) {
    if (vars[o]) {
      inp[o] = parseFloat(vars[o])
    }
  }
  inputCSV.value =
    Object.keys(inp).join(',') +
    '\n' +
    Object.keys(inp)
      .map(k => inp[k])
      .join(',') +
    '\n'
  let res = await taxsim({
    ...inp,
    idtl: 2,
  })
  outputCSV.value = res
  let lines = res.split('\r\n')
  let keys = lines[0].split(',')
  let vals = lines[1].split(',')
  let out = {}
  for (let [i, val] of vals.entries()) {
    out[keys[i]] = parseFloat(val)
  }
  out.netftax = out.fiitax + out.tfica
  out.socredit = out.v40 - out.v37 - out.v38 - out.v39

  input.value = inp
  output.value = out
  outputRaw.value = await taxsim({
    ...inp,
    idtl: 5,
  })
  error.value = null

  let start = document.getElementById('demographics')
  let startY = start.getBoundingClientRect().top
  nextTick(() => {
    let diffY = start.getBoundingClientRect().top - startY
    if (diffY != 0) {
      let scrollY = window.scrollY
      if (scrollY != 0) {
        //console.log('recompute', {diffY, scrollY, startY})
        window.scroll({top: scrollY + diffY})
      }
    }
  })
}

const error = ref()
onErrorCaptured(err => {
  error.value = err
})

async function copyText(txt) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(txt)
    return
  }
  document.oncopy = function (e) {
    e.clipboardData.setData('text/plain', txt)
    e.preventDefault()
  }
  document.execCommand('copy')
}

async function copyInput() {
  let dbg = data.value.debug
  await copyText(dbg.input == 'csv' ? inputCSV.value : JSON.stringify(input.value, null, 2))
  copiedInput.value = true
  await new Promise(resolve => setTimeout(resolve, 3000))
  copiedInput.value = false
}

async function copyOutput() {
  let dbg = data.value.debug
  await copyText(
    dbg.output == 'csv'
      ? outputCSV.value
      : dbg.output == 'text'
      ? outputRaw.value
      : JSON.stringify(output.value, null, 2)
  )
  copiedOutput.value = true
  await new Promise(resolve => setTimeout(resolve, 3000))
  copiedOutput.value = false
}
</script>

<template>
  <FormKit type="group" v-model="data" @input="recompute">
    <div class="flex flex-col md:flex-row">
      <main class="min-h-screen p-4 pt-2 mx-auto max-w-4xl">
        <div>
          <p class="float-right pt-1">
            <popper class="menu" offset-distance="6" placement="bottom-end">
              <CogIcon class="h-5 aspect-square text-gray-600 cursor-pointer" />
              <template #content>
                <p class="text-gray-600 font-semibold mx-auto text-sm mb-2">Settings</p>
                <div class="ml-3">
                  <FormKit type="group" name="settings">
                    <FormKit
                      type="checkbox"
                      v-for="s in settingsList"
                      :key="s.name"
                      :label="s.label"
                      :name="s.name"
                      :help="s.help"
                      outer-class="$reset"
                      fieldset-class="mx-auto max-w-fit"
                      legend-class="text-gray-600 font-semibold"
                      input-class="rounded-sm border border-gray-200"
                      label-class="$reset text-gray-600 text-xs -mt-1 mb-1"
                      help-class="ml-6 -mt-3 p-0"
                    />
                  </FormKit>
                </div> </template
            ></popper>
          </p>
          <p class="text-xl md:text-2xl text-gray-600 font-bold"><a href="/">taxsim.app</a></p>
          <p class="text-sm md:text-md text-gray-500 pb-2 leading-tight -mt-[0.1em]">
            <span class="font-semibold">an interactive US Individual Income Tax simulator</span>
          </p>
          <div class="grid grid-cols-2 gap-x-4 md:gap-x-12 md:grid-cols-4 pt-3 pb-1 md:px-12">
            <FormKitSchema :schema="[federalYear, statePicker]" :data="schemaData" />
          </div>
          <div
            class="border border-red-300 rounded-lg whitespace-pre-wrap text-rose-400 p-3 mb-6 md:mx-12"
            v-if="error"
          >
            {{ error }}
          </div>
          <div class="grid grid-cols-2 gap-x-4 md:gap-x-12 md:grid-cols-4 pb-3 md:px-12" v-else>
            <FormKitSchema :schema="[federalOutput, stateOutput].flat()" :data="schemaData" />
          </div>
        </div>
        <div id="demographics" class="grid grid-cols-2 gap-x-4 md:grid-cols-4">
          <heading class="col-start-0 col-span-2 md:col-span-4">Demographics</heading>
          <FormKitSchema :schema="schemaDemographics" :data="schemaData" />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <div>
            <heading class="col-start-0 col-span-2 md:col-span-4">Deductions &amp; Credits</heading>
            <FormKitSchema :schema="schemaCredits" :data="schemaData" />
          </div>
          <div>
            <heading class="col-start-0 col-span-2 md:col-span-4">Income</heading>
            <FormKitSchema :schema="schemaIncome" :data="schemaData" />
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4" v-if="settings.debug">
          <FormKit type="group" name="debug">
            <div>
              <heading>Input</heading>
              <div>
                <p class="float-right mr-2">
                  <popper
                    arrow
                    hover
                    placement="left"
                    class="tooltip"
                    @open:popper="$event && $event.type == 'click' ? copyInput() : null"
                    :content="(copiedInput ? 'Copied' : 'Copy') + ' to clipboard'"
                  >
                    <FormKit type="button" @click="copyInput"
                      ><component :is="copiedInput ? ClipboardCheckIcon : ClipboardCopyIcon" class="h-4 w-4" /></FormKit
                  ></popper>
                </p>
                <FormKit
                  type="select"
                  :options="{'': 'JSON', csv: 'CSV'}"
                  :value="getParam('debug.input')"
                  name="input"
                  outer-class="-mt-4 w-fit mx-auto"
                  input-class="$reset px-3 border-none bg-white text-sm h-fit w-fit"
                />
              </div>
              <pre class="data" v-text="inputCSV" v-if="data.debug.input == 'csv'" />
              <pre class="data" v-text="input" v-else />
            </div>
            <div>
              <heading>Output</heading>
              <div>
                <p class="float-right mr-2">
                  <popper
                    arrow
                    hover
                    placement="left"
                    class="tooltip"
                    @open:popper="$event && $event.type == 'click' ? copyOutput() : null"
                    :content="(copiedOutput ? 'Copied' : 'Copy') + ' to clipboard'"
                  >
                    <FormKit type="button" @click="copyOutput"
                      ><component :is="copiedOutput ? ClipboardCheckIcon : ClipboardCopyIcon" class="h-4 w-4"
                    /></FormKit>
                  </popper>
                </p>
                <FormKit
                  type="select"
                  :options="{'': 'JSON', csv: 'CSV', text: 'Text'}"
                  :value="getParam('debug.output')"
                  name="output"
                  outer-class="-mt-4 w-fit mx-auto"
                  input-class="$reset px-3 border-none bg-white text-sm h-fit w-fit"
                />
              </div>
              <pre class="data" v-text="outputRaw" v-if="data.debug.output == 'text'" />
              <pre class="data" v-text="outputCSV" v-else-if="data.debug.output == 'csv'" />
              <pre class="data" v-text="output" v-else />
            </div>
          </FormKit>
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
  @apply font-mono mx-10 my-4 whitespace-pre-line break-all text-xs text-gray-500;
}
.summary {
  @apply border-t border-gray-100 pt-3 mt-2 px-2 grid grid-cols-2 gap-x-1 gap-y-1 text-xs text-gray-500 empty:hidden;
}
.formkit-inner select:focus {
  outline: none;
}
.input-amount {
  input[type='number'] {
    @apply text-sm text-gray-600 border-b border-gray-400 rounded-none pb-1;
  }
  input[type='range'] {
    @apply appearance-none h-2 p-0 bg-gray-300;
  }
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
.menu {
  --popper-theme-background-color: #fff;
  --popper-theme-background-color-hover: #fff;
  --popper-theme-text-color: theme('colors.gray.500');
  --popper-theme-border-style: solid;
  --popper-theme-border-width: theme('borderWidth.DEFAULT');
  --popper-theme-border-color: theme('colors.gray.400');
  --popper-theme-border-radius: theme('borderRadius.md');
  --popper-theme-padding: theme('padding.3');
  --popper-theme-box-shadow: theme('dropShadow.md');
}
.tooltip {
  --popper-theme-background-color: #444;
  --popper-theme-background-color-hover: #444;
  --popper-theme-text-color: #ffffff;
  --popper-theme-border-width: 0px;
  --popper-theme-border-style: solid;
  --popper-theme-border-radius: 0.5rem;
  --popper-theme-padding: 0.5rem;
  .popper {
    @apply text-[0.65rem];
  }
}
</style>

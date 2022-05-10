<script setup>
import {ref} from 'vue'

const data = ref({})
const output = ref(null)
const schema = [
  {
    $formkit: 'number',
    name: 'year',
    label: 'Tax Year',
    value: '2020',
  },
  {
    $formkit: 'select',
    name: 'mstat',
    label: 'Filing Status',
    options: {
      1: 'Single',
      2: 'Married',
      6: 'Married Filing Separately',
      8: 'Dependent Taxpayer (Child with Income)',
    },
  },
]

async function recompute(input) {
  let res = await taxsim(input)
  output.value = res
}
</script>

<template>
  <FormKit type="group" v-model="data" @load="recompute" @input="recompute">
    <FormKitSchema :schema="schema" />
  </FormKit>

  <h2>Input</h2>
  <pre>{{ data }}</pre>

  <h2>Output</h2>
  <pre>{{ output }}</pre>
</template>

import {createInput} from '@formkit/vue'

export default createInput(
  [
    {
      $el: 'div',
      attrs: {
        class: 'input-amount',
      },
      children: [
        {
          $el: 'div',
          children: [
            {
              $el: 'button',
              children: '-',
            },
          ],
          attrs: {
            class: '$classes.prefix',
            onClick: '$handlers.decrement',
          },
        },
        {
          $el: 'input',
          bind: '$attrs',
          attrs: {
            id: '$id',
            name: '$name',
            type: '$inputType || $fns.fallbackInputType()',
            class: '$classes.input',
            onInput: '$handlers.DOMInput',
            onBlur: '$handlers.blur',
            disabled: '$disabled',
            min: '$min',
            max: '$max',
            step: '$step',
            value: '$_value',
          },
        },
        {
          $el: 'div',
          children: [
            {
              $el: 'button',
              children: '+',
            },
          ],
          attrs: {
            class: '$classes.suffix',
            onClick: '$handlers.increment',
          },
        },
      ],
    },
  ],
  {
    features: [addHandlers],
    props: ['min', 'max', 'step', 'input-type'],
  }
)

function getParam(name) {
  const url = new URL(window.location)
  const params = url.searchParams || {get: () => null}
  return params.get(name)
}

function addHandlers(node) {
  node.on('created', () => {
    node.context.fns.fallbackInputType = () => {
      return getParam('settings.numeric') ? 'number' : 'range'
    }
    node.context.handlers.increment = e => {
      e.preventDefault()
      if (node.context.disabled) return
      node.context.handlers.DOMInput(e)
      const value = parseInt(node.value) || 0
      const input = e.currentTarget.parentElement.querySelector('input')
      const step = parseInt(input.step) || 1
      if (input.max) {
        node.input(Math.min(parseInt(input.max), value + step))
      } else {
        node.input(value + step)
      }
    }
    node.context.handlers.decrement = e => {
      e.preventDefault()
      if (node.context.disabled) return
      node.context.handlers.DOMInput(e)
      const value = parseInt(node.value) || 0
      const input = e.currentTarget.parentElement.querySelector('input')
      const step = parseInt(input.step) || 1
      if (input.min) {
        node.input(Math.max(parseInt(input.min), value - step))
      } else {
        node.input(value - step)
      }
    }
  })
}

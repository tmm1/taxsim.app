import {createInput} from '@formkit/vue'

export default createInput(
  [
    {
      $el: 'div',
      attrs: {
        class: 'input-numeric',
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
            type: 'number',
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
    props: ['min', 'max', 'step'],
  }
)

function addHandlers(node) {
  node.on('created', () => {
    node.context.handlers.increment = e => {
      e.preventDefault()
      if (node.context.disabled) return
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

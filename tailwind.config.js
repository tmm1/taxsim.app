const formKitTailwind = require('@formkit/themes/tailwindcss')

module.exports = {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {},
  },
  plugins: [formKitTailwind],
}

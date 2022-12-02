/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    require('path').join(require.resolve('@skeletonlabs/skeleton')),
    './src/**/*.{html,js,svelte,ts}',
  ],
  plugins: [
    require('@skeletonlabs/skeleton/tailwind/theme.cjs'),
    require('@tailwindcss/typography'), 
  ],
}

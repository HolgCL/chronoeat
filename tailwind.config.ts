import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        chrono: {
          green:  '#1D9E75',
          yellow: '#BA7517',
          red:    '#E24B4A',
          amber:  '#EF9F27',
          violet: '#7F77DD',
        },
      },
    },
  },
  plugins: [],
}

export default config

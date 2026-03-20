import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        puc: {
          bordeaux: '#8B0033',
          red: '#E8000D',
          purple: '#5B0099',
          dark: '#2d2d3a',
          bg: '#f5f5f5',
        },
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
      maxWidth: {
        mobile: '430px',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
      },
    },
  },
  plugins: [],
}

export default config

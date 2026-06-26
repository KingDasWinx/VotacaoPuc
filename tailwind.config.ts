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
        // Verde floresta (primária)
        brand: {
          DEFAULT: '#2C4A2E',
          hover: '#3D6B40',
          muted: '#5C7A5E',
        },
        // Ouro (destaque)
        accent: {
          DEFAULT: '#C8A84B',
          hover: '#B5944A',
          tint: '#E8D49A',
        },
        canvas: '#F7F3EC', // fundo da página
        surface: '#EDE8DC', // cards / seções
        line: '#DDD8CC', // divisores
        ink: '#26302A', // texto escuro
        'on-dark': '#F5F0E8', // texto em fundos escuros
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
      maxWidth: {
        mobile: '430px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(38,48,42,0.04), 0 8px 24px -12px rgba(38,48,42,0.15)',
        'card-hover': '0 2px 4px rgba(38,48,42,0.06), 0 16px 40px -16px rgba(38,48,42,0.25)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out both',
        'fade-up': 'fade-up 0.5s ease-out both',
        'scale-in': 'scale-in 0.35s ease-out both',
        'slide-up': 'slide-up 0.3s ease-out',
      },
    },
  },
  plugins: [],
}

export default config

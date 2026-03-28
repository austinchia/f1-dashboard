/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        accent: '#E8001D',
        'accent-hover': '#CC0019',
        'bg-primary': '#111111',
        'bg-hero': '#1C1C1C',
        surface: '#2C2C2C',
      },
      fontFamily: {
        display: ['Orbitron', 'monospace'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-down': {
          '0%': { opacity: '0', transform: 'translateY(-24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(60px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(8px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s ease-out forwards',
        'fade-down': 'fade-down 0.7s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.8s ease-out forwards',
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'bounce-slow': 'bounce-slow 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};


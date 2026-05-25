import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content:  [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        lime: { DEFAULT: '#C8F135' },
        brand: { DEFAULT: '#C8F135', dark: '#9ec214' },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config

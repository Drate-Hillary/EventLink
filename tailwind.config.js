/** @type {import('tailwindcss').Config} */
import animate from 'tailwindcss-animate'

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ['class'],
  theme: {
    extend: {
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
      fontFamily: { sans: ['OpenAISans', 'ui-sans-serif', 'system-ui', 'sans-serif'], serif: ['OpenAISans', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        border: 'hsl(var(--border))', input: 'hsl(var(--input))', ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))', foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        navy: { 950: '#000000', 900: '#000000', 800: '#1F1F1F', 700: '#404040', 100: '#EDEDED' },
        teal: { 800: '#171717', 700: '#262626', 200: '#D4D4D4', 600: '#0A0A0A', 500: '#A3A3A3', 100: '#E8E8E8', 50: '#F3F3F3' },
        gold: { 500: '#8C8C8C', 100: '#EFEFEF' },
        ivory: '#FAFAFA',
        slate: { 400: '#737373', 500: '#404040', 600: '#262626', 700: '#171717' },
        soft: '#E4E4E2',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.06), 0 8px 24px -12px rgba(0,0,0,.14)',
        lift: '0 2px 4px rgba(0,0,0,.06), 0 20px 40px -16px rgba(0,0,0,.28)',
      },
    },
  },
  plugins: [animate],
}

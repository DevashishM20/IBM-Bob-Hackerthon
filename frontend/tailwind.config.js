/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Legacy brand tokens (kept for any remaining references)
        brand: {
          blue:   '#3b82d4',
          purple: '#7c5cd8',
        },
        // Dark dashboard palette
        navy: {
          950: '#060818',
          900: '#0b0f2a',
          800: '#0f1535',
          700: '#141a42',
          600: '#1b2254',
          500: '#232c6b',
        },
        neon: {
          blue:   '#38bdf8',
          cyan:   '#22d3ee',
          purple: '#a78bfa',
          pink:   '#f472b6',
          green:  '#34d399',
        },
      },
      boxShadow: {
        'glow-blue':   '0 0 16px 2px rgba(56,189,248,0.25)',
        'glow-purple': '0 0 16px 2px rgba(167,139,250,0.25)',
        'glow-cyan':   '0 0 12px 1px rgba(34,211,238,0.20)',
      },
      backgroundImage: {
        'card-gradient': 'linear-gradient(135deg, rgba(15,21,53,0.9) 0%, rgba(20,26,66,0.95) 100%)',
        'nav-gradient':  'linear-gradient(180deg, #0b0f2a 0%, #060818 100%)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}

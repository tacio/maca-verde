/** @type {import('tailwindcss').Config} */

// Semantic names backed by CSS variables in src/styles/tokens.css.
// New UI code uses only these (bg-canvas, text-ink, bg-accent text-accent-ink…).
const tokens = {
  canvas: 'var(--canvas)',
  surface: 'var(--surface)',
  'surface-2': 'var(--surface-2)',
  line: 'var(--line)',
  ink: 'var(--ink)',
  'ink-muted': 'var(--ink-muted)',
  accent: 'var(--accent)',
  'accent-ink': 'var(--accent-ink)',
  'accent-soft': 'var(--accent-soft)',
  caution: 'var(--caution)',
  'caution-soft': 'var(--caution-soft)',
  rest: 'var(--rest)',
  'rest-ink': 'var(--rest-ink)',
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // TRANSITION: `extend` keeps Tailwind's palette (slate, brand…) alive for
      // legacy screens listed in scripts/lint-tokens.mjs. Once the last legacy
      // file is gone, move `colors` out of `extend` so only tokens exist.
      colors: {
        ...tokens,
        brand: {
          50: '#f2fce2',
          100: '#e1f8c0',
          200: '#c5f28a',
          300: '#a3e64d',
          400: '#84d521',
          500: '#68ba0c',
          600: '#509506',
          700: '#3e730a',
          800: '#345b0e',
          900: '#2d4d10',
          950: '#142b03',
        },
      },
      fontFamily: {
        sans: 'var(--font-sans)',
      },
      fontSize: {
        hud: ['var(--hud-digits)', { lineHeight: '1' }],
      },
      // Named (not sm/DEFAULT/lg) so legacy `rounded-lg`, `transition` keep their meaning.
      borderRadius: {
        control: 'var(--radius-sm)',
        card: 'var(--radius)',
        sheet: 'var(--radius-lg)',
      },
      transitionDuration: {
        fast: 'var(--dur-fast)',
        base: 'var(--dur)',
      },
      transitionTimingFunction: {
        calm: 'var(--ease)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 2s infinite',
      },
    },
  },
  plugins: [],
};

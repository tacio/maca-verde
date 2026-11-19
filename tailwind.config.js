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
    // Only tokens: Tailwind's default palette (slate, white…) is replaced, not extended.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      ...tokens,
    },
    extend: {
      // Preflight's default border color (was gray-200).
      borderColor: { DEFAULT: 'var(--line)' },
      fontFamily: {
        sans: 'var(--font-sans)',
      },
      fontSize: {
        hud: ['var(--hud-digits)', { lineHeight: '1' }],
      },
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
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        elevated: 'var(--bg-elevated)',
        ink: 'var(--ink)',
        muted: 'var(--ink-muted)',
        line: 'var(--line)',
        accent: 'var(--accent)',
        'accent-alt': 'var(--accent-alt)',
        glow: 'var(--node-glow)',
      },
      fontFamily: {
        display: ['"Clash Display"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Satoshi', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      maxWidth: {
        wrap: '1280px',
      },
    },
  },
  plugins: [],
}

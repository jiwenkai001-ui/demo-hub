/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f4f6fb',
          100: '#e7ecf5',
          200: '#c4d0e6',
          300: '#9aaad0',
          400: '#6c80b3',
          500: '#465d96',
          600: '#324674',
          700: '#1f2f57',
          800: '#1a2744',
          900: '#141d36',
          950: '#0d1426',
        },
        ink: {
          900: '#0f1828',
          700: '#334155',
          500: '#64748b',
          300: '#cbd5e1',
        },
        gold: {
          400: '#d4a857',
          500: '#b8893a',
          600: '#9b6f29',
        },
        danger: {
          500: '#d04343',
          600: '#b03030',
          50: '#fde8e8',
        },
        warn: {
          500: '#e09a3a',
          600: '#c47e22',
          50: '#fdf3e3',
        },
        ok: {
          500: '#3a8a5a',
          600: '#2a6f47',
          50: '#e3f3ea',
        },
        focus: {
          500: '#2f6db5',
        },
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Microsoft YaHei"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,24,40,.04), 0 4px 14px rgba(15,24,40,.06)',
        pop: '0 8px 30px rgba(15,24,40,.12)',
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
}

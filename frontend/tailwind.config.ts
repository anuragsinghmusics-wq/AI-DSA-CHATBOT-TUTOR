/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Vibrant Orange Brand Palette
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        // Crisp White / Light surface palette
        surface: {
          50:  '#ffffff',
          100: '#ffffff',
          200: '#fafafa',
          700: '#e5e7eb',  // borders / dividers
          750: '#d1d5db',  // slightly deeper border
          800: '#ffffff',  // card / panel background
          850: '#ffffff',  // nav / header background
          900: '#ffffff',  // main page background (PURE WHITE)
          950: '#f8fafc',  // soft secondary surface (code blocks, inputs)
        },
        // Intent-specific badge colors
        intent: {
          concept:       '#ea580c',
          complexity:    '#d97706',
          dryrun:        '#059669',
          debugging:     '#dc2626',
          theory:        '#f97316',
          code_review:   '#0891b2',
          visualization: '#db2777',
        },
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in':        'fadeIn 0.2s ease-out',
        'fade-in-slow':   'fadeIn 0.4s ease-out',
        'slide-up':       'slideUp 0.25s ease-out',
        'slide-down':     'slideDown 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
        'pulse-dot':      'pulseDot 1.4s infinite ease-in-out both',
        'blink':          'blink 1s step-end infinite',
        'scale-in':       'scaleIn 0.15s ease-out',
        'float':          'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseDot: {
          '0%, 80%, 100%': { transform: 'scale(0)', opacity: '0.4' },
          '40%':           { transform: 'scale(1)',  opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          700: '#1e293b',
          750: '#172033',
          800: '#0f172a',
          850: '#0c1322',
          900: '#020617',
          950: '#01030e',
        },
        // Intent-specific badge colors
        intent: {
          concept: '#6366f1',
          complexity: '#f59e0b',
          dryrun: '#10b981',
          debugging: '#ef4444',
          theory: '#8b5cf6',
          code_review: '#06b6d4',
          visualization: '#ec4899',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'fade-in-slow': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.25s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-dot': 'pulseDot 1.4s infinite ease-in-out both',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-strong': 'glowStrong 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2.5s linear infinite',
        'blink': 'blink 1s step-end infinite',
        'bounce-subtle': 'bounceSlight 1s ease-in-out infinite',
        'scale-in': 'scaleIn 0.2s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseDot: {
          '0%, 80%, 100%': { transform: 'scale(0)', opacity: '0.4' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(99, 102, 241, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)' },
        },
        glowStrong: {
          '0%': { boxShadow: '0 0 10px rgba(99, 102, 241, 0.3), 0 0 30px rgba(99, 102, 241, 0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.6), 0 0 60px rgba(99, 102, 241, 0.2)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        bounceSlight: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'radial-gradient(at 40% 20%, hsla(249, 91%, 65%, 0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(263, 91%, 65%, 0.06) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(230, 91%, 65%, 0.05) 0px, transparent 50%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

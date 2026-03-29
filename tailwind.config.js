/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,njk,md,ts,js}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Obsidian HUD — Emerald Terminal Design System
        'surface': '#0d1418',
        'surface-dim': '#0d1418',
        'surface-bright': '#333a3f',
        'surface-lowest': '#080f13',
        'surface-low': '#161d21',
        'surface-container': '#1a2125',
        'surface-high': '#242b2f',
        'surface-highest': '#2f363a',

        'primary': '#60e055',
        'primary-container': '#2bb12b',
        'on-primary': '#003a03',
        'on-primary-container': '#003b03',

        'secondary': '#44e7e7',
        'secondary-container': '#00caca',
        'on-secondary': '#003737',
        'on-secondary-container': '#005050',

        'tertiary': '#efb0ff',
        'tertiary-container': '#da69ff',
        'on-tertiary': '#54006e',
        'on-tertiary-container': '#560071',

        'on-surface': '#dce3e9',
        'on-surface-variant': '#bdcbb5',
        'outline': '#879581',
        'outline-variant': '#3e4a3a',

        'error': '#ffb4ab',
        'error-container': '#93000a',

        'inverse-surface': '#dce3e9',
        'inverse-on-surface': '#2a3136',
        'inverse-primary': '#006e0b',
      },
      fontFamily: {
        'grotesk': ['"Space Grotesk"', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'hud': '4px',
      },
      animation: {
        'bloom-pulse': 'bloomPulse 4s ease-in-out infinite alternate',
        'status-blink': 'statusBlink 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out',
      },
      keyframes: {
        bloomPulse: {
          'from': { textShadow: '0 0 8px rgba(96, 224, 85, 0.3)' },
          'to': { textShadow: '0 0 16px rgba(96, 224, 85, 0.5)' },
        },
        statusBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(8px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'ambient': '0 20px 50px -12px rgba(0, 0, 0, 0.5)',
        'glow-primary': '0 0 30px -8px rgba(96, 224, 85, 0.15)',
        'glow-secondary': '0 0 30px -8px rgba(68, 231, 231, 0.15)',
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#bdcbb5',
            maxWidth: 'none',
            lineHeight: '1.75',
            h1: {
              color: '#60e055',
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: '700',
              textShadow: '0 0 12px rgba(96, 224, 85, 0.4)',
            },
            h2: {
              color: '#44e7e7',
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: '600',
              letterSpacing: '0.02em',
            },
            h3: {
              color: '#dce3e9',
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: '600',
            },
            a: {
              color: '#44e7e7',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
              '&:hover': {
                color: '#60e055',
              },
            },
            code: {
              backgroundColor: '#080f13',
              color: '#44e7e7',
              borderRadius: '4px',
              padding: '2px 6px',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.875em',
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            pre: {
              backgroundColor: '#080f13',
              borderRadius: '4px',
              padding: '1.25rem',
            },
            'pre code': {
              backgroundColor: 'transparent',
              color: '#bdcbb5',
              padding: '0',
            },
            blockquote: {
              borderLeftColor: '#da69ff',
              backgroundColor: 'rgba(218, 105, 255, 0.05)',
              padding: '1rem 1.25rem',
              borderRadius: '0 4px 4px 0',
              color: '#efb0ff',
              fontStyle: 'normal',
            },
            strong: {
              color: '#dce3e9',
              fontWeight: '600',
            },
            em: {
              color: '#efb0ff',
            },
            hr: {
              borderColor: '#3e4a3a',
            },
            'thead th': {
              color: '#60e055',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.75rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            },
            'tbody td': {
              color: '#bdcbb5',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

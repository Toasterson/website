/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,njk,md,ts,js}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'neon-green': '#00ff41',
        'neon-cyan': '#00ffff',
        'neon-blue': '#4d9de0',
        'neon-purple': '#9d4edd',
        'neon-orange': '#ff6b35',
        'terminal-bg': '#0a0a0a',
        'terminal-border': '#333',
        'space-blue': '#0b1426',
        'deep-space': '#030712',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'text-glow': 'textGlow 2s ease-in-out infinite alternate',
        'starfield': 'starfield 20s linear infinite',
        'blink': 'blink 1s infinite',
        'scanlines': 'scanlines 0.1s linear infinite',
        'matrix-rain': 'matrixRain 3s linear infinite',
      },
      keyframes: {
        textGlow: {
          'from': { textShadow: '0 0 10px currentColor' },
          'to': { textShadow: '0 0 20px currentColor, 0 0 30px currentColor' },
        },
        starfield: {
          'from': { transform: 'translateY(0)' },
          'to': { transform: 'translateY(-100px)' },
        },
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0.3' },
        },
        scanlines: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(4px)' },
        },
        matrixRain: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      boxShadow: {
        'neon-green': '0 0 20px rgba(0, 255, 65, 0.5)',
        'neon-cyan': '0 0 20px rgba(0, 255, 255, 0.5)',
        'neon-blue': '0 0 20px rgba(77, 157, 224, 0.5)',
        'neon-purple': '0 0 20px rgba(157, 78, 221, 0.5)',
        'neon-orange': '0 0 20px rgba(255, 107, 53, 0.5)',
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#d1d5db',
            maxWidth: 'none',
            h1: {
              color: '#00ff41',
              textShadow: '0 0 10px #00ff41',
            },
            h2: {
              color: '#00ffff',
              textShadow: '0 0 10px #00ffff',
            },
            h3: {
              color: '#4d9de0',
              textShadow: '0 0 10px #4d9de0',
            },
            a: {
              color: '#00ffff',
              textDecoration: 'none',
              borderBottom: '1px solid transparent',
              transition: 'all 0.3s ease',
              '&:hover': {
                color: '#00ff41',
                borderBottomColor: '#00ff41',
                textShadow: '0 0 8px #00ff41',
              },
            },
            code: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: '#00ffff',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              borderRadius: '4px',
              padding: '2px 8px',
              fontFamily: 'JetBrains Mono, monospace',
            },
            pre: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              border: '2px solid #4d9de0',
              borderRadius: '8px',
              boxShadow: '0 0 20px rgba(77, 157, 224, 0.3)',
            },
            blockquote: {
              borderLeftColor: '#9d4edd',
              backgroundColor: 'rgba(157, 78, 221, 0.1)',
              color: '#c4b5fd',
            },
            strong: {
              color: '#ff6b35',
              fontWeight: '600',
              textShadow: '0 0 5px #ff6b35',
            },
            em: {
              color: '#9d4edd',
            },
          },
        },
        invert: {
          css: {
            '--tw-prose-body': 'rgb(209 213 219)',
            '--tw-prose-headings': 'rgb(0 255 65)',
            '--tw-prose-lead': 'rgb(156 163 175)',
            '--tw-prose-links': 'rgb(0 255 255)',
            '--tw-prose-bold': 'rgb(255 107 53)',
            '--tw-prose-counters': 'rgb(156 163 175)',
            '--tw-prose-bullets': 'rgb(75 85 99)',
            '--tw-prose-hr': 'rgb(55 65 81)',
            '--tw-prose-quotes': 'rgb(196 181 253)',
            '--tw-prose-quote-borders': 'rgb(157 78 221)',
            '--tw-prose-captions': 'rgb(156 163 175)',
            '--tw-prose-code': 'rgb(0 255 255)',
            '--tw-prose-pre-code': 'rgb(0 255 65)',
            '--tw-prose-pre-bg': 'rgb(10 10 10)',
            '--tw-prose-th-borders': 'rgb(77 157 224)',
            '--tw-prose-td-borders': 'rgb(75 85 99)',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
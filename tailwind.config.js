/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050810',
          900: '#0a0e1a',
          800: '#0f1525',
          700: '#1a2035',
          600: '#243050',
          500: '#2e3d66',
        },
        gold: {
          300: '#f5d97a',
          400: '#f0c84a',
          500: '#d4a017',
          600: '#b8860b',
          700: '#9a6e0a',
        },
        cream: {
          50: '#fefdf8',
          100: '#fdf9ee',
          200: '#f8f6f0',
          300: '#f0ebe0',
        },
        slate: {
          850: '#131929',
          950: '#090e1a',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 16px)',
      },
      boxShadow: {
        'gold-sm': '0 1px 3px 0 rgba(212, 160, 23, 0.15), 0 1px 2px -1px rgba(212, 160, 23, 0.1)',
        'gold': '0 4px 6px -1px rgba(212, 160, 23, 0.2), 0 2px 4px -2px rgba(212, 160, 23, 0.15)',
        'gold-md': '0 8px 16px -2px rgba(212, 160, 23, 0.25), 0 4px 8px -4px rgba(212, 160, 23, 0.2)',
        'gold-lg': '0 16px 32px -4px rgba(212, 160, 23, 0.3), 0 8px 16px -8px rgba(212, 160, 23, 0.25)',
        'gold-xl': '0 24px 48px -8px rgba(212, 160, 23, 0.35), 0 12px 24px -12px rgba(212, 160, 23, 0.3)',
        'gold-glow': '0 0 20px rgba(212, 160, 23, 0.4), 0 0 40px rgba(212, 160, 23, 0.2)',
        'gold-glow-sm': '0 0 10px rgba(212, 160, 23, 0.3)',
        'navy': '0 4px 16px rgba(5, 8, 16, 0.5)',
        'navy-lg': '0 8px 32px rgba(5, 8, 16, 0.6)',
        'glass': '0 8px 32px rgba(5, 8, 16, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #f5d97a 0%, #d4a017 50%, #b8860b 100%)',
        'gold-gradient-h': 'linear-gradient(90deg, #f5d97a 0%, #d4a017 50%, #b8860b 100%)',
        'navy-gradient': 'linear-gradient(180deg, #050810 0%, #0a0e1a 50%, #0f1525 100%)',
        'navy-gradient-r': 'linear-gradient(135deg, #0a0e1a 0%, #0f1525 100%)',
        'hero-gradient': 'linear-gradient(180deg, rgba(5,8,16,0) 0%, rgba(5,8,16,0.7) 60%, rgba(5,8,16,1) 100%)',
        'card-gradient': 'linear-gradient(180deg, rgba(15,21,37,0) 0%, rgba(15,21,37,0.95) 100%)',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(212, 160, 23, 0.08) 50%, transparent 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'slide-down': 'slideDown 0.4s ease-out forwards',
        'slide-in-right': 'slideInRight 0.4s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.4s ease-out forwards',
        'shimmer': 'shimmer 2s infinite linear',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 160, 23, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(212, 160, 23, 0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
        '68': '17rem',
        '72': '18rem',
        '84': '21rem',
        '88': '22rem',
        '96': '24rem',
        '104': '26rem',
        '112': '28rem',
        '128': '32rem',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
        'in-expo': 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
        'in-out-expo': 'cubic-bezier(1, 0, 0, 1)',
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
        '4xl': '1920px',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}

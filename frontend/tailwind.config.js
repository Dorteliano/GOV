/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#030712',
          paper: '#0B0F19',
          overlay: 'rgba(3, 7, 18, 0.8)',
        },
        primary: {
          DEFAULT: '#D4AF37',
          main: '#D4AF37',
          light: '#F3E5AB',
          dark: '#8A7120',
          foreground: '#000000',
        },
        secondary: {
          DEFAULT: '#1E40AF',
          main: '#1E40AF',
          light: '#60A5FA',
          dark: '#172554',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: '#D4AF37',
          foreground: '#000000',
        },
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#F9FAFB',
        },
        border: 'rgba(255, 255, 255, 0.1)',
        input: 'hsl(var(--input))',
        ring: '#D4AF37',
        foreground: '#F9FAFB',
        card: {
          DEFAULT: '#0B0F19',
          foreground: '#F9FAFB',
        },
        popover: {
          DEFAULT: '#0B0F19',
          foreground: '#F9FAFB',
        },
      },
      fontFamily: {
        heading: ['Cinzel', 'serif'],
        subheading: ['Playfair Display', 'serif'],
        body: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'fade-up': 'fadeUp 0.7s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-in': 'slideIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

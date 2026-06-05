export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta principal Ámbar (URide Brand)
        uride: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',   // Primary
          600: '#d97706',   // Primary Dark
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Paleta oscura (Night / Slate profundo)
        night: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',   // Texto secundario en fondos oscuros
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',   // Superficie oscura
          900: '#0f172a',   // Fondo principal
          950: '#020617',
        },
        // Utilidades semánticas adicionales
        info: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          700: '#0369a1',
          900: '#0c4a6e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'uride': '0 4px 14px rgba(245, 158, 11, 0.4)',
        'uride-lg': '0 10px 40px rgba(245, 158, 11, 0.3)',
        'uride-xl': '0 20px 60px rgba(245, 158, 11, 0.25)',
        'night': '0 20px 60px rgba(0, 0, 0, 0.3)',
        'night-lg': '0 25px 80px rgba(0, 0, 0, 0.4)',
      },
      borderRadius: {
        'uride': '16px',
        'uride-sm': '12px',
        'uride-xs': '8px',
      },
      backgroundImage: {
        'gradient-uride': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'gradient-night': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      }
    },
  },
  plugins: [],
}

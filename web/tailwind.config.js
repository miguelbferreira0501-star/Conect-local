/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Efeitos de hover só onde existe mouse (no celular o toque não deixa o hover "grudado").
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'rgb(var(--brand-50) / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
          200: 'rgb(var(--brand-200) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
          800: 'rgb(var(--brand-800) / <alpha-value>)',
          900: 'rgb(var(--brand-900) / <alpha-value>)',
          fg: 'rgb(var(--brand-fg) / <alpha-value>)',
        },
        accent: {
          50: 'rgb(var(--accent-50) / <alpha-value>)',
          100: 'rgb(var(--accent-100) / <alpha-value>)',
          600: 'rgb(var(--accent-600) / <alpha-value>)',
          700: 'rgb(var(--accent-700) / <alpha-value>)',
        },
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        star: 'rgb(var(--star) / <alpha-value>)',
        rule: 'rgb(var(--rule) / <alpha-value>)',
        control: 'rgb(var(--control) / <alpha-value>)',
        raised: 'rgb(var(--raised) / <alpha-value>)',
        // Pares claros de status: fundo pálido com texto escuro do mesmo tom
        success: { 50: '#dcfce7', 700: '#247b50', 900: '#14532d' },
        warning: { 50: '#fffbeb', 200: '#fde68a', 700: '#92400e' },
        danger: { 50: '#ffedea', 700: '#c4242a', 900: '#831c1e' },
      },
      fontFamily: {
        sans: ['"DM Sans Variable"', '"DM Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
      // Raios "justos": controles 6px, cartões 8px (o estilo não mistura raios suaves e justos).
      borderRadius: { xl: '6px', '2xl': '8px' },
      // Nada em repouso tem sombra; só o que flutua (menus, janelas, avisos).
      boxShadow: {
        card: 'none',
        float: '0 12px 32px rgb(17 24 39 / 0.12), 0 2px 6px rgb(17 24 39 / 0.06)',
      },
      // Curvas fortes (Emil Kowalski): resposta imediata, sem o "ease" fraco do CSS.
      transitionTimingFunction: {
        out: 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
        drawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      maxWidth: { content: '72rem' },
    },
  },
  plugins: [],
};

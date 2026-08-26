/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: 'rgb(var(--color-primary) / <alpha-value>)',
                secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
                success: 'rgb(var(--color-success) / <alpha-value>)',
                danger: 'rgb(var(--color-error) / <alpha-value>)',
                warning: 'rgb(var(--color-warning) / <alpha-value>)',
                info: 'rgb(var(--color-info) / <alpha-value>)',
                accent: 'rgb(var(--color-accent) / <alpha-value>)',
                main: 'rgb(var(--color-text) / <alpha-value>)',
                bg: 'rgb(var(--color-bg) / <alpha-value>)',
                card: 'rgb(var(--color-card) / <alpha-value>)',
                input: 'rgb(var(--color-input) / <alpha-value>)',
                sidebar: 'rgb(var(--color-sidebar) / <alpha-value>)',
                'warning-fg': 'rgb(var(--warning-fg) / <alpha-value>)',
                default: 'rgb(var(--color-border) / <alpha-value>)',
            },
            fontFamily: {
                display: ['var(--font-display)'],
                body: ['var(--font-body)'],
            },
        },
    },
    plugins: [],
}

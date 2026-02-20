import daisyui from 'daisyui'

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            animation: {
                'fade-in-up': 'fadeInUp 0.6s ease-out',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [daisyui],
    daisyui: {
        themes: [
            {
                unipjsk: {
                    "primary": "#28a745",
                    "primary-content": "#ffffff",
                    "secondary": "#343a40",
                    "secondary-content": "#ffffff",
                    "accent": "#667eea",
                    "accent-content": "#ffffff",
                    "neutral": "#6c757d",
                    "neutral-content": "#ffffff",
                    "base-100": "#ffffff",
                    "base-200": "#f8f9fa",
                    "base-300": "#e9ecef",
                    "base-content": "#333333",
                    "info": "#17a2b8",
                    "info-content": "#ffffff",
                    "success": "#28a745",
                    "success-content": "#ffffff",
                    "warning": "#ff9800",
                    "warning-content": "#ffffff",
                    "error": "#dc3545",
                    "error-content": "#ffffff",
                },
            },
            "jirai",
            "light",
            "dark",
        ],
        defaultTheme: "unipjsk",
    },
}

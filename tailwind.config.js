/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Paleta baseada na cor #C76DEA (Orquídea Vibrante)
                brand: {
                    50: '#FBF5FF',  // Fundo quase branco
                    100: '#F5E8FF', // Fundo de destaque leve
                    200: '#ECD1FE', // Bordas sutis
                    300: '#E0AOFD',
                    400: '#D285F2',
                    500: '#C76DEA', // <--- SUA COR EXATA AQUI (Botões)
                    600: '#A94CD1', // Header (Um pouco mais escuro para o texto branco ler bem)
                    700: '#8A35AD', // Hover profundo
                    800: '#6B228B', // Elementos muito escuros
                    900: '#4D1265', // Texto base
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                script: ['"Dancing Script"', 'cursive'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'fade-in-up': 'fadeInUp 0.5s ease-out',
                'fade-in-left': 'fadeInLeft 0.3s ease-out',
                'bounce-short': 'bounceShort 1s infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeInLeft: {
                    '0%': { opacity: '0', transform: 'translateX(20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                bounceShort: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                }
            }
        },
    },
    plugins: [],
}
import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
    content: [
        './app/**/*.{ts,tsx}',
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}', // אם יש לך תיקיית src
    ],
    theme: {
        extend: {},
    },
    plugins: [
        
        forms,
    ],
};

export default config;
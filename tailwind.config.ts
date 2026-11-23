import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        crypt: { 950: '#0b0a10', 900: '#13111c', 800: '#1d1a2a', 700: '#2a2640', 600: '#3b3558' },
        ecto: { 300: '#b9f5c8', 400: '#8ef0a7', 500: '#5fdc83' },
        blood: { 400: '#ff6b6b', 500: '#e5383b', 700: '#a4161a' },
        pumpkin: { 400: '#ffa94d', 500: '#ff8c1a' },
        bone: '#ece6d9',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;

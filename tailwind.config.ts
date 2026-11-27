import type { Config } from 'tailwindcss';

/** Tokens from the "late-night printshop" design (spooky_study_buddy.html). */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#121110',
        surface: { DEFAULT: '#1A1816', hover: '#221F1C' },
        rule: { DEFAULT: '#2E2B27', strong: '#4A453E' },
        bone: '#EDE6D6',
        muted: '#999184',
        dim: '#6E685F',
        amber: '#E5A93C',
        ember: '#E06D32',
        vermilion: { DEFAULT: '#E03C31', text: '#FF6B61' },
        sage: '#8FB38A',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: { sharp: '3px' },
    },
  },
  plugins: [],
};
export default config;

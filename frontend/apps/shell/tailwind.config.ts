import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../mfe/common/auth/src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(5, 7, 10)',
        card: 'rgb(16, 20, 24)',
        input: 'rgb(9, 12, 16)',
        border: 'rgb(48, 54, 61)',
      }
    },
  },
  plugins: [],
};
export default config;

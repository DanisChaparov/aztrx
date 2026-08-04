import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#3D81E3',
      },
      fontFamily: {
        manrope: ["var(--font-manrope)", "sans-serif"],
        cabin: ["var(--font-cabin)", "sans-serif"],
        "instrument-serif": ["var(--font-instrument-serif)", "serif"],
        inter: ["var(--font-inter)", "sans-serif"],
        jakarta: ["var(--font-jakarta)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

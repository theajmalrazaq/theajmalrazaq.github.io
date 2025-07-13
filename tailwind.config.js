/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        accent: "#a098ff",
        "accent-light": "rgba(160, 152, 255, 0.1)",
      },
      fontFamily: {
        "product-sans": ["Product Sans", "sans-serif"],
        recoleta: ["Recoleta", "serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      spacing: {
        15: "3.75rem",
        25: "6.25rem",
        27: "6.75rem",
        30: "7.5rem",
        45: "11.25rem",
        50: "12.5rem",
      },
      zIndex: {
        99: "99",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        ping: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      boxShadow: {
        accent: "0 0 15px rgba(160, 152, 255, 0.3)",
        "accent-animate": "0 0 20px rgba(160, 152, 255, 0.4)",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#1A2035",
          inkSoft: "#303658",
          surface: "#F8F7F2",
          line: "#E5E5E0",
          accent: "#D4AF37",
          accentDeep: "#A98014",
          accentSoft: "#F5E7B0",
          danger: "#C75146",
          warning: "#C27A21",
          success: "#2F7D4B",
        },
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Source Serif 4"', "Georgia", "serif"],
      },
      boxShadow: {
        panel: "0 24px 60px rgba(26, 32, 53, 0.14)",
        float: "0 18px 40px rgba(26, 32, 53, 0.08)",
      },
    },
  },
  plugins: [],
};

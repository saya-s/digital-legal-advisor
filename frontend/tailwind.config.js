//configures Tailwind CSS for the project, defining custom colors, fonts, and shadows to create a cohesive design system
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#1A2035", // Primary text color, which is a dark shade of blue-gray
          inkSoft: "#303658", // Secondary text color, which is a softer shade of the primary text color
          surface: "#F8F7F2", // Main background color, which is a light off-white
          line: "#E5E5E0", // Border and divider color, which is a light gray
          accent: "#D4AF37", // Primary accent color, which is a rich gold
          accentDeep: "#A98014", // Darker accent color for hover states, active states, or emphasis
          accentSoft: "#F5E7B0", // Lighter accent color for highlights, secondary buttons, or subtle emphasis
          danger: "#C75146", // Error color, which is a strong red
          warning: "#C27A21",
          success: "#2F7D4B",
        },
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"], // A clean, modern sans-serif font for UI elements and body text.
        display: ['"Source Serif 4"', "Georgia", "serif"], // A classic serif font for headings and titles, providing a strong contrast
      },
      boxShadow: {
        panel: "0 24px 60px rgba(26, 32, 53, 0.14)",
        float: "0 18px 40px rgba(26, 32, 53, 0.08)",
      },
    },
  },
  plugins: [],
};

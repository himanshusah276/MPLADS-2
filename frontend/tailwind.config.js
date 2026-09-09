/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F8FA",
        surface: "#FFFFFF",
        "surface-subtle": "#F0F2F5",
        border: "#E3E6EA",
        "border-subtle": "#EEF0F3",
        text: {
          primary: "#1A1D22",
          secondary: "#5B6270",
          muted: "#8A92A0",
        },
        accent: {
          DEFAULT: "#1B4F8C",
          hover: "#143D6D",
          light: "#E8F0FA",
        },
        status: {
          low: "#2E7D46",
          "low-bg": "#EAF5EC",
          medium: "#B98900",
          "medium-bg": "#FEF9E7",
          high: "#C4551C",
          "high-bg": "#FDF2E9",
          critical: "#B3261E",
          "critical-bg": "#FCE8E6",
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '4px',
        md: '6px',
        lg: '8px',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        surface: {
          base:    "#0a0a0f",
          raised:  "#111118",
          overlay: "#1a1a25",
          border:  "#2a2a3a",
          hover:   "#252535",
        },
        text: {
          primary:   "#f0f0f5",
          secondary: "#a0a0b0",
          muted:     "#6b6b80",
          inverse:   "#0a0a0f",
        },
        semantic: {
          success: "#22c55e",
          warning: "#eab308",
          danger:  "#ef4444",
          info:    "#3b82f6",
        },
        risk: {
          low:    "#22c55e",
          medium: "#eab308",
          high:   "#ef4444",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        xs: "0.25rem",
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
    },
  },
  plugins: [],
};

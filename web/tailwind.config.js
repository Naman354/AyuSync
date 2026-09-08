/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Exact SwasthyaSetu Figma Palette
        ayugreen: {
          DEFAULT: "#2d6e4a",
          dark: "#1e4d33",
          light: "#eaf2ec",
          soft: "#3d855e",
        },
        ayutan: {
          DEFAULT: "#cfb08d",
          light: "#f7f2ea",
          dark: "#b08f6b",
        },
        ayucream: {
          DEFAULT: "#f4f3df",
          light: "#fcfcf7",
          dark: "#e6e8cc",
        },
        ayusage: {
          DEFAULT: "#bdccd2",
          light: "#eff3f4",
          dark: "#8fa4ab",
        },
        ayuolive: {
          DEFAULT: "#5e6e39",
          light: "#eff2e8",
        },
        ayudark: "#1c3024",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}

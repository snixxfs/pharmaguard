import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        pgSoft: "0 6px 20px -8px hsl(215 25% 12% / 0.12), 0 2px 6px -2px hsl(215 25% 12% / 0.06)",
        pgLift: "0 16px 40px -16px hsl(215 25% 12% / 0.22)",
        pgInset: "inset 0 1px 0 hsl(0 0% 100% / 0.65)",
        soft: "var(--shadow-soft)",
        lift: "var(--shadow-lift)",
        glow: "var(--glow)",
      },
      backgroundImage: {
        pgRadial:
          "radial-gradient(1000px 500px at -10% -10%, hsl(var(--accent) / 0.10), transparent 60%), radial-gradient(900px 420px at 110% -10%, hsl(var(--primary) / 0.08), transparent 60%), radial-gradient(1800px 800px at 50% 120%, hsl(var(--foreground) / 0.05), transparent 70%)",
        mesh: "radial-gradient(600px circle at 20% 10%, hsla(var(--brand-teal)/0.25), transparent 50%), radial-gradient(600px circle at 80% 8%, hsla(var(--brand-violet)/0.22), transparent 55%)",
        grid: "linear-gradient(0deg, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)",
        aurora: "radial-gradient(closest-side at 30% 30%, hsla(var(--brand-teal)/0.35), transparent 70%), radial-gradient(closest-side at 70% 40%, hsla(var(--brand-cyan)/0.35), transparent 70%), radial-gradient(closest-side at 60% 70%, hsla(var(--brand-violet)/0.35), transparent 70%)",
      },
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
        safe: {
          DEFAULT: "hsl(var(--safe))",
          foreground: "hsl(var(--safe-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--danger-foreground))",
        },
        unknown: {
          DEFAULT: "hsl(var(--unknown))",
          foreground: "hsl(var(--unknown-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        pg: "22px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        floatSlow: {
          "0%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(12px, -16px, 0)" },
          "100%": { transform: "translate3d(0, 0, 0)" },
        },
        shine: {
          "0%": { opacity: "0", transform: "translateX(-100%)" },
          "50%": { opacity: "0.6" },
          "100%": { opacity: "0", transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        floatSlow: "floatSlow 20s ease-in-out infinite",
        shine: "shine 6s linear infinite",
      },
    },
  },
  plugins: [animate],
} satisfies Config;

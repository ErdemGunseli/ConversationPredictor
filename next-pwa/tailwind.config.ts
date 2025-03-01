import type { Config } from "tailwindcss";
const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

/**
 * REVIEW NOTES:
 * 1. If you need "destructive" or "destructive-foreground" etc., you must
 *    actually define them in `theme.extend.colors`. Below is an example:
 *    destructive: "#EF4444",
 *    "destructive-foreground": "#FFFFFF",
 *
 * 2. You already have a plugin `addVariablesForColors` that auto-creates CSS
 *    variables for each color key. That's fine, but again it only works on
 *    what you define in the "colors" section.
 *
 * 3. If you want to unify your color tokens with the approach of "var(--...)" from
 *    your `addVariablesForColors` plugin, you can do something like:
 *      destructive: "var(--destructive)",
 *      "destructive-foreground": "var(--destructive-foreground)",
 *    ...and so on, provided you define those CSS variables somewhere.
 */

function addVariablesForColors({ addBase, theme }: any) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ":root": {
      ...newVars,
      "--radius": "0.5rem", // Default corner radius value
      "--radius-sm": "0.3rem", // Smaller radius
      "--radius-lg": "0.75rem", // Larger radius
      "--radius-xl": "1rem", // Extra large radius
    },
    // Add default rounded corners to common elements
    "*": {
      "--tw-border-radius": "0.3rem",
    },
    "button, input, select, textarea": {
      "border-radius": "var(--radius-sm)",
    },
    ".card, .panel, .box": {
      "border-radius": "var(--radius)",
    },
  });
}

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./layouts/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "muted-legacy": "var(--neutral-600)",
        "muted-dark": "var(--neutral-300)",
        
        // shadcn UI color tokens
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
          DEFAULT: "hsl(var(--destructive, 0 84.2% 60.2%))",
          foreground: "hsl(var(--destructive-foreground, 0 0% 98%))",
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
        success: {
          DEFAULT: "#10B981", // Green 500
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
          foreground: "#FFFFFF",
        },
      },
      borderRadius: {
        // Default border radius applied to all elements
        DEFAULT: "var(--radius-sm, 0.3rem)",
        sm: "var(--radius-sm, 0.3rem)",
        md: "var(--radius, 0.5rem)",
        lg: "var(--radius-lg, 0.75rem)",
        xl: "var(--radius-xl, 1rem)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        scroll:
          "scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite",
        marquee: "marquee var(--marquee-duration) linear infinite",
        "fade-in": "fade-in 0.5s linear forwards",
        "in": "toast-in 0.25s ease-out forwards",
        "out": "toast-out 0.25s ease-in forwards",
        "fade-out-80": "fade-out-80 0.8s forwards",
        "slide-in-from-top-full": "slide-in-from-top-full 0.3s ease-out forwards",
        "slide-in-from-bottom-full": "slide-in-from-bottom-full 0.3s ease-out forwards",
        "slide-out-to-right-full": "slide-out-to-right-full 0.4s ease-in forwards",
        first: "moveVertical 30s ease infinite",
        second: "moveInCircle 20s reverse infinite",
        third: "moveInCircle 40s linear infinite",
        fourth: "moveHorizontal 40s ease infinite",
        fifth: "moveInCircle 20s ease infinite",
        
        // shadcn UI animations
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      boxShadow: {
        derek: `0px 0px 0px 1px rgb(0 0 0 / 0.06),
        0px 1px 1px -0.5px rgb(0 0 0 / 0.06),
        0px 3px 3px -1.5px rgb(0 0 0 / 0.06), 
        0px 6px 6px -3px rgb(0 0 0 / 0.06),
        0px 12px 12px -6px rgb(0 0 0 / 0.06),
        0px 24px 24px -12px rgb(0 0 0 / 0.06)`,
        aceternity: `0px 2px 3px -1px rgba(0,0,0,0.1), 0px 1px 0px 0px rgba(25,28,33,0.02), 0px 0px 0px 1px rgba(25,28,33,0.08)`,
        toast: "0px 4px 10px rgba(0, 0, 0, 0.1)",
      },
      keyframes: {
        scroll: {
          to: {
            transform: "translate(calc(-50% - 0.5rem))",
          },
        },
        marquee: {
          "100%": {
            transform: "translateY(-50%)",
          },
        },
        "fade-in": {
          from: {
            opacity: "0",
          },
          to: {
            opacity: "1",
          },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "toast-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateX(40px)" },
        },
        "fade-out-80": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "slide-in-from-top-full": {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-from-bottom-full": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-out-to-right-full": {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "100%": { transform: "translateX(40px)", opacity: "0" },
        },
        moveHorizontal: {
          "0%": {
            transform: "translateX(-50%) translateY(-10%)",
          },
          "50%": {
            transform: "translateX(50%) translateY(10%)",
          },
          "100%": {
            transform: "translateX(-50%) translateY(-10%)",
          },
        },
        moveInCircle: {
          "0%": {
            transform: "rotate(0deg)",
          },
          "50%": {
            transform: "rotate(180deg)",
          },
          "100%": {
            transform: "rotate(360deg)",
          },
        },
        moveVertical: {
          "0%": {
            transform: "translateY(-50%)",
          },
          "50%": {
            transform: "translateY(50%)",
          },
          "100%": {
            transform: "translateY(-50%)",
          },
        },
        
        // shadcn UI keyframes
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      zIndex: {
        100: "100",
        150: "150",
        200: "200",
      }
    },
  },
  plugins: [
    addVariablesForColors, 
    require("@tailwindcss/typography"),
    require("tailwindcss-animate"),  // Add this plugin for shadcn animations
    // Add a plugin to apply border radius to all elements
    function({ addComponents, theme }: any) {
      addComponents({
        '.btn': {
          borderRadius: theme('borderRadius.DEFAULT'),
        },
        '.input': {
          borderRadius: theme('borderRadius.DEFAULT'),
        },
        '.card': {
          borderRadius: theme('borderRadius.md'),
        },
        '.rounded-default': {
          borderRadius: theme('borderRadius.DEFAULT'),
        },
      })
    }
  ],
};

export default config;

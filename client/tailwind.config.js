/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // A Cidadela de Pedra - Paleta Medieval
        // Renomeado para "citadel" para evitar conflito com stone padrão do Tailwind
        citadel: {
          granite: "#4a4a4a", // Cinza Granito - Interface principal
          slate: "#1a1a1a", // Ardósia Escura - Fundos profundos
          sandstone: "#6b5c4d", // Arenito - Realces quentes
          obsidian: "#0d0d0d", // Negro Obsidiana - Máxima profundidade
          weathered: "#5a5a5a", // Pedra envelhecida
          carved: "#3d3d3d", // Pedra talhada
        },
        metal: {
          iron: "#4a4a50", // Ferro Forjado
          rust: "#6b4423", // Ferrugem
          steel: "#71797E", // Aço Envelhecido
          bronze: "#8b7355", // Bronze Antigo
          gold: "#9c7a3c", // Ouro Fosco Medieval
          copper: "#7c4a3a", // Cobre Envelhecido
        },
        war: {
          crimson: "#8b1a1a", // Vermelho Carmesim - Sangue Seco
          blood: "#6b0f0f", // Sangue Escuro
          ember: "#c44536", // Brasas
          fire: "#a33c1f", // Fogo de Tocha
        },
        parchment: {
          light: "#d4c5a9", // Pergaminho Claro
          aged: "#b8a88a", // Pergaminho Envelhecido
          dark: "#8b7d5c", // Pergaminho Escurecido
        },
        torch: {
          glow: "#ff9500", // Brilho de Tocha
          warm: "#e8730e", // Luz Quente
          dim: "#7a4a15", // Tocha Distante
        },
        // Cores legadas (compatibilidade)
        medieval: {
          dark: "rgb(50, 50, 50)",
          darker: "rgb(30, 30, 30)",
          blood: "#8b0000",
          stone: "#323232",
          iron: "#404040",
          red: {
            50: "#fee",
            100: "#fcc",
            200: "#faa",
            300: "#f88",
            400: "#f55",
            500: "#d32",
            600: "#b11",
            700: "#900",
            800: "#700",
            900: "#500",
          },
        },
      },
      fontFamily: {
        stone: ["Cinzel", "serif"], // Títulos - Estilo esculpido
        medieval: ["Cinzel Decorative", "serif"], // Cabeçalhos épicos
        scroll: ["Palatino Linotype", "Book Antiqua", "serif"], // Corpo - Pergaminho
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        flicker: "flicker 2s ease-in-out infinite",
        "torch-glow": "torchGlow 3s ease-in-out infinite",
        "stone-press": "stonePress 0.15s ease-out",
        "rune-glow": "runeGlow 2s ease-in-out infinite",
        dust: "dust 2s ease-out forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        torchGlow: {
          "0%, 100%": {
            boxShadow:
              "0 0 20px rgba(255, 149, 0, 0.3), 0 0 40px rgba(232, 115, 14, 0.2)",
            filter: "brightness(1)",
          },
          "50%": {
            boxShadow:
              "0 0 30px rgba(255, 149, 0, 0.5), 0 0 60px rgba(232, 115, 14, 0.3)",
            filter: "brightness(1.1)",
          },
        },
        stonePress: {
          "0%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(3px)" },
          "100%": { transform: "translateY(1px)" },
        },
        runeGlow: {
          "0%, 100%": { textShadow: "0 0 10px rgba(139, 26, 26, 0.5)" },
          "50%": {
            textShadow:
              "0 0 20px rgba(139, 26, 26, 0.8), 0 0 30px rgba(139, 26, 26, 0.4)",
          },
        },
        dust: {
          "0%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(10px) scale(0.5)" },
        },
      },
      backgroundImage: {
        "radial-glow":
          "radial-gradient(circle at 50% 50%, rgba(139, 0, 0, 0.15) 0%, transparent 70%)",
        "stone-texture":
          "linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 25%, #3a3a3a 50%, #454545 75%, #3d3d3d 100%)",
        "torch-light":
          "radial-gradient(ellipse at top, rgba(255, 149, 0, 0.15) 0%, transparent 60%)",
        "metal-sheen":
          "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)",
      },
      boxShadow: {
        "stone-inset":
          "inset 0 2px 4px rgba(0,0,0,0.5), inset 0 -1px 2px rgba(255,255,255,0.05)",
        "stone-raised":
          "0 4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
        "forge-glow":
          "0 0 20px rgba(196, 69, 54, 0.4), 0 0 40px rgba(139, 26, 26, 0.2)",
        torch:
          "0 0 30px rgba(255, 149, 0, 0.3), 0 0 60px rgba(232, 115, 14, 0.15)",
      },
    },
  },
  plugins: [],
};

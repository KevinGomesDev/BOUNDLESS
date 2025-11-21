export const GameConfig = {
  // --- CONFIGURAÇÕES GERAIS DE UI ---
  UI: {
    COLORS: {
      BACKDROP: 0x000000,
      BACKDROP_ALPHA: 0.8,
      BAR_BG: 0x111111,
      TEXT_MAIN: "#ffffff",
      TEXT_DARK: "#000000",
      TEXT_ALERT: "#ffaa00",

      HEX_DEFAULT: 0x888888,
      HEX_HIGHLIGHT: 0xffffff,
      HEX_SELECTED: 0xffd700,
    },
  },

  // --- CONFIGURAÇÕES DOS HEXÁGONOS ---
  HEXAGON: {
    COLOR_DEFAULT: 0x888888,
    COLOR_HOVER: 0xffffff,
    COLOR_SELECTED: 0xffd700,
    LINE_COLOR_DEFAULT: 0x000000,
    LINE_COLOR_HOVER: 0xffffff,
    LINE_WIDTH_DEFAULT: 1,
    LINE_WIDTH_HOVER: 2,
    LINE_WIDTH_SELECTED: 3,
    ALPHA_DEFAULT: 1,
    ALPHA_HOVER: 1,
  },

  // --- MAPA ESTRATÉGICO ---
  MAP: {
    TOTAL_TERRITORIES: 50,
    WIDTH_OFFSET: 0,
    RELAXATION_STEPS: 2,
    STROKE_WIDTH: 2,
    STROKE_COLOR: 0x1a1a1a,
    WATER_COLOR: 0x457b9d,
  },

  // --- MODAL DE TERRITÓRIO ---
  TERRITORY: {
    SLOTS: {
      Pequeno: 10,
      Médio: 20,
      Grande: 30,
      DEFAULT: 20,
    },
    BORDER_COLOR: 0xffffff,
    BORDER_ALPHA: 0.5,
    BORDER_THICKNESS: 4,
  },

  // --- MODAL DE COMBATE ---
  COMBAT: {
    GRID: {
      COLS: 100,
      ROWS: 50,
      FIXED_RADIUS: 35,
    },
    ZOOM: {
      MIN: 0.1,
      MAX: 3.0,
      STEP: 0.1,
    },
    TITLE: {
      BG_COLOR: 0x000000,
      TEXT_COLOR: "#ffffff",
    },
  },

  // --- RECURSOS ---
  RESOURCES: {
    ORE: {
      id: "ore",
      label: "Minério",
      icon: "⛏️",
      color: "#a8a8a8",
      startValue: 500,
      description:
        "O minério é a base econômica do jogo, essencial para transações comerciais e construção.",
    },
    ARCANA: {
      id: "arcana",
      label: "Arcana",
      icon: "🔮",
      color: "#a35dd9",
      startValue: 100,
      description:
        "Energia mágica intrínseca, utilizada para desencadear feitiços e rituais.",
    },
    SUPPLY: {
      id: "supply",
      label: "Suprimento",
      icon: "💧",
      color: "#4da6ff",
      startValue: 1000,
      description:
        "Sustentação básica das tropas e da população, necessária para manter unidades em movimento.",
    },
    EXPERIENCE: {
      id: "xp",
      label: "Experiência",
      icon: "⭐",
      color: "#ffd700",
      startValue: 0,
      description:
        "Conhecimento adquirido através de batalhas, permitindo a evolução de tropas.",
    },
    DEVOTION: {
      id: "devotion",
      label: "Devoção",
      icon: "🙏",
      color: "#ff6666",
      startValue: 50,
      description:
        "A adoração e reconhecimento divino. Possibilita influenciar eventos sobrenaturais.",
    },
    FORTRESS: {
      id: "fortress",
      label: "Fortaleza",
      icon: "🛡️",
      color: "#888888",
      startValue: 1,
      description:
        "Estrutura defensiva crucial para proteger territórios e servir como bastião.",
    },
  },

  // --- NOVO: MENU PRINCIPAL ---
  MENU: {
    TITLE_FONT: "bold 64px Arial",
    TITLE_COLOR: "#ffffff",
    BUTTON_FONT: "bold 32px Arial",
    BUTTON_COLOR: "#aaaaaa",
    BUTTON_HOVER_COLOR: "#ffd700", // Dourado
    BUTTON_GAP: 60, // Espaço vertical entre botões
  },
};

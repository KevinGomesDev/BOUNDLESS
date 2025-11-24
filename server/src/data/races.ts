// server/src/data/races.ts

export interface RaceDefinition {
  id: string; // O Enum do Banco (HUMANOIDE, DRAGAO...)
  name: string;
  description: string; // Flavor text
  passiveName: string;
  passiveEffect: string; // Regra mecânica
  color: number; // Cor temática (apenas para UI)
}

export const RACE_DEFINITIONS: RaceDefinition[] = [
  {
    id: "HUMANOIDE",
    name: "Humanoides",
    description:
      "Versáteis e resilientes, os humanoides dominam pela tenacidade.",
    passiveName: "Vingança Final",
    passiveEffect:
      "Uma vez por Batalha, ao ser reduzido a 0 Pontos de Vida, retorna imediatamente com 1 PV.",
    color: 0x3498db, // Azul
  },
  {
    id: "ABERRACAO",
    name: "Aberrações",
    description: "Criaturas distorcidas que desafiam a lógica natural.",
    passiveName: "Pele Amorfa",
    passiveEffect: "Reduz todos os tipos de danos recebidos em 1.",
    color: 0x8e44ad, // Roxo
  },
  {
    id: "CONSTRUTO",
    name: "Construtos",
    description: "Máquinas de guerra sem alma e sem medo.",
    passiveName: "Peso de Ferro",
    passiveEffect: "Não pode ser arremessada, agarrada ou derrubada.",
    color: 0x95a5a6, // Cinza
  },
];

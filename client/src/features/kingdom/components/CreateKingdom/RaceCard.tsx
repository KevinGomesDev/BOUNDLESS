import React from "react";
import type { Race } from "./types";

interface RaceCardProps {
  race: Race;
  isSelected: boolean;
  onSelect: () => void;
}

export const RaceCard: React.FC<RaceCardProps> = ({
  race,
  isSelected,
  onSelect,
}) => {
  const icons: Record<string, string> = {
    HUMANOIDE: "👤",
    ABERRACAO: "👁️",
    CONSTRUTO: "🤖",
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${
        isSelected
          ? "border-amber-500 bg-amber-500/20 shadow-lg shadow-amber-500/20"
          : "border-slate-600 bg-slate-900/50 hover:border-slate-500"
      }`}
    >
      <div className="text-2xl mb-2">{icons[race.id] || "🏰"}</div>
      <h4 className="font-bold text-white mb-1">{race.name}</h4>
      <p className="text-xs text-slate-400 mb-2 line-clamp-2">
        {race.description}
      </p>
      <div className="text-xs text-amber-400">
        <strong>{race.passiveName}:</strong>{" "}
        <span className="text-slate-300">{race.passiveEffect}</span>
      </div>
    </button>
  );
};

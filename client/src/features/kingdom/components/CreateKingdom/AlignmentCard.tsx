import React from "react";
import type { Alignment } from "./types";

interface AlignmentCardProps {
  alignment: Alignment;
  isSelected: boolean;
  onSelect: () => void;
}

export const AlignmentCard: React.FC<AlignmentCardProps> = ({
  alignment,
  isSelected,
  onSelect,
}) => {
  const colors: Record<string, { icon: string; border: string; bg: string }> = {
    BOM: {
      icon: "✨",
      border: "border-green-500",
      bg: "bg-green-500/20",
    },
    NEUTRO: {
      icon: "⚖️",
      border: "border-slate-400",
      bg: "bg-slate-500/20",
    },
    MAL: {
      icon: "💀",
      border: "border-red-500",
      bg: "bg-red-500/20",
    },
  };

  const style = colors[alignment.id] || colors.NEUTRO;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${
        isSelected
          ? `${style.border} ${style.bg} shadow-lg`
          : "border-slate-600 bg-slate-900/50 hover:border-slate-500"
      }`}
    >
      <div className="text-2xl mb-2">{style.icon}</div>
      <h4 className="font-bold text-white mb-1">{alignment.id}</h4>
      <p className="text-xs text-slate-400 mb-2 line-clamp-2">
        {alignment.description}
      </p>
      <div className="text-xs text-purple-400">
        <strong>{alignment.passiveName}:</strong>{" "}
        <span className="text-slate-300">{alignment.passiveEffect}</span>
      </div>
    </button>
  );
};

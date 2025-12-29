import React from "react";
import { useMatch } from "../hooks/useMatch";
import { useAuth } from "../../auth";

/**
 * Componente que exibe os recursos do jogador atual
 */
export const PlayerResourcesDisplay: React.FC = () => {
  const { completeMatchState } = useMatch();
  const { user } = useAuth();

  if (!completeMatchState || !user) {
    return null;
  }

  // Encontrar o jogador atual
  const myPlayer = completeMatchState.players.find((p) => p.userId === user.id);

  if (!myPlayer) {
    return null;
  }

  const { resources } = myPlayer;

  // Icons and colors for each resource
  const resourceConfig = {
    ore: { icon: "⛏️", label: "Ore", color: "text-gray-400" },
    supplies: { icon: "🌾", label: "Supplies", color: "text-amber-400" },
    arcane: { icon: "✨", label: "Arcane", color: "text-medieval-red-400" },
    experience: {
      icon: "⚔️",
      label: "Experience",
      color: "text-medieval-red-500",
    },
    devotion: { icon: "🙏", label: "Devotion", color: "text-medieval-red-300" },
  };

  return (
    <div className="bg-medieval-stone border-2 border-amber-700 rounded-2xl p-4 shadow-2xl shadow-amber-900/20">
      <h3 className="text-lg font-bold text-amber-400 mb-3 flex items-center gap-2">
        💰 Recursos
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(resources).map(([key, value]) => {
          const config = resourceConfig[key as keyof typeof resourceConfig];
          if (!config) return null;

          return (
            <div
              key={key}
              className="bg-medieval-darker rounded-lg p-2 text-center border-2 border-medieval-red-800 shadow-lg shadow-medieval-blood/10"
            >
              <div className="text-2xl mb-1">{config.icon}</div>
              <div className={`text-xl font-bold ${config.color}`}>{value}</div>
              <div className="text-xs text-gray-400 mt-1">{config.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

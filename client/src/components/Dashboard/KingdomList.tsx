import React, { useEffect, useState, useRef } from "react";
import { useKingdom, useGameState } from "../../hooks/useGame";
import type { Kingdom } from "../../types/game.types";
import { CreateKingdomModal } from "../CreateKingdom";

/**
 * Lista de Reinos do usuário no Dashboard
 */
export const KingdomList: React.FC = () => {
  const { kingdoms, loadKingdoms, isLoading, error } = useKingdom();
  const { user } = useGameState();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (user && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadKingdoms().catch(console.error);
    }
  }, [user, loadKingdoms]);

  const handleKingdomCreated = () => {
    setIsCreateModalOpen(false);
    loadKingdoms().catch(console.error);
  };

  return (
    <>
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative bg-slate-800/40 backdrop-blur-xl rounded-2xl border-2 border-amber-500/30 p-6 hover:border-amber-500/60 transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-amber-300 flex items-center gap-2">
              🏰 Seus Reinos
            </h3>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white text-sm font-semibold rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-1.5"
            >
              <span>+</span>
              <span className="hidden sm:inline">Criar Reino</span>
            </button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && kingdoms.length === 0 && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🏰</div>
              <p className="text-slate-400 mb-4">
                Você ainda não possui reinos
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105"
              >
                ✨ Criar seu Primeiro Reino
              </button>
            </div>
          )}

          {/* Kingdom List */}
          {!isLoading && kingdoms.length > 0 && (
            <div className="space-y-3">
              {kingdoms.map((kingdom) => (
                <KingdomCard key={kingdom.id} kingdom={kingdom} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Kingdom Modal */}
      {isCreateModalOpen && (
        <CreateKingdomModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleKingdomCreated}
        />
      )}
    </>
  );
};

/**
 * Card individual de um Reino
 */
const KingdomCard: React.FC<{ kingdom: Kingdom }> = ({ kingdom }) => {
  const alignmentColors: Record<string, string> = {
    BOM: "text-green-400 bg-green-500/10 border-green-500/30",
    NEUTRO: "text-slate-400 bg-slate-500/10 border-slate-500/30",
    MAL: "text-red-400 bg-red-500/10 border-red-500/30",
  };

  const raceIcons: Record<string, string> = {
    HUMANOIDE: "👤",
    ABERRACAO: "👁️",
    CONSTRUTO: "🤖",
  };

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 hover:border-amber-500/40 transition-all duration-300 cursor-pointer group/card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{raceIcons[kingdom.race] || "🏰"}</span>
            <h4 className="font-bold text-amber-200 group-hover/card:text-amber-100 transition-colors">
              {kingdom.name}
            </h4>
          </div>
          <p className="text-sm text-slate-400 mb-2">
            Capital:{" "}
            <span className="text-slate-300">{kingdom.capitalName}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${
                alignmentColors[kingdom.alignment] || alignmentColors.NEUTRO
              }`}
            >
              {kingdom.alignment}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400">
              {kingdom.race}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-amber-400 font-bold">
            💰 {kingdom.gold?.toLocaleString() || 0}
          </div>
          <div className="text-xs text-slate-500">
            👥 {kingdom.population?.toLocaleString() || 0}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState, useRef } from "react";
import { useKingdom } from "../../features/kingdom";
import { useAuth } from "../../features/auth";
import type { Kingdom } from "../../features/kingdom";
import { CreateKingdomModal } from "../../features/kingdom";

/**
 * Lista de Reinos - Estilo Cidadela de Pedra
 * Os domínios do jogador exibidos como placas de pedra
 */
export const KingdomList: React.FC = () => {
  const { kingdoms, loadKingdoms, isLoading, error } = useKingdom();
  const { user } = useAuth();
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
      <div className="space-y-4">
        {/* Botão Criar Reino */}
        <div className="flex justify-end">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="group relative px-4 py-2 bg-gradient-to-b from-metal-bronze to-metal-copper 
                       border-2 border-metal-iron rounded-lg shadow-stone-raised
                       hover:from-metal-gold hover:to-metal-bronze
                       active:animate-stone-press transition-all duration-200"
          >
            <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-metal-iron rounded-full"></div>
            <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-metal-iron rounded-full"></div>
            <span className="relative text-citadel-obsidian font-bold text-sm tracking-wide flex items-center gap-2">
              <span>⚒️</span>
              <span className="hidden sm:inline">Fundar Reino</span>
              <span className="sm:hidden">+</span>
            </span>
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 border-3 border-metal-bronze rounded-full animate-spin border-t-transparent"></div>
              <div
                className="absolute inset-2 border-2 border-metal-gold rounded-full animate-spin border-b-transparent"
                style={{ animationDirection: "reverse" }}
              ></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-war-blood/20 border-2 border-war-crimson rounded-lg p-3">
            <p className="text-war-ember text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && kingdoms.length === 0 && (
          <div className="text-center py-8 bg-citadel-slate/30 rounded-xl border-2 border-dashed border-metal-iron/50">
            <div className="text-5xl mb-4">🏰</div>
            <p className="text-parchment-dark mb-4">
              Nenhum domínio conquistado
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-b from-war-crimson to-war-blood 
                         border-3 border-metal-iron rounded-lg shadow-forge-glow
                         hover:from-war-ember hover:to-war-crimson
                         text-parchment-light font-bold tracking-wide transition-all"
            >
              ⚔️ Conquistar Primeiro Reino
            </button>
          </div>
        )}

        {/* Kingdom List */}
        {!isLoading && kingdoms.length > 0 && (
          <div className="space-y-3">
            {kingdoms.map((summary) => (
              <KingdomCard
                key={summary.id}
                kingdom={{
                  id: summary.id,
                  name: summary.name,
                  race: summary.race,
                  alignment: summary.alignment,
                  locationIndex: 0,
                  ownerId: "",
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }}
              />
            ))}
          </div>
        )}
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
 * Card de Reino - Placa de Pedra com Brasão
 */
const KingdomCard: React.FC<{ kingdom: Kingdom }> = ({ kingdom }) => {
  const raceIcons: Record<string, string> = {
    HUMANOIDE: "👤",
    ABERRACAO: "👁️",
    CONSTRUTO: "🤖",
  };

  return (
    <div
      className="group relative bg-gradient-to-b from-citadel-granite to-citadel-carved 
                    border-2 border-metal-iron rounded-xl p-4 
                    hover:border-metal-bronze hover:shadow-torch
                    transition-all duration-300 cursor-pointer shadow-stone-raised"
    >
      {/* Rebites decorativos */}
      <div className="absolute top-2 left-2 w-2 h-2 bg-metal-iron rounded-full border border-metal-rust/30"></div>
      <div className="absolute top-2 right-2 w-2 h-2 bg-metal-iron rounded-full border border-metal-rust/30"></div>

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {/* Ícone da Raça em escudo */}
            <div className="w-10 h-10 bg-citadel-slate border-2 border-metal-iron rounded-lg flex items-center justify-center shadow-stone-inset">
              <span className="text-xl">{raceIcons[kingdom.race] || "🏰"}</span>
            </div>
            <div>
              <h4
                className="font-bold text-parchment-light group-hover:text-metal-gold transition-colors"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {kingdom.name}
              </h4>
            </div>
          </div>
        </div>

        {/* Placeholder for resources */}
        <div className="text-right space-y-1">
          <div className="bg-citadel-slate/50 px-2 py-1 rounded border border-metal-gold/30 text-xs text-parchment-aged">
            💰 N/A
          </div>
        </div>
      </div>
    </div>
  );
};

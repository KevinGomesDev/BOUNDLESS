import React, { useState } from "react";
import { useConnection } from "../core";
import { useAuth } from "../features/auth";
import { useMatch } from "../features/match";
import { ConnectionStatus } from "../components/Dashboard/ConnectionStatus";
import { UserProfile } from "../components/Dashboard/UserProfile";
import { GameStateDebug } from "../components/Dashboard/GameStateDebug";
import { KingdomList } from "../components/Dashboard/KingdomList";
import { MatchList, MatchLobby } from "../features/match";
import MapPage from "./MapPage";

/**
 * Dashboard Page - A CIDADELA DE PEDRA
 * A Sala do Trono do jogador - pesada, sólida, medieval
 *
 * Quando há partida ativa, redireciona automaticamente para o mapa
 */
const DashboardPage: React.FC = () => {
  const { isConnected, error: connectionError } = useConnection();
  const { user } = useAuth();
  const { currentMatch } = useMatch();
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);

  // Se há uma partida ativa, vai direto para o mapa
  if (currentMatch) {
    return <MapPage />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-citadel-obsidian">
      {/* === AMBIENTE: Vista da Cidadela === */}
      <div className="absolute inset-0">
        {/* Gradiente de profundidade - como estar dentro de uma fortaleza */}
        <div className="absolute inset-0 bg-gradient-to-b from-citadel-slate via-citadel-obsidian to-black"></div>

        {/* Luz de tochas no topo */}
        <div className="absolute inset-0 bg-torch-light opacity-40"></div>

        {/* Brilho ambiente de tochas nas laterais */}
        <div className="absolute top-0 left-0 w-1/4 h-full bg-gradient-to-r from-torch-glow/10 to-transparent"></div>
        <div className="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-torch-glow/10 to-transparent"></div>

        {/* Partículas de poeira flutuando (efeito sutil) */}
        <div className="absolute top-20 left-1/4 w-2 h-2 bg-parchment-aged/20 rounded-full animate-float blur-sm"></div>
        <div
          className="absolute top-40 right-1/3 w-1 h-1 bg-parchment-light/15 rounded-full animate-float blur-sm"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-60 left-1/2 w-2 h-2 bg-parchment-dark/10 rounded-full animate-float blur-sm"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* === A CORNIJA: Barra Superior de Pedra === */}
      <div className="relative z-20">
        <div className="bg-citadel-granite border-b-4 border-citadel-carved shadow-stone-raised">
          {/* Textura de pedra talhada */}
          <div className="absolute inset-0 bg-stone-texture opacity-50"></div>

          {/* Rebites de ferro nas bordas */}
          <div className="absolute top-2 left-4 w-3 h-3 bg-metal-iron rounded-full shadow-inner border border-metal-rust/30"></div>
          <div className="absolute top-2 right-4 w-3 h-3 bg-metal-iron rounded-full shadow-inner border border-metal-rust/30"></div>
          <div className="absolute bottom-2 left-4 w-3 h-3 bg-metal-iron rounded-full shadow-inner border border-metal-rust/30"></div>
          <div className="absolute bottom-2 right-4 w-3 h-3 bg-metal-iron rounded-full shadow-inner border border-metal-rust/30"></div>

          <div className="relative px-4 sm:px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* ESQUERDA: Brasão e Nome do Jogador */}
              <div className="flex items-center gap-4">
                {/* Escudo/Brasão de Pedra */}
                <div className="relative">
                  <div
                    className="w-14 h-16 bg-citadel-carved border-2 border-metal-iron rounded-b-lg shadow-stone-raised flex items-center justify-center"
                    style={{
                      clipPath:
                        "polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)",
                    }}
                  >
                    <span className="text-2xl">🏰</span>
                  </div>
                  {/* Moldura de bronze */}
                  <div
                    className="absolute -inset-1 border-2 border-metal-bronze/40 rounded-b-lg pointer-events-none"
                    style={{
                      clipPath:
                        "polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)",
                    }}
                  ></div>
                </div>

                {/* Placa de Bronze com Nome */}
                <div className="bg-gradient-to-b from-metal-bronze to-metal-copper px-4 py-2 rounded border-2 border-metal-rust/50 shadow-lg">
                  <div className="text-citadel-obsidian font-bold text-sm tracking-wide">
                    {user?.username || "Comandante"}
                  </div>
                  <div className="text-citadel-slate/80 text-xs">
                    Senhor da Guerra
                  </div>
                </div>
              </div>

              {/* CENTRO: Título da Cidadela */}
              <div className="hidden md:block text-center">
                <h1
                  className="text-3xl lg:text-4xl font-bold tracking-wider text-parchment-light drop-shadow-lg animate-rune-glow"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    letterSpacing: "0.15em",
                  }}
                >
                  BATTLE REALM
                </h1>
                <div className="text-metal-gold text-xs tracking-[0.3em] uppercase mt-1">
                  ⚔ Cidadela do Poder ⚔
                </div>
              </div>

              {/* DIREITA: Recursos em Nichos de Pedra */}
              <div className="flex items-center gap-2">
                {/* Nicho de Recurso: Ouro */}
                <div className="bg-citadel-carved border-2 border-metal-iron rounded px-3 py-2 shadow-stone-inset">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    <span className="text-metal-gold font-bold text-sm">
                      12.5K
                    </span>
                  </div>
                </div>

                {/* Nicho de Recurso: Pedra */}
                <div className="hidden sm:block bg-citadel-carved border-2 border-metal-iron rounded px-3 py-2 shadow-stone-inset">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🪨</span>
                    <span className="text-citadel-weathered font-bold text-sm">
                      8.2K
                    </span>
                  </div>
                </div>

                {/* Status de Conexão */}
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected
                      ? "bg-green-500 animate-pulse"
                      : "bg-war-crimson"
                  } shadow-lg`}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === CONTEÚDO PRINCIPAL: A Mesa de Estratégia === */}
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* === GRID: Blocos de Pedra da Interface === */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUNA ESQUERDA: Status e Perfil */}
            <div className="lg:col-span-1 space-y-6">
              {/* Bloco de Pedra: Conexão */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-b from-metal-iron to-metal-rust opacity-50 rounded-xl blur-sm"></div>
                <div className="relative bg-gradient-to-b from-citadel-granite to-citadel-carved border-4 border-metal-iron rounded-xl p-4 shadow-stone-raised">
                  {/* Moldura decorativa */}
                  <div className="absolute top-2 left-2 w-2 h-2 bg-metal-bronze rounded-full"></div>
                  <div className="absolute top-2 right-2 w-2 h-2 bg-metal-bronze rounded-full"></div>

                  <h3
                    className="text-parchment-light font-bold text-sm tracking-wider mb-3 border-b border-metal-rust/30 pb-2"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    FORTALEZA
                  </h3>
                  <ConnectionStatus
                    isConnected={isConnected}
                    error={connectionError}
                  />
                </div>
              </div>

              {/* Bloco de Pedra: Perfil */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-b from-metal-iron to-metal-rust opacity-50 rounded-xl blur-sm"></div>
                <div className="relative bg-gradient-to-b from-citadel-granite to-citadel-carved border-4 border-metal-iron rounded-xl p-4 shadow-stone-raised">
                  <div className="absolute top-2 left-2 w-2 h-2 bg-metal-bronze rounded-full"></div>
                  <div className="absolute top-2 right-2 w-2 h-2 bg-metal-bronze rounded-full"></div>

                  <h3
                    className="text-parchment-light font-bold text-sm tracking-wider mb-3 border-b border-metal-rust/30 pb-2"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    COMANDANTE
                  </h3>
                  <UserProfile user={user} />
                </div>
              </div>
            </div>

            {/* COLUNA PRINCIPAL: Mesa de Estratégia */}
            <div className="lg:col-span-2 space-y-6">
              {/* Grande Bloco: Partidas */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-b from-war-blood to-war-crimson opacity-30 rounded-xl blur-sm"></div>
                <div className="relative bg-gradient-to-b from-citadel-granite to-citadel-carved border-4 border-metal-iron rounded-xl overflow-hidden shadow-stone-raised">
                  {/* Cabeçalho estilizado */}
                  <div className="bg-gradient-to-r from-citadel-carved via-citadel-granite to-citadel-carved border-b-2 border-metal-rust/50 px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-war-crimson border-2 border-metal-iron rounded flex items-center justify-center">
                        <span>⚔️</span>
                      </div>
                      <h2
                        className="text-parchment-light font-bold tracking-wider"
                        style={{ fontFamily: "'Cinzel', serif" }}
                      >
                        SALA DE GUERRA
                      </h2>
                    </div>
                  </div>

                  <div className="p-6">
                    {activeMatchId ? (
                      <MatchLobby
                        matchId={activeMatchId}
                        onLeave={() => setActiveMatchId(null)}
                        onGameStart={() => {
                          console.log("Game started!");
                        }}
                      />
                    ) : (
                      <MatchList
                        onMatchCreated={(matchId) => setActiveMatchId(matchId)}
                        onMatchJoined={(matchId) => setActiveMatchId(matchId)}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Bloco: Reinos */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-b from-metal-bronze to-metal-copper opacity-20 rounded-xl blur-sm"></div>
                <div className="relative bg-gradient-to-b from-citadel-granite to-citadel-carved border-4 border-metal-iron rounded-xl overflow-hidden shadow-stone-raised">
                  <div className="bg-gradient-to-r from-citadel-carved via-citadel-granite to-citadel-carved border-b-2 border-metal-rust/50 px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-metal-bronze border-2 border-metal-iron rounded flex items-center justify-center">
                        <span>🏰</span>
                      </div>
                      <h2
                        className="text-parchment-light font-bold tracking-wider"
                        style={{ fontFamily: "'Cinzel', serif" }}
                      >
                        SEUS DOMÍNIOS
                      </h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <KingdomList />
                  </div>
                </div>
              </div>

              {/* Bloco Colapsável: Debug */}
              <details className="group">
                <summary className="cursor-pointer list-none">
                  <div className="relative">
                    <div className="relative bg-gradient-to-b from-citadel-carved to-citadel-slate border-2 border-metal-iron/50 rounded-lg px-4 py-2 shadow-stone-inset hover:border-metal-iron transition-colors">
                      <span className="text-parchment-dark text-sm tracking-wide">
                        📜 Pergaminhos de Debug (clique para expandir)
                      </span>
                    </div>
                  </div>
                </summary>
                <div className="mt-2 relative">
                  <div className="relative bg-gradient-to-b from-citadel-slate to-citadel-obsidian border-2 border-metal-iron/30 rounded-xl p-4">
                    <GameStateDebug />
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      {/* === ESTILO INLINE PARA FONTE === */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cinzel+Decorative:wght@400;700&display=swap');
      `}</style>
    </div>
  );
};

export default DashboardPage;

import React from "react";
import { useConnection, useGameState } from "../hooks/useGame";
import { ConnectionStatus } from "../components/Dashboard/ConnectionStatus";
import { UserProfile } from "../components/Dashboard/UserProfile";
import { GameStateDebug } from "../components/Dashboard/GameStateDebug";
import { KingdomList } from "../components/Dashboard/KingdomList";

/**
 * Dashboard Page - Página principal após autenticação
 * Mostra informações do usuário, status de conexão e estado do jogo
 */
const DashboardPage: React.FC = () => {
  const { isConnected, error: connectionError } = useConnection();
  const { user } = useGameState();

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 opacity-50">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div
            className="absolute top-40 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-4 sm:p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl mb-4">
              ⚔️ BATTLE REALM ⚔️
            </h1>
            <p className="text-purple-300/80 text-sm sm:text-base tracking-widest uppercase font-semibold">
              Dashboard do Guerreiro
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Status Cards */}
            <div className="lg:col-span-1 space-y-6">
              <ConnectionStatus
                isConnected={isConnected}
                error={connectionError}
              />
              <UserProfile user={user} />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <KingdomList />
              <GameStateDebug />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;

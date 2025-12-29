import React, { useState } from "react";
import { useAuth } from "../features/auth";
import { AuthForm, type AuthFormData } from "@/components/AuthForm";
import { ServerStatus } from "@/components/ServerStatus";

type ViewMode = "selection" | "login" | "register";

interface HomePageProps {
  onAuthSuccess?: () => void;
}

/**
 * Página inicial que permite escolher entre Login ou Registro
 */
export const HomePage: React.FC<HomePageProps> = ({ onAuthSuccess }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("selection");
  const { login, register, isLoading, error } = useAuth();

  const handleLoginSubmit = async (data: AuthFormData) => {
    await login(data.username, data.password);
    onAuthSuccess?.();
  };

  const handleRegisterSubmit = async (data: AuthFormData) => {
    if (!data.email) {
      throw new Error("Email é obrigatório");
    }
    await register(data.username, data.email, data.password);
    onAuthSuccess?.();
  };

  const handleCancel = () => {
    setViewMode("selection");
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
      {/* Server Status */}
      <ServerStatus />

      {/* === AMBIENTE: Portal da Cidadela === */}
      <div className="absolute inset-0 bg-gradient-to-b from-citadel-obsidian via-citadel-slate to-citadel-obsidian">
        {/* Luz de Tocha vindo do topo */}
        <div className="absolute inset-0 bg-torch-light opacity-30"></div>

        {/* Brilhos de fogo nas laterais */}
        <div className="absolute top-1/4 left-0 w-1/3 h-1/2 bg-gradient-to-r from-torch-glow/10 to-transparent blur-3xl"></div>
        <div className="absolute top-1/4 right-0 w-1/3 h-1/2 bg-gradient-to-l from-torch-glow/10 to-transparent blur-3xl"></div>

        {/* Partículas de poeira */}
        <div className="absolute top-20 left-1/4 w-2 h-2 bg-parchment-aged/20 rounded-full animate-float blur-sm"></div>
        <div
          className="absolute top-40 right-1/3 w-1 h-1 bg-parchment-light/15 rounded-full animate-float blur-sm"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-40 left-1/3 w-2 h-2 bg-parchment-dark/10 rounded-full animate-float blur-sm"
          style={{ animationDelay: "4s" }}
        ></div>

        {/* Textura de pedra sutil */}
        <div className="absolute inset-0 bg-stone-texture opacity-10"></div>
      </div>

      {/* Brilho radial central */}
      <div className="absolute inset-0 bg-radial-glow opacity-30"></div>

      {/* === CONTEÚDO: Portal de Entrada === */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-4">
        {/* Card Container - Grande Bloco de Pedra */}
        <div className="relative">
          {/* Glow exterior */}
          <div className="absolute -inset-2 bg-gradient-to-b from-torch-glow/20 via-war-crimson/10 to-torch-glow/20 rounded-2xl blur-xl opacity-50"></div>

          {/* Card Principal */}
          <div
            className="relative bg-gradient-to-b from-citadel-granite to-citadel-carved 
                          border-4 border-metal-iron rounded-2xl 
                          shadow-stone-raised p-8 sm:p-12 md:p-16
                          overflow-hidden"
          >
            {/* Rebites decorativos nos cantos */}
            <div className="absolute top-4 left-4 w-4 h-4 bg-metal-bronze rounded-full border-2 border-metal-iron shadow-lg"></div>
            <div className="absolute top-4 right-4 w-4 h-4 bg-metal-bronze rounded-full border-2 border-metal-iron shadow-lg"></div>
            <div className="absolute bottom-4 left-4 w-4 h-4 bg-metal-bronze rounded-full border-2 border-metal-iron shadow-lg"></div>
            <div className="absolute bottom-4 right-4 w-4 h-4 bg-metal-bronze rounded-full border-2 border-metal-iron shadow-lg"></div>

            {/* Linha decorativa superior */}
            <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-metal-gold to-transparent"></div>

            {/* === TÍTULO: Esculpido em Pedra === */}
            <div className="text-center mb-8 sm:mb-12">
              <h1
                className="text-4xl sm:text-5xl md:text-6xl font-bold text-parchment-light drop-shadow-2xl mb-4 animate-rune-glow"
                style={{
                  fontFamily: "'Cinzel Decorative', serif",
                  letterSpacing: "0.1em",
                }}
              >
                BATTLE REALM
              </h1>
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-metal-gold"></div>
                <span className="text-metal-gold text-2xl">⚔️</span>
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-metal-gold"></div>
              </div>
              <p className="text-parchment-aged text-sm sm:text-base tracking-[0.3em] uppercase">
                Cidadela do Poder
              </p>
            </div>

            {/* === CONTEÚDO DINÂMICO === */}
            {viewMode === "selection" && (
              <div className="space-y-8 sm:space-y-10">
                <p className="text-center text-parchment-aged text-base sm:text-lg leading-relaxed max-w-lg mx-auto">
                  Os portões da fortaleza aguardam. Escolha seu caminho,
                  guerreiro.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Botão ENTRAR - Estilo Forja */}
                  <button
                    onClick={() => setViewMode("login")}
                    className="group relative px-8 py-5 bg-gradient-to-b from-war-crimson to-war-blood 
                               border-3 border-metal-iron rounded-xl shadow-forge-glow
                               hover:from-war-ember hover:to-war-crimson
                               active:animate-stone-press transition-all duration-200"
                  >
                    {/* Rebites */}
                    <div className="absolute top-2 left-2 w-2 h-2 bg-metal-iron rounded-full"></div>
                    <div className="absolute top-2 right-2 w-2 h-2 bg-metal-iron rounded-full"></div>
                    <div className="absolute bottom-2 left-2 w-2 h-2 bg-metal-iron rounded-full"></div>
                    <div className="absolute bottom-2 right-2 w-2 h-2 bg-metal-iron rounded-full"></div>

                    <span
                      className="relative flex items-center justify-center gap-3 font-bold text-parchment-light tracking-wider"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      🗝️ ENTRAR
                    </span>
                  </button>

                  {/* Botão CRIAR CONTA - Estilo Pedra */}
                  <button
                    onClick={() => setViewMode("register")}
                    className="group relative px-8 py-5 bg-gradient-to-b from-citadel-weathered to-citadel-granite 
                               border-3 border-metal-iron rounded-xl shadow-stone-raised
                               hover:from-citadel-granite hover:to-citadel-carved
                               hover:shadow-torch
                               active:animate-stone-press transition-all duration-200"
                  >
                    {/* Rebites */}
                    <div className="absolute top-2 left-2 w-2 h-2 bg-metal-iron rounded-full"></div>
                    <div className="absolute top-2 right-2 w-2 h-2 bg-metal-iron rounded-full"></div>
                    <div className="absolute bottom-2 left-2 w-2 h-2 bg-metal-iron rounded-full"></div>
                    <div className="absolute bottom-2 right-2 w-2 h-2 bg-metal-iron rounded-full"></div>

                    <span
                      className="relative flex items-center justify-center gap-3 font-bold text-parchment-aged tracking-wider"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      ✨ CRIAR CONTA
                    </span>
                  </button>
                </div>
              </div>
            )}

            {viewMode === "login" && (
              <AuthForm
                mode="login"
                onSubmit={handleLoginSubmit}
                onCancel={handleCancel}
                isLoading={isLoading}
                error={error}
              />
            )}

            {viewMode === "register" && (
              <AuthForm
                mode="register"
                onSubmit={handleRegisterSubmit}
                onCancel={handleCancel}
                isLoading={isLoading}
                error={error}
              />
            )}
          </div>
        </div>
      </div>

      {/* Elementos decorativos flutuantes */}
      <div className="absolute top-10 left-10 w-16 h-16 border-2 border-metal-iron/20 rotate-45 animate-float opacity-30"></div>
      <div
        className="absolute bottom-20 right-10 w-24 h-24 border-2 border-metal-bronze/20 rotate-12 animate-float opacity-20"
        style={{ animationDelay: "3s" }}
      ></div>
      <div
        className="absolute top-1/3 right-20 w-8 h-8 border border-war-crimson/20 rotate-45 animate-float opacity-25"
        style={{ animationDelay: "1.5s" }}
      ></div>

      <style>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes flicker {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-flicker {
          animation: flicker 2s ease-in-out infinite;
        }

        .bg-radial-glow {
          background-image: radial-gradient(
            circle at 50% 50%,
            rgba(139, 0, 0, 0.15) 0%,
            transparent 70%
          );
        }
      `}</style>
    </div>
  );
};

export default HomePage;

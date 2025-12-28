import React, { useState } from "react";
import { useAuth } from "@/hooks/useGame";
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

      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 opacity-50">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.05) 75%, rgba(255, 255, 255, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.05) 75%, rgba(255, 255, 255, 0.05) 76%, transparent 77%, transparent)",
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      {/* Radial glow */}
      <div className="absolute inset-0 bg-radial-glow opacity-40"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-4">
        <div className="group">
          {/* Card Container */}
          <div className="bg-slate-800/40 backdrop-blur-2xl rounded-3xl border border-purple-500/20 shadow-2xl p-8 sm:p-12 md:p-16 hover:border-purple-500/40 transition-all duration-300">
            {/* Decorative Elements */}
            <div className="absolute -top-px left-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent transform -translate-x-1/2"></div>
            <div className="absolute -bottom-px left-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent transform -translate-x-1/2"></div>

            {/* Title */}
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl mb-2 animate-pulse-slow">
                ⚔️ BATTLE REALM ⚔️
              </h1>
              <div className="h-1 w-24 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4"></div>
              <p className="text-purple-200/80 text-sm sm:text-base tracking-widest uppercase font-semibold">
                Bem-vindo ao reino da batalha
              </p>
            </div>

            {/* Content */}
            {viewMode === "selection" && (
              <div className="space-y-8 sm:space-y-10">
                <p className="text-center text-purple-300/90 text-base sm:text-lg leading-relaxed max-w-lg mx-auto">
                  Escolha seu caminho e prepare-se para a glória
                </p>

                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Login Button */}
                  <button
                    onClick={() => setViewMode("login")}
                    className="group/btn relative px-8 py-4 sm:py-5 overflow-hidden rounded-xl transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300 group-hover/btn:scale-110"></div>
                    <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 bg-white/10 transition-all duration-300"></div>
                    <span className="relative flex items-center justify-center gap-2 font-bold text-white text-sm sm:text-base uppercase tracking-wider">
                      🗝️ Entrar
                    </span>
                    <div className="absolute inset-0 rounded-xl border border-white/20 group-hover/btn:border-white/50 transition-all duration-300"></div>
                  </button>

                  {/* Register Button */}
                  <button
                    onClick={() => setViewMode("register")}
                    className="group/btn relative px-8 py-4 sm:py-5 overflow-hidden rounded-xl transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-pink-400 transition-all duration-300 group-hover/btn:scale-110"></div>
                    <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 bg-white/10 transition-all duration-300"></div>
                    <span className="relative flex items-center justify-center gap-2 font-bold text-white text-sm sm:text-base uppercase tracking-wider">
                      ✨ Criar Conta
                    </span>
                    <div className="absolute inset-0 rounded-xl border border-white/20 group-hover/btn:border-white/50 transition-all duration-300"></div>
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

      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 border border-purple-500/30 rounded-lg animate-float opacity-20"></div>
      <div
        className="absolute bottom-20 right-10 w-32 h-32 border border-pink-500/30 rounded-full animate-float opacity-10"
        style={{ animationDelay: "2s" }}
      ></div>

      <style>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .bg-radial-glow {
          background-image: radial-gradient(
            circle at 50% 50%,
            rgba(168, 85, 247, 0.15) 0%,
            transparent 70%
          );
        }
      `}</style>
    </div>
  );
};

export default HomePage;

import React, { useEffect, useState } from "react";

interface TurnStartModalProps {
  isVisible: boolean;
  onHide: () => void;
  round?: number;
  isMyTurn: boolean;
  isRoundStart?: boolean;
  currentPlayerKingdomName?: string;
}

export const TurnStartModal: React.FC<TurnStartModalProps> = ({
  isVisible,
  onHide,
  round = 1,
  isMyTurn,
  isRoundStart = false,
  currentPlayerKingdomName,
}) => {
  const [animationPhase, setAnimationPhase] = useState<
    "entering" | "visible" | "exiting" | "hidden"
  >("hidden");

  useEffect(() => {
    if (isVisible) {
      setAnimationPhase("entering");

      // Fase de entrada completa
      const enterTimer = setTimeout(() => {
        setAnimationPhase("visible");
      }, 400);

      // Começar a sair depois de alguns segundos
      const exitTimer = setTimeout(() => {
        setAnimationPhase("exiting");
      }, 2500);

      // Esconder completamente
      const hideTimer = setTimeout(() => {
        setAnimationPhase("hidden");
        onHide();
      }, 3200);

      return () => {
        clearTimeout(enterTimer);
        clearTimeout(exitTimer);
        clearTimeout(hideTimer);
      };
    } else {
      // Resetar fase quando isVisible mudar para false externamente
      setAnimationPhase("hidden");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]); // onHide é estável, não precisa estar nas deps

  if (animationPhase === "hidden") return null;

  const getAnimationClasses = () => {
    switch (animationPhase) {
      case "entering":
        return "scale-0 opacity-0 rotate-12";
      case "visible":
        return "scale-100 opacity-100 rotate-0";
      case "exiting":
        return "scale-110 opacity-0 -translate-y-8";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      {/* Overlay com fade */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${
          animationPhase === "exiting" ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Container do Modal */}
      <div
        className={`relative transform transition-all duration-500 ease-out ${getAnimationClasses()}`}
      >
        {/* Brilho de fundo */}
        <div
          className={`absolute inset-0 -m-8 blur-2xl animate-pulse ${
            isMyTurn
              ? "bg-gradient-radial from-amber-500/30 via-transparent to-transparent"
              : "bg-gradient-radial from-blue-500/30 via-transparent to-transparent"
          }`}
        />

        {/* Card Principal */}
        <div
          className={`relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 rounded-xl shadow-2xl px-12 py-8 min-w-[400px] ${
            isMyTurn
              ? "border-amber-500/50 shadow-amber-500/20"
              : "border-blue-500/50 shadow-blue-500/20"
          }`}
        >
          {/* Decoração superior */}
          <div
            className={`absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-gradient-to-r from-transparent to-transparent rounded-full ${
              isMyTurn ? "via-amber-400" : "via-blue-400"
            }`}
          />

          {/* Ícone de espadas cruzadas */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <span className="text-5xl animate-bounce">
                {isMyTurn ? "⚔️" : "⏳"}
              </span>
              {/* Brilho atrás do ícone */}
              <div
                className={`absolute inset-0 blur-xl rounded-full ${
                  isMyTurn ? "bg-amber-400/20" : "bg-blue-400/20"
                }`}
              />
            </div>
          </div>

          {/* Texto principal */}
          <div className="text-center space-y-2">
            {/* Mensagem de início de rodada */}
            {isRoundStart && (
              <div className="mb-4 animate-pulse">
                <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
                  🎯 Começo da Rodada {round}!
                </p>
              </div>
            )}

            {isMyTurn ? (
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 animate-pulse">
                SEU TURNO!
              </h2>
            ) : (
              <>
                <p className="text-gray-400 text-sm uppercase tracking-wider">
                  Turno de
                </p>
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-400 to-blue-300">
                  {currentPlayerKingdomName || "Oponente"}
                </h2>
              </>
            )}

            <div
              className={`h-px w-3/4 mx-auto bg-gradient-to-r from-transparent to-transparent ${
                isMyTurn ? "via-amber-500/50" : "via-blue-500/50"
              }`}
            />

            {/* Só mostra "Rodada X" se não for início de rodada (evitar repetição) */}
            {!isRoundStart && (
              <p className="text-gray-300 text-lg">
                Rodada{" "}
                <span
                  className={`font-bold ${
                    isMyTurn ? "text-amber-400" : "text-blue-400"
                  }`}
                >
                  {round}
                </span>
              </p>
            )}
          </div>

          {/* Instruções - só mostra se for meu turno */}
          {isMyTurn ? (
            <div className="mt-6 space-y-2 text-center">
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <span className="text-amber-400">👆</span>
                <span>Selecione uma unidade para agir</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                <span>⚡</span>
                <span>Use ações, movimente-se e ataque!</span>
              </div>
            </div>
          ) : (
            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm">
                Aguarde o oponente realizar suas ações...
              </p>
            </div>
          )}

          {/* Decoração inferior */}
          <div
            className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent to-transparent rounded-full ${
              isMyTurn ? "via-amber-400/50" : "via-blue-400/50"
            }`}
          />

          {/* Cantos decorativos */}
          <div
            className={`absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 rounded-tl ${
              isMyTurn ? "border-amber-500/30" : "border-blue-500/30"
            }`}
          />
          <div
            className={`absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 rounded-tr ${
              isMyTurn ? "border-amber-500/30" : "border-blue-500/30"
            }`}
          />
          <div
            className={`absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 rounded-bl ${
              isMyTurn ? "border-amber-500/30" : "border-blue-500/30"
            }`}
          />
          <div
            className={`absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 rounded-br ${
              isMyTurn ? "border-amber-500/30" : "border-blue-500/30"
            }`}
          />
        </div>

        {/* Partículas decorativas */}
        <div
          className={`absolute -top-4 -left-4 w-2 h-2 rounded-full animate-ping ${
            isMyTurn ? "bg-amber-400" : "bg-blue-400"
          }`}
        />
        <div
          className={`absolute -top-2 -right-6 w-1.5 h-1.5 rounded-full animate-ping delay-100 ${
            isMyTurn ? "bg-yellow-300" : "bg-cyan-300"
          }`}
        />
        <div
          className={`absolute -bottom-4 -right-4 w-2 h-2 rounded-full animate-ping delay-200 ${
            isMyTurn ? "bg-amber-500" : "bg-blue-500"
          }`}
        />
        <div
          className={`absolute -bottom-2 -left-6 w-1.5 h-1.5 rounded-full animate-ping delay-300 ${
            isMyTurn ? "bg-yellow-400" : "bg-cyan-400"
          }`}
        />
      </div>
    </div>
  );
};

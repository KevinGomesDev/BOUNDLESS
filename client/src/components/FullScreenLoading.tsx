import React from "react";

interface FullScreenLoadingProps {
  message?: string;
}

/**
 * FullScreenLoading - Loading que ocupa a tela inteira
 * Barra de progresso animada da esquerda para direita
 */
export const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({
  message = "Carregando...",
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900">
      {/* Barra de progresso */}
      <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-loading-bar" />
      </div>

      {/* Mensagem */}
      <p className="text-gray-300 text-sm animate-pulse">{message}</p>
    </div>
  );
};

export default FullScreenLoading;

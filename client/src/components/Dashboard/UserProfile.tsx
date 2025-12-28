import React from "react";

interface User {
  id: string;
  username: string;
}

interface UserProfileProps {
  user: User | null;
}

/**
 * Componente que exibe o perfil do usuário autenticado
 */
export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  if (!user) {
    return null;
  }

  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative bg-slate-800/40 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 p-6 hover:border-purple-500/60 transition-all duration-300">
        <h3 className="text-lg sm:text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
          👤 Seu Perfil
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-purple-400/60 text-xs uppercase tracking-widest font-semibold">
              Nome de Guerreiro
            </p>
            <p className="text-lg font-bold text-purple-200 mt-1">
              {user.username}
            </p>
          </div>
          <div className="border-t border-slate-700/50 pt-3">
            <p className="text-purple-400/60 text-xs uppercase tracking-widest font-semibold">
              ID Único
            </p>
            <p className="text-purple-200 font-mono text-xs mt-1 break-all">
              {user.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

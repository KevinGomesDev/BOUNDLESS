import React from "react";

interface User {
  id: string;
  username: string;
}

interface UserProfileProps {
  user: User | null;
}

/**
 * Perfil do Comandante - Estilo Cidadela de Pedra
 * Mostra informações do senhor do reino
 */
export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Avatar e Nome */}
      <div className="flex items-center gap-4">
        {/* Escudo do Comandante */}
        <div className="relative w-14 h-14 bg-gradient-to-b from-metal-bronze to-metal-copper rounded-lg border-2 border-metal-iron flex items-center justify-center shadow-stone-raised">
          <span className="text-2xl">👤</span>
          {/* Borda decorativa */}
          <div className="absolute -inset-0.5 border border-metal-gold/20 rounded-lg pointer-events-none"></div>
        </div>

        <div className="flex-1">
          <p
            className="text-parchment-light font-bold text-lg"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {user.username}
          </p>
          <p className="text-parchment-dark text-xs tracking-wider uppercase">
            Senhor da Guerra
          </p>
        </div>
      </div>

      {/* Placa de Identificação */}
      <div className="bg-citadel-slate/50 rounded-lg border border-metal-iron/30 p-3">
        <p className="text-parchment-dark text-xs uppercase tracking-widest mb-1">
          Insígnia Única
        </p>
        <p className="text-metal-steel font-mono text-xs break-all">
          {user.id}
        </p>
      </div>
    </div>
  );
};

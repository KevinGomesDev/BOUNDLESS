import React from "react";

// Core
import { ConnectionProvider } from "../core";

// Features
import { AuthProvider } from "../features/auth";
import { KingdomProvider } from "../features/kingdom";
import { MatchProvider } from "../features/match";
import { MapProvider } from "../features/map";
import { GameDataProvider } from "../features/game";

interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * AppProvider - Combines all context providers in the correct order.
 *
 * Order matters! Dependencies:
 * 1. ConnectionProvider - Base (no dependencies)
 * 2. AuthProvider - Depends on Connection
 * 3. KingdomProvider - Depends on Auth
 * 4. GameDataProvider - Independent
 * 5. MatchProvider - Depends on Auth, Kingdom
 * 6. MapProvider - Independent (used by Match internally)
 */
export function AppProvider({ children }: AppProviderProps) {
  return (
    <ConnectionProvider>
      <AuthProvider>
        <KingdomProvider>
          <GameDataProvider>
            <MatchProvider>
              <MapProvider>{children}</MapProvider>
            </MatchProvider>
          </GameDataProvider>
        </KingdomProvider>
      </AuthProvider>
    </ConnectionProvider>
  );
}

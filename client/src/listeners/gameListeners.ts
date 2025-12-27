import { socketService } from "@/services/socket.service";
import { useEffect } from "react";

/**
 * Exemplo: Como adicionar listeners para eventos em tempo real do servidor
 *
 * Este arquivo mostra as melhores práticas para escutar eventos
 * do servidor e atualizar o estado da aplicação
 */

// ============================================
// 1. Listeners para eventos do jogo
// ============================================

/**
 * Listener para atualizações de partida em tempo real
 * Deve ser chamado quando o usuário entrar em uma partida
 */
export function setupMatchListeners() {
  // Atualizações de turno
  socketService.on("match:turn-updated", (data: any) => {
    console.log("Turno atualizado:", data);
    // dispatch({ type: 'SET_TURN', payload: data.turn })
  });

  // Novo jogador entrou na partida
  socketService.on("match:player-joined", (data: any) => {
    console.log("Jogador entrou:", data.player);
    // dispatch({ type: 'ADD_PLAYER', payload: data.player })
  });

  // Jogador saiu da partida
  socketService.on("match:player-left", (data: any) => {
    console.log("Jogador saiu:", data.playerId);
    // dispatch({ type: 'REMOVE_PLAYER', payload: data.playerId })
  });

  // Partida finalizada
  socketService.on("match:finished", (data: any) => {
    console.log("Partida finalizada:", data.winner);
    // dispatch({ type: 'SET_MATCH_STATUS', payload: 'FINISHED' })
  });

  return () => {
    socketService.off("match:turn-updated");
    socketService.off("match:player-joined");
    socketService.off("match:player-left");
    socketService.off("match:finished");
  };
}

/**
 * Listener para atualizações de tropas
 */
export function setupTroopListeners() {
  // Tropa movida
  socketService.on("troop:moved", (data: any) => {
    console.log("Tropa movida:", data);
    // dispatch({ type: 'UPDATE_TROOP_POSITION', payload: data })
  });

  // Tropa recrutada
  socketService.on("troop:recruited", (data: any) => {
    console.log("Tropa recrutada:", data);
    // dispatch({ type: 'ADD_TROOP', payload: data })
  });

  // Tropa eliminada
  socketService.on("troop:eliminated", (data: any) => {
    console.log("Tropa eliminada:", data.troopId);
    // dispatch({ type: 'REMOVE_TROOP', payload: data.troopId })
  });

  // Combate ocorreu
  socketService.on("troop:combat", (data: any) => {
    console.log("Combate:", data);
    // dispatch({ type: 'LOG_COMBAT', payload: data })
  });

  return () => {
    socketService.off("troop:moved");
    socketService.off("troop:recruited");
    socketService.off("troop:eliminated");
    socketService.off("troop:combat");
  };
}

/**
 * Listener para atualizações do reino
 */
export function setupKingdomListeners() {
  // Recurso alterado
  socketService.on("kingdom:resource-changed", (data: any) => {
    console.log("Recurso alterado:", data);
    // dispatch({ type: 'UPDATE_RESOURCE', payload: data })
  });

  // Estrutura construída
  socketService.on("kingdom:structure-built", (data: any) => {
    console.log("Estrutura construída:", data);
    // dispatch({ type: 'ADD_STRUCTURE', payload: data })
  });

  // Alegria alterada
  socketService.on("kingdom:morale-changed", (data: any) => {
    console.log("Moral alterada:", data.morale);
    // dispatch({ type: 'UPDATE_MORALE', payload: data.morale })
  });

  return () => {
    socketService.off("kingdom:resource-changed");
    socketService.off("kingdom:structure-built");
    socketService.off("kingdom:morale-changed");
  };
}

/**
 * Listener para atualizações do mapa
 */
export function setupMapListeners() {
  // Território conquistado
  socketService.on("map:territory-conquered", (data: any) => {
    console.log("Território conquistado:", data);
    // dispatch({ type: 'UPDATE_TERRITORY_OWNER', payload: data })
  });

  // Nova crise apareceu
  socketService.on("map:crisis-appeared", (data: any) => {
    console.log("Nova crise:", data.crisis);
    // dispatch({ type: 'ADD_CRISIS', payload: data.crisis })
  });

  return () => {
    socketService.off("map:territory-conquered");
    socketService.off("map:crisis-appeared");
  };
}

/**
 * Listener para chat/mensagens
 */
export function setupChatListeners() {
  // Nova mensagem
  socketService.on("chat:message", (data: any) => {
    console.log("Mensagem:", data);
    // dispatch({ type: 'ADD_MESSAGE', payload: data })
  });

  // Usuário digitando
  socketService.on("chat:user-typing", (data: any) => {
    console.log("Usuário digitando:", data.username);
    // dispatch({ type: 'SET_TYPING_USER', payload: data.username })
  });

  return () => {
    socketService.off("chat:message");
    socketService.off("chat:user-typing");
  };
}

// ============================================
// 2. Hook para gerenciar listeners
// ============================================

/**
 * Hook para adicionar listeners de forma segura
 * Remove listeners automaticamente no cleanup
 */
export function useGameListeners(
  type: "match" | "troop" | "kingdom" | "map" | "chat" | "all"
) {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    if (type === "all" || type === "match") {
      cleanups.push(setupMatchListeners());
    }

    if (type === "all" || type === "troop") {
      cleanups.push(setupTroopListeners());
    }

    if (type === "all" || type === "kingdom") {
      cleanups.push(setupKingdomListeners());
    }

    if (type === "all" || type === "map") {
      cleanups.push(setupMapListeners());
    }

    if (type === "all" || type === "chat") {
      cleanups.push(setupChatListeners());
    }

    // Cleanup: remove listeners quando componente desmonta
    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [type]);
}

// ============================================
// 3. Exemplo de uso em componente
// ============================================

/**
 * Exemplo: Componente que escuta eventos de partida
 */
export function GameBoardExample() {
  // Adiciona listeners automaticamente
  useGameListeners("all");

  return (
    <div>
      <h1>Tabuleiro de Jogo</h1>
      <p>Listeners de eventos configurados automaticamente</p>
    </div>
  );
}

// ============================================
// 4. Padrão para adicionar listeners específicos
// ============================================

/**
 * Se você quiser adicionar um listener específico em um componente:
 */
export function ComponentWithSpecificListener() {
  useEffect(() => {
    const handleMatchUpdate = (data: any) => {
      console.log("Atualização de partida:", data);
      // Atualize o estado ou execute alguma ação
    };

    socketService.on("match:turn-updated", handleMatchUpdate);

    // Cleanup
    return () => {
      socketService.off("match:turn-updated", handleMatchUpdate);
    };
  }, []);

  return <div>Escutando eventos de partida</div>;
}

// ============================================
// 5. Enviar eventos para o servidor
// ============================================

/**
 * Exemplos de como enviar eventos para o servidor
 */

export function sendGameEvents() {
  // Mover tropa
  socketService.emit("troop:move", {
    troopId: "troop-123",
    destinationTile: 42,
  });

  // Reclutar tropa
  socketService.emit("troop:recruit", {
    kingdomId: "kingdom-1",
    troopType: "SOLDIER",
    quantity: 5,
  });

  // Construir estrutura
  socketService.emit("kingdom:build", {
    kingdomId: "kingdom-1",
    structureType: "BARRACKS",
    tileIndex: 15,
  });

  // Atacar outro jogador
  socketService.emit("match:attack", {
    attackerTroopId: "troop-1",
    defenderTroopId: "troop-2",
  });

  // Enviar mensagem
  socketService.emit("chat:send", {
    matchId: "match-1",
    message: "Olá pessoal!",
  });
}

// ============================================
// 6. Integração com GameContext
// ============================================

/**
 * Para integrar listeners com o GameContext,
 * adicione isto no setupSocketListeners() da GameContext.tsx:
 */

export const integrateListenersWithContext = `
function setupSocketListeners(dispatch: React.Dispatch<any>) {
  // ... listeners existentes ...

  // Listeners de partida
  socketService.on('match:turn-updated', (data) => {
    dispatch({ type: 'UPDATE_MATCH_STATE', payload: data });
  });

  socketService.on('match:player-joined', (data) => {
    dispatch({ type: 'ADD_PLAYER_TO_MATCH', payload: data.player });
  });

  // Listeners de tropas
  socketService.on('troop:moved', (data) => {
    dispatch({ type: 'UPDATE_TROOP_POSITION', payload: data });
  });

  socketService.on('troop:recruited', (data) => {
    dispatch({ type: 'ADD_TROOP', payload: data });
  });

  // Listeners de reino
  socketService.on('kingdom:resource-changed', (data) => {
    dispatch({ type: 'UPDATE_RESOURCE', payload: data });
  });
}
`;

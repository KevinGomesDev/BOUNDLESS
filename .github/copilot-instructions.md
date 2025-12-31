# Battle Realm - Development Guidelines

## 🎮 Game Overview

Battle Realm é um **jogo de turnos baseado em browser** com sistema de batalha PvP em arena grid-based. O backend é sempre a **fonte de verdade** para toda lógica de jogo.

## 📁 Project Structure

```
├── client/          # React + Vite + TypeScript (Frontend)
├── server/          # Node.js + Express + Socket.IO + Prisma (Backend)
└── shared/          # Tipos e constantes compartilhados (CRÍTICO!)
    └── types/       # Tipos TypeScript usados por ambos
```

### Stack

- **Client:** React 18 + Vite + TypeScript + TailwindCSS
- **Server:** Node.js + Express + Socket.IO + Prisma + PostgreSQL
- **Communication:** Socket.IO (WebSocket) - Tempo real, bidirecional

---

## 🚨 REGRAS CRÍTICAS

### 1. Shared Types - SEMPRE usar `shared/types/`

Tipos e constantes usados por **client E server** DEVEM estar em `shared/types/`:

```typescript
// ✅ CORRETO - Definir no shared
// shared/types/arena.types.ts
export interface ArenaUnit { ... }

// Client: importar do shared
import type { ArenaUnit } from "../../../../../shared/types";

// Server: importar do shared
import type { ArenaUnit } from "../../../shared/types";
```

```typescript
// ❌ ERRADO - Duplicar tipos em cada lado
// client/src/types/arena.types.ts
export interface ArenaUnit { ... }
// server/src/types/arena.types.ts
export interface ArenaUnit { ... } // DUPLICAÇÃO!
```

### 2. Backend = Fonte de Verdade

O **servidor** é a autoridade para:

- Lógica de batalha e combate
- Cálculos de dano/iniciativa/movimento
- Validação de ações do jogador
- Estado atual do jogo

```typescript
// ✅ CORRETO - Server calcula e envia resultado
// server/handlers/battle.handler.ts
const damage = calculateDamage(attacker, defender);
io.to(battleRoom).emit("battle:attack-result", { damage, ... });

// client recebe e exibe
socket.on("battle:attack-result", (data) => {
  dispatch({ type: "ATTACK_RESULT", payload: data });
});
```

```typescript
// ❌ ERRADO - Client calculando lógica de jogo
const damage = attacker.combat - defender.armor; // NÃO!
```

### 3. Socket Events - Verificar Emitter ↔ Listener

Sempre garantir que o **evento emitido** corresponde ao **listener esperado**:

```typescript
// SERVER - Emitindo evento
socket.emit("arena:lobby-updated", lobbyData);

// CLIENT - Listener DEVE corresponder exatamente
socketService.on("arena:lobby-updated", (data) => { ... });
//              ^^^^^^^^^^^^^^^^^^^^^^ MESMO NOME!
```

**Checklist para Socket Events:**

1. Nome do evento é idêntico em ambos os lados?
2. Payload tem os mesmos campos?
3. Tipos estão sincronizados via `shared/types`?

### 4. Condições de Batalha - Uma Fonte de Verdade

Todas as condições (buffs/debuffs) são definidas em `server/src/logic/conditions.ts`:

```typescript
// Tipos em shared/types/conditions.types.ts
export interface ConditionDefinition { ... }

// Definições no server (FONTE DE VERDADE)
// server/src/logic/conditions.ts
export const CONDITIONS: Record<string, ConditionDefinition> = { ... }

// Dados visuais no shared (para frontend usar)
// shared/types/conditions.data.ts
export const CONDITIONS_INFO = { ... }
```

---

## 🏗️ Architecture Patterns

### Frontend (client/)

```
src/
├── features/           # Módulos por feature (arena/, auth/, kingdom/)
│   └── arena/
│       ├── components/ # Componentes React da feature
│       ├── context/    # ArenaContext + arenaReducer
│       ├── hooks/      # useArena, useBattleKeyboard
│       ├── constants/  # Constantes específicas da feature
│       ├── types/      # Tipos client-only (re-export shared)
│       └── utils/      # Helpers e loggers
├── services/           # socket.service.ts (singleton)
├── components/         # Componentes globais reutilizáveis
├── pages/              # Páginas/rotas
└── providers/          # Context providers
```

**Padrão Feature-based:**

```typescript
// Cada feature exporta sua API pública via index.ts
// client/src/features/arena/index.ts
export { ArenaProvider, useArena } from "./context";
export { ArenaBattleView, ArenaList } from "./components";
export type { ArenaState, ArenaUnit } from "./types";
```

### Backend (server/)

```
src/
├── handlers/           # Socket event handlers (1 por domínio)
│   ├── battle.handler.ts
│   ├── kingdom.handler.ts
│   └── turn.handler.ts
├── logic/              # Lógica de jogo pura (sem I/O)
│   ├── conditions.ts   # FONTE DE VERDADE para condições
│   ├── combat-actions.ts
│   └── unit-actions.ts
├── services/           # Business logic com I/O
├── utils/              # Helpers puros
├── data/               # Configurações e constantes
└── lib/                # Integrações (prisma, auth)
```

**Padrão Handler:**

```typescript
// server/src/handlers/example.handler.ts
export function registerExampleHandlers(io: Server, socket: Socket) {
  socket.on("example:action", async (data, callback) => {
    try {
      // 1. Validar input
      // 2. Processar lógica
      // 3. Persistir se necessário
      // 4. Emitir resultado
      callback?.({ success: true, data: result });
    } catch (error) {
      callback?.({ success: false, error: error.message });
    }
  });
}
```

---

## 📝 Code Conventions

### Imports

```typescript
// Path alias no client
import { useAuth } from "@/hooks/useAuth";
import { AsyncButton } from "@/components/AsyncButton";

// Shared types
import type { ArenaUnit, ArenaBattle } from "shared/types";
```

### Socket Event Naming

```
{domain}:{action}[-{qualifier}]

Exemplos:
- arena:create-lobby
- arena:lobby-updated
- battle:action-executed
- kingdom:resources-updated
```

### State Management (Frontend)

```typescript
// Context + Reducer pattern
const [state, dispatch] = useReducer(arenaReducer, initialState);

// Actions tipadas
type ArenaAction =
  | { type: "SET_LOBBIES"; payload: ArenaLobby[] }
  | { type: "JOIN_LOBBY"; payload: ArenaLobby }
  | { type: "BATTLE_UPDATE"; payload: ArenaBattle };
```

---

## ⚔️ Battle System (Turn-Based)

### Flow de Turno

1. **Server** determina ordem de iniciativa
2. **Server** emite `battle:turn-start` com unidade ativa
3. **Client** exibe UI para ação
4. **Client** envia `battle:execute-action` com ação escolhida
5. **Server** valida, processa, e emite `battle:action-result`
6. **Server** avança para próxima unidade ou rodada

### Estrutura de Batalha

```typescript
interface Battle {
  id: string;
  gridWidth: number;
  gridHeight: number;
  round: number;
  currentTurnIndex: number;
  initiativeOrder: string[]; // IDs das unidades
  units: BattleUnit[];
  status: "ACTIVE" | "ENDED";
}
```

---

## 🚫 DO NOT

- ❌ Criar arquivos .md de documentação (exceto este)
- ❌ Executar `npm run build` ou `npm run dev` (assumir que estão rodando)
- ❌ Duplicar tipos entre client e server
- ❌ Calcular lógica de jogo no frontend
- ❌ Criar eventos socket sem verificar o listener correspondente
- ❌ Adicionar console.log desnecessários (usar logger da feature)

## ✅ DO

- ✅ Usar `shared/types/` para tipos compartilhados
- ✅ Validar ações no backend antes de processar
- ✅ Usar TypeScript estrito com tipos explícitos
- ✅ Seguir padrões existentes (Context/Reducer, Handlers)
- ✅ Manter código conciso e focado
- ✅ Usar callbacks em socket.emit para confirmação

---

## 🔧 Quick Reference

| Ação                       | Onde                                        |
| -------------------------- | ------------------------------------------- |
| Novo tipo compartilhado    | `shared/types/`                             |
| Nova condição de batalha   | `server/src/logic/conditions.ts`            |
| Novo socket event          | Handler no server + Listener no client      |
| Novo componente de feature | `client/src/features/{feature}/components/` |
| Lógica de combate          | `server/src/logic/combat-actions.ts`        |
| Persistência de dados      | `server/src/services/` via Prisma           |

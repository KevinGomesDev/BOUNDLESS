# Battle Realm - Development Guidelines

## Project Structure

- **Client:** React + Vite + TypeScript
- **Server:** Node.js + Express + Socket.IO + Prisma + PostgreSQL
- **Communication:** Socket.IO (WebSocket)

## Development Rules

### DO NOT

- ❌ Create documentation files (.md, except existing project docs)
- ❌ Run `npm run build` or `npm run dev` - assume they're always running
- ❌ Create explanations or comments about changes
- ❌ Add unnecessary logging or debug code

### DO

- ✅ Implement features directly in code
- ✅ Use TypeScript and type safety
- ✅ Follow established patterns (Services, Hooks, Context)
- ✅ Keep code concise and focused

## Frontend Architecture

- **Services:** Socket communication layer (`socket.service.ts`)
- **Context:** Global state management (`GameContext.tsx`)
- **Hooks:** Custom hooks for components (`useGame.ts`)
- **Components:** Reusable UI components
- **Types:** TypeScript types in `types/game.types.ts`

## Code Patterns

### Imports

Use path alias `@/` for all internal imports:

```typescript
import { useAuth } from "@/hooks/useGame";
import { AsyncButton } from "@/components/AsyncButton";
```

### State Management

- Use `useGame()` hook for context access
- Dispatch actions through reducer
- Subscribe to socket events via listeners

### Components

- Use `AsyncButton` for async operations
- Use `ErrorAlert`, `SuccessAlert` for feedback
- Always handle loading and error states

## Backend Structure

- Handlers in `src/handlers/` (auth, kingdom, match, troop)
- Services in `src/services/`
- Logic/Generators in `src/logic/`
- Socket handlers register in `server.ts`

## Git Configuration

- `.gitignore` includes all build outputs, env files, node_modules
- No .md documentation files (except project originals)
- Focus on clean, working code

## Current Status

- [x] Frontend brain (Socket Service, Context, Hooks)
- [x] Basic components (AsyncButton, Alerts)
- [x] Example pages (Login, CreateKingdom)
- [x] Real-time listeners pattern
- [ ] Dashboard/Main game UI
- [ ] Game map component
- [ ] Advanced features (notifications, persistence)

import { useEffect } from "react";
import { useConnection, useAuth, useGameState } from "./hooks/useGame";
import "./App.css";

function AppContent() {
  const { connect, isConnected, error: connectionError } = useConnection();
  const {
    login,
    register,
    isLoading: authLoading,
    error: authError,
  } = useAuth();
  const gameState = useGameState();

  useEffect(() => {
    // Conecta ao servidor na inicialização
    connect().catch(console.error);
  }, [connect]);

  const handleLogin = async () => {
    try {
      await login("testuser", "password123");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleRegister = async () => {
    try {
      await register("testuser", "test@example.com", "password123");
    } catch (error) {
      console.error("Register failed:", error);
    }
  };

  return (
    <div className="app">
      <h1>Battle Realm - Frontend</h1>

      {/* Connection Status */}
      <div
        style={{
          padding: "10px",
          marginBottom: "20px",
          backgroundColor: isConnected ? "#d4edda" : "#f8d7da",
          borderRadius: "4px",
        }}
      >
        <h3>Conexão: {isConnected ? "✅ Conectado" : "❌ Desconectado"}</h3>
        {connectionError && <p style={{ color: "red" }}>{connectionError}</p>}
      </div>

      {/* Auth Section */}
      <div
        style={{
          padding: "20px",
          border: "1px solid #ddd",
          marginBottom: "20px",
          borderRadius: "4px",
        }}
      >
        <h2>Autenticação</h2>
        <button onClick={handleLogin} disabled={!isConnected || authLoading}>
          {authLoading ? "Carregando..." : "Fazer Login"}
        </button>
        <button
          onClick={handleRegister}
          disabled={!isConnected || authLoading}
          style={{ marginLeft: "10px" }}
        >
          {authLoading ? "Carregando..." : "Registrar"}
        </button>
        {authError && <p style={{ color: "red" }}>{authError}</p>}
        {gameState.user && (
          <p style={{ color: "green" }}>
            ✅ Usuário: {gameState.user.username}
          </p>
        )}
      </div>

      {/* Game State Debug */}
      <div
        style={{
          padding: "20px",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
          maxHeight: "400px",
          overflow: "auto",
        }}
      >
        <h2>Estado do Jogo</h2>
        <pre>{JSON.stringify(gameState, null, 2)}</pre>
      </div>
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;

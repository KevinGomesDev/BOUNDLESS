import React from "react";

interface AsyncButtonProps {
  onClick: () => Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Componente reutilizável para botões que disparam ações assíncronas
 * Gerencia loading, erro e sucesso automaticamente
 */
export const AsyncButton: React.FC<AsyncButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  error,
  children,
  className = "",
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setLocalError(null);

    try {
      await onClick();
      onSuccess?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      setLocalError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = disabled || isLoading || loading;
  const displayError = error || localError;

  return (
    <div className={`async-button-wrapper ${className}`}>
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className="async-button"
      >
        {isLoading || loading ? "⏳ Carregando..." : children}
      </button>
      {displayError && <p className="async-button-error">{displayError}</p>}
    </div>
  );
};

// CSS para estilo base
const styles = `
.async-button-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.async-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s, opacity 0.3s;
}

.async-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.async-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.async-button-error {
  color: #dc3545;
  font-size: 14px;
  margin: 0;
}
`;

// Exportar estilos para serem incluídos na aplicação
export const asyncButtonStyles = styles;

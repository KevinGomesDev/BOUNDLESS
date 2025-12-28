import React from "react";

interface AsyncButtonProps {
  onClick: () => Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
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
  type = "button",
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
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        type={type}
        className={`px-4 py-2 border-none rounded-md bg-blue-500 text-white cursor-pointer font-medium transition-all duration-300 hover:bg-blue-600 hover:not-disabled:hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading || loading ? "⏳ Carregando..." : children}
      </button>
      {displayError && (
        <p className="text-red-600 text-sm m-0">{displayError}</p>
      )}
    </div>
  );
};

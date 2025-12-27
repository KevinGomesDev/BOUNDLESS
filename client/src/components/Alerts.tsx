import React from "react";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  message?: string;
  className?: string;
}

/**
 * Componente de spinner de carregamento
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  message,
  className = "",
}) => {
  const sizeClasses = {
    small: "spinner-small",
    medium: "spinner-medium",
    large: "spinner-large",
  };

  return (
    <div className={`loading-spinner-wrapper ${className}`}>
      <div className={`loading-spinner ${sizeClasses[size]}`}></div>
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );
};

interface ErrorAlertProps {
  error: string | null;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Componente de alerta de erro
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onDismiss,
  className = "",
}) => {
  if (!error) return null;

  return (
    <div className={`error-alert ${className}`}>
      <span className="error-icon">⚠️</span>
      <span className="error-message">{error}</span>
      {onDismiss && (
        <button className="error-close" onClick={onDismiss}>
          ✕
        </button>
      )}
    </div>
  );
};

interface SuccessAlertProps {
  message: string;
  onDismiss?: () => void;
  autoDismiss?: number; // milliseconds
  className?: string;
}

/**
 * Componente de alerta de sucesso
 */
export const SuccessAlert: React.FC<SuccessAlertProps> = ({
  message,
  onDismiss,
  autoDismiss = 3000,
  className = "",
}) => {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, autoDismiss);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss]);

  if (!visible) return null;

  return (
    <div className={`success-alert ${className}`}>
      <span className="success-icon">✓</span>
      <span className="success-message">{message}</span>
      {onDismiss && (
        <button
          className="success-close"
          onClick={() => {
            setVisible(false);
            onDismiss();
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
};

// CSS para estilos base
const styles = `
/* Loading Spinner */
.loading-spinner-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.loading-spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner-small {
  width: 20px;
  height: 20px;
}

.loading-spinner-medium {
  width: 40px;
  height: 40px;
}

.loading-spinner-large {
  width: 60px;
  height: 60px;
}

.spinner-message {
  color: #666;
  font-size: 14px;
  margin: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error Alert */
.error-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin-bottom: 12px;
}

.error-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.error-message {
  flex: 1;
}

.error-close {
  background: none;
  border: none;
  color: #721c24;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  flex-shrink: 0;
}

.error-close:hover {
  opacity: 0.7;
}

/* Success Alert */
.success-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  margin-bottom: 12px;
}

.success-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.success-message {
  flex: 1;
}

.success-close {
  background: none;
  border: none;
  color: #155724;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  flex-shrink: 0;
}

.success-close:hover {
  opacity: 0.7;
}
`;

export const alertStyles = styles;

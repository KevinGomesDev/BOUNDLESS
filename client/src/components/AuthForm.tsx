import React, { useState } from "react";
import { ErrorAlert, SuccessAlert } from "@/components/Alerts";

export interface AuthFormData {
  username: string;
  email?: string;
  password: string;
}

interface AuthFormProps {
  mode: "login" | "register";
  onSubmit: (data: AuthFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Componente reutilizável para formulários de autenticação (Login/Registro)
 */
export const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  onSubmit,
  onCancel,
  isLoading = false,
  error: externalError,
}) => {
  const [formData, setFormData] = useState<AuthFormData>({
    username: "",
    email: "",
    password: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isLogin = mode === "login";
  const title = isLogin ? "Entrar no Jogo" : "Criar Conta";
  const buttonText = isLogin ? "Entrar" : "Registrar";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    if (!formData.username || !formData.password) {
      setLocalError("Preencha todos os campos obrigatórios");
      return;
    }

    if (!isLogin && !formData.email) {
      setLocalError("Email é obrigatório para registro");
      return;
    }

    if (formData.password.length < 6) {
      setLocalError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    try {
      await onSubmit(formData);
      setShowSuccess(true);
      setFormData({ username: "", email: "", password: "" });

      // Auto-dismiss success message
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (error: any) {
      setLocalError(error.message || "Erro ao processar requisição");
    }
  };

  const displayError = externalError || localError;

  return (
    <div className="w-full space-y-6">
      {/* Form Title */}
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          {title}
        </h2>
        <div className="h-0.5 w-12 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
      </div>

      {showSuccess && (
        <SuccessAlert
          message={
            isLogin
              ? "Login realizado com sucesso!"
              : "Conta criada com sucesso!"
          }
          onDismiss={() => setShowSuccess(false)}
          autoDismiss={2000}
        />
      )}

      <ErrorAlert
        error={displayError}
        onDismiss={() => {
          setLocalError(null);
        }}
      />

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Username Field */}
        <div className="group">
          <label
            htmlFor="username"
            className="block font-bold text-purple-300 text-sm mb-2 uppercase tracking-wide"
          >
            👤 Usuário
          </label>
          <div className="relative">
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="Digite seu nome de guerreiro"
              autoComplete="username"
              className="w-full px-4 py-3 bg-slate-700/50 border-2 border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 text-sm transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-slate-700/80 disabled:opacity-50 disabled:cursor-not-allowed hover:border-purple-500/60"
            />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
          </div>
        </div>

        {/* Email Field */}
        {!isLogin && (
          <div className="group">
            <label
              htmlFor="email"
              className="block font-bold text-purple-300 text-sm mb-2 uppercase tracking-wide"
            >
              📧 Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="seu.email@realm.com"
                autoComplete="email"
                className="w-full px-4 py-3 bg-slate-700/50 border-2 border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 text-sm transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-slate-700/80 disabled:opacity-50 disabled:cursor-not-allowed hover:border-purple-500/60"
              />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>
        )}

        {/* Password Field */}
        <div className="group">
          <label
            htmlFor="password"
            className="block font-bold text-purple-300 text-sm mb-2 uppercase tracking-wide"
          >
            🔐 Senha
          </label>
          <div className="relative">
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="Mínimo 6 caracteres"
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="w-full px-4 py-3 bg-slate-700/50 border-2 border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 text-sm transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-slate-700/80 disabled:opacity-50 disabled:cursor-not-allowed hover:border-purple-500/60"
            />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="group/submit w-full relative px-6 py-3 overflow-hidden rounded-lg transition-all duration-300 font-bold text-white uppercase tracking-wider"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover/submit:scale-110"></div>
            <div className="absolute inset-0 opacity-0 group-hover/submit:opacity-100 bg-white/10 transition-all duration-300"></div>
            <span className="relative flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  Carregando...
                </>
              ) : (
                <>⚔️ {buttonText}</>
              )}
            </span>
            <div className="absolute inset-0 rounded-lg border border-white/20 group-hover/submit:border-white/50 transition-all duration-300"></div>
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="group/cancel w-full relative px-6 py-3 overflow-hidden rounded-lg transition-all duration-300 font-bold text-white uppercase tracking-wider"
            >
              <div className="absolute inset-0 bg-slate-700/80 transition-all duration-300 group-hover/cancel:bg-slate-600"></div>
              <span className="relative flex items-center justify-center gap-2">
                ← Voltar
              </span>
              <div className="absolute inset-0 rounded-lg border border-purple-500/30 group-hover/cancel:border-purple-500/60 transition-all duration-300"></div>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

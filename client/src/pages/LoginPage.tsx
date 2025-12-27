import React, { useState } from "react";
import { useAuth } from "@/hooks/useGame";
import { AsyncButton } from "@/components/AsyncButton";
import { ErrorAlert, SuccessAlert } from "@/components/Alerts";

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

/**
 * Página de login exemplo usando o sistema de game brain
 */
export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, isLoading, error: authError } = useAuth();
  const [formData, setFormData] = useState({
    username: "testuser",
    password: "password123",
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLocalError(null);
  };

  const handleLogin = async () => {
    if (!formData.username || !formData.password) {
      setLocalError("Preencha todos os campos");
      return;
    }

    try {
      await login(formData.username, formData.password);
      setShowSuccess(true);
      setFormData({ username: "", password: "" });

      // Chama callback após 1 segundo
      setTimeout(() => {
        onLoginSuccess?.();
      }, 1000);
    } catch (error: any) {
      setLocalError(error.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Battle Realm</h1>
        <h2>Entrar no Jogo</h2>

        {showSuccess && (
          <SuccessAlert
            message="Login realizado com sucesso!"
            onDismiss={() => setShowSuccess(false)}
            autoDismiss={2000}
          />
        )}

        <ErrorAlert
          error={authError || localError}
          onDismiss={() => {
            setLocalError(null);
          }}
        />

        <form
          className="login-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <div className="form-group">
            <label htmlFor="username">Usuário</label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="Digite seu usuário"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="Digite sua senha"
            />
          </div>

          <AsyncButton
            onClick={handleLogin}
            loading={isLoading}
            className="login-button"
          >
            Entrar
          </AsyncButton>

          <p className="login-footer">
            Não tem conta? <a href="#register">Crie uma agora</a>
          </p>
        </form>
      </div>

      <style>{`
        .login-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .login-container {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 400px;
        }

        .login-container h1 {
          text-align: center;
          color: #667eea;
          margin: 0 0 10px 0;
          font-size: 32px;
        }

        .login-container h2 {
          text-align: center;
          color: #333;
          margin: 0 0 30px 0;
          font-size: 20px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .form-group input {
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          transition: border-color 0.3s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-group input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .login-button {
          margin-top: 10px;
        }

        .login-footer {
          text-align: center;
          color: #666;
          font-size: 14px;
          margin: 0;
        }

        .login-footer a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }

        .login-footer a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;

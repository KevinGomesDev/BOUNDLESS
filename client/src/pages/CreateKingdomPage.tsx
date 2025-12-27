import React, { useState } from "react";
import { useKingdom, useAuth } from "@/hooks/useGame";
import { AsyncButton } from "@/components/AsyncButton";
import { ErrorAlert, SuccessAlert } from "@/components/Alerts";

interface CreateKingdomPageProps {
  onSuccess?: () => void;
}

const RACES = [
  { value: "HUMAN", label: "Humanos" },
  { value: "ELF", label: "Elfos" },
  { value: "DWARF", label: "Anões" },
  { value: "ORC", label: "Orcs" },
  { value: "ELEMENTAL", label: "Elementais" },
  { value: "INSETO", label: "Insetos" },
];

const ALIGNMENTS = [
  { value: "LAWFUL", label: "Leal" },
  { value: "NEUTRAL", label: "Neutro" },
  { value: "CHAOTIC", label: "Caótico" },
];

/**
 * Página de criação de reino exemplo
 */
export const CreateKingdomPage: React.FC<CreateKingdomPageProps> = ({
  onSuccess,
}) => {
  const { user } = useAuth();
  const { createKingdom, isLoading, error } = useKingdom();

  const [formData, setFormData] = useState({
    name: "Meu Reino",
    capitalName: "Capital",
    race: "HUMAN",
    alignment: "LAWFUL",
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLocalError(null);
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.capitalName) {
      setLocalError("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createKingdom(formData);
      setShowSuccess(true);
      setFormData({
        name: "",
        capitalName: "",
        race: "HUMAN",
        alignment: "LAWFUL",
      });

      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      setLocalError(err.message);
    }
  };

  if (!user) {
    return (
      <div className="create-kingdom-page">
        <div className="kingdom-container">
          <ErrorAlert error="Você precisa estar logado para criar um reino" />
        </div>
      </div>
    );
  }

  return (
    <div className="create-kingdom-page">
      <div className="kingdom-container">
        <h1>Criar Novo Reino</h1>
        <p className="user-info">Bem-vindo, {user.username}!</p>

        {showSuccess && (
          <SuccessAlert
            message="Reino criado com sucesso!"
            onDismiss={() => setShowSuccess(false)}
            autoDismiss={2000}
          />
        )}

        <ErrorAlert
          error={error || localError}
          onDismiss={() => setLocalError(null)}
        />

        <form
          className="kingdom-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
        >
          <div className="form-section">
            <h2>Informações Básicas</h2>

            <div className="form-group">
              <label htmlFor="name">Nome do Reino *</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="Digite o nome do seu reino"
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label htmlFor="capitalName">Nome da Capital *</label>
              <input
                id="capitalName"
                type="text"
                name="capitalName"
                value={formData.capitalName}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="Digite o nome da capital"
                maxLength={50}
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Características</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="race">Raça *</label>
                <select
                  id="race"
                  name="race"
                  value={formData.race}
                  onChange={handleInputChange}
                  disabled={isLoading}
                >
                  {RACES.map((race) => (
                    <option key={race.value} value={race.value}>
                      {race.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="alignment">Alinhamento *</label>
                <select
                  id="alignment"
                  name="alignment"
                  value={formData.alignment}
                  onChange={handleInputChange}
                  disabled={isLoading}
                >
                  {ALIGNMENTS.map((alignment) => (
                    <option key={alignment.value} value={alignment.value}>
                      {alignment.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <AsyncButton
            onClick={handleCreate}
            loading={isLoading}
            className="create-button"
          >
            Criar Reino
          </AsyncButton>

          <p className="form-footer">* Campos obrigatórios</p>
        </form>
      </div>

      <style>{`
        .create-kingdom-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .kingdom-container {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 500px;
        }

        .kingdom-container h1 {
          color: #667eea;
          margin: 0 0 10px 0;
          font-size: 28px;
        }

        .user-info {
          color: #666;
          margin: 0 0 20px 0;
          font-size: 14px;
        }

        .kingdom-form {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .form-section h2 {
          color: #333;
          margin: 0;
          font-size: 16px;
          border-bottom: 2px solid #667eea;
          padding-bottom: 10px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .form-group label {
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .form-group input,
        .form-group select {
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.3s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-group input:disabled,
        .form-group select:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .create-button {
          margin-top: 10px;
        }

        .form-footer {
          text-align: center;
          color: #999;
          font-size: 12px;
          margin: 0;
        }

        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .kingdom-container {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateKingdomPage;

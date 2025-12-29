import React from "react";
import { RaceCard } from "./RaceCard";
import { AlignmentCard } from "./AlignmentCard";
import type { Race, Alignment } from "./types";

interface Step1KingdomProps {
  kingdomName: string;
  setKingdomName: (value: string) => void;
  capitalName: string;
  setCapitalName: (value: string) => void;
  selectedRace: string;
  setSelectedRace: (value: string) => void;
  selectedAlignment: string;
  setSelectedAlignment: (value: string) => void;
  races: Race[];
  alignments: Alignment[];
  error: string | null;
  isLoading: boolean;
  onNext: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const Step1Kingdom: React.FC<Step1KingdomProps> = ({
  kingdomName,
  setKingdomName,
  capitalName,
  setCapitalName,
  selectedRace,
  setSelectedRace,
  selectedAlignment,
  setSelectedAlignment,
  races,
  alignments,
  error,
  isLoading,
  onNext,
  onCancel,
}) => {
  const isFormValid =
    kingdomName && capitalName && selectedRace && selectedAlignment;

  return (
    <form onSubmit={onNext} className="space-y-6">
      {/* Kingdom Name */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm font-semibold text-white">
            Nome do Reino
          </label>
          {kingdomName === "Kingdom of Ashburn" && (
            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
              ★ Padrão
            </span>
          )}
        </div>
        <input
          type="text"
          value={kingdomName}
          onChange={(e) => setKingdomName(e.target.value)}
          placeholder="Ex: Reino de Ashburn"
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      {/* Capital Name */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm font-semibold text-white">
            Nome da Capital
          </label>
          {capitalName === "Ashburn Capital" && (
            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
              ★ Padrão
            </span>
          )}
        </div>
        <input
          type="text"
          value={capitalName}
          onChange={(e) => setCapitalName(e.target.value)}
          placeholder="Ex: Ashburn City"
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      {/* Race Selection */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <label className="block text-sm font-semibold text-white">
            Escolha sua Raça
          </label>
          {selectedRace === "HUMANOIDE" && (
            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
              ★ Pré-selecionado
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {races.map((race) => (
            <RaceCard
              key={race.id}
              race={race}
              isSelected={selectedRace === race.id}
              onSelect={() => setSelectedRace(race.id)}
            />
          ))}
        </div>
      </div>

      {/* Alignment Selection */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <label className="block text-sm font-semibold text-white">
            Escolha seu Alinhamento
          </label>
          {selectedAlignment === "CAOS" && (
            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
              ★ Pré-selecionado
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {alignments.map((alignment) => (
            <AlignmentCard
              key={alignment.id}
              alignment={alignment}
              isSelected={selectedAlignment === alignment.id}
              onSelect={() => setSelectedAlignment(alignment.id)}
            />
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Info about defaults */}
      <div className="bg-blue-900/20 border border-blue-700 rounded p-3">
        <p className="text-blue-400 text-sm">
          <span className="font-semibold">💡 Dica:</span> Os campos acima
          possuem valores padrão pré-preenchidos. Você pode personalizá-los ou
          continuar com as sugestões para criar rapidamente seu reino!
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              Criando...
            </>
          ) : (
            <>Próximo →</>
          )}
        </button>
      </div>
    </form>
  );
};

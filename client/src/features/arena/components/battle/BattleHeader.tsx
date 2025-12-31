import React from "react";
import { CircularProgress } from "../shared/CircularProgress";
import { TIMER_THRESHOLDS, UI_COLORS } from "../../constants";

interface BattleHeaderProps {
  round: number;
  turnTimer: number;
  maxTimer: number;
  isMyTurn: boolean;
  currentPlayerName: string;
  hostKingdomName: string;
  guestKingdomName: string;
  onSurrender?: () => void;
  className?: string;
}

/**
 * Componente de header da batalha
 * Exibe round, timer, e informações dos jogadores
 */
export const BattleHeader: React.FC<BattleHeaderProps> = ({
  round,
  turnTimer,
  maxTimer,
  isMyTurn,
  currentPlayerName,
  hostKingdomName,
  guestKingdomName,
  onSurrender,
  className = "",
}) => {
  const getTimerColor = () => {
    if (turnTimer <= TIMER_THRESHOLDS.critical) return UI_COLORS.timerCritical;
    if (turnTimer <= TIMER_THRESHOLDS.warning) return UI_COLORS.timerWarning;
    return UI_COLORS.timerNormal;
  };

  return (
    <div
      className={`flex items-center justify-between px-4 py-2 bg-gray-800 rounded-lg ${className}`}
    >
      {/* Host Kingdom */}
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: UI_COLORS.host }}
        />
        <span className="font-medium text-white">{hostKingdomName}</span>
      </div>

      {/* Center - Round, Timer, Turn Info */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-400">Round {round}</div>

        <CircularProgress
          value={turnTimer}
          max={maxTimer}
          size={48}
          strokeWidth={4}
          color={getTimerColor()}
        >
          <span
            className="text-sm font-bold"
            style={{ color: getTimerColor() }}
          >
            {turnTimer}
          </span>
        </CircularProgress>

        <div className="text-sm">
          <span
            className={isMyTurn ? "text-green-400 font-bold" : "text-gray-400"}
          >
            {isMyTurn ? "Seu turno!" : `Turno de ${currentPlayerName}`}
          </span>
        </div>
      </div>

      {/* Guest Kingdom */}
      <div className="flex items-center gap-2">
        <span className="font-medium text-white">{guestKingdomName}</span>
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: UI_COLORS.guest }}
        />
      </div>

      {/* Surrender Button */}
      {onSurrender && (
        <button
          onClick={onSurrender}
          className="ml-4 px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          title="Render-se"
        >
          🏳️
        </button>
      )}
    </div>
  );
};

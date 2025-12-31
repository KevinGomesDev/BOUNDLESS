import React from "react";
import { CircularProgress } from "../shared/CircularProgress";
import { MovementDots } from "../shared/MovementDots";
import { ActionSquares } from "../shared/ActionSquares";
import { ScarMarks } from "../shared/ScarMarks";
import { ConditionBadge } from "../shared/ConditionBadge";
import { AttributeTooltip } from "../shared/AttributeTooltip";
import { UI_COLORS, ACTIONS_INFO, UNIT_CATEGORIES } from "../../constants";
import type { ArenaUnit } from "../../types/arena.types";

interface UnitPanelProps {
  unit: ArenaUnit;
  isSelected?: boolean;
  isMyTurn?: boolean;
  maxMarks?: number;
  onActionClick?: (action: string) => void;
  availableActions?: string[];
  className?: string;
}

/**
 * Painel de unidade com stats, condições e ações
 */
export const UnitPanel: React.FC<UnitPanelProps> = ({
  unit,
  isSelected = false,
  isMyTurn = false,
  maxMarks = 3,
  onActionClick,
  availableActions = [],
  className = "",
}) => {
  const hpPercentage = unit.maxHp > 0 ? unit.currentHp / unit.maxHp : 0;
  const hpColor =
    hpPercentage > 0.6
      ? UI_COLORS.healthHigh
      : hpPercentage > 0.3
      ? UI_COLORS.healthMedium
      : hpPercentage > 0.1
      ? UI_COLORS.healthLow
      : UI_COLORS.healthCritical;

  const categoryInfo = UNIT_CATEGORIES[
    unit.category as keyof typeof UNIT_CATEGORIES
  ] || {
    name: unit.category,
    icon: "⚔️",
    color: "#64748b",
  };

  return (
    <div
      className={`p-3 rounded-lg border-2 transition-all ${
        isSelected
          ? "border-blue-500 bg-gray-800"
          : "border-gray-700 bg-gray-800/50"
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span title={categoryInfo.name} style={{ color: categoryInfo.color }}>
            {categoryInfo.icon}
          </span>
          <span className="font-medium text-white truncate max-w-[120px]">
            {unit.name}
          </span>
          {unit.level > 1 && (
            <span className="text-xs text-gray-400">Lv.{unit.level}</span>
          )}
        </div>
        {!unit.isAlive && (
          <span className="text-xs text-red-500 font-bold">MORTO</span>
        )}
      </div>

      {/* HP and Protection */}
      <div className="flex items-center gap-3 mb-2">
        <CircularProgress
          value={unit.currentHp}
          max={unit.maxHp}
          size={50}
          strokeWidth={5}
          color={hpColor}
        >
          <div className="text-center">
            <div className="text-xs font-bold text-white">{unit.currentHp}</div>
            <div className="text-[8px] text-gray-400">/{unit.maxHp}</div>
          </div>
        </CircularProgress>

        {unit.protection > 0 && (
          <div className="flex flex-col items-center">
            <div
              className="text-lg"
              style={{
                color: unit.protectionBroken
                  ? UI_COLORS.protectionBroken
                  : UI_COLORS.protection,
              }}
            >
              🛡️
            </div>
            <span
              className="text-xs font-bold"
              style={{
                color: unit.protectionBroken
                  ? UI_COLORS.protectionBroken
                  : UI_COLORS.protection,
              }}
            >
              {unit.protection}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-1 text-xs mb-2">
        <AttributeTooltip attribute="combat" value={unit.combat}>
          <div className="text-center">
            <div className="text-gray-400">⚔️</div>
            <div className="text-white font-medium">{unit.combat}</div>
          </div>
        </AttributeTooltip>
        <AttributeTooltip attribute="acuity" value={unit.acuity}>
          <div className="text-center">
            <div className="text-gray-400">👁️</div>
            <div className="text-white font-medium">{unit.acuity}</div>
          </div>
        </AttributeTooltip>
        <AttributeTooltip attribute="focus" value={unit.focus}>
          <div className="text-center">
            <div className="text-gray-400">🎯</div>
            <div className="text-white font-medium">{unit.focus}</div>
          </div>
        </AttributeTooltip>
        <AttributeTooltip attribute="armor" value={unit.armor}>
          <div className="text-center">
            <div className="text-gray-400">🛡️</div>
            <div className="text-white font-medium">{unit.armor}</div>
          </div>
        </AttributeTooltip>
        <AttributeTooltip attribute="vitality" value={unit.vitality}>
          <div className="text-center">
            <div className="text-gray-400">❤️</div>
            <div className="text-white font-medium">{unit.vitality}</div>
          </div>
        </AttributeTooltip>
      </div>

      {/* Movement and Actions */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Mov:</span>
          <MovementDots current={unit.movesLeft} max={3} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Ações:</span>
          <ActionSquares current={unit.actionsLeft} max={1} />
        </div>
      </div>

      {/* Action Marks */}
      {maxMarks > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-400">Marcas:</span>
          <ScarMarks marks={unit.actionMarks} maxMarks={maxMarks} />
        </div>
      )}

      {/* Conditions */}
      {unit.conditions && unit.conditions.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {unit.conditions.map((cond, idx) => (
            <ConditionBadge key={`${cond}-${idx}`} condition={cond} />
          ))}
        </div>
      )}

      {/* Actions */}
      {isSelected && isMyTurn && availableActions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-700">
          {availableActions.map((action) => {
            const info = ACTIONS_INFO[action] || {
              icon: "❓",
              name: action,
              color: "#6b7280",
            };
            return (
              <button
                key={action}
                onClick={() => onActionClick?.(action)}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors hover:opacity-80"
                style={{
                  backgroundColor: `${info.color}20`,
                  color: info.color,
                  border: `1px solid ${info.color}40`,
                }}
                title={info.description}
              >
                <span>{info.icon}</span>
                <span>{info.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

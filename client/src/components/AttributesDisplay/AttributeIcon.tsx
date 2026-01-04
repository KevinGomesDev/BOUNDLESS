import React, { useState, useRef } from "react";
import { ATTRIBUTE_NAMES } from "../../../../shared/config/global.config";
import { Tooltip } from "@/components/Tooltip";
import type { AttributeIconProps } from "./types";

export const AttributeIcon: React.FC<AttributeIconProps> = ({
  attributeKey,
  value,
  editable = false,
  isHovered = false,
  onHover,
  onIncrement,
  onDecrement,
  canIncrement = true,
  canDecrement = true,
}) => {
  const attr = ATTRIBUTE_NAMES[attributeKey];
  const iconRef = useRef<HTMLDivElement>(null);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      {/* Controles de edição */}
      {editable && (
        <div className="flex items-center gap-1 mb-1">
          <button
            onClick={onDecrement}
            disabled={!canDecrement}
            className="w-5 h-5 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs font-bold text-gray-300 transition-colors"
          >
            −
          </button>
          <button
            onClick={onIncrement}
            disabled={!canIncrement}
            className="w-5 h-5 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs font-bold text-gray-300 transition-colors"
          >
            +
          </button>
        </div>
      )}

      {/* Ícone com valor */}
      <div
        ref={iconRef}
        className={`relative w-8 h-8 transition-transform flex items-center justify-center ${
          isHovered ? "scale-110" : ""
        }`}
      >
        {/* Ícone de fundo */}
        {!imageError ? (
          <img
            src={`/icons/${attributeKey}.png`}
            alt={attr.name}
            className="w-full h-full object-contain absolute inset-0"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-600">
            <span className="text-[8px] font-bold text-gray-400">
              {attr.shortName}
            </span>
          </div>
        )}

        {/* Background escuro para o valor */}
        <div className="absolute w-5 h-5 rounded-full bg-gray-900/80 backdrop-blur-sm" />

        {/* Valor sobreposto */}
        <div className="relative z-10 text-white font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          {value}
        </div>
      </div>

      {/* Tooltip */}
      <Tooltip anchorRef={iconRef} visible={isHovered} preferredPosition="top">
        <p className="text-gray-100 font-bold text-xs mb-1">
          {!imageError ? (
            <img
              src={`/icons/${attributeKey}.png`}
              alt=""
              className="w-4 h-4 inline-block mr-1"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <span className="font-bold text-gray-400 mr-1">
              {attr.shortName}
            </span>
          )}
          {attr.name}
        </p>
        <p className="text-gray-300 text-[10px]">{attr.description}</p>
      </Tooltip>
    </div>
  );
};

import React, { useState } from "react";
import type { AttributeKey } from "../../../../shared/config/global.config";
import { AttributeIcon } from "./AttributeIcon";
import type { AttributesDisplayProps } from "./types";

export const AttributesDisplay: React.FC<AttributesDisplayProps> = ({
  attributes,
  editable = false,
  onChange,
  min = 0,
  max = 99,
}) => {
  const [hoveredAttribute, setHoveredAttribute] = useState<AttributeKey | null>(
    null
  );

  const handleChange = (key: AttributeKey, delta: number) => {
    if (!onChange) return;
    const newValue = attributes[key] + delta;
    if (newValue >= min && newValue <= max) {
      onChange(key, newValue);
    }
  };

  const renderAttribute = (key: AttributeKey) => (
    <AttributeIcon
      key={key}
      attributeKey={key}
      value={attributes[key]}
      editable={editable}
      isHovered={hoveredAttribute === key}
      onHover={(hovered) => setHoveredAttribute(hovered ? key : null)}
      onIncrement={() => handleChange(key, 1)}
      onDecrement={() => handleChange(key, -1)}
      canIncrement={attributes[key] < max}
      canDecrement={attributes[key] > min}
    />
  );

  return (
    <div className="flex items-center gap-6">
      {/* Coluna Esquerda: Combat + Speed */}
      <div className="flex gap-4">
        {renderAttribute("combat")}
        {renderAttribute("speed")}
      </div>

      {/* Centro: Vitality (destaque) */}
      <div className="px-3 py-2 bg-gray-800 border-2 border-red-500/50 rounded-lg">
        {renderAttribute("vitality")}
      </div>

      {/* Coluna Direita: Focus + Armor */}
      <div className="flex gap-4">
        {renderAttribute("focus")}
        {renderAttribute("armor")}
      </div>
    </div>
  );
};

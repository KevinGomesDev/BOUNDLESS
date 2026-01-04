import type { AttributeKey } from "../../../../shared/config/global.config";

export interface AttributesDisplayProps {
  attributes: {
    combat: number;
    speed: number;
    focus: number;
    armor: number;
    vitality: number;
  };
  editable?: boolean;
  onChange?: (key: AttributeKey, value: number) => void;
  min?: number;
  max?: number;
}

export interface AttributeIconProps {
  attributeKey: AttributeKey;
  value: number;
  editable?: boolean;
  isHovered?: boolean;
  onHover?: (hovered: boolean) => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  canIncrement?: boolean;
  canDecrement?: boolean;
}

// src/components/DivisionTip.tsx
import React from "react";
import Checkbox from "./ui/CheckBox";

export interface DivisionTipProps {
  tipEnabled: boolean;
  tipPercent: number;
  disabled: boolean;
  tipAmount: number;
  subtotal: number;
  onToggleTip: () => void;
  onChangeTipPercent: (newPct: number) => void;
}

const tipStyles = {
  container: { marginTop: 12, color: "#333" } as React.CSSProperties,
  row: {
    display: "flex",
    alignItems: "center",
    marginBottom: 8,
  } as React.CSSProperties,
  label: { marginRight: 8 } as React.CSSProperties,
  input: {
    width: 60,
    padding: 4,
    border: "1px solid #ccc",
    borderRadius: 4,
  } as React.CSSProperties,
  hr: {
    border: "none",
    borderTop: "1px solid #ddd",
    margin: "8px 0",
  } as React.CSSProperties,
  line: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 4,
  } as React.CSSProperties,
  totalLine: {
    display: "flex",
    justifyContent: "space-between",
    fontWeight: 600,
  } as React.CSSProperties,
};

export const PropinaSection: React.FC<DivisionTipProps> = ({
  tipEnabled,
  tipPercent,
  tipAmount,
  disabled = false,
  onToggleTip,
  onChangeTipPercent,
}) => {
  return (
    <div style={tipStyles.container}>
      <div style={tipStyles.row}>
        <Checkbox
          label="Dejar propina"
          checked={tipEnabled}
          disabled={disabled}
          onChange={onToggleTip}
        />
      </div>

      {tipEnabled && (
        <>
          <div style={tipStyles.row}>
            <label style={tipStyles.label}>Porcentaje de propina:</label>
            <input
              disabled={disabled}
              type="number"
              min={0}
              max={100}
              value={tipPercent}
              onChange={(e) => onChangeTipPercent(Number(e.target.value))}
              style={tipStyles.input}
            />
            <span style={{ marginLeft: 4 }}>%</span>
          </div>

          <hr style={tipStyles.hr} />

          <div style={tipStyles.line}>
            <span>Propina ({tipPercent}%):</span>
            <span>${(tipAmount ?? 0).toFixed(2)}</span>
          </div>
        </>
      )}
    </div>
  );
};

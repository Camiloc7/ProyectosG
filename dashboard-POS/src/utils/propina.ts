// src/utils/tip.ts
export interface TipResult {
  tipAmount: number
  totalWithTip: number
}

export function calculateTip(subtotal: number, tipPercent: number, tipEnabled: boolean): TipResult {
  const tipAmount = tipEnabled ? (subtotal * tipPercent) / 100 : 0
  const totalWithTip = subtotal + tipAmount
  return { tipAmount, totalWithTip }
}

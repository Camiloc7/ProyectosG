// src/features/pagar/DivisionCard.tsx
import React from 'react'
import { DivisionCommonInfo } from '../../components/DivisionCommonInfo'
import Checkbox from '../../components/CheckBox'
import { buttonStyle, DivisionMode } from '../../views/DivisionCuentas'
import { PropinaSection } from '../../components/PropinaSection'
import { IItemsPedidos } from '../../store/pedidosStore'
import { calculateTip } from '../../utils/propina'
import { formatearNumero } from '../../helpers/betterNumberFormat'

export type Division = {
  id: string
  name: string
  pagada: boolean
  docType?: string
  cedula?: string
  correo?: string
  electronica?: boolean
  items: IItemsPedidos[]
  mode: DivisionMode
  customAmount?: number
  direccion?: string
  telefono?: string
  tipEnabled: boolean
  tipPercent?: number
}

export type DivisionErrors = { name: boolean; docType: boolean; cedula: boolean; correo: boolean }

const styles = {
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: 20
  } as React.CSSProperties,
  division: {
    position: 'relative',
    flex: '1 1 calc(33% - 16px)',
    minWidth: 280,
    display: 'flex',
    flexDirection: 'column'
  } as React.CSSProperties,
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 4,
    marginBottom: 8
  } as React.CSSProperties,
  qtyInput: {
    width: 60,
    marginLeft: 12,
    padding: 4,
    border: '1px solid #ccc',
    borderRadius: 4
  } as React.CSSProperties
}

interface DivisionCardProps {
  mode: DivisionMode
  division: Division
  descuento: number
  ok: boolean
  bloqueado: boolean
  errors?: DivisionErrors
  allItems: IItemsPedidos[]
  onUpdate: (d: Division) => void
  onDelete: () => void
  onPagar: (id: string, electronica: boolean) => void
}

export const DivisionCard: React.FC<DivisionCardProps> = ({
  mode,
  division,
  errors = { name: false, docType: false, cedula: false, correo: false },
  allItems,
  descuento,
  onUpdate,
  onDelete,
  onPagar,
  bloqueado = false,
  ok
}) => {
  const toggleItem = (item: IItemsPedidos) => {
    const exists = division.items.some((it) => it.id === item.id)
    const newItems = exists
      ? division.items.filter((it) => it.id !== item.id)
      : [
          ...division.items,
          {
            id: item.id,
            nombre: item.nombre,
            cantidad: 1,
            precio: item.precio,
            notas: item.notas
          }
        ]

    onUpdate({ ...division, items: newItems })
  }

  const subtotal = division.items.reduce((sum, it) => sum + it.cantidad * it.precio, 0)

  const changeQuantity = (id: string, qty: number) => {
    const newItems = division.items.map((it) =>
      it.id === id ? { ...it, cantidad: Math.max(1, qty) } : it
    )
    onUpdate({ ...division, items: newItems })
  }

  const itemsSubtotal = division.items.reduce((sum, it) => sum + it.cantidad * it.precio, 0)

  const baseAmount = mode === 'MONEY' ? (division.customAmount ?? 0) : itemsSubtotal

  const baseConDescuento = baseAmount * (1 - descuento / 100)

  const { totalWithTip, tipAmount } = calculateTip(
    baseConDescuento,
    division.tipPercent ?? 0,
    division.tipEnabled ?? false
  )
  const montoInvalido = baseAmount <= 0

  const cardStyle = {
    ...styles.card,
    ...styles.division,
    border: montoInvalido ? '2px solid #E53E3E' : division.pagada ? '2px solid #38A169' : 'none', // verde si está pagada
    backgroundColor: montoInvalido
      ? '#FFF5F5'
      : division.pagada
        ? '#F0FFF4' // fondo verde clarito si pagada
        : '#fff',
    opacity: division.pagada ? 0.6 : 1 // opcional: para mostrarla "deshabilitada"
  }

  return (
    <div style={cardStyle}>
      {!bloqueado && (
        <button onClick={onDelete} style={{ position: 'absolute', top: 20, right: 20 }}>
          ✕
        </button>
      )}
      <div style={{ marginTop: 15 }}>
        <DivisionCommonInfo
          division={division}
          errors={errors}
          onUpdate={(upd) => onUpdate({ ...division, ...upd })}
          disabled={bloqueado}
        />
      </div>

      {mode === 'PRODUCTS' && (
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12, marginTop: 15 }}>
          {allItems
            .filter((it) => it.cantidad > 0)
            .map((it) => {
              const selected = division.items.find((x) => x.id === it.id)
              return (
                <div key={it.id} style={styles.itemRow}>
                  <Checkbox
                    label={it.nombre}
                    checked={!!selected}
                    disabled={bloqueado}
                    onChange={() => toggleItem(it)}
                  />
                  {selected && (
                    <input
                      type="number"
                      min={1}
                      disabled={bloqueado}
                      value={selected.cantidad}
                      onChange={(e) => changeQuantity(it.id, Number(e.target.value))}
                      style={styles.qtyInput}
                    />
                  )}
                  <span style={{ marginLeft: 12, fontWeight: 600 }}>
                    ${formatearNumero((selected ? selected.cantidad : 1) * it.precio)}
                  </span>
                </div>
              )
            })}
        </div>
      )}

      {/* Subtotal */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid #eee',
          paddingTop: 12
        }}
      >
        <span style={{ fontWeight: 500 }}>Subtotal:</span>
        {mode === 'PRODUCTS' && (
          <span style={{ fontWeight: 600 }}>${formatearNumero(subtotal)}</span>
        )}
      </div>

      {mode === 'MONEY' && (
        <input
          type="number"
          disabled={bloqueado}
          placeholder="Monto manual"
          style={{ marginTop: 12, padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          value={division.customAmount ?? ''}
          onChange={(e) => onUpdate({ ...division, customAmount: Number(e.target.value) })}
        />
      )}

      <PropinaSection
        tipEnabled={division.tipEnabled ?? true}
        tipPercent={division.tipPercent ?? 10}
        subtotal={baseAmount}
        disabled={bloqueado}
        tipAmount={tipAmount ?? 0}
        onToggleTip={() => onUpdate({ ...division, tipEnabled: !(division.tipEnabled ?? false) })}
        onChangeTipPercent={(newPct) => onUpdate({ ...division, tipPercent: newPct })}
      />

      <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
        <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>
          Total con descuentos aplicados
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 600
          }}
        >
          <span>Total a pagar:</span>
          <span>${formatearNumero(totalWithTip)}</span>
        </div>
      </div>
      {montoInvalido && (
        <div
          style={{
            backgroundColor: '#FED7D7',
            color: '#C53030',
            padding: '8px 12px',
            borderRadius: 6,
            marginTop: 12,
            fontSize: 12
          }}
        >
          ⚠ Esta división no tiene un monto válido asignado.
        </div>
      )}

      {ok && (
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            justifyContent: 'space-between', // los separa a los extremos
            gap: 8 // espacio opcional si quieres mantener separación mínima
          }}
        >
          <button
            onClick={() => onPagar(division.id, false)}
            style={buttonStyle}
            disabled={division.pagada}
          >
            Efectivo
          </button>
          <button
            onClick={() => onPagar(division.id, true)}
            style={buttonStyle}
            disabled={division.pagada}
          >
            Electrónico/Mixto
          </button>
        </div>
      )}
    </div>
  )
}

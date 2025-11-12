import { IItemsPedidos } from "@/types/models"

export function formatearNumero(valor: number | string): string {
  const numero = Number(valor)
  if (isNaN(numero)) return '0.00'

  return numero.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function ListaItems({ items = [] }: { items?: IItemsPedidos[] }) {
  const subtotal = items.reduce((sum, it) => sum + it.cantidad * it.precio, 0)

  return (
    <div
      style={{
        backgroundColor: '#ffffffff',
        borderRadius: 8,
        padding: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: 20,
        color: '#000000ff'
      }}
    >
      <h2 style={{ marginBottom: 12, fontSize: 20, fontWeight: 600 }}>Resumen del Pedido</h2>
      {items.map((it) => (
        <div
          key={it.id}
          style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}
        >
          <div>
            <p style={{ margin: 0, fontWeight: 500 }}>
              {it.nombre} ×{it.cantidad}
            </p>
            {it.notas && <p style={{ margin: 0, fontSize: 12, color: '#000000ff' }}>{it.notas}</p>}
          </div>
          <p style={{ margin: 0, fontWeight: 600 }}>${(it.cantidad * it.precio).toFixed(2)}</p>
        </div>
      ))}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: '1px solid #eee',
          paddingTop: 12,
          marginTop: 12,
          fontWeight: 700
        }}
      >
        <span>Total:</span>
        <span>${formatearNumero(subtotal)}</span>
      </div>
    </div>
  )
}




// import { IItemsPedidos } from '@/stores/pedidosStore'

// export function formatearNumero(valor: number | string): string {
//   const numero = Number(valor)
//   if (isNaN(numero)) return '0.00'

//   return numero.toLocaleString('en-US', {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2
//   })
// }


// export function ListaItems({ items = [] }: { items?: IItemsPedidos[] }) {
//   const subtotal = items.reduce((sum, it) => sum + it.cantidad * it.precio, 0)

//   return (
//     <div
//       style={{
//         backgroundColor: '#fff',
//         borderRadius: 8,
//         padding: 20,
//         boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//         marginBottom: 20
//       }}
//     >
//       <h2 style={{ marginBottom: 12, fontSize: 20, fontWeight: 600 }}>Resumen del Pedido</h2>
//       {items.map((it) => (
//         <div
//           key={it.id}
//           style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}
//         >
//           <div>
//             <p style={{ margin: 0, fontWeight: 500 }}>
//               {it.nombre} ×{it.cantidad}
//             </p>
// {it.notas && <p style={{ margin: 0, fontSize: 12, color: '#000' }}>{it.notas}</p>}
//           </div>
//           <p style={{ margin: 0, fontWeight: 600 }}>${(it.cantidad * it.precio).toFixed(2)}</p>
//         </div>
//       ))}
//       <div
//         style={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           borderTop: '1px solid #eee',
//           paddingTop: 12,
//           marginTop: 12,
//           fontWeight: 700
//         }}
//       >
//         <span>Total:</span>
//         <span>${formatearNumero(subtotal)}</span>
//       </div>
//     </div>
//   )
// }
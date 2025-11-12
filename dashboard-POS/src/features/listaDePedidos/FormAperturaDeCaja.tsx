"use client";
import DenominacionInputs from "@/components/DenominacionInputs";
import BotonRestaurante from "@/components/ui/Boton";
import { DenominacionData } from "@/stores/cierreDeCajaStore";
import { ArrowLeft } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (denominaciones: DenominacionData) => void | Promise<void>; // El tipo de dato a guardar ahora es un objeto
}

const FormAperturaDeCaja: React.FC<ModalFormProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  // El estado ahora es un objeto para almacenar las denominaciones
  const [denominaciones, setDenominaciones] = useState<DenominacionData>({});
  const [totalApertura, setTotalApertura] = useState<number>(0);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Valida que el total de las denominaciones no sea 0
    if (Object.keys(denominaciones).length === 0 || totalApertura === 0) {
      toast.error("Debe ingresar al menos una denominación.");
      return;
    }

    onSave(denominaciones);
    handleVolverAtras();
  };

  const handleVolverAtras = () => {
    // Se resetea el estado a su valor inicial
    setDenominaciones({});
    setTotalApertura(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 201,
      }}
      onClick={() => onClose()}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: 24,
          borderRadius: 20,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: 1100,
          maxHeight: "90vh",
          overflowY: "auto",
          boxSizing: "border-box",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <button onClick={handleVolverAtras}>
            <ArrowLeft size={24} color="#4B5563" />
          </button>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#374151",
            }}
          >
            Apertura de caja
          </h2>
          <div style={{ width: 24 }} />
        </header>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <DenominacionInputs
              denominaciones={denominaciones}
              setDenominaciones={setDenominaciones}
              setTotal={setTotalApertura}
            />
            <p style={{ marginTop: "16px", fontWeight: "bold" }}>
              Total inicial: ${totalApertura.toLocaleString("es-CO")}
            </p>
          </div>

          <footer
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 24,
            }}
          >
            <BotonRestaurante
              label="Cancelar"
              variacion="claro"
              onClick={handleVolverAtras}
            />
            <BotonRestaurante type="submit" label="Aceptar" />
          </footer>
        </form>
      </div>
    </div>
  );
};

export default FormAperturaDeCaja;

// 'use client'
// import BotonRestaurante from '@/components/ui/Boton'
// import InputField from '../../components/ui/InputField'
// import { ArrowLeft } from 'lucide-react'
// import React, { useState, useEffect } from 'react'
// import { toast } from 'sonner'

// interface ModalFormProps {
//   isOpen: boolean
//   onClose: () => void
//   onSave: (saldoInicial: number) => void | Promise<void>
// }

// interface Errors {
//   saldo: boolean
// }

// const FormAperturaDeCaja: React.FC<ModalFormProps> = ({ isOpen, onClose, onSave }) => {
//   const [saldoInicial, setSaldoInicial] = useState<number>(0)
//   const [errors, setErrors] = useState<Errors>({
//     saldo: false
//   })

//   useEffect(() => {
//     document.body.style.overflow = isOpen ? 'hidden' : 'auto'
//     return () => {
//       document.body.style.overflow = 'auto'
//     }
//   }, [isOpen])

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     if (saldoInicial <= 0) {
//       toast.error('Error en Saldo inicial')
//     }
//     onSave(saldoInicial)
//     handleVolverAtras()
//   }

//   const handleVolverAtras = () => {
//     setSaldoInicial(0)
//     setErrors({
//       saldo: false
//     })
//     onClose()
//   }

//   if (!isOpen) return null

//   return (
//     <div
//       style={{
//         position: 'fixed',
//         inset: 0,
//         backdropFilter: 'blur(8px)',
//         backgroundColor: 'rgba(255, 255, 255, 0.3)',
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//         zIndex: 201
//       }}
//       onClick={handleVolverAtras}
//     >
//       <div
//         style={{
//           backgroundColor: '#ffffff',
//           padding: 24,
//           borderRadius: 20,
//           boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
//           width: '100%',
//           maxWidth: 480,
//           maxHeight: '90vh',
//           overflowY: 'auto',
//           boxSizing: 'border-box'
//         }}
//         onClick={(e) => e.stopPropagation()}
//       >
//         <header
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'space-between',
//             marginBottom: 24
//           }}
//         >
//           <button onClick={handleVolverAtras}>
//             <ArrowLeft size={24} color="#4B5563" />
//           </button>
//           <h2
//             style={{
//               fontSize: 20,
//               fontWeight: 600,
//               color: '#374151'
//             }}
//           >
//             Apertura de caja
//           </h2>
//           <div style={{ width: 24 }} />
//         </header>

//         <form onSubmit={handleSubmit}>
//           <div style={{ marginBottom: 24 }}>
//             <InputField
//               label="Saldo inicio de caja"
//               name="saldo"
//               type="number"
//               value={saldoInicial}
//               onChange={(e) => setSaldoInicial(Number(e.target.value))}
//               error={errors.saldo}
//             />
//           </div>

//           <footer
//             style={{
//               display: 'flex',
//               justifyContent: 'flex-end',
//               gap: 12,
//               marginTop: 24
//             }}
//           >
//             <BotonRestaurante label="Cancelar" variacion="claro" onClick={handleVolverAtras} />
//             <BotonRestaurante type="submit" label="Aceptar" />
//           </footer>
//         </form>
//       </div>
//     </div>
//   )
// }

// export default FormAperturaDeCaja

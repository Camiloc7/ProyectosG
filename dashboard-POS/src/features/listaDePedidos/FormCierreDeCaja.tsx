// src/features/listaDePedidos/FormCierreDeCaja.tsx
"use client";
import BotonRestaurante from "@/components/ui/Boton";
import InputField from "../../components/ui/InputField";
import { ArrowLeft } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { DenominacionData } from "@/stores/cierreDeCajaStore";
import DenominacionInputs from "@/components/DenominacionInputs";

export type IFormCierreCaja = {
  denominaciones_cierre: DenominacionData;
  observaciones: string;
};

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: IFormCierreCaja) => void | Promise<void>;
}

const FormCierreCaja: React.FC<ModalFormProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<IFormCierreCaja>({
    denominaciones_cierre: {},
    observaciones: "",
  });
  const [totalCierre, setTotalCierre] = useState<number>(0);
  const [errorSaldo, setErrorSaldo] = useState<boolean>(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      Object.keys(formData.denominaciones_cierre).length === 0 ||
      totalCierre === 0
    ) {
      toast.error("Debe ingresar al menos una denominación.");
      setErrorSaldo(true);
      return;
    }
    onSave(formData);
    handleVolverAtras();
  };

  const handleVolverAtras = () => {
    setFormData({
      denominaciones_cierre: {},
      observaciones: "",
    });
    setTotalCierre(0);
    setErrorSaldo(false);
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
            Cierre de caja
          </h2>
          <div style={{ width: 24 }} />
        </header>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            {/* Se reemplaza InputField por el nuevo componente de denominaciones */}
            <DenominacionInputs
              denominaciones={formData.denominaciones_cierre}
              setDenominaciones={(newDenominaciones) =>
                setFormData({
                  ...formData,
                  denominaciones_cierre: newDenominaciones,
                })
              }
              setTotal={setTotalCierre}
            />
            <p style={{ marginTop: "16px", fontWeight: "bold" }}>
              Total final: ${totalCierre.toLocaleString("es-CO")}
            </p>
            {errorSaldo && (
              <p style={{ color: "red", fontSize: "12px" }}>
                El saldo final no puede ser cero.
              </p>
            )}
            <InputField
              label="Observaciones"
              name="observaciones"
              placeholder="Ingrese las observaciones"
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
            />
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

export default FormCierreCaja;

// 'use client'
// import BotonRestaurante from '@/components/ui/Boton'
// import InputField from '../../components/ui/InputField'
// import { ArrowLeft } from 'lucide-react'
// import React, { useState, useEffect } from 'react'
// import { toast } from 'sonner'

// export type IFormCierreCaja = {
//   saldoFinal: number
//   observaciones: string
// }

// interface ModalFormProps {
//   isOpen: boolean
//   onClose: () => void
//   onSave: (data: IFormCierreCaja) => void | Promise<void>
// }

// interface Errors {
//   saldoFinal: boolean
// }

// const FormCierreCaja: React.FC<ModalFormProps> = ({ isOpen, onClose, onSave }) => {
//   const [formData, setFormData] = useState<IFormCierreCaja>({
//     saldoFinal: 0,
//     observaciones: ''
//   })
//   const [errors, setErrors] = useState<Errors>({
//     saldoFinal: false
//   })

//   useEffect(() => {
//     document.body.style.overflow = isOpen ? 'hidden' : 'auto'
//     return () => {
//       document.body.style.overflow = 'auto'
//     }
//   }, [isOpen])

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     const newErrors: Errors = {
//       saldoFinal: formData.saldoFinal === 0
//     }
//     setErrors(newErrors)
//     if (Object.values(newErrors).some(Boolean)) {
//       toast.error('Por favor completa el campo.')
//       return
//     }

//     onSave(formData)
//     handleVolverAtras() //Reseteamos el form
//   }

//   const handleVolverAtras = () => {
//     setFormData({
//       observaciones: '',
//       saldoFinal: 0
//     })
//     setErrors({
//       saldoFinal: false
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
//             Cierre de caja
//           </h2>
//           <div style={{ width: 24 }} />
//         </header>

//         <form onSubmit={handleSubmit}>
//           <div style={{ marginBottom: 24 }}>
//             <InputField
//               label="Saldo final contado"
//               name="saldoFinal"
//               type="number"
//               value={formData.saldoFinal}
//               onChange={(e) => setFormData({ ...formData, saldoFinal: Number(e.target.value) })}
//               error={errors.saldoFinal}
//             />
//             <InputField
//               label="Observaciones"
//               name="observaciones"
//               placeholder="Ingrese las observaciones"
//               value={formData.observaciones}
//               onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
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

// export default FormCierreCaja

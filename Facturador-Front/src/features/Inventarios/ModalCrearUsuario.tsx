'use client';
import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useUserStore } from '@/store/Inventario/useInvoicesUserStore';

interface ModalCrearUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: (userId: number, userEmail: string) => void;
}
export default function ModalCrearUsuario({ isOpen, onClose, onUserCreated }: ModalCrearUsuarioProps) {
  const createUser = useUserStore((state) => state.createUser);
  const userCreationErrorFromStore = useUserStore((state) => state.error);
  const isLoadingUserCreation = useUserStore((state) => state.isLoading);
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCorreo('');
      setPassword('');
      setLocalError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (userCreationErrorFromStore) {
      setLocalError(userCreationErrorFromStore);
    }
  }, [userCreationErrorFromStore]);

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text/plain');
    const cleanedText = text.replace(/\s/g, '');
    setPassword(cleanedText);
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const trimmedPassword = password.trim();

    if (!correo.trim()) {
      setLocalError('El correo electrónico es obligatorio.');
      setIsSubmitting(false);
      return;
    }
    if (!trimmedPassword) {
      setLocalError('La contraseña es obligatoria.');
      setIsSubmitting(false);
      return;
    }
    if (trimmedPassword.length !== 16) {
      setLocalError(
        'La contraseña debe ser de 16 caracteres, sin espacios. ' +
        'Genera una contraseña de aplicación en: https://myaccount.google.com/apppasswords.'
      );
      setIsSubmitting(false);
      return;
    }
    if (trimmedPassword.includes(' ')) {
      setLocalError('La contraseña no debe contener espacios.');
      setIsSubmitting(false);
      return;
    }

    try {
      const newUser = await createUser({ correo, password: trimmedPassword });

      if (newUser) {
        setSuccessMessage('Usuario creado con éxito. La automatización de correos comenzará pronto.');
        onUserCreated?.(newUser.id, newUser.correo);
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (err: any) {
      setLocalError(err.message || 'Error inesperado al crear el usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black">
          <X size={20} />
        </button>
        <h2 className="text-xl font-semibold text-gray-800 mb-6 font-inter">Crear Nuevo Usuario</h2>
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-1 font-inter">Correo Electrónico</label>
            <input
              type="email"
              id="correo"
              placeholder="Ej. usuario@ejemplo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="input w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00A7E1] font-inter"
              required
            />
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 font-inter">Contraseña</label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder="Contraseña de 16 caracteres (App Passwords)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onPaste={handlePaste}
              className="input w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00A7E1] font-inter pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 top-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 h-full"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            <p className="text-xs text-gray-500 mt-1 font-inter">
              Debe ser una contraseña de 16 caracteres sin espacios. Genérala en: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-[#00A7E1] hover:underline">Google App Passwords</a>.
            </p>
          </div>
          {successMessage && (
            <p className="text-green-600 text-sm mt-2 font-inter">{successMessage}</p>
          )}
          {(localError || userCreationErrorFromStore) && (
            <p className="text-red-500 text-sm mt-2 font-inter">{localError || userCreationErrorFromStore}</p>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-3xl hover:bg-gray-600 transition-colors duration-200 font-inter"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-[#00A7E1] text-white px-4 py-2 rounded-3xl hover:bg-[#008ec1] transition-colors duration-200 font-inter"
              disabled={isSubmitting || isLoadingUserCreation}
            >
              {(isSubmitting || isLoadingUserCreation) ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 'use client';
// import React, { useState, useEffect } from 'react';
// import { X } from 'lucide-react';
// import { useUserStore } from '@/store/Inventario/useInvoicesUserStore';

// interface ModalCrearUsuarioProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onUserCreated?: (userId: number, userEmail: string) => void;
// }
// export default function ModalCrearUsuario({ isOpen, onClose, onUserCreated }: ModalCrearUsuarioProps) {
//   const createUser = useUserStore((state) => state.createUser);
//   const userCreationErrorFromStore = useUserStore((state) => state.error); 
//   const isLoadingUserCreation = useUserStore((state) => state.isLoading); 
//   const [correo, setCorreo] = useState('');
//   const [password, setPassword] = useState('');
//   const [localError, setLocalError] = useState<string | null>(null); 
//   const [successMessage, setSuccessMessage] = useState<string | null>(null); 
//   const [isSubmitting, setIsSubmitting] = useState(false); 

//   useEffect(() => {
//     if (!isOpen) {
//       setCorreo('');
//       setPassword('');
//       setLocalError(null);
//       setSuccessMessage(null); 
//     }
//   }, [isOpen]);

//   useEffect(() => {
//     if (userCreationErrorFromStore) {
//       setLocalError(userCreationErrorFromStore);
//     }
//   }, [userCreationErrorFromStore]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLocalError(null); 
//     setSuccessMessage(null); 
//     setIsSubmitting(true); 

//     if (!correo.trim()) {
//       setLocalError('El correo electrónico es obligatorio.');
//       setIsSubmitting(false);
//       return;
//     }
//     if (!password.trim()) {
//       setLocalError('La contraseña es obligatoria.');
//       setIsSubmitting(false);
//       return;
//     }
//     if (password.trim().length !== 16) { 
//       setLocalError(
//         'La contraseña debe ser de 16 caracteres, sin espacios. ' +
//         'Genera una contraseña de aplicación en: https://myaccount.google.com/apppasswords.'
//       );
//       setIsSubmitting(false);
//       return;
//     }
//     if (password.includes(' ')) {
//         setLocalError('La contraseña no debe contener espacios.');
//         setIsSubmitting(false);
//         return;
//     }

//     try {
//       const newUser = await createUser({ correo, password });

//       if (newUser) {
//         setSuccessMessage('Usuario creado con éxito. La automatización de correos comenzará pronto.');
//         onUserCreated?.(newUser.id, newUser.correo); 
//         setTimeout(() => {
//             onClose(); 
//         }, 3000); 
//       } else {
//       }
//     } catch (err: any) {
//       setLocalError(err.message || 'Error inesperado al crear el usuario.');
//     } finally {
//       setIsSubmitting(false); 
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//       <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 relative">
//         <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black">
//           <X size={20} />
//         </button>
//         <h2 className="text-xl font-semibold text-gray-800 mb-6 font-inter">Crear Nuevo Usuario</h2>
//         <form onSubmit={handleSubmit} className="space-y-4 text-sm">
//           <div>
//             <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-1 font-inter">Correo Electrónico</label>
//             <input
//               type="email"
//               id="correo"
//               placeholder="Ej. usuario@ejemplo.com"
//               value={correo}
//               onChange={(e) => setCorreo(e.target.value)}
//               className="input w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00A7E1] font-inter"
//               required
//             />
//           </div>
//           <div>
//             <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 font-inter">Contraseña</label>
//             <input
//               type="password"
//               id="password"
//               placeholder="Contraseña de 16 caracteres (App Passwords)" 
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="input w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00A7E1] font-inter"
//               required
//             />
//              <p className="text-xs text-gray-500 mt-1 font-inter">
//                 Debe ser una contraseña de 16 caracteres sin espacios. Genérala en: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-[#00A7E1] hover:underline">Google App Passwords</a>.
//             </p>
//           </div>
//           {successMessage && (
//             <p className="text-green-600 text-sm mt-2 font-inter">{successMessage}</p>
//           )}
//           {(localError || userCreationErrorFromStore) && (
//             <p className="text-red-500 text-sm mt-2 font-inter">{localError || userCreationErrorFromStore}</p>
//           )}

//           <div className="flex justify-end gap-4 pt-4">
//             <button
//               type="button"
//               onClick={onClose}
//               className="bg-gray-500 text-white px-4 py-2 rounded-3xl hover:bg-gray-600 transition-colors duration-200 font-inter"
//               disabled={isSubmitting}
//             >
//               Cancelar
//             </button>
//             <button
//               type="submit"
//               className="bg-[#00A7E1] text-white px-4 py-2 rounded-3xl hover:bg-[#008ec1] transition-colors duration-200 font-inter"
//               disabled={isSubmitting || isLoadingUserCreation} 
//             >
//               {(isSubmitting || isLoadingUserCreation) ? 'Creando...' : 'Crear Usuario'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
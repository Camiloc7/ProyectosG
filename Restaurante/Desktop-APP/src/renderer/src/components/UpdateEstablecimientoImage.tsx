// "use client";
// import React, { useState, useEffect, ChangeEvent } from "react";
// import { ArrowLeft, Upload, Image as ImageIcon, X } from "lucide-react";

// interface ModalFormProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// const UpdateEstablecimientoImage: React.FC<ModalFormProps> = ({
//   isOpen,
//   onClose,
// }) => {
//   const { subirImagen } = useSubidaDeImagenes();
//   const { establecimientoActual, actualizarEstablecimiento } =
//     useEstablecimientosStore();
//   const urlImagen = establecimientoActual?.logo_url;
//   const [loading, setLoading] = useState<boolean>(false);
//   const [preview, setPreview] = useState<string | null>(urlImagen || null);
//   const [file, setFile] = useState<File | null>(null);

//   useEffect(() => {
//     document.body.style.overflow = isOpen ? "hidden" : "auto";
//     return () => {
//       document.body.style.overflow = "auto";
//     };
//   }, [isOpen]);

//   const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
//     const selectedFile = e.target.files?.[0];
//     if (selectedFile) {
//       if (!selectedFile.type.startsWith("image/")) {
//         toast.error("Por favor selecciona una imagen válida.");
//         return;
//       }
//       setFile(selectedFile);
//       setPreview(URL.createObjectURL(selectedFile));
//     }
//   };

//   const handleRemoveImage = () => {
//     setFile(null);
//     setPreview(null);
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       if (!file) {
//         toast.error("Debes seleccionar una imagen.");
//         return;
//       }
//       const url = await subirImagen(file);
//       if (!url) {
//         toast.error("Error al subir la imagen.");
//         return;
//       }
//       if (!establecimientoActual) {
//         toast.error("No hay establecimiento");
//         return;
//       }
//       const response = await actualizarEstablecimiento(
//         establecimientoActual?.id,
//         { logo_url: url }
//       );
//       if (!response) return;

//       handleCancel();
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     onClose();
//     setFile(null);
//     setPreview(urlImagen || null);
//   };

//   if (!isOpen) return null;

//   return (
//     <div
//       className="fixed inset-0 backdrop-blur-md bg-white/30 dark:bg-black/20 flex items-center justify-center z-[201] transition-all"
//       onClick={handleCancel}
//     >
//       <div
//         className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto animate-fadeIn"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <header className="flex items-center justify-between mb-6">
//           <button
//             onClick={handleCancel}
//             className="hover:bg-gray-100 p-1 rounded-full transition"
//           >
//             <ArrowLeft className="w-6 h-6 text-gray-600" />
//           </button>
//           <h2 className="text-lg font-semibold text-gray-700 text-center flex-1">
//             Actualizar foto del establecimiento
//           </h2>
//           <div className="w-6" />
//         </header>

//         {/* Selector de imagen */}
//         <div className="flex flex-col items-center">
//           {preview ? (
//             <div className="relative w-40 h-40 rounded-xl overflow-hidden shadow-md group">
//               <img
//                 src={preview}
//                 alt="Preview"
//                 className="w-full h-full object-cover"
//               />
//               <button
//                 onClick={handleRemoveImage}
//                 className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition"
//               >
//                 <X className="w-4 h-4" />
//               </button>
//             </div>
//           ) : (
//             <label
//               htmlFor="file-upload"
//               className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition"
//             >
//               <Upload className="w-8 h-8 text-gray-400 mb-2" />
//               <span className="text-xs text-gray-500 text-center">
//                 Subir imagen
//               </span>
//               <input
//                 id="file-upload"
//                 type="file"
//                 accept="image/*"
//                 className="hidden"
//                 onChange={handleFileChange}
//               />
//             </label>
//           )}
//         </div>

//         <footer className="flex justify-end space-x-3 mt-8">
//           <BotonRestaurante
//             label="Cancelar"
//             type="button"
//             variacion="claro"
//             onClick={handleCancel}
//           />
//           <BotonRestaurante onClick={handleSubmit} label="Actualizar" />
//         </footer>
//       </div>
//       {loading && <Spinner />}
//     </div>
//   );
// };

// export default UpdateEstablecimientoImage;

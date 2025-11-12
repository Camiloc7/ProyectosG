"use client";
import React, { useState, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import BotonRestaurante from "@/components/ui/Boton";

interface ModalFormProps {
  labelBoton: string;
  message: string;
  onSave: (file: File) => void | Promise<void>;
}

const ImportarArchivos: React.FC<ModalFormProps> = ({
  labelBoton,
  onSave,
  message,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Debes adjuntar un archivo");
      return;
    }
    onSave(file);
    setIsOpen(false);
    setFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setFile(selectedFile);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleCancel = () => {
    setIsOpen(false);
    setFile(null);
  };

  return (
    <>
      {/* Botón para abrir el modal */}
      <BotonRestaurante
        variacion="claro"
        label={labelBoton}
        onClick={() => setIsOpen(true)}
      />

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-white/30 dark:bg-black/20 flex items-center justify-center z-[201] transition-all"
          onClick={handleCancel}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-700">{message}</h2>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <BotonRestaurante
                  label="Seleccionar archivo"
                  type="button"
                  onClick={triggerFileInput}
                />
                {file && (
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    Archivo seleccionado: <strong>{file.name}</strong>
                  </p>
                )}
              </div>

              <footer className="flex justify-end space-x-3 mt-6">
                <BotonRestaurante
                  label="Cancelar"
                  variacion="claro"
                  onClick={handleCancel}
                />
                <BotonRestaurante type="submit" label="Importar" />
              </footer>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ImportarArchivos;

"use client";
import React, { useState } from "react";
import BotonRestaurante from "../../components/ui/Boton"; 
import Spinner from "@/components/feedback/Spinner"; 
import { COLOR_ERROR } from "@/styles/colors";
import { XCircle } from "lucide-react"; 
import Modal from "./Modal"; 

interface IExcelUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<{ success: boolean; errors?: string[] }>;
  loading: boolean;
  title: string;
  description: string;
  templatePath: string;
}

export default function ExcelUploaderModal({
  isOpen,
  onClose,
  onUpload,
  loading,
  title,
  description,
  templatePath,
}: IExcelUploaderModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        setUploadErrors(["Tipo de archivo no válido. Por favor, sube un archivo .xlsx o .xls."]);
        setFile(null);
      } else {
        setFile(selectedFile);
        setUploadErrors([]);
      }
    } else {
      setFile(null);
      setUploadErrors([]);
    }
  };
  
  const handleUploadClick = async () => {
    if (file) {
      setUploadErrors([]); 
      const result = await onUpload(file);
      if (result.success) {
        onClose(); 
      } else if (result.errors) {
        setUploadErrors(result.errors); 
      }
      setFile(null); 
    }
  };
  
  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = templatePath;
    link.download = templatePath.split('/').pop() || 'template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-4">
        <p className="mb-4 text-gray-700 text-sm">
          {description}
        </p>

        <BotonRestaurante 
          onClick={handleDownloadTemplate} 
          label="Descargar Plantilla" 
        />

        <div className="mt-4 p-4 border border-gray-300 rounded-lg">
          <label htmlFor="excel-file" className="block text-sm font-medium text-gray-700 mb-2">
            Selecciona tu archivo de Excel:
          </label>
          <input
            id="excel-file"
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500 
                      file:mr-4 file:py-2 file:px-4 file:rounded-full 
                      file:border-0 file:text-sm file:font-semibold 
                      file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 
                      cursor-pointer rounded-lg"
          />
        </div>

        {file && <p className="mt-2 text-sm text-gray-600">Archivo seleccionado: <span className="font-medium">{file.name}</span></p>}

        {uploadErrors.length > 0 && (
          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: COLOR_ERROR, color: 'white' }}>
            <p className="font-semibold mb-2 flex items-center gap-2">
              <XCircle size={18} /> Errores de carga:
            </p>
            <ul className="list-disc pl-5 text-sm">
              {uploadErrors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <BotonRestaurante 
            onClick={onClose} 
            label="Cancelar" 
          />
          <BotonRestaurante
            onClick={handleUploadClick}
            label={loading ? "Subiendo..." : "Subir y Guardar"}
          />
        </div>
      </div>
      {loading && <Spinner />}
    </Modal>
  );
}

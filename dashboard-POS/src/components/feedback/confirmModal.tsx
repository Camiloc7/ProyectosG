"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import BotonRestaurante from "../ui/Boton";

type ConfirmOptions = {
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmFunction = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFunction>(() => {
  throw new Error("useConfirm debe usarse dentro de ConfirmProvider");
});

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [promiseInfo, setPromiseInfo] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm: ConfirmFunction = (opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      setPromiseInfo({ resolve });
    });
  };

  const handleCancel = () => {
    promiseInfo?.resolve(false);
    cleanup();
  };

  const handleConfirm = () => {
    promiseInfo?.resolve(true);
    cleanup();
  };

  const cleanup = () => {
    setOptions(null);
    setPromiseInfo(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {/* Modal */}
      {options && (
        <div
          className="fixed inset-0  backdrop-blur-md bg-white/30 dark:bg-black/20 flex items-center justify-center z-50"
          onClick={handleCancel}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-lg max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {options.title && (
              <h3 className="text-lg text-gray-900 font-semibold mb-2">
                {options.title}
              </h3>
            )}
            <p className="mb-6 text-gray-700">{options.description}</p>
            <div className="flex justify-end space-x-2">
              <BotonRestaurante
                label={options.cancelText || "Cancelar"}
                variacion="claro"
                onClick={handleCancel}
              />
              <BotonRestaurante
                label={options.confirmText || "Confirmar"}
                onClick={handleConfirm}
              />
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => useContext(ConfirmContext);

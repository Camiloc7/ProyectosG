'use client';
import React, { useState } from 'react';

type ConfirmOptions = {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
};

let resolver: (value: boolean) => void;

export const confirm = (options: ConfirmOptions = {}): Promise<boolean> => {
  setOptions(options);
  setVisible(true);
  return new Promise<boolean>((resolve) => {
    resolver = resolve;
  });
};

// Estado global simplificado
let setVisible: (v: boolean) => void = () => {};
let setOptions: (o: ConfirmOptions) => void = () => {};

export const ConfirmDialogRoot = () => {
  const [visible, _setVisible] = useState(false);
  const [options, _setOptions] = useState<ConfirmOptions>({});

  setVisible = _setVisible;
  setOptions = _setOptions;

  const handleConfirm = () => {
    _setVisible(false);
    resolver(true);
  };

  const handleCancel = () => {
    _setVisible(false);
    resolver(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-white/30 dark:bg-black/20 flex items-center justify-center z-[201] transition-all">
      <div className="bg-white p-6 rounded-xl shadow-xl w-96 space-y-4">
        <h2 className="text-lg font-bold">
          {options.title || '¿Estás seguro?'}
        </h2>
        {options.message && (
          <p className="text-gray-600 text-sm">
            {options.message || 'Esta acción no se puede deshacer.'}
          </p>
        )}
        <div className="flex justify-center gap-4">
          <button
            className="bg-white border border-[#787878] text-[#787878] hover:bg-gray-300 px-4 py-2 text-sm font-normal rounded-[25px]"
            onClick={handleCancel}
          >
            Cancelar
          </button>
          <button
            className="bg-blueQ text-white h-11  hover:bg-[#008ec1] px-4 py-2 text-sm font-normal rounded-[25px]"
            onClick={handleConfirm}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

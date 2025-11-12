'use client';

import React, { useState, useMemo } from 'react';
import AdminLayoutRestaurante from '../../AdminLayout';
import FormEmpleadoRestaurante from '@/features/restaurante/FormEmpleadoRestaurante';
import InputField from '@/components/ui/InputField';
import { showErrorToast } from '@/components/feedback/toast';

interface Errors {
  tiempo: boolean;
  mesas: boolean;
}

export interface FormConfig {
  tiempo: number | null;
  mesas: number | null;
}

const validateNumber = (value: string | number | null): boolean => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

export default function RestauranteConfig() {
  const [formData, setFormData] = useState<FormConfig>({
    tiempo: null,
    mesas: null,
  });

  const [errors, setErrors] = useState<Errors>({
    mesas: false,
    tiempo: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value ?? '',
    }));

    const validators: Record<string, (value: string) => boolean> = {
      tiempo: validateNumber,
      password: validateNumber,
    };

    if (validators[name]) {
      setErrors((prev) => ({ ...prev, [name]: !validators[name](value) }));
    }
  };

  const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const newErrors: Errors = {
      tiempo: !validateNumber(formData.tiempo),
      mesas: !validateNumber(formData.tiempo),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      showErrorToast('Faltan campos.');
      return;
    }
  };

  return (
    <AdminLayoutRestaurante>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6 text-[#00A7E1]">
          Configuracion Restaurante
        </h1>
        <InputField
          label="Cantidad de mesas"
          name="mesas"
          value={formData.mesas || ''}
          error={errors.mesas}
          onChange={handleChange}
        />

        <InputField
          label="Minutos para cancelar o modificar pedido"
          name="tiempo"
          type="number"
          value={formData.tiempo || ''}
          error={errors.tiempo}
          onChange={handleChange}
        />
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="submit"
            onClick={handleSubmit}
            className="bg-[#00A7E1] text-white h-8 px-4 py-2 rounded-3xl text-[12px] hover:bg-[#008ec1]"
          >
            Guardar
          </button>
        </div>
      </div>
    </AdminLayoutRestaurante>
  );
}

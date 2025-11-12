"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { toast } from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { useComprasStore } from '@/stores/comprasStore';
import { useDineroExtraStore } from '@/stores/gastosIngresosExtraStore';
import { useProveedoresStore } from '@/stores/proveedoresStore';
import { useIngredientesStore } from '@/stores/ingredientesStore';
import SelectConSearch from '@/components/ui/SelectConSearch';
import BotonRestaurante from '@/components/ui/Boton';
import IconActionButton from '@/components/ui/IconActionButton';
import { IFacturaItem, IFacturaFormData } from './types';
import InputField from '@/components/ui/InputField';
import SelectConSearchTabla from '@/components/ui/SelectConSearchTabla';
import InputFieldCompras from '@/components/ui/InputFieldCompras';


const FormularioFactura = ({ onClose }: { onClose: () => void }) => {
  const { crearCompra } = useComprasStore();
  const { gastoExtra } = useDineroExtraStore();
  const { proveedores, traerProveedores } = useProveedoresStore();
  const { ingredientes, traerIngredientes } = useIngredientesStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<IFacturaFormData>({
    defaultValues: {
      proveedorId: "",
      numero_factura: "",
      items: [{ ingredienteId: "", cantidad: 0, unidad_medida: "", costo_unitario: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    traerProveedores();
    traerIngredientes();
  }, [traerProveedores, traerIngredientes]);

  const proveedorOptions = useMemo(() => proveedores.map(p => ({ id: p.id, nombre: p.nombre })), [proveedores]);
  const ingredienteOptions = useMemo(() => ingredientes.map(i => ({ id: i.id, nombre: i.nombre })), [ingredientes]);

  const onSubmit: SubmitHandler<IFacturaFormData> = async (data) => {
    setIsSubmitting(true);
    let costoTotalFactura = 0;

    try {
      for (const item of data.items) {
        const payload = {
          ingrediente_id: item.ingredienteId,
          proveedor_id: data.proveedorId,
          cantidad_comprada: item.cantidad,
          unidad_medida_compra: item.unidad_medida,
          costo_unitario_compra: item.costo_unitario,
          numero_factura: data.numero_factura,
        };
        const success = await crearCompra(payload);

        if (!success) {
          throw new Error(`Fallo al registrar la compra del ingrediente: ${item.ingredienteId}`);
        }
        costoTotalFactura += item.cantidad * item.costo_unitario;
      }

      const gastoPayload = {
        monto: costoTotalFactura,
        descripcion: `Compra de ingredientes (Factura #${data.numero_factura})`,
        cierre_caja_id: "ID_MOCK_CIERRE_CAJA",
      };

      const gastoExitoso = await gastoExtra(gastoPayload);
      if (!gastoExitoso) {
        throw new Error("Fallo al registrar el gasto de la factura.");
      }

      toast.success("Factura y gasto registrados exitosamente.");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Ocurrió un error al procesar la factura.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const items = watch("items");

  useEffect(() => {
    items.forEach((item, index) => {
      if (item.ingredienteId) {
        const ingredienteSeleccionado = ingredientes.find(ing => ing.id === item.ingredienteId);
        if (ingredienteSeleccionado && ingredienteSeleccionado.unidad_medida !== item.unidad_medida) {
          setValue(`items.${index}.unidad_medida`, ingredienteSeleccionado.unidad_medida, { shouldValidate: true });
        }
      }
    });
  }, [items, ingredientes, setValue]);

  const costoTotalFactura = items.reduce((total, item) => {
    return total + (item.cantidad * item.costo_unitario);
  }, 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Datos de la Factura</h2>

      {/* Datos de la factura */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
        <SelectConSearch
          label="Proveedor"
          options={proveedorOptions}
          placeholder="Selecciona un proveedor"
          value={watch('proveedorId')}
          onChange={(value) =>
            setValue('proveedorId', value, { shouldValidate: true })
          }
          error={!!errors.proveedorId}
        />
        <InputField
          label="Número de Factura"
          type="text"
          value={watch('numero_factura')}
          onChange={(e) =>
            setValue('numero_factura', e.target.value, { shouldValidate: true })
          }
          error={!!errors.numero_factura}
        />
      </div>

      <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">
        Ingredientes Comprados
      </h2>

      {/* Tabla con estilo de hoja de cálculo */}
      <div className="rounded-lg border shadow-sm w-full"> 
{/*         <div className="overflow-x-auto"> */}
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-2/5">Ingrediente</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-1/5">Cantidad</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-1/5">Unidad</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-1/5">Costo Unitario</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-1/5">Costo Total</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {fields.map((field, index) => {
                const costoTotalItem = (items[index]?.cantidad || 0) * (items[index]?.costo_unitario || 0);
                return (
                    <tr key={field.id} className="hover:bg-gray-50">
                      <td className="p-0 border-r border-gray-200">
                        <SelectConSearchTabla
                          options={ingredienteOptions}
                          placeholder="Selecciona un ingrediente"
                          value={items[index]?.ingredienteId || ""}
                          onChange={(value) => {
                            setValue(`items.${index}.ingredienteId`, value, {
                              shouldValidate: true,
                            });
                            const ingredienteSeleccionado = ingredientes.find(
                              (ing) => ing.id === value
                            );
                            if (ingredienteSeleccionado) {
                              setValue(
                                `items.${index}.unidad_medida`,
                                ingredienteSeleccionado.unidad_medida
                              );
                            }
                          }}
                          error={!!errors.items?.[index]?.ingredienteId}
                        />
                      </td>

                      <td className="p-0 border-r border-gray-200">
                        <InputFieldCompras
                        label="Cantidad"
                          type="number"
                          value={items[index]?.cantidad || ""}
                          onChange={(e) =>
                            setValue(
                              `items.${index}.cantidad`,
                              parseFloat(e.target.value) || 0,
                              { shouldValidate: true }
                            )
                          }
                          error={!!errors.items?.[index]?.cantidad}
                        />
                      </td>

                      <td className="p-0 border-r border-gray-200">
                        <InputFieldCompras
                        label="Unidad de Medida"
                          type="text"
                          value={items[index]?.unidad_medida || ""}
                          onChange={() => {}}
                          readOnly
                        />
                      </td>

                      <td className="p-0 border-r border-gray-200">
                        <InputFieldCompras
                        label="Costo Unitario"
                          type="number"
                          value={items[index]?.costo_unitario || ""}
                          onChange={(e) =>
                            setValue(
                              `items.${index}.costo_unitario`,
                              parseFloat(e.target.value) || 0,
                              { shouldValidate: true }
                            )
                          }
                          error={!!errors.items?.[index]?.costo_unitario}
                        />
                      </td>

                      <td className="p-0 border-r border-gray-200">
                          <div className="p-3 text-sm text-gray-800">
                              {costoTotalItem.toFixed(2)}
                          </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <IconActionButton
                          onClick={() => remove(index)}
                          icon={<Trash2 size={20} color="#EF4444" />}
                          tooltip="Eliminar este ítem"
                        />
                      </td>
                    </tr>
                );
            })}
          </tbody>
        </table>
      {/* </div> */}
      </div>


      {/* Total de la factura */}
      <div className="mt-4 flex justify-end">
          <div className="p-4 bg-gray-100 rounded-lg font-bold text-gray-800">
              Total de la Factura: ${costoTotalFactura.toFixed(2)}
          </div>
      </div>

      <BotonRestaurante
        onClick={() =>
          append({ ingredienteId: '', cantidad: 0, unidad_medida: '', costo_unitario: 0 })
        }
        type="button"
        label="Añadir otro ingrediente"
        variacion="claro"
      />

      {/* Botones finales */}
      <div className="flex justify-end gap-4 mt-6">
        <BotonRestaurante
          label="Cancelar"
          onClick={onClose}
          type="button"
          disabled={isSubmitting}
          variacion="claro"
        />
        <BotonRestaurante
          label="Registrar Factura"
          type="submit"
          disabled={isSubmitting}
          variacion="verde"
        />
      </div>
    </form>
  );
};

export default FormularioFactura;
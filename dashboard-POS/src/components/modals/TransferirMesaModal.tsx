// src/components/modals/TransferirMesaModal.tsx

'use client';

import { useState } from 'react';
import BotonRestaurante from '@/components/ui/Boton';
import { toast } from 'react-hot-toast';
import { IMesa } from '@/stores/mesasStore';

interface TransferirMesaModalProps {
    show: boolean;
    onClose: () => void;
    mesasLibres: IMesa[];
    onTransfer: (newMesaId: string) => Promise<void>;
}

export default function TransferirMesaModal({ show, onClose, mesasLibres, onTransfer }: TransferirMesaModalProps) {
    const [selectedMesa, setSelectedMesa] = useState<string | null>(null);

    const handleTransferClick = async () => {
        if (!selectedMesa) {
            toast.error('Por favor, selecciona una mesa de destino.');
            return;
        }
        await onTransfer(selectedMesa);
        setSelectedMesa(null);
        onClose();
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Transferir a otra Mesa</h2>
                <p className="text-gray-600 mb-4">Selecciona una mesa libre para transferir el pedido actual:</p>

                {mesasLibres.length === 0 ? (
                    <div className="text-center text-gray-500 p-4">
                        <p>No hay mesas libres para transferir.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 mb-4 max-h-60 overflow-y-auto">
                        {mesasLibres.map((mesa) => (
                            <button
                                key={mesa.id}
                                className={`
                                    p-3 rounded-lg border-2 font-semibold transition-colors
                                    ${selectedMesa === mesa.id ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}
                                `}
                                onClick={() => setSelectedMesa(mesa.id)}
                            >
                                {mesa.numero}
                            </button>
                        ))}
                    </div>
                )}
                <div className="flex justify-end gap-4 mt-4">
                    <BotonRestaurante
                        label="Cancelar"
                        onClick={onClose}
                        className="bg-gray-500 hover:bg-gray-600"
                    />
                    <BotonRestaurante
                        label="Confirmar Transferencia"
                        onClick={handleTransferClick}
                        disabled={!selectedMesa}
                    />
                </div>
            </div>
        </div>
    );
}
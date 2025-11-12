import { create } from 'zustand';
import { Invoice, Item } from '@/types/inventory'; 
type ItemMappingStatus = 'existing' | 'new' | 'unprocessed' | 'ignored';
interface ItemMapping {
    productId: number | null;
    status: ItemMappingStatus;
}
interface InvoiceProcessingState {
    isProcessing: boolean;
    processingError: string | null;
    processInvoice: (invoiceId: number, itemMappings: Record<number, ItemMapping>, invoiceItems: Item[]) => Promise<void>;
}
export const useInvoiceProcessingStore = create<InvoiceProcessingState>((set) => ({
    isProcessing: false,
    processingError: null,
    processInvoice: async (invoiceId, itemMappings, invoiceItems) => {
        set({ isProcessing: true, processingError: null });
        try {
            const itemsToProcess = Object.entries(itemMappings).map(([itemId, mapping]) => {
                const originalItem = invoiceItems.find(i => i.id === parseInt(itemId));
                return {
                    invoice_item_id: parseInt(itemId),
                    product_id: mapping.productId,
                    status: mapping.status,
                    cantidad: originalItem?.cantidad, 
                    valor_unitario: originalItem?.valor_unitario
                };
            });
            const response = await fetch(`/api/invoices/${invoiceId}`, { 
                method: 'PATCH', 
                headers: {
                    'Content-Type': 'application/json', 
                },
                body: JSON.stringify({
                    revisada_manualmente: true,
                    items_gestionados: itemsToProcess
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error desconocido al procesar la factura.');
            }
            set({ isProcessing: false });
        } catch (error: any) {
            console.error("Error al procesar la factura:", error);
            set({ isProcessing: false, processingError: error.message || 'Error al procesar la factura.' });
            throw error; 
        }
    },
}));
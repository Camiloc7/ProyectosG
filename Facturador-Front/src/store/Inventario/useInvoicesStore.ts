import { create } from 'zustand';
import { INVENTORY_URL } from '@/helpers/ruta';
import type {
  Invoice,
  CreateInvoicePayload,
  UpdateInvoicePayload,
} from '@/types/inventory';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';

interface InvoicesStore {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  fetchInvoices: () => Promise<void>;
  fetchInvoiceById: (id: number) => Promise<Invoice | null>;
  createInvoice: (invoiceData: CreateInvoicePayload) => Promise<Invoice | null>;
  updateInvoice: (
    id: number,
    invoiceData: UpdateInvoicePayload
  ) => Promise<Invoice | null>;
  deleteInvoice: (id: number) => Promise<boolean>;
  fetchPdfById: (id: number) => Promise<string | null>;
  fetchXmlById: (id: number) => Promise<string | null>;
  fetchClassifiedInvoices: (page?: number, limit?: number) => Promise<void>;
  fetchInvoicesBySupplierId: (proveedorId: string) => Promise<void>;
}

export const useInvoicesStore = create<InvoicesStore>((set, get) => ({
  invoices: [],
  isLoading: false,
  error: null,

  fetchInvoices: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error(
          'No se encontró el token de autenticación. Por favor, inicie sesión de nuevo.'
        );
      }
      const response = await fetch(`${INVENTORY_URL}facturas`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || 'Error al obtener facturas');
      }

      const data: Invoice[] = await response.json();

      set({ invoices: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchInvoiceById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No se encontró el token de autenticación.');
      }
      const response = await fetch(`${INVENTORY_URL}facturas/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Error al obtener los detalles de la factura'
        );
      }
      const data: Invoice = await response.json();
      set({ isLoading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  createInvoice: async (invoiceData: CreateInvoicePayload) => {
    set({ isLoading: true, error: null });
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error(
          'No se encontró el token de autenticación. Por favor, inicie sesión de nuevo.'
        );
      }
      const response = await fetch(`${INVENTORY_URL}facturas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(invoiceData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear factura');
      }
      const newInvoice: Invoice = await response.json();
      set((state) => ({
        invoices: [...state.invoices, newInvoice],
        isLoading: false,
      }));
      return newInvoice;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  updateInvoice: async (id: number, invoiceData: UpdateInvoicePayload) => {
    set({ isLoading: true, error: null });
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error(
          'No se encontró el token de autenticación. Por favor, inicie sesión de nuevo.'
        );
      }
      const response = await fetch(`${INVENTORY_URL}facturas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(invoiceData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar factura');
      }
      const updatedInvoice: Invoice = await response.json();
      set((state) => ({
        invoices: state.invoices.map((invoice) =>
          invoice.id === id ? updatedInvoice : invoice
        ),
        isLoading: false,
      }));
      return updatedInvoice;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  deleteInvoice: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error(
          'No se encontró el token de autenticación. Por favor, inicie sesión de nuevo.'
        );
      }
      const response = await fetch(`${INVENTORY_URL}facturas/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar factura');
      }
      set((state) => ({
        invoices: state.invoices.filter((invoice) => invoice.id !== id),
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  fetchPdfById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No se encontró el token de autenticación.');
      }
      const response = await fetch(`${INVENTORY_URL}facturas/${id}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 204) {
        set({ isLoading: false });
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || 'Error al obtener el PDF');
      }
      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      set({ isLoading: false });
      return pdfUrl;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },
  fetchClassifiedInvoices: async (page = 1, limit = 100) => {
    set({ isLoading: true, error: null });
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No se encontró el token de autenticación.');
      }

      const url = new URL(`${INVENTORY_URL}facturas/clasificadas`);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', limit.toString());

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Error al obtener facturas clasificadas'
        );
      }
      const { data } = await response.json();
      set({ invoices: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  fetchInvoicesBySupplierId: async (proveedorId: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No se encontró el token de autenticación.');
      }

      const response = await fetch(
        `${INVENTORY_URL}facturas/by-supplier/${proveedorId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Error al obtener facturas por proveedor'
        );
      }

      const data: Invoice[] = await response.json();
      set({ invoices: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchXmlById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No se encontró el token de autenticación.');
      }

      const response = await fetch(`${INVENTORY_URL}facturas/${id}/xml`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/xml',
        },
      });

      if (response.status === 204) {
        set({ isLoading: false });
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener el XML');
      }

      const xmlText = await response.text();
      set({ isLoading: false });
      return xmlText;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },
}));

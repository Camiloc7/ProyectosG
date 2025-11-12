'use client';

import { create } from 'zustand';
import { BASE_URL } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { ListaDeContratos } from '@/types/types';
import { validateDate, validateNumber } from '@/helpers/validacionDeDatos';
import { fetchWithTimeout } from '@/helpers/timefetch';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';

interface Contract {
  id?: string;
  ident?: string;
  contrato: string;
  descripcion: string;
  FECHAI: string;
  FECHAF: string;
  FIC: string;
  VALORI: number;
  VALORFINAL: number;
  OTRO1?: string;
  OTRO2?: string;
  OTRO3?: string;
  CIUDAD?: string;
  OTRO4?: string;
  OTRO5?: string;
  CONSTRUCTORA?: string;
  CORREOOBRA?: string;
  DISMINUCION?: number;
  NUM?: string;
  RETEGARANTIA?: number;
}

interface DescripcionDeLosContratos {
  id: string;
  nombre: string;
}

interface ContractStore {
  contracts: DescripcionDeLosContratos[];
  listaDeContratos: ListaDeContratos[];
  currentContract: Contract | null;
  isLoading: boolean;
  error: string | null;
  fetchContracts: () => Promise<void>;
  createContract: (contractData: Partial<Contract>) => Promise<void>;
  updateContract: (
    id: string,
    contractData: Partial<Contract>
  ) => Promise<void>;
  setCurrentContract: (contract: Contract | null) => void;
  fetchListaDeContratos: () => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  sendContractEmail: (id: string, email: string) => Promise<void>;
}

export const useContractStore = create<ContractStore>((set, get) => ({
  contracts: [],
  listaDeContratos: [],
  currentContract: null,
  isLoading: false,
  error: null,

  fetchContracts: async () => {
    set({ isLoading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ isLoading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/contratos/getContratos`,
        {
          headers: { authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error('Error al obtener los contratos');
      const data = await response.json();
      const mappedContracts = data.contratos.map((contract: any) => ({
        id: contract.ID || '',
        nombre:
          `${contract.CONTRATO} ${contract.DESCRIPCION}` ||
          'Nombre no disponible',
      }));
      set({ contracts: mappedContracts, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', isLoading: false });
    }
  },

  createContract: async (contractData: Partial<Contract>) => {
    set({ isLoading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ isLoading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    console.warn(contractData);
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/contratos/crearcontrato`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(contractData),
        }
      );
      if (!response.ok) throw new Error('Error al crear el contrato');
      await get().fetchContracts();
      await get().fetchListaDeContratos();
      showTemporaryToast('Contrato creado exitosamente');
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', isLoading: false });
    }
  },

  updateContract: async (id: string, contractData: Partial<Contract>) => {
    set({ isLoading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ isLoading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      return;
    }

    // Creamos el payload agregando el ID
    const payload = {
      ID: id, // <- agregamos el ID aquí
      ...contractData, // resto de los datos del contrato
    };

    console.warn('RAW LO QUE MANDO ACTUALIZAR: ', payload);

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/contratos/crearcontrato`, // NO CAMBIAR ESTA RUTA
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload), // enviamos el payload con ID
        }
      );

      const data = await response.json();

      if (data.status) {
        showTemporaryToast('Contrato actualizado exitosamente');
      } else {
        console.log(data);
        showErrorToast(data.message);
      }

      await get().fetchListaDeContratos();
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', isLoading: false });
    }
  },

  fetchListaDeContratos: async () => {
    set({ isLoading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ isLoading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/contratos/getContratos`,
        {
          headers: { authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener la lista de contratos');
      }

      const data = await response.json();

      // console.log('BACK RAW :', data);
      const listaDeContratos = data.contratos.map((contract: any) => {
        return {
          id: contract.ID || '',
          idUsuario: contract.ID_USUARIO || '',
          contrato: contract.CONTRATO || '',
          descripcion: contract.DESCRIPCION || '',
          numero: contract.NUM || '',
          idCliente: contract.ID_CLIENTE || '',
          ciudad: contract.CIUDAD || '',
          fechaInicio: validateDate(contract.FECHAI),
          fechaFin: validateDate(contract.FECHAF),
          valorInicial: validateNumber(contract.VALORI),
          valorFinal: validateNumber(contract.VALORFINAL),
          valorEjecutado: validateNumber(contract.VALORE),
          fic: contract.FIC || '',
          disminucion: validateNumber(contract.DISMINUCION),
          correoObra: contract.CORREOOBRA || '',
          constructora: contract.CONSTRUCTORA || '',
          indicador: contract.INDICADOR || '',
          otro1: contract.OTRO1 || '',
          otro2: contract.OTRO2 || '',
          otro3: contract.OTRO3 || '',
          otro4: contract.OTRO4 || '',
          otro5: contract.OTRO5 || '',
          nombreConstructora: contract.NOMBRE_CONSTRUCTORA,
          //
          retefuente: contract.RETEFUENTE,
          reteica: contract.RETEICA,
          administracion: contract.ADMINISTRACION,
          imprevistos: contract.IMPREVISTOS,
          porcentajeUtilidad: contract.UTILIDAD,
          reteGarantia: contract.RETEGARANTIA,
        };
      });
      set({ listaDeContratos, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', isLoading: false });
    }
  },

  deleteContract: async (id: string) => {
    set({ isLoading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ isLoading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/contratos/eliminarcontrato/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
        }
      );
      const contentType = response.headers.get('Content-Type');

      // console.log(contentType);

      const data = await response.json();
      console.log(data);
      showTemporaryToast('Contrato eliminado');

      // if (!response.ok) throw new Error('Error al actualizar el contrato');

      await get().fetchListaDeContratos();
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', isLoading: false });
    }
  },

  sendContractEmail: async (id: string, email: string) => {
    set({ isLoading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ isLoading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    const dataBack = {
      correo: email,
      idContrato: id,
    };
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/contratos/enviar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dataBack),
        }
      );
      const contentType = response.headers.get('Content-Type');

      // console.log(contentType);

      const data = await response.json();
      console.log(data);
      showTemporaryToast(data.menssage);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', isLoading: false });
    }
  },

  setCurrentContract: (contract: Contract | null) =>
    set({ currentContract: contract }),
}));

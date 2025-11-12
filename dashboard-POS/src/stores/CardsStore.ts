import { create } from "zustand";

type CardStoreState = {
  loading: boolean;
  idPedido: string;
  idDivision: string;
  guardarInfoPago: (idPedido: string, idDivision: string) => Promise<void>;
};

export const useCardStore = create<CardStoreState>((set) => ({
  loading: false,
  idPedido: "",
  idDivision: "",

  guardarInfoPago: async (idPedido, idDivision) => {
    set({ idDivision, idPedido });
  },
}));

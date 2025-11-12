import { Mesa } from './models';

export type AuthStackParamList = {
  Login: undefined;
};

export type MeseroStackParamList = {
  MeseroDashboard: undefined;
  OrderTakingScreen: { mesa: Mesa };
  MeseroReadyOrdersScreen: undefined; 
};

export type CocinaStackParamList = {
  CocineroDashboard: undefined;
};

export type AdminStackParamList = {
  AdminDashboard: undefined;
  CreateProductScreen: undefined; 
  AdminPurchaseRegisterScreen: undefined; 
  AdminIngredientManagementScreen: undefined;
  AdminUserManagementScreen: undefined;
  AdminMesaManagementScreen: undefined;
};

export type ErrorStackParamList = {
  ErrorRole: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
  MeseroStack: undefined;
  CocineroStack: undefined;
  CajeroStack: undefined; 
  AdminStack: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
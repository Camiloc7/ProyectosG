import { useUserStore } from '@/store/useUser';
import { useFacturaStore } from '../store/useFacturaStore';
import { useClientStore } from '../store/useClientStore';

const handleGlobalLogOut = () => {
  // Llamar al logout de cada store
  useUserStore.getState().logout(); // Resetear el store de usuario
  useFacturaStore.getState().reset(); // Resetear el store de facturas
  useClientStore.getState().reset(); // Resetear el store de notas de crédito

  // Eliminar cualquier persistencia externa
  // localStorage.removeItem('token');
  // sessionStorage.clear();

  // Eliminar la cookie de token
  const deleteCookie = (name: string) => {
    document.cookie = `${name}=; Max-Age=-99999999; path=/;`;
  };

  deleteCookie('tokenFacturador');

  // Redirigir a la página principal o login
};

export default handleGlobalLogOut;

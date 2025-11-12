import { showErrorToast } from '@/components/feedback/toast';

export const fetchWithTimeout = async (
  url: string,
  options = {},
  timeout = 30000
): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      showErrorToast(
        'La respuesta tardó demasiado en llegar. Por favor, comunícate con nuestro soporte técnico.'
      );
      reject(new Error('Tiempo de espera agotado'));
    }, timeout);

    fetch(url, options)
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

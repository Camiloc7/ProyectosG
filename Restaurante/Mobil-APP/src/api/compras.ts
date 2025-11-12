import { API_BASE_URL } from './config';
import { Compra, CreateCompraDto, UpdateCompraDto, UpdateIngredienteStockDto, Proveedor, Ingrediente } from '../types/models'; 

interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

/**
 * Registra una nueva compra de ingrediente.
 * @param createCompraDto Datos para crear la compra.
 * @param token Token de autenticación del usuario.
 * @returns La compra registrada.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const createCompra = async (createCompraDto: CreateCompraDto, token: string): Promise<Compra> => {
  try {
    const response = await fetch(`${API_BASE_URL}/compras`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(createCompraDto),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al registrar la compra.');
    }
    const responseBody: ApiResponse<Compra> = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error('Formato de respuesta inesperado al registrar la compra.');
    }
  } catch (error: any) {
    console.error('Error en createCompra:', error.message);
    throw error;
  }
};

/**
 * Obtiene todas las compras de ingredientes para un establecimiento, con filtros opcionales.
 * @param token Token de autenticación del usuario.
 * @param establecimientoId ID del establecimiento.
 * @param proveedorId (Opcional) Filtrar por ID de proveedor.
 * @param ingredienteId (Opcional) Filtrar por ID de ingrediente.
 * @param fechaInicio (Opcional) Filtrar por fecha de compra (inicio). Formato ISO 8601.
 * @param fechaFin (Opcional) Filtrar por fecha de compra (fin). Formato ISO 8601.
 * @returns Un array de compras.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const fetchCompras = async (
  token: string,
  establecimientoId: string,
  proveedorId?: string,
  ingredienteId?: string,
  fechaInicio?: string,
  fechaFin?: string,
): Promise<Compra[]> => {
  try {
    let queryParams = `establecimientoId=${establecimientoId}`;
    if (proveedorId) queryParams += `&proveedorId=${proveedorId}`;
    if (ingredienteId) queryParams += `&ingredienteId=${ingredienteId}`;
    if (fechaInicio) queryParams += `&fechaInicio=${fechaInicio}`;
    if (fechaFin) queryParams += `&fechaFin=${fechaFin}`;

    const response = await fetch(`${API_BASE_URL}/compras?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al obtener las compras.');
    }
    const responseBody: ApiResponse<Compra[]> = await response.json();
    if (responseBody && Array.isArray(responseBody.data)) {
      return responseBody.data;
    } else {
      throw new Error('Formato de respuesta inesperado al obtener compras.');
    }
  } catch (error: any) {
    console.error('Error en fetchCompras:', error.message);
    throw error;
  }
};

/**
 * Obtiene una compra de ingrediente por su ID.
 * @param compraId ID de la compra.
 * @param token Token de autenticación del usuario.
 * @returns La compra encontrada.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const fetchCompraById = async (compraId: string, token: string): Promise<Compra> => {
  try {
    const response = await fetch(`${API_BASE_URL}/compras/${compraId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al obtener la compra con ID ${compraId}.`);
    }

    const responseBody: ApiResponse<Compra> = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error(`Formato de respuesta inesperado al obtener la compra con ID ${compraId}.`);
    }
  } catch (error: any) {
    console.error('Error en fetchCompraById:', error.message);
    throw error;
  }
};

/**
 * Actualiza una compra de ingrediente existente.
 * @param compraId ID de la compra a actualizar.
 * @param updateCompraDto Datos para actualizar la compra.
 * @param token Token de autenticación del usuario.
 * @returns La compra actualizada.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const updateCompra = async (compraId: string, updateCompraDto: UpdateCompraDto, token: string): Promise<Compra> => {
  try {
    const response = await fetch(`${API_BASE_URL}/compras/${compraId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateCompraDto),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al actualizar la compra con ID ${compraId}.`);
    }

    const responseBody: ApiResponse<Compra> = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error(`Formato de respuesta inesperado al actualizar la compra con ID ${compraId}.`);
    }
  } catch (error: any) {
    console.error('Error en updateCompra:', error.message);
    throw error;
  }
};

/**
 * Elimina una compra de ingrediente.
 * @param compraId ID de la compra a eliminar.
 * @param token Token de autenticación del usuario.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const deleteCompra = async (compraId: string, token: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/compras/${compraId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al eliminar la compra con ID ${compraId}.`);
    }
    const responseBody: ApiResponse<null> = await response.json(); 
    if (!responseBody || responseBody.status !== true) {
      console.warn('DELETE exitoso, pero la respuesta del cuerpo no confirma status: true', responseBody);
    }
  } catch (error: any) {
    console.error('Error en deleteCompra:', error.message);
    throw error;
  }
};

/**
 * Actualiza el stock actual de un ingrediente (sumar/restar).
 * Este endpoint es para un recurso diferente (/ingredientes) pero está en el mismo archivo.
 * @param ingredienteId ID del ingrediente.
 * @param updateStockDto Objeto con la cantidad y el tipo de operación ('sumar' | 'restar').
 * @param token Token de autenticación del usuario.
 * @returns El ingrediente actualizado.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const updateIngredienteStock = async (
  ingredienteId: string,
  updateStockDto: UpdateIngredienteStockDto,
  token: string,
): Promise<Ingrediente> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ingredientes/${ingredienteId}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateStockDto),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al actualizar el stock del ingrediente ${ingredienteId}.`);
    }
    const responseBody: ApiResponse<Ingrediente> = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error(`Formato de respuesta inesperado al actualizar el stock del ingrediente ${ingredienteId}.`);
    }
  } catch (error: any) {
    console.error('Error en updateIngredienteStock:', error.message);
    throw error;
  }
};


// // src/api/compras.ts
// import { API_BASE_URL } from './config';
// import { Compra, CreateCompraDto, UpdateCompraDto, UpdateIngredienteStockDto, Proveedor, Ingrediente } from '../types/models';

// /**
//  * Registra una nueva compra de ingrediente.
//  * @param createCompraDto Datos para crear la compra.
//  * @param token Token de autenticación del usuario.
//  * @returns La compra registrada.
//  * @throws Error si la solicitud falla.
//  */
// export const createCompra = async (createCompraDto: CreateCompraDto, token: string): Promise<Compra> => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/compras`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`,
//       },
//       body: JSON.stringify(createCompraDto), // Ahora incluye unidad_medida_compra
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || 'Error al registrar la compra.');
//     }

//     const data: Compra = await response.json();
//     return data;
//   } catch (error: any) {
//     console.error('Error en createCompra:', error.message);
//     throw error;
//   }
// };

// /**
//  * Obtiene todas las compras de ingredientes para un establecimiento, con filtros opcionales.
//  * @param token Token de autenticación del usuario.
//  * @param establecimientoId ID del establecimiento.
//  * @param proveedorId (Opcional) Filtrar por ID de proveedor.
//  * @param ingredienteId (Opcional) Filtrar por ID de ingrediente.
//  * @param fechaInicio (Opcional) Filtrar por fecha de compra (inicio). Formato ISO 8601.
//  * @param fechaFin (Opcional) Filtrar por fecha de compra (fin). Formato ISO 8601.
//  * @returns Un array de compras.
//  * @throws Error si la solicitud falla.
//  */
// export const fetchCompras = async (
//   token: string,
//   establecimientoId: string,
//   proveedorId?: string,
//   ingredienteId?: string,
//   fechaInicio?: string,
//   fechaFin?: string,
// ): Promise<Compra[]> => {
//   try {
//     let queryParams = `establecimientoId=${establecimientoId}`;
//     if (proveedorId) queryParams += `&proveedorId=${proveedorId}`;
//     if (ingredienteId) queryParams += `&ingredienteId=${ingredienteId}`;
//     if (fechaInicio) queryParams += `&fechaInicio=${fechaInicio}`;
//     if (fechaFin) queryParams += `&fechaFin=${fechaFin}`;

//     const response = await fetch(`${API_BASE_URL}/compras?${queryParams}`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || 'Error al obtener las compras.');
//     }

//     const data: Compra[] = await response.json();
//     return data;
//   } catch (error: any) {
//     console.error('Error en fetchCompras:', error.message);
//     throw error;
//   }
// };

// /**
//  * Obtiene una compra de ingrediente por su ID.
//  * @param compraId ID de la compra.
//  * @param token Token de autenticación del usuario.
//  * @returns La compra encontrada.
//  * @throws Error si la solicitud falla o la compra no se encuentra.
//  */
// export const fetchCompraById = async (compraId: string, token: string): Promise<Compra> => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/compras/${compraId}`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || `Error al obtener la compra con ID ${compraId}.`);
//     }

//     const data: Compra = await response.json();
//     return data;
//   } catch (error: any) {
//     console.error('Error en fetchCompraById:', error.message);
//     throw error;
//   }
// };

// /**
//  * Actualiza una compra de ingrediente existente.
//  * @param compraId ID de la compra a actualizar.
//  * @param updateCompraDto Datos para actualizar la compra.
//  * @param token Token de autenticación del usuario.
//  * @returns La compra actualizada.
//  * @throws Error si la solicitud falla.
//  */
// export const updateCompra = async (compraId: string, updateCompraDto: UpdateCompraDto, token: string): Promise<Compra> => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/compras/${compraId}`, {
//       method: 'PATCH',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`,
//       },
//       body: JSON.stringify(updateCompraDto), // Ahora incluye unidad_medida_compra
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || `Error al actualizar la compra con ID ${compraId}.`);
//     }

//     const data: Compra = await response.json();
//     return data;
//   } catch (error: any) {
//     console.error('Error en updateCompra:', error.message);
//     throw error;
//   }
// };

// /**
//  * Elimina una compra de ingrediente.
//  * @param compraId ID de la compra a eliminar.
//  * @param token Token de autenticación del usuario.
//  * @throws Error si la solicitud falla.
//  */
// export const deleteCompra = async (compraId: string, token: string): Promise<void> => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/compras/${compraId}`, {
//       method: 'DELETE',
//       headers: {
//         'Authorization': `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || `Error al eliminar la compra con ID ${compraId}.`);
//     }
//   } catch (error: any) {
//     console.error('Error en deleteCompra:', error.message);
//     throw error;
//   }
// };

// /**
//  * Actualiza el stock actual de un ingrediente (sumar/restar).
//  * @param ingredienteId ID del ingrediente.
//  * @param updateStockDto Objeto con la cantidad y el tipo de operación ('sumar' | 'restar').
//  * @param token Token de autenticación del usuario.
//  * @returns El ingrediente actualizado.
//  * @throws Error si la solicitud falla.
//  */
// export const updateIngredienteStock = async (
//   ingredienteId: string,
//   updateStockDto: UpdateIngredienteStockDto,
//   token: string,
// ): Promise<Ingrediente> => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/ingredientes/${ingredienteId}/stock`, {
//       method: 'PATCH',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`,
//       },
//       body: JSON.stringify(updateStockDto),
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || `Error al actualizar el stock del ingrediente ${ingredienteId}.`);
//     }

//     const data: Ingrediente = await response.json();
//     return data;
//   } catch (error: any) {
//     console.error('Error en updateIngredienteStock:', error.message);
//     throw error;
//   }
// };
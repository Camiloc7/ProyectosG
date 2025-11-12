// src/@types/electron.d.ts

// export interface SecureStoreAPI {
//   getToken(): string | null
//   setToken(token: string): void
//   deleteToken(): void
//   storeGetAll: () => Promise<Record<string, any>>
// }

// declare global {
//   interface Window {
//     secureStore: SecureStoreAPI
//   }
// }

// Esto hace que el .d.ts sea un módulo y active el scope global
export {}

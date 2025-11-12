interface Window {
  electron: {
    imprimirFactura: (pdfBlob) => Promise<void>
    printPdf: (pdfBlob) => Promise<void>

    storeSet: (key: string, value: any) => Promise<void>
    storeGet: (key: string) => Promise<any>
    storeDelete: (key: string) => Promise<void>
    storeGetAll: () => Promise<any>
    storeClearAll: () => Promise<void>
    saveDataToDisk: (data: any, filename?: string) => Promise<void>
    printPdfData: (pdfData: string) => Promise<void>
    validateLicense: (licenseKey: string) => Promise<{ success: boolean; message: string }>
    verifyLicense: (
      establecimientoId: string,
      deviceId: string
    ) => Promise<{ success: boolean; message: string }>
    onUpdateProgress?: (callback: (percent: number) => void) => void
    removeUpdateProgressListeners?: () => void
    getAvailablePorts: () => Promise<Array<{ label: string, value: string }>>; 
    appReadyForSocket: (establecimientoId: string) => Promise<boolean> 
    getSystemPrinters: () => Promise<string[]>
    printRaw: (
      printerName: string,
      dataBase64: string
    ) => Promise<{ success: boolean; error?: string }>
  }
}

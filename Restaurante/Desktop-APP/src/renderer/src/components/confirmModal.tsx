'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import OrangeButton from './OrangeButton'

type ConfirmOptions = {
  title?: string
  description: string
  confirmText?: string
  cancelText?: string
}

type ConfirmFunction = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFunction>(() => {
  throw new Error('useConfirm debe usarse dentro de ConfirmProvider')
})

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [promiseInfo, setPromiseInfo] = useState<{
    resolve: (value: boolean) => void
  } | null>(null)

  const confirm: ConfirmFunction = (opts) => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      setPromiseInfo({ resolve })
    })
  }

  const handleCancel = () => {
    promiseInfo?.resolve(false)
    cleanup()
  }

  const handleConfirm = () => {
    promiseInfo?.resolve(true)
    cleanup()
  }

  const cleanup = () => {
    setOptions(null)
    setPromiseInfo(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {options && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backdropFilter: 'blur(6px)',
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={handleCancel}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: 24,
              borderRadius: 16,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              maxWidth: 400,
              width: '100%',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {options.title && (
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: 12
                }}
              >
                {options.title}
              </h3>
            )}

            <p
              style={{
                color: '#374151',
                marginBottom: 24,
                fontSize: 15
              }}
            >
              {options.description}
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12
              }}
            >
              <OrangeButton
                label={options.cancelText || 'Cancelar'}
                variacion="claro"
                onClick={handleCancel}
              />
              <OrangeButton label={options.confirmText || 'Confirmar'} onClick={handleConfirm} />
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export const useConfirm = () => useContext(ConfirmContext)

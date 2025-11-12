// src/components/LicenseWrapper.tsx
import { useEffect, useState, ReactNode } from 'react';
import { COLOR_ERROR, COLOR_INPUT_BG, FONDO, FONDO_COMPONENTES, ORANGE } from '../../src/styles/colors'


function LicensePrompt({ onValidate }: { onValidate: (key: string) => Promise<void> }) {
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // La clave se mantiene como se pega, sin formato
    setLicenseKey(e.target.value);
  };

  const handleValidate = async () => {
    const result = await window.electron.validateLicense(licenseKey);
    if (result.success) {
      setError('');
      await onValidate(licenseKey);
    } else {
      setError(result.message);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: FONDO,
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        padding: '40px',
        backgroundColor: FONDO_COMPONENTES,
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        width: '350px'
      }}>
        <h2 style={{ color: '#333', marginBottom: '10px' }}>¡Bienvenido a Gastro POS!</h2>
        <p style={{ color: '#555', marginBottom: '20px' }}>Por favor, proporcione su clave de producto para continuar.</p>
        <input
          type="text"
          value={licenseKey}
          onChange={handleInputChange}
          placeholder="Clave de producto"
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '15px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            fontSize: '16px',
            backgroundColor: COLOR_INPUT_BG
          }}
        />
        <button
          onClick={handleValidate}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: ORANGE,
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
        >
          Validar
        </button>
        {error && <p style={{ color: COLOR_ERROR, marginTop: '15px' }}>{error}</p>}
      </div>
    </div>
  );
}

interface LicenseWrapperProps {
  children: ReactNode;
}

export function LicenseWrapper({ children }: LicenseWrapperProps) {
  const [licenseValid, setLicenseValid] = useState<boolean | null>(null);

  useEffect(() => {
    const checkLicense = async () => {
      const license = await window.electron.storeGet('license');
      if (license?.valid) {
        setLicenseValid(true);
      } else {
        setLicenseValid(false);
      }
    };
    checkLicense();
  }, []);

  if (licenseValid === null) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: FONDO,
        color: '#555'
      }}>
        Cargando...
      </div>
    );
  }

  if (!licenseValid) {
    return (
      <LicensePrompt
        onValidate={async (key) => {
          await window.electron.storeSet('license', { key, valid: true });
          setLicenseValid(true);
        }}
      />
    );
  }

  return <>{children}</>;
}



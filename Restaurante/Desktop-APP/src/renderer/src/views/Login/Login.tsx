import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '@fontsource/montserrat/400.css'
import '@fontsource/open-sans/400.css'
import '@fontsource/raleway/400.css'
import '@fontsource/lato/400.css'
import { COLOR_INPUT_BG, FONDO, FONDO_COMPONENTES, ORANGE } from '../../styles/colors'
import { useAuthStore } from '../../store/authStore'
import Spinner from '../../components/feedback/Spinner'
import { Eye, EyeOff } from 'lucide-react'
import { getUserInfo } from '../../helpers/getuserInfo'
import { conectarSocket } from '../../helpers/socket' 

export default function Login(): React.JSX.Element {
  const navigate = useNavigate()
  const { login, loading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false) 

   const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
      const user = await getUserInfo()
      const establecimientoId = user.establecimiento_id
      if (establecimientoId) {
        await conectarSocket(establecimientoId)
        console.log(`Socket conectado para el establecimiento: ${establecimientoId}`)
      } else {
        console.error(
          'ID de establecimiento no encontrado. El socket NO se pudo conectar.'
        )
      }
      if (user.rol === 'COCINERO') {
        navigate('/cocina')
      } else if (user.rol === 'MESERO') {
        navigate('/mesero')
      } else {
        navigate('/pedidos')
      }

    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    }
  }
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: FONDO,
          fontFamily: 'Lato, sans-serif'
        }}
      >
        <div
          style={{
            display: 'flex',
            borderRadius: 24,
            overflow: 'hidden',
            backgroundColor: FONDO_COMPONENTES,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Imagen izquierda */}
          <div style={{ width: 320, height: 'auto' }}>
            <img
              src="foto_login.avif"
              alt="login"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>

          {/* Formulario */}
          <div
            style={{
              padding: 32,
              width: 420, 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <h1
              style={{
                fontSize: 28, 
                fontWeight: 600,
                color: '#333',
                textAlign: 'center',
                marginBottom: 2
              }}
            >
              Gastro POS
            </h1>

            <div
              style={{
                display: 'flex ',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 32,
                gap: 8
              }}
            >
              <span style={{ fontSize: 14, color: '#666' }}>
                Desarrollado por Quality Soft Service
              </span>
              <img
                src="icon.png"
                alt="Logo"
                style={{ width: 30, height: 30, objectFit: 'contain' }}
              />
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 28 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 16,
                    fontWeight: 500,
                    color: '#555',
                    marginBottom: 10
                  }}
                >
                  Usuario
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@lacava.com"
                  style={{
                    height: 48, 
                    width: '100%',
                    padding: '0 18px',
                    border: `1px solid ${ORANGE}`,
                    borderRadius: 25,
                    fontSize: 15,
                    color: '#2A2A2A',
                    backgroundColor: COLOR_INPUT_BG,
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 28, position: 'relative' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 16,
                    fontWeight: 500,
                    color: '#555',
                    marginBottom: 10
                  }}
                >
                  Contraseña
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    height: 48,
                    width: '100%',
                    padding: '0 40px 0 18px', // espacio para el icono
                    border: `1px solid ${ORANGE}`,
                    borderRadius: 25,
                    fontSize: 15,
                    color: '#2A2A2A',
                    backgroundColor: COLOR_INPUT_BG,
                    boxSizing: 'border-box'
                  }}
                  required
                />
                {/* Icono de ojo */}
                <div
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 16,
                    top: '70%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    color: ORANGE,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24
                  }}
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </div>
              </div>

              <button
                type="submit"
                style={{
                  backgroundColor: ORANGE,
                  color: 'white',
                  width: '100%',
                  height: 46, 
                  marginTop: 12,
                  padding: '10px 16px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: 25,
                  fontSize: 16,
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                  transition: 'box-shadow 0.3s ease'
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.boxShadow = '0 6px 14px rgba(0, 0, 0, 0.15)')
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.1)')
                }
              >
                Ingresar
              </button>

              {error && (
                <p style={{ color: 'red', textAlign: 'center', marginTop: 16, fontSize: 14 }}>
                  {error}
                </p>
              )}
            </form>

            {/* Términos y Condiciones */}
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <a
                onClick={() => navigate('/terminos')}
                style={{
                  fontSize: 14,
                  color: ORANGE,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Términos y Condiciones
              </a>
            </div>
          </div>
        </div>
        {loading && <Spinner />}
      </div>
    </>
  )
}

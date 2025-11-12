import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore, UsuarioData } from '../store/authStore'
import { useConfirm } from '../components/confirmModal'
import { getUserInfo } from '../helpers/getuserInfo'
import { LogOut, User } from 'lucide-react'
import { useEstablecimientosStore } from '../store/establecimientoStore'

interface GlobalHeaderProps {}

const GlobalHeader = ({}: GlobalHeaderProps) => {
  const confirm = useConfirm()
  const { establecimientoActual, traerEstablecimientoPorId } = useEstablecimientosStore()
  const { logout } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<UsuarioData>()
  const navigate = useNavigate()
  const location = useLocation()
  const menuRef = useRef<HTMLDivElement>(null)
  const mostrarHeaderGlobal = location.pathname !== '/'
  if (!mostrarHeaderGlobal) return null

  const getUser = async () => {
    const user = await getUserInfo()
    if (!user) return
    traerEstablecimientoPorId(user.establecimiento_id)
    setUser(user)
  }

  useEffect(() => {
    getUser()
  }, [])

  // Cierra el menú si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const confirmado = await confirm({
      title: '¿Deseas cerrar sesión?',
      description: 'Deberás volver a ingresar tus credenciales',
      confirmText: 'Cerrar sesión',
      cancelText: 'Cancelar'
    })
    if (confirmado) {
      logout()
      navigate('/')
    }
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 999,
        backgroundColor: '#fff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 16px',
        height: '60px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem' // equivale a space-x-6
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            lineHeight: '1' // leading-none
          }}
        >
          <a
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: '1.5rem',
              fontWeight: '800', // font-bold
              letterSpacing: '0.05em', // tracking-wide
              padding: '0.5rem 0.75rem', // px-3 py-2
              borderRadius: '0.5rem', // rounded-lg
              color: 'inherit',
              textDecoration: 'none',
              transition: 'color 0.2s, background-color 0.2s' // transition-colors duration-200
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <span
              style={{
                background: 'linear-gradient(to right, #000000 5%, #FF6600 95%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Gastro POS
            </span>

            <span
              style={{
                fontSize: '10px',
                color: '#6b7280',
                marginTop: '5px'
              }}
            >
              Construya con liquidez. Facture con Quality
            </span>
          </a>
        </div>
      </div>

      {/* Lado izquierdo: Nombre del establecimiento */}

      {/* Lado derecho: Usuario + Imagen */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}
        ref={menuRef}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            position: 'relative'
          }}
          ref={menuRef}
        >
          {/* Establecimiento */}
          <span
            style={{
              marginTop: '4px',
              display: 'inline-block',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              fontSize: '0.7rem',
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: '9999px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%'
            }}
            title={user?.nombre_establecimiento}
          >
            {user?.nombre_establecimiento}
          </span>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              maxWidth: '16rem',
              textAlign: 'right'
            }}
          >
            {/* Nombre del usuario */}
            <span
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#111827',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {user?.username}
            </span>

            {/* Rol */}
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 400,
                color: '#6B7280',
                lineHeight: 1.2
              }}
            >
              {user?.rol}
            </span>
          </div>

          {/* Avatar / Logo */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f3f4f6',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {establecimientoActual?.logo_url ? (
              <img
                src={establecimientoActual.logo_url}
                alt="Logo Establecimiento"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <User size={18} />
            )}
          </button>
        </div>

        {/* Dropdown */}
        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '200px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-in-out',
              zIndex: 50
            }}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>
              <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
                {user?.username}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>{user?.rol}</p>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#6B7280',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {user?.nombre_establecimiento}
              </p>
            </div>

            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                border: 'none',
                fontSize: '0.875rem',
                color: '#DC2626',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
      {/* <UpdateEstablecimientoImage
        isOpen={isUpdateImageOpen}
        onClose={() => setIsUpdateImageOpen(false)}
      /> */}
    </header>
  )
}

export default GlobalHeader

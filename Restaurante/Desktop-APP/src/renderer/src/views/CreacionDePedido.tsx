import { useLayoutEffect, useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { FONDO, ORANGE } from '../styles/colors'
import { ArrowLeft, MapPin, Phone, Pizza, RefreshCcw, Search, User, X } from 'lucide-react'
import InputField from '../components/InputField'
import { useProductosStore, IProductoConfigurableCompleto } from '../store/productosStore'
import { toast } from 'sonner'
import { usePedidosStore } from '../store/pedidosStore'
import { useMesasStore } from '../store/mesasStore'
import OrangeButton from '../components/OrangeButton'
import Spinner from '../components/feedback/Spinner'
// import SelectConSearch from '../components/SelectConSearch'
import { getUserInfo } from '../helpers/getuserInfo'
import { UsuarioData } from './ListaDePedidos'
import FormCambioMesa from '../components/FormCambioMesa'
import { useClienteStore } from '../store/clienteStore'
import { useFacturasStore } from '../store/facturasStore'

interface PedidoItem {
  id: string // id del producto
  itemId?: string // id del pedidoItem en la BD (solo en edición)
  nombre: string
  precio: number
  cantidad: number
  nota?: string
  categoria?: string
  tipo?: 'simple' | 'configurable'
  opcionesSeleccionadas?: { nombreOpcion: string; valor: string; precio: number }[]
}

export interface IFormPedidos {
  id?: string
  origen: string
  telefono: string
  nombre: string
  direccion: string
  idOrdenExterna: string
  mesa: string
}

const tiposDeOrigen = [
  {
    id: 'MESA',
    nombre: 'Servicio en el local',
    icon: 'mesa.svg',
    description: 'Servicio en el local'
  },
  {
    id: 'DOMICILIO',
    nombre: 'A Domicilio',
    icon: 'domiciliario.svg',
    description: 'Entrega a domicilio'
  },
  {
    id: 'PARA_LLEVAR',
    nombre: 'Para llevar',
    icon: 'para_llevar.svg',
    description: 'Pedidos para recoger'
  }
]

interface ModalConfigurableProps {
  producto: IProductoConfigurableCompleto | null
  onClose: () => void
  onAdd: (item: PedidoItem) => void
}

//MODAL, ESTE NO ES EL COMPONENTE PRINCIPAL
const ModalConfigurable = ({ producto, onClose, onAdd }: ModalConfigurableProps) => {
  if (!producto) {
    return <Spinner />
  }

  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>(() => {
    const initialState: Record<string, any> = {}
    producto.opciones.forEach((opcion) => {
      initialState[opcion.id] = opcion.es_multiple ? [] : null
    })
    return initialState
  })

  const handleOptionChange = (optionId: string, valor: any) => {
    const opcion = producto.opciones.find((opt) => opt.id === optionId)
    if (!opcion) return

    if (opcion.es_multiple) {
      setSelectedOptions((prev) => {
        const currentValues = prev[optionId] || []
        const isSelected = currentValues.some((v: any) => v.id === valor.id)
        const newValues = isSelected
          ? currentValues.filter((v: any) => v.id !== valor.id)
          : [...currentValues, valor]
        return {
          ...prev,
          [opcion.id]: newValues
        }
      })
    } else {
      setSelectedOptions((prev) => ({
        ...prev,
        [opcion.id]: valor
      }))
    }
  }

  const calculatePrice = () => {
    let finalPrice = Number(producto.precio_base)
    Object.values(selectedOptions).forEach((optionValue: any) => {
      if (Array.isArray(optionValue)) {
        optionValue.forEach((v: any) => (finalPrice += Number(v.precios?.[0]?.precio || 0)))
      } else if (optionValue) {
        finalPrice += Number(optionValue.precios?.[0]?.precio || 0)
      }
    })
    return finalPrice
  }

  const handleAddToOrder = () => {
    const finalPrice = calculatePrice()
    const opcionesSeleccionadas = Object.values(selectedOptions).flatMap((optionValue: any) => {
      if (Array.isArray(optionValue)) {
        return optionValue.map((v: any) => ({
          nombreOpcion: v.configuracion_opcion_id,
          valor: v.nombre,
          precio: Number(v.precios?.[0]?.precio || 0)
        }))
      } else if (optionValue) {
        return [
          {
            nombreOpcion: optionValue.configuracion_opcion_id,
            valor: optionValue.nombre,
            precio: Number(optionValue.precios?.[0]?.precio || 0)
          }
        ]
      }
      return []
    })
    const newPedidoItem: PedidoItem = {
      id: producto.id,
      nombre: producto.nombre,
      precio: finalPrice,
      cantidad: 1,
      tipo: 'configurable',
      opcionesSeleccionadas
    }
    onAdd(newPedidoItem)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          padding: 24,
          borderRadius: 12,
          width: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            border: 'none',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          <X size={24} />
        </button>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Configurar {producto.nombre}</h2>
        <hr style={{ borderColor: '#e5e7eb', marginBottom: 16 }} />
        <div style={{ padding: '0 8px' }}>
          <h3>Precio base: ${Number(producto.precio_base).toFixed(2)}</h3>
          {producto.opciones.map((opcion) => (
            <div key={opcion.id} style={{ marginBottom: 16 }}>
              <h4>{opcion.nombre}</h4>
              {opcion.es_multiple ? (
                <div>
                  {opcion.valores.map((valor: any) => (
                    <div key={valor.id}>
                      <input
                        type="checkbox"
                        id={valor.id}
                        checked={
                          selectedOptions[opcion.id]?.some((v: any) => v.id === valor.id) || false
                        }
                        onChange={() => handleOptionChange(opcion.id, valor)}
                      />
                      <label htmlFor={valor.id} style={{ marginLeft: 8 }}>
                        {valor.nombre} (+${Number(valor.precios?.[0]?.precio || 0).toFixed(2)})
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {opcion.valores.map((valor: any) => (
                    <div key={valor.id}>
                      <input
                        type="radio"
                        name={opcion.id}
                        id={`${opcion.id}-${valor.id}`}
                        checked={selectedOptions[opcion.id]?.id === valor.id}
                        onChange={() => handleOptionChange(opcion.id, valor)}
                      />
                      <label htmlFor={`${opcion.id}-${valor.id}`} style={{ marginLeft: 8 }}>
                        {valor.nombre} (+${Number(valor.precios?.[0]?.precio || 0).toFixed(2)})
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 24
          }}
        >
          <button style={confirmBtn} onClick={handleAddToOrder}>
            Agregar al pedido
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CreacionDePedidos() {
  const { mesa } = useParams<{ mesa?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { traerInfoCliente } = useClienteStore()
  const pedidoEditado = location.state?.pedido
  const {
    traerCategorias,
    categorias,
    traerProductos,
    productos,
    loading,
    traerProductoConfigurable
  } = useProductosStore()
  const { imprimirComanda, loading: loadingImprimir } = useFacturasStore()

  const { crearPedido, actualizarPedido, loading: loadingPedidos } = usePedidosStore()
  const { traerMesas, mesas } = useMesasStore()
  const [pedidoItems, setPedidoItems] = useState<PedidoItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isCambioMesaOpen, setIsCambioMesaOpen] = useState<boolean>(false)
  const [total, setTotal] = useState(0)
  const [readyCount, setReadyCount] = useState(0)
  const [activeCat, setActiveCat] = useState('Todas')
  const [searchMesaTerm, setSearchMesaTerm] = useState('')
  const categoriasConTodas = [{ id: 'TODAS', nombre: 'Todas' }, ...categorias]
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [showPdfModal, setShowPdfModal] = useState(false)

  const [infoPedido, setInfoPedido] = useState<IFormPedidos>({
    origen: '',
    telefono: '',
    nombre: '',
    direccion: '',
    idOrdenExterna: '',
    mesa: ''
  })
  const isEditing = !!pedidoEditado

  useEffect(() => {
    if (!pedidoEditado) return

    // Info principal
    setInfoPedido({
      id: pedidoEditado.id,
      origen: pedidoEditado.tipo_pedido,
      telefono: pedidoEditado.cliente_telefono || '',
      nombre: pedidoEditado.cliente_nombre || '',
      direccion: pedidoEditado.cliente_direccion || '',
      idOrdenExterna: '',
      mesa: pedidoEditado.mesa_id || ''
    })

    // Mapear items tratando de resolver product.id usando productos si está disponible
    const mappedItems: PedidoItem[] = (pedidoEditado.pedidoItems || []).map((it: any) => {
      // intentar encontrar el producto en la lista de productos (por producto_id, por nombre normalizado)
      const prod = productos.find((p: any) => {
        if (it.producto_id && p.id === it.producto_id) return true
        if (
          p.nombre &&
          it.nombre &&
          p.nombre.trim().toLowerCase() === it.nombre.trim().toLowerCase()
        )
          return true
        return false
      })

      return {
        id: prod ? prod.id : (it.producto_id ?? it.id), // si encontramos product -> asignamos su id
        itemId: it.id,
        nombre: it.nombre,
        precio: Number(it.precio) || (prod?.precio ?? 0),
        cantidad: Number(it.cantidad) || 1,
        nota: it.notas || '',
        categoria: prod?.categoria || '',
        tipo: it.tipo || 'simple',
        opcionesSeleccionadas: it.opciones || []
      }
    })

    setPedidoItems(mappedItems)

    // Si quieres que la vista muestre esa categoría al abrir edición, fuerza activeCat
    if (mappedItems.length) {
      const firstCat = mappedItems.find((mi) => mi.categoria)?.categoria
      if (firstCat) setActiveCat(firstCat)
    }
  }, [pedidoEditado, productos]) // IMPORTANTE: depende tambien de productos

  useEffect(() => {
    if (!infoPedido.telefono) return

    // validamos que el teléfono tenga al menos 7 dígitos antes de buscar
    if (infoPedido.telefono.replace(/\D/g, '').length < 7) return

    const timeout = setTimeout(async () => {
      try {
        const cliente = await traerInfoCliente(infoPedido.telefono)

        if (cliente) {
          setInfoPedido((prev) => ({
            ...prev,
            nombre: cliente.cliente_nombre || prev.nombre,
            direccion: cliente.cliente_direccion || prev.direccion
          }))
        }
      } catch (error) {
        console.error('Error buscando cliente:', error)
      }
    }, 400) // 600ms después de que deja de escribir

    return () => clearTimeout(timeout) // limpiar si sigue escribiendo
  }, [infoPedido.telefono])

  const [errors, setErrors] = useState({
    origen: false,
    telefono: false,
    direccion: false,
    nombre: false,
    idOrdenExterna: false,
    mesa: false
  })

  const [showConfigurableModal, setShowConfigurableModal] = useState(false)
  const [usuarioData, setUsuarioData] = useState<UsuarioData>()

  const [productoConfigurable, setProductoConfigurable] =
    useState<IProductoConfigurableCompleto | null>(null)

  const getUser = async () => {
    const user = await getUserInfo()
    if (!user) {
      return
    }
    setUsuarioData(user)
    setInfoPedido((prev) => ({
      ...prev,
      origen: user.rol === 'MESERO' ? 'MESA' : prev.origen
    }))
  }
  useEffect(() => {
    getUser()
  }, [])

  useEffect(() => {
    traerCategorias().then(() => {
      // cuando traiga categorias, agregamos "Todas" al inicio
      if (categorias.length > 0) {
        setActiveCat('Todas')
      }
    })
  }, [])

  useEffect(() => {
    traerProductos()
    traerMesas()
  }, [])

  useEffect(() => {
    if (categoriasConTodas.length > 0 && !activeCat) {
      setActiveCat(categoriasConTodas[0].nombre)
    }
  }, [categorias])

  useEffect(() => {
    const totalCount = pedidoItems.reduce((acc, cur) => acc + cur.cantidad * cur.precio, 0)
    setTotal(totalCount)
    setReadyCount(pedidoItems.length)
  }, [pedidoItems])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setInfoPedido((prev) => ({ ...prev, [name]: value }))
  }

  const handleCantidad = (item: any, delta: number) => {
    setPedidoItems((prev) => {
      const existing = prev.find((p) => p.id === item.id)
      if (existing) {
        const updated = prev
          .map((p) => (p.id === item.id ? { ...p, cantidad: Math.max(0, p.cantidad + delta) } : p))
          .filter((p) => p.cantidad > 0)
        return updated
      } else if (delta > 0) {
        return [...prev, { ...item, cantidad: 1, nota: '' }]
      }
      return prev
    })
  }

  const handleNotaChange = (id: string, nota: string) => {
    setPedidoItems((prev) => prev.map((p) => (p.id === id ? { ...p, nota } : p)))
  }

  const handleOpenConfigurableModal = async (id: string) => {
    setProductoConfigurable(null)
    setShowConfigurableModal(true)
    const data = await traerProductoConfigurable(id)
    setProductoConfigurable(data || null)
  }

  const handleAddToPedido = (newPedidoItem: PedidoItem) => {
    setPedidoItems((prev) => {
      const existing = prev.find((p) => p.id === newPedidoItem.id)
      if (existing && newPedidoItem.tipo === 'simple') {
        return prev.map((p) => (p.id === newPedidoItem.id ? { ...p, cantidad: p.cantidad + 1 } : p))
      }
      return [...prev, { ...newPedidoItem, cantidad: 1 }]
    })
  }

  const handleGenerarPedido = async () => {
    const newErrors = {
      origen: false,
      telefono: false,
      direccion: false,
      nombre: false,
      idOrdenExterna: false,
      mesa: false
    }

    let valid = true

    if (infoPedido.origen === '') {
      newErrors.origen = true
      toast.error('Selecciona un origen')
      valid = false
    }

    if (infoPedido.origen === 'DOMICILIO') {
      if (!infoPedido.telefono || infoPedido.telefono.replace(/\D/g, '').length < 7) {
        newErrors.telefono = true
        toast.error('Teléfono debe tener al menos 7 dígitos')
        valid = false
      }
      if (!infoPedido.nombre) {
        newErrors.nombre = true
        toast.error('Nombre es requerido')
        valid = false
      }
      if (!infoPedido.direccion) {
        newErrors.direccion = true
        toast.error('Dirección es requerida')
        valid = false
      }
    }

    if (infoPedido.origen === 'MESA') {
      if (!infoPedido.mesa) {
        newErrors.mesa = true
        toast.error('Número de mesa es requerido')
        valid = false
      }
    }

    setErrors(newErrors)

    if (!valid) return

    if (pedidoItems.length === 0) {
      toast.error('Agrega al menos un producto al pedido')
      return
    }

    const payloadProductos = pedidoItems.map((item) => ({
      id: item.id,
      nombre: item.nombre,
      cantidad: item.cantidad,
      precio: item.precio,
      nota: item.nota,
      opciones: item.tipo === 'configurable' ? item.opcionesSeleccionadas : undefined
    }))

    const pedido = {
      ...infoPedido,
      productos: payloadProductos,
      total
    }

    let idFactura = ''
    if (isEditing) {
      const factura = await actualizarPedido(pedido)
      idFactura = factura
    } else {
      const factura = await crearPedido(pedido)
      idFactura = factura
    }

    if (idFactura !== '') {
      const pdfBlob = await imprimirComanda(idFactura)
      if (pdfBlob instanceof Blob && pdfBlob.type === 'application/pdf') {
        const url = URL.createObjectURL(pdfBlob)
        setPdfUrl(url)
        setShowPdfModal(true)
      }
    }
  }

  const handleCancel = () => {
    navigate(-1)
  }

  useLayoutEffect(() => {
    document.title = `Mesa ${mesa ?? ''} – Hacer Pedido`
  }, [mesa])

  const items = productos.filter((it) => {
    const matchesSearch = it.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCat === 'Todas' || it.categoria === activeCat

    return matchesSearch && matchesCategory
  })

  const findCantidad = (productId: string) => {
    // match directo por id (ideal cuando el mapping funcionó)
    const byId = pedidoItems.find((p) => p.id === productId)
    if (byId) return byId.cantidad

    // fallback: si existe el producto en productos, intentar emparejar por nombre
    const prod = productos.find((p: any) => p.id === productId)
    if (!prod) return 0
    const byName = pedidoItems.find(
      (pi) => pi.nombre?.trim().toLowerCase() === prod.nombre?.trim().toLowerCase()
    )
    return byName?.cantidad || 0
  }

  const findNota = (productId: string) => {
    const byId = pedidoItems.find((p) => p.id === productId)
    if (byId) return byId.nota || ''
    const prod = productos.find((p: any) => p.id === productId)
    if (!prod) return ''
    const byName = pedidoItems.find(
      (pi) => pi.nombre?.trim().toLowerCase() === prod.nombre?.trim().toLowerCase()
    )
    return byName?.nota || ''
  }

  const filteredMesas = useMemo(() => {
    if (!searchMesaTerm) {
      return mesas
    }
    return mesas.filter((mesa) => mesa.nombre.toLowerCase().includes(searchMesaTerm.toLowerCase()))
  }, [mesas, searchMesaTerm])

  const tiposDeOrigenFiltrados = useMemo(() => {
    if (usuarioData?.rol === 'MESERO') {
      return tiposDeOrigen.filter((origen) => origen.id !== 'DOMICILIO')
    }
    return tiposDeOrigen
  }, [usuarioData])

  return (
    <div style={{ ...containerStyle, display: 'flex', gap: '24px' }}>
      {/* <input type="file" accept="application/pdf" onChange={handleFileChange} /> */}
      {/* columna izquierda */}
      <div style={{ flex: 3, minWidth: 0, maxWidth: '70%' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 32,
            padding: '16px 24px',
            backgroundColor: '#ffffff',
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            color: '#333'
          }}
        >
          <ArrowLeft
            size={24}
            onClick={() => navigate('/pedidos')}
            style={{ cursor: 'pointer', stroke: ORANGE }}
          />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#333', margin: 0 }}>
            {isEditing ? 'Actualizando' : 'Creando'} un Pedido
          </h1>
          <div style={totalStyle}>
            TOTAL: <span>${total.toFixed(2)}</span>
          </div>
        </header>

        {/* CARDS DE ORIGEN */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap', // permite que los botones bajen de línea
            gap: '1rem',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            marginTop: '1.5rem',
            width: '100%'
          }}
        >
          {tiposDeOrigenFiltrados.map((origen) => {
            const isActive = infoPedido.origen === origen.id
            const imgStyle = isActive ? { filter: 'invert(1)' } : {}

            return (
              <button
                key={origen.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column', // en móviles mejor columna
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  flex: '1 1 200px', // permite que los botones se reduzcan hasta 200px
                  maxWidth: '300px', // máximo ancho para pantallas grandes
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  transition: 'all 0.3s ease',
                  backgroundColor: isActive ? '#f97316' : '#ffffff', // naranja o blanco
                  color: isActive ? '#ffffff' : '#374151', // blanco o gris
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
                onClick={() => setInfoPedido((prev) => ({ ...prev, origen: origen.id }))}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '#f9fafb' // hover gris 50
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '#ffffff'
                }}
              >
                <img
                  src={origen.icon}
                  alt={origen.nombre}
                  width={80}
                  height={80}
                  style={imgStyle}
                />
                <h2
                  style={{
                    fontSize: '1rem',
                    fontWeight: '700'
                  }}
                >
                  {origen.nombre}
                </h2>
              </button>
            )
          })}
        </div>

        {/* INPUTS */}
        <div>
          {infoPedido.origen === 'DOMICILIO' && (
            <>
              <InputField
                label="Telefono"
                name="telefono"
                placeholder="Ingrese el numero de telefono"
                type="number"
                value={infoPedido.telefono}
                onChange={handleChange}
                max={15}
                min={7}
                error={errors.telefono}
                icon={Phone}
              />
              <InputField
                label="Nombre"
                name="nombre"
                placeholder="Ingrese el nombre de la persona"
                value={infoPedido.nombre}
                onChange={handleChange}
                error={errors.nombre}
                icon={User}
              />
              <InputField
                label="Direccion"
                placeholder="Ingrese la direccion"
                name="direccion"
                value={infoPedido.direccion}
                onChange={handleChange}
                error={errors.direccion}
                icon={MapPin}
              />
            </>
          )}

          {/* //En caso de ser origen mesa */}
          {infoPedido.origen === 'MESA' && pedidoEditado?.tipo_pedido !== 'MESA' && (
            <>
              {mesas.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <h1 style={{ fontSize: 18, color: '#B91C1C', margin: 0 }}>
                    No hay mesas disponibles
                  </h1>
                  <button
                    onClick={() => {
                      toast.success('Recargando..')
                      traerMesas()
                    }}
                    style={{
                      background: '#F3F4F6',
                      border: '1px solid #D1D5DB',
                      borderRadius: 8,
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCcw size={16} />
                    Recargar
                  </button>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      width: '100%',
                      marginTop: '1.5rem',
                      marginBottom: '1.5rem'
                    }}
                  >
                    <div style={{ position: 'relative', width: '30%' }}>
                      <Search
                        size={18}
                        style={{
                          position: 'absolute',
                          right: 15,
                          top: '50%',
                          transform: 'translateY(-00%)',
                          color: '#999',
                          pointerEvents: 'none'
                        }}
                      />
                      <InputField
                        label="Buscar mesa"
                        type="text"
                        placeholder="Buscar mesa..."
                        value={searchMesaTerm}
                        onChange={(e) => setSearchMesaTerm(e.target.value)}
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        justifyContent: 'center'
                      }}
                    >
                      {filteredMesas.map((mesaItem) => {
                        const isSelected = infoPedido.mesa === mesaItem.id
                        const imgClassName = isSelected ? 'invert' : ''
                        return (
                          <button
                            key={mesaItem.id}
                            onClick={() =>
                              setInfoPedido((prev) => ({ ...prev, mesa: mesaItem.id }))
                            }
                            style={{
                              padding: '0.75rem 1rem',
                              minWidth: 100,
                              minHeight: 50,
                              borderRadius: '0.75rem',
                              border: '1px solid #ccc',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              backgroundColor: isSelected ? ORANGE : 'white',
                              color: isSelected ? 'white' : '#333',
                              boxShadow: isSelected ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
                              transition: 'all 0.2s ease-in-out'
                            }}
                          >
                            <img
                              src="mesa.svg"
                              alt="Mesa"
                              width={60}
                              height={60}
                              className={imgClassName}
                            />

                            {mesaItem.nombre}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {pedidoEditado?.tipo_pedido === 'MESA' && (
            <div
              style={{
                marginTop: 12,
                marginBottom: 12
              }}
            >
              <h1>Editando el pedido de la mesa: {pedidoEditado.mesa_numero}</h1>
              <OrangeButton label="Cambiar de mesa?" onClick={() => setIsCambioMesaOpen(true)} />
            </div>
          )}

          <FormCambioMesa
            isOpen={isCambioMesaOpen}
            onClose={() => setIsCambioMesaOpen(false)}
            pedidoId={pedidoEditado?.id}
          />

          {['RAPPIFOODS', 'UBEREATS', 'DIDIFOODS', 'GLOVOFOODS'].includes(infoPedido.origen) && (
            <InputField
              label="Id orden externa"
              name="idOrdenExterna"
              value={infoPedido.idOrdenExterna}
              onChange={handleChange}
              error={errors.idOrdenExterna}
            />
          )}
        </div>

        {/* CATEGORIAS */}
        <div
          style={{
            borderBottom: '1px solid #E5E7EB',
            backgroundColor: '#F9FAFB',
            padding: '16px 0',
            marginBottom: 24
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 16px',
              marginBottom: 12
            }}
          >
            <Pizza size={20} color="#F97316" />
            <span
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: '#374151'
              }}
            >
              Categorías
            </span>
          </div>

          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              height: 100,
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              padding: '0 16px'
            }}
          >
            {categoriasConTodas.map((cat) => (
              <button
                key={cat.id}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: activeCat === cat.nombre ? '#F97316' : '#fff',
                  color: activeCat === cat.nombre ? '#fff' : '#374151',
                  border: activeCat === cat.nombre ? 'none' : '1px solid #D1D5DB',
                  boxShadow:
                    activeCat === cat.nombre
                      ? '0 2px 4px rgba(249,115,22,0.3)'
                      : '0 1px 2px rgba(0,0,0,0.05)'
                }}
                onClick={() => setActiveCat(cat.nombre)}
              >
                {cat.nombre}
              </button>
            ))}
          </nav>
        </div>

        {/* BARRA DE BUSQUEDA */}
        <div
          style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24, width: '25%' }}
        >
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                right: 15,
                top: '50%',
                transform: 'translateY(-00%)',
                color: '#999',
                pointerEvents: 'none'
              }}
            />
            <InputField
              label="Buscar producto"
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value
                setSearchTerm(value)
                if (value.trim() !== '') {
                  setActiveCat('Todas') // 🔥 activa automáticamente "Todas"
                }
              }}
            />
          </div>
        </div>

        {/* Seccion de items */}
        <section style={{ ...itemsGrid, userSelect: 'none' }}>
          {items.map((item) => {
            const isConfigurable = item.tipo === 'configurable'
            const itemPrecio = isConfigurable ? item.precio : item.precio

            return (
              <div
                key={item.id}
                onClick={() => !isConfigurable && handleAddToPedido(item)}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '12px',
                  padding: '16px',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}
              >
                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>{item.nombre}</h2>

                {isConfigurable ? (
                  <>
                    <div style={{ fontSize: 14, color: '#555' }}>
                      Precio desde: ${Number(itemPrecio).toFixed(2)}
                    </div>
                    <button
                      style={configureButtonStyle}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenConfigurableModal(item.id)
                      }}
                    >
                      Configurar
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 14, color: '#555' }}>
                      Precio: ${Number(item.precio).toFixed(2)}
                    </div>
                    <div style={qtyControls}>
                      <button
                        style={qtyButton}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCantidad(item, -1)
                        }}
                      >
                        -
                      </button>
                      <div onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          min={0}
                          value={findCantidad(item.id) || ''}
                          onChange={(e) => {
                            e.stopPropagation()
                            const cantidad = parseInt(e.target.value, 10) || 0
                            setPedidoItems((prev) => {
                              const exists = prev.find((p) => p.id === item.id)
                              if (exists) {
                                return prev
                                  .map((p) =>
                                    p.id === item.id ? { ...p, cantidad: Math.max(0, cantidad) } : p
                                  )
                                  .filter((p) => p.cantidad > 0)
                              } else if (cantidad > 0) {
                                return [...prev, { ...item, cantidad, nota: '' }]
                              }
                              return prev
                            })
                          }}
                          style={{
                            width: '80px',
                            textAlign: 'center',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #ccc'
                          }}
                        />
                      </div>
                      <button
                        style={qtyButton}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddToPedido(item)
                        }}
                      >
                        +
                      </button>
                    </div>
                  </>
                )}

                {findCantidad(item.id) > 0 && (
                  <textarea
                    style={noteInput}
                    placeholder="Nota (sin azúcar, etc.)"
                    value={findNota(item.id)}
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                    onChange={(e) => {
                      e.stopPropagation()
                      handleNotaChange(item.id, e.target.value)
                    }}
                  />
                )}
              </div>
            )
          })}
        </section>

        <footer style={footerStyle}>
          <OrangeButton label="Cancelar" onClick={handleCancel} variacion="claro" />
          <button
            style={confirmBtn}
            onClick={handleGenerarPedido}
            disabled={loading || loadingPedidos || loadingImprimir}
          >
            {isEditing ? 'Editar' : 'Generar'} Pedido ({readyCount} ítems)
          </button>
        </footer>

        {(loading || loadingPedidos || loadingImprimir) && <Spinner />}

        {showConfigurableModal && (
          <ModalConfigurable
            producto={productoConfigurable}
            onClose={() => setShowConfigurableModal(false)}
            onAdd={handleAddToPedido}
          />
        )}
      </div>
      {/* Columna derecha (resumen del pedido) */}
      <aside style={{ ...pedidoAsideStyle, maxHeight: '95vh' }}>
        <h2 style={{ margin: 0, marginBottom: 16 }}>Resumen del pedido</h2>

        {/* Este es ahora el contenedor scrolleable */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: 8,
            // importante: dejar espacio para que el último ítem no quede tapado por el sticky
            paddingBottom: STICKY_HEIGHT + 8
          }}
        >
          {pedidoItems.length === 0 ? (
            <p style={{ color: '#666', margin: 0 }}>No hay productos en el pedido</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {pedidoItems.map((item, idx) => (
                <li
                  key={item.id + (item.itemId || '')}
                  style={{
                    borderBottom: idx === pedidoItems.length - 1 ? 'none' : '1px solid #eee',
                    padding: '8px 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    margin: 0
                  }}
                >
                  <div>
                    <strong>{item.nombre}</strong>
                    <div style={{ fontSize: 12, color: '#666', lineHeight: 1.2 }}>
                      Cantidad: {item.cantidad}
                      {item.nota && <div style={{ marginTop: 4 }}>📝 {item.nota}</div>}
                      {(item?.opcionesSeleccionadas?.length ?? 0) > 0 && (
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                          {(item.opcionesSeleccionadas ?? []).map((opt, idx2) => (
                            <li key={idx2} style={{ margin: 0 }}>
                              {opt.valor} (+${opt.precio})
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div>${(item.precio * item.cantidad).toFixed(2)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          style={{
            position: 'sticky',
            bottom: 0,
            background: '#fff',
            padding: '12px 16px',
            borderTop: '2px solid #eee',
            zIndex: 20
          }}
        >
          <h3 style={{ margin: 0 }}>Total: ${total.toFixed(2)}</h3>
        </div>
      </aside>

      {showPdfModal && pdfUrl && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              backgroundColor: '#fff',
              width: '80%',
              height: '80%',
              borderRadius: 8,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ padding: 8, textAlign: 'right' }}>
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 18,
                  cursor: 'pointer'
                }}
                onClick={async (e) => {
                  e.stopPropagation()
                  setShowPdfModal(false)
                  const user = await getUserInfo()
                  if (user.rol === 'MESERO') {
                    navigate('/mesero')
                  } else {
                    navigate('/pedidos')
                  }
                }}
              >
                ✖
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <iframe
                src={pdfUrl}
                width="100%"
                height="100%"
                title="Factura PDF"
                style={{ border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const STICKY_HEIGHT = 56

const pedidoAsideStyle: React.CSSProperties = {
  position: 'sticky', // 👈 se queda pegado
  flex: 1,
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 16,
  paddingBottom: 0, // <-- importantísimo: quitar padding bottom del aside
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  maxHeight: '99vh',
  overflowY: 'auto',
  top: 32
}

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: FONDO,
  fontFamily: 'Lato, sans-serif',
  padding: 32,
  boxSizing: 'border-box'
}

const totalStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: '#333'
}

const itemsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 24,
  marginBottom: 24
}

const noteInput: React.CSSProperties = {
  width: '100%',
  border: '1px solid #D1D5DB',
  borderRadius: 8,
  padding: '8px',
  fontSize: 14,
  resize: 'vertical',
  marginTop: 8
}

const footerStyle: React.CSSProperties = {
  position: 'sticky', // 👈 se queda pegado
  bottom: 0, // 👈 en la parte inferior
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 32,
  padding: '16px 24px',
  backgroundColor: '#fff', // 👈 importante para que no se vea el fondo detrás
  borderTop: '1px solid #E5E7EB',
  zIndex: 100 // 👈 asegúrate de que quede por encima de cards
}

const confirmBtn: React.CSSProperties = {
  backgroundColor: ORANGE,
  color: '#fff',
  padding: '12px 24px',
  fontSize: 16,
  fontWeight: 600,
  border: 'none',
  borderRadius: 24,
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
}
const qtyControls = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  margin: '12px 0'
}

const qtyButton = {
  padding: '4px 10px',
  border: `1px solid ${ORANGE}`,
  borderRadius: 12,
  backgroundColor: '#fff',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  width: 32,
  height: 32,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}
const configureButtonStyle: React.CSSProperties = {
  width: '100%',
  marginTop: '12px',
  padding: '8px 16px',
  backgroundColor: ORANGE,
  color: '#fff',
  border: 'none',
  borderRadius: '12px',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer'
}

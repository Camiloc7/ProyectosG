'use client';

import React from 'react';
import Spinner from '@/components/feedback/Spinner';
import PrivateRoute from '@/helpers/PrivateRoute';
import SelectConSearch from '@/components/ui/selectConSearch';
import { useState, useEffect, useRef } from 'react';
import FormCreacionCliente from '@/features/clientes/formCreacionCliente';
import FormContrato from '@/features/Contratos/formContrato';
import BusquedaClienteModal from '@/features/clientes/busquedaCliente';
import BusquedaContrato from '@/features/Contratos/busquedaContrato';
import {
  validateSeleccionMultiple,
  validateEntradasNumericas,
  validateTextos,
} from './validations';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import TablaDeOrdenamiento from '@/components/ui/tablaDeOrdenamiento';
import { IoIosSearch } from 'react-icons/io';
import { FaRegCopy } from 'react-icons/fa';
import { Calendar, Check } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import DatePicker from 'react-datepicker';
import SimpleSelect from '@/components/ui/SimpleSelect';
import { useClientStore } from '@/store/useClientStore';
import { useFacturaStore } from '@/store/useFacturaStore';
import { useUserStore } from '@/store/useUser';
import { useContractStore } from '@/store/useContract';
import { useTiposDeOperacionStore } from '@/store/useTiposDeOperacionStore';
import { useMetodosDePagoStore } from '@/store/useMetodosDePago';
import { useConsecutivosStore } from '@/store/useConsecutivoStore';
import { useComprasStore } from '@/store/useComprasStore';
import { useItemStore } from '@/store/useItemStore';
import { DateTime } from 'luxon';
import { useRouter } from 'next/navigation';
// import CookieBanner from '@/components/feedback/cookieBanner';
import ModalReviewUX from '@/components/feedback/modalReviewUX';
import { confirm } from '@/components/feedback/ConfirmOption';
import FormItemDeVenta from '@/features/itemsDeVenta/FormItemVenta';
import LoadingBar from '@/components/feedback/LoadingBar';
// import { useFacturaPersistStore } from '@/store/useFacturaPersistStore';
import { showErrorToast } from '@/components/feedback/toast';
import { useFacturaPersistStore } from '@/store/useFacturaPersistStore';
import { useMixtaPersistStore } from '@/store/Persist/useMixtaPersistStore';

const yesOrNo: string[] = ['Si', 'No'];
const listaDeItems = [
  { id: '1', nombre: 'CENA', total: 1000, porcentajeIva: 19 },
  { id: '2', nombre: 'ALMUERZO', total: 2000, porcentajeIva: 5 },
  { id: '3', nombre: 'DESAYUNO', total: 1500, porcentajeIva: 0 },
  { id: '4', nombre: 'MERIENDA', total: 500, porcentajeIva: 10 },
];
const tiposDeNegociacion: string[] = ['No especificado', 'Contado', 'Credito'];
const plazos: string[] = ['Manual', 'Catorcenal', 'Mensual'];

interface FormData {
  factura: string;
  valor: string;
  cantidad: string;
  acta: string;
  contrato: string;
  descripcionDelContrato: string;
  item: string;
  descripcionDelItem: string;
  descripcion: string;
  cliente: string;
  fecha: string;
  tipoDeNegociacion: string;
  vencimiento: string;
  observaciones: string;
  plazo: string;
  porcentajeSobreUtilidad: string;
  porcentajeDeAdministracion: string;
  ivaChecked: boolean;
  IVASobreUtilidad: string;
  adminChecked: boolean;
  adminValue: string;
  imprevistosChecked: boolean;
  imprevistos: string;
  retencionIvaChecked: boolean;
  retencionIva: string;
  retefuenteChecked: boolean;
  retefuente: string;
  reteicaChecked: boolean;
  retegarantiaChecked: boolean;
  anticipoChecked: boolean;
  reteica: string;
  retegarantia: string;
  anticipo: string;
  otrosDescuentosChecked: boolean;
  tipoDeFactura: string;
  resolucion: string;
  medioDePago: string;
  tipoDeOperacion: string;
  deseaCopiar: string;
  contratoChecked: boolean;
  itemChecked: boolean;
}

interface Errors {
  factura: boolean;
  valor: boolean;
  cantidad: boolean;
  acta: boolean;
  contrato: boolean;
  cliente: boolean;
  descripcionDelContrato: boolean;
  descripcion: boolean;
  observaciones: boolean;
  IVASobreUtilidad: boolean;
  porcentajeSobreUtilidad: boolean;
  porcentajeDeAdministracion: boolean;
  tipoDeNegociacion: boolean;
  items: boolean;
  plazo: boolean;
  imprevistos: boolean;
  retencionIva: boolean;
  retefuente: boolean;
  reteica: boolean;
  retegarantia: boolean;
  anticipo: boolean;
  resolucion: boolean;
  vencimiento: boolean;
}

interface Item {
  descripcion: string;
  cantidad: number;
  porcentajeIva: number;
  valorUnitario: number;
}

// Paso 1: Definir un tipo para formPrueba con una firma de índice
type FormPrueba = {
  [key: string]: any; // Firma de índice que permite acceder dinámicamente
  id_cliente: number;
  iva: boolean;
  administracion: boolean;
  imprevistos: boolean;
  retefuente: boolean;
  reteica: boolean;
  reteIVA: boolean;
  retegarantia: boolean;
  anticipo: boolean;
  anticipo2: boolean;
  contrato: number;
  electronica: boolean;
  electronica3: boolean;
  data_table: Array<{
    descripcion: string;
    valor: number;
    cantidad: number;
    porcentajeIva: number;
  }>;
  acta: string;
  cantidadDeDiasParaVencimiento: number;
  idresolucion: number;
  mediopago: string;
  negociacion: string;
  operacion: string;
  fecha: string | null;
  fecha_v: string | null;
  observaciones: string;
  porcentaje_iva: number;
  porcentaje_a: number;
  porcentaje_i: number;
  porcentaje_u: number;
  valor_rf: number;
  valor_ri: number;
  valor_ant: number;
};

export default function FacturacionMixta() {
  const {
    clientes,
    fetchClientes,
    loading: loadingClientes,
    error: errorClientes,
  } = useClientStore();
  const {
    vistaPreviaPDF,
    fetchFacturaById,
    loading: facturaLoading,
    error: errorEnvioFactura,
  } = useFacturaStore();
  const {
    contracts,
    fetchContracts,
    isLoading: loadingContratos,
    error: errorContratos,
  } = useContractStore();
  const {
    fetchTiposDeOperacion,
    tiposDeOperacion,
    loading: loadingTiposDeOperacion,
    error: errorTiposDeOperacion,
  } = useTiposDeOperacionStore();
  const {
    fetchMetodosDePago,
    nombresDeMetodosDePago,
    loading: loadingMetodosDePago,
    error: errorMetodosDePago,
  } = useMetodosDePagoStore();
  const {
    facturas,
    resoluciones,
    facturaInfo,
    fetchFacturas,
    loading: loadingFactura,
    loadingSend,
    error: errorFactura,
  } = useFacturaStore();

  const { sendMixtaData } = useMixtaPersistStore();
  const { fetchListaDeItems, listaDeItems } = useItemStore();
  const [items, setItems] = useState<Item[]>([]); //Almacena las filas
  const [openClientForm, setOpenClientForm] = useState<boolean>(false);
  const [openReviewUX, setOpenReviewUX] = useState<boolean>(false);
  const { infoDelUsuario, todaLaInfoUsuario, traerInfoDeUsuarios } =
    useUserStore();
  const { consecutivos } = useConsecutivosStore();
  const [modalDeEnDesarrolloAbierto, setModalDeEnDesarrolloAbierto] =
    useState<boolean>(false);
  const [openContratoForm, setOpenContratoForm] = useState<boolean>(false);
  const [idDeLaFacturaCopiar, setIdDeLaFacturaCopiar] = useState<string>('');
  const [idDelClienteCopiar, setIdDelClienteCopiar] = useState<string>('');
  const router = useRouter();

  const [openBusquedaClienteModal, setOpenBusquedaClienteModal] =
    useState<boolean>(false);
  const [openBusquedaContrato, setOpenBusquedaContrato] =
    useState<boolean>(false);

  const fechaUsuario = DateTime.now().setZone('local');
  const vencimiento = fechaUsuario.plus({ days: 1 });
  const fechaUsuarioStr = fechaUsuario.toFormat('yyyy-MM-dd');
  const vencimientoStr = vencimiento.toFormat('yyyy-MM-dd');

  const [formData, setFormData] = useState<FormData>({
    factura: '',
    valor: '',
    cantidad: '',
    acta: '',
    contrato: '',
    descripcionDelContrato: '',
    item: '',
    descripcionDelItem: '',
    descripcion: '',
    cliente: '',
    fecha: fechaUsuarioStr,
    tipoDeNegociacion: '',
    vencimiento: vencimientoStr,
    observaciones: '',
    plazo: '',
    porcentajeSobreUtilidad: '',
    ivaChecked: false,
    IVASobreUtilidad: '',
    porcentajeDeAdministracion: '',
    adminChecked: false,
    adminValue: '',
    imprevistosChecked: false,
    imprevistos: '',
    retencionIvaChecked: false,
    retefuenteChecked: false,
    reteicaChecked: false,
    retegarantiaChecked: false,
    anticipoChecked: false,
    retencionIva: '',
    retefuente: '',
    reteica: '',
    retegarantia: '',
    anticipo: '',
    otrosDescuentosChecked: false,
    tipoDeFactura: 'facturaElectronica',
    resolucion: '',
    medioDePago: 'Instrumento no definido',
    tipoDeOperacion: 'Genérica',
    deseaCopiar: '',
    contratoChecked: false,
    itemChecked: false,
  });

  const [errors, setErrors] = useState<Errors>({
    factura: false,
    cliente: false,
    tipoDeNegociacion: false,
    valor: false,
    cantidad: false,
    acta: false,
    contrato: false,
    descripcionDelContrato: false,
    descripcion: false,
    observaciones: false,
    porcentajeSobreUtilidad: false,
    IVASobreUtilidad: false,
    porcentajeDeAdministracion: false,
    items: false,
    vencimiento: false,
    plazo: false,
    imprevistos: false,
    retencionIva: false,
    retefuente: false,
    reteica: false,
    retegarantia: false,
    anticipo: false,
    resolucion: false,
  });

  const [showCalendarModal, setShowCalendarModal] = useState(false); // Estado para controlar la visibilidad del modal
  const inputRef = useRef<HTMLInputElement | null>(null);
  // const [showLoading, setShowLoading] = useState(false);

  const showLoading = useMixtaPersistStore((state) => state.showLoading);
  const startTime = useMixtaPersistStore((state) => state.startTime);
  const setShowLoading = useMixtaPersistStore((state) => state.setShowLoading);
  const handleIconClick = () => {
    setShowCalendarModal(true); // Muestra el modal al hacer clic en el ícono
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      // Convertir la fecha a UTC solo cuando se guarde
      const utcDate = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
      );
      setFormData((prev) => ({
        ...prev,
        vencimiento: utcDate.toISOString().split('T')[0], // Usar 'YYYY-MM-DD'
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        vencimiento: '', // En caso de null, dejar como cadena vacía
      }));
    }
    setShowCalendarModal(false); // Cierra el modal
  };

  const handleCopyClick = () => {
    if (!formData.factura) return;
    fetchFacturaById(idDeLaFacturaCopiar);
  };

  useEffect(() => {
    // Deshabilitar scroll cuando el formulario esté abierto
    if (openClientForm || openContratoForm) {
      document.body.style.overflow = 'hidden'; // Deshabilitar scroll
    } else {
      document.body.style.overflow = 'auto'; // Restaurar el scroll de manera explícita
    }

    // Cleanup: Restaurar el scroll al desmontar o cambiar el estado
    return () => {
      document.body.style.overflow = 'auto'; // Asegurarse de que siempre se restaure
    };
  }, [openClientForm, openContratoForm]);

  useEffect(() => {
    if (formData.tipoDeNegociacion === 'Contado') {
      setFormData((prev) => ({
        ...prev,
        vencimiento: formData.fecha,
      }));
    }
    if (formData.tipoDeNegociacion === 'No especificado') {
      setFormData((prev) => ({
        ...prev,
        vencimiento: vencimientoStr,
      }));
    }
  }, [formData.tipoDeNegociacion]);

  //Este evita que se pongan numeros al mover la rueda del mouse:
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      const activeElement = document.activeElement as HTMLInputElement | null;

      // Bloquear solo si el usuario está en un input de tipo number
      if (activeElement && activeElement.type === 'number' && !event.shiftKey) {
        event.preventDefault();
        activeElement.blur(); // Elimina el foco del input para evitar que siga cambiando
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  useEffect(() => {
    fetchClientes();
    fetchContracts();
    fetchFacturas();
    fetchContracts();
    fetchTiposDeOperacion();
    fetchMetodosDePago();
    traerInfoDeUsuarios();
    fetchListaDeItems();
  }, []);

  useEffect(() => {
    if (resoluciones && resoluciones.length > 0) {
      const ultimaResolucion = resoluciones[resoluciones.length - 1];

      if (ultimaResolucion && ultimaResolucion.id) {
        setFormData((prev) => ({
          ...prev,
          resolucion: ultimaResolucion.id,
        }));
      }
    }
  }, [resoluciones]);

  useEffect(() => {
    if (facturaInfo) {
      setFormData((prev) => ({
        ...prev,
        acta: facturaInfo.ACTA,
        contrato: facturaInfo.CONTRATO,
        tipoDeFactura:
          facturaInfo.ELECTRONICA === '1' ? 'facturaElectronica' : '',
        ivaChecked: facturaInfo.IVA !== '0' || facturaInfo.UTILIDAD !== '0',
        IVASobreUtilidad: facturaInfo.V_IVA || '',
        porcentajeSobreUtilidad: facturaInfo.UTILIDAD || '',
        adminChecked: facturaInfo.ADMINISTRACION !== '0',
        porcentajeDeAdministracion: facturaInfo.V_ADMINISTRACION || '',
        imprevistosChecked: facturaInfo.IMPREVISTOS !== '0',
        imprevistos: facturaInfo.V_IMPREVISTOS || '',
        retencionIvaChecked: facturaInfo.RETEIVA !== '0',
        retencionIva: facturaInfo.V_RETEIVA || '',
        retefuenteChecked: facturaInfo.RETEFUENTE !== '0',
        retefuente: facturaInfo.V_RETEFUENTE || '',
        reteicaChecked: facturaInfo.RETEICA !== '0',
        reteica: facturaInfo.V_RETEICA || '',
        retegarantiaChecked: facturaInfo.RETEGARANTIA !== '0',
        retegarantia: facturaInfo.V_RETEGARANTIA || '',
        anticipoChecked: facturaInfo.ANTICIPO !== '0',
        anticipo: facturaInfo.V_ANTICIPO || '',
        medioDePago: facturaInfo.OTROS !== '0' ? 'Otro' : 'No definido',
        observaciones: facturaInfo.OBSERVACIONES || '',
        cantidad: facturaInfo.cantidad1 || '',
        descripcionDelContrato: facturaInfo.descripcion1 || '',
        valor: facturaInfo.valor1 || '',
        codigo1: facturaInfo.codigo1 || '',
        cliente: facturaInfo.ID_CLIENTE || '',
      }));
    }
  }, [facturaInfo, clientes]); // Asegurarse de que los cambios en clientes se capturen.

  useEffect(() => {
    if (formData.plazo) {
      const currentDate = DateTime.now().setZone('local');
      let daysToAdd = 0;

      switch (formData.plazo) {
        case 'Catorcenal':
          daysToAdd = 14;
          break;
        case 'Mensual':
          daysToAdd = 30;
          break;
        default:
          daysToAdd = 0; // Si es "Manual" o cualquier otro valor
      }

      const newDate = currentDate.plus({ days: daysToAdd });
      const formattedDate = newDate.toISODate(); // Formato 'YYYY-MM-DD'

      setFormData((prev) => ({
        ...prev,
        vencimiento: formattedDate || '', // Asegurarse de que no sea null
      }));
    }
  }, [formData.plazo]);

  //Maneja todos los cambios en el form en tiempo real
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Actualizar datos del formulario
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validaciones mapeadas
    const validators: Record<string, (value: string) => boolean> = {
      cliente: validateSeleccionMultiple,
      tipoDeNegociacion: validateSeleccionMultiple,
      plazo: validateSeleccionMultiple,
      acta: validateTextos,
      contrato: validateSeleccionMultiple,
      descripcion: validateTextos,
      valor: validateEntradasNumericas,
      cantidad: validateSeleccionMultiple,
      IVASobreUtilidad: validateEntradasNumericas,
      porcentajeSobreUtilidad: validateEntradasNumericas,
      porcentajeDeAdministracion: validateEntradasNumericas,
      imprevistos: validateEntradasNumericas,
      retencionIva: validateEntradasNumericas,
      retefuente: validateEntradasNumericas,
      reteica: validateEntradasNumericas,
      retegarantia: validateEntradasNumericas,
      anticipo: validateEntradasNumericas,
      resoluciones: validateSeleccionMultiple,
      vencimiento: validateEntradasNumericas,
    };

    // Validar en tiempo real
    if (validators[name]) {
      setErrors((prev) => ({ ...prev, [name]: !validators[name](value) }));
    }
  };

  // Función para validar el formulario y actualizar los errores
  const validateForm = (): boolean => {
    const errorState = { ...errors }; // Copiar el estado actual de errores
    let isPlazoPresent = formData.tipoDeNegociacion === 'Credito';
    const isItemPresent = items.length > 0;

    // Resetear errores antes de la validación
    Object.keys(errorState).forEach((key) => {
      errorState[key as keyof Errors] = false;
    });

    // Validación de descripción: Si formData.descripcionDelContrato tiene algo, no se valida descripcion
    const isDescripcionValid =
      formData.descripcionDelContrato === '' // Solo valida si descripcionDelContrato está vacío
        ? isItemPresent || validateTextos(String(formData.descripcion)) // Si no hay descripcionDelContrato, valida descripcion
        : true; // Si hay descripcionDelContrato, no valida descripcion y la considera válida

    const isValorValid =
      isItemPresent || validateEntradasNumericas(formData.valor);
    const isCantidadValid =
      isItemPresent || validateSeleccionMultiple(formData.cantidad);
    const isPlazoValid = isPlazoPresent
      ? validateSeleccionMultiple(formData.plazo)
      : true;

    // const isIVASobreUtilidadValid = formData.ivaChecked
    //   ? validateEntradasNumericas(formData.IVASobreUtilidad)
    //   : true;
    // const isPorcentajeSobreUtilidadValid = formData.ivaChecked
    //   ? validateEntradasNumericas(formData.porcentajeSobreUtilidad)
    //   : true;

    // const isPorcentajeDeAdministracionValid = formData.adminChecked
    //   ? validateEntradasNumericas(formData.porcentajeDeAdministracion)
    //   : true;

    // const isImprevistoValid = formData.imprevistosChecked
    //   ? validateEntradasNumericas(formData.imprevistos)
    //   : true;

    const isRetencionIvaValid = formData.retencionIvaChecked
      ? validateEntradasNumericas(formData.retencionIva)
      : true;

    const isRetefuenteValid = formData.retefuenteChecked
      ? validateEntradasNumericas(formData.retefuente)
      : true;

    const isReteicaValid = formData.reteicaChecked
      ? validateEntradasNumericas(formData.reteica)
      : true;

    const isRetegarantiaValid = formData.retegarantiaChecked
      ? validateEntradasNumericas(formData.retegarantia)
      : true;

    const isAnticipoValid = formData.anticipoChecked
      ? validateEntradasNumericas(formData.anticipo)
      : true;

    // Validaciones siempre presentes
    const isClienteValid = validateSeleccionMultiple(formData.cliente);
    const isResolucionvalid = validateTextos(formData.resolucion);
    const isTipoDeNegociacionValid = validateSeleccionMultiple(
      formData.tipoDeNegociacion
    );
    const isActaValid = validateTextos(formData.acta);
    //const isContratoValid = validateSeleccionMultiple(formData.contrato);

    // Actualizar errores
    errorState.descripcion = !isDescripcionValid;
    errorState.valor = !isValorValid;
    errorState.cantidad = !isCantidadValid;
    errorState.plazo = !isPlazoValid;
    // errorState.IVASobreUtilidad = !isIVASobreUtilidadValid;
    // errorState.porcentajeSobreUtilidad = !isPorcentajeSobreUtilidadValid;
    // errorState.porcentajeDeAdministracion = !isPorcentajeDeAdministracionValid;
    // errorState.imprevistos = !isImprevistoValid;
    errorState.retencionIva = !isRetencionIvaValid;
    errorState.retefuente = !isRetefuenteValid;
    errorState.reteica = !isReteicaValid;
    errorState.retegarantia = !isRetegarantiaValid;
    errorState.anticipo = !isAnticipoValid;
    errorState.cliente = !isClienteValid;
    errorState.tipoDeNegociacion = !isTipoDeNegociacionValid;
    //errorState.acta = !isActaValid;
    //errorState.contrato = !isContratoValid;
    errorState.items = !isItemPresent;
    errorState.resolucion = !isResolucionvalid;

    setErrors(errorState);

    // Determinar si hay errores
    return (
      (!isItemPresent &&
        (!isDescripcionValid || !isValorValid || !isCantidadValid)) ||
      !isClienteValid ||
      !isTipoDeNegociacionValid ||
      //!isActaValid ||
      !isResolucionvalid ||
      //!isContratoValid ||
      !isItemPresent ||
      (isPlazoPresent && !isPlazoValid) ||
      // (formData.ivaChecked &&
      //   (!isIVASobreUtilidadValid || !isPorcentajeSobreUtilidadValid)) ||
      // (formData.adminChecked && !isPorcentajeDeAdministracionValid) ||
      // (formData.imprevistosChecked && !isImprevistoValid) ||
      (formData.retencionIvaChecked && !isRetencionIvaValid) ||
      (formData.retefuenteChecked && !isRetefuenteValid) ||
      (formData.reteicaChecked && !isReteicaValid) ||
      (formData.retegarantiaChecked && !isRetegarantiaValid) ||
      (formData.anticipoChecked && !isAnticipoValid)
    );
  };

  // Función para preparar los datos a enviar
  const prepareFormData = (): FormPrueba => {
    // Buscar el ID del contrato en la lista de contratos
    const contratoSeleccionado = contracts.find(
      (contrato) => contrato.nombre === formData.contrato
    );
    const contratoId = contratoSeleccionado ? contratoSeleccionado.id : 0; // Asignar 0 si no se encuentra

    const itemSeleccionado = listaDeItems.find(
      (item) => item.nombre === formData.item
    );
    const itemId = itemSeleccionado ? itemSeleccionado.id : 0; // Asignar 0 si no se encuentra

    return {
      id_cliente: Number(formData.cliente), // Siempre será un número (0 si no se encuentra)
      iva: formData.ivaChecked,
      administracion: formData.adminChecked,
      imprevistos: formData.imprevistosChecked,
      retefuente: formData.retefuenteChecked,
      reteica: formData.reteicaChecked,
      reteIVA: formData.retefuenteChecked,
      retegarantia: formData.retegarantiaChecked,
      anticipo: formData.anticipoChecked,
      anticipo2: formData.otrosDescuentosChecked,
      contrato: Number(formData.contrato), // Siempre será un número (0 si no se encuentra)
      item: Number(formData.item),
      esItem: itemId !== 0 && contratoId === 0,
      electronica: formData.tipoDeFactura === 'facturaElectronica',
      electronica3: formData.tipoDeFactura === 'facturaElectronicaContingencia',
      data_table: items.map((item) => ({
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        valor: item.valorUnitario,
        porcentajeIva: item.porcentajeIva,
      })),
      acta: formData.acta,
      cantidadDeDiasParaVencimiento: (() => {
        if (formData.plazo === 'Mensual') return 30;
        if (formData.plazo === 'Catorcenal') return 14;
        if (formData.plazo === 'Manual') {
          const inicio = DateTime.fromISO(formData.fecha).setZone('local');
          const vencimiento = DateTime.fromISO(formData.vencimiento).setZone(
            'local'
          );
          const diffTime = vencimiento.diff(inicio, 'days').days;
          return Math.ceil(diffTime); // Redondear al día más cercano
        }
        return 0;
      })(),
      idresolucion: Number(formData.resolucion),
      mediopago: formData.medioDePago,
      negociacion: formData.tipoDeNegociacion,
      operacion:
        formData.tipoDeOperacion === 'Genérica'
          ? 'Generica'
          : formData.tipoDeOperacion,
      fecha: formData.fecha
        ? DateTime.fromISO(formData.fecha).setZone('local').toISODate()
        : '', // Asegurarse de que no sea null
      fecha_v: formData.vencimiento
        ? DateTime.fromISO(formData.vencimiento).setZone('local').toISODate()
        : '', // Asegurarse de que no sea null

      observaciones: formData.observaciones,
      porcentaje_iva: Number(formData.IVASobreUtilidad),
      porcentaje_a: Number(formData.porcentajeDeAdministracion),
      porcentaje_i: Number(formData.imprevistos),
      porcentaje_u: Number(formData.porcentajeSobreUtilidad),
      valor_rf: Number(formData.retefuente),
      valor_ri: Number(formData.reteica),
      valor_ant: Number(formData.anticipo),
      valor_rg: Number(formData.retegarantia),
      valor_rIVA: Number(formData.retencionIva),
    };
  };

  // Refactorización de las funciones originales
  const handleSubmitButton = async (
    event: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    event.preventDefault();

    // if (validateForm()) {
    //   return;
    // }

    const formParaEnviar = prepareFormData();
    const confirmado = await confirm({
      title: 'Generar y enviar pdf?',
    });

    if (confirmado) {
      setShowLoading(true);
      await sendMixtaData(formParaEnviar, () => {});
    }

    const currentCount = parseInt(
      localStorage.getItem('facturasGeneradas') || '0',
      10
    );
  };

  const handleVistaPrevia = async (
    event: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    event.preventDefault();
    if (validateForm()) {
      showErrorToast('LLena los campos necesarios.');
      return;
    }

    const formParaEnviar = prepareFormData();

    await vistaPreviaPDF(formParaEnviar);
    const currentCount = parseInt(
      localStorage.getItem('facturasGeneradas') || '0',
      10
    );
  };

  const getItemName = (id: string) =>
    listaDeItems.find((item) => item.id === id)?.nombre;

  // const getItemIva = (id: string) =>
  //   listaDeItems.find((item) => item.id === id)?.porcentajeIva;

  const getItemIva = (id: string) =>
    listaDeItems.find((item) => item.id === id)?.porcentajeIva;

  const getContractName = (id: string) =>
    contracts.find((contract) => contract.id === id)?.nombre;

  //Este es el que agrega filas a la tabla
  const handleAddItem = () => {
    const errorState = { ...errors }; // Copiar el estado actual de errores

    // Resetear errores antes de la validación
    Object.keys(errorState).forEach((key) => {
      errorState[key as keyof Errors] = false;
    });

    const isClienteValid = validateSeleccionMultiple(formData.cliente);
    const isTipoDeNegociacionValid = validateSeleccionMultiple(
      formData.tipoDeNegociacion
    );
    const isValorValid = validateEntradasNumericas(formData.valor);
    const isCantidadValid = validateEntradasNumericas(formData.cantidad);
    const isDescripcionValid =
      formData.contrato !== '' ||
      formData.item !== '' ||
      validateTextos(formData.descripcion);

    // Actualizar errores
    errorState.cliente = !isClienteValid;
    errorState.tipoDeNegociacion = !isTipoDeNegociacionValid;
    errorState.descripcion = !isDescripcionValid;
    errorState.valor = !isValorValid;
    errorState.cantidad = !isCantidadValid;

    setErrors(errorState);

    // Determinar si hay errores
    const hasErrors =
      !isClienteValid ||
      !isTipoDeNegociacionValid ||
      !isDescripcionValid ||
      !isValorValid ||
      !isCantidadValid;

    if (hasErrors) {
      return;
    }

    const newItem: Item = {
      descripcion:
        getItemName(formData.item) ??
        getContractName(formData.contrato) ??
        'Descripción no disponible',
      cantidad: parseInt(formData.cantidad, 10) || 0,
      valorUnitario: parseFloat(formData.valor) || 0,
      porcentajeIva: Number(getItemIva(formData.item)) || 0,
    };

    setItems((prevItems) => [...prevItems, newItem]);
  };

  // Este es el que maneja los checkboxes
  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof FormData
  ) => {
    const { checked } = e.target;

    //Revisamos en el caso de contrato/item
    if (field === 'contratoChecked') {
      if (checked) {
        if (formData.itemChecked) {
          setFormData((prev) => ({ ...prev, [`itemChecked`]: false }));
          setFormData((prev) => ({ ...prev, item: '' }));
        }
      } else setFormData((prev) => ({ ...prev, contrato: '' }));
    }
    if (field === 'itemChecked') {
      if (checked) {
        if (formData.contratoChecked) {
          setFormData((prev) => ({ ...prev, [`contratoChecked`]: false }));
          setFormData((prev) => ({ ...prev, contrato: '' }));
        }
      } else setFormData((prev) => ({ ...prev, item: '' }));
    }

    setFormData((prev) => ({ ...prev, [field]: checked }));

    // Si se desmarca el checkbox, limpiamos el campo correspondiente
    if (!checked) {
      setFormData((prev) => ({ ...prev, [`${field}Value`]: '' }));
    }
  };

  const handleTipoDeFactura = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      tipoDeFactura: e.target.value,
    });
  };

  const handleContratoFormSubmit = (formData: Record<string, string>) => {
    setOpenContratoForm(false);
  };

  const handleBusquedaClienteSubmit = (formData: Record<string, string>) => {
    setOpenBusquedaClienteModal(false);
  };

  const handleBusquedaContratoSubmit = (formData: Record<string, string>) => {
    setOpenBusquedaContrato(false);
  };

  return (
    // Contenedor de la pagina
    <PrivateRoute>
      <LayoutAdmi>
        {/* <CookieBanner /> */}

        <div className="bg-[#F7F7F7] pt-12 p-6 sm:p-12 w-full overflow-hidden">
          {/* Contenedor principal */}
          <div className="w-full max-w-[1152px] h-auto rounded-[20px] flex justify-center px-4 sm:px-12 pb-14 mx-auto bg-white">
            {/* Contenedor Gestor de facturas */}
            <div className="w-full max-w-full md:max-w-[1061px] mt-8">
              {/* Primer contenedor */}
              <div className="h-auto">
                <h1 className="w-full md:w-auto h-10 text-3xl leading-9 font-bold font-montserrat text-[#6F6F6F] mb-4 sm:mb-6">
                  Facturación Electrónica Mixta
                </h1>
                <h2 className="w-full min-[525px]:mt-[20px] min-[309px]:mt-[60px] min-[1px]:mt-[80px] mt-14 text-base font-montserrat font-normal text-[#6F6F6F]">
                  {infoDelUsuario?.correo ?? 'Correo del usuario'}
                </h2>
                <div className="flex flex-col sm:flex-row mt-3 justify-between items-center text-center sm:text-left mb-6">
                  <h2 className="w-full sm:w-auto text-base font-montserrat font-normal text-[#6F6F6F]">
                    {`Factura anterior: ${
                      consecutivos?.anterior ?? 'No disponible'
                    }`}
                  </h2>
                  <h2 className="w-full sm:w-auto text-base font-montserrat font-normal text-[#6F6F6F]">
                    {`Factura siguiente: ${
                      consecutivos?.siguiente ?? 'No disponible'
                    }`}
                  </h2>

                  <h2 className="w-full sm:w-auto text-base font-montserrat font-normal text-[#6F6F6F]">
                    {resoluciones.find((res) => res.id === formData.resolucion)
                      ?.nombre || 'Resolución no encontrada'}
                  </h2>
                </div>
              </div>

              {/* Contenedor de inputs y selectores */}
              <div className="leading-[17.7px] font-montserrat font-normal text-[#6F6F6F] text-sm ">
                {/* Seccion desea copiar una factura */}
                <div className="mt-14 flex flex-col">
                  <label className="w-full h-auto text-sm leading-4">
                    ¿Desea copiar una factura existente?
                  </label>
                  <div className="relative mt-4">
                    <SimpleSelect
                      options={yesOrNo}
                      placeholder="Buscar una factura"
                      width={'100%'}
                      value={formData.deseaCopiar}
                      onChange={(value) => {
                        setFormData((prev) => ({
                          ...prev,
                          deseaCopiar: value,
                        }));
                        setErrors((prev) => ({ ...prev, deseaCopiar: !value }));
                      }}
                    />
                  </div>
                </div>

                {/* Muestra una lista de facturas para copiar*/}
                {formData.deseaCopiar === 'Si' && (
                  <div className="flex flex-col mt-4 w-full">
                    <label>
                      Factura
                      <span
                        className={`text-red-500 ${
                          errors.factura ? '' : 'invisible'
                        }`}
                      >
                        *
                      </span>
                    </label>
                    <div className="flex items-center w-full">
                      {/* SimpleSelect ajustado para alinearse bien con el botón */}
                      <div className="w-[88%]">
                        {loadingFactura ? (
                          <div>Cargando facturas...</div> // Indicador de carga dentro del select
                        ) : (
                          <SimpleSelect
                            options={facturas.map((factura) => factura.nombre)} // This should work now
                            width={'100%'}
                            value={formData.factura}
                            onChange={(nombreSeleccionado) => {
                              const facturaSeleccionada = facturas.find(
                                (factura) =>
                                  factura.nombre === nombreSeleccionado
                              ); // Busca el objeto completo basado en el nombre seleccionado

                              if (facturaSeleccionada) {
                                setFormData((prev) => ({
                                  ...prev,
                                  factura: facturaSeleccionada.nombre, // Guarda el ID de la factura seleccionada
                                }));
                                setIdDeLaFacturaCopiar(facturaSeleccionada.id);
                                setErrors((prev) => ({
                                  ...prev,
                                  factura: false,
                                })); // Eliminar el error si se selecciona una factura
                              } else {
                                setErrors((prev) => ({
                                  ...prev,
                                  factura: true,
                                })); // Si no hay factura seleccionada, mostrar error
                              }
                            }}
                            error={errors.factura}
                          />
                        )}
                      </div>

                      <button
                        className="w-10 ml-5 mt-4 h-10 flex-shrink-0 flex items-center justify-center rounded-[20px] border-[1px] border-[#00A7E1] hover:bg-blue-200 text-2xl leading-[2.5rem] text-[#C3C3C3]"
                        type="button"
                        onClick={handleCopyClick}
                      >
                        {/* <IoIosSearch className="text-lg" /> */}
                        <FaRegCopy className="text-base" />
                      </button>
                    </div>
                    {errors.factura && (
                      <p className="text-red-500 text-sm">
                        El campo es obligatorio.
                      </p>
                    )}
                  </div>
                )}

                {/* Cliente */}
                <div className="flex flex-col">
                  <div className="flex items-center w-full relative space-x-3">
                    {loadingClientes ? (
                      <div>Cargando opciones...</div>
                    ) : (
                      <div className="relative flex-1">
                        <SelectConSearch
                          label="Cliente"
                          options={clientes}
                          placeholder="Buscar un Cliente"
                          value={formData.cliente}
                          onChange={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              cliente: value,
                            }));

                            setErrors((prev) => ({
                              ...prev,
                              cliente: false, // No hay error al seleccionar el cliente
                            }));
                          }}
                          error={errors.cliente}
                          errorMessage="Debes seleccionar un cliente"
                        />
                      </div>
                    )}
                    <div className="mt-12 flex space-x-3">
                      {/* Botón de búsqueda */}
                      <button
                        className="w-10 h-10 ml-3 flex-shrink-0 flex items-center justify-center rounded-[20px] border-[1px] border-[#00A7E1] hover:bg-blue-200 text-2xl leading-[2.5rem] text-[#C3C3C3]"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setOpenBusquedaClienteModal(true);
                        }}
                      >
                        <IoIosSearch className="text-lg" />
                      </button>

                      {/* Botón de agregar cliente */}
                      <button
                        className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-[20px] border-[1px] border-[#00A7E1] hover:bg-blue-200 text-2xl leading-[2.5rem] text-[#C3C3C3]"
                        onClick={() => setOpenClientForm(true)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <BusquedaClienteModal
                    isOpen={openBusquedaClienteModal}
                    onClose={() => setOpenBusquedaClienteModal(false)}
                    onSubmit={handleBusquedaClienteSubmit}
                  />

                  <FormCreacionCliente
                    isOpen={openClientForm}
                    onClose={() => setOpenClientForm(false)}
                  />
                </div>

                {/* Campo Fecha y tipo de negociamiento */}
                <div className="flex flex-col md:flex-row justify-between gap-4 mt-4">
                  {/* Campo Fecha */}
                  <div className="w-full md:w-[50%]">
                    <label>Fecha</label>
                    <input
                      type="date"
                      name="fecha"
                      value={formData.fecha}
                      className="mt-4 w-full h-10 px-4 border border-[#00A7E1] rounded-[25px] text-[#C3C3C3] text-sm focus:ring-blue-300 focus:outline-none shadow-sm"
                      readOnly
                    />
                  </div>

                  {/* Campo Tipo de negociación */}
                  <div className="w-full md:w-[50%] ">
                    <label>
                      Tipo de negociación
                      <span
                        className={`text-red-500 ${
                          errors.tipoDeNegociacion ? '' : 'invisible'
                        }`}
                      >
                        *
                      </span>
                    </label>
                    <div className="relative mt-4">
                      <SimpleSelect
                        options={tiposDeNegociacion}
                        width={'100%'}
                        value={formData.tipoDeNegociacion}
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            tipoDeNegociacion: value,
                          }));
                          setErrors((prev) => ({
                            ...prev,
                            tipoDeNegociacion: !value,
                          }));
                        }}
                        error={errors.tipoDeNegociacion}
                      />
                    </div>
                    {errors.tipoDeNegociacion && (
                      <p className="text-red-500 text-sm">
                        El campo es obligatorio.
                      </p>
                    )}
                  </div>
                </div>

                {/* Plazo - solo se muestra si la opción es "Credito" */}
                {formData.tipoDeNegociacion === 'Credito' && (
                  <div className="flex flex-col mt-4">
                    <label className="">
                      Plazo
                      <span
                        className={`text-red-500 ${
                          errors.plazo ? '' : 'invisible'
                        }`}
                      >
                        *
                      </span>
                    </label>
                    <div className="mt-4">
                      <SimpleSelect
                        options={plazos}
                        width="100%"
                        value={formData.plazo}
                        onChange={(value) => {
                          setFormData((prev) => ({ ...prev, plazo: value }));
                          setErrors((prev) => ({ ...prev, plazo: false }));
                        }}
                        error={errors.plazo}
                      />
                    </div>
                    {errors.plazo && (
                      <p className="text-red-500 text-sm mt-1">
                        Debe seleccionar un plazo.
                      </p>
                    )}
                  </div>
                )}

                {/* Campo vencimiento */}
                <div className="flex-1 w-full relative mt-4">
                  <label>Vencimiento</label>
                  <div className="relative mt-4">
                    <input
                      ref={inputRef}
                      type="date"
                      name="vencimiento"
                      value={formData.vencimiento}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          vencimiento: e.target.value,
                        }))
                      }
                      className={`w-full h-10 px-4  pr-10 border ${
                        errors.vencimiento
                          ? 'border-red-500'
                          : 'border-[#00A7E1]'
                      } border-[#00A7E1] text-[#C3C3C3]
                      rounded-[25px] text-sm focus:ring-blue-300 focus:outline-none shadow-sm
                      appearance-none [&::-webkit-calendar-picker-indicator]:hidden`} // Eliminar el ícono predeterminado
                    />
                    <Calendar
                      onClick={() => {
                        if (formData.plazo === 'Manual') {
                          handleIconClick();
                        }
                      }}
                      className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                        formData.plazo !== 'Manual'
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-[#C3C3C3] cursor-pointer'
                      }`}
                    />
                  </div>
                  {errors.vencimiento && (
                    <p className="text-red-500 text-sm mt-1">
                      El campo es obligatorio.
                    </p>
                  )}

                  {/* Modal de selección de fecha */}
                  {showCalendarModal && (
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-[201]">
                      <div className="bg-white p-4 rounded-lg shadow-lg w-[90%] sm:w-[250px] md:w-[300px] lg:w-[350px] xl:w-[400px] justify-center">
                        <h2 className="text-center text-lg font-semibold mb-3">
                          Seleccionar Fecha
                        </h2>
                        <div className="justify-center text-center">
                          <DatePicker
                            selected={
                              formData.vencimiento
                                ? DateTime.fromISO(formData.vencimiento)
                                    .setZone('local') // Asegurarse de que la fecha esté en la zona horaria local
                                    .toJSDate() // Convertirlo a un objeto Date de JavaScript
                                : null
                            }
                            onChange={handleDateChange}
                            inline
                            className="border border-gray-300 rounded-lg shadow-sm w-full"
                          />
                        </div>
                        <button
                          onClick={() => setShowCalendarModal(false)}
                          className="mt-3 w-full bg-[#00A7E1] text-white py-2 rounded-xl hover:bg-[#0077c2]"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sección acta y contrato/item */}
                <div className="flex justify-between mb-[-20px]">
                  {/* Check Contrato */}
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.contratoChecked}
                      onChange={(e) =>
                        handleCheckboxChange(e, 'contratoChecked')
                      }
                      className="hidden"
                    />
                    <span className="flex items-center justify-center w-8 h-8 border border-[#00A7E1] rounded-xl cursor-pointer">
                      <span
                        className={`absolute w-3 h-3 rounded-full bg-[#00A7E1] transition-all duration-200 ${
                          formData.contratoChecked ? 'scale-100' : 'scale-0'
                        }`}
                      ></span>
                    </span>
                    <span className="text-sm ml-2  ">Contrato</span>
                  </label>

                  {/* Check Item */}
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.itemChecked}
                      onChange={(e) => handleCheckboxChange(e, 'itemChecked')}
                      className="hidden"
                    />
                    <span className="flex items-center justify-center w-8 h-8 border border-[#00A7E1] rounded-xl cursor-pointer">
                      <span
                        className={`absolute w-3 h-3 rounded-full bg-[#00A7E1] transition-all duration-200 ${
                          formData.itemChecked ? 'scale-100' : 'scale-0'
                        }`}
                      ></span>
                    </span>
                    <span className="text-sm ml-2  ">Item</span>
                  </label>

                  {/* Campo "Acta" */}
                  <div className="w-[50%] mt-4">
                    <label>
                      Acta
                      <span
                        className={` text-red-500 ${
                          errors.acta ? '' : 'invisible'
                        }`}
                      >
                        *
                      </span>
                    </label>
                    <div className="flex mt-4">
                      <input
                        type="text"
                        name="acta"
                        placeholder="Acta"
                        value={formData.acta}
                        className={`w-full h-10 px-4 border ${
                          errors.acta ? 'border-red-500' : 'border-[#00A7E1]'
                        } rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                        onChange={handleChange}
                      />
                      <button
                        className="w-10 ml-6 h-10 flex-shrink-0 flex items-center justify-center rounded-[20px] border-[1px] border-[#00A7E1] hover:bg-blue-200 text-sm leading-[2.5rem] text-[#C3C3C3]"
                        type="button"
                        onClick={() => setModalDeEnDesarrolloAbierto(true)}
                      >
                        <IoIosSearch className="text-lg" />
                      </button>
                      <button
                        className="w-10 ml-3 h-10 flex-shrink-0 flex items-center justify-center rounded-[20px] border-[1px] border-[#00A7E1] hover:bg-blue-200 text-2xl leading-[2.5rem] text-[#C3C3C3]"
                        type="button"
                        onClick={() => setModalDeEnDesarrolloAbierto(true)}
                      >
                        +
                      </button>
                    </div>
                    <div className="min-h-[1.5rem]">
                      {errors.acta && (
                        <p className="text-red-500 text-sm mt-1">
                          El campo es obligatorio.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Select "Contrato" */}
                {formData.contratoChecked && (
                  <div className="w-[50%]">
                    <div className="flex">
                      {loadingContratos ? (
                        <div className="w-full">Cargando opciones...</div>
                      ) : (
                        <div className="relative w-[80%]">
                          <SelectConSearch
                            label="Contrato"
                            options={contracts}
                            placeholder="Buscar un contrato"
                            value={formData.contrato}
                            onChange={(value) => {
                              setFormData((prev) => ({
                                ...prev,
                                contrato: value,
                              }));
                            }}
                            error={errors.contrato}
                            errorMessage="Debes seleccionar un contrato"
                          />
                        </div>
                      )}
                      <div className="mt-12 flex mr-3 ">
                        <button
                          className="w-10 ml-6 h-10 flex-shrink-0 flex items-center justify-center rounded-[20px] border-[1px] border-[#00A7E1] hover:bg-blue-200 text-sm leading-[2.5rem] text-[#C3C3C3]"
                          onClick={() => setOpenBusquedaContrato(true)}
                        >
                          <IoIosSearch className="text-lg" />
                        </button>
                        <BusquedaContrato
                          isOpen={openBusquedaContrato}
                          onClose={() => setOpenBusquedaContrato(false)}
                          onSubmit={handleBusquedaContratoSubmit}
                        />
                        <button
                          className="w-10 ml-3 h-10 flex-shrink-0 flex items-center justify-center rounded-[20px] border-[1px] border-[#00A7E1] hover:bg-blue-200 text-2xl leading-[2.5rem] text-[#C3C3C3]"
                          onClick={() => setOpenContratoForm(true)}
                        >
                          +
                        </button>
                        <FormContrato
                          isOpen={openContratoForm}
                          onClose={() => setOpenContratoForm(false)}
                          // onSubmit={handleContratoFormSubmit}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Select "Item" */}
                {formData.itemChecked && (
                  <div className="w-[50%]">
                    <div className="flex">
                      {loadingContratos ? (
                        <div className="w-full">Cargando opciones...</div>
                      ) : (
                        <div className="relative w-[80%]">
                          <SelectConSearch
                            label="Item"
                            options={listaDeItems}
                            placeholder="Buscar un item"
                            value={formData.item}
                            onChange={(value) => {
                              const selectedItem = listaDeItems.find(
                                (item) => item.id === value
                              );

                              setFormData((prev) => ({
                                ...prev,
                                item: value,
                                valor: selectedItem
                                  ? String(selectedItem.total)
                                  : '0', // Convertir total a string
                              }));

                              setErrors((prev) => ({
                                ...prev,
                                valor: false,
                              }));
                            }}
                            error={errors.items}
                            errorMessage="Debes seleccionar un item"
                          />
                        </div>
                      )}
                      {/* Busqueda o agregar item (por implementar) */}
                      <div className="mt-12 flex mr-3 ">
                        <button
                          className="w-10 ml-6 h-10 flex-shrink-0 flex items-center justify-center rounded-[20px] border-[1px] border-[#00A7E1] hover:bg-blue-200 text-sm leading-[2.5rem] text-[#C3C3C3]"
                          onClick={() => setOpenBusquedaContrato(true)}
                        >
                          <IoIosSearch className="text-lg" />
                        </button>
                        <BusquedaContrato
                          isOpen={openBusquedaContrato}
                          onClose={() => setOpenBusquedaContrato(false)}
                          onSubmit={handleBusquedaContratoSubmit}
                        />
                        <button
                          className="w-10 ml-3 h-10 flex-shrink-0 flex items-center justify-center rounded-[20px] border-[1px] border-[#00A7E1] hover:bg-blue-200 text-2xl leading-[2.5rem] text-[#C3C3C3]"
                          onClick={() => setOpenContratoForm(true)}
                        >
                          +
                        </button>
                        <FormItemDeVenta
                          isOpen={openContratoForm}
                          onClose={() => setOpenContratoForm(false)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Descripción de contrato o item */}
                <div className="mt-4">
                  <label>
                    Descripción del
                    {formData.itemChecked ? (
                      <label> item</label>
                    ) : (
                      <label> contrato</label>
                    )}
                  </label>
                  <div className="bg-gray-200 rounded-[20px] p-4 mt-2 text-gray-700">
                    {formData.contrato || formData.item ? (
                      <>
                        <h1>{getItemName(formData.item)}</h1>
                        <h1>{getContractName(formData.contrato)}</h1>
                      </>
                    ) : (
                      <h1 className="italic text-gray-500">
                        No hay descripción disponible
                      </h1>
                    )}
                  </div>
                </div>

                {/*campo descripción*/}
                <div className="mt-4">
                  <label className="">
                    Descripción
                    <span
                      className={`text-red-500 ${
                        errors.descripcion ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                  </label>
                  <textarea
                    name="descripcion"
                    placeholder="Descripcion "
                    value={formData.descripcion}
                    className={`w-full h-28 px-4 border rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm mt-4 ${
                      errors.descripcion ? 'border-red-500' : 'border-[#00A7E1]'
                    } placeholder-[#C3C3C3]`}
                    onChange={handleChange}
                  />
                  {errors.descripcion && (
                    <p className="text-red-500 text-sm mt-1">
                      El campo es obligatorio.
                    </p>
                  )}
                </div>

                {/* Campo Valor y cantidad */}
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-center mt-4">
                  {/* Campo "Valor" */}
                  <div className="w-full md:w-[50%]">
                    <label>
                      Valor
                      <span
                        className={`text-red-500 ${
                          errors.valor ? '' : 'invisible'
                        }`}
                      >
                        *
                      </span>
                    </label>
                    <input
                      type="number"
                      name="valor"
                      value={formData.valor}
                      placeholder="Subtotal antes de IVA"
                      className={`mt-4 w-full h-10 px-4 border ${
                        errors.valor ? 'border-red-500' : 'border-[#00A7E1]'
                      } rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                      onChange={handleChange}
                    />
                    {errors.valor && (
                      <p className="text-red-500 text-sm mt-1">
                        El campo es obligatorio.
                      </p>
                    )}
                  </div>

                  {/* Campo "Cantidad" */}
                  <div className="w-full md:w-[50%]">
                    <label>
                      Cantidad
                      <span
                        className={`text-red-500 ${
                          errors.cantidad ? '' : 'invisible'
                        }`}
                      >
                        *
                      </span>
                    </label>
                    <div className="flex mt-4 h-10 items-center">
                      <input
                        type="number"
                        name="cantidad"
                        value={formData.cantidad}
                        placeholder="Cantidad"
                        className={`w-full h-10 px-4 border ${
                          errors.cantidad
                            ? 'border-red-500'
                            : 'border-[#00A7E1]'
                        } rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                        onChange={handleChange}
                      />
                    </div>

                    {errors.cantidad && (
                      <p className="text-red-500 text-sm mt-1">
                        El campo es obligatorio.
                      </p>
                    )}
                  </div>
                </div>
                <div className="relative">
                  {/* Botón para agregar item */}
                  <button
                    onClick={(e) => {
                      e.preventDefault(); // Evita la recarga de la página
                      handleAddItem(); // Llama a la función de agregar el item
                    }}
                    className="absolute right-0 bg-[#00A7E1] font-bold text-white h-8 px-14 text-xs rounded-full hover:bg-[#008ec1]"
                  >
                    Agregar Item
                  </button>
                  {/* Tabla de items agregados */}
                  <TablaDeOrdenamiento
                    items={items}
                    onItemsChange={setItems}
                    onAddItem={handleAddItem}
                  />
                </div>
                {/* Mensaje de error si es que no  hay items*/}
                {errors.items && (
                  <p className="text-red-500 text-sm mt-1">
                    Debe agregar por lo menos un item.
                  </p>
                )}

                {/* Campo "Observaciones" */}
                <div className="mt-10">
                  <label className="">
                    Observaciones
                    <span
                      className={`text-red-500 ${
                        errors.observaciones ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                  </label>
                  <textarea
                    name="observaciones"
                    placeholder="Observaciones "
                    value={formData.observaciones}
                    className={`w-full h-28 px-4 border rounded-[25px]  font-montserrat text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm mt-4 ${
                      errors.observaciones
                        ? 'border-red-500'
                        : 'border-[#00A7E1]'
                    } placeholder-[#C3C3C3]`}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex flex-wrap mt-9 gap-x-4 gap-y-6">
                  {/* Columna Izquierda */}
                  <div className="flex flex-col w-full md:w-[48%]">
                    {/* IVA SOBRE UTILIDAD */}
                    <div className="">
                      <label className="flex items-center pointer-events-none">
                        <input
                          type="checkbox"
                          checked={formData.ivaChecked}
                          onChange={(e) =>
                            handleCheckboxChange(e, 'ivaChecked')
                          }
                          className="hidden"
                        />
                        <span className="flex items-center justify-center w-8 h-8 border border-[#00A7E1] rounded-xl cursor-pointer opacity-40">
                          <span
                            className={`absolute w-3 h-3 rounded-full bg-[#00A7E1] transition-all duration-200 ${
                              formData.ivaChecked ? 'scale-100' : 'scale-0'
                            }`}
                          ></span>
                        </span>
                        <span className="text-sm ml-2 text-gray-300">
                          IVA sobre utilidad
                          <span
                            className={`text-red-500 ${
                              errors.IVASobreUtilidad ? '' : 'invisible'
                            }`}
                          >
                            *
                          </span>
                        </span>
                      </label>

                      {formData.ivaChecked && (
                        <div className="">
                          <input
                            type="number"
                            name="IVASobreUtilidad"
                            placeholder="Valor"
                            value={formData.IVASobreUtilidad}
                            className={`mt-4 w-full h-10 px-4 border ${
                              errors.IVASobreUtilidad
                                ? 'border-red-500'
                                : 'border-[#00A7E1]'
                            }
                          rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                            onChange={handleChange}
                          />
                          {errors.IVASobreUtilidad && (
                            <p className="text-red-500 text-sm mt-1">
                              El campo es obligatorio.
                            </p>
                          )}
                          <div className="mt-7">
                            <span className="">Porcentaje sobre utilidad</span>
                            <input
                              type="number"
                              name="porcentajeSobreUtilidad"
                              placeholder="Porcentaje"
                              value={formData.porcentajeSobreUtilidad}
                              className={`mt-5 w-full h-10 px-4 border ${
                                errors.porcentajeSobreUtilidad
                                  ? 'border-red-500'
                                  : 'border-[#00A7E1]'
                              } rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                              onChange={handleChange}
                            />
                            {errors.porcentajeSobreUtilidad && (
                              <p className="text-red-500 text-sm mt-1">
                                El campo es obligatorio.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Porcentaje de Administración */}
                    <div className="mt-4">
                      <label className="flex items-center pointer-events-none">
                        <input
                          type="checkbox"
                          checked={formData.adminChecked}
                          onChange={(e) =>
                            handleCheckboxChange(e, 'adminChecked')
                          }
                          className="hidden"
                        />
                        <span className="flex items-center justify-center w-8 h-8 border border-[#00A7E1] rounded-xl cursor-pointer opacity-40">
                          <span
                            className={`absolute w-3 h-3 rounded-full bg-[#00A7E1] transition-all duration-200 ${
                              formData.adminChecked ? 'scale-100' : 'scale-0'
                            }`}
                          ></span>
                        </span>
                        <span className="text-sm ml-2 text-gray-300">
                          Porcentaje de Administración
                          <span
                            className={`text-red-500 ${
                              errors.porcentajeDeAdministracion
                                ? ''
                                : 'invisible'
                            }`}
                          >
                            *
                          </span>
                        </span>
                      </label>
                      {formData.adminChecked && (
                        <div>
                          <input
                            type="number"
                            name="porcentajeDeAdministracion"
                            placeholder="Porcentaje"
                            value={formData.porcentajeDeAdministracion}
                            className={`mt-4 w-full h-10 px-4 border ${
                              errors.porcentajeDeAdministracion
                                ? 'border-red-500'
                                : 'border-[#00A7E1]'
                            } rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                            onChange={handleChange}
                          />
                          {errors.porcentajeDeAdministracion && (
                            <p className="text-red-500 text-sm mt-1">
                              El campo es obligatorio.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Porcentaje de Imprevistos */}
                    <div className="mt-4">
                      <label className="flex items-center pointer-events-none">
                        <input
                          type="checkbox"
                          checked={formData.imprevistosChecked}
                          onChange={(e) =>
                            handleCheckboxChange(e, 'imprevistosChecked')
                          }
                          className="hidden"
                        />
                        <span className="flex items-center justify-center w-8 h-8 border border-[#00A7E1] rounded-xl cursor-pointer opacity-40">
                          <span
                            className={`absolute w-3 h-3 rounded-full bg-[#00A7E1] transition-all duration-200 ${
                              formData.imprevistosChecked
                                ? 'scale-100'
                                : 'scale-0'
                            }`}
                          ></span>
                        </span>
                        <span className="text-sm ml-2 text-gray-300">
                          Porcentaje de imprevistos
                          <span
                            className={`text-red-500 ${
                              errors.imprevistos ? '' : 'invisible'
                            }`}
                          >
                            *
                          </span>
                        </span>
                      </label>
                      {formData.imprevistosChecked && (
                        <div>
                          <input
                            type="number"
                            name="imprevistos"
                            placeholder="Porcentaje"
                            value={formData.imprevistos}
                            className={`mt-4 w-full h-10 px-4 border ${
                              errors.imprevistos
                                ? 'border-red-500'
                                : 'border-[#00A7E1]'
                            } rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                            onChange={handleChange}
                          />
                          {errors.imprevistos && (
                            <p className="text-red-500 text-sm mt-1">
                              El campo es obligatorio.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Retención por IVA */}
                    <div className="mt-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.retencionIvaChecked}
                          onChange={(e) =>
                            handleCheckboxChange(e, 'retencionIvaChecked')
                          }
                          className="hidden"
                        />
                        <span className="flex items-center justify-center w-8 h-8 border border-[#00A7E1] rounded-xl cursor-pointer">
                          <span
                            className={`absolute w-3 h-3 rounded-full bg-[#00A7E1] transition-all duration-200 ${
                              formData.retencionIvaChecked
                                ? 'scale-100'
                                : 'scale-0'
                            }`}
                          ></span>
                        </span>
                        <span className="text-sm ml-2  ">
                          Retencion Por IVA
                          <span
                            className={`text-red-500 ${
                              errors.retencionIva ? '' : 'invisible'
                            }`}
                          >
                            *
                          </span>
                        </span>
                      </label>
                      {formData.retencionIvaChecked && (
                        <div>
                          <input
                            type="number"
                            name="retencionIva"
                            placeholder="Porcentaje"
                            value={formData.retencionIva}
                            className={`mt-4 w-full h-10 px-4 border ${
                              errors.retencionIva
                                ? 'border-red-500'
                                : 'border-[#00A7E1]'
                            } rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                            onChange={handleChange}
                          />
                          {errors.retencionIva && (
                            <p className="text-red-500 text-sm mt-1">
                              El campo es obligatorio.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Columna Derecha */}
                  <div className="flex flex-col w-full md:w-[48%]">
                    {/* Retefuente */}
                    <div className="">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.retefuenteChecked}
                          onChange={(e) =>
                            handleCheckboxChange(e, 'retefuenteChecked')
                          }
                          className="hidden"
                        />
                        <span className="flex items-center justify-center w-8 h-8 border border-[#00A7E1] rounded-xl cursor-pointer">
                          <span
                            className={`absolute w-3 h-3 rounded-full bg-[#00A7E1] transition-all duration-200 ${
                              formData.retefuenteChecked
                                ? 'scale-100'
                                : 'scale-0'
                            }`}
                          ></span>
                        </span>
                        <span className="text-sm ml-2  ">
                          Retefuente
                          <span
                            className={`text-red-500 ${
                              errors.retefuente ? '' : 'invisible'
                            }`}
                          >
                            *
                          </span>
                        </span>
                      </label>
                      {formData.retefuenteChecked && (
                        <div>
                          <input
                            type="number"
                            name="retefuente"
                            placeholder="Porcentaje"
                            value={formData.retefuente}
                            className={`mt-4 w-full h-10 px-4 border ${
                              errors.retefuente
                                ? 'border-red-500'
                                : 'border-[#00A7E1]'
                            } rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                            onChange={handleChange}
                          />
                          {errors.retefuente && (
                            <p className="text-red-500 text-sm mt-1">
                              El campo es obligatorio.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Reteica */}
                    <div className="mt-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.reteicaChecked}
                          onChange={(e) =>
                            handleCheckboxChange(e, 'reteicaChecked')
                          }
                          className="hidden"
                        />
                        <span className="flex items-center justify-center w-8 h-8 border border-[#00A7E1] rounded-xl cursor-pointer">
                          <span
                            className={`absolute w-3 h-3 rounded-full bg-[#00A7E1] transition-all duration-200 ${
                              formData.reteicaChecked ? 'scale-100' : 'scale-0'
                            }`}
                          ></span>
                        </span>
                        <span className="text-sm ml-2  ">
                          Reteica
                          <span
                            className={`text-red-500 ${
                              errors.reteica ? '' : 'invisible'
                            }`}
                          >
                            *
                          </span>
                        </span>
                      </label>
                      {formData.reteicaChecked && (
                        <div>
                          <input
                            type="number"
                            name="reteica"
                            placeholder="Porcentaje"
                            value={formData.reteica}
                            className={`mt-4 w-full h-10 px-4 border ${
                              errors.reteica
                                ? 'border-red-500'
                                : 'border-[#00A7E1]'
                            } rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                            onChange={handleChange}
                          />
                          {errors.reteica && (
                            <p className="text-red-500 text-sm mt-1">
                              El campo es obligatorio.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Retegarantía */}
                    <div className="mt-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.retegarantiaChecked}
                          onChange={(e) =>
                            handleCheckboxChange(e, 'retegarantiaChecked')
                          }
                          className="hidden"
                        />
                        <span className="flex items-center justify-center w-8 h-8 border border-[#00A7E1] rounded-xl cursor-pointer">
                          <span
                            className={`absolute w-3 h-3 rounded-full bg-[#00A7E1] transition-all duration-200 ${
                              formData.retegarantiaChecked
                                ? 'scale-100'
                                : 'scale-0'
                            }`}
                          ></span>
                        </span>
                        <span className="text-sm ml-2  ">
                          Retegarantía
                          <span
                            className={`text-red-500 ${
                              errors.retegarantia ? '' : 'invisible'
                            }`}
                          >
                            *
                          </span>
                        </span>
                      </label>
                      {formData.retegarantiaChecked && (
                        <div>
                          <input
                            type="number"
                            name="retegarantia"
                            placeholder="Porcentaje"
                            value={formData.retegarantia}
                            className={`mt-4 w-full h-10 px-4 border ${
                              errors.retegarantia
                                ? 'border-red-500'
                                : 'border-[#00A7E1]'
                            } rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                            onChange={handleChange}
                          />
                          {errors.retegarantia && (
                            <p className="text-red-500 text-sm mt-1">
                              El campo es obligatorio.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Anticipo */}
                    <div className="mt-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.anticipoChecked}
                          onChange={(e) =>
                            handleCheckboxChange(e, 'anticipoChecked')
                          }
                          className="hidden"
                        />
                        <span className="flex items-center justify-center w-8 h-8 border border-[#00A7E1] rounded-xl cursor-pointer">
                          <span
                            className={`absolute w-3 h-3 rounded-full bg-[#00A7E1] transition-all duration-200 ${
                              formData.anticipoChecked ? 'scale-100' : 'scale-0'
                            }`}
                          ></span>
                        </span>
                        <span className="text-sm ml-2  ">
                          Anticipo
                          <span
                            className={`text-red-500 ${
                              errors.anticipo ? '' : 'invisible'
                            }`}
                          >
                            *
                          </span>
                        </span>
                      </label>
                      {formData.anticipoChecked && (
                        <div>
                          <input
                            type="number"
                            name="anticipo"
                            placeholder="Valor"
                            value={formData.anticipo}
                            className={`mt-4 w-full h-10 px-4 border ${
                              errors.anticipo
                                ? 'border-red-500'
                                : 'border-[#00A7E1]'
                            } rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                            onChange={handleChange}
                          />

                          {errors.anticipo && (
                            <p className="text-red-500 text-sm mt-1">
                              El campo es obligatorio.
                            </p>
                          )}

                          {/* Add checkbox for "otros descuentos" */}
                          <div className="mt-4">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                name="otrosDescuentos"
                                checked={formData.otrosDescuentosChecked}
                                onChange={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    otrosDescuentosChecked:
                                      !formData.otrosDescuentosChecked, // Esto causará un error si someBooleanValue es booleano
                                  }))
                                }
                                className="w-4 h-4 text-[#00A7E1] border-gray-300 rounded focus:ring-blue-300"
                              />
                              <span className="text-sm text-[#6F6F6F]">
                                Otros descuentos
                              </span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Medios de pago y tipo de Operacion */}
                <div className="flex flex-col md:flex-row gap-4 mt-9">
                  <div className="w-full md:w-[48%] relative">
                    <label className="">Medio de pago</label>
                    <div className="mt-4">
                      {loadingFactura ? (
                        <div>Cargando Medios de pago...</div> // Indicador de carga dentro del select
                      ) : (
                        <SimpleSelect
                          options={nombresDeMetodosDePago} // Opciones cargadas desde zustand
                          width={'100%'}
                          value={formData.medioDePago}
                          onChange={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              medioDePago: value,
                            }));
                            setErrors((prev) => ({
                              ...prev,
                              medioDePago: !value,
                            }));
                          }}
                          placeholder="Seleccione un Tipo de Operacion"
                        />
                      )}
                    </div>
                  </div>
                  <div className="w-full md:w-[50%] mt-4 md:mt-0 relative">
                    <label className="">Tipo de Operacion</label>
                    <div className="mt-4">
                      {loadingTiposDeOperacion ? (
                        <div>Cargando opciones...</div>
                      ) : (
                        <SimpleSelect
                          options={tiposDeOperacion}
                          value={formData.tipoDeOperacion}
                          onChange={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              tipoDeOperacion: value,
                            }));
                            setErrors((prev) => ({
                              ...prev,
                              tipoDeOperacion: false,
                            }));
                          }}
                          placeholder="Genérica"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Seccion opcion unica factura electronica o de contingencia */}
                <div className="space-y-4 mt-4">
                  {/* Factura Electrónica */}
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="facturaElectronica"
                      name="facturaTipo"
                      value="facturaElectronica"
                      checked={formData.tipoDeFactura === 'facturaElectronica'}
                      onChange={handleTipoDeFactura}
                      className="hidden"
                    />
                    <span
                      onClick={() =>
                        handleTipoDeFactura({
                          target: { value: 'facturaElectronica' },
                        } as React.ChangeEvent<HTMLInputElement>)
                      }
                      className="flex items-center justify-center w-8 h-8 border border-[#00A7E1] rounded-xl cursor-pointer relative"
                    >
                      <span
                        className={`absolute w-3 h-3 rounded-full bg-[#00A7E1] transition-all duration-200 ${
                          formData.tipoDeFactura === 'facturaElectronica'
                            ? 'scale-100'
                            : 'scale-0'
                        }`}
                      ></span>
                    </span>

                    <label
                      htmlFor="facturaElectronica"
                      className="font-montserrat font-normal text-[#6F6F6F] text-sm"
                    >
                      Factura Electrónica
                    </label>
                  </div>

                  {/* Factura Electrónica de Contingencia */}
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="facturaElectronicaContingencia"
                      name="facturaTipo"
                      value="facturaElectronicaContingencia"
                      checked={
                        formData.tipoDeFactura ===
                        'facturaElectronicaContingencia'
                      }
                      onChange={handleTipoDeFactura}
                      className="hidden"
                    />
                    <span
                      onClick={() =>
                        handleTipoDeFactura({
                          target: { value: 'facturaElectronicaContingencia' },
                        } as React.ChangeEvent<HTMLInputElement>)
                      }
                      className="flex items-center justify-center w-8 h-8 border border-[#00A7E1] rounded-xl cursor-pointer relative"
                    >
                      <span
                        className={`absolute w-3 h-3 rounded-full bg-[#00A7E1] transition-all duration-200 ${
                          formData.tipoDeFactura ===
                          'facturaElectronicaContingencia'
                            ? 'scale-100'
                            : 'scale-0'
                        }`}
                      ></span>
                    </span>

                    <label
                      htmlFor="facturaElectronicaContingencia"
                      className="font-montserrat font-normal text-[#6F6F6F] text-sm"
                    >
                      Factura Electrónica de Contingencia
                    </label>
                  </div>
                </div>

                {/* Seccion resolucion */}
                <div className="mt-4 relative">
                  <label>Resolucion</label>
                  <div className="w-full mt-4">
                    {loadingFactura ? (
                      <div>Cargando resoluciones...</div>
                    ) : (
                      <SimpleSelect
                        options={resoluciones}
                        value={formData.resolucion}
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            resolucion: value,
                          }));
                          setErrors((prev) => ({ ...prev, resolucion: false }));
                        }}
                        error={errors.resolucion}
                        placeholder="Seleccione una resolucion"
                      />
                    )}
                  </div>
                </div>

                {/* Mensaje de error si es que hay */}
                {Object.values(errors).includes(true) && (
                  <p className="text-red-500 text-sm mt-1">
                    Debe llenar todos campos requeridos.
                  </p>
                )}

                {/* Últimos botones */}
                <div className="flex flex-col sm:flex-row justify-start items-center mt-10 space-y-4 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={handleVistaPrevia}
                    className="bg-[#333332] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#4b4b4b] w-full sm:w-32"
                  >
                    Vista Previa
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitButton}
                    className="bg-[#00A7E1] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1] w-full sm:w-32"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {loadingSend ? <Spinner /> : ''}

        {showLoading && (
          <LoadingBar
            showLoading={showLoading}
            startTime={startTime}
            onFinish={() => setShowLoading(false)}
          />
        )}
        <ModalReviewUX
          isOpen={openReviewUX}
          onClose={() => setOpenReviewUX(false)}
        />
      </LayoutAdmi>
    </PrivateRoute>
  );
}

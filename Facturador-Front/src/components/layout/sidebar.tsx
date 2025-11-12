'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

import {
  MdList,
  MdDescription,
  MdAccountBalance,
  MdChevronLeft,
  MdChevronRight,
  MdExpandMore,
  MdMenu,
} from 'react-icons/md';

import {
  FaMoneyBill,
  FaDatabase,
  FaUser,
  FaAddressBook,
  FaUsers,
  FaCalendarCheck,
  FaBoxes,
  FaMailBulk,
  FaHistory,
  FaFileInvoice,
} from 'react-icons/fa';

import { FaCreditCard, FaPerson, FaGears } from 'react-icons/fa6';

import { IoDocument, IoNewspaper } from 'react-icons/io5';

import { BsFillSuitcaseLgFill, BsBagFill } from 'react-icons/bs';

import { IoIosChatbubbles } from 'react-icons/io';
// import Link from 'next/link';

import logoImg from '@/../../public/logo_con_palito.jpeg';
import Image from 'next/image';
import Link from 'next/link';
import { ChefHat, LocateFixed, PersonStanding } from 'lucide-react';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { showErrorToast } from '../feedback/toast';
import { useRouter } from 'next/navigation';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isExpanded: boolean;
  hasSubItems?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode;
  link?: string;
}

function NavItem({
  icon,
  label,
  isExpanded,
  hasSubItems,
  isOpen,
  onToggle,
  children,
  link,
}: NavItemProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onToggle) {
      onToggle();
      return;
    }
    if (link) {
      router.push(link); // navega sin recargar la página
    }
  };
  return (
    <div>
      <div className="">
        {link != undefined ? (
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-2 px-2 hover:bg-accent/50',
              !isExpanded && 'justify-center px-2'
            )}
            onClick={handleClick}

            // onClick={onToggle}
          >
            <p className="flex align-middle py-4">{icon}</p>
            {isExpanded && (
              <>
                <span className="flex-1 text-left">{label}</span>
                {hasSubItems && (
                  <MdExpandMore
                    className={cn(
                      'h-4 w-4 transition-transform',
                      isOpen && 'rotate-180'
                    )}
                  />
                )}
              </>
            )}
          </Button>
        ) : (
          // </a>
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-2 px-2 hover:bg-accent/50',
              !isExpanded && 'justify-center px-2'
            )}
            onClick={handleClick}

            // onClick={onToggle}
          >
            <p className="flex align-middle py-4">{icon}</p>
            {isExpanded && (
              <>
                <span className="flex-1 text-left">{label}</span>
                {hasSubItems && (
                  <MdExpandMore
                    className={cn(
                      'h-4 w-4 transition-transform',
                      isOpen && 'rotate-180'
                    )}
                  />
                )}
              </>
            )}
          </Button>
        )}
        {isExpanded && isOpen && children && (
          <div className="ml-4 mt-1 space-y-1">{children}</div>
        )}
      </div>
    </div>
  );
}
function OpenItem({
  icon,
  label,
  isExpanded,
  hasSubItems,
  isOpen,
  onToggle,
  children,
  link,
}: NavItemProps) {
  return (
    <div className="">
      {link != undefined ? (
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-2 px-2 hover:bg-accent/50',
            !isExpanded && 'justify-center px-2'
          )}
          onClick={onToggle}
        >
          <p className="flex align-middle py-4">{icon}</p>
          {isExpanded && (
            <>
              <span className="flex-1 text-left">{label}</span>
              {hasSubItems && (
                <MdExpandMore
                  className={cn(
                    'h-4 w-4 transition-transform',
                    isOpen && 'rotate-180'
                  )}
                />
              )}
            </>
          )}
        </Button>
      ) : (
        // </a>
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-2 px-2 hover:bg-accent/50',
            !isExpanded && 'justify-center px-2'
          )}
          onClick={onToggle}
        >
          <p className="flex align-middle py-4">{icon}</p>
          {isExpanded && (
            <>
              <span className="flex-1 text-left">{label}</span>
              {hasSubItems && (
                <MdExpandMore
                  className={cn(
                    'h-4 w-4 transition-transform',
                    isOpen && 'rotate-180'
                  )}
                />
              )}
            </>
          )}
        </Button>
      )}
      {isExpanded && isOpen && children && (
        <div className="ml-4 mt-1 space-y-1">{children}</div>
      )}
    </div>
  );
}

function SideBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 769);
      if (window.innerWidth < 769) {
        setIsExpanded(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isExpanded) {
      // Desactiva el scroll del fondo
      document.body.style.overflow = 'hidden';
    } else {
      // Restaura el scroll del fondo
      document.body.style.overflow = '';
    }

    return () => {
      // Limpieza al desmontar el componente
      document.body.style.overflow = '';
    };
  }, [isExpanded]);
  const redireccionarAGastroPOS = () => {
    window.open('https://www.gastro-pos.com/', '_blank');
  };

  const redireccionarAQualitySoft = () => {
    const token = getTokenFromCookies();
    if (!token) {
      showErrorToast('No hay token de autenticación disponible.');
      return;
    }

    const url = 'https://qualitysoft.netlify.app';
    // const url = 'http://localhost:3001';

    const nuevaVentana = window.open(`${url}/redireccion2`, '_blank');
    if (!nuevaVentana) {
      showErrorToast('No se pudo abrir la ventana.');
      return;
    }
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== url) return;
      if (event.data?.ready) {
        nuevaVentana.postMessage({ gastroToken: token }, url);
        window.removeEventListener('message', handleMessage);
      }
    };
    window.addEventListener('message', handleMessage);
  };

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const iconsStyle = 'text-blueQ z-[203]';

  const handleClickOutside = () => {
    setIsExpanded(false);
  };

  return (
    <>
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[199]"
          aria-hidden="true"
          onClick={handleClickOutside}
        />
      )}
      <div
        className={cn(
          ' fixed top-0 left-0 flex h-screen flex-col border-r bg-background  transition-all duration-300 z-[200] text-[#6F6F6F]',
          isExpanded ? 'w-64' : 'w-16',
          isMobile && !isExpanded && 'w-0'
        )}
      >
        <div className=" flex h-20 items-center border-b justify-between px-3">
          {isExpanded && (
            <div className="flex items-center justify-center flex-grow">
              <Link href={'/'}>
                <img
                  src="/logo_con_palito.jpeg"
                  alt="Quality Logo"
                  width="90"
                  style={{ height: 'auto' }}
                />
              </Link>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn('justify-end h-8 w-8', !isExpanded && 'ml-0')}
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            {isMobile ? (
              <MdMenu className={iconsStyle} />
            ) : isExpanded ? (
              <MdChevronLeft className={iconsStyle} />
            ) : (
              <MdChevronRight className={iconsStyle} />
            )}
          </Button>
        </div>
        <ScrollArea className="flex-1 px-3 pt-[2.75rem] gap-8">
          <div className="space-y-2">
            <div className="">
              <h2
                className={cn(
                  'mb-2 text-lg font-semibold tracking-tight',
                  !isExpanded && 'sr-only'
                )}
              >
                Facturas
              </h2>
              <div className="space-y-1 ">
                <NavItem
                  icon={<FaMoneyBill className={iconsStyle} />}
                  label="Facturación"
                  isExpanded={isExpanded}
                  link="/gestionDeFacturasElectronicas"
                />
                <NavItem
                  icon={<FaMoneyBill className={iconsStyle} />}
                  label="Facturación Mixta"
                  isExpanded={isExpanded}
                  link="/facturacionMixta"
                />
                <NavItem
                  icon={<FaDatabase className={iconsStyle} />}
                  label="Lista de facturas"
                  isExpanded={isExpanded}
                  link="/facturas"
                />
                <NavItem
                  icon={<FaCreditCard className={iconsStyle} />}
                  label="Pagos"
                  isExpanded={isExpanded}
                  link="/pagos"
                />
                <NavItem
                  icon={<IoNewspaper className={iconsStyle} />}
                  label="Informes"
                  isExpanded={isExpanded}
                  link="/informes"
                />
              </div>
            </div>

            <div className="">
              <h2
                className={cn(
                  'mb-2 text-lg font-semibold tracking-tight',
                  !isExpanded && 'sr-only'
                )}
              >
                Notas Débito/Crédito
              </h2>
              <div className="space-y-1">
                <OpenItem
                  icon={<MdAccountBalance className={iconsStyle} />}
                  label="Notas Débito"
                  isExpanded={isExpanded}
                  hasSubItems
                  isOpen={openSections.debit}
                  onToggle={() => toggleSection('debit')}
                >
                  <NavItem
                    icon={<MdDescription className={iconsStyle} />}
                    label="Generar"
                    isExpanded={isExpanded}
                    link="/debito/crear"
                  />
                  <NavItem
                    icon={<MdDescription className={iconsStyle} />}
                    label="Lista"
                    isExpanded={isExpanded}
                    link="/debito/lista"
                  />
                </OpenItem>
                <OpenItem
                  icon={<MdAccountBalance className={iconsStyle} />}
                  label="Notas Crédito"
                  isExpanded={isExpanded}
                  hasSubItems
                  isOpen={openSections.credit}
                  onToggle={() => toggleSection('credit')}
                >
                  <NavItem
                    icon={<MdDescription className={iconsStyle} />}
                    label="Generar"
                    isExpanded={isExpanded}
                    link="/credito/crear"
                  />
                  <NavItem
                    icon={<MdDescription className={iconsStyle} />}
                    label="Lista"
                    isExpanded={isExpanded}
                    link="/credito/lista"
                  />
                </OpenItem>
              </div>
            </div>

            <div className="">
              <h2
                className={cn(
                  'mb-2 text-lg font-semibold tracking-tight',
                  !isExpanded && 'sr-only'
                )}
              >
                Panel de Producción
              </h2>
              <div className="space-y-1">
                <NavItem
                  icon={<FaBoxes className={iconsStyle} />}
                  label="Panel de Producción"
                  isExpanded={isExpanded}
                  link="/panelProduccion"
                />
              </div>
            </div>

            <div className="">
              <h2
                className={cn(
                  'mb-2 text-lg font-semibold tracking-tight',
                  !isExpanded && 'sr-only'
                )}
              >
                Buzón de Facturas
              </h2>
              <div className="space-y-1">
                <NavItem
                  icon={<FaMailBulk className={iconsStyle} />}
                  label="Buzón de Facturas"
                  isExpanded={isExpanded}
                  link="/panelProduccion/facturas"
                />
              </div>
            </div>

            <div className="">
              <h2
                className={cn(
                  'mb-2 text-lg font-semibold tracking-tight',
                  !isExpanded && 'sr-only'
                )}
              >
                Compras
              </h2>
              <div className="space-y-1">
                <NavItem
                  icon={<FaMoneyBill className={iconsStyle} />}
                  label="Facturación Compras"
                  isExpanded={isExpanded}
                  link="/facturaCompra"
                />

                <NavItem
                  icon={<MdList className={iconsStyle} />}
                  label="Lista de Compras"
                  isExpanded={isExpanded}
                  link="/compras"
                />
              </div>
            </div>

            <div className="">
              <h2
                className={cn(
                  'mb-2 text-lg font-semibold tracking-tight',
                  !isExpanded && 'sr-only'
                )}
              >
                Contratos
              </h2>
              <div className="space-y-1">
                <NavItem
                  icon={<BsFillSuitcaseLgFill className={iconsStyle} />}
                  label="Contratos Venta"
                  isExpanded={isExpanded}
                  link="/contratos"
                />
              </div>
              <div
                className="space-y-1"
                onClick={() => showErrorToast('Modulo en desarrollo')}
              >
                <NavItem
                  icon={<BsFillSuitcaseLgFill className={iconsStyle} />}
                  label="Contratos Compra"
                  isExpanded={isExpanded}

                  // link="/contratoCompra"
                />
              </div>
            </div>

            <div className="">
              <h2
                className={cn(
                  'mb-2 text-lg font-semibold tracking-tight',
                  !isExpanded && 'sr-only'
                )}
              >
                Items
              </h2>
              <div className="space-y-1">
                <div className="space-y-1">
                  <NavItem
                    icon={<BsBagFill className={iconsStyle} />}
                    label="Items de Ventas"
                    isExpanded={isExpanded}
                    link="/itemsDeVenta"
                  />
                </div>
                <NavItem
                  icon={<BsBagFill className={iconsStyle} />}
                  label="Items de Compras"
                  isExpanded={isExpanded}
                  link="/itemsDeCompra"
                />
                <NavItem
                  icon={<MdList className={iconsStyle} />}
                  label="Categorias Proveedores"
                  isExpanded={isExpanded}
                  link="/listaItemsDeCompra"
                />
              </div>
            </div>
            <div className="">
              <h2
                className={cn(
                  'mb-2 text-lg font-semibold tracking-tight',
                  !isExpanded && 'sr-only'
                )}
              >
                Clientes
              </h2>
              <div className="space-y-1">
                <NavItem
                  icon={<FaAddressBook className={iconsStyle} />}
                  label="Lista de Clientes"
                  isExpanded={isExpanded}
                  link="/clientes"
                />
              </div>
            </div>
            <div className="">
              <h2
                className={cn(
                  'mb-2 text-lg font-semibold tracking-tight',
                  !isExpanded && 'sr-only'
                )}
              >
                Proveedores
              </h2>
              <div className="space-y-1">
                <NavItem
                  icon={<FaUsers className={iconsStyle} />}
                  label="Lista de Proveedores"
                  isExpanded={isExpanded}
                  link="/proveedores"
                />
              </div>
            </div>
            <div className="">
              <h2
                className={cn(
                  'mb-2 text-lg font-semibold tracking-tight',
                  !isExpanded && 'sr-only'
                )}
              >
                Estados Financieros
              </h2>
              <div className="space-y-1">
                <NavItem
                  icon={<IoDocument className={iconsStyle} />}
                  label="Estados Financieros"
                  isExpanded={isExpanded}
                  link="/estadosFinancieros"
                />
              </div>
              <div className="space-y-1">
                <NavItem
                  icon={<LocateFixed className={iconsStyle} />}
                  label="Propiedad Planta y Equipo (PPE)"
                  isExpanded={isExpanded}
                  link="/panelProduccion/activos"
                />
              </div>
            </div>
            <div className="">
              <h2
                className={cn(
                  'mb-2 text-lg font-semibold tracking-tight',
                  !isExpanded && 'sr-only'
                )}
              >
                Calendario Tributario
              </h2>
              <div className="space-y-1">
                <NavItem
                  icon={<FaCalendarCheck className={iconsStyle} />}
                  label="Calendario Tributario"
                  isExpanded={isExpanded}
                  link="/calendario"
                />
              </div>
            </div>
            <div className="">
              <h2
                className={cn(
                  'mb-2 text-lg font-semibold tracking-tight',
                  !isExpanded && 'sr-only'
                )}
              >
                Modulo Administrativo
              </h2>
              <div className="space-y-1">
                <NavItem
                  icon={<IoIosChatbubbles className={iconsStyle} />}
                  label="Modulo Administrativo"
                  isExpanded={isExpanded}
                  link="/loginadministrativo"
                />
              </div>
            </div>
            <div className="">
              <h2
                className={cn(
                  'mb-2 text-lg font-semibold tracking-tight',
                  !isExpanded && 'sr-only'
                )}
              >
                Presupuesto
              </h2>
              <div className="space-y-1">
                <NavItem
                  icon={<FaMoneyBill className={iconsStyle} />}
                  label="Presupuesto"
                  isExpanded={isExpanded}
                  link="/presupuesto"
                />
              </div>
            </div>
            <div className="">
              <h2
                className={cn(
                  'mb-2 text-lg font-semibold tracking-tight',
                  !isExpanded && 'sr-only'
                )}
              >
                Representante Legal
              </h2>
              <div className="space-y-1">
                <NavItem
                  icon={<FaPerson className={iconsStyle} />}
                  label="Representante Legal"
                  isExpanded={isExpanded}
                  link="/representante"
                />
              </div>
            </div>
            <div className="">
              <h2
                className={cn(
                  'mb-2 text-lg font-semibold tracking-tight',
                  !isExpanded && 'sr-only'
                )}
              >
                Historial de Trazabilidad
              </h2>
              <div className="space-y-1">
                <NavItem
                  icon={<FaHistory className={iconsStyle} />}
                  label="Ver Historial"
                  isExpanded={isExpanded}
                  link="/representante"
                />
              </div>
            </div>

            <div className="">
              <h2
                className={cn(
                  'mb-2 text-lg font-semibold tracking-tight',
                  !isExpanded && 'sr-only mb-0'
                )}
              >
                Configuración
              </h2>
              <div className="space-y-1">
                <NavItem
                  icon={<FaUser className={iconsStyle} />}
                  label="Mi Cuenta"
                  isExpanded={isExpanded}
                  link="/configuracion"
                />
                <NavItem
                  icon={<FaGears className={iconsStyle} />}
                  label="Configuración API"
                  isExpanded={isExpanded}
                  link="/configapi"
                />
                <NavItem
                  icon={<FaFileInvoice className={iconsStyle} />}
                  label="Resoluciones"
                  isExpanded={isExpanded}
                  link="/resoluciones"
                />
              </div>
            </div>
            <div className="">
              <h2
                className={cn(
                  'mb-2 text-lg font-semibold tracking-tight',
                  !isExpanded && 'sr-only mb-0'
                )}
              >
                Otros Softwares
              </h2>
              <div className="space-y-1">
                <NavItem
                  icon={<PersonStanding className={iconsStyle} />}
                  label="Gestión Humana"
                  isExpanded={isExpanded}
                  onToggle={redireccionarAQualitySoft}
                />

                <NavItem
                  icon={<ChefHat className={iconsStyle} />}
                  label="Gastro POS"
                  isExpanded={isExpanded}
                  onToggle={redireccionarAGastroPOS}
                />
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}

export default SideBar;

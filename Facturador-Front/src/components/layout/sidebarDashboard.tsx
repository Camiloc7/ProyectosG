'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

import {
  MdDescription,
  MdAccountBalance,
  MdChevronLeft,
  MdChevronRight,
  MdExpandMore,
  MdMenu,
} from 'react-icons/md';

import { FaDatabase } from 'react-icons/fa';
import { FaChartBar, FaUserLarge } from 'react-icons/fa6';

import logoQuality from '@/../../public/logo_con_palito.jpeg';
import Image from 'next/image';
import Link from 'next/link';
import { ChefHat, House } from 'lucide-react';

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
  const content = (
    <Button
      variant="ghost"
      className={cn(
        'w-full justify-start gap-2 px-2 hover:bg-accent/50',
        !isExpanded && 'justify-center px-2'
      )}
      onClick={!link && hasSubItems ? onToggle : undefined}
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
  );

  return (
    <div>
      {link ? (
        <Link href={link} className="block">
          {content}
        </Link>
      ) : (
        <div>{content}</div>
      )}
      {/* Renderización de los hijos si la sección está abierta */}
      {hasSubItems && isOpen && (
        <div className="ml-4 space-y-1">{children}</div>
      )}
    </div>
  );
}

function SidebarDashboard() {
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
      setOpenSections({});
      document.body.style.overflow = '';
    }

    return () => {
      // Limpieza al desmontar el componente
      document.body.style.overflow = '';
    };
  }, [isExpanded]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const iconsStyle = 'text-blueQ';

  const handleClickOutside = () => {
    setIsExpanded(false);
  };

  return (
    <div>
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
                    icon={<FaChartBar className={iconsStyle} />}
                    label="ChartBar"
                    isExpanded={isExpanded}
                    link="/chartBar"
                  />
                  <NavItem
                    icon={<FaUserLarge className={iconsStyle} />}
                    label="Usuarios"
                    isExpanded={isExpanded}
                    link="/admin"
                  />
                  <NavItem
                    icon={<FaDatabase className={iconsStyle} />}
                    label="Lista de facturas"
                    isExpanded={isExpanded}
                    link="/admin/listaDeFacturas"
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
                  Gastro POS
                </h2>
                <div className="space-y-1 ">
                  <NavItem
                    icon={<House className={iconsStyle} />}
                    label="Establecimientos POS"
                    isExpanded={isExpanded}
                    link="/admin/establecimientos"
                  />
                  <NavItem
                    icon={<ChefHat className={iconsStyle} />}
                    label="Usuarios POS"
                    isExpanded={isExpanded}
                    link="/admin/usuariosPOS"
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
                  <NavItem
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
                    />
                    <NavItem
                      icon={<MdDescription className={iconsStyle} />}
                      label="Lista"
                      isExpanded={isExpanded}
                      link="/admin/debito/lista"
                    />
                  </NavItem>
                  <NavItem
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
                    />
                    <NavItem
                      icon={<MdDescription className={iconsStyle} />}
                      label="Lista"
                      isExpanded={isExpanded}
                      link="/admin/credito/lista"
                    />
                  </NavItem>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export default SidebarDashboard;

"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Settings,
  Users,
  Search,
  Bell,
  User,
  LogOut,
  Apple,
  Table,
  Pizza,
  Utensils,
  Truck,
  CreditCardIcon,
  Ticket,
  ReceiptText,
  Package,
  MenuIcon,
  X,
  BarChart3,
} from "lucide-react";
import { TbCashRegister } from "react-icons/tb";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import toast from "react-hot-toast";
import { RUTA } from "@/helpers/rutas";
import { GrGraphQl } from "react-icons/gr";
import { PiGraphicsCardLight } from "react-icons/pi";

type Route =
  | { label: string; href: string; icon: any; external?: boolean }
  | { label: string; action: () => void; icon: any; external?: boolean };

export default function TopBar() {
  const router = useRouter();
  const { user } = useAuthStore();
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const logout = useAuthStore((state) => state.logout);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [path]);

  if (path === "/" || path === "/terminos") return null;

  let routes: Route[] = [];
  if (user?.rol === "CAJERO") {
    routes = [
      { label: "Caja", href: "/cajero", icon: TbCashRegister },
      { label: "Lista Cierre Caja", href: "/cierre-de-caja", icon: Package },
      { label: "Pedidos", href: "/pedidos", icon: Ticket },
    ];
  } else if (user?.rol === "ADMIN" || user?.rol === "SUPERADMIN") {
    routes = [
      { label: "Dashboard", href: "/dashboard", icon: Home },
      { label: "Mesas", href: "/mesas", icon: Table },
      { label: "Categorias", href: "/categorias", icon: Pizza },
      { label: "Ingredientes", href: "/ingredientes", icon: Apple },
      { label: "Empleados", href: "/empleados", icon: Users },
      { label: "Productos", href: "/productos", icon: Utensils },
      { label: "Configuración", href: "/configuracion", icon: Settings },
      { label: "Proveedores", href: "/proveedores", icon: Truck },
      { label: "Cuentas", href: "/cuentas", icon: CreditCardIcon },
      { label: "Lista Cierre Caja", href: "/cierre-de-caja", icon: Package },
      { label: "Caja", href: "/cajero", icon: TbCashRegister },
      { label: "Pedidos", href: "/pedidos", icon: Ticket },
      {
        label: "Facturación electrónica",
        action: () => {
          const RUTA_FACTURADOR = "https://facturando.qualitysoftservices.com";
          if (!token) {
            toast.error("No hay token de autenticación disponible.");
            return;
          }

          const nuevaVentana = window.open(
            `${RUTA_FACTURADOR}/redireccion`,
            "_blank"
          );

          if (!nuevaVentana) {
            toast.error("No se pudo abrir la ventana del facturador");
            return;
          }

          const handleMessage = (event: MessageEvent) => {
            if (event.origin !== RUTA_FACTURADOR) {
              console.error(
                "NO ES LA RUTA DE FACTURADOR CORRECTA: ",
                event.origin
              );
              return;
            } 
            try {
              if (event.data?.ready) {
                console.log("Facturador listo, enviando token...");
                nuevaVentana.postMessage(
                  { gastroToken: token },
                  RUTA_FACTURADOR
                );
                window.removeEventListener("message", handleMessage);
              }
            } catch (err) {
              console.error("Error enviando token al facturador:", err);
              toast.error("Error enviando token");
              window.removeEventListener("message", handleMessage);
              nuevaVentana?.close();
            }
          };
          window.addEventListener("message", handleMessage);
        },
        icon: ReceiptText,
      },
      { label: "Reportes", href: "/reportes", icon: BarChart3 },
    ];
  }
  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {routes.map((route) => (
        <Tooltip.Root
          key={"href" in route ? route.href : route.label}
          delayDuration={0}
        >
          <Tooltip.Trigger asChild>
            {"href" in route ? (
              <Link
                href={route.href}
                className="group relative"
                onClick={onClick}
              >
                <div
                  className={`p-2 rounded hover:bg-white hover:bg-opacity-10 transform transition-transform duration-200 group-hover:scale-110 ${
                    path.startsWith(route.href)
                      ? "bg-white bg-opacity-10 text-orange-500"
                      : "text-white"
                  } group-hover:text-orange-500`}
                >
                  <route.icon size={20} />
                </div>
              </Link>
            ) : (
              <button onClick={route.action} className="group relative">
                <div className="p-2 rounded hover:bg-white hover:bg-opacity-10 transform transition-transform duration-200 group-hover:scale-110 text-white group-hover:text-orange-500">
                  <route.icon size={20} />
                </div>
              </button>
            )}
          </Tooltip.Trigger>
          <Tooltip.Content
            className="bg-black text-white text-sm px-2 py-1 rounded shadow-lg"
            sideOffset={5}
          >
            {route.label}
            <Tooltip.Arrow className="fill-black" />
          </Tooltip.Content>
        </Tooltip.Root>
      ))}
    </>
  );

  return (
    <header
      className="w-full flex items-center justify-between px-4 h-16 shadow-md relative" 
      style={{
        background: "linear-gradient(90deg, #000 0%, #ff7f00 100%)",
        color: "#fff",
      }}
    >
      <button
        className="md:hidden text-white"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <MenuIcon size={24} />
      </button>

      <div className="flex items-center space-x-6">
        <span className="text-xl font-bold tracking-wide">Gastro POS</span>
        <nav className="hidden md:flex items-center space-x-4">
          <NavLinks />
        </nav>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-2 text-white">
          <User size={16} />
          <span className="text-sm font-medium">{user?.username}</span>
        </div>

        {[
          { title: "Buscar", Icon: Search },
          { title: "Notificaciones", Icon: Bell },
        ].map(({ title, Icon }, idx) => (
          <Tooltip.Root key={idx} delayDuration={0}>
            <Tooltip.Trigger asChild>
              <button className="p-2 rounded hover:bg-white hover:bg-opacity-10 transform transition-transform duration-200 hover:scale-110 text-white hover:text-orange-500">
                <Icon size={20} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content
              className="bg-black text-white text-sm px-2 py-1 rounded shadow-lg"
              sideOffset={5}
            >
              {title}
              <Tooltip.Arrow className="fill-black" />
            </Tooltip.Content>
          </Tooltip.Root>
        ))}
        <div className="relative" ref={profileRef}>
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger asChild>
              <button
                className="p-2 rounded-full hover:bg-white hover:bg-opacity-10 transition-transform transform duration-200 hover:scale-110 text-white hover:text-orange-500"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                <User size={20} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content
              className="bg-black text-white text-sm px-2 py-1 rounded shadow-lg"
              sideOffset={5}
            >
              Perfil
              <Tooltip.Arrow className="fill-black" />
            </Tooltip.Content>
          </Tooltip.Root>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded shadow-md z-50">
              <button
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="flex items-center w-full px-4 py-2 hover:bg-gray-100 text-sm"
              >
                <LogOut size={16} className="mr-2" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
      <div
        className={`fixed inset-y-0 left-0 bg-black bg-opacity-90 w-64 z-50 transition-transform duration-300 ease-in-out transform ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:hidden`}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6 text-white">
            <span className="text-xl font-bold">Menú</span>
            <button onClick={() => setIsMobileMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <nav className="flex flex-col space-y-4">
            {routes.map((route) => (
              <div key={"href" in route ? route.href : route.label}>
                {"href" in route ? (
                  <Link
                    href={route.href}
                    className={`flex items-center space-x-3 text-white hover:text-orange-500 transition-colors ${
                      path.startsWith(route.href) ? "text-orange-500" : ""
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <route.icon size={20} />
                    <span>{route.label}</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      route.action();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 text-white hover:text-orange-500 transition-colors"
                  >
                    <route.icon size={20} />
                    <span>{route.label}</span>
                  </button>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </header>
  );
}

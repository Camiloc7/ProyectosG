"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Settings, Search, Bell, User, LogOut, Pencil } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useEstablecimientosStore } from "@/stores/establecimientosStore";
import UpdateEstablecimientoImage from "../modals/UpdateEstablecimientoImage";

export default function TopBar() {
  const router = useRouter();
  const { user } = useAuthStore();
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUpdateImageOpen, setIsUpdateImageOpen] = useState(false);

  const [notificaciones, setNotificaciones] = useState<string[]>([
    "Factura pendiente de revisión",
  ]);

  const [notificacionesOpen, setNotificacionesOpen] = useState(false); // 🔹 NUEVO
  const notificacionesRef = useRef<HTMLDivElement>(null); // 🔹 NUEVO

  const profileRef = useRef<HTMLDivElement>(null);
  const logout = useAuthStore((state) => state.logout);
  const [isVisible, setIsVisible] = useState(true);
  const { traerEstablecimientoPorId, establecimientoActual } =
    useEstablecimientosStore();

  useEffect(() => {
    const handleResize = () => {
      setIsVisible(window.innerWidth >= 1100);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cierra el dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }

      if (
        notificacionesRef.current &&
        !notificacionesRef.current.contains(e.target as Node)
      ) {
        setNotificacionesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [path]);

  useEffect(() => {
    if (user) traerEstablecimientoPorId(user.establecimiento_id);
  }, [user]);

  if (path === "/" || path === "/terminos" || path === "/terminosWeb")
    return null;

  return (
    <header
      className="w-full flex items-center justify-between px-4 h-16 shadow-md relative"
      style={{
        background: "linear-gradient(90deg, #000 0%, #ff7f00 100%)",
        color: "#fff",
      }}
    >
      {/* Izquierda */}
      <h1 className="ml-16 md:ml-20 flex-1 min-w-0 text-base md:text-2xl leading-6 md:leading-8 font-bold font-montserrat text-white hidden md:flex flex-row items-center">
        <div className="flex flex-col leading-tight truncate">
          <span className="truncate">Quality Soft Service</span>
          <span className="text-[10px] font-normal mt-0.5 truncate">
            Construya con liquidez. Facture con Quality v. 1.0.0
          </span>
        </div>
        <span className="mx-4 text-xl flex-shrink-0">|</span>
        <span className="text-base font-montserrat font-normal text-white truncate">
          {user?.nombre_establecimiento} 
        </span>
      </h1>

      {/* Derecha */}
      <div className="flex items-center space-x-4 flex-shrink-0">
        <span className="hidden md:flex text-sm font-medium items-center gap-2 truncate max-w-xs">
          <span className="truncate">{user?.username}</span>
          <span>|</span>
          <span className="truncate">{user?.rol}</span>
        </span>

        {/* Icono de búsqueda */}
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger asChild>
            <button className="p-2 rounded hover:bg-white hover:bg-opacity-10 transform transition-transform duration-200 hover:scale-110 text-white hover:text-orange-500">
              <Search size={20} />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content
            className="bg-black text-white text-sm px-2 py-1 rounded shadow-lg"
            sideOffset={5}
          >
            Buscar
            <Tooltip.Arrow className="fill-black" />
          </Tooltip.Content>
        </Tooltip.Root>

        {/* 🔔 Notificaciones */}
        <div className="relative" ref={notificacionesRef}>
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger asChild>
              <button
                onClick={() => setNotificacionesOpen((prev) => !prev)}
                className="relative p-2 rounded hover:bg-white hover:bg-opacity-10 transform transition-transform duration-200 hover:scale-110 text-white hover:text-orange-500"
              >
                <Bell size={20} />
                {/* 🔴 Badge rojo si hay notificaciones */}
                {notificaciones.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-xs">
                    {notificaciones.length}{" "}
                  </span>
                )}
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content
              className="bg-black text-white text-sm px-2 py-1 rounded shadow-lg"
              sideOffset={5}
            >
              Notificaciones
              <Tooltip.Arrow className="fill-black" />
            </Tooltip.Content>
          </Tooltip.Root>

          {/* Panel de notificaciones */}
          {notificacionesOpen && (
            <div className="absolute right-0 mt-2 min-w-[600px] bg-white rounded-xl shadow-xl overflow-hidden z-50 animate-fadeIn">
              <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-800 text-lg">
                Notificaciones
              </div>

              <div className="flex flex-col md:flex-row">
                {/* Texto */}
                <div className="p-6 md:w-1/2 space-y-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    🚀 ¡Atiende a tus clientes como nunca antes!
                  </h2>

                  <p className="text-gray-600 leading-relaxed">
                    Con nuestro{" "}
                    <strong>sistema inalámbrico de llamada para mesas</strong>{" "}
                    🍽️ tus clientes podrán:
                  </p>

                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>✅ Pedir atención</li>
                    <li>✅ Solicitar la cuenta</li>
                    <li>✅ Hacer su pedido</li>
                  </ul>

                  <p className="text-gray-700 font-medium">
                    ✨ ¡Todo con solo presionar un botón!
                  </p>
                </div>

                {/* Imagen */}
                <div className="md:w-1/2 flex justify-center items-center bg-white">
                  <img
                    src="/noti.jpeg"
                    alt="Sistema de notificación"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>

              {/* Segunda parte */}
              <div className="p-6 bg-white text-gray-700 space-y-3">
                <p>
                  Mejora la <strong>eficiencia</strong>, evita{" "}
                  <strong>esperas innecesarias</strong> y ofrece un servicio más
                  ágil y moderno.
                </p>
                <p>
                  Ideal para <strong>restaurantes, cafés y bares</strong> que
                  buscan destacar por su atención y tecnología. 📲
                </p>
                <div className="pt-2">
                  <button className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition">
                    🌟 ¡Moderniza tu servicio hoy!
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Perfil */}
        <div className="relative w-10 h-10" ref={profileRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white border-2 border-orange-400 hover:scale-105 hover:border-white transition"
          >
            {establecimientoActual?.logo_url ? (
              <img
                src={establecimientoActual.logo_url}
                alt="Logo Establecimiento"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User size={18} />
            )}
          </button>

          {/* Botón editar logo */}
          {user?.rol === "ADMIN" && (
            <button
              onClick={() => setIsUpdateImageOpen(true)}
              className="absolute -top-2 -right-2 bg-orange-500 text-white p-1 rounded-full shadow hover:bg-orange-600 transition"
            >
              <Pencil size={14} />
            </button>
          )}

          {/* Dropdown usuario */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg overflow-hidden z-50 animate-fadeIn">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-500">{user?.rol}</p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.nombre_establecimiento}
                </p>
              </div>
              {user?.rol === "ADMIN" && (
                <Link
                  href="/configuracion"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                >
                  <Settings size={16} />
                  Configuración
                </Link>
              )}
              <button
                onClick={async () => {
                  router.push("/");
                  logout();
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>

      <UpdateEstablecimientoImage
        isOpen={isUpdateImageOpen}
        onClose={() => setIsUpdateImageOpen(false)}
      />
    </header>
  );
}

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Boxes,
  Table,
  BarChart,
  ShoppingCart,
  Leaf,
  CreditCard,
  ChevronRight,
  UtensilsCrossed,
  Tag,
  Truck,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { FONDO, FONDO_COMPONENTES, ORANGE } from "@/styles/colors";
import InstallationSection from "@/features/InstalationSection";
const dashboardItems = [
  {
    label: "Gestión de Usuarios",
    description: "Administra roles, permisos y datos de empleados.",
    icon: Users,
    href: "/empleados",
  },
  {
    label: "Catálogo de Productos",
    description: "Crea, edita y organiza los productos de tu menú.",
    icon: Boxes,
    href: "/productos",
  },
  {
    label: "Configuración de Mesas",
    description: "Define y gestiona las mesas de tu establecimiento.",
    icon: Table,
    href: "/mesas",
  },
  {
    label: "Análisis de Reportes",
    description: "Visualiza métricas clave y el rendimiento del negocio.",
    icon: BarChart,
    action: () => toast.success("Funcionalidad en desarrollo"),
  },
  {
    label: "Registro de Compras",
    description: "Lleva un control detallado de las compras de insumos.",
    icon: ShoppingCart,
    action: () => toast.success("Funcionalidad en desarrollo"),
    // href: "/compras",
  },
  {
    label: "Inventario de Ingredientes",
    description: "Gestiona el stock y el costo de tus ingredientes.",
    icon: Leaf,
    href: "/ingredientes",
  },
  {
    label: "Medios de Pago",
    description: "Configura y administra las opciones de pago.",
    icon: CreditCard,
    href: "/medios-de-pago",
    action: () => toast.success("Funcionalidad en desarrollo"),
  },
  {
    label: "Gestión de Categorías",
    description: "Organiza tus productos en categorías claras y concisas.",
    icon: Tag,
    href: "/categorias",
  },
  {
    label: "Gestión de Proveedores",
    description: "Administra la información de tus proveedores y contactos.",
    icon: Truck,
    href: "/proveedores",
  },
  {
    label: "Gestión de Cuentas",
    description: "Administra la información de tus cuentas.",
    icon: CreditCard,
    href: "/cuentas",
  },
];
export default function AdminDashboardPage() {
  const router = useRouter();
  return (
    <div
      className="flex flex-col min-h-screen p-8 md:p-12 font-lato"
      style={{ backgroundColor: FONDO }}
    >
      <div
        className="relative flex flex-col items-center justify-center py-16 mb-16 rounded-3xl shadow-xl overflow-hidden"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`, // Imagen de interior de restaurante
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
        <div className="relative z-10 text-white text-center px-4 max-w-4xl">
          <UtensilsCrossed
            size={64}
            className="mb-4 mx-auto drop-shadow-md"
            style={{ color: ORANGE }}
          />
          <h1 className="text-4xl md:text-5xl font-semibold tracking-wide mb-3 drop-shadow-lg">
            Panel de Administración
          </h1>
          <p className="text-lg md:text-xl font-light leading-relaxed drop-shadow-md">
            Gestiona cada detalle de tu establecimiento gastronómico con una
            interfaz intuitiva y potente.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8 max-w-6xl mx-auto w-full">
        {dashboardItems.map((item, index) => {
          const IconComponent = item.icon;
          const moduleContent = (
            <>
              <div
                className="flex-shrink-0 p-4 rounded-xl flex items-center justify-center mr-6 transition-colors duration-300"
                style={{ backgroundColor: ORANGE + "1A" }}
              >
                <IconComponent size={32} style={{ color: ORANGE }} />
              </div>
              <div className="flex-grow text-left">
                <h2 className="text-xl font-bold text-gray-900 mb-1 leading-tight">
                  {item.label}
                </h2>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <div className="flex-shrink-0 ml-4 text-gray-400 transition-transform duration-300 group-hover:translate-x-1">
                <ChevronRight size={24} />
              </div>
            </>
          );
          const commonModuleClasses = `
            group flex items-center p-6 rounded-2xl
            shadow-md hover:shadow-lg
            transition-all duration-300 ease-in-out
            hover:scale-[1.005]
            cursor-pointer
            border border-gray-100
            w-full
          `;
          if (item.href) {
            return (
              <button
                key={index}
                onClick={() => router.push(item.href!)}
                className={commonModuleClasses}
                style={{ backgroundColor: FONDO_COMPONENTES }}
              >
                {moduleContent}
              </button>
            );
          } else {
            return (
              <button
                key={index}
                onClick={item.action}
                className={commonModuleClasses}
                style={{ backgroundColor: FONDO_COMPONENTES }}
              >
                {moduleContent}
              </button>
            );
          }
        })}
      </div>
      <InstallationSection />
    </div>
  );
}

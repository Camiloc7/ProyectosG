'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminLayoutRestaurante from '../AdminLayout';

const navItems = [
  { name: 'Categorías', href: '/restaurante/admin/categorias' },
  { name: 'Menu', href: '/restaurante/admin/menu' },
  { name: 'Empleados', href: '/restaurante/admin/empleados' },
  { name: 'Configuracion', href: '/restaurante/admin/configuracion' },
];

export default function SidebarRestaurante() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white h-screen p-4 shadow-md">
      <h2 className="text-xl font-bold mb-6 text-[#00A7E1]">
        Panel Restaurante
      </h2>
      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <span
              className={`block px-4 py-2 rounded hover:bg-[#00A7E1] hover:text-white cursor-pointer ${
                pathname === item.href
                  ? 'bg-[#00A7E1] text-white'
                  : 'text-gray-700'
              }`}
            >
              {item.name}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

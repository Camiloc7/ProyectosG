"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function NavBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#F7F7F7] shadow-md">
      <div className="container mx-auto px-4 md:px-12 h-20 flex items-center justify-between">
        {/* Logo y nombre de la empresa */}
        <div className="flex items-center">
          <Link href="#inicio" onClick={handleLinkClick}>
            <Image
              src="/logo.webp"
              alt="Quality Soft Service Logo"
              width={100}
              height={60}
              priority
            />
          </Link>
          <span className="ml-4 text-sm font-bold text-[#333332] hidden md:block">
            QUALITY SOFT SERVICE
          </span>
        </div>

        {/* Menú de Navegación de Escritorio */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold">
          <Link
            href="#promociones"
            className="text-[#333332] hover:text-[#00A7E1] transition-colors"
          >
            Promociones
          </Link>
          <Link
            href="#servicios"
            className="text-[#333332] hover:text-[#00A7E1] transition-colors"
          >
            Servicios
          </Link>
          <Link
            href="#nosotros"
            className="text-[#333332] hover:text-[#00A7E1] transition-colors"
          >
            Sobre Nosotros
          </Link>
          <Link
            href="#contacto"
            className="text-[#333332] hover:text-[#00A7E1] transition-colors"
          >
            Contacto
          </Link>
        </nav>

        {/* Botón de Menú para Móviles */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-[#333332] focus:outline-none"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Menú de Navegación Móvil */}
      <nav
        className={`fixed top-20 left-0 right-0 bottom-0 bg-[#F7F7F7] p-8 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:hidden`}
      >
        <ul className="flex flex-col space-y-6 text-lg font-semibold text-[#333332]">
          <li>
            <Link
              href="#promociones"
              onClick={handleLinkClick}
              className="hover:text-[#00A7E1] transition-colors block"
            >
              Promociones
            </Link>
          </li>
          <li>
            <Link
              href="#servicios"
              onClick={handleLinkClick}
              className="hover:text-[#00A7E1] transition-colors block"
            >
              Servicios
            </Link>
          </li>
          <li>
            <Link
              href="#nosotros"
              onClick={handleLinkClick}
              className="hover:text-[#00A7E1] transition-colors block"
            >
              Sobre Nosotros
            </Link>
          </li>
          <li>
            <Link
              href="#contacto"
              onClick={handleLinkClick}
              className="hover:text-[#00A7E1] transition-colors block"
            >
              Contacto
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

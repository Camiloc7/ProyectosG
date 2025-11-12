'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  FaLinkedin as Linkedin,
  FaWhatsapp as Whatsapp,
  FaYoutube as Youtube,
} from 'react-icons/fa';
import logoImg from '@/../../public/logo.webp';
import TerminosYCondiciones from '../feedback/terminosYCondiciones';
import PoliticaDePrivacidad from '../feedback/politicaDePrivacidad';

export default function Footer() {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const handleTermsOpen = () => setIsTermsOpen(true);
  const handlePrivacyOpen = () => setIsPrivacyOpen(true);

  return (
    <footer className="bg-[#333332] text-white px-20 py-8">
      <div className="text-left">
        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr] gap-8 mb-8">
          {/* Company info */}
          <div>
            {/* <Image
              src={logoImg}
              alt="Quality"
              width={100}
              height={50}
              className="mb-4"
            /> */}
            <img
              src="/logo.webp"
              alt={'Quality'}
              width={100}
              style={{ height: 'auto' }}
            />
            <p className="text-sm">
              Empresa especializada en ofrecer soluciones eficientes y seguras
              para la gestión de facturación electrónica.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-bold mb-4">Navegación</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/pages">Pages</Link>
              </li>
              <li>
                <Link href="/sobre-nosotros">Sobre nosotros</Link>
              </li>
              <li>
                <Link href="/servicios">Servicios</Link>
              </li>
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-bold mb-4">Enlace rápido</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contacto">Contacto</Link>
              </li>
              <li>
                <Link href="/faqs">FAQs</Link>
              </li>
              <li>
                <Link href="/pages">Pages</Link>
              </li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="font-bold mb-4">Contacto</h3>
            <ul className="space-y-2 text-sm">
              <li>Oficina Bogotá: Calle 79B 5-81 Spaces Nogal</li>
              <li>Oficina Medellín: KR 3A SUR 17 98</li>
              <li>Teléfono: +57 310-3188070</li>
              <li>Email: contacto@qualitysoftservice.com</li>
            </ul>
          </div>
        </div>

        {/* Social media */}
        <div className="flex space-x-4 mb-8">
          <Link
            href="https://www.linkedin.com/in/quality-soft-service-39a32b316"
            aria-label="LinkedIn"
            target="_blank" // Abre el enlace en una nueva pestaña
            rel="noopener noreferrer" // Mejora seguridad para evitar problemas de phishing
          >
            <Linkedin className="w-6 h-6" /> {/* Ícono correcto de LinkedIn */}
          </Link>
          <Link
            href="https://wa.link/qualitysoftservice"
            aria-label="Whatsapp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Whatsapp className="w-6 h-6" /> {/* Ícono correcto de WhatsApp */}
          </Link>
          <Link
            href="https://whatsapp.com/channel/0029VayHwAF0bIdm1O9rAz2d"
            aria-label="Canal de difusión WhatsApp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Whatsapp className="w-6 h-6" /> {/* Ícono correcto de WhatsApp */}
          </Link>
          <Link
            href="https://youtube.com/@qualitysoftservices.a.s?si=Lo4kfbaimAWc-hmT"
            aria-label="Canal de YouTube"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Youtube className="w-6 h-6" /> {/* Ícono correcto de YouTube */}
          </Link>
        </div>

        {/* Terms and Privacy */}
        <div className="text-center mt-8 border-t-2 border-gray-700 pt-8">
          <p className="text-sm font-bold">
            &copy; 2024 Quality Bill Service - All Rights Reserved
          </p>
          <p className="text-sm mt-2">
            <span
              className="cursor-pointer underline text-blueQ"
              onClick={handlePrivacyOpen}
            >
              Política de privacidad
            </span>
          </p>
        </div>

        <PoliticaDePrivacidad
          isOpen={isPrivacyOpen}
          onClose={() => setIsPrivacyOpen(false)}
        />
      </div>
    </footer>
  );
}

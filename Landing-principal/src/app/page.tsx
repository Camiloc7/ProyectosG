"use client";

import React, { lazy, Suspense } from "react";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import Header from "@/components/sections/Header";

// Lazy loading para componentes "below the fold"
const Promotions = lazy(() => import("@/components/sections/Promotions"));
const WhyChooseUs = lazy(() => import("@/components/sections/WhyChooseUs"));
const Services = lazy(() => import("@/components/sections/Services"));
const AboutUs = lazy(() => import("@/components/sections/AboutUs"));
const Testimonials = lazy(() => import("@/components/sections/Testimonials"));
const Contact = lazy(() => import("@/components/sections/Contact"));

export default function Home() {
  return (
    <div className="font-montserrat">
      <NavBar />
      <main>
        {/* El Header se carga de forma normal porque es lo primero que el usuario ve */}
        <div id="inicio">
          <Header />
        </div>

        {/* Las secciones que están más abajo se cargan de forma diferida */}
        <Suspense fallback={<div>Cargando...</div>}>
          <div id="promociones">
            <Promotions />
          </div>
          <div id="nosotros">
            <AboutUs />
          </div>
          <div id="por-que-elegirnos">
            <WhyChooseUs />
          </div>
          <div id="servicios">
            <Services />
          </div>
          <div id="testimonios">
            <Testimonials />
          </div>
          <div id="contacto">
            <Contact />
          </div>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

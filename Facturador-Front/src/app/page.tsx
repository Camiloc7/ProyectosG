'use client';

import { useRef } from 'react';
import NavBar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import WhyChooseUs from '@/features/landing/whyChooseUs';
import Integrations from '@/features/landing/integrations';
import Video from '@/features/landing/Video';
import Promociones from '@/features/landing/Promociones';
import Form from '@/features/landing/Form';
import HeroSection from '@/features/landing/heroSection';
import CallToAction from '@/features/landing/callToAction';
import Image from 'next/image';
import Link from 'next/link';
import Servicios from '@/features/landing/Servicios';

export default function Home() {
  const formRef = useRef<HTMLDivElement | null>(null);

  const scrollToForm = () => {
    if (formRef.current) {
      const targetPosition = formRef.current.offsetTop;
      const startPosition = window.scrollY;
      const distance = targetPosition - startPosition;
      const duration = 1000; // Duración en milisegundos (ajusta según lo necesites)
      let startTime: number | null = null;

      const animateScroll = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);

        window.scrollTo(0, startPosition + distance * easeInOutQuad(progress));

        if (elapsedTime < duration) {
          requestAnimationFrame(animateScroll);
        }
      };

      const easeInOutQuad = (t: number) =>
        t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      requestAnimationFrame(animateScroll);
    }
  };

  return (
    <div className="font-montserrat text-center bg-white p-0">
      <NavBar />
      <hr className="border-none border-t border-[#CCCCCC] mt-[20px] mx-auto w-[90%]" />

      <main className="mt-[50px] md:mt-[70px] px-[36px] md:px-0">
        <HeroSection />
        <CallToAction scrollToForm={scrollToForm} />
        <Video />
        <Promociones />
        <WhyChooseUs />
        <hr className="mx-[80px] mt-[65px] md:mt-[132px]" />

        <div ref={formRef}>
          <Form />
        </div>

        <Servicios />
        <Integrations />
      </main>

      <div className="mt-12">
        <Footer />
      </div>
    </div>
  );
}

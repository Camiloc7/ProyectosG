'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import lemontech from '@/../../public/integrations/lemontech.png';
import previred from '@/../../public/integrations/previred.png';
import geoVictoria from '@/../../public/integrations/geovictoria.png';
import endeavor from '@/../../public/integrations/endeavor.png';
import dentalink from '@/../../public/integrations/dentalink.webp';
import fedesoft from '@/../../public/integrations/fedesoft.webp';

interface ImageObject {
  name: string;
  logo: string;
}

const Integrations: React.FC = () => {
  const integrations: ImageObject[] = [
    { name: 'GeoVictoria', logo: geoVictoria.src },
    { name: 'Lemontech', logo: lemontech.src },
    { name: 'Previred', logo: previred.src },
    { name: 'Company 4', logo: endeavor.src },
    { name: 'Company 5', logo: dentalink.src },
    { name: 'Company 6', logo: fedesoft.src },
  ];
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const animate = () => {
      setIsAnimating(true);
      const firstGroup = carousel.querySelector('.group');
      if (firstGroup) {
        const groupWidth = firstGroup.clientWidth;
        carousel.style.transition = 'transform 0.5s ease-in-out';
        carousel.style.transform = `translateX(-${groupWidth}px)`;

        setTimeout(() => {
          carousel.style.transition = 'none';
          carousel.style.transform = 'translateX(0)';
          carousel.appendChild(firstGroup.cloneNode(true));
          firstGroup.remove();
          setIsAnimating(false);
        }, 500);
      }
    };

    const interval = setInterval(() => {
      if (!isAnimating) {
        animate();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isAnimating]);

  const groupedImages = integrations.reduce((result, item, index) => {
    const groupIndex = Math.floor(index / 3);
    if (!result[groupIndex]) {
      result[groupIndex] = [];
    }
    result[groupIndex].push(item);
    return result;
  }, [] as ImageObject[][]);

  return (
    <div className="w-full overflow-hidden px-8 my-20">
      <h2 className="text-4xl font-bold  mb-20">
        Conoce nuestras integraciones
      </h2>
      <div ref={carouselRef} className="flex">
        {groupedImages.map((group, groupIndex) => (
          <div
            key={groupIndex}
            className="group flex-none w-full flex justify-center items-center"
          >
            {group.map((image, index) => (
              <div
                key={image.name}
                className={`w-1/3 flex items-center ${
                  index === 0
                    ? 'justify-end'
                    : index === group.length - 1
                    ? 'justify-start'
                    : 'justify-center'
                }`}
              >
                {/* <Image
                  src={image.logo}
                  alt={image.name}
                  width={300}
                  height={200}
                  className=""
                /> */}
                <img
                  src={image.logo}
                  alt={image.name}
                  width={300}
                  style={{ height: 'auto' }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Integrations;

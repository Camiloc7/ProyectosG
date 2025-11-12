'use client';
import React, { useState, useEffect } from 'react';
import Button from '@/features/landing/Button';
import { useUserStore } from '@/store/useUser';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation'; // Impor
type Plan = 'MYPIME' | 'PRO' | 'Ejecutivo' | 'Emprendedor';

const planDetails = {
  Emprendedor: {
    mensual: '71.400 COP',
    anual: '771.120 COP',
    descuento: '856.800 COP',
    cobertura: [
      'Facturas de venta ilimitadas',
      'Ingresos hasta $60.000.000 COP mensuales',
      'No incluye Contabilidad',
    ],
  },
  MYPIME: {
    mensual: '142.800 COP',
    anual: '1.542.240 COP',
    descuento: '1.713.600 COP',
    cobertura: [
      'Facturas de venta ilimitadas',
      'Ingresos hasta $120.000.000 COP mensuales',
      'No incluye Contabilidad',
    ],
  },
  PRO: {
    mensual: '214.200 COP',
    anual: '2.313.360 COP',
    descuento: '2.570.400 COP',
    cobertura: [
      'Facturas de venta ilimitadas',
      'Ingresos hasta $180.000.000 COP mensuales',
      'Contabilidad',
    ],
  },
  Ejecutivo: {
    mensual: '285.600 COP',
    anual: '3.084.480 COP',
    descuento: '3.429.600 COP',
    cobertura: [
      'Facturas de venta ilimitadas',
      'Ingresos sin límite mensual',
      'Sistema de nominas electronicas',
      'Contabilidad',
    ],
  },
};

const PlanCard = ({
  plan,
  isHighlighted,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  plan: Plan;
  isHighlighted: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) => {
  const { mensual, anual, descuento, cobertura } = planDetails[plan];
  return (
    <div
      className={`w-[275px] py-[36px] px-[30px] rounded-[20px] transform transition-transform duration-500 ease-in-out ${
        isHighlighted
          ? 'bg-[#00A7E1] text-white scale-110'
          : 'bg-[#F2F2F2] hover:scale-110 hover:bg-[#00A7E1] hover:text-white'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick} // Ahora cualquier parte de la tarjeta abre el modal
    >
      <p className="mt-[10px] font-bold text-[20px] mb-10 ">{plan}</p>
      {/*
      <p className="mt-[20px] flex items-center gap-[5px] justify-center">
        <span className="font-medium text-[16px]">$</span>
        <span className="text-[20px] font-bold">{mensual}</span>
        <span className="text-[12px] font-[600]">/ mensual</span>
      </p>
      <p className="font-semibold text-[13px] mb-[8px]">{`$ ${anual} / anual`}</p>
      <button className="h-[2.25rem] w-[3.5rem] mb-[8px] text-xs font-medium font-inter rounded-[16px] bg-[#E2F5FF] text-[#00A7E1] hover:bg-[#6DBEDA] hover:text-white">
        10%
      </button>
      <p className="font-semibold text-[13px] mb-[4px]">
        <span className="line-through">{`$ ${descuento}`}</span> / anual
      </p>
      <p className="text-[13px] mb-[20px]">Precios con IVA incluido</p> */}

      <Button title="Compra ahora" bg={isHighlighted ? '#FFFFFF' : '#00A7E1'} />
      <p className="font-bold text-sm mt-[40px] mb-[6px] text-start">
        Cobertura
      </p>
      <ul>
        {cobertura.map((item, index) => (
          <li
            key={index}
            className={`flex items-center justify-between text-[13px] p-[8px] mb-2 rounded ${
              isHighlighted
                ? 'bg-[#6DBEDA] text-white'
                : 'bg-[#DFDFDF] hover:text-white'
            }`}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Promociones = () => {
  const [hoveredPlan, setHoveredPlan] = useState<Plan | null>(null);
  const [highlightedPlan, setHighlightedPlan] = useState<Plan>('PRO'); // Inicialmente "PRO" está resaltado
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isOnLanding, setIsOnLanding] = useState<boolean>(false);

  const router = useRouter();
  const pathname = usePathname(); // Obtiene la ruta actual

  const openModal = (plan: Plan) => {
    setSelectedPlan(plan);
    setHighlightedPlan(plan); // Marca la tarjeta como destacada
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setHighlightedPlan('PRO');
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && pathname === '/') {
      setIsOnLanding(true);
    }
  }, [pathname]);

  const handleAbrirMensual = () => {
    // console.log(selectedPlan);
    // if (isOnLanding) {
    //   router.push('/login');
    //   return;
    // }
    if (selectedPlan === 'MYPIME') {
      window.open(
        'https://subscription-landing.epayco.co/plan/7ade610566882a9dc092e82',
        '_blank'
      );
    }
    if (selectedPlan === 'PRO') {
      window.open(
        'https://subscription-landing.epayco.co/plan/7ade93851cc7eebeb0c89e2',
        '_blank'
      );
    }
    if (selectedPlan === 'Ejecutivo') {
      window.open(
        'https://subscription-landing.epayco.co/plan/7adea72a2ef4d68de091772',
        '_blank'
      );
    }
    if (selectedPlan === 'Emprendedor') {
      window.open(
        'https://subscription-landing.epayco.co/plan/7bcf3775498fc11ab08f7c2',
        '_blank'
      );
    }
  };

  const handleAbrirAnual = () => {
    // if (isOnLanding) {
    //   router.push('/login');
    //   return;
    // }
    if (selectedPlan === 'MYPIME') {
      window.open(
        'https://subscription-landing.epayco.co/plan/7ade8de613ab4c8c80e3c32',
        '_blank'
      );
    }
    if (selectedPlan === 'PRO') {
      window.open(
        'https://subscription-landing.epayco.co/plan/7ade9840232a13f160adb33',
        '_blank'
      );
    }
    if (selectedPlan === 'Ejecutivo') {
      window.open(
        'https://subscription-landing.epayco.co/plan/7adea91049fbde96407be82',
        '_blank'
      );
    }
    if (selectedPlan === 'Emprendedor') {
      window.open(
        'https://subscription-landing.epayco.co/plan/7bcf3a51f0e4aa14a0b3155',
        '_blank'
      );
    }
  };

  return (
    <div className="md:px-[80px] mb-[135px]">
      <h2 className="text-[34px] md:text-[36px] font-bold mt-[132px] mb-[77px]">
        Conoce nuestras promociones exclusivas
      </h2>
      <div
        className="flex flex-col md:flex-row gap-[20px] justify-center"
        onMouseLeave={() => setHoveredPlan(null)} // Restablece cuando el mouse sale del contenedor
      >
        {Object.keys(planDetails).map((plan) => (
          <PlanCard
            key={plan}
            plan={plan as Plan}
            onClick={() => openModal(plan as Plan)}
            isHighlighted={
              hoveredPlan === plan || (!hoveredPlan && highlightedPlan === plan)
            }
            onMouseEnter={() => setHoveredPlan(plan as Plan)}
            onMouseLeave={() => setHoveredPlan(null)}
          />
        ))}
      </div>
      {/* Modal principal */}
      {isModalOpen && selectedPlan && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg w-[50%]">
            <h3 className="text-lg font-bold mb-4">
              Elige el tipo de plan para {selectedPlan}
            </h3>
            <div className="flex justify-around mb-4">
              <Button
                title={`Mensual: ${planDetails[selectedPlan].mensual}`}
                bg="#00A7E1"
                onClick={() => {
                  handleAbrirMensual();
                }}
              />
              <Button
                title={`Anual: ${planDetails[selectedPlan].anual}`}
                bg="#00A7E1"
                onClick={() => {
                  handleAbrirAnual();
                }}
              />
            </div>
            <button
              className="bg-white border border-[#787878] text-[#787878] hover:bg-gray-300 px-4 py-2 text-sm font-normal rounded-[25px]"
              onClick={closeModal}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Promociones;

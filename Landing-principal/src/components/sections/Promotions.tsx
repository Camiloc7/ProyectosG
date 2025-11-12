"use client";
import React, { useState } from "react";
import { Check, Handshake, Rocket, Briefcase, Diamond } from "lucide-react";

type Plan = "Emprendedor" | "MYPIME" | "PRO" | "Ejecutivo";

const planDetails = {
  Emprendedor: {
    icon: Handshake,
    mensual: "71.400 COP",
    anual: "771.120 COP",
    descuento: "856.800 COP",
    cobertura: [
      "Facturas de venta ilimitadas",
      "Ingresos hasta $60.000.000 COP mensuales",
      "No incluye Contabilidad",
    ],
    mensualLink:
      "https://subscription-landing.epayco.co/plan/7bcf3775498fc11ab08f7c2",
    anualLink:
      "https://subscription-landing.epayco.co/plan/7bcf3a51f0e4aa14a0b3155",
  },
  MYPIME: {
    icon: Rocket,
    mensual: "142.800 COP",
    anual: "1.542.240 COP",
    descuento: "1.713.600 COP",
    cobertura: [
      "Facturas de venta ilimitadas",
      "Ingresos hasta $120.000.000 COP mensuales",
      "No incluye Contabilidad",
    ],
    mensualLink:
      "https://subscription-landing.epayco.co/plan/7ade610566882a9dc092e82",
    anualLink:
      "https://subscription-landing.epayco.co/plan/7ade8de613ab4c8c80e3c32",
  },
  PRO: {
    icon: Briefcase,
    mensual: "214.200 COP",
    anual: "2.313.360 COP",
    descuento: "2.570.400 COP",
    cobertura: [
      "Facturas de venta ilimitadas",
      "Ingresos hasta $180.000.000 COP mensuales",
      "Contabilidad",
    ],
    mensualLink:
      "https://subscription-landing.epayco.co/plan/7ade93851cc7eebeb0c89e2",
    anualLink:
      "https://subscription-landing.epayco.co/plan/7ade9840232a13f160adb33",
  },
  Ejecutivo: {
    icon: Diamond,
    mensual: "285.600 COP",
    anual: "3.084.480 COP",
    descuento: "3.429.600 COP",
    cobertura: [
      "Facturas de venta ilimitadas",
      "Ingresos sin límite mensual",
      "Sistema de nominas electronicas",
      "Contabilidad",
    ],
    mensualLink:
      "https://subscription-landing.epayco.co/plan/7adea72a2ef4d68de091772",
    anualLink:
      "https://subscription-landing.epayco.co/plan/7adea91049fbde96407be82",
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
  const {
    icon: Icon,
    mensual,
    anual,
    descuento,
    cobertura,
  } = planDetails[plan];
  return (
    <div
      className={`relative w-[275px] py-10 px-6 rounded-3xl transform transition-all duration-500 ease-in-out cursor-pointer z-0 ${
        isHighlighted
          ? "bg-[#00A7E1] text-white scale-110 shadow-2xl z-10"
          : "bg-[#F7F7F7] text-[#333332] hover:scale-105 hover:bg-[#00A7E1] hover:text-white hover:z-10"
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center">
        <div className="text-[#00A7E1] mb-4">
          <Icon
            size={40}
            className={isHighlighted ? "text-white" : "text-[#00A7E1]"}
          />
        </div>
        <p className="font-extrabold text-2xl mb-1">{plan}</p>
        <p
          className={`text-gray-500 font-semibold mb-6 ${
            isHighlighted ? "text-gray-200" : ""
          }`}
        >
          Precio sin IVA incluido
        </p>

        <div className="flex flex-col items-center mb-6">
          <div className="text-3xl font-extrabold">
            {mensual.replace(" COP", "")} + IVA
          </div>
          <span className="text-sm">/ mensual</span>
          <span
            className={`line-through text-gray-500 ${
              isHighlighted ? "text-gray-300" : ""
            }`}
          >{`${descuento.replace(" COP", "")}`}</span>
          <div className="text-xl font-extrabold">
            {anual.replace(" COP", "")} + IVA
          </div>
          <span className="text-sm">/ anual</span>
        </div>

        <div className="w-full">
          <h4
            className={`text-md font-bold mb-4 text-left ${
              isHighlighted ? "text-white" : "text-[#333332]"
            }`}
          >
            Cobertura
          </h4>
          <ul className="text-left w-full space-y-2">
            {cobertura.map((item, index) => (
              <li
                key={index}
                className={`flex items-center text-sm p-2 rounded-lg ${
                  isHighlighted ? "bg-[#6DBEDA]" : "bg-[#DFDFDF]"
                }`}
              >
                <Check size={16} className="text-white flex-shrink-0 mr-2" />
                <span
                  className={isHighlighted ? "text-white" : "text-gray-700"}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default function Promotions() {
  const [hoveredPlan, setHoveredPlan] = useState<Plan | null>(null);
  const [highlightedPlan, setHighlightedPlan] = useState<Plan>("PRO");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const openModal = (plan: Plan) => {
    setSelectedPlan(plan);
    setHighlightedPlan(plan);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setHighlightedPlan("PRO");
  };

  const handleAbrirMensual = () => {
    if (selectedPlan && planDetails[selectedPlan].mensualLink) {
      window.open(planDetails[selectedPlan].mensualLink, "_blank");
    }
  };

  const handleAbrirAnual = () => {
    if (selectedPlan && planDetails[selectedPlan].anualLink) {
      window.open(planDetails[selectedPlan].anualLink, "_blank");
    }
  };

  return (
    <section id="promociones" className="bg-[#E8EDF0] py-20 px-4">
      <div className="container mx-auto text-center md:px-20">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#333332] mb-12">
          Conoce nuestras promociones exclusivas
        </h2>

        <div
          className="flex flex-col md:flex-row flex-wrap justify-center gap-8 md:gap-4 lg:gap-8"
          onMouseLeave={() => setHoveredPlan(null)}
        >
          {Object.keys(planDetails).map((plan) => (
            <PlanCard
              key={plan}
              plan={plan as Plan}
              onClick={() => openModal(plan as Plan)}
              isHighlighted={
                hoveredPlan === plan ||
                (!hoveredPlan && highlightedPlan === plan)
              }
              onMouseEnter={() => setHoveredPlan(plan as Plan)}
              onMouseLeave={() => setHoveredPlan(null)}
            />
          ))}
        </div>
      </div>

      {/* Modal para selección de plan */}
      {isModalOpen && selectedPlan && (
        <div
          className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-gray-900/30 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white p-8 rounded-xl w-11/12 max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 text-[#333332] text-center">
              Elige tu tipo de plan para{" "}
              <span className="text-[#00A7E1]">{selectedPlan}</span>
            </h3>
            <div className="flex flex-col md:flex-row justify-center gap-4 mb-6">
              <button
                className="w-full bg-[#00A7E1] text-white font-bold py-3 px-6 rounded-full transition-colors hover:bg-[#008BB4]"
                onClick={handleAbrirMensual}
              >
                Mensual: {planDetails[selectedPlan].mensual}
              </button>
              <button
                className="w-full bg-[#00A7E1] text-white font-bold py-3 px-6 rounded-full transition-colors hover:bg-[#008BB4]"
                onClick={handleAbrirAnual}
              >
                Anual: {planDetails[selectedPlan].anual}
              </button>
            </div>
            <button
              className="bg-white border border-gray-400 text-gray-700 hover:bg-gray-100 font-medium py-2 px-6 rounded-full transition-colors w-full"
              onClick={closeModal}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

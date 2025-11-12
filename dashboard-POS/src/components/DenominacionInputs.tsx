// src/components/caja/DenominacionInputs.tsx

"use client";
import React from "react";
import { PlusCircle, MinusCircle } from "lucide-react";
import { DenominacionData } from "@/stores/cierreDeCajaStore";

// Define las denominaciones que vas a usar
const ALL_DENOMINATIONS = [
  { value: 100000, img: "/dinero/100_mil.png" },
  { value: 50000, img: "/dinero/50_mil.jpg" },
  { value: 20000, img: "/dinero/20_mil.png" },
  { value: 10000, img: "/dinero/10_mil.jpg" },
  { value: 5000, img: "/dinero/5_mil.jpg" },
  { value: 2000, img: "/dinero/2_mil.png" },
  { value: 1000, img: "/dinero/1000 pesos.png" },
  { value: 500, img: "/dinero/500 pesos.png" },
  { value: 200, img: "/dinero/200 pesos.png" },
  { value: 100, img: "/dinero/100 pesos.png" },
  { value: 50, img: "/dinero/50 pesos.png" },
];

interface DenominacionInputsProps {
  denominaciones: DenominacionData;
  setDenominaciones: (data: DenominacionData) => void;
  setTotal: (total: number) => void;
}

const DenominacionInputs: React.FC<DenominacionInputsProps> = ({
  denominaciones,
  setDenominaciones,
  setTotal,
}) => {
  const handleCountChange = (denom: number, value: string) => {
    const num = Math.max(0, Math.floor(Number(value) || 0));
    const newDenominaciones = { ...denominaciones, [denom]: num };
    setDenominaciones(newDenominaciones);
    calculateTotal(newDenominaciones);
  };

  const handleBillClick = (denom: number, operation: "sum" | "subtract") => {
    const newDenominaciones = { ...denominaciones };
    const newCount =
      operation === "sum"
        ? (newDenominaciones[denom] || 0) + 1
        : Math.max((newDenominaciones[denom] || 0) - 1, 0);
    newDenominaciones[denom] = newCount;

    setDenominaciones(newDenominaciones);
    calculateTotal(newDenominaciones);
  };

  const calculateTotal = (data: DenominacionData) => {
    const sum = ALL_DENOMINATIONS.reduce((acc, { value }) => {
      const cnt = data[value] || 0;
      return acc + value * cnt;
    }, 0);
    setTotal(sum);
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Billetes */}
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
        Billetes
      </h2>
      <div className="flex overflow-x-auto gap-3 pb-3 sm:pb-4 snap-x">
        {ALL_DENOMINATIONS.filter((d) => d.value >= 2000).map(
          ({ value, img }) => (
            <div
              key={value}
              className="bg-white text-black rounded-lg p-3 sm:p-4 shadow-md flex flex-col items-center justify-center min-w-[140px] snap-center"
            >
              <img
                src={img}
                alt={`Billete de ${value.toLocaleString()}`}
                className="w-full max-h-28 sm:max-h-36 object-contain cursor-pointer rounded-md mb-2"
                onClick={() => handleBillClick(value, "sum")}
              />
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  type="button"
                  onClick={() => handleBillClick(value, "subtract")}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  <MinusCircle size={20} />
                </button>
                <input
                  type="number"
                  min={0}
                  className="w-14 sm:w-16 p-1 sm:p-2 text-center border border-gray-300 rounded-md text-sm sm:text-base"
                  value={denominaciones[value] ? denominaciones[value] : ""}
                  onChange={(e) => handleCountChange(value, e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => handleBillClick(value, "sum")}
                  className="text-gray-500 hover:text-green-500 transition-colors"
                >
                  <PlusCircle size={20} />
                </button>
              </div>
              <div className="text-gray-800 font-medium text-sm sm:text-lg mt-2">
                ${value.toLocaleString()}
              </div>
            </div>
          )
        )}
      </div>

      {/* Monedas */}
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
        Monedas
      </h2>
      <div className="flex overflow-x-auto gap-3 pb-3 sm:pb-4 snap-x">
        {ALL_DENOMINATIONS.filter((d) => d.value < 2000).map(
          ({ value, img }) => (
            <div
              key={value}
              className="bg-white text-black rounded-lg p-3 shadow-md flex flex-col items-center min-w-[100px] snap-center"
            >
              <img
                src={img}
                alt={`Moneda de ${value.toLocaleString()}`}
                className="w-12 h-12 object-contain cursor-pointer mb-1"
                onClick={() => handleBillClick(value, "sum")}
              />
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => handleBillClick(value, "subtract")}
                >
                  <MinusCircle size={16} />
                </button>
                <input
                  type="number"
                  min={0}
                  className="w-10 sm:w-12 p-1 text-center border border-gray-300 rounded-md text-xs sm:text-sm"
                  value={denominaciones[value] || ""}
                  onChange={(e) => handleCountChange(value, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleBillClick(value, "sum")}
                >
                  <PlusCircle size={16} />
                </button>
              </div>
              <div className="text-gray-800 font-medium text-xs sm:text-sm mt-1">
                ${value.toLocaleString()}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default DenominacionInputs;

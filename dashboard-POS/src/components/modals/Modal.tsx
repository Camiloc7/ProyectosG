"use client";
import React from "react";
import { XCircle } from "lucide-react";
import { FONDO_COMPONENTES } from "@/styles/colors";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 backdrop-blur-md bg-white/30 dark:bg-black/20 flex items-center justify-center z-[201] transition-all"
      onClick={onClose}
    >
  <div
  className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-auto transform transition-all duration-300 scale-100 opacity-100 font-sans"
  style={{ backgroundColor: FONDO_COMPONENTES }}
  onClick={(e) => e.stopPropagation()}
>

        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

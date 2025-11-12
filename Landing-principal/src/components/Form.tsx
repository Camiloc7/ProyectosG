"use client";

import React, { useState } from "react";

export default function Form() {
  const [formData, setFormData] = useState({
    interes: "",
    nombre: "",
    email: "",
    numero: "",
    mensaje: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Aquí puedes agregar la lógica para enviar el formulario, por ejemplo, a una API o a un servicio de email.
    console.log("Datos del formulario:", formData);
    alert("¡Mensaje enviado con éxito!");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col">
        <label
          htmlFor="interes"
          className=" bg-[#EAF2FF] mb-2 text-sm font-semibold text-gray-700"
        >
          Estoy interesado en:
        </label>
        <select
          name="interes"
          id="interes"
          value={formData.interes}
          onChange={handleChange}
          className="w-full p-3 rounded-lg border border-gray-400 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue bg-[#EAF2FF] text-gray-700"
          required
        >
          <option value="" disabled>
            Selecciona una opción
          </option>
          <option value="Contratar">Contratar</option>
          <option value="Cotizar">Cotizar</option>
          <option value="Una demo">Una demo</option>
          <option value="Necesito soporte">Necesito soporte</option>
          <option value="Otro">Otro</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label
            htmlFor="nombre"
            className="mb-2 text-sm font-semibold text-gray-700"
          >
            Tu nombre
          </label>
          <input
            type="text"
            name="nombre"
            id="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className="p-3 rounded-lg border border-gray-300 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
            required
            autoComplete="name"
          />
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="email"
            className="mb-2 text-sm font-semibold text-gray-700"
          >
            Tu email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            className="p-3 rounded-lg border border-gray-300 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="flex flex-col">
        <label
          htmlFor="numero"
          className="mb-2 text-sm font-semibold text-gray-700"
        >
          Tu Número
        </label>
        <input
          type="tel"
          name="numero"
          id="numero"
          value={formData.numero}
          onChange={handleChange}
          className="p-3 rounded-lg border border-gray-300 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
          required
          autoComplete="tel"
        />
      </div>

      <div className="flex flex-col">
        <label
          htmlFor="mensaje"
          className="mb-2 text-sm font-semibold text-gray-700"
        >
          Tu mensaje
        </label>
        <textarea
          name="mensaje"
          id="mensaje"
          value={formData.mensaje}
          onChange={handleChange}
          rows={5}
          className="p-3 rounded-lg border border-gray-300 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
          required
        ></textarea>
      </div>

      <button
        type="submit"
        className="w-full bg-brand-blue text-gray-800 rounded-lg py-3 font-bold hover:bg-brand-dark-blue transition-colors"
      >
        Enviar mensaje
      </button>
    </form>
  );
}

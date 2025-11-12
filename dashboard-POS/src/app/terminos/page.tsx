"use client";

import { ArrowLeft } from "lucide-react";
import { FONDO, ORANGE } from "@/styles/colors";
import { useRouter } from "next/navigation";

export default function TerminosYCondiciones() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: FONDO,
        padding: 24,
        fontFamily: "Lato, sans-serif",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
      onClick={() => router.push("/")}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: 24,
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{ display: "flex", alignItems: "center", marginBottom: 24 }}
        >
          <h1
            style={{
              marginLeft: 12,
              fontSize: 22,
              fontWeight: 700,
              color: "#333",
              userSelect: "none",
            }}
          >
            Política de Privacidad para la Aplicación Mobil "Gastro POS"
          </h1>
        </div>

        <p style={{ fontSize: 14, color: "#4a4a4a", marginBottom: 8 }}>
          <strong>Última actualización:</strong> Septiembre 2025
        </p>

        <h3
          style={{
            fontWeight: 600,
            marginTop: 16,
            marginBottom: 4,
            fontSize: 14,
            color: "#333",
          }}
        >
          Terminos y Condiciones
        </h3>
        <p style={{ fontSize: 14, color: "#4a4a4a", marginBottom: 8 }}>
          Nuestra aplicación es utilizada únicamente para gestionar pedidos
          dentro del restaurante. No recopilamos información personal de los
          usuarios, ni compartimos datos con terceros. Todos los datos generados
          se mantienen de forma interna para la correcta operación de los
          pedidos.
        </p>

        <ul
          style={{
            fontSize: 14,
            color: "#4a4a4a",
            marginBottom: 8,
            paddingLeft: 20,
          }}
        >
          <li>
            <strong>Correo electrónico:</strong> soporte@qualitysoftservices.com
          </li>
          <li>
            <strong>Teléfono:</strong> +57 310-3188070
          </li>
        </ul>

        <p style={{ marginTop: 16, fontSize: 14, color: "#4a4a4a" }}>
          Gracias por confiar en "Quality Soft Service" para sus necesidades en
          el sector constructor. Su privacidad es nuestra prioridad.
        </p>
      </div>
    </div>
  );
}

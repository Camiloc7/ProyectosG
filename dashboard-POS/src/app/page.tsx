"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FONDO,
  ORANGE,
  FONDO_COMPONENTES,
  COLOR_INPUT_BG,
} from "../styles/colors";
import { useAuthStore } from "../stores/authStore";
import Spinner from "../components/feedback/Spinner";
import { Eye, EyeClosed, EyeOff } from "lucide-react";
import icon from "../assets/icon.png";
import Image from "next/image";
import Checkbox from "@/components/ui/CheckBox";

export default function Home() {
  const router = useRouter();
  const { loginAsync } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await loginAsync(email, password);
      if (response === "error") return;
      switch (response) {
        case "MESERO":
          router.push("/mesero");
          break;
        case "COCINERO":
          router.push("/cocinero");
          break;
        case "CAJERO":
          router.push("/cajero");
          break;
        default:
          router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado.");
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Spinner />}

      <div
        className="flex items-center justify-center min-h-screen font-lato"
        style={{ backgroundColor: FONDO }}
      >
        <div
          className="flex rounded-[24px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.1)]"
          style={{ backgroundColor: FONDO_COMPONENTES }}
        >
          {/* Imagen izquierda */}
          <div className="hidden md:block w-[320px] h-auto relative">
            <img
              src="https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?q=80&w=685&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="login"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Formulario */}
          <div className="p-8 w-[420px] flex flex-col justify-center">
            <h1 className="text-[28px] font-semibold text-[#333] text-center">
              Gastro POS
            </h1>

            <div className="flex flex-col items-center justify-center gap-2 mb-4">
              <span className="text-[14px] text-[#666]">
                Construya con liquidez. Facture con Quality
              </span>
              <Image
                src={icon}
                alt="Logo"
                width={30}
                height={30}
                className="object-contain"
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
              <div>
                <label
                  className="block text-[16px] font-medium text-[#555] mb-2.5"
                  htmlFor="email"
                >
                  Usuario
                </label>
                <input
                  id="email"
                  type="text"
                  placeholder="nombre@lacava.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-[48px] px-[18px] rounded-[25px] text-[15px] text-[#2A2A2A] box-border"
                  style={{
                    border: `1px solid ${ORANGE}`,
                    backgroundColor: COLOR_INPUT_BG,
                  }}
                />
              </div>

              <div className="relative">
                <label
                  className="block text-[16px] font-medium text-[#555] mb-2.5"
                  htmlFor="password"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-[48px] px-[18px] pr-[40px] rounded-[25px] text-[15px] text-[#2A2A2A] box-border"
                  style={{
                    border: `1px solid ${ORANGE}`,
                    backgroundColor: COLOR_INPUT_BG,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  className="absolute right-4 top-14.5 transform -translate-y-1/2 text-[20px] text-orange-500 flex items-center justify-center w-6 h-6 cursor-pointer"
                  style={{ color: ORANGE }}
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={!acceptedTerms}
                className={`w-full h-[46px] mt-3 rounded-[25px] font-semibold text-[16px] text-white cursor-pointer shadow-[0_4px_10px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-[0_6px_14px_rgba(0,0,0,0.15)] border-none ${
                  !acceptedTerms ? "opacity-50 cursor-not-allowed" : ""
                }`}
                style={{ backgroundColor: ORANGE }}
              >
                Ingresar
              </button>

              {error && (
                <p className="text-red-600 text-center mt-4 text-sm">{error}</p>
              )}
            </form>

            {/* Checkbox Aceptar Términos */}
            <div className="flex items-center gap-2 mt-4  justify-center mb-4">
              <Checkbox
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e)}
              />
              <label
                htmlFor="acceptTerms"
                className="text-[14px] text-[#555] select-none"
              >
                Acepto los{" "}
                <span
                  onClick={() => router.push("/terminos")}
                  className="text-orange-500 underline cursor-pointer"
                >
                  Términos y Condiciones
                </span>
              </label>
            </div>

            <div className="flex flex-col items-center justify-center gap-2">
              <p className="text-[12px] text-[#999] text-center">
                Desarrollado por Quality Soft Service
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

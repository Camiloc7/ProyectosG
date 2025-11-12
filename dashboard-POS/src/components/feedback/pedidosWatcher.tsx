// src/components/PedidosWatcher.tsx
"use client";
import { useEffect } from "react";
import { useConfirm } from "@/components/feedback/confirmModal";
import { usePedidosStore } from "@/stores/pedidosStore";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export default function PedidosWatcher() {
  const confirm = useConfirm();
  const { user } = useAuthStore();
  const { traerPedidos, pedidos } = usePedidosStore();
  const router = useRouter();
  const pathname = usePathname();

  // Traer pedidos si es admin
  useEffect(() => {
    if (user?.rol === "ADMIN") {
      traerPedidos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Verificar pendientes (excepto en "/")
  useEffect(() => {
    const checkPendientes = async () => {
      if (pathname === "/") return; // 👈 no hacer nada si estamos en "/"

      if (pedidos.length > 0) {
        const pendientesDePago = pedidos.filter(
          (e) => e.estado === "PENDIENTE_PAGO"
        );

        const yaMostrado = localStorage.getItem("alertaPendientePago");

        if (pendientesDePago.length > 0 && !yaMostrado) {
          const confirmado = await confirm({
            title: `⚠️ Se cerró la caja automáticamente y hay ${pendientesDePago.length} pedidos pendientes de pago.`,
            description: "¿Deseas continuar con el pago del pedido pendiente?",
            confirmText: "Revisar en Caja",
            cancelText: "No hacer nada",
          });

          if (confirmado) {
            router.push("/cajero");
          }

          localStorage.setItem("alertaPendientePago", "true");
        }
      }
    };

    checkPendientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidos, router, pathname]);

  return null; // este componente solo escucha efectos
}

// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import TopBar from "@/components/layout/TopBar";
import { Toaster } from "react-hot-toast";
import { COLOR_ERROR, FONDO_COMPONENTES, ORANGE } from "@/styles/colors";
import { ConfirmProvider } from "@/components/feedback/confirmModal";
import AuthInitializer from "@/components/auth/AuthInitializer";
import ScrollToTopOnRouteChange from "@/helpers/ScrollToTop";
import RouteLoader from "@/components/feedback/RouteLoader";
import * as Tooltip from "@radix-ui/react-tooltip";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Tooltip.Provider delayDuration={0}>
          <ConfirmProvider>
            {/* Header */}
            <TopBar />
            <ScrollToTopOnRouteChange />

            {/* 🔥 Spinner de carga */}
            <RouteLoader />

            <div className="flex flex-col min-h-[calc(100vh-4rem)]">
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: FONDO_COMPONENTES,
                    color: "#1a1a1a",
                    border: `1px solid ${ORANGE}`,
                    fontSize: "14px",
                    padding: "12px 16px",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
                    borderRadius: "12px",
                  },
                  success: {
                    duration: 2000, // ✅ los success duran solo 2 segundos
                    iconTheme: {
                      primary: ORANGE,
                      secondary: "#fff",
                    },
                  },
                  error: {
                    duration: 3000, // puedes ajustar si quieres
                    style: {
                      border: `1px solid ${COLOR_ERROR}`,
                    },
                    iconTheme: {
                      primary: COLOR_ERROR,
                      secondary: "#fff",
                    },
                  },
                }}
              />

              <main className="flex-1">
                <AuthInitializer>{children}</AuthInitializer>
              </main>
            </div>
          </ConfirmProvider>
        </Tooltip.Provider>
      </body>
    </html>
  );
}

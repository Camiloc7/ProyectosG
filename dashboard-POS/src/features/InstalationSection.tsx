import { useEffect, useState } from "react";
import { LaptopMinimal, TabletSmartphone, Printer } from "lucide-react"; 
import { getLatestReleaseDownloadUrl } from "@/helpers/getLatestExe";
import toast from "react-hot-toast";

const FONDO_INSTALACION = "#fdede6";
const ICONO_COLOR = "#ed4e05";

const InstallationSection = () => {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchDownloadUrl = async () => {
      const url = await getLatestReleaseDownloadUrl();
      setDownloadUrl(url);
    };

    fetchDownloadUrl();
  }, []);

  const pluginDownloadUrl = "/Impresoras-Gastro-Pos.exe"; 

  return (
    <div className="max-w-6xl mx-auto my-12 p-8 rounded-3xl" style={{ backgroundColor: FONDO_INSTALACION }}>
      <h2
        className="text-3xl font-semibold text-center mb-8 text-gray-900"
        style={{ color: ICONO_COLOR }}
      >
        Instalación del Software
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Sección de escritorio */}
        <div className="flex flex-col items-center text-center p-6 rounded-xl shadow-lg bg-white">
          <LaptopMinimal
            size={64}
            style={{ color: ICONO_COLOR }}
            className="mb-4"
          />
          <h3 className="text-xl font-bold mb-2 text-gray-900">
            App de Escritorio
          </h3>
          <p className="text-gray-700 mb-4">
            Este archivo .exe debe instalarse en el ordenador o caja principal
            del restaurante para que el sistema funcione correctamente.
          </p>
          <a
            href={downloadUrl || "#"}
            download
            className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            onClick={(e) => {
              if (!downloadUrl) {
                e.preventDefault();
                toast.error("El enlace de descarga aún no está listo.");
              }
            }}
          >
            Descargar .EXE
          </a>
        </div>

        {/* Sección de móvil */}
        <div className="flex flex-col items-center text-center p-6 rounded-xl shadow-lg bg-white text-gray-900">
          <TabletSmartphone
            size={64}
            style={{ color: ICONO_COLOR }}
            className="mb-4"
          />
          <h3 className="text-xl font-bold mb-2">App para Meseros</h3>
          <p className="text-gray-700 mb-4">
            Este archivo .apk debe instalarse en cada dispositivo de los meseros
            (teléfono o tablet). Solo así podrán registrar pedidos desde la
            mesa.
          </p>
          <a
            onClick={() => toast.error("En desarrollo")}
            download
            className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors cursor-pointer"
          >
            Descargar .APK
          </a>
        </div>

      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div className="flex flex-col items-center text-center p-6 rounded-xl shadow-lg bg-white col-span-1 md:col-span-2">
          <Printer
            size={64}
            style={{ color: ICONO_COLOR }}
            className="mb-4"
          />
          <h3 className="text-2xl font-bold mb-2 text-gray-900" style={{ color: ICONO_COLOR }}>
            Plugin para Impresoras
          </h3>
          <p className="text-gray-700 mb-4 max-w-lg">
            Este archivo .exe es necesario para que el sistema pueda comunicarse  directamente a sus impresoras de punto de venta. Debe instalarse en el ordenador que controla la impresora.
          </p>
          <a
            href={pluginDownloadUrl}
            download
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Descargar Plugin (.EXE)
          </a>
        </div>
      </div>
    </div>
  );
};

export default InstallationSection;

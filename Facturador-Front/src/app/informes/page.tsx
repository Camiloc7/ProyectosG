'use client';

import PrivateRoute from '@/helpers/PrivateRoute';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import SimpleSelect from '@/components/ui/SimpleSelect';
import SelectConSearch from '@/components/ui/selectConSearch';
import DatePickerInput from '@/components/ui/inputFechaCalendario';
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ReactECharts from 'echarts-for-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { useInformesStore } from '@/store/useInformesStore';
import Spinner from '@/components/feedback/Spinner';
import BotonQuality from '@/components/ui/BotonQuality';

// 🎨 Colores de la empresa
const COLORS = ['#00A7E1', '#007EAD', '#C3C3C3', '#6F6F6F'];

export default function Informes() {
  const { traerInformesTotales, loading, informesTotales } = useInformesStore();

  const hoy = new Date();
  const haceUnAño = new Date();
  haceUnAño.setFullYear(hoy.getFullYear() - 1);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    fechaInicial1: formatDate(haceUnAño),
    fechaFinal1: formatDate(hoy),
  });
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const [periodo, setPeriodo] = useState('Anual');
  const [loadingScreenShot, setLoading] = useState<boolean>(false);

  const handleDateChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 🗓️ Función para calcular fechas según periodo
  const calcularFechasPorPeriodo = (tipo: string) => {
    const hoy = new Date();
    let fechaInicial = new Date(hoy);

    switch (tipo) {
      case 'Diario':
        fechaInicial = new Date(hoy); // mismo día
        break;
      case 'Semanal':
        fechaInicial.setDate(hoy.getDate() - 7);
        break;
      case 'Mensual':
        fechaInicial.setMonth(hoy.getMonth() - 1);
        break;
      case 'Cuatrimestral':
        fechaInicial.setMonth(hoy.getMonth() - 4);
        break;
      case 'Anual':
        fechaInicial.setFullYear(hoy.getFullYear() - 1);
        break;
      default:
        fechaInicial = new Date(hoy);
    }

    return {
      fechaInicial1: formatDate(fechaInicial),
      fechaFinal1: formatDate(hoy),
    };
  };

  useEffect(() => {
    const nuevasFechas = calcularFechasPorPeriodo(periodo);
    setFormData({
      fechaInicial1: nuevasFechas.fechaInicial1,
      fechaFinal1: nuevasFechas.fechaFinal1,
    });
  }, [periodo]);

  useEffect(() => {
    if (!formData.fechaInicial1 || !formData.fechaFinal1) return;
    traerInformesTotales(formData.fechaInicial1, formData.fechaFinal1);
  }, [formData]); // ⬅️ el periodo también reactiva la consulta

  // ✨ Card reutilizable
  const InfoCard = ({
    title,
    value,
  }: {
    title: string;
    value: number | null;
  }) => (
    <Card className="rounded-2xl shadow-sm hover:shadow-lg transition border border-gray-200 bg-white max-h-60">
      <CardContent className="p-5 flex flex-col items-start ">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-primary mt-2">
          {value !== null
            ? value.toLocaleString('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })
            : 'N/D'}
        </p>
      </CardContent>
    </Card>
  );

  useEffect(() => {
    // Deshabilitar scroll cuando el formulario esté abierto
    if (showPdfModal) {
      document.body.style.overflow = 'hidden'; // Deshabilitar scroll
    } else {
      document.body.style.overflow = 'auto'; // Restaurar el scroll de manera explícita
    }
    // Cleanup: Restaurar el scroll al desmontar o cambiar el estado
    return () => {
      document.body.style.overflow = 'auto'; // Asegurarse de que siempre se restaure
    };
  }, [showPdfModal]);

  const dataBarVentasCompras = useMemo(
    () => [
      {
        name: 'Constructor',
        Ventas: Number(informesTotales?.totalVentasConstructor) || 0,
        Compras: Number(informesTotales?.['totalComprasConstructor ']) || 0,
      },
      {
        name: 'No Constructor',
        Ventas: Number(informesTotales?.totalVentasNoConstructor) || 0,
        Compras: Number(informesTotales?.['totalComprasNoConstructor ']) || 0,
      },
      {
        name: 'Mixtas',
        Ventas: Number(informesTotales?.totalVentasMixtas) || 0,
        Compras: 0,
      },
    ],
    [informesTotales]
  );

  const dataPieVentas = useMemo(
    () => [
      {
        name: 'Constructor',
        value: Number(informesTotales?.totalVentasConstructor) || 0,
      },
      {
        name: 'No Constructor',
        value: Number(informesTotales?.totalVentasNoConstructor) || 0,
      },
      {
        name: 'Mixtas',
        value: Number(informesTotales?.totalVentasMixtas) || 0,
      },
    ],
    [informesTotales]
  );

  const dataIVA = useMemo(
    () => [
      {
        name: 'IVA Constructor',
        value: Number(informesTotales?.ivaPorPagarConstructor) || 0,
      },
      {
        name: 'IVA No Constructor',
        value: Number(informesTotales?.ivaPorPagarNoConstructor) || 0,
      },
      {
        name: 'IVA Total',
        value: Number(informesTotales?.ivaPorPagarTotal) || 0,
      },
    ],
    [informesTotales]
  );

  // Opciones para ECharts
  const optionBarVentasCompras = {
    color: [COLORS[0], COLORS[1]],
    tooltip: {},
    legend: { data: ['Ventas', 'Compras'] },
    xAxis: { type: 'category', data: dataBarVentasCompras.map((d) => d.name) },
    yAxis: { type: 'value' },
    series: [
      {
        name: 'Ventas',
        type: 'bar',
        data: dataBarVentasCompras.map((d) => d.Ventas),
      },
      {
        name: 'Compras',
        type: 'bar',
        data: dataBarVentasCompras.map((d) => d.Compras),
      },
    ],
  };

  const optionPieVentas = {
    color: COLORS,
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: 'Ventas',
        type: 'pie',
        radius: '50%',
        data: dataPieVentas,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0,0,0,0.5)',
          },
        },
      },
    ],
  };

  const optionIVA = {
    color: [COLORS[2]],
    tooltip: {},
    xAxis: { type: 'category', data: dataIVA.map((d) => d.name) },
    yAxis: { type: 'value' },
    series: [{ name: 'IVA', type: 'bar', data: dataIVA.map((d) => d.value) }],
  };

  const handleScreenshot = async () => {
    setLoading(true);
    try {
      const element = document.querySelector(
        '#informe-container'
      ) as HTMLElement;
      if (!element) return;

      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Generar blob URL y mostrar modal
      const blobUrl = pdf.output('bloburl').toString(); // convertir a string
      setPdfUrl(blobUrl);
      setShowPdfModal(true);
    } catch (error) {
      console.error('Error generando screenshot:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PrivateRoute>
        <LayoutAdmi>
          {loading && <Spinner />}
          {loadingScreenShot && <Spinner />}

          <div className="p-6 space-y-10 pb-24">
            {/* Encabezado filtros */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                Parámetros
              </h3>
              <div className="grid md:grid-cols-4 gap-4">
                <SelectConSearch
                  label="Periodo"
                  value={periodo}
                  onChange={(val: string) => setPeriodo(val)}
                  options={[
                    'Diario',
                    'Semanal',
                    'Mensual',
                    'Anual',
                    'Cuatrimestral',
                  ]}
                />
                <DatePickerInput
                  label="Fecha de inicio"
                  value={formData.fechaInicial1}
                  onChange={(value) => handleDateChange('fechaInicial1', value)}
                />
                <DatePickerInput
                  label="Fecha de fin"
                  value={formData.fechaFinal1}
                  onChange={(value) => handleDateChange('fechaFinal1', value)}
                />
                <div className="mt-14 ml-auto">
                  <BotonQuality
                    label="Descargar Informe"
                    onClick={handleScreenshot}
                  />
                </div>
              </div>
            </div>

            <div id="informe-container">
              {/* Gráficos */}
              <section className="flex flex-col lg:flex-row w-full gap-10">
                <Card className="p-4 shadow-md rounded-2xl flex-1 h-96">
                  <h3 className="font-semibold text-gray-700 mb-4">
                    Ventas vs Compras
                  </h3>
                  <ReactECharts
                    option={optionBarVentasCompras}
                    style={{ height: '100%', width: '100%' }}
                  />
                </Card>

                <Card className="p-4 shadow-md rounded-2xl flex-1 h-96">
                  <h3 className="font-semibold text-gray-700 mb-4">
                    Distribución de Ventas
                  </h3>
                  <ReactECharts
                    option={optionPieVentas}
                    style={{ height: '100%', width: '100%' }}
                  />
                </Card>

                <Card className="p-4 shadow-md rounded-2xl flex-1 h-96">
                  <h3 className="font-semibold text-gray-700 mb-4">
                    IVA por Pagar
                  </h3>
                  <ReactECharts
                    option={optionIVA}
                    style={{ height: '100%', width: '100%' }}
                  />
                </Card>
              </section>

              {/* === Cards === */}
              <div className="flex gap-20">
                {/* Cards de ventas */}
                <section>
                  <h2 className="text-lg font-bold text-gray-700 mb-4">
                    Ventas
                  </h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    <InfoCard
                      title="Total Ventas Constructor"
                      value={Number(informesTotales?.totalVentasConstructor)}
                    />
                    <InfoCard
                      title="Total Ventas No Constructor"
                      value={Number(informesTotales?.totalVentasNoConstructor)}
                    />
                    <InfoCard
                      title="Ventas Mixtas"
                      value={Number(informesTotales?.totalVentasMixtas)}
                    />
                    <InfoCard
                      title="Total Retegarantías"
                      value={Number(informesTotales?.totalRetegarantiasVentas)}
                    />
                    <InfoCard
                      title="IVA sobre Utilidad"
                      value={Number(
                        informesTotales?.totalIvaSobreUtilidadVentas
                      )}
                    />
                    <InfoCard
                      title="IVA sobre Subtotal"
                      value={Number(
                        informesTotales?.totalIvaSobreSubtotalVentas
                      )}
                    />
                  </div>
                </section>

                {/* Cards de compras */}
                <section>
                  <h2 className="text-lg font-bold text-gray-700 mb-4">
                    Compras
                  </h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    <InfoCard
                      title="Total Compras Constructor"
                      value={Number(
                        informesTotales?.['totalComprasConstructor ']
                      )}
                    />
                    <InfoCard
                      title="Total Compras No Constructor"
                      value={Number(
                        informesTotales?.['totalComprasNoConstructor ']
                      )}
                    />
                    <InfoCard
                      title="Retegarantías en Compras"
                      value={Number(informesTotales?.totalRetegarantiasCompras)}
                    />
                    <InfoCard
                      title="IVA sobre Utilidad Compras"
                      value={Number(
                        informesTotales?.totalIvaSobreUtilidadCompras
                      )}
                    />
                    <InfoCard
                      title="IVA sobre Subtotal Compras"
                      value={Number(
                        informesTotales?.totalIvaSobreSubtotalCompras
                      )}
                    />
                  </div>
                </section>
              </div>

              {/* IVA por pagar */}
              <section>
                <h2 className="text-lg font-bold text-gray-700 mb-4">
                  IVA por Pagar
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <InfoCard
                    title="IVA Por Pagar Constructor"
                    value={Number(informesTotales?.ivaPorPagarConstructor)}
                  />
                  <InfoCard
                    title="IVA Por Pagar No Constructor"
                    value={Number(informesTotales?.ivaPorPagarNoConstructor)}
                  />
                  <InfoCard
                    title="Total IVA por Pagar"
                    value={Number(informesTotales?.ivaPorPagarTotal)}
                  />
                </div>
              </section>
            </div>
          </div>
        </LayoutAdmi>
      </PrivateRoute>
      {showPdfModal && pdfUrl && (
        <div className="fixed inset-0 flex justify-center items-center z-[201] bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-11/12 md:w-3/4 lg:w-1/2 h-5/6 flex flex-col overflow-hidden shadow-2xl">
            <div className="p-2 text-right">
              <button
                className="bg-transparent border-none text-xl cursor-pointer"
                onClick={() => setShowPdfModal(false)}
              >
                ✖
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={pdfUrl}
                width="100%"
                height="100%"
                title="Factura PDF"
                className="border-none"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

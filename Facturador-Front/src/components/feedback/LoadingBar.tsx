import React, { useEffect, useState } from 'react';

const steps = [
  'Validando factura...',
  'Conectando con la DIAN...',
  'Esperando confirmación...',
  '¡Factura enviada exitosamente!',
];

interface LoadingBarProps {
  showLoading: boolean;
  startTime: number;
  onFinish: () => void;
}

const getAverageTime = () => {
  const stored = JSON.parse(localStorage.getItem('tiemposCargaDIAN') || '[]');
  const now = Date.now();
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

  const recientes = stored.filter((t: any) => t.timestamp >= twoWeeksAgo);
  const promedio =
    recientes.reduce((acc: any, t: any) => acc + t.tiempo, 0) /
    (recientes.length || 1);

  return Math.max(promedio || 200000, 100000); //Minimo 75sg
};

export default function LoadingBar({
  showLoading,
  startTime,
  onFinish,
}: LoadingBarProps) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(steps[0]);
  const [completed, setCompleted] = useState(false);
  const estimatedTime = getAverageTime();

  useEffect(() => {
    if (!showLoading) {
      setProgress(100);
      setCompleted(true);
      setMessage(steps[3]);
      const t = setTimeout(onFinish, 1000);
      return () => clearTimeout(t);
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / estimatedTime) * 100, 99);
      setProgress(pct);
      if (pct >= 99) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval);
  }, [showLoading, startTime, estimatedTime, onFinish]);

  useEffect(() => {
    if (progress < 30) setMessage(steps[0]);
    else if (progress < 60) setMessage(steps[1]);
    else if (progress < 95) setMessage(steps[2]);
    else if (!completed) setMessage('Finalizando...');
  }, [progress, completed]);

  if (!showLoading && completed) return null;

  return (
    <div className="fixed inset-0 flex flex-col justify-center items-center bg-white bg-opacity-70 z-49">
      {progress < 100 ? (
        <>
          <div className="w-3/4 bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
            />
          </div>
          <p className="text-sm text-gray-700">{message}</p>
          {/* <img
            src="../../../anuncio.jpg"
            alt="Quality Logo"
            className="w-[500px] h-auto"
          /> */}
        </>
      ) : (
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-8 w-8 text-blue-500 mb-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <p className="text-sm text-gray-700">{message}</p>
        </div>
      )}
    </div>
  );
}

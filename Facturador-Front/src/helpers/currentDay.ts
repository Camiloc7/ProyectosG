import { useState, useEffect } from 'react';

const useCurrentDay = () => {
  const [currentDay, setCurrentDay] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleDateString(undefined, { weekday: 'long', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  });

  useEffect(() => {
    const updateDay = () => {
      const now = new Date();
      setCurrentDay(now.toLocaleDateString(undefined, { weekday: 'long', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
    };

    // Calcular el tiempo restante hasta la próxima medianoche
    const now = new Date();
    const timeUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();

    // Establecer un temporizador para actualizar a medianoche
    const timeout = setTimeout(() => {
      updateDay();
      setInterval(updateDay, 24 * 60 * 60 * 1000); // Actualizar cada 24 horas después
    }, timeUntilMidnight);

    return () => clearTimeout(timeout);
  }, []);

  return currentDay;
};

export default useCurrentDay;

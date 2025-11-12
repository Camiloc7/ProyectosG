"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function RouteLoader() {
  const pathname = usePathname();
  const [prevPath, setPrevPath] = useState(pathname);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let delayTimer: NodeJS.Timeout;
    let hideTimer: NodeJS.Timeout;

    if (pathname !== prevPath) {
      setPrevPath(pathname);

      delayTimer = setTimeout(() => {
        setLoading(true);
        hideTimer = setTimeout(() => setLoading(false), 600);
      }, 150); // espera antes de mostrar
    }

    return () => {
      clearTimeout(delayTimer);
      clearTimeout(hideTimer);
    };
  }, [pathname, prevPath]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70">
      <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
    </div>
  );
}

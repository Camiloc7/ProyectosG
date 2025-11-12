// components/ScrollToTopOnRouteChange.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToTopOnRouteChange() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" }); // o "smooth"
  }, [pathname]);

  return null;
}

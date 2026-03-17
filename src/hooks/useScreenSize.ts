import { useEffect, useState } from "react";

type Breakpoint = "mobile" | "tablet" | "desktop";

export function useScreenSize() {
  const [width, setWidth] = useState(() => (typeof window === "undefined" ? 0 : window.innerWidth));

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const breakpoint: Breakpoint = width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop";

  return {
    width,
    breakpoint,
    isMobile: breakpoint === "mobile",
    isTablet: breakpoint === "tablet",
    isDesktop: breakpoint === "desktop",
  };
}

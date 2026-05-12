import { useCallback } from "react";

export function usePrintReport() {
  const printReport = useCallback(() => {
    // Add a small delay to ensure all content is rendered
    setTimeout(() => {
      window.print();
    }, 100);
  }, []);

  return { printReport };
}
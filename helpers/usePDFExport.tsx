import { useCallback } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

export const usePDFExport = () => {
  const exportToPDF = useCallback(async (propertyTitle: string) => {
    const reportElement = document.getElementById("ai-report-content");
    if (!reportElement) {
      toast.error("Report content not found");
      return;
    }

    try {
      toast.info("Generating PDF... This may take a moment");

      // Clone the element to avoid modifying the original
      const clonedElement = reportElement.cloneNode(true) as HTMLElement;
      clonedElement.style.position = "absolute";
      clonedElement.style.left = "-9999px";
      clonedElement.style.width = "210mm"; // A4 width
      clonedElement.style.padding = "20mm";
      clonedElement.style.backgroundColor = "#ffffff";
      document.body.appendChild(clonedElement);

      // Wait for images to load
      const images = clonedElement.getElementsByTagName("img");
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) {
                resolve(null);
              } else {
                img.onload = () => resolve(null);
                img.onerror = () => resolve(null);
              }
            })
        )
      );

      // Generate canvas
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // Clean up
      document.body.removeChild(clonedElement);

      // Create PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save PDF
      const fileName = `${propertyTitle.replace(/[^a-z0-9]/gi, "_")}_AI_Report.pdf`;
      pdf.save(fileName);

      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF. Please try again.");
    }
  }, []);

  return { exportToPDF };
};
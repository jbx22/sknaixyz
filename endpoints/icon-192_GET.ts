import { schema } from "./icon-192_GET.schema";
import { generatePWAIcon } from '../helpers/generatePWAIcon';

export async function handle(request: Request) {
  try {
    // Generate the icon data URL
    const dataUrl = generatePWAIcon(192);

    // The helper returns "data:image/svg+xml,..."
    // We need to strip the prefix and decode the URI component to get raw SVG
    const svgContent = decodeURIComponent(dataUrl.split(',')[1]);

    return new Response(svgContent, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400, immutable" // Cache for 1 day
      }
    });
  } catch (error) {
    console.error("Error generating 192px icon:", error);
    return new Response("Error generating icon", { status: 500 });
  }
}
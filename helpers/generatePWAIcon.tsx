/**
 * Generates a PWA icon as a data URL with SVG content.
 * Uses the brand colors (gradient from #00d4ff to #007cff) and Arabic text "سكني".
 *
 * @param size - The size of the icon (192 or 512)
 * @returns A data URL string containing the SVG icon
 */
export function generatePWAIcon(size: 192 | 512): string {
  const svg = `
    <svg 
      width="${size}" 
      height="${size}" 
      viewBox="0 0 ${size} ${size}" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient 
          id="grad-${size}" 
          x1="0%" 
          y1="0%" 
          x2="100%" 
          y2="100%"
        >
          <stop offset="0%" style="stop-color:#00d4ff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#007cff;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background with gradient -->
      <rect 
        width="${size}" 
        height="${size}" 
        fill="url(#grad-${size})"
        rx="32"
      />
      
      <!-- Arabic text "سكني" centered -->
      <text
        x="${size / 2}"
        y="${size / 2 + size * 0.12}"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${size * 0.45}"
        font-weight="700"
        fill="white"
        text-anchor="middle"
        dominant-baseline="central"
        letter-spacing="-2"
      >
        سكني
      </text>
    </svg>
  `;

  // Convert SVG to data URL
  const encodedSvg = encodeURIComponent(svg.trim());
  return `data:image/svg+xml,${encodedSvg}`;
}
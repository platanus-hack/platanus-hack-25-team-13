import { NextResponse } from "next/server";

/**
 * Serve Exam Image API
 * Serves a generated medical exam image as SVG
 * Supports: radiografia, ecografia, laboratorio, electrocardiograma
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ tipo: string }> }
) {
  try {
    const { tipo } = await params;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || "default";

    // Generate SVG based on exam type
    const svg = generateExamSVG(tipo, id);

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    console.error("Error sirviendo imagen de examen:", err);
    return new NextResponse("Error generando imagen", { status: 500 });
  }
}

function generateExamSVG(tipo: string, id: string): string {
  const width = 800;
  const height = 600;
  const bgColor = "#1a1a1a";
  const textColor = "#ffffff";
  const accentColor = "#1098f7";

  let content = "";

  switch (tipo.toLowerCase()) {
    case "radiografia":
      content = generateRadiografiaSVG(width, height);
      break;
    case "ecografia":
      content = generateEcografiaSVG(width, height);
      break;
    case "laboratorio":
      content = generateLaboratorioSVG(width, height);
      break;
    case "electrocardiograma":
      content = generateElectrocardiogramaSVG(width, height);
      break;
    default:
      content = generateRadiografiaSVG(width, height);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${bgColor}"/>
  ${content}
  <text x="${width / 2}" y="${height - 20}" 
        text-anchor="middle" 
        fill="${textColor}" 
        font-family="Arial, sans-serif" 
        font-size="14" 
        opacity="0.7">
    ${tipo.toUpperCase()} - ID: ${id.substring(0, 8)}
  </text>
</svg>`;
}

function generateRadiografiaSVG(width: number, height: number): string {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.3;
  
  // Simulate X-ray bones structure
  const bones = `
    <ellipse cx="${centerX}" cy="${centerY - radius * 0.3}" 
             rx="${radius * 0.4}" ry="${radius * 0.6}" 
             fill="none" stroke="#ffffff" stroke-width="3" opacity="0.8"/>
    <ellipse cx="${centerX}" cy="${centerY + radius * 0.3}" 
             rx="${radius * 0.5}" ry="${radius * 0.4}" 
             fill="none" stroke="#ffffff" stroke-width="3" opacity="0.8"/>
    <line x1="${centerX - radius * 0.3}" y1="${centerY - radius * 0.1}" 
          x2="${centerX + radius * 0.3}" y2="${centerY + radius * 0.1}" 
          stroke="#ffffff" stroke-width="2" opacity="0.6"/>
  `;
  
  return bones;
}

function generateEcografiaSVG(width: number, height: number): string {
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Simulate ultrasound waves
  const waves = Array.from({ length: 15 }, (_, i) => {
    const y = centerY + (i - 7) * 30;
    const waveWidth = width * (0.3 + Math.abs(i - 7) * 0.05);
    const x = (width - waveWidth) / 2;
    return `<ellipse cx="${centerX}" cy="${y}" 
                    rx="${waveWidth / 2}" ry="15" 
                    fill="none" stroke="#1098f7" stroke-width="2" opacity="${0.9 - Math.abs(i - 7) * 0.1}"/>`;
  }).join("\n    ");
  
  return waves;
}

function generateLaboratorioSVG(width: number, height: number): string {
  const startX = width * 0.2;
  const endX = width * 0.8;
  const startY = height * 0.3;
  const lineHeight = 40;
  
  // Simulate lab results table
  const results = [
    "Hemoglobina: 14.2 g/dL",
    "Leucocitos: 7,500 /μL",
    "Plaquetas: 250,000 /μL",
    "Glucosa: 95 mg/dL",
    "Creatinina: 0.9 mg/dL",
  ];
  
  const lines = results.map((result, i) => {
    const y = startY + i * lineHeight;
    return `<text x="${startX}" y="${y}" 
                  fill="#ffffff" 
                  font-family="Arial, sans-serif" 
                  font-size="16">
            ${result}
          </text>`;
  }).join("\n    ");
  
  return lines;
}

function generateElectrocardiogramaSVG(width: number, height: number): string {
  const startX = width * 0.1;
  const endX = width * 0.9;
  const centerY = height / 2;
  const amplitude = 80;
  const frequency = 0.02;
  
  // Generate ECG waveform
  let path = `M ${startX} ${centerY}`;
  for (let x = startX; x <= endX; x += 2) {
    const y = centerY + Math.sin(x * frequency) * amplitude * 
              (0.5 + 0.5 * Math.sin(x * frequency * 0.1));
    path += ` L ${x} ${y}`;
  }
  
  return `
    <path d="${path}" 
          fill="none" 
          stroke="#1098f7" 
          stroke-width="3" 
          opacity="0.9"/>
    <line x1="${startX}" y1="${centerY - amplitude * 1.5}" 
          x2="${startX}" y2="${centerY + amplitude * 1.5}" 
          stroke="#ffffff" stroke-width="1" opacity="0.3"/>
    <line x1="${startX}" y1="${centerY}" 
          x2="${endX}" y2="${centerY}" 
          stroke="#ffffff" stroke-width="1" opacity="0.3"/>
  `;
}


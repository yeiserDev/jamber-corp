import { Gasto, Local } from "@/types/gasto";

// Helper function for rounded rectangles
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

export const generarReporteImagen = async (gasto: Gasto, todosGastos: Gasto[], locales: Local[]): Promise<void> => {
    const calcularCostoPorUnidad = (g: Gasto): number => {
        if (g.consumoTotal === 0) return 0;
        return g.montoTotal / g.consumoTotal;
    };

    const costoPorUnidad = calcularCostoPorUnidad(gasto);
    const fecha = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
    const isLuz = gasto.tipo === 'luz';
    const unit = isLuz ? 'kWh' : 'm³';

    const localesACobrar = gasto.costosPorLocal.filter(c => {
        const local = typeof c.localId === 'string' ? locales.find(l => l._id === c.localId) : c.localId;
        return local && local.tipo !== 'casa';
    }).sort((a, b) => b.monto - a.monto);

    const historial = todosGastos
        .filter(g => g.tipo === gasto.tipo)
        .sort((a, b) => a.mes.localeCompare(b.mes))
        .slice(-6);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Height calculation
    const headerHeight = 220;
    const cardTop = 150;
    const metricsHeight = 120;
    const rowHeight = 45;
    const distribucionHeight = 60 + (localesACobrar.length * rowHeight);
    const chartHeight = historial.length > 0 ? 300 : 0;
    const footerHeight = 100;

    const cardHeight = metricsHeight + distribucionHeight + chartHeight + 100;
    const totalHeight = cardTop + cardHeight + footerHeight;
    const canvasWidth = 800;

    canvas.width = canvasWidth;
    canvas.height = totalHeight;

    const colors = {
        bg: '#f8fafc',
        cardBg: '#ffffff',
        textMain: '#0f172a',
        textMuted: '#64748b',
        textLight: '#94a3b8',
        border: '#e2e8f0',
        primary: isLuz ? '#d97706' : '#0284c7', // amber-600 / sky-600
        primaryLight: isLuz ? '#fef3c7' : '#e0f2fe',
    };

    const fontBase = 'system-ui, -apple-system, sans-serif';

    // 1. Draw Background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, canvasWidth, totalHeight);

    // 2. Draw SVG Banner
    const svgLuz = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 120" width="800" height="220" preserveAspectRatio="xMidYMax slice">
        <path d="M460,40 Q460,32 468,32 Q473,26 482,32 Q495,32 495,43 L460,43 Z" fill="#f1f5f9" />
        <path d="M160,50 Q160,45 165,45 Q170,40 176,45 Q185,45 185,52 L160,52 Z" fill="#f1f5f9" />
        <circle cx="420" cy="50" r="16" fill="#fcd34d" />
        <rect x="0" y="105" width="600" height="15" fill="#f8fafc" />
        <rect x="0" y="105" width="600" height="2" fill="#f1f5f9" />
        <g stroke="#cbd5e1" stroke-width="1.5" fill="none" transform="translate(60, 0)">
            <path d="M50,105 L65,35 L80,105" />
            <path d="M40,55 L90,55" />
            <path d="M45,75 L85,75" />
            <path d="M56,80 L72,105 M74,80 L58,105" />
            <path d="M60,55 L70,75 M70,55 L60,75" />
            <path d="M62,35 L68,55 M68,35 L62,55" />
            <line x1="65" y1="20" x2="65" y2="35" />
            <line x1="55" y1="35" x2="75" y2="35" />
        </g>
        <g stroke="#e2e8f0" stroke-width="1" fill="none" transform="translate(120, 25) scale(0.7)">
            <path d="M50,115 L65,45 L80,115" />
            <path d="M40,65 L90,65" />
            <path d="M45,85 L85,85" />
            <path d="M56,90 L72,115 M74,90 L58,115" />
            <path d="M60,65 L70,85 M70,65 L60,85" />
            <path d="M62,45 L68,65 M68,45 L62,65" />
            <line x1="65" y1="30" x2="65" y2="45" />
            <line x1="55" y1="45" x2="75" y2="45" />
        </g>
        <circle cx="235" cy="95" r="10" fill="#a7f3d0" />
        <circle cx="250" cy="100" r="7" fill="#86efac" />
        <g transform="translate(225, 65)">
            <rect x="18" y="30" width="3" height="15" fill="#94a3b8" />
            <polygon points="0,30 25,30 35,0 10,0" fill="#3b82f6" />
            <line x1="6" y1="10" x2="31" y2="10" stroke="#bfdbfe" stroke-width="0.5" />
            <line x1="12" y1="20" x2="37" y2="20" stroke="#bfdbfe" stroke-width="0.5" />
            <line x1="18" y1="0" x2="8" y2="30" stroke="#bfdbfe" stroke-width="0.5" />
            <line x1="26" y1="0" x2="16" y2="30" stroke="#bfdbfe" stroke-width="0.5" />
        </g>
        <g transform="translate(265, 70) scale(0.85)">
            <rect x="18" y="30" width="3" height="15" fill="#94a3b8" />
            <polygon points="0,30 25,30 35,0 10,0" fill="#3b82f6" />
            <line x1="6" y1="10" x2="31" y2="10" stroke="#bfdbfe" stroke-width="0.5" />
            <line x1="12" y1="20" x2="37" y2="20" stroke="#bfdbfe" stroke-width="0.5" />
            <line x1="18" y1="0" x2="8" y2="30" stroke="#bfdbfe" stroke-width="0.5" />
            <line x1="26" y1="0" x2="16" y2="30" stroke="#bfdbfe" stroke-width="0.5" />
        </g>
        <circle cx="105" cy="100" r="8" fill="#4ade80" />
        <circle cx="95" cy="98" r="12" fill="#86efac" />
        <g transform="translate(370, 75)">
            <circle cx="-15" cy="25" r="8" fill="#6ee7b7" />
            <circle cx="-5" cy="20" r="12" fill="#34d399" />
            <rect x="0" y="0" width="70" height="30" fill="#e2e8f0" />
            <polygon points="70,0 85,5 85,30 70,30" fill="#cbd5e1" />
            <rect x="0" y="0" width="70" height="6" fill="#3b82f6" />
            <polygon points="70,0 85,5 85,11 70,6" fill="#2563eb" />
            <rect x="5" y="12" width="12" height="10" fill="#93c5fd" />
            <rect x="22" y="12" width="25" height="10" fill="#60a5fa" />
            <rect x="52" y="12" width="12" height="10" fill="#93c5fd" />
        </g>
        <circle cx="480" cy="100" r="10" fill="#10b981" />
        <path d="M510,70 L500,105 L520,105 Z" fill="#059669" />
    </svg>`;

    const svgAgua = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 120" width="800" height="220" preserveAspectRatio="xMidYMax slice">
        <path d="M0,80 C60,80 90,60 150,60 C210,60 240,85 300,85 C360,85 390,70 450,70 C510,70 540,90 600,90 L600,120 L0,120 Z" fill="#e0f2fe" />
        <path d="M0,95 C75,95 105,75 180,75 C255,75 285,95 360,95 C435,95 465,80 540,80 C570,80 585,90 600,90 L600,120 L0,120 Z" fill="#bae6fd" opacity="0.6" />
        <path d="M0,105 C90,105 120,90 210,90 C300,90 330,105 420,105 C510,105 540,95 600,95 L600,120 L0,120 Z" fill="#7dd3fc" opacity="0.4" />
        <g transform="translate(282, 32)">
            <path d="M18,0 C18,0 0,26 0,39 C0,48.9 8.1,57 18,57 C27.9,57 36,48.9 36,39 C36,26 18,0 18,0 Z" fill="#3b82f6" />
            <path d="M28,38 C28,45 22,51 15,52 C21,52 26,46 26,38 C26,27 19,13 19,13 C19,13 28,26 28,38 Z" fill="#93c5fd" opacity="0.8"/>
        </g>
    </svg>`;

    const svgString = isLuz ? svgLuz : svgAgua;

    // Draw banner background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, headerHeight);
    if (isLuz) {
        gradient.addColorStop(0, '#fffbeb');
        gradient.addColorStop(1, '#fef3c7');
    } else {
        gradient.addColorStop(0, '#f0f9ff');
        gradient.addColorStop(1, '#e0f2fe');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, headerHeight);

    await new Promise<void>((resolve) => {
        const img = new Image();
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvasWidth, headerHeight);
            URL.revokeObjectURL(url);
            resolve();
        };
        img.onerror = () => { resolve(); };
        img.src = url;
    });

    // 3. Draw Main Card
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 15;
    ctx.fillStyle = colors.cardBg;
    roundRect(ctx, 40, cardTop, canvasWidth - 80, cardHeight, 24);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    let y = cardTop + 50;
    const cardLeft = 90;
    const innerWidth = canvasWidth - 180;

    // --- CARD HEADER ---
    ctx.font = `bold 32px ${fontBase}`;
    ctx.fillStyle = colors.textMain;
    ctx.fillText(`Reporte de ${isLuz ? 'Electricidad' : 'Agua'}`, cardLeft, y);
    
    ctx.font = `600 16px ${fontBase}`;
    ctx.fillStyle = colors.primary;
    const mesStr = gasto.mes.toUpperCase();
    const textWidth = ctx.measureText(mesStr).width;
    
    // Tag background for month
    ctx.fillStyle = colors.primaryLight;
    roundRect(ctx, cardLeft + innerWidth - textWidth - 24, y - 24, textWidth + 24, 32, 16);
    ctx.fill();
    
    ctx.fillStyle = colors.primary;
    ctx.fillText(mesStr, cardLeft + innerWidth - textWidth - 12, y - 2);

    y += 50;

    // --- DIVIDER ---
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardLeft, y);
    ctx.lineTo(cardLeft + innerWidth, y);
    ctx.stroke();

    y += 40;

    // --- METRICS ROW ---
    const metricWidth = innerWidth / 3;
    
    // Metric 1: Consumo
    ctx.font = `500 13px ${fontBase}`;
    ctx.fillStyle = colors.textMuted;
    ctx.fillText('Consumo Total', cardLeft, y);
    ctx.font = `bold 24px ${fontBase}`;
    ctx.fillStyle = colors.textMain;
    ctx.fillText(`${gasto.consumoTotal.toFixed(1)} ${unit}`, cardLeft, y + 30);

    // Metric 2: Tarifa
    ctx.font = `500 13px ${fontBase}`;
    ctx.fillStyle = colors.textMuted;
    ctx.fillText(`Tarifa por ${unit}`, cardLeft + metricWidth, y);
    ctx.font = `bold 24px ${fontBase}`;
    ctx.fillStyle = colors.textMain;
    ctx.fillText(`S/ ${costoPorUnidad.toFixed(4)}`, cardLeft + metricWidth, y + 30);

    // Metric 3: Monto Total
    ctx.font = `bold 12px ${fontBase}`;
    ctx.fillStyle = colors.textMuted;
    ctx.fillText('TOTAL A COBRAR', cardLeft + metricWidth * 2, y);
    ctx.font = `900 28px ${fontBase}`;
    ctx.fillStyle = colors.primary;
    ctx.fillText(`S/ ${gasto.montoTotal.toFixed(2)}`, cardLeft + metricWidth * 2, y + 30);

    y += 80;

    // --- DIVIDER ---
    ctx.beginPath();
    ctx.moveTo(cardLeft, y);
    ctx.lineTo(cardLeft + innerWidth, y);
    ctx.stroke();

    y += 50;

    // --- DISTRIBUCIÓN POR LOCAL ---
    ctx.font = `bold 18px ${fontBase}`;
    ctx.fillStyle = colors.textMain;
    ctx.fillText('Distribución por local', cardLeft, y);
    y += 35;

    localesACobrar.forEach((c) => {
        const local = typeof c.localId === 'string' ? locales.find(l => l._id === c.localId) : c.localId;
        const nombre = local?.nombre || 'Local';
        const monto = c.monto;
        const pct = gasto.montoTotal > 0 ? (monto / gasto.montoTotal) * 100 : 0;
        
        // Dot
        ctx.fillStyle = colors.primary;
        ctx.beginPath();
        ctx.arc(cardLeft + 6, y - 5, 5, 0, Math.PI * 2);
        ctx.fill();

        // Local Name
        ctx.font = `600 15px ${fontBase}`;
        ctx.fillStyle = colors.textMain;
        ctx.fillText(nombre, cardLeft + 25, y);

        // Local Name and Consumption
        ctx.font = `600 15px ${fontBase}`;
        ctx.fillStyle = colors.textMain;
        ctx.fillText(nombre, cardLeft + 25, y);

        const consumoStr = `${c.consumo.toFixed(1)} ${unit}`;
        ctx.font = `500 13px ${fontBase}`;
        ctx.fillStyle = colors.textMuted;
        const nameWidth = ctx.measureText(nombre).width;
        ctx.fillText(consumoStr, cardLeft + 25 + nameWidth + 10, y);

        // Percentage & Amount
        const pctStr = `${pct.toFixed(1)}%`;
        ctx.font = `500 14px ${fontBase}`;
        ctx.fillStyle = colors.textMuted;
        const pctWidth = ctx.measureText(pctStr).width;
        
        const montoStr = `S/ ${monto.toFixed(2)}`;
        ctx.font = `bold 14px ${fontBase}`;
        const montoWidth = ctx.measureText(montoStr).width;
        
        const gapBetween = 30;
        const totalRightWidth = pctWidth + gapBetween + montoWidth + 24; // 24 for padding
        
        ctx.fillText(pctStr, cardLeft + innerWidth - totalRightWidth, y);
        
        // Price Bubble
        ctx.fillStyle = colors.bg; // Light grey bubble
        roundRect(ctx, cardLeft + innerWidth - montoWidth - 24, y - 18, montoWidth + 24, 26, 8);
        ctx.fill();
        
        ctx.fillStyle = colors.primary;
        ctx.fillText(montoStr, cardLeft + innerWidth - montoWidth - 12, y);

        // Progress Bar Background
        ctx.fillStyle = colors.bg;
        roundRect(ctx, cardLeft + 25, y + 12, innerWidth - 25, 6, 3);
        ctx.fill();

        // Progress Bar Fill
        ctx.fillStyle = colors.primary;
        roundRect(ctx, cardLeft + 25, y + 12, (innerWidth - 25) * (pct / 100), 6, 3);
        ctx.fill();

        y += rowHeight;
    });

    y += 30;

    // --- HISTORIAL CHART ---
    if (historial.length > 0) {
        ctx.font = `bold 18px ${fontBase}`;
        ctx.fillStyle = colors.textMain;
        ctx.fillText('Historial de últimos meses', cardLeft, y);
        y += 40;

        const chartW = innerWidth;
        const chartH = 180;
        const maxH = Math.max(...historial.map(h => h.montoTotal)) * 1.2 || 100;

        // Grid lines
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const gy = y + chartH - (i * (chartH / 4));
            ctx.beginPath();
            ctx.moveTo(cardLeft, gy);
            ctx.lineTo(cardLeft + chartW, gy);
            ctx.stroke();

            ctx.font = `12px ${fontBase}`;
            ctx.fillStyle = colors.textLight;
            ctx.fillText(`S/ ${(maxH * (i / 4)).toFixed(0)}`, cardLeft - 40, gy + 4);
        }

        // Bars
        const barW = Math.min(40, (chartW / historial.length) - 20);
        const gap = (chartW - (barW * historial.length)) / (historial.length + 1);

        historial.forEach((h, i) => {
            const bx = cardLeft + gap + (i * (barW + gap));
            const bh = (h.montoTotal / maxH) * chartH;
            const by = y + chartH - bh;

            // Bar
            ctx.fillStyle = colors.primaryLight;
            roundRect(ctx, bx, by, barW, bh, 4);
            ctx.fill();
            
            // Highlight top
            ctx.fillStyle = colors.primary;
            roundRect(ctx, bx, by, barW, 4, 4);
            ctx.fill();

            // Label
            ctx.font = `600 12px ${fontBase}`;
            ctx.fillStyle = colors.textMuted;
            const label = new Date(h.mes + '-02').toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
            const lw = ctx.measureText(label).width;
            ctx.fillText(label, bx + (barW / 2) - (lw / 2), y + chartH + 20);
        });

        y += chartH + 50;
    }

    // --- FOOTER ---
    y = totalHeight - 50;
    ctx.font = `500 13px ${fontBase}`;
    ctx.fillStyle = colors.textLight;
    const footerText = `JamberCorp - Reporte generado el ${fecha}`;
    const fw = ctx.measureText(footerText).width;
    ctx.fillText(footerText, (canvasWidth / 2) - (fw / 2), y);

    // Descargar imagen
    canvas.toBlob((blob) => {
        if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Reporte_${gasto.tipo}_${gasto.mes}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }, 'image/png');
};

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
    const fecha = new Date().toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Filtrar solo los locales que NO son casa
    const localesACobrar = gasto.costosPorLocal.filter(c => {
        const local = typeof c.localId === 'string' ? locales.find(l => l._id === c.localId) : c.localId;
        return local && local.tipo !== 'casa';
    });
    const totalACobrar = localesACobrar.reduce((sum, c) => sum + c.monto, 0);

    // Filtrar historial
    const historial = todosGastos
        .filter(g => g.tipo === gasto.tipo)
        .sort((a, b) => a.mes.localeCompare(b.mes))
        .slice(-6); // Últimos 6 meses

    // Crear canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Dimensiones
    let cardHeight = 480 + (localesACobrar.length * 90) + 100;
    if (historial.length > 0) {
        cardHeight += 380; // Espacio extra para el gráfico
    }

    const cardWidth = 700;
    canvas.width = cardWidth;
    canvas.height = cardHeight;

    // Colores del nuevo diseño
    const colors = {
        primary: '#0B253C',
        primaryLight: '#0A2640',
        bg: '#FFFFFF',
        bgGray: '#F8FAFC',
        bgSlate: '#F1F5F9',
        text: '#0B253C',
        textGray: '#64748B',
        textLight: '#94A3B8',
        textMedium: '#64748B',
        success: '#10B981',
        logo: '#E6E9EB',
        border: '#E2E8F0',
        borderLight: '#F1F5F9'
    };

    // Fondo blanco
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, cardWidth, cardHeight);

    // Borde exterior con sombra
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 8;
    roundRect(ctx, 0, 0, cardWidth, cardHeight, 4);
    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    let yPos = 60;

    // ========== TÍTULO DEL SERVICIO CON ICONO ==========
    const icon = gasto.tipo === 'luz' ? '⚡' : '💧';
    ctx.font = '38px Arial';
    ctx.fillStyle = colors.primary;
    ctx.fillText(icon, 50, yPos);

    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = colors.primary;
    ctx.fillText(gasto.tipo === 'luz' ? 'Luz' : 'Agua', 100, yPos);

    ctx.font = '16px Arial';
    ctx.fillStyle = colors.textLight;
    ctx.fillText(gasto.mes, 100, yPos + 24);

    yPos += 65;

    // ========== RESUMEN FINANCIERO ==========
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = colors.primary;
    ctx.fillText('Resumen Financiero', 50, yPos);

    yPos += 30;

    // Fondo slate para el resumen
    ctx.fillStyle = colors.bgSlate;
    roundRect(ctx, 50, yPos - 15, cardWidth - 100, 130, 10);
    ctx.fill();

    // Borde del resumen
    ctx.strokeStyle = colors.borderLight;
    ctx.lineWidth = 1;
    roundRect(ctx, 50, yPos - 15, cardWidth - 100, 130, 10);
    ctx.stroke();

    // Primera línea: Consumo Total (con fondo slate)
    ctx.fillStyle = colors.bgSlate;
    ctx.fillRect(50, yPos - 15, cardWidth - 100, 40);

    ctx.strokeStyle = colors.borderLight;
    ctx.beginPath();
    ctx.moveTo(50, yPos + 25);
    ctx.lineTo(cardWidth - 50, yPos + 25);
    ctx.stroke();

    ctx.font = '14px Arial';
    ctx.fillStyle = colors.textGray;
    ctx.fillText('Consumo Total', 65, yPos + 7);

    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'right';
    ctx.fillText(`${gasto.consumoTotal.toFixed(2)} ${gasto.tipo === 'luz' ? 'kWh' : 'm³'}`, cardWidth - 65, yPos + 7);
    ctx.textAlign = 'left';

    // Segunda línea: Monto Total (destacado)
    yPos += 40;

    ctx.fillStyle = colors.bg;
    ctx.fillRect(50, yPos - 15, cardWidth - 100, 45);

    ctx.strokeStyle = colors.borderLight;
    ctx.beginPath();
    ctx.moveTo(50, yPos + 30);
    ctx.lineTo(cardWidth - 50, yPos + 30);
    ctx.stroke();

    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = colors.primary;
    ctx.fillText('Monto Total', 65, yPos + 10);

    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = colors.primary;
    ctx.textAlign = 'right';
    ctx.fillText(`S/ ${gasto.montoTotal.toFixed(2)}`, cardWidth - 65, yPos + 12);
    ctx.textAlign = 'left';

    // Tercera línea: Tarifa (con fondo slate)
    yPos += 45;

    ctx.fillStyle = colors.bgSlate;
    ctx.fillRect(50, yPos - 15, cardWidth - 100, 40);

    ctx.font = '12px Arial';
    ctx.fillStyle = colors.textGray;
    ctx.fillText(`Tarifa por ${gasto.tipo === 'luz' ? 'kWh' : 'm³'}`, 65, yPos + 7);

    ctx.font = '12px Arial';
    ctx.fillStyle = colors.textGray;
    ctx.textAlign = 'right';
    ctx.fillText(`S/ ${costoPorUnidad.toFixed(4)}`, cardWidth - 65, yPos + 7);
    ctx.textAlign = 'left';

    yPos += 50;

    // ========== DISTRIBUCIÓN POR LOCAL ==========
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = colors.primary;
    ctx.fillText('Distribución por Local', 50, yPos);

    yPos += 30;

    // Tarjetas de locales
    localesACobrar.forEach((costo: any, idx: number) => {
        const localIdStr = typeof costo.localId === 'string' ? costo.localId : costo.localId._id;
        const lecturasLocal = gasto.lecturas.filter((l: any) => {
            const lId = typeof l.localId === 'string' ? l.localId : l.localId._id;
            return lId === localIdStr;
        });

        const isMultiMedidor = lecturasLocal.length > 1;
        const localCardHeight = isMultiMedidor ? 80 + (lecturasLocal.length * 20) : 80;

        // Fondo de la tarjeta
        ctx.fillStyle = colors.bg;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        roundRect(ctx, 50, yPos - 10, cardWidth - 100, localCardHeight, 12);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Borde de la tarjeta
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 1;
        roundRect(ctx, 50, yPos - 10, cardWidth - 100, localCardHeight, 12);
        ctx.stroke();

        // Número circular
        ctx.fillStyle = colors.primary;
        ctx.shadowColor = 'rgba(11, 37, 60, 0.2)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(85, yPos + 30, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = colors.bg;
        ctx.textAlign = 'center';
        ctx.fillText(`${idx + 1}`, 85, yPos + 37);
        ctx.textAlign = 'left';

        // Info del local
        const localObj = typeof costo.localId === 'string' ? locales.find(l => l._id === costo.localId) : costo.localId;
        const nombreLocal = localObj ? localObj.nombre : 'Local';
        const tipoLocal = localObj ? localObj.tipo : '';

        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = colors.primary;
        ctx.fillText(nombreLocal.toLowerCase().includes('academia') ? 'Profesor' : nombreLocal, 120, yPos + 18);

        // Tipo del local
        ctx.font = '12px Arial';
        ctx.fillStyle = colors.textGray;
        ctx.fillText(`Tipo: ${tipoLocal.charAt(0).toUpperCase() + tipoLocal.slice(1)}`, 120, yPos + 36);

        // Consumo
        if (isMultiMedidor) {
            let currentY = yPos + 51;
            lecturasLocal.forEach((lectura: any) => {
                ctx.font = '11px Arial';
                ctx.fillStyle = colors.textGray;
                const costoMedidor = lectura.consumo * costoPorUnidad;
                ctx.fillText(`Medidor ${lectura.medidorNumero || 1}: ${lectura.consumo.toFixed(2)} ${gasto.tipo === 'luz' ? 'kWh' : 'm³'} (S/ ${costoMedidor.toFixed(2)})`, 120, currentY);
                currentY += 16;
            });
        } else {
            ctx.font = '11px Arial';
            ctx.fillStyle = colors.textGray;
            ctx.fillText(`Consumo: ${costo.consumo.toFixed(2)} ${gasto.tipo === 'luz' ? 'kWh' : 'm³'}`, 120, yPos + 51);
        }

        // Monto
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = colors.success;
        ctx.textAlign = 'right';
        ctx.fillText(`S/ ${costo.monto.toFixed(2)}`, cardWidth - 70, yPos + 38);
        ctx.textAlign = 'left';

        yPos += localCardHeight + 10;
    });

    yPos += 20;

    // ========== TOTAL A COBRAR ==========
    ctx.fillStyle = colors.primary;
    ctx.shadowColor = 'rgba(11, 37, 60, 0.15)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    roundRect(ctx, 50, yPos - 10, cardWidth - 100, 70, 10);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = colors.bg;
    ctx.fillText('TOTAL A COBRAR', 70, yPos + 22);

    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`S/ ${totalACobrar.toFixed(2)}`, cardWidth - 70, yPos + 26);
    ctx.textAlign = 'left';

    yPos += 85;

    // ========== GRÁFICO HISTÓRICO ==========
    if (historial.length > 0) {
        yPos += 20;

        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = colors.primary;
        ctx.fillText('Histórico por Local (Últimos 6 Meses)', 50, yPos);

        yPos += 40;

        // Identificar locales únicos
        const localesIds = Array.from(new Set(historial.flatMap(h => h.costosPorLocal.filter(c => {
            const local = typeof c.localId === 'string' ? locales.find(l => l._id === c.localId) : c.localId;
            return local && local.tipo !== 'casa';
        }).map(c => typeof c.localId === 'string' ? c.localId : c.localId._id))));

        const localesInfo = localesIds.map(id => {
            const local = locales.find(l => l._id === id);
            let nombre = local?.nombre || 'Local';
            if (nombre.toLowerCase() === 'academia') nombre = 'Profesor';
            return { id, nombre, color: '' };
        });

        const chartColors = ['#0B253C', '#10B981', '#F59E0B', '#6366F1', '#EC4899'];
        localesInfo.forEach((l, i) => l.color = chartColors[i % chartColors.length]);

        // Leyenda
        let legendX = 50;
        localesInfo.forEach(local => {
            ctx.fillStyle = local.color;
            ctx.beginPath();
            ctx.arc(legendX, yPos - 15, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = '12px Arial';
            ctx.fillStyle = colors.textGray;
            ctx.textAlign = 'left';
            ctx.fillText(local.nombre, legendX + 15, yPos - 11);

            legendX += ctx.measureText(local.nombre).width + 40;
        });

        // Configuración del gráfico
        const chartHeight = 250;
        const chartWidth = cardWidth - 100;
        const barWidth = 25;
        const groupWidth = (barWidth * localesIds.length) + 15;
        const totalGroupWidth = groupWidth + 20;
        const gap = (chartWidth - (historial.length * totalGroupWidth)) / (historial.length + 1);

        // Escala
        let maxMonto = 0;
        historial.forEach(h => {
            h.costosPorLocal.forEach(c => {
                const cLocalId = typeof c.localId === 'string' ? c.localId : c.localId._id;
                if (localesIds.includes(cLocalId) && c.monto > maxMonto) maxMonto = c.monto;
            });
        });
        maxMonto = maxMonto * 1.2 || 100;

        // Fondo gráfico
        ctx.fillStyle = colors.bgSlate;
        roundRect(ctx, 50, yPos, chartWidth, chartHeight, 10);
        ctx.fill();

        // Líneas guía
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 4; i++) {
            const y = yPos + chartHeight - (i * (chartHeight / 5));
            ctx.beginPath();
            ctx.moveTo(50, y);
            ctx.lineTo(50 + chartWidth, y);
            ctx.stroke();

            ctx.font = '10px Arial';
            ctx.fillStyle = '#94A3B8';
            ctx.fillText((maxMonto * (i / 5)).toFixed(0), 25, y + 3);
        }

        // Barras
        historial.forEach((h, mesIndex) => {
            const groupX = 50 + gap + (mesIndex * totalGroupWidth);

            ctx.font = 'bold 11px Arial';
            ctx.fillStyle = colors.text;
            ctx.textAlign = 'center';
            const mesNombre = new Date(h.mes + '-02').toLocaleDateString('es-ES', { month: 'short' });
            ctx.fillText(mesNombre.toUpperCase(), groupX + (groupWidth / 2), yPos + chartHeight + 20);

            localesIds.forEach((localId, localIndex) => {
                const costo = h.costosPorLocal.find(c => {
                    const cId = typeof c.localId === 'string' ? c.localId : c.localId._id;
                    return cId === localId;
                });
                const monto = costo ? costo.monto : 0;

                if (monto > 0) {
                    const height = (monto / maxMonto) * chartHeight;
                    const x = groupX + (localIndex * barWidth);
                    const y = yPos + chartHeight - height;
                    const color = localesInfo.find(l => l.id === localId)?.color || colors.primary;

                    ctx.fillStyle = color;
                    roundRect(ctx, x, y, barWidth - 4, height, 4);
                    ctx.fill();

                    if (costo) {
                        const unit = gasto.tipo === 'luz' ? 'kWh' : 'm³';
                        ctx.font = 'bold 8px Arial';
                        ctx.fillStyle = colors.textMedium;
                        ctx.textAlign = 'center';
                        ctx.fillText(`${costo.consumo.toFixed(0)}`, x + ((barWidth - 4) / 2), y - 3);
                    }
                }
            });
        });

        ctx.textAlign = 'left';
        yPos += chartHeight + 40;
    }

    // ========== FOOTER ==========
    ctx.fillStyle = colors.bgGray;
    ctx.fillRect(0, yPos, cardWidth, cardHeight - yPos);

    ctx.strokeStyle = colors.borderLight;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, yPos);
    ctx.lineTo(cardWidth, yPos);
    ctx.stroke();

    ctx.font = '9px Arial';
    ctx.fillStyle = colors.textLight;
    ctx.textAlign = 'center';
    ctx.fillText('JamberCorp - Sistema de Gestión Empresarial', cardWidth / 2, yPos + 25);
    ctx.fillText(`Generado el ${fecha}`, cardWidth / 2, yPos + 40);
    ctx.textAlign = 'left';

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

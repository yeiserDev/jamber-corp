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

export const generarReporteProfesor = async (gasto: Gasto, todosGastos: Gasto[], locales: Local[]): Promise<void> => {
    // Encontrar el local del Profesor
    const profesorLocal = locales.find(l => l.tipo === 'profesor' || l.nombre.toLowerCase().includes('academia'));
    if (!profesorLocal) return;

    const profesorLocalId = profesorLocal._id;

    // Datos del Profesor en este gasto
    const costoProfesor = gasto.costosPorLocal.find(c => {
        const id = typeof c.localId === 'string' ? c.localId : c.localId._id;
        return id === profesorLocalId;
    });
    if (!costoProfesor) return;

    // Lecturas del Profesor
    const lecturasProfesor = gasto.lecturas.filter((l: any) => {
        const lId = typeof l.localId === 'string' ? l.localId : l.localId._id;
        return lId === profesorLocalId;
    });

    // TARIFA REAL: ahora sin impuestos ocultos, es la misma para todos
    const tarifaReal = gasto.consumoTotal > 0 ? gasto.montoTotal / gasto.consumoTotal : 0;

    const fecha = new Date().toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const mesFormateado = new Date(gasto.mes + '-02').toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric'
    });

    // Historial del Profesor
    const historial = todosGastos
        .filter(g => g.tipo === gasto.tipo)
        .sort((a, b) => a.mes.localeCompare(b.mes))
        .slice(-6)
        .map(g => {
            const costo = g.costosPorLocal.find(c => {
                const id = typeof c.localId === 'string' ? c.localId : c.localId._id;
                return id === profesorLocalId;
            });
            return {
                mes: g.mes,
                consumo: costo?.consumo || 0,
                monto: costo?.monto || 0,
            };
        })
        .filter(h => h.consumo > 0 || h.monto > 0);

    // ======== CANVAS SETUP ========
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const cardWidth = 750;
    const isMultiMedidor = lecturasProfesor.length > 1;
    let cardHeight = 700; // Base height
    if (isMultiMedidor) cardHeight += lecturasProfesor.length * 55;
    if (historial.length > 0) cardHeight += 400;

    canvas.width = cardWidth;
    canvas.height = cardHeight;

    // Colores
    const colors = {
        primary: '#0B253C',
        primaryLight: '#1A3A5C',
        bg: '#FFFFFF',
        bgGray: '#F8FAFC',
        bgSlate: '#F1F5F9',
        bgBlue: '#EFF6FF',
        text: '#0B253C',
        textGray: '#64748B',
        textLight: '#94A3B8',
        textMedium: '#475569',
        success: '#10B981',
        successLight: '#D1FAE5',
        accent: '#3B82F6',
        accentLight: '#DBEAFE',
        border: '#E2E8F0',
        borderLight: '#F1F5F9',
        warning: '#F59E0B',
    };

    // Fondo blanco
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, cardWidth, cardHeight);

    // Borde exterior
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    roundRect(ctx, 0, 0, cardWidth, cardHeight, 6);
    ctx.stroke();

    let yPos = 0;

    // ========== HEADER CON COLOR ==========
    const headerHeight = 100;
    ctx.fillStyle = colors.primary;
    roundRect(ctx, 0, 0, cardWidth, headerHeight, 6);
    ctx.fill();
    // Cubrir las esquinas inferiores redondeadas
    ctx.fillRect(0, headerHeight - 10, cardWidth, 10);

    // Icono del servicio
    const icon = gasto.tipo === 'luz' ? '⚡' : '💧';
    ctx.font = '36px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(icon, 40, 55);

    // Título
    ctx.font = 'bold 26px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Reporte Detallado - Profesor', 90, 50);

    // Subtitulo
    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`${gasto.tipo === 'luz' ? 'Servicio de Electricidad' : 'Servicio de Agua'} • ${mesFormateado.charAt(0).toUpperCase() + mesFormateado.slice(1)}`, 90, 75);

    yPos = headerHeight + 30;

    // ========== RESUMEN GENERAL DEL INMUEBLE ==========
    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = colors.textGray;
    ctx.fillText('DATOS GENERALES DEL INMUEBLE', 40, yPos);

    yPos += 20;

    // Caja de resumen general
    ctx.fillStyle = colors.bgSlate;
    roundRect(ctx, 40, yPos, cardWidth - 80, 70, 10);
    ctx.fill();
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    roundRect(ctx, 40, yPos, cardWidth - 80, 70, 10);
    ctx.stroke();

    // Columnas en el resumen
    const colW = (cardWidth - 80) / 3;

    // Consumo Total
    ctx.font = '11px Arial';
    ctx.fillStyle = colors.textGray;
    ctx.fillText('Consumo Total', 60, yPos + 25);
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = colors.text;
    ctx.fillText(`${gasto.consumoTotal.toFixed(2)} ${gasto.tipo === 'luz' ? 'kWh' : 'm³'}`, 60, yPos + 50);

    // Monto Total
    ctx.font = '11px Arial';
    ctx.fillStyle = colors.textGray;
    ctx.fillText('Monto Total Recibo', 60 + colW, yPos + 25);
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = colors.text;
    ctx.fillText(`S/ ${gasto.montoTotal.toFixed(2)}`, 60 + colW, yPos + 50);

    // Tarifa por unidad (general - sin inflar)
    ctx.font = '11px Arial';
    ctx.fillStyle = colors.textGray;
    ctx.fillText(`Tarifa Base (${gasto.tipo === 'luz' ? 'kWh' : 'm³'})`, 60 + colW * 2, yPos + 25);
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = colors.text;
    // Mostramos la tarifa real por unidad
    ctx.fillText(`S/ ${tarifaReal.toFixed(4)}`, 60 + colW * 2, yPos + 50);

    yPos += 100;

    // ========== DETALLE DEL LOCAL - PROFESOR ==========
    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = colors.textGray;
    ctx.fillText('DETALLE DE CONSUMO - PROFESOR', 40, yPos);

    yPos += 20;

    // Caja principal del detalle
    const detailBoxHeight = isMultiMedidor ? 130 + lecturasProfesor.length * 55 : 130;
    ctx.fillStyle = colors.bg;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 4;
    roundRect(ctx, 40, yPos, cardWidth - 80, detailBoxHeight, 12);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.strokeStyle = colors.border;
    roundRect(ctx, 40, yPos, cardWidth - 80, detailBoxHeight, 12);
    ctx.stroke();

    // ---- Sub-header: Lecturas de Medidores ----
    ctx.fillStyle = colors.bgBlue;
    roundRect(ctx, 40, yPos, cardWidth - 80, 35, 12);
    ctx.fill();
    // Cubrir esquinas inferiores
    ctx.fillStyle = colors.bgBlue;
    ctx.fillRect(40, yPos + 25, cardWidth - 80, 10);

    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = colors.accent;
    ctx.fillText('📊  Lecturas de Medidores', 60, yPos + 23);

    yPos += 45;

    // Headers de tabla
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = colors.textLight;
    ctx.fillText('MEDIDOR', 60, yPos);
    ctx.fillText('LECTURA ANT.', 180, yPos);
    ctx.fillText('LECTURA ACT.', 320, yPos);
    ctx.fillText('CONSUMO', 460, yPos);
    ctx.textAlign = 'right';
    ctx.fillText('COSTO EST.', cardWidth - 60, yPos);
    ctx.textAlign = 'left';

    yPos += 8;

    // Línea separadora
    ctx.strokeStyle = colors.borderLight;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, yPos);
    ctx.lineTo(cardWidth - 60, yPos);
    ctx.stroke();

    yPos += 18;

    // Filas de cada medidor
    lecturasProfesor.forEach((lectura: any, idx: number) => {
        const consumoMedidor = lectura.consumo || (lectura.lecturaActual - lectura.lecturaAnterior);
        // Usar la tarifa real para cada medidor
        const costoMedidor = consumoMedidor * tarifaReal;

        // Fondo alternado
        if (idx % 2 === 0) {
            ctx.fillStyle = colors.bgGray;
            roundRect(ctx, 50, yPos - 14, cardWidth - 100, 40, 6);
            ctx.fill();
        }

        ctx.font = 'bold 13px Arial';
        ctx.fillStyle = colors.primary;
        ctx.fillText(`Medidor ${lectura.medidorNumero || idx + 1}`, 60, yPos + 5);

        ctx.font = '13px Arial';
        ctx.fillStyle = colors.textMedium;
        ctx.fillText(`${lectura.lecturaAnterior.toFixed(2)}`, 180, yPos + 5);
        ctx.fillText(`${lectura.lecturaActual.toFixed(2)}`, 320, yPos + 5);

        ctx.font = 'bold 13px Arial';
        ctx.fillStyle = colors.primary;
        ctx.fillText(`${consumoMedidor.toFixed(2)} ${gasto.tipo === 'luz' ? 'kWh' : 'm³'}`, 460, yPos + 5);

        ctx.textAlign = 'right';
        ctx.fillStyle = colors.textMedium;
        ctx.font = '13px Arial';
        ctx.fillText(`S/ ${costoMedidor.toFixed(2)}`, cardWidth - 60, yPos + 5);
        ctx.textAlign = 'left';

        yPos += 40;
    });

    yPos += 10;

    // ---- Resumen del local ----
    // Línea separadora
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, yPos - 5);
    ctx.lineTo(cardWidth - 60, yPos - 5);
    ctx.stroke();

    // Consumo total
    ctx.font = '12px Arial';
    ctx.fillStyle = colors.textGray;
    ctx.fillText('Consumo Total Local:', 60, yPos + 12);
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = colors.text;
    ctx.fillText(`${costoProfesor.consumo.toFixed(2)} ${gasto.tipo === 'luz' ? 'kWh' : 'm³'}`, 200, yPos + 12);

    // Tarifa efectiva
    ctx.font = '12px Arial';
    ctx.fillStyle = colors.textGray;
    ctx.fillText('Tarifa Aplicada:', 380, yPos + 12);
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = colors.text;
    ctx.fillText(`S/ ${tarifaReal.toFixed(4)} / ${gasto.tipo === 'luz' ? 'kWh' : 'm³'}`, 490, yPos + 12);

    yPos += 40;

    // ========== MONTO A PAGAR ==========
    ctx.fillStyle = colors.primary;
    ctx.shadowColor = 'rgba(11, 37, 60, 0.15)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    roundRect(ctx, 40, yPos, cardWidth - 80, 70, 12);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('TOTAL A PAGAR - PROFESOR', 60, yPos + 30);

    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'right';
    ctx.fillText(`S/ ${costoProfesor.monto.toFixed(2)}`, cardWidth - 60, yPos + 38);
    ctx.textAlign = 'left';

    // Subtexto de verificación
    ctx.font = '11px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(`${costoProfesor.consumo.toFixed(2)} ${gasto.tipo === 'luz' ? 'kWh' : 'm³'} × S/ ${tarifaReal.toFixed(4)} = S/ ${costoProfesor.monto.toFixed(2)}`, 60, yPos + 55);

    yPos += 100;

    // ========== GRÁFICO HISTÓRICO ==========
    if (historial.length > 1) {
        ctx.font = 'bold 13px Arial';
        ctx.fillStyle = colors.textGray;
        ctx.fillText('HISTÓRICO - PROFESOR (ÚLTIMOS 6 MESES)', 40, yPos);

        yPos += 25;

        const chartHeight = 220;
        const chartWidth = cardWidth - 80;
        const chartX = 40;

        // Fondo del gráfico
        ctx.fillStyle = colors.bgSlate;
        roundRect(ctx, chartX, yPos, chartWidth, chartHeight, 10);
        ctx.fill();
        ctx.strokeStyle = colors.border;
        roundRect(ctx, chartX, yPos, chartWidth, chartHeight, 10);
        ctx.stroke();

        const maxMonto = Math.max(...historial.map(h => h.monto)) * 1.3 || 100;
        const barTotalWidth = (chartWidth - 60) / historial.length;
        const barWidth = Math.min(50, barTotalWidth * 0.6);

        // Líneas guía y valores
        for (let i = 1; i <= 4; i++) {
            const y = yPos + chartHeight - 30 - (i * ((chartHeight - 50) / 5));
            ctx.strokeStyle = '#E2E8F0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(chartX + 10, y);
            ctx.lineTo(chartX + chartWidth - 10, y);
            ctx.stroke();

            ctx.font = '9px Arial';
            ctx.fillStyle = '#94A3B8';
            ctx.textAlign = 'right';
            ctx.fillText(`S/ ${(maxMonto * (i / 5)).toFixed(0)}`, chartX + 45, y + 3);
            ctx.textAlign = 'left';
        }

        // Barras
        historial.forEach((h, index) => {
            const barX = chartX + 55 + (index * barTotalWidth) + (barTotalWidth - barWidth) / 2;
            const barH = (h.monto / maxMonto) * (chartHeight - 50);
            const barY = yPos + chartHeight - 30 - barH;

            // Degradado de la barra
            const gradient = ctx.createLinearGradient(barX, barY, barX, yPos + chartHeight - 30);
            gradient.addColorStop(0, colors.accent);
            gradient.addColorStop(1, colors.primaryLight);
            ctx.fillStyle = gradient;
            roundRect(ctx, barX, barY, barWidth, barH, 5);
            ctx.fill();

            // Valor encima de la barra
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = colors.text;
            ctx.textAlign = 'center';
            ctx.fillText(`S/ ${h.monto.toFixed(0)}`, barX + barWidth / 2, barY - 8);

            // Consumo debajo del valor
            ctx.font = '8px Arial';
            ctx.fillStyle = colors.textLight;
            ctx.fillText(`${h.consumo.toFixed(1)} ${gasto.tipo === 'luz' ? 'kWh' : 'm³'}`, barX + barWidth / 2, barY - 20);

            // Mes debajo
            const mesNombre = new Date(h.mes + '-02').toLocaleDateString('es-ES', { month: 'short' });
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = colors.textMedium;
            ctx.fillText(mesNombre.toUpperCase(), barX + barWidth / 2, yPos + chartHeight - 12);

            ctx.textAlign = 'left';
        });

        yPos += chartHeight + 30;
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
    ctx.fillText('JamberCorp - Sistema de Gestión Empresarial', cardWidth / 2, yPos + 20);
    ctx.fillText(`Generado el ${fecha} • Reporte exclusivo para el local Profesor`, cardWidth / 2, yPos + 35);
    ctx.textAlign = 'left';

    // ======== DESCARGAR IMAGEN ========
    canvas.toBlob((blob) => {
        if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Reporte_Profesor_${gasto.tipo}_${gasto.mes}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }, 'image/png');
};

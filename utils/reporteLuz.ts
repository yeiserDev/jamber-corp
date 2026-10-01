import { Gasto, Local } from '@/types/gasto';
import { crearReporteAcuerdoLuzPdf } from './reporteAcuerdoLuzPdf';

export function generarReporteLuz(gasto: Gasto, locales: Local[], localId?: string) {
  const ocupantes = gasto.costosPorLocal.map(costo => {
    const id = typeof costo.localId === 'string' ? costo.localId : costo.localId._id;
    const local = typeof costo.localId === 'string' ? locales.find(l => l._id === id) : costo.localId;
    return { nombre: local?.nombre || 'Local', tipo: local?.tipo || '', consumo: costo.consumo, id,
      lecturas: gasto.lecturas.filter(l => (typeof l.localId === 'string' ? l.localId : l.localId._id) === id)
        .map(l => ({ medidorNumero: l.medidorNumero ?? 1, lecturaAnterior: l.lecturaAnterior, lecturaActual: l.lecturaActual })) };
  });
  const principal = ocupantes.find(l => l.id === localId) ?? ocupantes.find(l => l.tipo === 'panaderia') ?? ocupantes[0];
  if (!principal || gasto.tarifaEnergia === undefined || gasto.alumbradoPublico === undefined) return;
  const etiquetaMes = new Date(`${gasto.mes}-02T12:00:00`).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  const doc = crearReporteAcuerdoLuzPdf({
    nombreLocal: principal.nombre, etiquetaMes, periodo: gasto.mes, suministro: '',
    lecturaAnterior: principal.lecturas[0]?.lecturaAnterior ?? 0,
    lecturaActual: principal.lecturas[0]?.lecturaActual ?? 0,
    consumoLocal: principal.consumo, consumoTotal: gasto.consumoTotal, montoOficial: gasto.montoTotal,
    cantidadOcupantes: 4, ocupantes,
    desglose: { precioBase: gasto.tarifaEnergia, energia: gasto.tarifaEnergia * gasto.consumoTotal,
      alumbrado: gasto.alumbradoPublico, igv: gasto.igv ?? 0,
      cargoFijo: 0, mantenimiento: 0, interes: 0, electrificacion: 0, ajustes: 0 },
  });
  doc.save(`Luz_${principal.nombre}_${gasto.mes}.pdf`);
}

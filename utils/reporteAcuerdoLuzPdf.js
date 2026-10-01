/* eslint-disable @typescript-eslint/no-require-imports -- Compartido con el generador PDF CommonJS existente. */
const { jsPDF } = require('jspdf');
const { calcularConceptosLuz, redondearSoles } = require('../lib/billing/reglaLuz');

/** @param {import('./reportePanaderiaPdf').DatosReportePanaderia} datos */
function crearReporteAcuerdoLuzPdf(datos) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margen = 18;
  const derecha = 192;
  let y = 24;
  const moneda = valor => `S/ ${valor.toFixed(2)}`;
  const calcular = consumo => calcularConceptosLuz({ consumo, consumoTotal: datos.consumoTotal,
    tarifaEnergia: datos.desglose.precioBase, alumbradoPublico: datos.desglose.alumbrado, igv: datos.desglose.igv });
  const principal = calcular(datos.consumoLocal);
  const ocupantes = datos.ocupantes.map(local => ({ ...local, ...calcular(local.consumo) }));
  const completo = ocupantes.length === 4;
  const total = redondearSoles(ocupantes.reduce((suma, local) => suma + local.monto, 0));

  function titulo(texto) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(19); doc.setTextColor(10, 38, 64);
    doc.text(texto, margen, y); y += 10;
  }
  function texto(texto, negrita = false) {
    doc.setFont('helvetica', negrita ? 'bold' : 'normal'); doc.setFontSize(10); doc.setTextColor(55, 65, 81);
    const lineas = doc.splitTextToSize(texto, derecha - margen);
    doc.text(lineas, margen, y); y += lineas.length * 5 + 3;
  }
  function fila(etiqueta, valor, fuerte = false) {
    doc.setFont('helvetica', fuerte ? 'bold' : 'normal'); doc.setFontSize(fuerte ? 12 : 10);
    doc.setTextColor(10, 38, 64); doc.text(etiqueta, margen, y); doc.text(valor, derecha, y, { align: 'right' });
    y += fuerte ? 11 : 8;
  }
  function linea() { doc.setDrawColor(215, 222, 229); doc.line(margen, y, derecha, y); y += 9; }

  titulo(`Luz de ${datos.nombreLocal}`);
  texto(`${datos.etiquetaMes} | ${datos.periodo}`);
  texto('Jamber Corp - Acuerdo de reparto interno', true);
  if (datos.suministro) texto(`Suministro: ${datos.suministro}`);
  linea();
  texto('Se consideran únicamente estos tres conceptos:', true);
  fila('Consumo de energía', moneda(principal.montoEnergia));
  texto(`${datos.consumoLocal.toFixed(2)} kWh x S/ ${datos.desglose.precioBase.toFixed(4)} por kWh`);
  fila('Alumbrado público', moneda(principal.montoAlumbrado));
  texto(`${moneda(datos.desglose.alumbrado)} / 4 ocupantes. Academia, panadería, spa y casa pagan partes iguales.`);
  fila('IGV proporcional al consumo', moneda(principal.montoIgv));
  texto(`${moneda(datos.desglose.igv)} x (${datos.consumoLocal.toFixed(2)} / ${datos.consumoTotal.toFixed(2)} kWh)`);
  linea();
  fila('TOTAL DEL LOCAL', moneda(principal.monto), true);
  texto('El IGV se toma del recibo y se reparte según los kWh de cada local. No se vuelve a calcular sobre consumo más alumbrado.');
  texto('El cargo fijo, mantenimiento, intereses, electrificación y otros ajustes no se suman como conceptos adicionales en este reparto.');
  if (completo) {
    linea();
    fila('Total del recibo (referencia)', moneda(datos.montoOficial));
    fila('Total distribuido entre los cuatro', moneda(total));
    fila('Diferencia respecto al recibo', moneda(redondearSoles(datos.montoOficial - total)));
    texto('La diferencia queda fuera de este reparto. Cada concepto se redondea a dos decimales antes de sumar; pueden existir diferencias de centavos.');
  }

  if (ocupantes.length) {
    doc.addPage(); y = 24;
    titulo('Detalle por ocupante');
    texto(`${datos.etiquetaMes} | Consumo total: ${datos.consumoTotal.toFixed(2)} kWh`);
    for (const local of ocupantes) {
      linea();
      fila(local.nombre, moneda(local.monto), true);
      texto(`Consumo: ${local.consumo.toFixed(2)} kWh (${(100 * local.consumo / datos.consumoTotal).toFixed(2)} % del total)`);
      fila(`Energía: ${local.consumo.toFixed(2)} x ${datos.desglose.precioBase.toFixed(4)}`, moneda(local.montoEnergia));
      fila(`Alumbrado: ${moneda(datos.desglose.alumbrado)} / 4`, moneda(local.montoAlumbrado));
      fila(`IGV: ${moneda(datos.desglose.igv)} x ${local.consumo.toFixed(2)} / ${datos.consumoTotal.toFixed(2)}`, moneda(local.montoIgv));
    }
  }
  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p); doc.setDrawColor(215, 222, 229); doc.line(margen, 282, derecha, 282);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(90, 100, 110);
    doc.text('Jamber Corp | Energía + alumbrado / 4 + IGV proporcional', margen, 288);
    doc.text(`${p} / ${paginas}`, derecha, 288, { align: 'right' });
  }
  return doc;
}

module.exports = { crearReporteAcuerdoLuzPdf };

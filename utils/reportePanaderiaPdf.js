const { jsPDF } = require("jspdf");

/**
 * @typedef {Object} DesgloseLuz
 * @property {number} precioBase
 * @property {number} energia
 * @property {number} cargoFijo
 * @property {number} mantenimiento
 * @property {number} alumbrado
 * @property {number} interes
 * @property {number} igv
 * @property {number} electrificacion
 * @property {number} ajustes
 * @property {number=} foseIncluido
 */

/**
 * @typedef {Object} DatosReportePanaderia
 * @property {string} nombreLocal
 * @property {string} etiquetaMes
 * @property {string} periodo
 * @property {string} suministro
 * @property {number} lecturaAnterior
 * @property {number} lecturaActual
 * @property {number} consumoLocal
 * @property {number} consumoTotal
 * @property {number} montoOficial
 * @property {number} cantidadOcupantes
 * @property {DesgloseLuz} desglose
 */

const soles = (valor) => `S/ ${(Math.round((valor + Number.EPSILON) * 100) / 100).toFixed(2)}`;
const numero = (valor, decimales = 2) => valor.toFixed(decimales);

/** @param {DatosReportePanaderia} datos */
function crearReportePanaderiaPdf(datos) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const ancho = 210;
  const alto = 297;
  const margen = 18;
  const anchoUtil = ancho - margen * 2;
  const pieY = 287;
  const d = datos.desglose;
  const proporcion = datos.consumoLocal / datos.consumoTotal;
  const porcentaje = proporcion * 100;
  const consumoCalculado = datos.lecturaActual - datos.lecturaAnterior;
  const subtotalAfecto = d.energia + d.cargoFijo + d.mantenimiento + d.alumbrado + d.interes;

  const proporcional = {
    energia: d.energia * proporcion,
    cargoFijo: d.cargoFijo * proporcion,
    mantenimiento: d.mantenimiento * proporcion,
    alumbrado: d.alumbrado * proporcion,
    interes: d.interes * proporcion,
    igv: d.igv * proporcion,
    electrificacion: d.electrificacion * proporcion,
    ajustes: d.ajustes * proporcion,
  };
  const totalProporcional = Object.values(proporcional).reduce((suma, valor) => suma + valor, 0);

  const cargosComunes = d.cargoFijo + d.mantenimiento + d.alumbrado + d.interes;
  const comunesPorOcupante = cargosComunes / datos.cantidadOcupantes;
  const energiaMixta = proporcional.energia;
  const igvMixto = (energiaMixta + comunesPorOcupante) * 0.18;
  const electrificacionMixta = proporcional.electrificacion;
  const ajusteMixto = d.ajustes / datos.cantidadOcupantes;
  const totalMixto = energiaMixta + comunesPorOcupante + igvMixto + electrificacionMixta + ajusteMixto;

  let y = 0;

  const encabezado = () => {
    doc.setFillColor(24, 24, 22);
    doc.rect(0, 0, ancho, 34, "F");
    doc.setFillColor(245, 190, 32);
    doc.rect(0, 34, ancho, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text("Explicación manual del recibo de luz", margen, 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(214, 211, 209);
    doc.text(`${datos.nombreLocal} | ${datos.etiquetaMes} | Suministro ${datos.suministro}`, margen, 24);
    doc.text(datos.periodo, margen, 29.5);
    y = 47;
  };

  const nuevaPagina = () => {
    doc.addPage();
    encabezado();
  };

  const asegurarEspacio = (necesario) => {
    if (y + necesario > pieY - 8) nuevaPagina();
  };

  const tituloSeccion = (numeroSeccion, titulo) => {
    asegurarEspacio(17);
    doc.setTextColor(120, 78, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${numeroSeccion}. ${titulo.toUpperCase()}`, margen, y);
    doc.setDrawColor(231, 229, 228);
    doc.line(margen, y + 3, ancho - margen, y + 3);
    y += 10;
  };

  const parrafo = (texto, opciones = {}) => {
    const { negrita = false, color = [68, 64, 60], espacio = 4 } = opciones;
    doc.setFont("helvetica", negrita ? "bold" : "normal");
    doc.setFontSize(10.2);
    doc.setTextColor(color[0], color[1], color[2]);
    const lineas = doc.splitTextToSize(texto, anchoUtil);
    asegurarEspacio(lineas.length * 5 + espacio);
    doc.text(lineas, margen, y);
    y += lineas.length * 5 + espacio;
  };

  const formula = (etiqueta, operacion, resultado) => {
    asegurarEspacio(21);
    doc.setFillColor(250, 248, 242);
    doc.setDrawColor(231, 229, 228);
    doc.roundedRect(margen, y, anchoUtil, 17, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(120, 113, 108);
    doc.text(etiqueta, margen + 4, y + 5.5);
    doc.setFont("courier", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(28, 25, 23);
    doc.text(operacion, margen + 4, y + 12.5);
    doc.setFont("helvetica", "bold");
    doc.text(resultado, ancho - margen - 4, y + 12.5, { align: "right" });
    y += 21;
  };

  const fila = (concepto, recibo, parteLocal, resaltar = false) => {
    asegurarEspacio(9);
    if (resaltar) {
      doc.setFillColor(255, 247, 204);
      doc.rect(margen, y - 5.5, anchoUtil, 8.5, "F");
    }
    doc.setFont("helvetica", resaltar ? "bold" : "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(41, 37, 36);
    doc.text(concepto, margen + 2, y);
    doc.setFont("courier", resaltar ? "bold" : "normal");
    doc.text(soles(recibo), 137, y, { align: "right" });
    doc.text(soles(parteLocal), ancho - margen - 2, y, { align: "right" });
    y += 7;
  };

  const filaRecibo = (concepto, importe, resaltar = false) => {
    asegurarEspacio(9);
    if (resaltar) {
      doc.setFillColor(255, 247, 204);
      doc.rect(margen, y - 5.5, anchoUtil, 8.5, "F");
    }
    doc.setFont("helvetica", resaltar ? "bold" : "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(41, 37, 36);
    doc.text(concepto, margen + 2, y);
    doc.setFont("courier", resaltar ? "bold" : "normal");
    doc.text(soles(importe), ancho - margen - 2, y, { align: "right" });
    y += 7;
  };

  encabezado();

  tituloSeccion(1, "Datos que aparecen en el recibo");
  parrafo("Antes de repartir el pago se comprueba que todos los importes coincidan con el documento de Luz del Sur.");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(120, 113, 108);
  doc.text("CONCEPTO", margen + 2, y);
  doc.text("IMPORTE", ancho - margen - 2, y, { align: "right" });
  y += 6;
  filaRecibo("Consumo de energía", d.energia);
  filaRecibo("Cargo fijo", d.cargoFijo);
  filaRecibo("Mantenimiento y reposición", d.mantenimiento);
  filaRecibo("Alumbrado público", d.alumbrado);
  filaRecibo("Interés compensatorio", d.interes);
  filaRecibo("Subtotal afecto", subtotalAfecto, true);
  filaRecibo("IGV: 18% del subtotal", d.igv);
  filaRecibo("Electrificación rural", d.electrificacion);
  filaRecibo("Ajustes por redondeo", d.ajustes);
  filaRecibo("TOTAL A PAGAR", datos.montoOficial, true);
  y += 3;
  if (d.foseIncluido != null) {
    parrafo(`Nota FOSE: el recibo informa S/ ${numero(d.foseIncluido)} ya incluidos. No se suman una segunda vez.`, { negrita: true });
  }

  tituloSeccion(2, "Lectura y consumo de Panadería");
  formula(
    "Resta del medidor interno",
    `${numero(datos.lecturaActual)} - ${numero(datos.lecturaAnterior)} kWh`,
    `${numero(consumoCalculado)} kWh`
  );
  formula(
    "Participación en el consumo total",
    `${numero(datos.consumoLocal)} / ${numero(datos.consumoTotal)} x 100`,
    `${numero(porcentaje)}%`
  );
  parrafo("La Panadería utilizó aproximadamente 7 de cada 10 kWh registrados por el medidor principal.");

  nuevaPagina();
  tituloSeccion(3, "Cálculo proporcional usado por el sistema");
  formula(
    "Energía de Panadería con la tarifa impresa de agosto",
    `${numero(datos.consumoLocal)} kWh x S/ ${numero(d.precioBase, 4)}`,
    soles(proporcional.energia)
  );
  parrafo("Cada concepto del recibo se multiplica por el mismo 69.93% de participación. Por eso el importe no contiene cargos ocultos.");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(120, 113, 108);
  doc.text("CONCEPTO", margen + 2, y);
  doc.text("RECIBO", 137, y, { align: "right" });
  doc.text("PANADERÍA", ancho - margen - 2, y, { align: "right" });
  y += 6;
  fila("Energía", d.energia, proporcional.energia);
  fila("Cargo fijo", d.cargoFijo, proporcional.cargoFijo);
  fila("Mantenimiento", d.mantenimiento, proporcional.mantenimiento);
  fila("Alumbrado público", d.alumbrado, proporcional.alumbrado);
  fila("Interés", d.interes, proporcional.interes);
  fila("IGV", d.igv, proporcional.igv);
  fila("Electrificación rural", d.electrificacion, proporcional.electrificacion);
  fila("Redondeos", d.ajustes, proporcional.ajustes);
  fila("TOTAL PROPORCIONAL", datos.montoOficial, totalProporcional, true);
  y += 4;

  tituloSeccion(4, "Por qué el alumbrado sale S/ 24.62");
  formula(
    "Alumbrado público proporcional",
    `${soles(d.alumbrado)} x ${numero(porcentaje)}%`,
    soles(proporcional.alumbrado)
  );
  parrafo("El alumbrado público del suministro se determina considerando el consumo del medidor principal. El sistema conserva ese criterio y distribuye el cargo según los kWh de cada ocupante.");
  parrafo("Esto demuestra que S/ 24.62 no es un cobro inventado: es el 69.93% de los S/ 35.20 que aparecen en el recibo. Sin embargo, el reparto entre submedidores internos debe quedar acordado entre los ocupantes.");

  nuevaPagina();
  tituloSeccion(5, "Revisión del cálculo presentado por la señora");
  formula(
    "Cálculo con la tarifa anterior",
    `${numero(datos.consumoLocal)} kWh x S/ 0.6129`,
    soles(datos.consumoLocal * 0.6129)
  );
  formula(
    "Cálculo con la tarifa correcta del recibo de agosto",
    `${numero(datos.consumoLocal)} kWh x S/ ${numero(d.precioBase, 4)}`,
    soles(energiaMixta)
  );
  parrafo(`La diferencia inicial es ${soles(energiaMixta - datos.consumoLocal * 0.6129)}. La tarifa S/ 0.6129 corresponde al periodo anterior; el recibo de agosto imprime S/ ${numero(d.precioBase, 4)} por kWh.`, { negrita: true });

  tituloSeccion(6, "Alternativa si los cargos comunes se dividen entre cuatro");
  parrafo("Esta alternativa no corrige un error matemático del sistema. Es una regla interna diferente para facilitar un acuerdo.");
  formula(
    "Cargos comunes por ocupante",
    `${soles(cargosComunes)} / ${datos.cantidadOcupantes}`,
    soles(comunesPorOcupante)
  );
  fila("Energía proporcional", proporcional.energia, energiaMixta);
  fila("Cargos comunes iguales", cargosComunes, comunesPorOcupante);
  fila("IGV 18% de la base asignada", d.igv, igvMixto);
  fila("Electrificación rural proporcional", d.electrificacion, electrificacionMixta);
  fila("Redondeo dividido entre cuatro", d.ajustes, ajusteMixto);
  fila("TOTAL CON METODO MIXTO", datos.montoOficial, totalMixto, true);
  y += 4;

  tituloSeccion(7, "Conclusión para conversar");
  parrafo(`El monto de ${soles(totalProporcional)} es correcto bajo el reparto proporcional: todos los conceptos siguen el ${numero(porcentaje)}% de consumo de Panadería. El monto de ${soles(totalMixto)} corresponde a otra política, donde los cargos comunes se dividen por igual. Ninguno debe presentarse como una regla impuesta por Luz del Sur para submedidores internos.`, { negrita: true });
  parrafo("Para evitar nuevas diferencias, la familia y los locales deben dejar por escrito cuál de los dos criterios se aplicará todos los meses.");

  const paginas = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= paginas; pagina += 1) {
    doc.setPage(pagina);
    doc.setDrawColor(231, 229, 228);
    doc.line(margen, pieY - 3, ancho - margen, pieY - 3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 113, 108);
    doc.text("Elaborado a partir del recibo original de Luz del Sur. Documento explicativo de reparto interno.", margen, pieY + 2);
    doc.text(`Página ${pagina} de ${paginas}`, ancho - margen, pieY + 2, { align: "right" });
  }

  return doc;
}

/** @param {DatosReportePanaderia} datos */
function generarReportePanaderiaPdf(datos) {
  const doc = crearReportePanaderiaPdf(datos);
  const nombreMes = datos.etiquetaMes.replace(/\s+/g, "_");
  doc.save(`Explicacion_luz_${datos.nombreLocal}_${nombreMes}.pdf`);
}

module.exports = { crearReportePanaderiaPdf, generarReportePanaderiaPdf };

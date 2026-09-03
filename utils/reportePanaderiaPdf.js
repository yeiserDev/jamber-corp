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
 * @property {{nombre:string, tipo:string, consumo:number, lecturas:{medidorNumero:number, lecturaAnterior:number, lecturaActual:number}[]}[]} ocupantes
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
  const baseAfectaPanaderia = subtotalAfecto * proporcion;

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

  const prioridadOcupante = (ocupante) => {
    const clave = `${ocupante.tipo} ${ocupante.nombre}`.toLowerCase();
    if (clave.includes("panad")) return 1;
    if (clave.includes("prof") || clave.includes("academ")) return 2;
    if (clave.includes("spa")) return 3;
    if (clave.includes("casa")) return 4;
    return 5;
  };
  const nombreOcupante = (ocupante) => {
    const clave = `${ocupante.tipo} ${ocupante.nombre}`.toLowerCase();
    if (clave.includes("prof") || clave.includes("academ")) return "Profesor (Academia)";
    if (clave.includes("panad")) return "Panadería";
    if (clave.includes("spa")) return "Spa";
    if (clave.includes("casa")) return "Casa";
    return ocupante.nombre;
  };
  const ocupantes = [...(datos.ocupantes || [])].sort(
    (a, b) => prioridadOcupante(a) - prioridadOcupante(b)
  );
  const consumoSubmedidores = ocupantes
    .filter((ocupante) => !`${ocupante.tipo} ${ocupante.nombre}`.toLowerCase().includes("casa"))
    .reduce((suma, ocupante) => suma + ocupante.consumo, 0);

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
    const lineas = doc.splitTextToSize(texto, anchoUtil);
    asegurarEspacio(lineas.length * 5 + espacio);
    doc.setFont("helvetica", negrita ? "bold" : "normal");
    doc.setFontSize(10.2);
    doc.setTextColor(color[0], color[1], color[2]);
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

  const detalleOcupante = (ocupante, indice) => {
    if (indice > 0) nuevaPagina();
    const nombre = nombreOcupante(ocupante);
    const parte = ocupante.consumo / datos.consumoTotal;
    const pct = parte * 100;
    const energia = d.energia * parte;
    const cargoFijo = d.cargoFijo * parte;
    const mantenimiento = d.mantenimiento * parte;
    const alumbrado = d.alumbrado * parte;
    const interes = d.interes * parte;
    const baseAfecta = subtotalAfecto * parte;
    const igv = d.igv * parte;
    const electrificacion = d.electrificacion * parte;
    const ajustes = d.ajustes * parte;
    const total = datos.montoOficial * parte;
    const lectura = ocupante.lecturas?.[0];
    const esCasa = `${ocupante.tipo} ${ocupante.nombre}`.toLowerCase().includes("casa");

    const lineaCalculo = (concepto, operacion, resultado, resaltar = false) => {
      if (resaltar) {
        doc.setFillColor(255, 247, 204);
        doc.rect(margen + 4, y - 5.2, anchoUtil - 8, 8, "F");
      }
      doc.setFont("helvetica", resaltar ? "bold" : "normal");
      doc.setFontSize(9.2);
      doc.setTextColor(41, 37, 36);
      doc.text(concepto, margen + 7, y);
      doc.setFont("courier", resaltar ? "bold" : "normal");
      doc.setFontSize(8.6);
      doc.text(operacion, 139, y, { align: "right" });
      doc.text(resultado, ancho - margen - 7, y, { align: "right" });
      y += 7;
    };

    const rotuloPaso = (paso, titulo) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.2);
      doc.setTextColor(146, 96, 0);
      doc.text(`PASO ${paso}`, margen + 4, y);
      doc.setTextColor(41, 37, 36);
      doc.text(titulo.toUpperCase(), margen + 25, y);
      y += 7;
    };

    const cajaResultado = (etiqueta, operacion, resultado) => {
      doc.setFillColor(250, 248, 242);
      doc.setDrawColor(231, 229, 228);
      doc.roundedRect(margen + 4, y, anchoUtil - 8, 14, 2, 2, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 113, 108);
      doc.text(etiqueta, margen + 8, y + 4.5);
      doc.setFont("courier", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(28, 25, 23);
      doc.text(operacion, margen + 8, y + 10.5);
      doc.setFont("helvetica", "bold");
      doc.text(resultado, ancho - margen - 8, y + 10.5, { align: "right" });
      y += 18;
    };

    doc.setFillColor(245, 190, 32);
    doc.setDrawColor(224, 169, 0);
    doc.roundedRect(margen, y, anchoUtil, 14, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(28, 25, 23);
    doc.text(nombre, margen + 5, y + 9.5);
    doc.setFont("courier", "bold");
    doc.setFontSize(10);
    doc.text(`${numero(ocupante.consumo)} kWh  |  ${soles(total)}`, ancho - margen - 5, y + 9.5, { align: "right" });
    y += 23;

    rotuloPaso(1, esCasa ? "Obtener el consumo de la casa" : "Restar las lecturas del medidor");
    if (lectura) {
      cajaResultado(
        "Lectura actual menos lectura anterior",
        `${numero(lectura.lecturaActual)} - ${numero(lectura.lecturaAnterior)}`,
        `${numero(ocupante.consumo)} kWh`
      );
    } else if (esCasa) {
      cajaResultado(
        "Total principal menos los tres submedidores",
        `${numero(datos.consumoTotal)} - ${numero(consumoSubmedidores)}`,
        `${numero(ocupante.consumo)} kWh`
      );
    } else {
      cajaResultado("Consumo ingresado manualmente", numero(ocupante.consumo), `${numero(ocupante.consumo)} kWh`);
    }

    rotuloPaso(2, "Calcular qué porcentaje consumió");
    cajaResultado(
      "Consumo del ocupante entre consumo total",
      `${numero(ocupante.consumo)} / ${numero(datos.consumoTotal)} x 100`,
      `${numero(pct)}%`
    );
    parrafo(`Para las multiplicaciones se usa el factor decimal ${numero(parte, 6)}. Es el mismo ${numero(pct)}% escrito como decimal.`, { espacio: 6 });

    rotuloPaso(3, "Calcular la base afecta al IGV");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    doc.setTextColor(120, 113, 108);
    doc.text("CONCEPTO", margen + 7, y);
    doc.text("OPERACIÓN", 139, y, { align: "right" });
    doc.text("RESULTADO", ancho - margen - 7, y, { align: "right" });
    y += 7;
    lineaCalculo("Energía", `${numero(ocupante.consumo)} x ${numero(d.precioBase, 4)}`, soles(energia));
    lineaCalculo("Cargo fijo", `${numero(d.cargoFijo)} x ${numero(parte, 6)}`, soles(cargoFijo));
    lineaCalculo("Mantenimiento", `${numero(d.mantenimiento)} x ${numero(parte, 6)}`, soles(mantenimiento));
    lineaCalculo("Alumbrado público", `${numero(d.alumbrado)} x ${numero(parte, 6)}`, soles(alumbrado));
    lineaCalculo("Interés", `${numero(d.interes)} x ${numero(parte, 6)}`, soles(interes));
    lineaCalculo("BASE AFECTA", `${numero(subtotalAfecto)} x ${numero(parte, 6)}`, soles(baseAfecta), true);
    y += 5;

    rotuloPaso(4, "Agregar IGV y conceptos no incluidos en la base");
    lineaCalculo("IGV 18%", `${numero(baseAfecta)} x 0.18`, soles(igv));
    lineaCalculo("Electrificación rural", `${numero(d.electrificacion)} x ${numero(parte, 6)}`, soles(electrificacion));
    lineaCalculo("Redondeos", `${numero(d.ajustes)} x ${numero(parte, 6)}`, soles(ajustes));
    y += 5;

    rotuloPaso(5, "Comprobar el total asignado");
    cajaResultado(
      "Total oficial multiplicado por su participación",
      `${numero(datos.montoOficial)} x ${numero(parte, 6)}`,
      soles(total)
    );
  };

  const puntoLegal = (titulo, texto, url) => {
    asegurarEspacio(24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(41, 37, 36);
    doc.text(titulo, margen, y);
    y += 4.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.8);
    doc.setTextColor(68, 64, 60);
    const lineas = doc.splitTextToSize(texto, anchoUtil);
    doc.text(lineas, margen, y);
    y += lineas.length * 4.2;
    doc.setTextColor(146, 96, 0);
    doc.setFontSize(7.2);
    doc.textWithLink(url, margen, y, { url });
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
  parrafo("Cada concepto del recibo se multiplica por el mismo 69.93% de participación. En el caso del IGV, primero se obtiene la base afecta de Panadería y después se aplica la tasa legal del 18%.");
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

  parrafo("¿Por qué el IGV de Panadería es S/ 60.47?", { negrita: true, espacio: 3 });
  formula(
    "Primero: base afecta asignada a Panadería",
    `${soles(subtotalAfecto)} x ${numero(proporcion, 6)}`,
    soles(baseAfectaPanaderia)
  );
  formula(
    "Después: IGV del 18% sobre esa base",
    `${soles(baseAfectaPanaderia)} x 0.18`,
    soles(proporcional.igv)
  );
  parrafo(`También se puede comprobar con el IGV completo del recibo: ${soles(d.igv)} x ${numero(proporcion, 6)} = ${soles(proporcional.igv)}. El 15.05% que aparece al comparar el IGV con el total no es la tasa del impuesto; la tasa aplicada a la base afecta sí es 18%.`);

  nuevaPagina();
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

  nuevaPagina();
  tituloSeccion(7, "Cómo se obtuvo la cuota de cada ocupante");
  parrafo(`Se usa una sola regla para los cuatro: consumo individual dividido entre ${numero(datos.consumoTotal)} kWh. Después se aplica ese porcentaje a cada concepto del recibo. Así se puede verificar a mano y la suma vuelve exactamente al total oficial.`);
  ocupantes.forEach(detalleOcupante);
  const sumaConsumos = ocupantes.reduce((suma, ocupante) => suma + ocupante.consumo, 0);
  const sumaCuotas = ocupantes.reduce(
    (suma, ocupante) => suma + datos.montoOficial * (ocupante.consumo / datos.consumoTotal),
    0
  );
  nuevaPagina();
  tituloSeccion("7.1", "Comprobación general de los cuatro ocupantes");
  parrafo("Al terminar las cuatro cuentas, se suman los consumos y los importes para confirmar que no falte ni se duplique ningún monto.");
  formula(
    "Comprobación final de consumos",
    ocupantes.map((ocupante) => numero(ocupante.consumo)).join(" + "),
    `${numero(sumaConsumos)} kWh`
  );
  formula(
    "Comprobación final del dinero",
    ocupantes.map((ocupante) => soles(datos.montoOficial * (ocupante.consumo / datos.consumoTotal)).replace("S/ ", "")).join(" + "),
    soles(sumaCuotas)
  );
  parrafo("Los conceptos se muestran redondeados a dos decimales para poder copiarlos. El total de cada ocupante se calcula con los valores completos y se redondea solo al final; así se evitan diferencias de un centavo.");

  nuevaPagina();
  tituloSeccion(8, "Sustento del recibo y del criterio aplicado");
  parrafo("Importante: estas normas explican cómo se forma el recibo oficial del único suministro. La ley no establece cómo una propiedad privada debe repartir ese recibo entre sus submedidores; el reparto proporcional es una política interna verificable que imita el criterio de consumo.", { negrita: true });
  puntoLegal(
    "Energía y tarifa del mes",
    `Se usa la tarifa que aparece en el recibo de agosto: ${numero(d.precioBase, 4)} soles por kWh. Por eso cada energía individual es kWh x tarifa, y no se usa la tarifa anterior de 0.6129.`,
    "https://www.osinergmin.gob.pe/"
  );
  puntoLegal(
    "Cargo fijo - Ley de Concesiones Eléctricas, art. 64; Reglamento, art. 142",
    "Es un cargo del suministro, independiente del consumo mensual. Para el reparto interno el sistema lo distribuye según participación; también podría dividirse por igual si todos lo acuerdan por escrito.",
    "https://www.osinergmin.gob.pe/Paginas/CartasServicio/uploads/electricidad/normativa/DS-009-93-EM-REGLAMENTO-LCE.pdf"
  );
  puntoLegal(
    "Mantenimiento y reposición - Reglamento, art. 163",
    "Es un cargo mensual asociado a la conexión. No nace del consumo de un local específico. El porcentaje aplicado aquí es una regla interna de reparto, no una obligación legal entre submedidores.",
    "https://www.osinergmin.gob.pe/Paginas/CartasServicio/uploads/electricidad/normativa/DS-009-93-EM-REGLAMENTO-LCE.pdf"
  );
  puntoLegal(
    "Alumbrado público - Reglamento, art. 184",
    "Para la facturación oficial, el costo del alumbrado se distribuye entre usuarios usando factores de proporción del consumo. El sistema replica ese criterio dentro de la propiedad: 35.20 x porcentaje de kWh. Dividirlo entre cuatro es posible solo como otro acuerdo interno.",
    "https://www.osinergmin.gob.pe/Paginas/CartasServicio/uploads/electricidad/normativa/DS-009-93-EM-REGLAMENTO-LCE.pdf"
  );
  puntoLegal(
    "IGV - tasa total 18% informada por SUNAT",
    `El IGV no es 15.05%. S/ ${numero(d.igv)} representa 15.05% del total final, pero el impuesto se calcula como 18% de la base afecta: ${soles(subtotalAfecto)} x 18% = ${soles(d.igv)}. Cada ocupante paga 18% de su propia base asignada.`,
    "https://orientacion.sunat.gob.pe/3053-concepto-tasa-y-operaciones-gravadas-igv-empresas"
  );
  puntoLegal(
    "Interés compensatorio - Reglamento, art. 176",
    "Se aplica a deudas del servicio desde el vencimiento hasta la cancelación. No es un cargo fijo ni depende de los kWh de un local. Como figura en el recibo principal, aquí se prorratea por consumo; dividirlo por igual requeriría otro acuerdo interno.",
    "https://www.osinergmin.gob.pe/Paginas/CartasServicio/uploads/electricidad/normativa/DS-009-93-EM-REGLAMENTO-LCE.pdf"
  );
  puntoLegal(
    "Ajustes por redondeo",
    `El recibo muestra ${soles(0.09)} del mes anterior y ${soles(-0.03)} del mes actual: el efecto neto es ${soles(d.ajustes)}. Son ajustes contables del documento, no consumo de energía.`,
    "https://www.osinergmin.gob.pe/Resoluciones/pdf/2023/Osinergmin-064-2023-OS-CD-EP.pdf"
  );
  puntoLegal(
    "Electrificación rural - Ley N.° 28749, art. 7, literal h",
    "La contribución está ligada a la energía facturada. Por eso se reparte según kWh y no en cuatro partes iguales.",
    "https://www.gob.pe/institucion/congreso-de-la-republica/normas-legales/738525-28749"
  );
  puntoLegal(
    "FOSE - Ley N.° 27510",
    `El recibo informa un recargo FOSE de ${soles(d.foseIncluido || 0)} ya incorporado en la tarifa. Se explica, pero no se suma otra vez.`,
    "https://www.gob.pe/institucion/osinergmin/normas-legales/738487-27510"
  );

  nuevaPagina();
  tituloSeccion(9, "Conclusión para conversar");
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

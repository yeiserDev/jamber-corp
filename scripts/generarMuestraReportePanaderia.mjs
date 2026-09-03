import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const { crearReportePanaderiaPdf } = require("../utils/reportePanaderiaPdf.js");

const salida = resolve("output/pdf/reporte-luz-panaderia-agosto-2026.pdf");
mkdirSync(dirname(salida), { recursive: true });

const documento = crearReportePanaderiaPdf({
  nombreLocal: "Panaderia",
  etiquetaMes: "Agosto 2026",
  periodo: "16 jul al 17 ago 2026",
  suministro: "1674130",
  lecturaAnterior: 13213.64,
  lecturaActual: 13707.92,
  consumoLocal: 494.28,
  consumoTotal: 706.80,
  montoOficial: 574.70,
  cantidadOcupantes: 4,
  desglose: {
    precioBase: 0.6234,
    energia: 440.62,
    cargoFijo: 2.24,
    mantenimiento: 1.40,
    alumbrado: 35.20,
    interes: 0.94,
    igv: 86.47,
    electrificacion: 7.77,
    ajustes: 0.06,
    foseIncluido: 10.21,
  },
});

writeFileSync(salida, Buffer.from(documento.output("arraybuffer")));
console.log(salida);

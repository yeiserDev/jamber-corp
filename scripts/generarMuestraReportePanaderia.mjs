import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const { crearReportePanaderiaPdf } = require("../utils/reportePanaderiaPdf.js");

const salida = resolve("output/pdf/reporte-luz-panaderia-agosto-2026.pdf");
mkdirSync(dirname(salida), { recursive: true });

const documento = crearReportePanaderiaPdf({
  metodoCalculo: 'consumo-alumbrado-igv-v1',
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
  ocupantes: [
    {
      nombre: "Academia",
      tipo: "academia",
      consumo: 9.30,
      lecturas: [{ medidorNumero: 1, lecturaAnterior: 326.10, lecturaActual: 335.40 }],
    },
    {
      nombre: "Panadería",
      tipo: "panaderia",
      consumo: 494.28,
      lecturas: [{ medidorNumero: 1, lecturaAnterior: 13213.64, lecturaActual: 13707.92 }],
    },
    {
      nombre: "Spa",
      tipo: "spa",
      consumo: 14.70,
      lecturas: [{ medidorNumero: 1, lecturaAnterior: 4574.90, lecturaActual: 4589.60 }],
    },
    { nombre: "Casa", tipo: "casa", consumo: 188.52, lecturas: [] },
  ],
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

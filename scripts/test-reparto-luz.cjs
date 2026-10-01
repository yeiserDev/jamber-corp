/* eslint-disable @typescript-eslint/no-require-imports -- El cargador de pruebas usa CommonJS en Node 20. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
// Carga el cálculo de producción sin añadir dependencias al proyecto.
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
};
const { calcularDistribucion } = require('../lib/billing/calcularDistribucion.ts');
const { METODO_LUZ, calcularConceptosLuz } = require('../lib/billing/reglaLuz');
const entrada = () => ({
  metodoCalculo: METODO_LUZ, consumoTotal: 706.80, montoTotal: 574.70,
  tarifaEnergia: 0.6234, alumbradoPublico: 35.20, igv: 86.47,
  casaLocalId: 'casa',
  localesReparto: ['profesor', 'panaderia', 'spa', 'casa'].map(tipo => ({ localId: tipo, tipo })),
  lecturas: [
    { localId: 'profesor', lecturaAnterior: 326.10, lecturaActual: 335.40 },
    { localId: 'panaderia', lecturaAnterior: 13213.64, lecturaActual: 13707.92 },
    { localId: 'spa', lecturaAnterior: 4574.90, lecturaActual: 4589.60 },
  ],
});

test('reproduce la cuenta manuscrita de agosto: 308.13 + 8.80 + 60.47 = 377.40', () => {
  const resultado = calcularDistribucion(entrada());
  assert.deepEqual(resultado.costosPorLocal.find(l => l.localId === 'panaderia'), {
    localId: 'panaderia', consumo: 494.28, montoEnergia: 308.13,
    montoAlumbrado: 8.80, montoIgv: 60.47, monto: 377.40,
  });
  assert.equal(resultado.consumoCasa, 188.52);
  assert.equal(resultado.costosPorLocal.length, 4);
  assert.ok(resultado.diferenciaRecibo > 0);
  assert.equal(Math.round((resultado.totalDistribuido + resultado.diferenciaRecibo) * 100), 57470);
  resultado.costosPorLocal.forEach(l => assert.equal(l.montoAlumbrado, 8.80));
});

test('un local con varios medidores paga una sola cuarta parte del alumbrado', () => {
  const datos = entrada();
  datos.lecturas[0] = { localId: 'profesor', medidorNumero: 1, lecturaAnterior: 0, lecturaActual: 4 };
  datos.lecturas.push({ localId: 'profesor', medidorNumero: 2, lecturaAnterior: 0, lecturaActual: 5.30 });
  assert.deepEqual(calcularDistribucion(datos).costosPorLocal, calcularDistribucion(entrada()).costosPorLocal);
});

test('acepta el tipo academia de la base de datos y conserva el reparto de profesor', () => {
  const datos = entrada();
  datos.localesReparto[0].tipo = 'academia';
  assert.deepEqual(calcularDistribucion(datos).costosPorLocal, calcularDistribucion(entrada()).costosPorLocal);
});

test('academia y profesor representan el mismo ocupante, no dos cuotas independientes', () => {
  const datos = entrada();
  datos.localesReparto[1].tipo = 'academia';
  assert.throws(() => calcularDistribucion(datos), /una vez cada uno/);
});

test('casa y locales con consumo cero conservan su cuarta parte del alumbrado', () => {
  const datos = entrada();
  datos.lecturas = [
    { localId: 'profesor', lecturaAnterior: 0, lecturaActual: 0 },
    { localId: 'panaderia', lecturaAnterior: 0, lecturaActual: 706.80 },
    { localId: 'spa', lecturaAnterior: 0, lecturaActual: 0 },
  ];
  const reparto = calcularDistribucion(datos).costosPorLocal;
  for (const id of ['profesor', 'spa', 'casa']) {
    assert.deepEqual(reparto.find(l => l.localId === id), {
      localId: id, consumo: 0, montoEnergia: 0, montoAlumbrado: 8.80, montoIgv: 0, monto: 8.80,
    });
  }
});

test('rechaza faltantes, locales ajenos, duplicados y datos inválidos', () => {
  for (const cambio of [
    { tarifaEnergia: undefined }, { alumbradoPublico: undefined }, { tarifaEnergia: -1 },
    { igv: undefined }, { igv: null }, { alumbradoPublico: null }, { tarifaEnergia: Infinity },
    { localesReparto: entrada().localesReparto.slice(0, 3) },
    { lecturas: entrada().lecturas.slice(0, 2) },
    { lecturas: [...entrada().lecturas, { localId: 'ajeno', lecturaAnterior: 0, lecturaActual: 0 }] },
    { lecturas: [...entrada().lecturas, entrada().lecturas[0]] },
    { consumoTotal: 10 }, { montoTotal: 20 },
  ]) assert.throws(() => calcularDistribucion({ ...entrada(), ...cambio }));
});

test('redondea conceptos antes de sumar sin forzar el total al recibo', () => {
  const c = calcularConceptosLuz({ consumo: 1, consumoTotal: 3, tarifaEnergia: 0.335, alumbradoPublico: 1.01, igv: 0.20 });
  assert.deepEqual(c, { montoEnergia: 0.34, montoAlumbrado: 0.25, montoIgv: 0.07, monto: 0.66 });
});

test('mantiene el reparto anterior de agua y registros históricos', () => {
  const datos = entrada();
  delete datos.metodoCalculo;
  const resultado = calcularDistribucion(datos);
  assert.equal(resultado.metodoCalculo, 'proporcional-total');
  assert.equal(Math.round(resultado.costosPorLocal.reduce((s, l) => s + l.monto, 0) * 100), 57470);
});

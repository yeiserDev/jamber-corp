/* eslint-disable @typescript-eslint/no-require-imports -- Script de mantenimiento CommonJS. */
const mongoose = require('mongoose');
const { loadEnvConfig } = require('@next/env');
const { METODO_LUZ, calcularConceptosLuz, redondearSoles } = require('../lib/billing/reglaLuz');

// Valores visibles en la captura del formulario compartida por el usuario.
const tarifaEnergia = 0.6403;
const alumbradoPublico = 38;
loadEnvConfig(process.cwd());

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    const collection = mongoose.connection.collection('gastos');
    const gasto = await collection.findOne({ mes: '2026-09', tipo: 'luz' });
    if (!gasto) throw new Error('No existe el registro de septiembre');
    if (gasto.metodoCalculo !== undefined) throw new Error('El registro ya tiene un método; no se modifica');
    if (gasto.consumoTotal !== 565.7 || gasto.montoTotal !== 484 || gasto.igv !== 72.88 || gasto.costosPorLocal.length !== 4) {
      throw new Error('El registro no coincide con el revisado; no se modifica');
    }
    const campos = { metodoCalculo: METODO_LUZ, tarifaEnergia, alumbradoPublico };
    let total = 0;
    for (const [indice, local] of gasto.costosPorLocal.entries()) {
      const detalle = calcularConceptosLuz({ consumo: local.consumo, consumoTotal: gasto.consumoTotal, tarifaEnergia, alumbradoPublico, igv: gasto.igv });
      if (detalle.monto !== local.monto) throw new Error('Los conceptos no coinciden con el total guardado; no se modifica');
      for (const campo of ['montoEnergia', 'montoAlumbrado', 'montoIgv']) {
        if (local[campo] !== undefined) throw new Error('Existe un desglose previo; no se modifica');
        campos[`costosPorLocal.${indice}.${campo}`] = detalle[campo];
      }
      total += local.monto;
    }
    campos.totalDistribuido = redondearSoles(total);
    campos.diferenciaRecibo = redondearSoles(gasto.montoTotal - campos.totalDistribuido);
    console.log(JSON.stringify({ periodo: gasto.mes, ...campos }, null, 2));
    if (process.argv.includes('--apply')) {
      const resultado = await collection.updateOne({
        _id: gasto._id, metodoCalculo: { $exists: false },
        consumoTotal: gasto.consumoTotal, montoTotal: gasto.montoTotal, igv: gasto.igv,
        costosPorLocal: gasto.costosPorLocal,
      }, { $set: campos });
      if (resultado.modifiedCount !== 1) throw new Error('El registro cambió durante la comprobación; no se actualizó');
      console.log('Desglose recuperado; lecturas y totales conservados.');
    } else console.log('Vista previa. Usa --apply para guardar únicamente los campos faltantes.');
  } catch (error) {
    console.error(error instanceof Error && !error.message.includes('mongodb') ? error.message : 'No se pudo completar la recuperación');
    process.exitCode = 1;
  } finally { await mongoose.disconnect(); }
})();

/** Acuerdo interno: energía, un cuarto del alumbrado e IGV proporcional. */
const METODO_LUZ = "consumo-alumbrado-igv-v1";
const redondearSoles = (valor) => Math.round((valor + Number.EPSILON) * 100) / 100;

/**
 * @param {{consumo: number, consumoTotal: number, tarifaEnergia: number, alumbradoPublico: number, igv: number}} datos
 */
function calcularConceptosLuz({ consumo, consumoTotal, tarifaEnergia, alumbradoPublico, igv }) {
  if (![consumo, consumoTotal, tarifaEnergia, alumbradoPublico, igv].every(Number.isFinite)
      || consumo < 0 || consumoTotal <= 0 || consumo > consumoTotal
      || tarifaEnergia <= 0 || alumbradoPublico < 0 || igv < 0) {
    throw new Error("Revisa el consumo, la tarifa de energía, el alumbrado y el IGV del recibo");
  }
  const montoEnergia = redondearSoles(consumo * tarifaEnergia);
  const montoAlumbrado = redondearSoles(alumbradoPublico / 4);
  const montoIgv = redondearSoles(igv * consumo / consumoTotal);
  return {
    montoEnergia,
    montoAlumbrado,
    montoIgv,
    monto: redondearSoles(montoEnergia + montoAlumbrado + montoIgv),
  };
}

module.exports = { METODO_LUZ, calcularConceptosLuz, redondearSoles };

import { METODO_LUZ, calcularConceptosLuz } from './reglaLuz';

export class BillingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BillingValidationError";
  }
}

type LecturaEntrada = {
  localId: unknown;
  medidorNumero?: number;
  lecturaAnterior: unknown;
  lecturaActual: unknown;
};

type CalculoInput = {
  metodoCalculo?: string;
  tarifaEnergia?: unknown;
  alumbradoPublico?: unknown;
  localesReparto?: { localId: unknown; tipo: string }[];
  consumoTotal: unknown;
  montoTotal: unknown;
  cargoFijo?: unknown;
  igv?: unknown;
  otrosCargos?: unknown;
  lecturas: LecturaEntrada[];
  casaLocalId?: unknown;
};

const numeroValido = (valor: unknown, nombre: string) => {
  const numero = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isFinite(numero) || numero < 0) {
    throw new BillingValidationError(`${nombre} debe ser un número mayor o igual a cero`);
  }
  return numero;
};

const redondear = (valor: number, decimales = 2) => {
  const factor = 10 ** decimales;
  return Math.round((valor + Number.EPSILON) * factor) / factor;
};

/**
 * Luz: energía, alumbrado / 4 e IGV proporcional al consumo.
 * Agua e históricos: distribución proporcional del total facturado.
 */
export function calcularDistribucion({
  metodoCalculo,
  tarifaEnergia: tarifaEntrada,
  alumbradoPublico: alumbradoEntrada,
  localesReparto = [],
  consumoTotal: consumoTotalEntrada,
  montoTotal: montoTotalEntrada,
  cargoFijo: cargoFijoEntrada = 0,
  igv: igvEntrada,
  otrosCargos: otrosCargosEntrada = 0,
  lecturas,
  casaLocalId,
}: CalculoInput) {
  if (metodoCalculo === METODO_LUZ
      && [tarifaEntrada, alumbradoEntrada, igvEntrada].some(valor => typeof valor !== 'number' || !Number.isFinite(valor))) {
    throw new BillingValidationError('Completa la tarifa de energía, el alumbrado público y el IGV del recibo');
  }
  const consumoTotal = numeroValido(consumoTotalEntrada, "El consumo total");
  const montoTotal = numeroValido(montoTotalEntrada, "El monto total");
  const cargoFijo = numeroValido(cargoFijoEntrada, "El cargo fijo");
  const igv = numeroValido(igvEntrada ?? 0, "El IGV");
  const otrosCargos = numeroValido(otrosCargosEntrada, "Los otros cargos");

  if (consumoTotal <= 0) throw new BillingValidationError("El consumo total debe ser mayor a cero");
  if (montoTotal <= 0) throw new BillingValidationError("El monto total debe ser mayor a cero");
  if (redondear(cargoFijo + igv + otrosCargos) > montoTotal) {
    throw new BillingValidationError("El desglose de cargos no puede superar el total facturado del mes");
  }
  if (!Array.isArray(lecturas) || lecturas.length === 0) {
    throw new BillingValidationError("Registra al menos una lectura de medidor");
  }

  const medidores = new Set<string>();
  const lecturasConConsumo = lecturas.map((lectura, index) => {
    const localId = String(lectura.localId || "");
    if (!localId) throw new BillingValidationError(`La lectura ${index + 1} no tiene un local válido`);

    const medidorNumero = lectura.medidorNumero || 1;
    const clave = `${localId}:${medidorNumero}`;
    if (medidores.has(clave)) {
      throw new BillingValidationError("No puede repetirse el mismo medidor de un local");
    }
    medidores.add(clave);

    const lecturaAnterior = numeroValido(lectura.lecturaAnterior, `La lectura anterior del medidor ${index + 1}`);
    const lecturaActual = numeroValido(lectura.lecturaActual, `La lectura actual del medidor ${index + 1}`);
    if (lecturaActual < lecturaAnterior) {
      throw new BillingValidationError(`La lectura actual del medidor ${index + 1} no puede ser menor que la anterior`);
    }

    return {
      ...lectura,
      localId,
      medidorNumero,
      lecturaAnterior,
      lecturaActual,
      consumo: redondear(lecturaActual - lecturaAnterior, 4),
    };
  });

  const consumoTotalLocales = redondear(
    lecturasConConsumo.reduce((suma, lectura) => suma + lectura.consumo, 0),
    4
  );
  if (consumoTotalLocales > consumoTotal + 0.0001) {
    throw new BillingValidationError("La suma de los medidores supera el consumo total indicado en el recibo");
  }

  const consumoCasa = redondear(consumoTotal - consumoTotalLocales, 4);
  const consumoPorLocal = new Map<string, number>();
  for (const lectura of lecturasConConsumo) {
    consumoPorLocal.set(
      lectura.localId,
      redondear((consumoPorLocal.get(lectura.localId) || 0) + lectura.consumo, 4)
    );
  }

  if (casaLocalId && consumoCasa > 0) {
    const id = String(casaLocalId);
    consumoPorLocal.set(id, redondear((consumoPorLocal.get(id) || 0) + consumoCasa, 4));
  } else if (consumoCasa > 0) {
    throw new BillingValidationError("Existe consumo sin asignar, pero no se encontró el local Residencia");
  }

  if (metodoCalculo === METODO_LUZ) {
    const tarifaEnergia = numeroValido(tarifaEntrada, "La tarifa de energía");
    const alumbradoPublico = numeroValido(alumbradoEntrada, "El alumbrado público");
    if (tarifaEnergia <= 0) {
      throw new BillingValidationError("Completa la tarifa de energía y el IGV del recibo");
    }
    // Los registros existentes usan tanto "academia" como el tipo histórico "profesor".
    const tipoOcupante = (tipo: string) => tipo === 'profesor' ? 'academia' : tipo;
    const tipos = ['academia', 'panaderia', 'spa', 'casa'];
    const ids = localesReparto.map(local => String(local.localId));
    if (localesReparto.length !== 4 || new Set(ids).size !== 4
        || tipos.some(tipo => localesReparto.filter(local => tipoOcupante(local.tipo) === tipo).length !== 1)
        || !localesReparto.some(local => local.tipo === 'casa' && String(local.localId) === String(casaLocalId))) {
      throw new BillingValidationError("El reparto requiere academia, panadería, spa y casa, una vez cada uno");
    }
    if (lecturasConConsumo.some(lectura => !ids.includes(lectura.localId) || lectura.localId === String(casaLocalId))) {
      throw new BillingValidationError("Registra lecturas solo para academia, panadería y spa; casa se obtiene por diferencia");
    }
    if (localesReparto.some(local => local.tipo !== 'casa' && !consumoPorLocal.has(String(local.localId)))) {
      throw new BillingValidationError("Completa las lecturas de academia, panadería y spa, incluso si su consumo es cero");
    }
    if (redondear(consumoTotal * tarifaEnergia + alumbradoPublico + igv) > montoTotal + 0.02) {
      throw new BillingValidationError("La energía, el alumbrado y el IGV superan el total del recibo; revisa los importes");
    }
    const costosPorLocal = localesReparto.map(local => {
      const localId = String(local.localId);
      const consumo = consumoPorLocal.get(localId) || 0;
      return { localId, consumo, ...calcularConceptosLuz({ consumo, consumoTotal, tarifaEnergia, alumbradoPublico, igv }) };
    });
    const totalDistribuido = redondear(costosPorLocal.reduce((suma, costo) => suma + costo.monto, 0));
    return {
      consumoTotal, montoTotal, cargoFijo, igv, otrosCargos,
      metodoCalculo: METODO_LUZ, tarifaEnergia, alumbradoPublico,
      totalDistribuido, diferenciaRecibo: redondear(montoTotal - totalDistribuido),
      lecturasConConsumo, consumoTotalLocales, consumoCasa,
      costoPorUnidad: tarifaEnergia, costosPorLocal,
    };
  }

  const costoPorUnidad = montoTotal / consumoTotal;
  const costosPorLocal = Array.from(consumoPorLocal, ([localId, consumo]) => ({
    localId,
    consumo,
    monto: redondear(consumo * costoPorUnidad),
  }));

  // El detalle debe cuadrar exactamente con el recibo, incluso tras redondear centavos.
  const totalRedondeado = costosPorLocal.reduce((suma, item) => suma + item.monto, 0);
  const diferencia = redondear(montoTotal - totalRedondeado);
  if (diferencia !== 0 && costosPorLocal.length > 0) {
    const indiceCasa = casaLocalId
      ? costosPorLocal.findIndex((item) => item.localId === String(casaLocalId))
      : -1;
    const indiceAjuste = indiceCasa >= 0
      ? indiceCasa
      : costosPorLocal.reduce(
          (mayor, item, index, lista) => item.consumo > lista[mayor].consumo ? index : mayor,
          0
        );
    costosPorLocal[indiceAjuste].monto = redondear(costosPorLocal[indiceAjuste].monto + diferencia);
  }

  return {
    metodoCalculo: 'proporcional-total',
    tarifaEnergia: undefined,
    alumbradoPublico: undefined,
    totalDistribuido: montoTotal,
    diferenciaRecibo: 0,
    consumoTotal,
    montoTotal,
    cargoFijo,
    igv,
    otrosCargos,
    lecturasConConsumo,
    consumoTotalLocales,
    consumoCasa,
    costoPorUnidad,
    costosPorLocal,
  };
}

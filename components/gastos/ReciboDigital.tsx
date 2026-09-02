"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Printer } from "lucide-react";

/*
   Serie verificada contra los recibos fisicos de Luz del Sur
   (suministro 1674130) y las fotos del medidor de la panaderia.

   medidorApp*  = lecturas registradas en el sistema
   medidorReal* = lo que marcaba el medidor fisico ese dia

   Solo hay lectura fisica en la fecha exacta de corte desde el recibo
   de mayo; antes las fotos se tomaban a fin de mes. Por eso los dos
   primeros meses no tienen medidorReal y el bloque de reconciliacion
   se oculta ahi.
*/

/** Conceptos del recibo de Luz del Sur, tal como vienen impresos */
export interface DesgloseRecibo {
  precioBase: number;
  energia: number;
  cargoFijo: number;
  mantenimiento: number;
  alumbrado: number;
  interes: number;
  igv: number;
  electrificacion: number;
  ajustes: number;
  /** Recargo ya incorporado en la tarifa; se informa, pero no se vuelve a sumar. */
  foseIncluido?: number;
}

export interface MesPanaderia {
  /**
   * Clave igual a Gasto.mes, formato "2026-07".
   *
   * Es solo una pista: si el gasto se archiva en otro mes, el recibo se
   * localiza igual por el importe total, que no cambia de sitio.
   */
  mes: string;
  /** Mes facturado segun el recibo, que es lo que ella ve en su papel */
  etiqueta: string;
  /** Mes en que se le cobra, como lo registra el sistema */
  mesCobro: string;
  periodo: string;
  fechaAnterior: string;
  fechaActual: string;
  medidorAppAnterior?: number;
  medidorAppActual?: number;
  medidorRealAnterior?: number;
  medidorRealActual?: number;
  desglose: DesgloseRecibo;
}

export const SERIE_PANADERIA: MesPanaderia[] = [
  {
    mes: "2026-03",
    etiqueta: "Marzo 2026",
    mesCobro: "abril",
    periodo: "16 feb al 18 mar 2026",
    fechaAnterior: "16 de febrero",
    fechaActual: "18 de marzo",
    medidorAppAnterior: 10788.85,
    medidorAppActual: 11036.05,
    desglose: {
      precioBase: 0.5814, energia: 188.20, cargoFijo: 2.16, mantenimiento: 1.35,
      alumbrado: 14.60, interes: 0.33, igv: 37.20, electrificacion: 3.56, ajustes: 0,
    },
  },
  {
    mes: "2026-04",
    etiqueta: "Abril 2026",
    mesCobro: "mayo",
    periodo: "18 mar al 16 abr 2026",
    fechaAnterior: "18 de marzo",
    fechaActual: "16 de abril",
    medidorAppAnterior: 11036.05,
    medidorAppActual: 11496.35,
    desglose: {
      precioBase: 0.5836, energia: 408.29, cargoFijo: 2.20, mantenimiento: 1.37,
      alumbrado: 29.19, interes: 0.36, igv: 79.45, electrificacion: 7.70, ajustes: 0.04,
    },
  },
  {
    mes: "2026-05",
    etiqueta: "Mayo 2026",
    mesCobro: "junio",
    periodo: "16 abr al 15 may 2026",
    fechaAnterior: "16 de abril",
    fechaActual: "15 de mayo",
    medidorAppAnterior: 11496.35,
    medidorAppActual: 11950.83,
    medidorRealActual: 12184.96,
    desglose: {
      precioBase: 0.5991, energia: 374.26, cargoFijo: 2.26, mantenimiento: 1.41,
      alumbrado: 29.19, interes: 0.64, igv: 73.40, electrificacion: 6.87, ajustes: -0.03,
    },
  },
  {
    mes: "2026-06",
    etiqueta: "Junio 2026",
    mesCobro: "julio",
    periodo: "15 may al 15 jun 2026",
    fechaAnterior: "15 de mayo",
    fechaActual: "15 de junio",
    medidorAppAnterior: 11950.83,
    medidorAppActual: 12418.83,
    medidorRealAnterior: 12184.96,
    medidorRealActual: 12695.95,
    desglose: {
      precioBase: 0.6134, energia: 409.26, cargoFijo: 2.27, mantenimiento: 1.42,
      alumbrado: 33.04, interes: 0.95, igv: 80.46, electrificacion: 7.34, ajustes: -0.04,
    },
  },
  {
    mes: "2026-07",
    etiqueta: "Julio 2026",
    mesCobro: "agosto",
    periodo: "15 jun al 16 jul 2026",
    fechaAnterior: "15 de junio",
    fechaActual: "16 de julio",
    medidorAppAnterior: 12418.83,
    medidorAppActual: 12903.83,
    medidorRealAnterior: 12695.95,
    medidorRealActual: 13213.64,
    desglose: {
      precioBase: 0.6129, energia: 414.20, cargoFijo: 2.26, mantenimiento: 1.41,
      alumbrado: 35.20, interes: 1.19, igv: 81.77, electrificacion: 7.43, ajustes: 0.14,
    },
  },
  {
    mes: "2026-08",
    etiqueta: "Agosto 2026",
    mesCobro: "setiembre",
    periodo: "16 jul al 17 ago 2026",
    fechaAnterior: "16 de julio",
    fechaActual: "17 de agosto",
    desglose: {
      precioBase: 0.6234, energia: 440.62, cargoFijo: 2.24, mantenimiento: 1.40,
      alumbrado: 35.20, interes: 0.94, igv: 86.47, electrificacion: 7.77,
      ajustes: 0.06, foseIncluido: 10.21,
    },
  },
];

export const SUMINISTRO = "1674130";

/** Suma de los conceptos, que debe dar el total a pagar del recibo */
export function totalRecibo(m: MesPanaderia): number {
  const d = m.desglose;
  return (
    d.energia + d.cargoFijo + d.mantenimiento + d.alumbrado +
    d.interes + d.igv + d.electrificacion + d.ajustes
  );
}

/* Pantalla del medidor */
function Lcd({ valor, fecha }: { valor: number; fecha: string }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="rounded-lg border-[5px] border-neutral-800 bg-[#b8c99a] px-2 py-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.25)]">
        <p className="font-mono text-[20px] sm:text-[26px] font-bold tracking-[0.08em] text-[#1f2a16] text-center tabular-nums">
          {valor.toFixed(2)}
        </p>
      </div>
      <p className="text-[12px] text-neutral-500 text-center mt-1.5 font-medium">
        {fecha}
      </p>
    </div>
  );
}

/* Fila con guias punteadas, como el desglose del recibo */
function Fila({
  concepto,
  valor,
  fuerte,
}: {
  concepto: string;
  valor: string;
  fuerte?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className={`text-[15px] ${
          fuerte ? "font-bold text-neutral-900" : "text-neutral-600"
        }`}
      >
        {concepto}
      </span>
      <span className="flex-1 border-b border-dotted border-neutral-300 min-w-4" />
      <span
        className={`font-mono tabular-nums whitespace-nowrap ${
          fuerte
            ? "text-[17px] font-bold text-neutral-900"
            : "text-[15px] text-neutral-700"
        }`}
      >
        {valor}
      </span>
    </div>
  );
}

/* Titulo de seccion */
function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400 mb-3">
      {children}
    </p>
  );
}

interface ReciboDigitalProps {
  open: boolean;
  onClose: () => void;
  nombreLocal: string;
  /** Gasto.mes, formato "2026-08" */
  mes: string;
  montoRecibo: number;
  consumoTotalPropiedad: number;
  montoLocal: number;
  consumoLocal: number;
  serie?: MesPanaderia[];
}

export default function ReciboDigital({
  open,
  onClose,
  nombreLocal,
  mes,
  montoRecibo,
  consumoTotalPropiedad,
  montoLocal,
  consumoLocal,
  serie = SERIE_PANADERIA,
}: ReciboDigitalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previo;
    };
  }, [open, onClose]);

  if (!open) return null;

  /* Tolera "2026-8" y espacios sobrantes ademas del formato "2026-08" */
  const clave = (() => {
    const t = (mes ?? "").trim();
    const m = t.match(/^(\d{4})-(\d{1,2})$/);
    return m ? `${m[1]}-${m[2].padStart(2, "0")}` : t;
  })();

  /* Primero por mes; si el gasto se archivo en otro mes, por el importe del
     recibo, que identifica a cada uno sin ambiguedad. */
  let idx = serie.findIndex(m => m.mes === clave);
  if (idx < 0 && montoRecibo > 0) {
    idx = serie.findIndex(m => Math.abs(totalRecibo(m) - montoRecibo) < 0.02);
  }
  const datos = idx >= 0 ? serie[idx] : undefined;
  const anterior = idx > 0 ? serie[idx - 1] : undefined;

  const tarifaReal =
    consumoTotalPropiedad > 0 ? montoRecibo / consumoTotalPropiedad : 0;

  const puedeReconciliar =
    datos?.medidorRealAnterior != null && datos?.medidorRealActual != null;
  const restaDeElla = puedeReconciliar
    ? datos!.medidorRealActual! - datos!.medidorRealAnterior!
    : 0;
  const noCobrado = restaDeElla - consumoLocal;

  const saldo =
    datos?.medidorRealActual != null && datos?.medidorAppActual != null
      ? datos.medidorRealActual - datos.medidorAppActual
      : 0;
  const saldoSoles = saldo * tarifaReal;

  const kwhAnterior = anterior
    && anterior.medidorAppActual != null
    && anterior.medidorAppAnterior != null
    ? anterior.medidorAppActual - anterior.medidorAppAnterior
    : 0;

  /*
     Las dos cuentas.
     Su manera: solo energia + IGV, sobre la resta cruda del medidor.
     La nuestra: cada concepto del recibo repartido segun su parte, que es
     identico a multiplicar por la tarifa efectiva.

     La parte se toma sobre soles, no sobre kWh: como la tarifa efectiva es la
     misma para todos, el resultado es el mismo, pero asi las filas del
     desglose suman exactamente su monto y ella lo puede comprobar con
     calculadora.
  */
  const d = datos?.desglose;
  const parte = montoRecibo > 0 ? montoLocal / montoRecibo : 0;

  const suEnergia = d ? restaDeElla * d.precioBase : 0;
  const suIgv = suEnergia * 0.18;
  const suTotal = suEnergia + suIgv;

  const nuestro = d
    ? {
        energia: d.energia * parte,
        alumbrado: d.alumbrado * parte,
        fijos: (d.cargoFijo + d.mantenimiento + d.interes) * parte,
        igv: d.igv * parte,
        electrificacion: d.electrificacion * parte,
        ajustes: d.ajustes * parte,
      }
    : null;

  /* Todo anclado en los kWh que ella conto, para que la resta cierre exacta:
     leFaltaba - amortiguado = montoLocal - suTotal */
  const suTotalCompleto = restaDeElla * tarifaReal;
  const leFaltaba = suTotalCompleto - suTotal;
  const amortiguado = suTotalCompleto - montoLocal;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Recibo explicado"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="recibo-imprimible bg-[#fbfaf7] w-full max-w-xl max-h-[94vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in"
      >
        {/* CABECERA */}
        <div className="flex-shrink-0 bg-neutral-900 px-5 sm:px-7 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-neutral-400">
              Su consumo de luz
            </p>
            <h3 className="text-[19px] sm:text-[21px] font-black text-white tracking-tight leading-tight mt-0.5">
              {nombreLocal} &middot; {datos?.etiqueta ?? mes}
            </h3>
            {datos && (
              <p className="text-[12.5px] text-neutral-300 mt-0.5">
                Se cobra en {datos.mesCobro}
              </p>
            )}
            <p className="font-mono text-[12px] text-neutral-400 mt-0.5">
              {datos?.periodo ?? ""}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="no-imprimir w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="recibo-scroll flex-1 overflow-y-auto">
          {/* Sin lecturas cargadas para este mes: dilo, no lo escondas */}
          {!datos && (
            <div className="mx-5 sm:mx-7 mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
              <p className="text-[14px] leading-relaxed text-neutral-700">
                Faltan las lecturas del medidor de{" "}
                <span className="font-mono font-semibold">{clave}</span> en{" "}
                <span className="font-semibold">SERIE_PANADERIA</span>. Se muestra
                solo el calculo del monto; para ver la comparacion con su medidor,
                agrega ese mes.
              </p>
            </div>
          )}

          {/* SU MEDIDOR */}
          {puedeReconciliar && (
            <section className="px-5 sm:px-7 pt-6 pb-6 border-b-2 border-dashed border-neutral-200">
              <Rotulo>Lo que marcó su medidor</Rotulo>

              <div className="flex items-start gap-3">
                <Lcd
                  valor={datos!.medidorRealAnterior!}
                  fecha={datos!.fechaAnterior}
                />
                <div className="pt-5 text-[20px] font-bold text-neutral-300">
                  &rarr;
                </div>
                <Lcd
                  valor={datos!.medidorRealActual!}
                  fecha={datos!.fechaActual}
                />
              </div>

              <div className="mt-5 bg-[#ffe94a] px-4 py-3 flex items-baseline justify-between gap-3">
                <span className="text-[15px] font-bold text-neutral-900">
                  Su resta da
                </span>
                <span className="font-mono text-[21px] font-black text-neutral-900 tabular-nums">
                  {restaDeElla.toFixed(2)} kWh
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                <Fila
                  concepto="Le cobramos"
                  valor={`${consumoLocal.toFixed(2)} kWh`}
                  fuerte
                />
                <div className="flex items-baseline gap-2 border-t border-neutral-300 pt-2.5">
                  <span className="text-[15px] font-bold text-[#c2392e]">
                    No le cobramos
                  </span>
                  <span className="flex-1 border-b border-dotted border-neutral-300 min-w-4" />
                  <span className="font-mono text-[17px] font-bold text-[#c2392e] tabular-nums whitespace-nowrap">
                    {noCobrado.toFixed(2)} kWh
                  </span>
                </div>
              </div>

              <p className="text-[14.5px] leading-relaxed text-neutral-600 mt-4">
                Su resta está bien. Esa diferencia queda guardada en su medidor y se
                la repartimos poco a poco, sin intereses.
              </p>
            </section>
          )}

          {/* LAS DOS CUENTAS */}
          {puedeReconciliar && nuestro && d && (
            <section className="px-5 sm:px-7 py-6 border-b-2 border-dashed border-neutral-200">
              <Rotulo>Su cuenta y la nuestra</Rotulo>

              <div className="rounded-lg border border-neutral-300 bg-white p-4">
                <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-neutral-500 mb-3">
                  Como la sacó usted
                </p>
                <div className="space-y-2">
                  <Fila
                    concepto={`${restaDeElla.toFixed(2)} kWh x S/ ${d.precioBase.toFixed(4)}`}
                    valor={`S/ ${suEnergia.toFixed(2)}`}
                  />
                  <Fila concepto="IGV 18%" valor={`S/ ${suIgv.toFixed(2)}`} />
                  <div className="border-t border-neutral-300 pt-2">
                    <Fila
                      concepto="Le salió"
                      valor={`S/ ${suTotal.toFixed(2)}`}
                      fuerte
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border-2 border-neutral-900 bg-white p-4 mt-3">
                <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-neutral-900 mb-1">
                  Como la sacamos nosotros
                </p>
                <p className="text-[13px] text-neutral-500 mb-3">
                  Su parte del recibo: {(parte * 100).toFixed(1)}%
                </p>
                <div className="space-y-2">
                  <Fila concepto="Energía" valor={`S/ ${nuestro.energia.toFixed(2)}`} />
                  <Fila concepto="Alumbrado público" valor={`S/ ${nuestro.alumbrado.toFixed(2)}`} />
                  <Fila concepto="Cargo fijo, mant. e interés" valor={`S/ ${nuestro.fijos.toFixed(2)}`} />
                  <Fila concepto="IGV" valor={`S/ ${nuestro.igv.toFixed(2)}`} />
                  <Fila concepto="Electrificación rural" valor={`S/ ${nuestro.electrificacion.toFixed(2)}`} />
                  {Math.abs(nuestro.ajustes) >= 0.005 && (
                    <Fila concepto="Ajustes del recibo" valor={`S/ ${nuestro.ajustes.toFixed(2)}`} />
                  )}
                  <div className="border-t border-neutral-300 pt-2">
                    <Fila
                      concepto="Le cobramos"
                      valor={`S/ ${montoLocal.toFixed(2)}`}
                      fuerte
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-[#ffe94a] px-4 py-3 flex items-baseline justify-between gap-3">
                <span className="text-[15px] font-bold text-neutral-900">
                  Diferencia
                </span>
                <span className="font-mono text-[19px] font-black text-neutral-900 tabular-nums">
                  S/ {Math.abs(montoLocal - suTotal).toFixed(2)}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <Fila
                  concepto="Cargos que su cuenta no sumó"
                  valor={`+ S/ ${leFaltaba.toFixed(2)}`}
                />
                <Fila
                  concepto={`kWh que no le cobramos (${noCobrado.toFixed(2)} kWh)`}
                  valor={`- S/ ${amortiguado.toFixed(2)}`}
                />
                <div className="border-t border-neutral-300 pt-2">
                  <Fila
                    concepto="Diferencia"
                    valor={`S/ ${(leFaltaba - amortiguado).toFixed(2)}`}
                    fuerte
                  />
                </div>
              </div>

              <p className="text-[14.5px] leading-relaxed text-neutral-600 mt-4">
                Su cuenta suma energía e IGV. Luz del Sur además cobra alumbrado
                público, cargo fijo, mantenimiento, interés y electrificación rural.
                A cambio, nosotros no le cobramos todos los kWh que marcó su
                medidor. Lo uno casi compensa lo otro.
              </p>
            </section>
          )}

          {/* DESGLOSE DEL RECIBO CUANDO LAS LECTURAS SE INGRESAN MANUALMENTE */}
          {!puedeReconciliar && nuestro && d && (
            <section className="px-5 sm:px-7 py-6 border-b-2 border-dashed border-neutral-200">
              <Rotulo>Qué incluye su cuota</Rotulo>

              <p className="text-[14.5px] leading-relaxed text-neutral-600 mb-4">
                Panadería consumió {consumoLocal.toFixed(2)} kWh y representa el{" "}
                <span className="font-bold text-neutral-900">
                  {(parte * 100).toFixed(1)}%
                </span>{" "}
                del recibo. Ese mismo porcentaje se aplica a todos los conceptos
                cobrados por Luz del Sur.
              </p>

              <div className="rounded-lg border-2 border-neutral-900 bg-white p-4">
                <div className="space-y-2">
                  <Fila
                    concepto={`Energía (recibo S/ ${d.energia.toFixed(2)})`}
                    valor={`S/ ${nuestro.energia.toFixed(2)}`}
                  />
                  <Fila
                    concepto={`Alumbrado público (S/ ${d.alumbrado.toFixed(2)})`}
                    valor={`S/ ${nuestro.alumbrado.toFixed(2)}`}
                  />
                  <Fila
                    concepto={`Cargo fijo, mant. e interés (S/ ${(d.cargoFijo + d.mantenimiento + d.interes).toFixed(2)})`}
                    valor={`S/ ${nuestro.fijos.toFixed(2)}`}
                  />
                  <Fila
                    concepto={`IGV (recibo S/ ${d.igv.toFixed(2)})`}
                    valor={`S/ ${nuestro.igv.toFixed(2)}`}
                  />
                  <Fila
                    concepto={`Electrificación rural (S/ ${d.electrificacion.toFixed(2)})`}
                    valor={`S/ ${nuestro.electrificacion.toFixed(2)}`}
                  />
                  {Math.abs(d.ajustes) >= 0.005 && (
                    <Fila
                      concepto={`Redondeos (recibo S/ ${d.ajustes.toFixed(2)})`}
                      valor={`S/ ${nuestro.ajustes.toFixed(2)}`}
                    />
                  )}
                  <div className="border-t border-neutral-300 pt-2">
                    <Fila
                      concepto="Total Panadería"
                      valor={`S/ ${montoLocal.toFixed(2)}`}
                      fuerte
                    />
                  </div>
                </div>
              </div>

              {d.foseIncluido != null && (
                <p className="mt-4 rounded-lg bg-amber-50 px-3.5 py-3 text-[13.5px] leading-relaxed text-amber-950">
                  El recibo informa un recargo FOSE de S/ {d.foseIncluido.toFixed(2)}.
                  Ya está incorporado en la tarifa de energía, por eso se muestra
                  como referencia y no se suma una segunda vez.
                </p>
              )}
            </section>
          )}

          {/* SU MONTO */}
          <section className="px-5 sm:px-7 py-6 border-b-2 border-dashed border-neutral-200">
            <Rotulo>Su monto de este mes</Rotulo>

            <div className="bg-[#ffe94a] px-4 py-4">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-[16px] sm:text-[17px] font-bold text-neutral-900 tabular-nums">
                <span>{consumoLocal.toFixed(2)} kWh</span>
                <span className="text-neutral-500">x</span>
                <span>S/ {tarifaReal.toFixed(4)}</span>
                <span className="text-neutral-500">=</span>
                <span className="text-[23px] font-black">
                  S/ {montoLocal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-neutral-400">
                De dónde sale el precio por kWh
              </p>
              <Fila
                concepto="Recibo completo de Luz del Sur"
                valor={`S/ ${montoRecibo.toFixed(2)}`}
              />
              <Fila
                concepto="Entre los kWh de toda la propiedad"
                valor={`${consumoTotalPropiedad.toFixed(2)} kWh`}
              />
              <Fila
                concepto="Precio real por kWh"
                valor={`S/ ${tarifaReal.toFixed(4)}`}
                fuerte
              />
            </div>

            <p className="text-[14px] leading-relaxed text-neutral-600 mt-4">
              No es solo el precio base impreso en el recibo. El precio real incluye
              energía, IGV, alumbrado público, cargo fijo, mantenimiento, interés,
              electrificación rural y ajustes. Se aplica por igual a todos los locales.
            </p>
          </section>

          {/* SALDO */}
          {saldo > 0 && (
            <section className="px-5 sm:px-7 py-6 border-b-2 border-dashed border-neutral-200">
              <Rotulo>Guardado en su medidor</Rotulo>

              <div className="space-y-2.5">
                <Fila
                  concepto="Su medidor marca"
                  valor={datos!.medidorRealActual!.toFixed(2)}
                />
                <Fila
                  concepto="El sistema le cobró hasta"
                  valor={datos!.medidorAppActual!.toFixed(2)}
                />
              </div>

              <div className="mt-4 border-2 border-neutral-900 px-4 py-3 flex items-baseline justify-between gap-3">
                <span className="text-[14px] font-bold uppercase tracking-wider text-neutral-900">
                  A su favor
                </span>
                <span className="font-mono text-[21px] font-black text-neutral-900 tabular-nums">
                  {saldo.toFixed(2)} kWh
                </span>
              </div>

              <p className="text-[14.5px] leading-relaxed text-neutral-600 mt-3">
                Son unos{" "}
                <span className="font-bold text-neutral-900">
                  S/ {saldoSoles.toFixed(2)}
                </span>{" "}
                de luz que su panadería ya usó y que todavía no se le ha cobrado.
                Puede comprobarlo en el medidor cuando quiera.
              </p>
            </section>
          )}

          {/* COMPARACION */}
          {anterior && kwhAnterior > 0 && (
            <section className="px-5 sm:px-7 py-6 border-b-2 border-dashed border-neutral-200">
              <Rotulo>Comparado con {anterior.etiqueta}</Rotulo>
              <div className="space-y-2.5">
                <Fila
                  concepto={anterior.etiqueta}
                  valor={`${kwhAnterior.toFixed(2)} kWh`}
                />
                <Fila
                  concepto={datos?.etiqueta ?? "Este mes"}
                  valor={`${consumoLocal.toFixed(2)} kWh`}
                  fuerte
                />
              </div>
              <p className="text-[14px] leading-relaxed text-neutral-600 mt-3">
                El precio del kWh también cambia cada mes. Lo fija Osinergmin, no
                nosotros, así que a veces la cuota sube aunque usted gaste lo mismo.
              </p>
            </section>
          )}

          {/* PIE */}
          <section className="px-5 sm:px-7 py-5">
            <p className="text-[12.5px] leading-relaxed text-neutral-500">
              Calculado con el recibo de Luz del Sur del suministro N&deg;{" "}
              <span className="font-mono font-semibold text-neutral-700">
                {SUMINISTRO}
              </span>
              . Se lo entregamos nosotros para explicarle su parte; el recibo
              oficial se lo mostramos cuando lo pida.
            </p>
          </section>
        </div>

        {/* ACCIONES */}
        <div className="no-imprimir flex-shrink-0 px-5 sm:px-7 py-4 bg-white border-t border-neutral-200 flex gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-[15px] font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir o guardar PDF
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-neutral-900 hover:bg-black text-white text-[15px] font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

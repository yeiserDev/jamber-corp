"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Printer } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   Serie verificada contra los recibos físicos de Luz del Sur
   (suministro 1674130) y las fotos del medidor de la panadería.

   medidorApp*  = lecturas registradas en el sistema
   medidorReal* = lo que marcaba el medidor físico ese día

   Sólo hay lectura física en la fecha exacta de corte desde mayo
   2026; antes las fotos se tomaban a fin de mes. Por eso marzo y
   abril no tienen medidorReal y el bloque de reconciliación se
   oculta en esos meses.
   ───────────────────────────────────────────────────────────── */

export interface MesPanaderia {
  /** Clave igual a Gasto.mes, formato "2026-07" */
  mes: string;
  etiqueta: string;
  periodo: string;
  fechaAnterior: string;
  fechaActual: string;
  medidorAppAnterior: number;
  medidorAppActual: number;
  medidorRealAnterior?: number;
  medidorRealActual?: number;
}

export const SERIE_PANADERIA: MesPanaderia[] = [
  {
    mes: "2026-03",
    etiqueta: "Marzo 2026",
    periodo: "16 feb → 18 mar 2026",
    fechaAnterior: "16 de febrero",
    fechaActual: "18 de marzo",
    medidorAppAnterior: 10788.85,
    medidorAppActual: 11036.05,
  },
  {
    mes: "2026-04",
    etiqueta: "Abril 2026",
    periodo: "18 mar → 16 abr 2026",
    fechaAnterior: "18 de marzo",
    fechaActual: "16 de abril",
    medidorAppAnterior: 11036.05,
    medidorAppActual: 11496.35,
  },
  {
    mes: "2026-05",
    etiqueta: "Mayo 2026",
    periodo: "16 abr → 15 may 2026",
    fechaAnterior: "16 de abril",
    fechaActual: "15 de mayo",
    medidorAppAnterior: 11496.35,
    medidorAppActual: 11950.83,
    medidorRealActual: 12184.96,
  },
  {
    mes: "2026-06",
    etiqueta: "Junio 2026",
    periodo: "15 may → 15 jun 2026",
    fechaAnterior: "15 de mayo",
    fechaActual: "15 de junio",
    medidorAppAnterior: 11950.83,
    medidorAppActual: 12418.83,
    medidorRealAnterior: 12184.96,
    medidorRealActual: 12695.95,
  },
  {
    mes: "2026-07",
    etiqueta: "Julio 2026",
    periodo: "15 jun → 16 jul 2026",
    fechaAnterior: "15 de junio",
    fechaActual: "16 de julio",
    medidorAppAnterior: 12418.83,
    medidorAppActual: 12903.83,
    medidorRealAnterior: 12695.95,
    medidorRealActual: 13213.64,
  },
];

export const SUMINISTRO = "1674130";

/* ── Pantalla del medidor ────────────────────────────────────── */
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

/* ── Fila con guías punteadas, como el desglose del recibo ───── */
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

/* ── Título de sección ───────────────────────────────────────── */
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
  /** Gasto.mes, formato "2026-07" */
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

  const idx = serie.findIndex(m => m.mes === mes);
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
    datos?.medidorRealActual != null
      ? datos.medidorRealActual - datos.medidorAppActual
      : 0;
  const saldoSoles = saldo * tarifaReal;

  const kwhAnterior = anterior
    ? anterior.medidorAppActual - anterior.medidorAppAnterior
    : 0;

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
        {/* ── CABECERA ── */}
        <div className="flex-shrink-0 bg-neutral-900 px-5 sm:px-7 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-neutral-400">
              Su consumo de luz
            </p>
            <h3 className="text-[19px] sm:text-[21px] font-black text-white tracking-tight leading-tight mt-0.5">
              {nombreLocal} · {datos?.etiqueta ?? mes}
            </h3>
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
          {/* ── SU MEDIDOR ── */}
          {puedeReconciliar && (
            <section className="px-5 sm:px-7 pt-6 pb-6 border-b-2 border-dashed border-neutral-200">
              <Rotulo>Lo que marcó su medidor</Rotulo>

              <div className="flex items-start gap-3">
                <Lcd
                  valor={datos!.medidorRealAnterior!}
                  fecha={datos!.fechaAnterior}
                />
                <div className="pt-5 text-[20px] font-bold text-neutral-300">→</div>
                <Lcd
                  valor={datos!.medidorRealActual!}
                  fecha={datos!.fechaActual}
                />
              </div>

              {/* Franja resaltada: su resta */}
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

          {/* ── SU MONTO ── */}
          <section className="px-5 sm:px-7 py-6 border-b-2 border-dashed border-neutral-200">
            <Rotulo>Su monto de este mes</Rotulo>

            <div className="bg-[#ffe94a] px-4 py-4">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-[16px] sm:text-[17px] font-bold text-neutral-900 tabular-nums">
                <span>{consumoLocal.toFixed(2)} kWh</span>
                <span className="text-neutral-500">×</span>
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
              No es el precio que sale impreso en el recibo: ese no incluye IGV,
              alumbrado público ni mantenimiento. Este precio es el mismo para todos
              los locales.
            </p>
          </section>

          {/* ── SALDO ── */}
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
                  valor={datos!.medidorAppActual.toFixed(2)}
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

          {/* ── COMPARACIÓN ── */}
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

          {/* ── PIE ── */}
          <section className="px-5 sm:px-7 py-5">
            <p className="text-[12.5px] leading-relaxed text-neutral-500">
              Calculado con el recibo de Luz del Sur del suministro N°{" "}
              <span className="font-mono font-semibold text-neutral-700">
                {SUMINISTRO}
              </span>
              . Se lo entregamos nosotros para explicarle su parte; el recibo
              oficial se lo mostramos cuando lo pida.
            </p>
          </section>
        </div>

        {/* ── ACCIONES ── */}
        <div className="no-imprimir flex-shrink-0 px-5 sm:px-7 py-4 bg-white border-t border-neutral-200 flex gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-[15px] font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir
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

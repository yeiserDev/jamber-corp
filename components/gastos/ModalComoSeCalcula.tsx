"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Zap,
  CalendarDays,
  ShieldCheck,
  ChevronDown,
  HeartHandshake,
  Gauge,
  Check,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   Datos históricos de la Panadería.
   Estos valores se actualizan a mano cada mes (o se pueden pasar
   por props desde la base de datos cuando estén modelados).
   ───────────────────────────────────────────────────────────── */

export interface LecturaMes {
  mes: string;
  corte: string;
  /** Lo que marcaba el medidor físico el día del corte */
  lecturaReal: number;
  /** Lo que se registró en el sistema para amortiguarle el pago */
  lecturaCobrada: number;
}

/**
 * Sólo meses con foto tomada EL MISMO DÍA del corte de Luz del Sur.
 * Abril queda fuera a propósito: la foto se tomó el 28 (12 días tarde),
 * así que ese saldo mezcla desfase de fechas con amortiguación real.
 */
export const HISTORIAL_PANADERIA: LecturaMes[] = [
  { mes: "Mayo 2026",  corte: "15 de mayo",  lecturaReal: 12184.96, lecturaCobrada: 11950.83 },
  { mes: "Junio 2026", corte: "15 de junio", lecturaReal: 12695.95, lecturaCobrada: 12418.83 },
  { mes: "Julio 2026", corte: "16 de julio", lecturaReal: 13213.64, lecturaCobrada: 12903.83 },
];

export const MEDIDOR_PANADERIA = {
  /** Primera lectura, al iniciar operaciones */
  lecturaInicial: 10788.85,
  fechaInicial: "16 de febrero de 2026",
  /** Última lectura física tomada */
  lecturaActual: 13213.64,
  fechaActual: "16 de julio de 2026",
  /** Hasta dónde se le ha facturado realmente */
  lecturaCobrada: 12903.83,
};

interface ModalComoSeCalculaProps {
  open: boolean;
  onClose: () => void;
  /** Nombre del local (ej. "Panadería") */
  nombreLocal: string;
  /** Mes del recibo mostrado en la tarjeta */
  mes?: string;
  /** Monto total del recibo de Luz del Sur para toda la propiedad */
  montoRecibo: number;
  /** kWh totales de toda la propiedad en ese recibo */
  consumoTotalPropiedad: number;
  /** Monto que se le cobra a este local este mes */
  montoLocal: number;
  /** kWh asignados a este local este mes */
  consumoLocal: number;
  historial?: LecturaMes[];
  medidor?: typeof MEDIDOR_PANADERIA;
}

/* ── Sección plegable ────────────────────────────────────────── */
function Seccion({
  icono,
  titulo,
  resumen,
  color,
  abierta,
  onToggle,
  children,
}: {
  icono: React.ReactNode;
  titulo: string;
  resumen: string;
  color: { bg: string; text: string; border: string };
  abierta: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white overflow-hidden transition-all ${
        abierta ? color.border : "border-gray-200"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={abierta}
        className="w-full flex items-center gap-3.5 p-4 text-left hover:bg-gray-50/80 transition-colors"
      >
        <div
          className={`w-11 h-11 rounded-[14px] ${color.bg} flex items-center justify-center flex-shrink-0`}
        >
          <span className={color.text}>{icono}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[16px] font-bold text-gray-900 tracking-tight leading-snug">
            {titulo}
          </h4>
          <p className="text-[13.5px] text-gray-500 mt-0.5 leading-snug">{resumen}</p>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
            abierta ? "rotate-180" : ""
          }`}
        />
      </button>

      {abierta && (
        <div className="px-4 pb-5 pt-1 animate-fade-in">
          <div className="border-t border-gray-100 pt-4 text-[15px] leading-relaxed text-gray-700 space-y-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ModalComoSeCalcula({
  open,
  onClose,
  nombreLocal,
  mes,
  montoRecibo,
  consumoTotalPropiedad,
  montoLocal,
  consumoLocal,
  historial = HISTORIAL_PANADERIA,
  medidor = MEDIDOR_PANADERIA,
}: ModalComoSeCalculaProps) {
  const [seccionAbierta, setSeccionAbierta] = useState<string | null>("tarifa");

  // Cerrar con Escape y bloquear el scroll del fondo mientras está abierto
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowPrevio;
    };
  }, [open, onClose]);

  // `open` sólo puede ser true tras una interacción del cliente, así que en SSR
  // siempre salimos antes de tocar document.body.
  if (!open) return null;

  const tarifaReal =
    consumoTotalPropiedad > 0 ? montoRecibo / consumoTotalPropiedad : 0;

  /* Argumento acumulado: sólo usa la primera y la última lectura física,
     así que no depende de ninguna estimación intermedia. */
  const consumidoFisico = medidor.lecturaActual - medidor.lecturaInicial;
  const consumidoCobrado = medidor.lecturaCobrada - medidor.lecturaInicial;
  const saldoKwh = consumidoFisico - consumidoCobrado;
  const saldoSoles = saldoKwh * tarifaReal;

  const toggle = (id: string) =>
    setSeccionAbierta(prev => (prev === id ? null : id));

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Cómo se calcula mi consumo"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#fafafa] w-full max-w-2xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-in"
      >
        {/* ── HEADER ── */}
        <div className="relative bg-gradient-to-br from-amber-500 to-orange-500 px-6 py-6 flex-shrink-0">
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-3.5 pr-12">
            <div className="w-12 h-12 rounded-[14px] bg-white/20 flex items-center justify-center flex-shrink-0">
              <HeartHandshake className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-[20px] sm:text-[22px] font-black text-white tracking-tight leading-tight">
                ¿Cómo se calcula mi consumo?
              </h3>
              <p className="text-[13.5px] text-white/85 font-medium mt-0.5">
                {nombreLocal}
                {mes ? ` · ${mes}` : ""} · Electricidad
              </p>
            </div>
          </div>
        </div>

        {/* ── CUERPO ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
          {/* Intro cordial */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-[15.5px] leading-relaxed text-gray-700">
              Aquí le explicamos, con toda transparencia, de dónde sale cada sol de
              su cuota. <span className="font-semibold text-gray-900">No ponemos
              números al azar:</span> todo sale del recibo oficial de Luz del Sur y
              de un cálculo pensado para que usted pague lo justo, sin sustos.
            </p>

            <div className="mt-4 flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <div>
                <p className="text-[11.5px] font-bold uppercase tracking-wider text-amber-700/80">
                  Su cuota de este mes
                </p>
                <p className="text-[13px] text-amber-800/70 mt-0.5">
                  {consumoLocal.toFixed(1)} kWh asignados
                </p>
              </div>
              <p className="text-[26px] font-black tracking-tighter text-amber-600 leading-none tabular-nums">
                S/ {montoLocal.toFixed(2)}
              </p>
            </div>
          </div>

          {/* ── 1. TARIFA REAL ── */}
          <Seccion
            icono={<Zap className="w-5.5 h-5.5" fill="currentColor" fillOpacity={0.2} />}
            titulo="Cuánto cuesta de verdad cada kWh"
            resumen={`La tarifa real es S/ ${tarifaReal.toFixed(4)} por kWh`}
            color={{
              bg: "bg-amber-50",
              text: "text-amber-500",
              border: "border-amber-300",
            }}
            abierta={seccionAbierta === "tarifa"}
            onToggle={() => toggle("tarifa")}
          >
            <p>
              El precio que aparece impreso en el recibo{" "}
              <span className="font-semibold text-gray-900">no es lo que cuesta
              realmente la luz</span>. A ese precio base se le suman el IGV, el
              alumbrado público, el mantenimiento y la reposición de la conexión.
            </p>
            <p>
              Por eso no dividimos por el precio de la etiqueta: tomamos{" "}
              <span className="font-semibold text-gray-900">el monto total que se
              paga</span> y lo dividimos entre{" "}
              <span className="font-semibold text-gray-900">todos los kWh que gastó
              la propiedad completa</span>. Así, el precio por kWh es exactamente el
              mismo para todos los locales.
            </p>

            {/* Fórmula visual */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
              <div className="flex items-stretch gap-2 text-center">
                <div className="flex-1 bg-white rounded-xl border border-gray-200 px-2 py-3">
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 leading-tight">
                    Recibo total
                  </p>
                  <p className="text-[17px] font-black text-gray-900 tabular-nums mt-1.5">
                    S/ {montoRecibo.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center text-[20px] font-black text-gray-300">
                  ÷
                </div>
                <div className="flex-1 bg-white rounded-xl border border-gray-200 px-2 py-3">
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 leading-tight">
                    kWh de todos
                  </p>
                  <p className="text-[17px] font-black text-gray-900 tabular-nums mt-1.5">
                    {consumoTotalPropiedad.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center text-[20px] font-black text-gray-300">
                  =
                </div>
                <div className="flex-1 bg-amber-500 rounded-xl px-2 py-3 shadow-[0_4px_14px_rgba(245,158,11,0.35)]">
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/80 leading-tight">
                    Tarifa real
                  </p>
                  <p className="text-[17px] font-black text-white tabular-nums mt-1.5">
                    {tarifaReal.toFixed(4)}
                  </p>
                </div>
              </div>
              <p className="text-[12.5px] text-gray-500 text-center mt-3">
                Precio por kWh, con IGV, alumbrado público y mantenimiento ya
                incluidos.
              </p>
            </div>
          </Seccion>

          {/* ── 2. CICLO DE FACTURACIÓN ── */}
          <Seccion
            icono={<CalendarDays className="w-5.5 h-5.5" />}
            titulo="Por qué las fechas no cuadran exactamente"
            resumen="Luz del Sur corta el 15 o 16; su medidor se lee a fin de mes"
            color={{
              bg: "bg-sky-50",
              text: "text-sky-500",
              border: "border-sky-300",
            }}
            abierta={seccionAbierta === "fechas"}
            onToggle={() => toggle("fechas")}
          >
            <p>
              Luz del Sur no cierra sus cuentas a fin de mes:{" "}
              <span className="font-semibold text-gray-900">toma la lectura los
              días 15 o 16</span> de cada mes. En cambio, la lectura de su medidor
              interno muchas veces se toma a fin de mes.
            </p>
            <p>
              Esas fechas distintas hacen que los números nunca calcen a la primera.
              Por eso el sistema hace un{" "}
              <span className="font-semibold text-gray-900">prorrateo</span>: reparte
              su consumo día por día y le cobra{" "}
              <span className="font-semibold text-gray-900">únicamente los 30 días
              que cubre el recibo oficial</span>, ni un día más.
            </p>

            {/* Línea de tiempo */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
              <div className="relative pt-2 pb-1">
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-sky-400 to-sky-500" />
                </div>
                <div className="flex justify-between mt-2.5 text-[12px] font-semibold text-gray-600">
                  <span>15/16 del mes anterior</span>
                  <span>15/16 de este mes</span>
                </div>
                <p className="text-[12.5px] text-sky-700 font-semibold text-center mt-2">
                  Este es el único tramo que se le cobra: 30 días exactos
                </p>
              </div>
            </div>

            <p className="text-[14px] text-gray-600">
              Si alguna vez la resta de su medidor no le da igual a la cuota, casi
              siempre es por esta diferencia de fechas. El consumo no se pierde ni se
              duplica: solo se acomoda al calendario del recibo.
            </p>
          </Seccion>

          {/* ── 3. AMORTIGUACIÓN ── */}
          <Seccion
            icono={<ShieldCheck className="w-5.5 h-5.5" />}
            titulo="Beneficio al inquilino: su cobro amortiguado"
            resumen={`Tiene ${saldoKwh.toFixed(0)} kWh consumidos que aún no le cobramos`}
            color={{
              bg: "bg-emerald-50",
              text: "text-emerald-500",
              border: "border-emerald-300",
            }}
            abierta={seccionAbierta === "amortiguacion"}
            onToggle={() => toggle("amortiguacion")}
          >
            <p>
              Cuando llegó su maquinaria nueva, su consumo subió muy fuerte de un mes
              a otro. Cobrarle ese pico completo, de golpe y recién empezando, nos
              pareció injusto. Así que desde entonces{" "}
              <span className="font-semibold text-gray-900">
                le registramos menos consumo del que realmente marca su medidor
              </span>{" "}
              y le repartimos la diferencia poco a poco.
            </p>

            {/* Comparación acumulada: lo verificable */}
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <Gauge className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <p className="text-[13px] font-bold uppercase tracking-wider text-emerald-700">
                  Desde que usted empezó
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[14.5px] text-gray-700">
                    Su medidor ha avanzado
                  </span>
                  <span className="text-[16px] font-black text-gray-900 tabular-nums whitespace-nowrap">
                    {consumidoFisico.toFixed(2)} kWh
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[14.5px] text-gray-700">
                    Le hemos cobrado
                  </span>
                  <span className="text-[16px] font-black text-gray-900 tabular-nums whitespace-nowrap">
                    {consumidoCobrado.toFixed(2)} kWh
                  </span>
                </div>
                <div className="border-t border-emerald-300 pt-2.5 flex items-baseline justify-between gap-3">
                  <span className="text-[14.5px] font-bold text-emerald-800">
                    Aún sin cobrarle
                  </span>
                  <span className="text-[20px] font-black text-emerald-600 tabular-nums whitespace-nowrap">
                    {saldoKwh.toFixed(2)} kWh
                  </span>
                </div>
              </div>

              <p className="text-[14px] leading-relaxed text-gray-700 mt-3.5">
                Eso son aproximadamente{" "}
                <span className="font-bold text-emerald-700">
                  S/ {saldoSoles.toFixed(2)}
                </span>{" "}
                de energía que su panadería ya usó, que nosotros ya le pagamos a Luz
                del Sur, y que a usted todavía no se le ha cobrado.
              </p>

              <p className="text-[13.5px] text-gray-600 mt-2.5">
                Puede comprobarlo usted misma: su medidor marca{" "}
                <span className="font-semibold tabular-nums">
                  {medidor.lecturaActual.toFixed(2)}
                </span>{" "}
                y el sistema sólo llegó a{" "}
                <span className="font-semibold tabular-nums">
                  {medidor.lecturaCobrada.toFixed(2)}
                </span>
                .
              </p>
            </div>

            {/* Historial mes a mes */}
            <div>
              <p className="text-[13px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
                Mes a mes, lo que guardamos para usted
              </p>
              <div className="space-y-2">
                {historial.map(item => {
                  const saldo = item.lecturaReal - item.lecturaCobrada;
                  return (
                    <div
                      key={item.mes}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14.5px] font-bold text-gray-900 leading-tight">
                          {item.mes}
                        </p>
                        <p className="text-[12.5px] text-gray-500 mt-0.5 leading-snug tabular-nums">
                          Medidor {item.lecturaReal.toFixed(2)} · cobrado{" "}
                          {item.lecturaCobrada.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[15px] font-black text-emerald-600 tabular-nums leading-none">
                          {saldo.toFixed(2)}
                        </p>
                        <p className="text-[11px] font-semibold text-gray-400 mt-1">
                          kWh guardados
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-[14px] leading-relaxed text-gray-600">
              Si le cobráramos todo ese saldo de una sola vez junto con su cuota de
              este mes, tendría que pagar{" "}
              <span className="font-semibold text-gray-900">
                S/ {(montoLocal + saldoSoles).toFixed(2)}
              </span>{" "}
              en un solo recibo. Preferimos evitarle ese golpe.
            </p>

            <p className="text-[14px] leading-relaxed text-gray-600">
              Ese saldo no se le perdona ni se le recarga: se va distribuyendo poco a
              poco en los meses siguientes,{" "}
              <span className="font-semibold text-emerald-700">
                sin cobrarle un solo céntimo de interés
              </span>
              .
            </p>
          </Seccion>

          {/* Cierre cordial */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
            <p className="text-[15px] leading-relaxed text-gray-700">
              Si algo no le queda claro o quiere revisar juntos su medidor,
              con mucho gusto se lo explicamos las veces que haga falta.
            </p>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 bg-white border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-[14px] bg-gray-900 hover:bg-black text-white text-[15px] font-semibold transition-colors"
          >
            Entendido, gracias
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

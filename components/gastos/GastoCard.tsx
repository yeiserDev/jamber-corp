"use client";

import { useState, useEffect } from "react";
import { Zap, Droplets, Pencil, Trash2, Download, FileText, BarChart, HelpCircle, Receipt } from "lucide-react";
import { Gasto, Local } from "@/types/gasto";
import { generarReporteImagen } from "@/utils/reportGenerator";
import ModalComoSeCalcula from "./ModalComoSeCalcula";
import ReciboDigital from "./ReciboDigital";

interface GastoCardProps {
  gasto: Gasto;
  todosGastos: Gasto[];
  locales: Local[];
  filtroLocal?: string;
  userRole: string | null;
  onEdit: (gasto: Gasto) => void;
  onDelete: (id: string) => void;
}

/* ── Color por local ─────────────────────────────────────── */
function colorLocal(nombre: string, tipo: string): string {
  const n = nombre.toLowerCase();
  const t = tipo.toLowerCase();
  if (t === "spa"      || n.includes("spa"))    return "#0071e3"; // blue
  if (t === "panaderia"|| n.includes("panad"))  return "#ff9500"; // orange
  if (t === "profesor" || n.includes("profe"))  return "#34c759"; // green
  if (t === "casa"     || n.includes("casa"))   return "#8e8e93"; // gray
  return "#bf5af2"; // purple
}

export default function GastoCard({
  gasto,
  todosGastos,
  locales,
  filtroLocal,
  userRole,
  onEdit,
  onDelete,
}: GastoCardProps) {
  const isLuz = gasto.tipo === "luz";
  const unit  = isLuz ? "kWh" : "m³";
  const costoPorUnidad = gasto.consumoTotal > 0 ? gasto.montoTotal / gasto.consumoTotal : 0;

  const localesACobrar = gasto.costosPorLocal.filter(c => {
    const local = typeof c.localId === "string"
      ? locales.find(l => l._id === c.localId)
      : c.localId;
    return local && local.tipo !== "casa";
  });


  // Calcular el total real a cobrar (suma de los locales que pagan, excluyendo "casa")
  let displayMontoTotal = localesACobrar.reduce((sum, c) => sum + c.monto, 0);
  let displayConsumoTotal = gasto.consumoTotal;
  let localesAmostrar = localesACobrar;

  if (filtroLocal && filtroLocal !== "Todos los locales") {
    const costoFiltered = gasto.costosPorLocal.find(c => {
      const id = typeof c.localId === 'string' ? c.localId : c.localId._id;
      return id === filtroLocal;
    });
    if (costoFiltered) {
      displayMontoTotal = costoFiltered.monto;
      displayConsumoTotal = costoFiltered.consumo;
      localesAmostrar = localesACobrar.filter(c => {
        const id = typeof c.localId === 'string' ? c.localId : c.localId._id;
        return id === filtroLocal;
      });
    }
  }

  /* ── Panadería: panel explicativo del prorrateo/amortiguación ── */
  const [modalCalculoAbierto, setModalCalculoAbierto] = useState(false);
  const [reciboAbierto, setReciboAbierto] = useState(false);

  const costoPanaderia = localesAmostrar.find(c => {
    const local = typeof c.localId === "string"
      ? locales.find(l => l._id === c.localId)
      : c.localId;
    return local?.tipo === "panaderia" || local?.nombre.toLowerCase().includes("panad");
  });
  const localPanaderia = costoPanaderia
    ? (typeof costoPanaderia.localId === "string"
        ? locales.find(l => l._id === costoPanaderia.localId)
        : costoPanaderia.localId)
    : undefined;
  const mostrarExplicacion = isLuz && !!costoPanaderia;

  const themeColor = isLuz ? "text-amber-500" : "text-sky-500";
  const themeBg    = isLuz ? "bg-amber-50" : "bg-sky-50";
  const themeBorder= isLuz ? "border-amber-200" : "border-sky-200";

  return (
    <div className={`h-full w-full bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}>
      
      {/* ── HEADER ── */}
      <div className="p-5 pb-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-[14px] ${themeBg} flex items-center justify-center`}>
              {isLuz ? <Zap className={`w-6 h-6 ${themeColor}`} fill="currentColor" fillOpacity={0.2} /> : <Droplets className={`w-6 h-6 ${themeColor}`} fill="currentColor" fillOpacity={0.2} />}
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-gray-900 tracking-tight">
                {isLuz ? "Electricidad" : "Agua"}
              </h3>
              <p className="text-[13px] font-medium text-gray-500 mt-0.5">
                {displayConsumoTotal.toFixed(1)} {unit} &nbsp;·&nbsp; S/ {costoPorUnidad.toFixed(4)}/{unit}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Total a cobrar</p>
            <p className={`text-[24px] font-black tracking-tighter leading-none ${themeColor}`}>
              S/ {displayMontoTotal.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* ── DISTRIBUCIÓN POR LOCAL ── */}
      <div className="px-5 sm:px-6 flex-1">
        <p className="text-[12px] font-medium text-gray-400 mb-3">Distribución por local</p>
        
        <div className="space-y-3 relative z-10">
          {localesAmostrar.length === 0 ? (
             <p className="text-[13px] text-gray-500">Sin locales asignados</p>
          ) : (
            localesAmostrar.map((costo, idx) => {
              const local = typeof costo.localId === "string"
                ? locales.find(l => l._id === costo.localId)
                : costo.localId;
              const nombre = local?.nombre || "Local";
              const tipo   = local?.tipo   || "";
              const hex    = colorLocal(nombre, tipo);
              const pct    = gasto.montoTotal > 0 ? (costo.monto / gasto.montoTotal) * 100 : 0;

              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2 text-[13px]">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: hex }} />
                      <span className="font-semibold text-gray-800">{nombre}</span>
                      <span className="text-gray-400 text-[12px] ml-1">{costo.consumo.toFixed(1)} {unit}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-medium text-[12px]">{pct.toFixed(1)}%</span>
                      <span 
                        className="font-bold text-[13px] px-2.5 py-1 rounded-lg tabular-nums shadow-[0_2px_8px_rgba(0,0,0,0.04)] border" 
                        style={{ backgroundColor: `${hex}0A`, color: hex, borderColor: `${hex}30` }}
                      >
                        S/ {costo.monto.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: hex }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── ILUSTRACIÓN DECORATIVA ── */}
      <div className="relative h-16 sm:h-20 mt-1 overflow-hidden pointer-events-none opacity-80">
        {isLuz ? (
          <svg viewBox="0 0 600 120" className="absolute bottom-0 w-full h-full text-amber-100" preserveAspectRatio="xMidYMax slice">
             {/* Nubes */}
             <path d="M460,40 Q460,32 468,32 Q473,26 482,32 Q495,32 495,43 L460,43 Z" fill="#f1f5f9" />
             <path d="M160,50 Q160,45 165,45 Q170,40 176,45 Q185,45 185,52 L160,52 Z" fill="#f1f5f9" />
             
             {/* Sol */}
             <circle cx="420" cy="50" r="16" fill="#fcd34d" />
             
             {/* Suelo */}
             <rect x="0" y="105" width="600" height="15" fill="#f8fafc" />
             <rect x="0" y="105" width="600" height="2" fill="#f1f5f9" />

             {/* Torre 1 (Grande) */}
             <g stroke="#cbd5e1" strokeWidth="1.5" fill="none" transform="translate(60, 0)">
               <path d="M50,105 L65,35 L80,105" />
               <path d="M40,55 L90,55" />
               <path d="M45,75 L85,75" />
               <path d="M56,80 L72,105 M74,80 L58,105" />
               <path d="M60,55 L70,75 M70,55 L60,75" />
               <path d="M62,35 L68,55 M68,35 L62,55" />
               <line x1="65" y1="20" x2="65" y2="35" />
               <line x1="55" y1="35" x2="75" y2="35" />
             </g>

             {/* Torre 2 (Pequeña, más atrás) */}
             <g stroke="#e2e8f0" strokeWidth="1" fill="none" transform="translate(120, 25) scale(0.7)">
               <path d="M50,115 L65,45 L80,115" />
               <path d="M40,65 L90,65" />
               <path d="M45,85 L85,85" />
               <path d="M56,90 L72,115 M74,90 L58,115" />
               <path d="M60,65 L70,85 M70,65 L60,85" />
               <path d="M62,45 L68,65 M68,45 L62,65" />
               <line x1="65" y1="30" x2="65" y2="45" />
               <line x1="55" y1="45" x2="75" y2="45" />
             </g>
             
             {/* Árboles detrás de paneles */}
             <circle cx="235" cy="95" r="10" fill="#a7f3d0" />
             <circle cx="250" cy="100" r="7" fill="#86efac" />

             {/* Panel Solar 1 */}
             <g transform="translate(225, 65)">
               <rect x="18" y="30" width="3" height="15" fill="#94a3b8" />
               <polygon points="0,30 25,30 35,0 10,0" fill="#3b82f6" />
               <line x1="6" y1="10" x2="31" y2="10" stroke="#bfdbfe" strokeWidth="0.5" />
               <line x1="12" y1="20" x2="37" y2="20" stroke="#bfdbfe" strokeWidth="0.5" />
               <line x1="18" y1="0" x2="8" y2="30" stroke="#bfdbfe" strokeWidth="0.5" />
               <line x1="26" y1="0" x2="16" y2="30" stroke="#bfdbfe" strokeWidth="0.5" />
             </g>

             {/* Panel Solar 2 */}
             <g transform="translate(265, 70) scale(0.85)">
               <rect x="18" y="30" width="3" height="15" fill="#94a3b8" />
               <polygon points="0,30 25,30 35,0 10,0" fill="#3b82f6" />
               <line x1="6" y1="10" x2="31" y2="10" stroke="#bfdbfe" strokeWidth="0.5" />
               <line x1="12" y1="20" x2="37" y2="20" stroke="#bfdbfe" strokeWidth="0.5" />
               <line x1="18" y1="0" x2="8" y2="30" stroke="#bfdbfe" strokeWidth="0.5" />
               <line x1="26" y1="0" x2="16" y2="30" stroke="#bfdbfe" strokeWidth="0.5" />
             </g>

             {/* Árboles Izquierda (cerca de la torre) */}
             <circle cx="105" cy="100" r="8" fill="#4ade80" />
             <circle cx="95" cy="98" r="12" fill="#86efac" />

             {/* Edificio Moderno */}
             <g transform="translate(370, 75)">
               <circle cx="-15" cy="25" r="8" fill="#6ee7b7" />
               <circle cx="-5" cy="20" r="12" fill="#34d399" />
               
               <rect x="0" y="0" width="70" height="30" fill="#e2e8f0" />
               <polygon points="70,0 85,5 85,30 70,30" fill="#cbd5e1" />
               
               <rect x="0" y="0" width="70" height="6" fill="#3b82f6" />
               <polygon points="70,0 85,5 85,11 70,6" fill="#2563eb" />
               
               <rect x="5" y="12" width="12" height="10" fill="#93c5fd" />
               <rect x="22" y="12" width="25" height="10" fill="#60a5fa" />
               <rect x="52" y="12" width="12" height="10" fill="#93c5fd" />
             </g>

             {/* Árboles Derecha */}
             <circle cx="480" cy="100" r="10" fill="#10b981" />
             <path d="M510,70 L500,105 L520,105 Z" fill="#059669" />
          </svg>
        ) : (
          <svg viewBox="0 0 600 120" className="absolute bottom-0 w-full h-full" preserveAspectRatio="xMidYMax slice">
             {/* Ondas / Montañas */}
             <path d="M0,80 C60,80 90,60 150,60 C210,60 240,85 300,85 C360,85 390,70 450,70 C510,70 540,90 600,90 L600,120 L0,120 Z" fill="#e0f2fe" />
             <path d="M0,95 C75,95 105,75 180,75 C255,75 285,95 360,95 C435,95 465,80 540,80 C570,80 585,90 600,90 L600,120 L0,120 Z" fill="#bae6fd" opacity="0.6" />
             <path d="M0,105 C90,105 120,90 210,90 C300,90 330,105 420,105 C510,105 540,95 600,95 L600,120 L0,120 Z" fill="#7dd3fc" opacity="0.4" />
             
             {/* Gota de agua en el centro */}
             <g transform="translate(282, 32)">
               <path d="M18,0 C18,0 0,26 0,39 C0,48.9 8.1,57 18,57 C27.9,57 36,48.9 36,39 C36,26 18,0 18,0 Z" fill="#3b82f6" />
               <path d="M28,38 C28,45 22,51 15,52 C21,52 26,46 26,38 C26,27 19,13 19,13 C19,13 28,26 28,38 Z" fill="#93c5fd" opacity="0.8"/>
             </g>
          </svg>
        )}
      </div>

      {/* ── FOOTER: RESUMEN Y BOTONES ── */}
      <div className="px-5 pt-3 pb-4 bg-white border-t border-gray-50 relative z-10">
        <div className="flex items-center justify-between mb-3">
           <div>
             <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Total consumido</p>
             <p className="text-[15px] font-bold text-gray-900 mt-0.5">{gasto.consumoTotal.toFixed(1)} {unit}</p>
           </div>
           <div>
             <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Costo promedio</p>
             <p className="text-[15px] font-bold text-gray-900 mt-0.5">S/ {costoPorUnidad.toFixed(4)}/{unit}</p>
           </div>
        </div>

        {mostrarExplicacion && (
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <button
              onClick={e => { e.stopPropagation(); setReciboAbierto(true); }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-[12px] transition-all shadow-[0_2px_10px_rgba(245,158,11,0.3)]"
            >
              <Receipt className="w-4 h-4" />
              Ver recibo explicado
            </button>
            <button
              onClick={e => { e.stopPropagation(); setModalCalculoAbierto(true); }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 rounded-[12px] transition-all"
            >
              <HelpCircle className="w-4 h-4" />
              ¿Cómo se calcula?
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); generarReporteImagen(gasto, todosGastos, locales, filtroLocal); }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-[12px] transition-all`}
          >
            <Download className="w-4 h-4" />
            Reporte
          </button>

          {userRole === "admin" && (
            <>
              <button
                onClick={e => { e.stopPropagation(); onEdit(gasto); }}
                title="Editar"
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-[12px] transition-all`}
              >
                <Pencil className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(gasto._id); }}
                title="Eliminar"
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold text-red-600 bg-red-50 border border-red-100 hover:border-red-200 hover:bg-red-100 rounded-[12px] transition-all`}
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </>
          )}
        </div>
      </div>

      {mostrarExplicacion && costoPanaderia && (
        <ModalComoSeCalcula
          open={modalCalculoAbierto}
          onClose={() => setModalCalculoAbierto(false)}
          nombreLocal={localPanaderia?.nombre || "Panadería"}
          mes={gasto.mes}
          montoRecibo={gasto.montoTotal}
          consumoTotalPropiedad={gasto.consumoTotal}
          montoLocal={costoPanaderia.monto}
          consumoLocal={costoPanaderia.consumo}
        />
      )}

      {mostrarExplicacion && costoPanaderia && (
        <ReciboDigital
          open={reciboAbierto}
          onClose={() => setReciboAbierto(false)}
          nombreLocal={localPanaderia?.nombre || "Panadería"}
          mes={gasto.mes}
          montoRecibo={gasto.montoTotal}
          consumoTotalPropiedad={gasto.consumoTotal}
          montoLocal={costoPanaderia.monto}
          consumoLocal={costoPanaderia.consumo}
        />
      )}
    </div>
  );
}

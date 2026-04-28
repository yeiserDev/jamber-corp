"use client";

import { Zap, Droplets, Pencil, Trash2, Download, FileText } from "lucide-react";
import { Gasto, Local } from "@/types/gasto";
import { generarReporteImagen } from "@/utils/reportGenerator";
import { generarReporteProfesor } from "@/utils/reporteProfesor";

interface GastoCardProps {
  gasto: Gasto;
  todosGastos: Gasto[];
  locales: Local[];
  onEdit: (gasto: Gasto) => void;
  onDelete: (id: string) => void;
}

/* ── Color por local ─────────────────────────────────────── */
function colorLocal(nombre: string, tipo: string): { hex: string; light: string } {
  const n = nombre.toLowerCase();
  const t = tipo.toLowerCase();
  if (t === "spa"      || n.includes("spa"))    return { hex: "#0071e3", light: "bg-blue-50"   };
  if (t === "panaderia"|| n.includes("panad"))  return { hex: "#ff9500", light: "bg-amber-50"  };
  if (t === "profesor" || n.includes("profe"))  return { hex: "#34c759", light: "bg-green-50"  };
  if (t === "casa"     || n.includes("casa"))   return { hex: "#6e6e73", light: "bg-gray-100"  };
  return { hex: "#bf5af2", light: "bg-purple-50" };
}

export default function GastoCard({
  gasto,
  todosGastos,
  locales,
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

  const tieneProfesor = gasto.costosPorLocal.some(c => {
    const local = typeof c.localId === "string"
      ? locales.find(l => l._id === c.localId)
      : c.localId;
    return local && (local.tipo === "profesor" || local.nombre?.toLowerCase().includes("academia"));
  });

  /* ── Shared text helpers ─────────────────────────────── */
  const tp = "text-[#1d1d1f]";
  const ts = "text-[#6e6e73]";

  return (
    <div className="w-full sm:w-auto bg-white/80 backdrop-blur-lg rounded-[18px] border border-black/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all overflow-hidden flex flex-col">

      {/* ── Encabezado ─────────────────────────────────── */}
      <div className="p-5 pb-4">
        <div className="flex flex-col sm:flex-row items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-[12px] ${isLuz ? "bg-amber-50" : "bg-sky-50"}`}>
              {isLuz
                ? <Zap      className="w-[18px] h-[18px] text-amber-500" />
                : <Droplets className="w-[18px] h-[18px] text-sky-500"   />
              }
            </div>
            <div>
              <p className={`text-[15px] font-semibold ${tp} tracking-tight`}>
                {isLuz ? "Electricidad" : "Agua"}
              </p>
              <p className={`text-[11px] ${ts} mt-0.5`}>
                {gasto.consumoTotal.toFixed(1)} {unit}
                &nbsp;·&nbsp;
                S/ {costoPorUnidad.toFixed(4)}/{unit}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className={`text-[22px] font-bold ${tp} tracking-tight leading-none`}>
              S/ {gasto.montoTotal.toFixed(2)}
            </p>
            <p className={`text-[11px] ${ts} mt-1`}>{localesACobrar.length} locales</p>
          </div>
        </div>
      </div>

      {/* ── Distribución — siempre visible ─────────────── */}
      <div className="px-5 pb-5 space-y-3 flex-1">
        <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider">
          Distribución por local
        </p>
        {localesACobrar.length === 0 ? (
          <p className={`text-[12px] ${ts}`}>Sin locales asignados</p>
        ) : (
          localesACobrar.map((costo, idx) => {
            const local = typeof costo.localId === "string"
              ? locales.find(l => l._id === costo.localId)
              : costo.localId;
            const nombre = local?.nombre || "Local";
            const tipo   = local?.tipo   || "";
            const c      = colorLocal(nombre, tipo);
            const pct    = gasto.montoTotal > 0 ? (costo.monto / gasto.montoTotal) * 100 : 0;

            return (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.hex }} />
                    <span className={`text-[13px] font-medium ${tp}`}>{nombre}</span>
                    <span className={`text-[11px] ${ts}`}>{costo.consumo.toFixed(1)} {unit}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] ${ts}`}>{pct.toFixed(0)}%</span>
                    <span className={`text-[13px] font-bold ${tp} tabular-nums w-20 text-right`}>
                      S/ {costo.monto.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-[#f5f5f7] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bar-grow"
                    style={{ width: `${pct}%`, backgroundColor: c.hex }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Acciones ───────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-black/[0.04] flex items-center gap-1.5">
        <button
          onClick={e => { e.stopPropagation(); generarReporteImagen(gasto, todosGastos, locales); }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold ${ts} hover:text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e5e5ea] rounded-[8px] transition-all`}
        >
          <Download className="w-3 h-3" />
          Reporte
        </button>

        {tieneProfesor && (
          <button
            onClick={e => { e.stopPropagation(); generarReporteProfesor(gasto, todosGastos, locales); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-[#0071e3] bg-blue-50 hover:bg-blue-100 rounded-[8px] transition-all"
          >
            <FileText className="w-3 h-3" />
            Profesor
          </button>
        )}

        <div className="flex-1" />

        <button
          onClick={e => { e.stopPropagation(); onEdit(gasto); }}
          title="Editar"
          className={`p-1.5 ${ts} hover:text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-[8px] transition-all`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(gasto._id); }}
          title="Eliminar"
          className={`p-1.5 ${ts} hover:text-red-500 hover:bg-red-50 rounded-[8px] transition-all`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

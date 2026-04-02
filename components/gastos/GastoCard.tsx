"use client";

import { useState } from "react";
import { Zap, Droplets, Pencil, Trash2, ChevronDown, Download, FileText } from "lucide-react";
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

export default function GastoCard({
  gasto,
  todosGastos,
  locales,
  onEdit,
  onDelete,
}: GastoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const costoPorUnidad =
    gasto.consumoTotal > 0 ? gasto.montoTotal / gasto.consumoTotal : 0;
  const unit = gasto.tipo === "luz" ? "kWh" : "m³";
  const isLuz = gasto.tipo === "luz";

  const localesACobrar = gasto.costosPorLocal.filter((c) => {
    const local =
      typeof c.localId === "string"
        ? locales.find((l) => l._id === c.localId)
        : c.localId;
    return local && local.tipo !== "casa";
  });

  const tieneProfesor = gasto.costosPorLocal.some((c) => {
    const local =
      typeof c.localId === "string"
        ? locales.find((l) => l._id === c.localId)
        : c.localId;
    return (
      local &&
      (local.tipo === "profesor" ||
        local.nombre?.toLowerCase().includes("academia"))
    );
  });

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden
        ${isLuz ? "border-l-4 border-l-amber-400" : "border-l-4 border-l-sky-400"}
        ${
          isExpanded
            ? "border-gray-200 shadow-lg shadow-gray-100/80"
            : "border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md hover:shadow-gray-100/60"
        }
      `}
    >
      {/* ── Main Row ───────────────────────────────────── */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Icono de servicio */}
        <div
          className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${
            isLuz
              ? "bg-gradient-to-br from-amber-50 to-amber-100 text-amber-500"
              : "bg-gradient-to-br from-sky-50 to-sky-100 text-sky-500"
          }`}
        >
          {isLuz ? <Zap className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
        </div>

        {/* Información principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-bold text-gray-900">
              {gasto.tipo === "luz" ? "Electricidad" : "Agua"}
            </p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                isLuz
                  ? "bg-amber-50 text-amber-600"
                  : "bg-sky-50 text-sky-600"
              }`}
            >
              {gasto.consumoTotal.toFixed(1)} {unit}
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            Tarifa:{" "}
            <span className="font-medium text-gray-500">
              S/ {costoPorUnidad.toFixed(4)}
            </span>{" "}
            / {unit} &nbsp;·&nbsp; {localesACobrar.length} locales
          </p>
        </div>

        {/* Monto */}
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-[#0A2640]">
            S/ {gasto.montoTotal.toFixed(2)}
          </p>
        </div>

        {/* Flecha */}
        <ChevronDown
          className={`w-4 h-4 text-gray-300 shrink-0 transition-transform duration-300 ${
            isExpanded ? "rotate-180 text-gray-400" : "group-hover:text-gray-400"
          }`}
        />
      </div>

      {/* ── Panel expandido ─────────────────────────────── */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="px-5 pb-5">
          <div className="h-px bg-gray-100 mb-4" />

          {/* Stats rápidas */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">
                Consumo
              </p>
              <p className="text-sm font-bold text-gray-800">
                {gasto.consumoTotal.toFixed(2)}
              </p>
              <p className="text-[10px] text-gray-400">{unit}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">
                Tarifa
              </p>
              <p className="text-sm font-bold text-gray-800">
                S/ {costoPorUnidad.toFixed(4)}
              </p>
              <p className="text-[10px] text-gray-400">por {unit}</p>
            </div>
            <div
              className={`rounded-xl p-3 text-center border ${
                isLuz
                  ? "bg-amber-50 border-amber-100"
                  : "bg-sky-50 border-sky-100"
              }`}
            >
              <p
                className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${
                  isLuz ? "text-amber-500" : "text-sky-500"
                }`}
              >
                Total
              </p>
              <p
                className={`text-sm font-bold ${
                  isLuz ? "text-amber-700" : "text-sky-700"
                }`}
              >
                S/ {gasto.montoTotal.toFixed(2)}
              </p>
              <p
                className={`text-[10px] ${
                  isLuz ? "text-amber-400" : "text-sky-400"
                }`}
              >
                recibo
              </p>
            </div>
          </div>

          {/* Distribución por local con progress bars */}
          <div className="mb-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
              Distribución por local
            </p>
            <div className="space-y-3">
              {localesACobrar.map((costo, idx) => {
                const local =
                  typeof costo.localId === "string"
                    ? locales.find((l) => l._id === costo.localId)
                    : costo.localId;
                const nombre = local ? local.nombre : "Local";
                const pct =
                  gasto.montoTotal > 0
                    ? (costo.monto / gasto.montoTotal) * 100
                    : 0;

                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            isLuz ? "bg-amber-400" : "bg-sky-400"
                          }`}
                        />
                        <span className="text-sm text-gray-700 font-medium">
                          {nombre}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {costo.consumo.toFixed(1)} {unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400">
                          {pct.toFixed(0)}%
                        </span>
                        <span className="text-sm font-bold text-gray-900 tabular-nums min-w-[72px] text-right">
                          S/ {costo.monto.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bar-grow ${
                          isLuz
                            ? "bg-gradient-to-r from-amber-400 to-amber-300"
                            : "bg-gradient-to-r from-sky-400 to-sky-300"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                generarReporteImagen(gasto, todosGastos, locales);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100 hover:border-gray-200"
            >
              <Download className="w-3.5 h-3.5" />
              Reporte
            </button>

            {tieneProfesor && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  generarReporteProfesor(gasto, todosGastos, locales);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-100"
              >
                <FileText className="w-3.5 h-3.5" />
                Reporte Profesor
              </button>
            )}

            <div className="flex-1" />

            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(gasto);
              }}
              title="Editar"
              className="p-2 text-gray-400 hover:text-[#0A2640] hover:bg-gray-100 rounded-xl transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(gasto._id);
              }}
              title="Eliminar"
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

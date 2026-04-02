"use client";

import { useState } from "react";
import { Zap, Droplets, Pencil, Trash2, ChevronRight, Download, FileText, MoreHorizontal, Eye } from "lucide-react";
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

export default function GastoCard({ gasto, todosGastos, locales, onEdit, onDelete }: GastoCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const costoPorUnidad = gasto.consumoTotal > 0 ? gasto.montoTotal / gasto.consumoTotal : 0;
    const unit = gasto.tipo === 'luz' ? 'kWh' : 'm³';
    const isLuz = gasto.tipo === 'luz';

    const localesACobrar = gasto.costosPorLocal.filter(c => {
        const local = typeof c.localId === 'string' ? locales.find(l => l._id === c.localId) : c.localId;
        return local && local.tipo !== 'casa';
    });

    const tieneProfesor = gasto.costosPorLocal.some(c => {
        const local = typeof c.localId === 'string' ? locales.find(l => l._id === c.localId) : c.localId;
        return local && (local.tipo === 'profesor' || local.nombre?.toLowerCase().includes('academia'));
    });

    return (
        <div className={`group bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded
            ? 'border-gray-200 shadow-lg shadow-gray-100/80'
            : 'border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md hover:shadow-gray-100/50'
            }`}>

            {/* Main Row - Clickable */}
            <div
                className="flex items-center gap-4 p-4 cursor-pointer select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* Service Icon */}
                <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${isLuz
                    ? 'bg-amber-50 text-amber-500'
                    : 'bg-sky-50 text-sky-500'
                    }`}>
                    {isLuz ? <Zap className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 capitalize">
                            {gasto.tipo === 'luz' ? 'Electricidad' : 'Agua'}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${isLuz
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-sky-50 text-sky-600'
                            }`}>
                            {gasto.consumoTotal.toFixed(1)} {unit}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Tarifa: S/ {costoPorUnidad.toFixed(4)} / {unit}
                    </p>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-gray-900">S/ {gasto.montoTotal.toFixed(2)}</p>
                    <p className="text-[11px] text-gray-400">{localesACobrar.length} locales</p>
                </div>

                {/* Expand Arrow */}
                <ChevronRight className={`w-4 h-4 text-gray-300 shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-90' : 'group-hover:text-gray-400'}`} />
            </div>

            {/* Expanded Content */}
            <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                <div className="px-4 pb-4">
                    {/* Divider */}
                    <div className="h-px bg-gray-100 mb-4" />

                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-[11px] text-gray-400 font-medium mb-1">Consumo</p>
                            <p className="text-sm font-bold text-gray-800">{gasto.consumoTotal.toFixed(2)}</p>
                            <p className="text-[10px] text-gray-400">{unit}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-[11px] text-gray-400 font-medium mb-1">Tarifa</p>
                            <p className="text-sm font-bold text-gray-800">S/ {costoPorUnidad.toFixed(4)}</p>
                            <p className="text-[10px] text-gray-400">por {unit}</p>
                        </div>
                        <div className={`rounded-xl p-3 text-center ${isLuz ? 'bg-amber-50' : 'bg-sky-50'}`}>
                            <p className={`text-[11px] font-medium mb-1 ${isLuz ? 'text-amber-500' : 'text-sky-500'}`}>Total</p>
                            <p className={`text-sm font-bold ${isLuz ? 'text-amber-700' : 'text-sky-700'}`}>S/ {gasto.montoTotal.toFixed(2)}</p>
                            <p className={`text-[10px] ${isLuz ? 'text-amber-400' : 'text-sky-400'}`}>recibo</p>
                        </div>
                    </div>

                    {/* Locals Distribution */}
                    <div className="mb-4">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Distribución por Local</p>
                        <div className="space-y-1.5">
                            {localesACobrar.map((costo, idx) => {
                                const local = typeof costo.localId === 'string' ? locales.find(l => l._id === costo.localId) : costo.localId;
                                const nombre = local ? local.nombre : 'Local';
                                const porcentaje = gasto.montoTotal > 0 ? (costo.monto / gasto.montoTotal) * 100 : 0;

                                return (
                                    <div key={idx} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                                        <span className="text-sm text-gray-700 flex-1">{nombre}</span>
                                        <span className="text-xs text-gray-400 tabular-nums">{costo.consumo.toFixed(1)} {unit}</span>
                                        <span className="text-sm font-semibold text-gray-900 tabular-nums min-w-[72px] text-right">S/ {costo.monto.toFixed(2)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <button
                            onClick={(e) => { e.stopPropagation(); generarReporteImagen(gasto, todosGastos, locales); }}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Reporte General
                        </button>
                        {tieneProfesor && (
                            <button
                                onClick={(e) => { e.stopPropagation(); generarReporteProfesor(gasto, todosGastos, locales); }}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                Reporte Profesor
                            </button>
                        )}
                        <div className="flex-1" />
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(gasto); }}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
                            title="Editar"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(gasto._id); }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Eliminar"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

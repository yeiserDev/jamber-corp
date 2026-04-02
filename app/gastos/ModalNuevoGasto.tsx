"use client";

import { X } from "lucide-react";
import { Local } from "@/types/gasto";
import React from "react";
import toast from 'react-hot-toast';

interface ModalNuevoGastoProps {
    showNuevoGasto: boolean;
    pasoModal: number;
    setPasoModal: (paso: number) => void;
    setShowNuevoGasto: (show: boolean) => void;
    resetForm: () => void;
    handleSubmitGasto: (e: React.FormEvent) => void;
    mes: string;
    setMes: (mes: string) => void;
    tipo: 'luz' | 'agua';
    setTipo: (tipo: 'luz' | 'agua') => void;
    consumoTotal: string;
    setConsumoTotal: (total: string) => void;
    montoTotal: string;
    setMontoTotal: (monto: string) => void;
    cargoFijo: string;
    setCargoFijo: (cargo: string) => void;
    igv: string;
    setIgv: (igv: string) => void;
    otrosCargos: string;
    setOtrosCargos: (otros: string) => void;
    lecturas: {
        localId: string;
        medidorNumero?: number;
        lecturaAnterior: number;
        lecturaActual: number;
    }[];
    locales: Local[];
    updateLectura: (index: number, field: string, value: number) => void;
    consumoCasa: number;
    consumoLecturas: number;
    gastoEditando?: string | null;
}

const ModalNuevoGasto = React.memo(({
    showNuevoGasto,
    pasoModal,
    setPasoModal,
    setShowNuevoGasto,
    resetForm,
    handleSubmitGasto,
    mes,
    setMes,
    tipo,
    setTipo,
    consumoTotal,
    setConsumoTotal,
    montoTotal,
    setMontoTotal,
    cargoFijo,
    setCargoFijo,
    igv,
    setIgv,
    otrosCargos,
    setOtrosCargos,
    lecturas,
    locales,
    updateLectura,
    consumoCasa,
    consumoLecturas,
    gastoEditando
}: ModalNuevoGastoProps) => {
    const [isTransitioning, setIsTransitioning] = React.useState(false);

    if (!showNuevoGasto) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {gastoEditando ? 'Editar Gasto' : 'Nuevo Gasto'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Paso {pasoModal} de 2</p>
                    </div>
                    <button
                        onClick={() => {
                            setShowNuevoGasto(false);
                            setPasoModal(1);
                            resetForm();
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-gray-200">
                    <div
                        className="h-full bg-[#0A2640] transition-all duration-300"
                        style={{ width: `${(pasoModal / 2) * 100}%` }}
                    />
                </div>

                <form onSubmit={handleSubmitGasto} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Paso 1: Datos básicos */}
                        {pasoModal === 1 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos Básicos</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Mes
                                        </label>
                                        <input
                                            type="month"
                                            value={mes}
                                            onChange={(e) => setMes(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#0A2640] focus:ring-2 focus:ring-[#0A2640]/10"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tipo de Servicio
                                        </label>
                                        <select
                                            value={tipo}
                                            onChange={(e) => setTipo(e.target.value as 'luz' | 'agua')}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#0A2640] focus:ring-2 focus:ring-[#0A2640]/10"
                                        >
                                            <option value="luz">Luz</option>
                                            <option value="agua">Agua</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Consumo Total ({tipo === 'luz' ? 'kWh' : 'm³'})
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={consumoTotal}
                                            onChange={(e) => setConsumoTotal(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#0A2640] focus:ring-2 focus:ring-[#0A2640]/10"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Monto Total (S/)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={montoTotal}
                                            onChange={(e) => setMontoTotal(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#0A2640] focus:ring-2 focus:ring-[#0A2640]/10"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Paso 2: Lecturas de medidores */}
                        {pasoModal === 2 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Lecturas de Medidores
                                </h3>

                                {/* Preview consumo de casa */}
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700 font-medium">Consumo Casa (Calculado Automáticamente)</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Total ({parseFloat(consumoTotal) || 0} {tipo === 'luz' ? 'kWh' : 'm³'}) - Lecturas ({consumoLecturas.toFixed(2)} {tipo === 'luz' ? 'kWh' : 'm³'})
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-orange-600">
                                                {consumoCasa.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-gray-500">{tipo === 'luz' ? 'kWh' : 'm³'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Lecturas */}
                                <div className="space-y-3">
                                    {lecturas.map((lectura, index) => {
                                        const local = locales.find(l => l._id === lectura.localId);
                                        const consumo = lectura.lecturaActual - lectura.lecturaAnterior;

                                        return (
                                            <div
                                                key={`${lectura.localId}-${lectura.medidorNumero || 1}`}
                                                className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-sm font-semibold text-gray-800">
                                                        {local?.nombre.toLowerCase().includes('academia') ? 'Profesor' : local?.nombre} {lectura.medidorNumero ? `- Medidor ${lectura.medidorNumero}` : ''}
                                                    </h4>
                                                    <span className="text-xs text-gray-500 capitalize">
                                                        {local?.tipo}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-1">
                                                            Lectura Anterior
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={lectura.lecturaAnterior}
                                                            onChange={(e) => updateLectura(index, 'lecturaAnterior', parseFloat(e.target.value) || 0)}
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-gray-800 text-sm focus:outline-none focus:border-[#0A2640] focus:ring-2 focus:ring-[#0A2640]/10"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-1">
                                                            Lectura Actual
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={lectura.lecturaActual}
                                                            onChange={(e) => updateLectura(index, 'lecturaActual', parseFloat(e.target.value) || 0)}
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-gray-800 text-sm focus:outline-none focus:border-[#0A2640] focus:ring-2 focus:ring-[#0A2640]/10"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-1">
                                                            Consumo
                                                        </label>
                                                        <div className="px-3 py-2 bg-[#0A2640]/5 border border-[#0A2640]/20 rounded text-[#0A2640] text-sm font-semibold">
                                                            {consumo > 0 ? consumo.toFixed(2) : '0.00'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer con botones */}
                    <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                        <button
                            type="button"
                            onClick={() => {
                                if (pasoModal > 1) {
                                    setPasoModal(pasoModal - 1);
                                } else {
                                    setShowNuevoGasto(false);
                                    setPasoModal(1);
                                    resetForm();
                                }
                            }}
                            className="px-6 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                        >
                            {pasoModal === 1 ? 'Cancelar' : 'Anterior'}
                        </button>

                        <div className="flex gap-2">
                            {[1, 2].map((paso) => (
                                <div
                                    key={paso}
                                    className={`w-2 h-2 rounded-full transition-colors ${paso === pasoModal ? 'bg-[#0A2640]' : 'bg-gray-300'
                                        }`}
                                />
                            ))}
                        </div>

                        {pasoModal < 2 ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (!mes || !consumoTotal || !montoTotal) {
                                        toast.error('Por favor completa todos los campos del paso 1');
                                        return;
                                    }
                                    setIsTransitioning(true);
                                    setPasoModal(pasoModal + 1);
                                    setTimeout(() => setIsTransitioning(false), 500);
                                }}
                                className="px-6 py-2 bg-[#0A2640] hover:bg-[#0A2640]/90 text-white rounded-lg transition-all"
                            >
                                Siguiente
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isTransitioning}
                                className={`px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {gastoEditando ? 'Actualizar Gasto' : 'Crear Gasto'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
});

ModalNuevoGasto.displayName = 'ModalNuevoGasto';

export default ModalNuevoGasto;

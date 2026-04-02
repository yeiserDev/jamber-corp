"use client";

import { X, Zap, Droplets, Home } from "lucide-react";
import { Local } from "@/types/gasto";
import React from "react";
import toast from "react-hot-toast";

interface ModalNuevoGastoProps {
  showNuevoGasto: boolean;
  pasoModal: number;
  setPasoModal: (paso: number) => void;
  setShowNuevoGasto: (show: boolean) => void;
  resetForm: () => void;
  handleSubmitGasto: (e: React.FormEvent) => void;
  mes: string;
  setMes: (mes: string) => void;
  tipo: "luz" | "agua";
  setTipo: (tipo: "luz" | "agua") => void;
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

/* ── Clases reutilizables ──────────────────────────────── */
const inputCls =
  "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:border-[#0A2640] focus:ring-2 focus:ring-[#0A2640]/10 transition-all placeholder:text-gray-300";

const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

const ModalNuevoGasto = React.memo(
  ({
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
    gastoEditando,
  }: ModalNuevoGastoProps) => {
    const [isTransitioning, setIsTransitioning] = React.useState(false);
    const unit = tipo === "luz" ? "kWh" : "m³";

    if (!showNuevoGasto) return null;

    const cerrar = () => {
      setShowNuevoGasto(false);
      setPasoModal(1);
      resetForm();
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">

          {/* ── Cabecera ──────────────────────────────────── */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0A2640]">
                  {gastoEditando ? "Editar Registro" : "Nuevo Registro"}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Completa los datos del recibo de {tipo === "luz" ? "electricidad" : "agua"}
                </p>
              </div>
              <button
                onClick={cerrar}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Indicador de pasos */}
            <div className="flex items-center gap-3 mt-5">
              {[
                { n: 1, label: "Datos del recibo" },
                { n: 2, label: "Lecturas de medidores" },
              ].map((step, i) => (
                <React.Fragment key={step.n}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        pasoModal >= step.n
                          ? "bg-[#0A2640] text-white shadow-sm"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {step.n}
                    </div>
                    <span
                      className={`text-xs font-medium transition-colors ${
                        pasoModal >= step.n ? "text-[#0A2640]" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < 1 && (
                    <div
                      className={`flex-1 h-0.5 rounded-full transition-all ${
                        pasoModal > 1 ? "bg-[#0A2640]" : "bg-gray-100"
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ── Contenido ─────────────────────────────────── */}
          <form
            onSubmit={handleSubmitGasto}
            className="flex-1 overflow-y-auto"
          >
            <div className="p-6 space-y-5">

              {/* ── Paso 1: Datos básicos ──────────────────── */}
              {pasoModal === 1 && (
                <div className="space-y-5 animate-fade-up">

                  {/* Selector de servicio — visual */}
                  <div>
                    <label className={labelCls}>Tipo de servicio</label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Luz */}
                      <button
                        type="button"
                        onClick={() => setTipo("luz")}
                        className={`relative flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 transition-all ${
                          tipo === "luz"
                            ? "border-amber-400 bg-amber-50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-amber-200 hover:bg-amber-50/30"
                        }`}
                      >
                        {tipo === "luz" && (
                          <div className="absolute top-3 right-3 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        )}
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                            tipo === "luz"
                              ? "bg-amber-100 text-amber-600"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          <Zap className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <p
                            className={`text-sm font-bold ${
                              tipo === "luz" ? "text-amber-700" : "text-gray-500"
                            }`}
                          >
                            Electricidad
                          </p>
                          <p className="text-[11px] text-gray-400">kWh</p>
                        </div>
                      </button>

                      {/* Agua */}
                      <button
                        type="button"
                        onClick={() => setTipo("agua")}
                        className={`relative flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 transition-all ${
                          tipo === "agua"
                            ? "border-sky-400 bg-sky-50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-sky-200 hover:bg-sky-50/30"
                        }`}
                      >
                        {tipo === "agua" && (
                          <div className="absolute top-3 right-3 w-4 h-4 bg-sky-400 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        )}
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                            tipo === "agua"
                              ? "bg-sky-100 text-sky-600"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          <Droplets className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <p
                            className={`text-sm font-bold ${
                              tipo === "agua" ? "text-sky-700" : "text-gray-500"
                            }`}
                          >
                            Agua
                          </p>
                          <p className="text-[11px] text-gray-400">m³</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Mes */}
                  <div>
                    <label className={labelCls}>Mes del recibo</label>
                    <input
                      type="month"
                      value={mes}
                      onChange={(e) => setMes(e.target.value)}
                      className={inputCls}
                      required
                    />
                  </div>

                  {/* Consumo y Monto */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>
                        Consumo total ({unit})
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={consumoTotal}
                          onChange={(e) => setConsumoTotal(e.target.value)}
                          className={inputCls + " pr-14"}
                          placeholder="0.00"
                          required
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                          {unit}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Monto total (S/)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">
                          S/
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={montoTotal}
                          onChange={(e) => setMontoTotal(e.target.value)}
                          className={inputCls + " pl-9"}
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cargos adicionales — colapsados visualmente */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Cargos adicionales (opcional)
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1.5">
                          Cargo fijo
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">S/</span>
                          <input
                            type="number"
                            step="0.01"
                            value={cargoFijo}
                            onChange={(e) => setCargoFijo(e.target.value)}
                            className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:border-[#0A2640] focus:ring-2 focus:ring-[#0A2640]/10 transition-all"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1.5">
                          IGV
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">S/</span>
                          <input
                            type="number"
                            step="0.01"
                            value={igv}
                            onChange={(e) => setIgv(e.target.value)}
                            className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:border-[#0A2640] focus:ring-2 focus:ring-[#0A2640]/10 transition-all"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1.5">
                          Otros cargos
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">S/</span>
                          <input
                            type="number"
                            step="0.01"
                            value={otrosCargos}
                            onChange={(e) => setOtrosCargos(e.target.value)}
                            className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:border-[#0A2640] focus:ring-2 focus:ring-[#0A2640]/10 transition-all"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Paso 2: Lecturas de medidores ──────────── */}
              {pasoModal === 2 && (
                <div className="space-y-4 animate-fade-up">

                  {/* Consumo casa — calculado */}
                  <div
                    className={`rounded-2xl p-4 border flex items-center justify-between ${
                      consumoCasa > 0
                        ? "bg-orange-50 border-orange-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Home className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          Consumo Residencia
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Total ({parseFloat(consumoTotal) || 0} {unit}) − Locales ({consumoLecturas.toFixed(2)} {unit})
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-2xl font-bold ${
                          consumoCasa > 0 ? "text-orange-600" : "text-gray-400"
                        }`}
                      >
                        {consumoCasa.toFixed(2)}
                      </p>
                      <p className="text-[11px] text-gray-400">{unit}</p>
                    </div>
                  </div>

                  {/* Lecturas */}
                  <div className="space-y-3">
                    {lecturas.map((lectura, index) => {
                      const local = locales.find(
                        (l) => l._id === lectura.localId
                      );
                      const consumo =
                        lectura.lecturaActual - lectura.lecturaAnterior;
                      const isOk = consumo >= 0;

                      return (
                        <div
                          key={`${lectura.localId}-${lectura.medidorNumero || 1}`}
                          className="bg-gray-50 border border-gray-200 rounded-2xl p-4"
                        >
                          {/* Local header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-[#0A2640] rounded-lg flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white">
                                  {index + 1}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">
                                  {local?.nombre.toLowerCase().includes("academia")
                                    ? "Profesor"
                                    : local?.nombre}
                                  {lectura.medidorNumero
                                    ? ` — Medidor ${lectura.medidorNumero}`
                                    : ""}
                                </p>
                                <p className="text-[10px] text-gray-400 capitalize">
                                  {local?.tipo}
                                </p>
                              </div>
                            </div>
                            {/* Consumo badge */}
                            <span
                              className={`text-sm font-bold px-3 py-1 rounded-full ${
                                isOk && consumo > 0
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {isOk ? consumo.toFixed(2) : "0.00"} {unit}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] text-gray-500 font-medium mb-1.5">
                                Lectura anterior
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={lectura.lecturaAnterior}
                                onChange={(e) =>
                                  updateLectura(
                                    index,
                                    "lecturaAnterior",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:border-[#0A2640] focus:ring-2 focus:ring-[#0A2640]/10 transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-gray-500 font-medium mb-1.5">
                                Lectura actual
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={lectura.lecturaActual}
                                onChange={(e) =>
                                  updateLectura(
                                    index,
                                    "lecturaActual",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:border-[#0A2640] focus:ring-2 focus:ring-[#0A2640]/10 transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── Footer ────────────────────────────────────── */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (pasoModal > 1) {
                    setPasoModal(pasoModal - 1);
                  } else {
                    cerrar();
                  }
                }}
                className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-xl transition-all"
              >
                {pasoModal === 1 ? "Cancelar" : "Anterior"}
              </button>

              {/* Dots */}
              <div className="flex gap-1.5">
                {[1, 2].map((p) => (
                  <div
                    key={p}
                    className={`rounded-full transition-all ${
                      p === pasoModal
                        ? "w-5 h-2 bg-[#0A2640]"
                        : "w-2 h-2 bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              {pasoModal < 2 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!mes || !consumoTotal || !montoTotal) {
                      toast.error("Completa todos los campos obligatorios");
                      return;
                    }
                    setIsTransitioning(true);
                    setPasoModal(2);
                    setTimeout(() => setIsTransitioning(false), 400);
                  }}
                  className="px-5 py-2.5 bg-[#0A2640] hover:bg-[#0d3050] text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isTransitioning}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
                >
                  {gastoEditando ? "Actualizar" : "Guardar Registro"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }
);

ModalNuevoGasto.displayName = "ModalNuevoGasto";
export default ModalNuevoGasto;

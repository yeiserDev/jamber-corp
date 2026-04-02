"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Droplets,
  Receipt,
  ChevronRight,
  Calendar as CalendarIcon,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface Gasto {
  _id: string;
  mes: string;
  tipo: 'luz' | 'agua';
  consumoTotal: number;
  montoTotal: number;
  costosPorLocal: {
    localId: {
      _id: string;
      nombre: string;
      tipo: string;
    };
    consumo: number;
    monto: number;
  }[];
}

export default function Dashboard() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesSeleccionado, setMesSeleccionado] = useState<Date>(new Date());

  useEffect(() => {
    cargarGastos();
  }, []);

  const cargarGastos = async () => {
    try {
      const res = await fetch('/api/gastos', { cache: 'no-store' });

      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status}`);
      }

      const data = await res.json();

      if (data.success && Array.isArray(data.gastos)) {
        setGastos(data.gastos);
      } else {
        setGastos([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar gastos:', error);
      // Fallback to empty state cleanly
      setGastos([]);
      setLoading(false);
    }
  };

  const calcularEstadisticas = () => {
    const mesActual = new Date().toISOString().slice(0, 7);
    const mesAnterior = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);

    const gastosActuales = gastos.filter(g => g.mes === mesActual);
    const gastosAnteriores = gastos.filter(g => g.mes === mesAnterior);

    const totalActual = gastosActuales.reduce((sum, g) => sum + g.montoTotal, 0);
    const totalAnterior = gastosAnteriores.reduce((sum, g) => sum + g.montoTotal, 0);

    const totalLuz = gastosActuales.filter(g => g.tipo === 'luz').reduce((sum, g) => sum + g.montoTotal, 0);
    const totalAgua = gastosActuales.filter(g => g.tipo === 'agua').reduce((sum, g) => sum + g.montoTotal, 0);

    const cambio = totalAnterior > 0 ? ((totalActual - totalAnterior) / totalAnterior) * 100 : 0;

    return {
      totalActual,
      totalLuz,
      totalAgua,
      cambio,
      gastosActuales,
    };
  };

  const obtenerHistorico = () => {
    const meses = Array.from(new Set(gastos.map(g => g.mes)))
      .sort()
      .slice(-6);

    return meses.map(mes => {
      const gastosMes = gastos.filter(g => g.mes === mes);
      const totalLuz = gastosMes.filter(g => g.tipo === 'luz').reduce((sum, g) => sum + g.montoTotal, 0);
      const totalAgua = gastosMes.filter(g => g.tipo === 'agua').reduce((sum, g) => sum + g.montoTotal, 0);
      const total = totalLuz + totalAgua;

      return { mes, totalLuz, totalAgua, total };
    });
  };

  const obtenerGastosPorLocal = () => {
    const stats = calcularEstadisticas();
    const distribucion: { [key: string]: { nombre: string; luz: number; agua: number; total: number; tipo: string } } = {};

    stats.gastosActuales.forEach(gasto => {
      gasto.costosPorLocal.forEach(costo => {
        if (costo.localId.tipo !== 'casa') {
          const key = costo.localId._id;
          if (!distribucion[key]) {
            distribucion[key] = {
              nombre: costo.localId.nombre,
              luz: 0,
              agua: 0,
              total: 0,
              tipo: costo.localId.tipo,
            };
          }
          if (gasto.tipo === 'luz') {
            distribucion[key].luz += costo.monto;
          } else {
            distribucion[key].agua += costo.monto;
          }
          distribucion[key].total += costo.monto;
        }
      });
    });

    return Object.values(distribucion).sort((a, b) => b.total - a.total);
  };

  const obtenerDiasConGastos = () => {
    return gastos.map(g => g.mes);
  };

  const stats = calcularEstadisticas();
  const historico = obtenerHistorico();
  const gastosPorLocal = obtenerGastosPorLocal();
  const diasConGastos = obtenerDiasConGastos();

  const maxHistorico = Math.max(...historico.map(h => h.total), 1);

  // Calendario
  const generarCalendario = () => {
    const año = mesSeleccionado.getFullYear();
    const mes = mesSeleccionado.getMonth();
    const primerDia = new Date(año, mes, 1).getDay();
    const diasEnMes = new Date(año, mes + 1, 0).getDate();
    const dias = [];

    for (let i = 0; i < primerDia; i++) {
      dias.push(null);
    }

    for (let dia = 1; dia <= diasEnMes; dia++) {
      dias.push(dia);
    }

    return dias;
  };

  const tieneGastoEnMes = (año: number, mes: number) => {
    const mesStr = `${año}-${String(mes + 1).padStart(2, '0')}`;
    return diasConGastos.includes(mesStr);
  };

  const cambiarMes = (direccion: number) => {
    const nuevaFecha = new Date(mesSeleccionado);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);
    setMesSeleccionado(nuevaFecha);
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-[#0A2640] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando información...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const mesNombre = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <DashboardLayout title="">
      <div className="h-screen overflow-hidden bg-[#F8FAFC]">
        <div className="grid grid-cols-12 gap-5 h-full p-5">
          {/* Columna Principal */}
          <div className="col-span-9 flex flex-col gap-5 overflow-y-auto pr-2">
            {/* Header Compacto y Profesional */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-[#0A2640] p-3 rounded-lg">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-[#0A2640]">Panel de Control</h1>
                    <p className="text-sm text-gray-500 capitalize">{mesNombre}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total del Mes</p>
                    <p className="text-3xl font-bold text-[#0A2640]">S/ {stats.totalActual.toFixed(2)}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg ${stats.cambio >= 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                    {stats.cambio >= 0 ? <ArrowUpRight className="w-4 h-4 text-red-600" /> : <ArrowDownRight className="w-4 h-4 text-emerald-600" />}
                    <span className={`text-sm font-bold ${stats.cambio >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {Math.abs(stats.cambio).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cards Luz y Agua - Diseño Profesional */}
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-50 p-3 rounded-lg">
                      <Lightbulb className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Luz</p>
                      <p className="text-2xl font-bold text-[#0A2640]">S/ {stats.totalLuz.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 px-3 py-1.5 rounded-lg">
                    <p className="text-xs font-semibold text-amber-700">{stats.gastosActuales.filter(g => g.tipo === 'luz').length} registros</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <Droplets className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Agua</p>
                      <p className="text-2xl font-bold text-[#0A2640]">S/ {stats.totalAgua.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 px-3 py-1.5 rounded-lg">
                    <p className="text-xs font-semibold text-blue-700">{stats.gastosActuales.filter(g => g.tipo === 'agua').length} registros</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Gastos por Local - Profesional */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-5 border-b border-gray-200">
                <h2 className="text-lg font-bold text-[#0A2640]">Gastos por Local</h2>
              </div>

              {gastosPorLocal.length === 0 ? (
                <div className="p-8 text-center">
                  <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No hay gastos este mes</p>
                </div>
              ) : (
                <div className="p-5 space-y-3">
                  {gastosPorLocal.map((local, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-[#0A2640] transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-[#0A2640] w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-[#0A2640]">{local.nombre}</h3>
                            <p className="text-xs text-gray-500">Local comercial</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-[#0A2640]">S/ {local.total.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 flex-1">
                          <Lightbulb className="w-4 h-4 text-amber-600" />
                          <span className="text-xs text-gray-500">Luz:</span>
                          <span className="text-sm font-semibold text-gray-700">S/ {local.luz.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <Droplets className="w-4 h-4 text-blue-600" />
                          <span className="text-xs text-gray-500">Agua:</span>
                          <span className="text-sm font-semibold text-gray-700">S/ {local.agua.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gráfico Histórico - Mejorado */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#0A2640]">Evolución de Gastos</h2>
                  <p className="text-xs text-gray-500 mt-1">Comparativa mensual de servicios</p>
                </div>
                {historico.length > 0 && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-amber-500"></div>
                      <span className="text-xs text-gray-600 font-medium">Luz</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-blue-500"></div>
                      <span className="text-xs text-gray-600 font-medium">Agua</span>
                    </div>
                  </div>
                )}
              </div>

              {historico.length === 0 ? (
                <div className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No hay datos históricos</p>
                </div>
              ) : (
                <div className="p-5">
                  {/* Gráfico de Barras Verticales con Grid */}
                  <div className="relative bg-gradient-to-b from-gray-50/50 to-white rounded-lg p-4 border border-gray-100">
                    {/* Grid lines (líneas guía) */}
                    <div className="absolute inset-0 flex flex-col justify-between py-4 px-4 pointer-events-none">
                      {[0, 1, 2, 3, 4].map((i) => {
                        const maxTotal = Math.max(...historico.map(item => item.total));
                        const value = (maxTotal / 4) * (4 - i);
                        return (
                          <div key={i} className="flex items-center w-full">
                            <span className="text-[10px] text-gray-400 font-medium w-12">
                              S/ {value.toFixed(0)}
                            </span>
                            <div className="flex-1 border-t border-dashed border-gray-200"></div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Barras */}
                    <div className="relative flex items-end justify-around gap-3 h-56 pt-2 pl-12">
                      {historico.map((h, idx) => {
                        const maxTotal = Math.max(...historico.map(item => item.total));
                        const alturaLuz = (h.totalLuz / maxTotal) * 100;
                        const alturaAgua = (h.totalAgua / maxTotal) * 100;

                        return (
                          <div key={h.mes} className="flex-1 flex flex-col items-center gap-2 group">
                            {/* Tooltip total */}
                            <div className="absolute -top-6 bg-[#0A2640] text-white px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                              S/ {h.total.toFixed(2)}
                            </div>

                            {/* Container de barras */}
                            <div className="w-full flex gap-1.5 items-end justify-center" style={{ height: '180px' }}>
                              {/* Barra Luz */}
                              <div className="flex-1 max-w-[28px] flex flex-col justify-end">
                                <div className="relative">
                                  {/* Valor encima de la barra */}
                                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[9px] font-bold text-amber-600 whitespace-nowrap">
                                      {h.totalLuz.toFixed(0)}
                                    </span>
                                  </div>
                                  <div
                                    className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-lg transition-all hover:from-amber-600 hover:to-amber-500 shadow-sm"
                                    style={{ height: `${alturaLuz}%`, minHeight: h.totalLuz > 0 ? '8px' : '0px' }}
                                    title={`Luz: S/ ${h.totalLuz.toFixed(2)}`}
                                  ></div>
                                </div>
                              </div>

                              {/* Barra Agua */}
                              <div className="flex-1 max-w-[28px] flex flex-col justify-end">
                                <div className="relative">
                                  {/* Valor encima de la barra */}
                                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[9px] font-bold text-blue-600 whitespace-nowrap">
                                      {h.totalAgua.toFixed(0)}
                                    </span>
                                  </div>
                                  <div
                                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500 shadow-sm"
                                    style={{ height: `${alturaAgua}%`, minHeight: h.totalAgua > 0 ? '8px' : '0px' }}
                                    title={`Agua: S/ ${h.totalAgua.toFixed(2)}`}
                                  ></div>
                                </div>
                              </div>
                            </div>

                            {/* Etiqueta mes */}
                            <p className="text-[10px] font-bold text-gray-600 uppercase text-center mt-1">
                              {new Date(h.mes + '-01').toLocaleDateString('es-ES', { month: 'short' })}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Estadísticas del gráfico */}
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Promedio Total</p>
                      <p className="text-lg font-bold text-[#0A2640]">
                        S/ {(historico.reduce((sum, h) => sum + h.total, 0) / historico.length).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Promedio Luz</p>
                      <p className="text-lg font-bold text-amber-600">
                        S/ {(historico.reduce((sum, h) => sum + h.totalLuz, 0) / historico.length).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Promedio Agua</p>
                      <p className="text-lg font-bold text-blue-600">
                        S/ {(historico.reduce((sum, h) => sum + h.totalAgua, 0) / historico.length).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botón Ver Gastos - Profesional */}
            <Link
              href="/gastos"
              className="bg-[#0A2640] hover:bg-[#0A2640]/90 text-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Receipt className="w-5 h-5" />
                  <div>
                    <p className="font-semibold">Ver Todos los Gastos</p>
                    <p className="text-xs text-white/80">Administra y registra</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          {/* Columna del Calendario - Profesional */}
          <div className="col-span-3 flex flex-col gap-5">
            {/* Calendario */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => cambiarMes(-1)}
                    className="text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-all"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                  <h3 className="text-[#0A2640] font-bold text-sm capitalize">
                    {mesSeleccionado.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={() => cambiarMes(1)}
                    className="text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-7 gap-1.5 mb-2">
                  {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((dia, i) => (
                    <div key={i} className="text-center text-[10px] font-semibold text-gray-400">
                      {dia}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {generarCalendario().map((dia, i) => {
                    const esHoy = dia === new Date().getDate() &&
                      mesSeleccionado.getMonth() === new Date().getMonth() &&
                      mesSeleccionado.getFullYear() === new Date().getFullYear();

                    const tieneGasto = dia && tieneGastoEnMes(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth());

                    return (
                      <div
                        key={i}
                        className={`
                          aspect-square flex items-center justify-center text-xs rounded-md font-medium
                          ${!dia ? 'invisible' : ''}
                          ${esHoy ? 'bg-[#0A2640] text-white font-bold' : 'text-gray-600'}
                          ${tieneGasto && !esHoy ? 'bg-emerald-50 text-emerald-700' : ''}
                          ${dia && !esHoy && !tieneGasto ? 'hover:bg-gray-50' : ''}
                        `}
                      >
                        {dia}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px]">
                    <div className="w-2 h-2 bg-[#0A2640] rounded"></div>
                    <span className="text-gray-500">Hoy</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <div className="w-2 h-2 bg-emerald-50 border border-emerald-200 rounded"></div>
                    <span className="text-gray-500">Con gastos</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas Rápidas - Profesional */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-bold text-[#0A2640] text-sm mb-3">Resumen Rápido</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Total Gastos</p>
                  <p className="text-2xl font-bold text-[#0A2640]">{gastos.length}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Locales Activos</p>
                  <p className="text-2xl font-bold text-[#0A2640]">{gastosPorLocal.length}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Promedio/Mes</p>
                  <p className="text-xl font-bold text-[#0A2640]">
                    S/ {gastos.length > 0 ? (gastos.reduce((s, g) => s + g.montoTotal, 0) / Array.from(new Set(gastos.map(g => g.mes))).length).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

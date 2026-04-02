"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lightbulb,
  Droplets,
  Receipt,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  TrendingUp,
  Building2,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface Gasto {
  _id: string;
  mes: string;
  tipo: "luz" | "agua";
  consumoTotal: number;
  montoTotal: number;
  costosPorLocal: {
    localId: { _id: string; nombre: string; tipo: string };
    consumo: number;
    monto: number;
  }[];
}

/* ── Skeleton de carga ───────────────────────────────── */
function DashboardSkeleton() {
  return (
    <DashboardLayout title="">
      <div className="h-screen overflow-hidden bg-[#F8FAFC]">
        <div className="grid grid-cols-12 gap-5 h-full p-5">
          <div className="col-span-9 flex flex-col gap-5">
            <div className="skeleton h-28 rounded-xl" />
            <div className="grid grid-cols-3 gap-5">
              <div className="skeleton h-28 rounded-xl" />
              <div className="skeleton h-28 rounded-xl" />
              <div className="skeleton h-28 rounded-xl" />
            </div>
            <div className="skeleton h-56 rounded-xl" />
            <div className="skeleton h-72 rounded-xl" />
          </div>
          <div className="col-span-3 flex flex-col gap-5">
            <div className="skeleton h-72 rounded-xl" />
            <div className="skeleton h-44 rounded-xl" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
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
      const res = await fetch("/api/gastos", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setGastos(data.success && Array.isArray(data.gastos) ? data.gastos : []);
    } catch {
      setGastos([]);
    } finally {
      setLoading(false);
    }
  };

  /* ── Cálculos ───────────────────────────────────────── */
  const calcularEstadisticas = () => {
    const mesActual = new Date().toISOString().slice(0, 7);
    const mesAnterior = new Date(
      new Date().setMonth(new Date().getMonth() - 1)
    )
      .toISOString()
      .slice(0, 7);

    const actual = gastos.filter((g) => g.mes === mesActual);
    const anterior = gastos.filter((g) => g.mes === mesAnterior);

    const totalActual = actual.reduce((s, g) => s + g.montoTotal, 0);
    const totalAnterior = anterior.reduce((s, g) => s + g.montoTotal, 0);
    const totalLuz = actual
      .filter((g) => g.tipo === "luz")
      .reduce((s, g) => s + g.montoTotal, 0);
    const totalAgua = actual
      .filter((g) => g.tipo === "agua")
      .reduce((s, g) => s + g.montoTotal, 0);
    const cambio =
      totalAnterior > 0
        ? ((totalActual - totalAnterior) / totalAnterior) * 100
        : 0;

    return { totalActual, totalLuz, totalAgua, cambio, gastosActuales: actual };
  };

  const obtenerHistorico = () => {
    const meses = Array.from(new Set(gastos.map((g) => g.mes)))
      .sort()
      .slice(-6);
    return meses.map((mes) => {
      const gm = gastos.filter((g) => g.mes === mes);
      const totalLuz = gm
        .filter((g) => g.tipo === "luz")
        .reduce((s, g) => s + g.montoTotal, 0);
      const totalAgua = gm
        .filter((g) => g.tipo === "agua")
        .reduce((s, g) => s + g.montoTotal, 0);
      return { mes, totalLuz, totalAgua, total: totalLuz + totalAgua };
    });
  };

  const obtenerGastosPorLocal = () => {
    const stats = calcularEstadisticas();
    const dist: Record<
      string,
      { nombre: string; luz: number; agua: number; total: number; tipo: string }
    > = {};

    stats.gastosActuales.forEach((gasto) => {
      gasto.costosPorLocal.forEach((costo) => {
        if (costo.localId.tipo !== "casa") {
          const key = costo.localId._id;
          if (!dist[key])
            dist[key] = {
              nombre: costo.localId.nombre,
              luz: 0,
              agua: 0,
              total: 0,
              tipo: costo.localId.tipo,
            };
          if (gasto.tipo === "luz") dist[key].luz += costo.monto;
          else dist[key].agua += costo.monto;
          dist[key].total += costo.monto;
        }
      });
    });

    return Object.values(dist).sort((a, b) => b.total - a.total);
  };

  /* ── Calendario ─────────────────────────────────────── */
  const mesesConGastos = gastos.map((g) => g.mes);

  const generarCalendario = () => {
    const año = mesSeleccionado.getFullYear();
    const mes = mesSeleccionado.getMonth();
    const primerDia = new Date(año, mes, 1).getDay();
    const diasEnMes = new Date(año, mes + 1, 0).getDate();
    const dias: (number | null)[] = [];
    for (let i = 0; i < primerDia; i++) dias.push(null);
    for (let d = 1; d <= diasEnMes; d++) dias.push(d);
    return dias;
  };

  const tieneGastoEnMes = (año: number, mes: number) => {
    const str = `${año}-${String(mes + 1).padStart(2, "0")}`;
    return mesesConGastos.includes(str);
  };

  const cambiarMes = (dir: number) => {
    const d = new Date(mesSeleccionado);
    d.setMonth(d.getMonth() + dir);
    setMesSeleccionado(d);
  };

  /* ── Loading ─────────────────────────────────────────── */
  if (loading) return <DashboardSkeleton />;

  const stats = calcularEstadisticas();
  const historico = obtenerHistorico();
  const gastosPorLocal = obtenerGastosPorLocal();
  const maxHistorico = Math.max(...historico.map((h) => h.total), 1);
  const maxLocal = Math.max(...gastosPorLocal.map((l) => l.total), 1);
  const mesNombre = new Date().toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const subiendo = stats.cambio >= 0;

  return (
    <DashboardLayout title="">
      <div className="h-screen overflow-hidden bg-[#F8FAFC]">
        <div className="grid grid-cols-12 gap-5 h-full p-5">
          {/* ── Columna Principal ─────────────────────── */}
          <div className="col-span-9 flex flex-col gap-5 overflow-y-auto pr-2">

            {/* Header */}
            <div className="animate-fade-up delay-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-[#0A2640] via-cyan-400 to-sky-500" />
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-[#0A2640] p-3 rounded-xl">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-[#0A2640]">
                      Panel de Control
                    </h1>
                    <p className="text-sm text-gray-400 capitalize mt-0.5">
                      {mesNombre}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">
                      Total del Mes
                    </p>
                    <p className="text-3xl font-bold text-[#0A2640]">
                      S/{" "}
                      {stats.totalActual.toLocaleString("es-PE", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl ${
                      subiendo
                        ? "bg-red-50 text-red-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {subiendo ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    <span className="text-sm font-bold">
                      {Math.abs(stats.cambio).toFixed(1)}%
                    </span>
                    <span className="text-xs opacity-70">vs anterior</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat Cards — Luz / Agua / Registros */}
            <div className="grid grid-cols-3 gap-5">
              {/* Luz */}
              <div className="animate-fade-up delay-100 bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-amber-200 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-amber-50 group-hover:bg-amber-100 p-3 rounded-xl transition-colors">
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase tracking-wide">
                    {stats.gastosActuales.filter((g) => g.tipo === "luz")
                      .length}{" "}
                    reg.
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">
                  Electricidad
                </p>
                <p className="text-2xl font-bold text-[#0A2640]">
                  S/ {stats.totalLuz.toFixed(2)}
                </p>
                <div className="mt-3 h-1 bg-amber-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full bar-grow"
                    style={{
                      width:
                        stats.totalActual > 0
                          ? `${(stats.totalLuz / stats.totalActual) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              {/* Agua */}
              <div className="animate-fade-up delay-150 bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-sky-200 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-sky-50 group-hover:bg-sky-100 p-3 rounded-xl transition-colors">
                    <Droplets className="w-5 h-5 text-sky-500" />
                  </div>
                  <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 px-2 py-1 rounded-full uppercase tracking-wide">
                    {stats.gastosActuales.filter((g) => g.tipo === "agua")
                      .length}{" "}
                    reg.
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">
                  Agua
                </p>
                <p className="text-2xl font-bold text-[#0A2640]">
                  S/ {stats.totalAgua.toFixed(2)}
                </p>
                <div className="mt-3 h-1 bg-sky-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-400 rounded-full bar-grow"
                    style={{
                      width:
                        stats.totalActual > 0
                          ? `${(stats.totalAgua / stats.totalActual) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              {/* Registros totales */}
              <div className="animate-fade-up delay-200 bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-indigo-50 group-hover:bg-indigo-100 p-3 rounded-xl transition-colors">
                    <Receipt className="w-5 h-5 text-indigo-500" />
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-wide">
                    histórico
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">
                  Total Registros
                </p>
                <p className="text-2xl font-bold text-[#0A2640]">
                  {gastos.length}
                </p>
                <div className="mt-3 h-1 bg-indigo-50 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full bar-grow w-full" />
                </div>
              </div>
            </div>

            {/* Gastos por Local — con progress bars */}
            <div className="animate-fade-up delay-250 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#0A2640]">
                    Distribución por Local
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Mes actual — agua + luz
                  </p>
                </div>
                <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  {gastosPorLocal.length} locales
                </span>
              </div>

              {gastosPorLocal.length === 0 ? (
                <div className="p-10 text-center">
                  <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    Sin gastos este mes
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {gastosPorLocal.map((local, idx) => {
                    const pct = Math.round((local.total / maxLocal) * 100);
                    const colors = [
                      "from-[#0A2640] to-cyan-500",
                      "from-indigo-500 to-purple-500",
                      "from-emerald-500 to-teal-400",
                      "from-orange-400 to-amber-400",
                    ];
                    const gradient = colors[idx % colors.length];

                    return (
                      <div
                        key={idx}
                        className="p-5 hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                            >
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#0A2640]">
                                {local.nombre}
                              </p>
                              <p className="text-[11px] text-gray-400 capitalize">
                                {local.tipo}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-[#0A2640]">
                              S/ {local.total.toFixed(2)}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {pct}% del total
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                          <div
                            className={`h-full bg-gradient-to-r ${gradient} rounded-full bar-grow`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {/* Luz vs Agua breakdown */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-amber-500" />
                            <span className="text-[11px] text-gray-500">
                              S/ {local.luz.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Droplets className="w-3 h-3 text-sky-500" />
                            <span className="text-[11px] text-gray-500">
                              S/ {local.agua.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Gráfico Histórico */}
            <div className="animate-fade-up delay-300 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#0A2640]">
                    Evolución de Gastos
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Últimos 6 meses
                  </p>
                </div>
                {historico.length > 0 && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded bg-amber-400" />
                      <span className="text-[11px] text-gray-500 font-medium">
                        Luz
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded bg-sky-400" />
                      <span className="text-[11px] text-gray-500 font-medium">
                        Agua
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {historico.length === 0 ? (
                <div className="p-10 text-center">
                  <TrendingUp className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Sin datos históricos</p>
                </div>
              ) : (
                <div className="p-5">
                  <div className="relative bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between py-4 px-4 pointer-events-none">
                      {[0, 1, 2, 3, 4].map((i) => {
                        const maxT = Math.max(
                          ...historico.map((h) => h.total)
                        );
                        const val = (maxT / 4) * (4 - i);
                        return (
                          <div key={i} className="flex items-center w-full">
                            <span className="text-[10px] text-gray-300 font-medium w-12">
                              S/ {val.toFixed(0)}
                            </span>
                            <div className="flex-1 border-t border-dashed border-gray-200" />
                          </div>
                        );
                      })}
                    </div>

                    {/* Bars */}
                    <div className="relative flex items-end justify-around gap-3 h-52 pt-2 pl-12">
                      {historico.map((h) => {
                        const maxT = Math.max(
                          ...historico.map((i) => i.total)
                        );
                        const hLuz = (h.totalLuz / maxT) * 100;
                        const hAgua = (h.totalAgua / maxT) * 100;

                        return (
                          <div
                            key={h.mes}
                            className="flex-1 flex flex-col items-center gap-2 group"
                          >
                            <div
                              className="w-full flex gap-1.5 items-end justify-center"
                              style={{ height: "176px" }}
                            >
                              {/* Luz bar */}
                              <div className="flex-1 max-w-[26px] flex flex-col justify-end">
                                <div className="relative">
                                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[9px] font-bold text-amber-600 whitespace-nowrap">
                                      {h.totalLuz.toFixed(0)}
                                    </span>
                                  </div>
                                  <div
                                    className="w-full bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-lg transition-all hover:from-amber-600 hover:to-amber-400 shadow-sm bar-grow"
                                    style={{
                                      height: `${hLuz}%`,
                                      minHeight: h.totalLuz > 0 ? "6px" : "0",
                                    }}
                                  />
                                </div>
                              </div>
                              {/* Agua bar */}
                              <div className="flex-1 max-w-[26px] flex flex-col justify-end">
                                <div className="relative">
                                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[9px] font-bold text-sky-600 whitespace-nowrap">
                                      {h.totalAgua.toFixed(0)}
                                    </span>
                                  </div>
                                  <div
                                    className="w-full bg-gradient-to-t from-sky-500 to-sky-300 rounded-t-lg transition-all hover:from-sky-600 hover:to-sky-400 shadow-sm bar-grow"
                                    style={{
                                      height: `${hAgua}%`,
                                      minHeight:
                                        h.totalAgua > 0 ? "6px" : "0",
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase">
                              {new Date(h.mes + "-02").toLocaleDateString(
                                "es-ES",
                                { month: "short" }
                              )}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Resumen del gráfico */}
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {[
                      {
                        label: "Promedio Total",
                        value: `S/ ${(historico.reduce((s, h) => s + h.total, 0) / historico.length).toFixed(2)}`,
                        color: "text-[#0A2640]",
                        bg: "bg-gray-50 border-gray-100",
                      },
                      {
                        label: "Promedio Luz",
                        value: `S/ ${(historico.reduce((s, h) => s + h.totalLuz, 0) / historico.length).toFixed(2)}`,
                        color: "text-amber-600",
                        bg: "bg-amber-50 border-amber-100",
                      },
                      {
                        label: "Promedio Agua",
                        value: `S/ ${(historico.reduce((s, h) => s + h.totalAgua, 0) / historico.length).toFixed(2)}`,
                        color: "text-sky-600",
                        bg: "bg-sky-50 border-sky-100",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`${item.bg} rounded-xl p-3 border`}
                      >
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                          {item.label}
                        </p>
                        <p className={`text-base font-bold ${item.color}`}>
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <Link
              href="/gastos"
              className="animate-fade-up delay-400 bg-gradient-to-r from-[#0A2640] to-[#0d3a5c] hover:from-[#0d3050] hover:to-[#0f4070] text-white rounded-xl p-4 shadow-sm hover:shadow-lg transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2.5 rounded-lg">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Ver Todos los Gastos</p>
                  <p className="text-xs text-white/60">
                    Gestiona, edita y genera reportes
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>

          {/* ── Columna Derecha ──────────────────────────── */}
          <div className="col-span-3 flex flex-col gap-5">
            {/* Calendario */}
            <div className="animate-fade-up delay-100 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => cambiarMes(-1)}
                    className="text-gray-400 hover:text-[#0A2640] hover:bg-gray-100 p-1.5 rounded-lg transition-all"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                  <h3 className="text-[#0A2640] font-bold text-sm capitalize">
                    {mesSeleccionado.toLocaleDateString("es-ES", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h3>
                  <button
                    onClick={() => cambiarMes(1)}
                    className="text-gray-400 hover:text-[#0A2640] hover:bg-gray-100 p-1.5 rounded-lg transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
                    <div
                      key={i}
                      className="text-center text-[10px] font-semibold text-gray-300"
                    >
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {generarCalendario().map((dia, i) => {
                    const esHoy =
                      dia === new Date().getDate() &&
                      mesSeleccionado.getMonth() === new Date().getMonth() &&
                      mesSeleccionado.getFullYear() ===
                        new Date().getFullYear();
                    const tieneGasto =
                      dia &&
                      tieneGastoEnMes(
                        mesSeleccionado.getFullYear(),
                        mesSeleccionado.getMonth()
                      );

                    return (
                      <div
                        key={i}
                        className={`
                          aspect-square flex items-center justify-center text-xs rounded-lg font-medium transition-all
                          ${!dia ? "invisible" : ""}
                          ${esHoy ? "bg-[#0A2640] text-white shadow-sm" : ""}
                          ${tieneGasto && !esHoy ? "bg-emerald-50 text-emerald-700 font-semibold" : ""}
                          ${dia && !esHoy && !tieneGasto ? "text-gray-500 hover:bg-gray-50" : ""}
                        `}
                      >
                        {dia}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px]">
                    <div className="w-2.5 h-2.5 bg-[#0A2640] rounded-md" />
                    <span className="text-gray-400">Hoy</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <div className="w-2.5 h-2.5 bg-emerald-100 border border-emerald-300 rounded-md" />
                    <span className="text-gray-400">Con gastos</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen Rápido */}
            <div className="animate-fade-up delay-200 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-bold text-[#0A2640] text-sm mb-3">
                Resumen Rápido
              </h3>
              <div className="space-y-2.5">
                {[
                  {
                    label: "Total registros",
                    value: gastos.length,
                    unit: "",
                    color: "text-[#0A2640]",
                  },
                  {
                    label: "Locales activos",
                    value: gastosPorLocal.length,
                    unit: "",
                    color: "text-[#0A2640]",
                  },
                  {
                    label: "Promedio mensual",
                    value:
                      gastos.length > 0
                        ? `${(gastos.reduce((s, g) => s + g.montoTotal, 0) / Array.from(new Set(gastos.map((g) => g.mes))).length).toFixed(2)}`
                        : "0.00",
                    unit: "S/",
                    color: "text-[#0A2640]",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <p className="text-[11px] text-gray-400 font-medium">
                      {item.label}
                    </p>
                    <p className={`text-base font-bold ${item.color}`}>
                      {item.unit && (
                        <span className="text-xs font-normal text-gray-400 mr-0.5">
                          {item.unit}
                        </span>
                      )}
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Indicador estado */}
            <div className="animate-fade-up delay-300 bg-gradient-to-br from-[#0A2640] to-[#0d3a5c] rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[11px] font-medium text-white/70 uppercase tracking-wider">
                  Sistema activo
                </span>
              </div>
              <p className="text-sm font-semibold text-white/90 leading-snug">
                Todos los datos sincronizados y al día.
              </p>
              <p className="text-[11px] text-white/40 mt-1">
                {new Date().toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

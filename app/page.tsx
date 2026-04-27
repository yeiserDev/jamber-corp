"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Droplets,
  Receipt,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  TrendingUp,
  Building2,
  BarChart2,
  List,
  LayoutDashboard,
  ArrowLeftRight,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

type TabId = "resumen" | "historial" | "local" | "comparar";
type TipoFiltro = "todos" | "luz" | "agua";

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

/* ── Sistema de color por local ──────────────────────────── */
type ColorSet = { hex: string; bg: string; light: string; text: string; badge: string };

const LOCAL_COLORS: Record<string, ColorSet> = {
  spa:       { hex: "#0071e3", bg: "bg-[#0071e3]", light: "bg-blue-50",   text: "text-[#0071e3]", badge: "bg-blue-50 text-[#0071e3]" },
  panaderia: { hex: "#ff9500", bg: "bg-[#ff9500]", light: "bg-amber-50",  text: "text-amber-600", badge: "bg-amber-50 text-amber-600" },
  panadería: { hex: "#ff9500", bg: "bg-[#ff9500]", light: "bg-amber-50",  text: "text-amber-600", badge: "bg-amber-50 text-amber-600" },
  profesor:  { hex: "#34c759", bg: "bg-[#34c759]", light: "bg-green-50",  text: "text-green-700", badge: "bg-green-50 text-green-700" },
  profesora: { hex: "#34c759", bg: "bg-[#34c759]", light: "bg-green-50",  text: "text-green-700", badge: "bg-green-50 text-green-700" },
  casa:      { hex: "#6e6e73", bg: "bg-[#6e6e73]", light: "bg-gray-100",  text: "text-[#6e6e73]", badge: "bg-gray-100 text-[#6e6e73]" },
};
const FALLBACK_COLORS: ColorSet[] = [
  { hex: "#bf5af2", bg: "bg-[#bf5af2]", light: "bg-purple-50", text: "text-purple-700", badge: "bg-purple-50 text-purple-700" },
  { hex: "#ff2d55", bg: "bg-[#ff2d55]", light: "bg-red-50",    text: "text-red-700",    badge: "bg-red-50 text-red-700" },
];

function colorLocal(nombre: string, tipo: string, fallbackIdx = 0): ColorSet {
  const n = nombre.toLowerCase().trim();
  const t = tipo.toLowerCase().trim();
  if (LOCAL_COLORS[n]) return LOCAL_COLORS[n];
  if (LOCAL_COLORS[t]) return LOCAL_COLORS[t];
  for (const key of Object.keys(LOCAL_COLORS)) {
    if (n.includes(key)) return LOCAL_COLORS[key];
  }
  return FALLBACK_COLORS[fallbackIdx % FALLBACK_COLORS.length];
}

/* ── Formateo de mes ─────────────────────────────────────── */
const fmesLargo = (m: string) =>
  new Date(m + "-02").toLocaleDateString("es-ES", { month: "long", year: "numeric" });
const fmesCorto = (m: string) =>
  new Date(m + "-02").toLocaleDateString("es-ES", { month: "short", year: "2-digit" });

/* ── Skeleton ────────────────────────────────────────────── */
function Skeleton() {
  return (
    <DashboardLayout title="">
      <div className="space-y-5">
        <div className="skeleton h-12 rounded-[12px] w-96" />
        <div className="skeleton h-28 rounded-[18px]" />
        <div className="grid grid-cols-3 gap-5">
          {[0, 1, 2].map(i => <div key={i} className="skeleton h-32 rounded-[18px]" />)}
        </div>
        <div className="skeleton h-64 rounded-[18px]" />
      </div>
    </DashboardLayout>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [gastos,          setGastos]          = useState<Gasto[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [activeTab,       setActiveTab]       = useState<TabId>("resumen");
  const [mesCalendario,   setMesCalendario]   = useState(new Date());
  const [localSel,        setLocalSel]        = useState("");
  const [mesComparar,     setMesComparar]     = useState("");
  const [filtroHistorial, setFiltroHistorial] = useState<TipoFiltro>("todos");
  const [filtroComparar,  setFiltroComparar]  = useState<TipoFiltro>("todos");

  useEffect(() => { cargarGastos(); }, []);

  async function cargarGastos() {
    try {
      const res  = await fetch("/api/gastos", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const g: Gasto[] = data.success && Array.isArray(data.gastos) ? data.gastos : [];
      setGastos(g);
      const meses = Array.from(new Set(g.map(x => x.mes))).sort() as string[];
      if (meses.length) setMesComparar(meses[meses.length - 1]);
    } catch { setGastos([]); }
    finally { setLoading(false); }
  }

  /* ── Helpers de datos ──────────────────────────────────── */

  function obtenerLocales() {
    const map: Record<string, { id: string; nombre: string; tipo: string }> = {};
    gastos.forEach(g => g.costosPorLocal.forEach(c => {
      if (!map[c.localId._id])
        map[c.localId._id] = { id: c.localId._id, nombre: c.localId.nombre, tipo: c.localId.tipo };
    }));
    return Object.values(map).sort((a, b) => {
      if (a.tipo === "casa") return 1;
      if (b.tipo === "casa") return -1;
      return a.nombre.localeCompare(b.nombre);
    });
  }

  function calcularResumen() {
    const hoy      = new Date().toISOString().slice(0, 7);
    const anterior = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
    const actual   = gastos.filter(g => g.mes === hoy);
    const ant      = gastos.filter(g => g.mes === anterior);
    const totalActual   = actual.reduce((s, g) => s + g.montoTotal, 0);
    const totalAnterior = ant.reduce((s, g) => s + g.montoTotal, 0);
    const totalLuz  = actual.filter(g => g.tipo === "luz").reduce((s, g) => s + g.montoTotal, 0);
    const totalAgua = actual.filter(g => g.tipo === "agua").reduce((s, g) => s + g.montoTotal, 0);
    const cambio    = totalAnterior > 0 ? ((totalActual - totalAnterior) / totalAnterior) * 100 : 0;
    return { totalActual, totalLuz, totalAgua, cambio, gastosActuales: actual };
  }

  function gastosPorLocalResumen(gastosActuales: Gasto[]) {
    const d: Record<string, { nombre: string; tipo: string; luz: number; agua: number; total: number }> = {};
    gastosActuales.forEach(g => g.costosPorLocal.forEach(c => {
      if (c.localId.tipo !== "casa") {
        if (!d[c.localId._id]) d[c.localId._id] = { nombre: c.localId.nombre, tipo: c.localId.tipo, luz: 0, agua: 0, total: 0 };
        if (g.tipo === "luz") d[c.localId._id].luz += c.monto;
        else d[c.localId._id].agua += c.monto;
        d[c.localId._id].total += c.monto;
      }
    }));
    return Object.values(d).sort((a, b) => b.total - a.total);
  }

  function historialLocal(localId: string) {
    const meses = Array.from(new Set(gastos.map(g => g.mes))).sort().reverse();
    return meses.map(mes => {
      let luz = 0, agua = 0;
      gastos.filter(g => g.mes === mes).forEach(g =>
        g.costosPorLocal.forEach(c => {
          if (c.localId._id === localId) {
            if (g.tipo === "luz") luz += c.monto;
            else agua += c.monto;
          }
        })
      );
      return { mes, luz, agua, total: luz + agua };
    }).filter(x => x.total > 0);
  }

  function obtenerComparacion(mes: string) {
    const r: Record<string, { id: string; nombre: string; tipo: string; luz: number; agua: number; total: number }> = {};
    gastos.filter(g => g.mes === mes).forEach(g =>
      g.costosPorLocal.forEach(c => {
        if (!r[c.localId._id]) r[c.localId._id] = { id: c.localId._id, nombre: c.localId.nombre, tipo: c.localId.tipo, luz: 0, agua: 0, total: 0 };
        if (g.tipo === "luz") r[c.localId._id].luz += c.monto;
        else r[c.localId._id].agua += c.monto;
        r[c.localId._id].total += c.monto;
      })
    );
    return Object.values(r).sort((a, b) => b.total - a.total);
  }

  /* ── Calendario ────────────────────────────────────────── */
  const mesesConGastos = gastos.map(g => g.mes);
  function generarCalendario() {
    const y = mesCalendario.getFullYear(), m = mesCalendario.getMonth();
    const dias: (number | null)[] = [];
    for (let i = 0; i < new Date(y, m, 1).getDay(); i++) dias.push(null);
    for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) dias.push(d);
    return dias;
  }
  const tieneGastoEnMes = (y: number, m: number) =>
    mesesConGastos.includes(`${y}-${String(m + 1).padStart(2, "0")}`);

  /* ── Guard ─────────────────────────────────────────────── */
  if (loading) return <Skeleton />;

  /* ── Datos derivados ───────────────────────────────────── */
  const locales      = obtenerLocales();
  const meses        = Array.from(new Set(gastos.map(g => g.mes))).sort().reverse();
  const stats        = calcularResumen();
  const distLocal    = gastosPorLocalResumen(stats.gastosActuales);
  const subiendo     = stats.cambio >= 0;
  const mesNombre    = new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const localActual  = localSel || locales.find(l => l.tipo !== "casa")?.id || locales[0]?.id || "";
  const localObj     = locales.find(l => l.id === localActual);
  const histLocal    = localActual ? historialLocal(localActual) : [];
  const comparacion  = mesComparar ? obtenerComparacion(mesComparar) : [];
  const maxLocal     = Math.max(...distLocal.map(l => l.total), 1);

  /* ── Shared CSS helpers ────────────────────────────────── */
  const card      = "bg-white rounded-[18px] border border-black/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.04)]";
  const cardHover = `${card} hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all`;
  const lbl       = "text-[11px] font-medium text-[#aeaeb2] uppercase tracking-wider";
  const tp        = "text-[#1d1d1f]";
  const ts        = "text-[#6e6e73]";

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "resumen",   label: "Resumen",          icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: "historial", label: "Historial General", icon: <List           className="w-3.5 h-3.5" /> },
    { id: "local",     label: "Por Local",         icon: <BarChart2      className="w-3.5 h-3.5" /> },
    { id: "comparar",  label: "Comparar",          icon: <ArrowLeftRight className="w-3.5 h-3.5" /> },
  ];

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <DashboardLayout title="">

      {/* ── Tab bar ───────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex bg-[#e5e5ea] p-1 rounded-[14px] gap-0.5">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-[11px] text-[13px] font-medium transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? "bg-white text-[#1d1d1f] shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
                  : "text-[#6e6e73] hover:text-[#1d1d1f]"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
        <Link
          href="/gastos"
          className="flex items-center gap-2 px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-[12px] text-[13px] font-semibold transition-all"
        >
          <Receipt className="w-3.5 h-3.5" />
          Gestionar Gastos
        </Link>
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB 1 — RESUMEN
      ══════════════════════════════════════════════════════ */}
      {activeTab === "resumen" && (
        <div className="grid grid-cols-12 gap-5">
          {/* Columna principal */}
          <div className="col-span-9 flex flex-col gap-5">

            {/* Hero */}
            <div className={`animate-fade-up delay-0 ${card}`}>
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-[#1d1d1f] p-3 rounded-[14px]">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className={`text-[22px] font-semibold ${tp} tracking-tight`}>Panel de Control</h1>
                    <p className={`text-[13px] ${ts} capitalize mt-0.5`}>{mesNombre}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`${lbl} mb-1`}>Total del Mes</p>
                    <p className={`text-[32px] font-bold ${tp} tracking-tight leading-none`}>
                      S/ {stats.totalActual.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-2 rounded-[12px] ${subiendo ? "bg-red-50 text-red-500" : "bg-[#e8f5e9] text-[#2e7d32]"}`}>
                    {subiendo ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    <span className="text-[14px] font-semibold">{Math.abs(stats.cambio).toFixed(1)}%</span>
                    <span className="text-[12px] opacity-60">vs anterior</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-5">
              <div className={`animate-fade-up delay-100 ${cardHover} p-6`}>
                <div className="flex items-center justify-between mb-5">
                  <div className="bg-amber-50 p-3 rounded-[12px]"><Zap className="w-5 h-5 text-amber-500" /></div>
                  <span className={`text-[10px] font-semibold ${ts} bg-[#f5f5f7] px-2.5 py-1 rounded-full uppercase`}>
                    {stats.gastosActuales.filter(g => g.tipo === "luz").length} reg.
                  </span>
                </div>
                <p className={`${lbl} mb-1`}>Electricidad</p>
                <p className={`text-[24px] font-bold ${tp} tracking-tight`}>S/ {stats.totalLuz.toFixed(2)}</p>
                <div className="mt-4 h-1 bg-[#f5f5f7] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full bar-grow"
                    style={{ width: stats.totalActual > 0 ? `${(stats.totalLuz / stats.totalActual) * 100}%` : "0%" }} />
                </div>
              </div>

              <div className={`animate-fade-up delay-150 ${cardHover} p-6`}>
                <div className="flex items-center justify-between mb-5">
                  <div className="bg-sky-50 p-3 rounded-[12px]"><Droplets className="w-5 h-5 text-sky-500" /></div>
                  <span className={`text-[10px] font-semibold ${ts} bg-[#f5f5f7] px-2.5 py-1 rounded-full uppercase`}>
                    {stats.gastosActuales.filter(g => g.tipo === "agua").length} reg.
                  </span>
                </div>
                <p className={`${lbl} mb-1`}>Agua</p>
                <p className={`text-[24px] font-bold ${tp} tracking-tight`}>S/ {stats.totalAgua.toFixed(2)}</p>
                <div className="mt-4 h-1 bg-[#f5f5f7] rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400 rounded-full bar-grow"
                    style={{ width: stats.totalActual > 0 ? `${(stats.totalAgua / stats.totalActual) * 100}%` : "0%" }} />
                </div>
              </div>

              <div className={`animate-fade-up delay-200 ${cardHover} p-6`}>
                <div className="flex items-center justify-between mb-5">
                  <div className="bg-[#f5f5f7] p-3 rounded-[12px]"><Receipt className="w-5 h-5 text-[#6e6e73]" /></div>
                  <span className={`text-[10px] font-semibold ${ts} bg-[#f5f5f7] px-2.5 py-1 rounded-full uppercase`}>histórico</span>
                </div>
                <p className={`${lbl} mb-1`}>Total Registros</p>
                <p className={`text-[24px] font-bold ${tp} tracking-tight`}>{gastos.length}</p>
                <div className="mt-4 h-1 bg-[#f5f5f7] rounded-full overflow-hidden">
                  <div className="h-full bg-[#0071e3] rounded-full bar-grow w-full" />
                </div>
              </div>
            </div>

            {/* Distribución por local (solo comerciales) */}
            <div className={`animate-fade-up delay-250 ${card}`}>
              <div className="px-6 py-5 border-b border-black/[0.04] flex items-center justify-between">
                <div>
                  <h2 className={`text-[15px] font-semibold ${tp} tracking-tight`}>Distribución — Locales Comerciales</h2>
                  <p className={`text-[12px] ${ts} mt-0.5`}>Spa · Panadería · Profesor — mes actual</p>
                </div>
                <span className={`text-[12px] ${ts} bg-[#f5f5f7] px-3 py-1.5 rounded-[10px]`}>{distLocal.length} locales</span>
              </div>

              {distLocal.length === 0 ? (
                <div className="py-14 text-center">
                  <Building2 className="w-10 h-10 text-[#d1d1d6] mx-auto mb-3" />
                  <p className={`text-[14px] ${ts}`}>Sin gastos este mes</p>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.03]">
                  {distLocal.map((local, idx) => {
                    const pct = Math.round((local.total / maxLocal) * 100);
                    const c   = colorLocal(local.nombre, local.tipo, idx);
                    return (
                      <div key={idx} className="px-6 py-5 hover:bg-[#f5f5f7]/60 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-[10px] ${c.bg} flex items-center justify-center text-white text-[12px] font-bold`}>{idx + 1}</div>
                            <div>
                              <p className={`text-[14px] font-semibold ${tp}`}>{local.nombre}</p>
                              <p className={`text-[12px] ${ts} capitalize`}>{local.tipo}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-[17px] font-bold ${tp} tracking-tight`}>S/ {local.total.toFixed(2)}</p>
                            <p className={`text-[11px] ${ts}`}>{pct}% del total</p>
                          </div>
                        </div>
                        <div className="h-1.5 bg-[#f5f5f7] rounded-full overflow-hidden mb-3">
                          <div className="h-full rounded-full bar-grow" style={{ width: `${pct}%`, backgroundColor: c.hex }} />
                        </div>
                        <div className="flex items-center gap-5">
                          <div className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-500" /><span className={`text-[12px] ${ts}`}>S/ {local.luz.toFixed(2)}</span></div>
                          <div className="flex items-center gap-1.5"><Droplets className="w-3 h-3 text-sky-500" /><span className={`text-[12px] ${ts}`}>S/ {local.agua.toFixed(2)}</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha */}
          <div className="col-span-3 flex flex-col gap-5">
            {/* Calendario */}
            <div className={`animate-fade-up delay-100 ${card}`}>
              <div className="px-5 py-4 border-b border-black/[0.04]">
                <div className="flex items-center justify-between">
                  <button onClick={() => { const d = new Date(mesCalendario); d.setMonth(d.getMonth() - 1); setMesCalendario(d); }}
                    className={`${ts} hover:bg-[#f5f5f7] p-1.5 rounded-[8px] transition-all`}>
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                  <h3 className={`${tp} font-semibold text-[13px] capitalize`}>
                    {mesCalendario.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                  </h3>
                  <button onClick={() => { const d = new Date(mesCalendario); d.setMonth(d.getMonth() + 1); setMesCalendario(d); }}
                    className={`${ts} hover:bg-[#f5f5f7] p-1.5 rounded-[8px] transition-all`}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["D","L","M","M","J","V","S"].map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-semibold text-[#aeaeb2]">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {generarCalendario().map((dia, i) => {
                    const esHoy = dia === new Date().getDate() && mesCalendario.getMonth() === new Date().getMonth() && mesCalendario.getFullYear() === new Date().getFullYear();
                    const tieneG = dia && tieneGastoEnMes(mesCalendario.getFullYear(), mesCalendario.getMonth());
                    return (
                      <div key={i} className={`aspect-square flex items-center justify-center text-[12px] rounded-[8px] font-medium transition-all
                        ${!dia ? "invisible" : ""}
                        ${esHoy ? "bg-[#0071e3] text-white" : ""}
                        ${tieneG && !esHoy ? "bg-[#f5f5f7] text-[#1d1d1f] font-semibold" : ""}
                        ${dia && !esHoy && !tieneG ? `${ts} hover:bg-[#f5f5f7]` : ""}
                      `}>{dia}</div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-3 border-t border-black/[0.04] space-y-1.5">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-[#0071e3] rounded-[3px]" /><span className={`text-[11px] ${ts}`}>Hoy</span></div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-[#f5f5f7] border border-[#d1d1d6] rounded-[3px]" /><span className={`text-[11px] ${ts}`}>Con gastos</span></div>
                </div>
              </div>
            </div>

            {/* Locales activos */}
            <div className={`animate-fade-up delay-200 ${card} p-5`}>
              <h3 className={`font-semibold ${tp} text-[14px] tracking-tight mb-4`}>Locales del Sistema</h3>
              <div className="space-y-2">
                {locales.map((l, idx) => {
                  const c = colorLocal(l.nombre, l.tipo, idx);
                  return (
                    <div key={l.id} className="flex items-center justify-between p-3 bg-[#f5f5f7] rounded-[12px]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
                        <p className={`text-[13px] font-medium ${tp}`}>{l.nombre}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${c.badge}`}>{l.tipo}</span>
                    </div>
                  );
                })}
                {locales.length === 0 && <p className={`text-[13px] ${ts} text-center py-2`}>Sin locales</p>}
              </div>
            </div>

            {/* Estado */}
            <div className="animate-fade-up delay-300 bg-[#1d1d1f] rounded-[18px] p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-[#34c759] rounded-full animate-pulse" />
                <span className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">Sistema activo</span>
              </div>
              <p className="text-[14px] font-medium text-white/90 leading-snug">Datos sincronizados y al día.</p>
              <p className="text-[12px] text-white/35 mt-2">
                {new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2 — HISTORIAL GENERAL
      ══════════════════════════════════════════════════════ */}
      {activeTab === "historial" && (() => {
        const gFiltrados = gastos.filter(g => filtroHistorial === "todos" || g.tipo === filtroHistorial);
        const mesesFiltrados = Array.from(new Set(gFiltrados.map(g => g.mes))).sort().reverse();
        return (
          <div className="animate-fade-up space-y-5">
            {/* Header + filtro */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className={`text-[20px] font-semibold ${tp} tracking-tight`}>Historial General</h2>
                <p className={`text-[13px] ${ts} mt-0.5`}>{gFiltrados.length} registros · {mesesFiltrados.length} meses</p>
              </div>
              <div className="flex bg-[#e5e5ea] p-1 rounded-[10px] gap-0.5">
                {(["todos", "luz", "agua"] as TipoFiltro[]).map(f => (
                  <button key={f} onClick={() => setFiltroHistorial(f)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium capitalize transition-all ${filtroHistorial === f ? "bg-white text-[#1d1d1f] shadow-[0_1px_3px_rgba(0,0,0,0.1)]" : "text-[#6e6e73] hover:text-[#1d1d1f]"}`}>
                    {f === "luz"  && <Zap      className="w-3 h-3 text-amber-500" />}
                    {f === "agua" && <Droplets className="w-3 h-3 text-sky-500"   />}
                    {f === "todos" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {mesesFiltrados.length === 0 ? (
              <div className={`${card} py-20 text-center`}>
                <TrendingUp className="w-12 h-12 text-[#d1d1d6] mx-auto mb-4" />
                <p className={`text-[16px] font-medium ${tp}`}>Sin registros</p>
                <p className={`text-[13px] ${ts} mt-1`}>No hay gastos que coincidan con el filtro.</p>
              </div>
            ) : (
              mesesFiltrados.map(mes => {
                const gMes      = gFiltrados.filter(g => g.mes === mes);
                const totalMes  = gMes.reduce((s, g) => s + g.montoTotal, 0);
                const luzMes    = gMes.filter(g => g.tipo === "luz").reduce((s, g) => s + g.montoTotal, 0);
                const aguaMes   = gMes.filter(g => g.tipo === "agua").reduce((s, g) => s + g.montoTotal, 0);
                return (
                  <div key={mes} className={card}>
                    {/* Cabecera del mes */}
                    <div className="px-6 py-4 border-b border-black/[0.04] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#1d1d1f] px-3 py-1 rounded-[8px]">
                          <span className="text-[12px] font-semibold text-white capitalize">{fmesCorto(mes)}</span>
                        </div>
                        <h3 className={`text-[15px] font-semibold ${tp} capitalize tracking-tight`}>{fmesLargo(mes)}</h3>
                      </div>
                      <div className="flex items-center gap-4">
                        {filtroHistorial !== "agua" && luzMes > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-[13px] font-semibold text-amber-600">S/ {luzMes.toFixed(2)}</span>
                          </div>
                        )}
                        {filtroHistorial !== "luz" && aguaMes > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Droplets className="w-3.5 h-3.5 text-sky-500" />
                            <span className="text-[13px] font-semibold text-sky-600">S/ {aguaMes.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="border-l border-black/[0.06] pl-4 text-right">
                          <p className={`text-[17px] font-bold ${tp} tracking-tight`}>S/ {totalMes.toFixed(2)}</p>
                          <p className={`text-[11px] ${ts}`}>total del mes</p>
                        </div>
                      </div>
                    </div>

                    {/* Registros */}
                    <div className="divide-y divide-black/[0.03]">
                      {gMes.map(gasto => {
                        const locals = gasto.costosPorLocal.filter(c => c.monto > 0).sort((a, b) => b.monto - a.monto);
                        return (
                          <div key={gasto._id} className="px-6 py-4 hover:bg-[#f5f5f7]/60 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-[12px] ${gasto.tipo === "luz" ? "bg-amber-50" : "bg-sky-50"}`}>
                                  {gasto.tipo === "luz" ? <Zap className="w-4 h-4 text-amber-500" /> : <Droplets className="w-4 h-4 text-sky-500" />}
                                </div>
                                <div>
                                  <p className={`text-[14px] font-semibold ${tp}`}>
                                    {gasto.tipo === "luz" ? "Electricidad" : "Agua"}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    {locals.slice(0, 5).map(c => {
                                      const col = colorLocal(c.localId.nombre, c.localId.tipo);
                                      return (
                                        <span key={c.localId._id} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${col.badge}`}>
                                          {c.localId.nombre}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-[16px] font-bold ${tp} tracking-tight`}>S/ {gasto.montoTotal.toFixed(2)}</p>
                                <p className={`text-[11px] ${ts}`}>{gasto.consumoTotal.toFixed(1)} {gasto.tipo === "luz" ? "kWh" : "m³"}</p>
                              </div>
                            </div>
                            {/* Desglose por local */}
                            <div className="grid grid-cols-4 gap-2">
                              {locals.map(c => {
                                const col = colorLocal(c.localId.nombre, c.localId.tipo);
                                const pct = gasto.montoTotal > 0 ? ((c.monto / gasto.montoTotal) * 100).toFixed(0) : "0";
                                return (
                                  <div key={c.localId._id} className="bg-[#f5f5f7] rounded-[10px] p-2.5">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: col.hex }} />
                                      <span className={`text-[11px] font-medium ${tp} truncate`}>{c.localId.nombre}</span>
                                    </div>
                                    <p className={`text-[12px] font-bold ${tp}`}>S/ {c.monto.toFixed(2)}</p>
                                    <p className={`text-[10px] ${ts}`}>{pct}%</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════
          TAB 3 — POR LOCAL
      ══════════════════════════════════════════════════════ */}
      {activeTab === "local" && (() => {
        const maxH     = Math.max(...histLocal.map(h => h.total), 1);
        const totalG   = histLocal.reduce((s, h) => s + h.total, 0);
        const totalLuz = histLocal.reduce((s, h) => s + h.luz, 0);
        const totalAgu = histLocal.reduce((s, h) => s + h.agua, 0);
        const cActual  = localObj ? colorLocal(localObj.nombre, localObj.tipo) : null;

        return (
          <div className="animate-fade-up space-y-5">
            <div>
              <h2 className={`text-[20px] font-semibold ${tp} tracking-tight`}>Historial por Local</h2>
              <p className={`text-[13px] ${ts} mt-0.5`}>Electricidad y agua — histórico completo</p>
            </div>

            {/* Selector de local */}
            <div className="flex gap-2 flex-wrap">
              {locales.map((l, idx) => {
                const c        = colorLocal(l.nombre, l.tipo, idx);
                const selected = localActual === l.id;
                return (
                  <button key={l.id} onClick={() => setLocalSel(l.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-[13px] font-semibold transition-all border ${
                      selected ? "border-transparent text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                               : "bg-white border-black/[0.06] text-[#6e6e73] hover:text-[#1d1d1f]"
                    }`}
                    style={selected ? { backgroundColor: c.hex } : {}}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selected ? "rgba(255,255,255,0.6)" : c.hex }} />
                    {l.nombre}
                    {l.tipo === "casa" && <span className={`text-[10px] ${selected ? "opacity-60" : ts}`}>· Casa</span>}
                  </button>
                );
              })}
            </div>

            {!localObj ? (
              <div className={`${card} py-20 text-center`}>
                <Building2 className="w-12 h-12 text-[#d1d1d6] mx-auto mb-4" />
                <p className={`text-[16px] font-medium ${tp}`}>Selecciona un local</p>
              </div>
            ) : (
              <>
                {/* Cards resumen del local */}
                <div className="grid grid-cols-3 gap-5">
                  <div className={`${card} p-6`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cActual?.hex }} />
                      <p className={`${lbl}`}>Total acumulado</p>
                    </div>
                    <p className={`text-[28px] font-bold ${tp} tracking-tight`}>S/ {totalG.toFixed(2)}</p>
                    <p className={`text-[12px] ${ts} mt-1`}>{histLocal.length} meses registrados</p>
                  </div>
                  <div className={`${card} p-6`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <p className={`${lbl}`}>Total electricidad</p>
                    </div>
                    <p className="text-[28px] font-bold text-amber-600 tracking-tight">S/ {totalLuz.toFixed(2)}</p>
                    <p className={`text-[12px] ${ts} mt-1`}>
                      {totalG > 0 ? ((totalLuz / totalG) * 100).toFixed(0) : 0}% del gasto total
                    </p>
                  </div>
                  <div className={`${card} p-6`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Droplets className="w-3.5 h-3.5 text-sky-500" />
                      <p className={`${lbl}`}>Total agua</p>
                    </div>
                    <p className="text-[28px] font-bold text-sky-600 tracking-tight">S/ {totalAgu.toFixed(2)}</p>
                    <p className={`text-[12px] ${ts} mt-1`}>
                      {totalG > 0 ? ((totalAgu / totalG) * 100).toFixed(0) : 0}% del gasto total
                    </p>
                  </div>
                </div>

                {histLocal.length === 0 ? (
                  <div className={`${card} py-16 text-center`}>
                    <TrendingUp className="w-10 h-10 text-[#d1d1d6] mx-auto mb-3" />
                    <p className={`text-[14px] ${ts}`}>Sin registros para este local</p>
                  </div>
                ) : (
                  <div className={card}>
                    <div className="px-6 py-5 border-b border-black/[0.04] flex items-center justify-between">
                      <div>
                        <h3 className={`text-[15px] font-semibold ${tp} tracking-tight`}>Evolución mensual — {localObj.nombre}</h3>
                        <p className={`text-[12px] ${ts} mt-0.5`}>Agua y luz por mes</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-amber-400 rounded" /><span className={`text-[11px] ${ts}`}>Luz</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-sky-400 rounded" /><span className={`text-[11px] ${ts}`}>Agua</span></div>
                      </div>
                    </div>

                    {/* Mini chart */}
                    <div className="px-6 pt-6 pb-4 border-b border-black/[0.04]">
                      <div className="flex items-end gap-2 h-28">
                        {[...histLocal].reverse().slice(0, 10).map(h => {
                          const hLuz  = (h.luz  / maxH) * 100;
                          const hAgua = (h.agua / maxH) * 100;
                          return (
                            <div key={h.mes} className="flex-1 flex flex-col items-center gap-2 group">
                              <div className="w-full flex gap-0.5 items-end" style={{ height: "88px" }}>
                                <div className="flex-1 flex flex-col justify-end">
                                  <div className="w-full bg-amber-400 rounded-t-[4px] bar-grow" style={{ height: `${hLuz}%`, minHeight: h.luz > 0 ? "4px" : "0" }} />
                                </div>
                                <div className="flex-1 flex flex-col justify-end">
                                  <div className="w-full bg-sky-400 rounded-t-[4px] bar-grow" style={{ height: `${hAgua}%`, minHeight: h.agua > 0 ? "4px" : "0" }} />
                                </div>
                              </div>
                              <p className={`text-[10px] font-medium ${ts} uppercase`}>
                                {new Date(h.mes + "-02").toLocaleDateString("es-ES", { month: "short" })}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tabla mensual */}
                    <div className="divide-y divide-black/[0.03]">
                      {histLocal.map(h => {
                        const pLuz  = h.total > 0 ? ((h.luz  / h.total) * 100).toFixed(0) : "0";
                        const pAgua = h.total > 0 ? ((h.agua / h.total) * 100).toFixed(0) : "0";
                        return (
                          <div key={h.mes} className="px-6 py-4 flex items-center justify-between hover:bg-[#f5f5f7]/60 transition-colors">
                            <p className={`text-[14px] font-semibold ${tp} capitalize w-40`}>{fmesLargo(h.mes)}</p>
                            <div className="flex items-center gap-8">
                              <div className="flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                <div>
                                  <span className="text-[13px] font-semibold text-amber-600">S/ {h.luz.toFixed(2)}</span>
                                  <span className={`text-[11px] ${ts} ml-1`}>{pLuz}%</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Droplets className="w-3.5 h-3.5 text-sky-500" />
                                <div>
                                  <span className="text-[13px] font-semibold text-sky-600">S/ {h.agua.toFixed(2)}</span>
                                  <span className={`text-[11px] ${ts} ml-1`}>{pAgua}%</span>
                                </div>
                              </div>
                              <p className={`text-[16px] font-bold ${tp} tracking-tight w-28 text-right`}>S/ {h.total.toFixed(2)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════
          TAB 4 — COMPARAR
      ══════════════════════════════════════════════════════ */}
      {activeTab === "comparar" && (() => {
        const totalGlobal = comparacion.reduce((s, c) => s + c.total, 0);
        const getVal = (item: typeof comparacion[0]) =>
          filtroComparar === "luz" ? item.luz : filtroComparar === "agua" ? item.agua : item.total;
        const maxVal = Math.max(...comparacion.map(c => getVal(c)), 1);
        const gridCols = comparacion.length <= 2 ? "grid-cols-2" : comparacion.length === 3 ? "grid-cols-3" : "grid-cols-4";

        return (
          <div className="animate-fade-up space-y-5">
            <div>
              <h2 className={`text-[20px] font-semibold ${tp} tracking-tight`}>Comparación entre Locales</h2>
              <p className={`text-[13px] ${ts} mt-0.5`}>Todos los espacios — incluye casa y comerciales</p>
            </div>

            {/* Controles */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* Selector de mes */}
              <div className="flex gap-1.5 flex-wrap">
                {meses.slice(0, 6).map(m => (
                  <button key={m} onClick={() => setMesComparar(m)}
                    className={`px-3 py-1.5 rounded-[10px] text-[12px] font-semibold capitalize transition-all ${
                      mesComparar === m
                        ? "bg-[#1d1d1f] text-white"
                        : "bg-white border border-black/[0.06] text-[#6e6e73] hover:text-[#1d1d1f]"
                    }`}>
                    {fmesCorto(m)}
                  </button>
                ))}
              </div>
              {/* Filtro */}
              <div className="flex bg-[#e5e5ea] p-1 rounded-[10px] gap-0.5">
                {(["todos", "luz", "agua"] as TipoFiltro[]).map(f => (
                  <button key={f} onClick={() => setFiltroComparar(f)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium capitalize transition-all ${filtroComparar === f ? "bg-white text-[#1d1d1f] shadow-[0_1px_3px_rgba(0,0,0,0.1)]" : "text-[#6e6e73] hover:text-[#1d1d1f]"}`}>
                    {f === "luz"  && <Zap      className="w-3 h-3 text-amber-500" />}
                    {f === "agua" && <Droplets className="w-3 h-3 text-sky-500"   />}
                    {f === "todos" ? "Total" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {comparacion.length === 0 ? (
              <div className={`${card} py-20 text-center`}>
                <BarChart2 className="w-12 h-12 text-[#d1d1d6] mx-auto mb-4" />
                <p className={`text-[16px] font-medium ${tp}`}>Sin datos para este mes</p>
                <p className={`text-[13px] ${ts} mt-1`}>Selecciona otro mes o agrega registros.</p>
              </div>
            ) : (
              <>
                {/* Cards resumen por local */}
                <div className={`grid ${gridCols} gap-4`}>
                  {comparacion.map((item, idx) => {
                    const c   = colorLocal(item.nombre, item.tipo, idx);
                    const pct = totalGlobal > 0 ? ((item.total / totalGlobal) * 100).toFixed(0) : "0";
                    return (
                      <div key={item.id} className={`${card} p-5`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }} />
                            <p className={`text-[13px] font-semibold ${tp} truncate`}>{item.nombre}</p>
                          </div>
                          {item.tipo === "casa" && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${c.badge}`}>Casa</span>
                          )}
                        </div>
                        <p className={`text-[22px] font-bold ${tp} tracking-tight`}>S/ {item.total.toFixed(2)}</p>
                        <p className={`text-[11px] ${ts} mt-1`}>{pct}% del gasto global</p>
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" /><span className={ts}>Luz</span></div>
                            <span className="font-semibold text-amber-600">S/ {item.luz.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1"><Droplets className="w-3 h-3 text-sky-500" /><span className={ts}>Agua</span></div>
                            <span className="font-semibold text-sky-600">S/ {item.agua.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Gráfico de barras comparativo */}
                <div className={card}>
                  <div className="px-6 py-5 border-b border-black/[0.04]">
                    <h3 className={`text-[15px] font-semibold ${tp} tracking-tight capitalize`}>
                      {filtroComparar === "todos" ? "Gasto total" : filtroComparar === "luz" ? "Electricidad" : "Agua"} — {mesComparar ? fmesLargo(mesComparar) : ""}
                    </h3>
                    <p className={`text-[12px] ${ts} mt-0.5`}>Barras horizontales proporcionales al gasto</p>
                  </div>
                  <div className="p-6 space-y-5">
                    {comparacion.map((item, idx) => {
                      const c    = colorLocal(item.nombre, item.tipo, idx);
                      const val  = getVal(item);
                      const pct  = maxVal > 0 ? (val / maxVal) * 100 : 0;
                      const pLuz  = item.total > 0 ? (item.luz  / item.total) * 100 : 0;
                      const pAgua = item.total > 0 ? (item.agua / item.total) * 100 : 0;
                      return (
                        <div key={item.id}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
                              <span className={`text-[14px] font-semibold ${tp}`}>{item.nombre}</span>
                              {item.tipo === "casa" && (
                                <span className={`text-[10px] ${ts} px-1.5 py-0.5 bg-[#f5f5f7] rounded-full`}>Residencial</span>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              {filtroComparar !== "agua" && (
                                <div className="flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-amber-500" />
                                  <span className="text-[12px] text-amber-600 font-medium">S/ {item.luz.toFixed(2)}</span>
                                </div>
                              )}
                              {filtroComparar !== "luz" && (
                                <div className="flex items-center gap-1">
                                  <Droplets className="w-3 h-3 text-sky-500" />
                                  <span className="text-[12px] text-sky-600 font-medium">S/ {item.agua.toFixed(2)}</span>
                                </div>
                              )}
                              <span className={`text-[15px] font-bold ${tp} w-24 text-right tracking-tight`}>
                                S/ {val.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          {/* Barra principal */}
                          <div className="h-2.5 bg-[#f5f5f7] rounded-full overflow-hidden">
                            <div className="h-full rounded-full bar-grow transition-all" style={{ width: `${pct}%`, backgroundColor: c.hex }} />
                          </div>
                          {/* Sub-barra luz/agua (solo en vista total) */}
                          {filtroComparar === "todos" && (
                            <div className="mt-1 h-1 flex gap-0.5 rounded-full overflow-hidden" style={{ width: `${pct}%` }}>
                              <div className="bg-amber-300 rounded-full" style={{ width: `${pLuz}%` }} />
                              <div className="bg-sky-300 rounded-full" style={{ width: `${pAgua}%` }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Footer total */}
                  <div className="px-6 py-4 border-t border-black/[0.04] bg-[#f5f5f7]/50 rounded-b-[18px] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <p className={`text-[13px] font-medium ${ts}`}>Total global del mes</p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span className="text-[12px] text-amber-600 font-semibold">
                            S/ {comparacion.reduce((s, c) => s + c.luz, 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-sky-500" />
                          <span className="text-[12px] text-sky-600 font-semibold">
                            S/ {comparacion.reduce((s, c) => s + c.agua, 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className={`text-[18px] font-bold ${tp} tracking-tight`}>S/ {totalGlobal.toFixed(2)}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })()}
    </DashboardLayout>
  );
}

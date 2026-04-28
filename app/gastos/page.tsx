"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Zap, Droplets, Receipt, Trash2, Building2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ModalNuevoGasto from "./ModalNuevoGasto";
import GastoCard from "@/components/gastos/GastoCard";
import toast, { Toaster } from "react-hot-toast";
import { Gasto, Local } from "@/types/gasto";

type TipoFiltro = "todos" | "luz" | "agua";

/* ── Helpers ─────────────────────────────────────────────── */
const fmesLargo = (m: string) =>
  new Date(m + "-02").toLocaleDateString("es-ES", { month: "long", year: "numeric" });
const fmesCorto = (m: string) =>
  new Date(m + "-02").toLocaleDateString("es-ES", { month: "short", year: "2-digit" });

export default function GastosPage() {
  const [gastos,          setGastos]          = useState<Gasto[]>([]);
  const [locales,         setLocales]         = useState<Local[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [showNuevoGasto,  setShowNuevoGasto]  = useState(false);
  const [filtroTipo,      setFiltroTipo]      = useState<TipoFiltro>("todos");
  const [filtroMes,       setFiltroMes]       = useState("");
  const [gastoEditando,   setGastoEditando]   = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [gastoAEliminar,  setGastoAEliminar]  = useState<string | null>(null);

  // Form state
  const [mes,          setMes]          = useState("");
  const [tipo,         setTipo]         = useState<"luz" | "agua">("luz");
  const [consumoTotal, setConsumoTotal] = useState("");
  const [montoTotal,   setMontoTotal]   = useState("");
  const [cargoFijo,    setCargoFijo]    = useState("");
  const [igv,          setIgv]          = useState("");
  const [otrosCargos,  setOtrosCargos]  = useState("");
  const [lecturas,     setLecturas]     = useState<{ localId: string; medidorNumero?: number; lecturaAnterior: number; lecturaActual: number; }[]>([]);
  const [pasoModal,    setPasoModal]    = useState(1);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      const [gRes, lRes] = await Promise.all([
        fetch("/api/gastos",  { cache: "no-store" }),
        fetch("/api/locales", { cache: "no-store" }),
      ]);
      const gData = await gRes.json();
      const lData = await lRes.json();

      if (gData.success) setGastos(gData.gastos);
      else setGastos([]);

      if (lData.success) {
        setLocales(lData.locales);
        const conMedidor = lData.locales.filter((l: Local) => l.tipo !== "casa");
        setLecturas(conMedidor.map((l: Local) => ({ localId: l._id, medidorNumero: 1, lecturaAnterior: 0, lecturaActual: 0 })));
      }
    } catch {
      setGastos([]);
    } finally {
      setLoading(false);
    }
  };

  const inicializarLocales = async () => {
    try {
      const res  = await fetch("/api/locales/init", { method: "POST" });
      const data = await res.json();
      if (data.success) { toast.success("Locales inicializados"); cargarDatos(); }
      else toast.error(data.message);
    } catch { toast.error("Error al inicializar locales"); }
  };

  const handleSubmitGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pasoModal < 2) return;
    if (!mes || !consumoTotal || !montoTotal || lecturas.length === 0) {
      toast.error("Completa todos los campos obligatorios"); return;
    }
    const t = toast.loading(gastoEditando ? "Actualizando..." : "Registrando...");
    try {
      const url    = gastoEditando ? `/api/gastos/${gastoEditando}` : "/api/gastos";
      const method = gastoEditando ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes, tipo, consumoTotal: parseFloat(consumoTotal), montoTotal: parseFloat(montoTotal), cargoFijo: cargoFijo ? parseFloat(cargoFijo) : 0, igv: igv ? parseFloat(igv) : 0, otrosCargos: otrosCargos ? parseFloat(otrosCargos) : 0, lecturas }),
      });
      const data = await res.json();
      toast.dismiss(t);
      if (data.success) {
        toast.success(gastoEditando ? "Gasto actualizado" : "Gasto registrado");
        setShowNuevoGasto(false);
        setGastoEditando(null);
        resetForm();
        if (gastoEditando) setGastos(prev => prev.map(g => g._id === data.gasto._id ? data.gasto : g));
        else setGastos(prev => [data.gasto, ...prev]);
      } else toast.error(data.message || "Error al procesar");
    } catch { toast.error("Error al procesar"); }
  };

  const handleEditarGasto = (gasto: Gasto) => {
    setGastoEditando(gasto._id);
    setMes(gasto.mes);
    setTipo(gasto.tipo);
    setConsumoTotal(gasto.consumoTotal.toString());
    setMontoTotal(gasto.montoTotal.toString());
    setCargoFijo(gasto.cargoFijo?.toString() || "");
    setIgv(gasto.igv?.toString() || "");
    setOtrosCargos(gasto.otrosCargos?.toString() || "");
    const lForm = gasto.lecturas
      .filter(l => {
        const local = typeof l.localId === "string" ? locales.find(loc => loc._id === l.localId) : l.localId;
        return local && local.tipo !== "casa";
      })
      .map(l => ({ localId: typeof l.localId === "string" ? l.localId : l.localId._id, medidorNumero: l.medidorNumero || 1, lecturaAnterior: l.lecturaAnterior, lecturaActual: l.lecturaActual }));
    setLecturas(lForm);
    setShowNuevoGasto(true);
  };

  const handleEliminarGasto = async () => {
    if (!gastoAEliminar) return;
    const t = toast.loading("Eliminando...");
    try {
      const res  = await fetch(`/api/gastos/${gastoAEliminar}`, { method: "DELETE" });
      const data = await res.json();
      toast.dismiss(t);
      if (data.success) {
        toast.success("Gasto eliminado");
        setShowDeleteConfirm(false);
        setGastos(prev => prev.filter(g => g._id !== gastoAEliminar));
        setGastoAEliminar(null);
      } else toast.error(data.message || "Error al eliminar");
    } catch { toast.error("Error al eliminar"); }
  };

  const confirmarEliminar = (id: string) => { setGastoAEliminar(id); setShowDeleteConfirm(true); };

  const resetForm = () => {
    setMes(""); setTipo("luz"); setConsumoTotal(""); setMontoTotal("");
    setCargoFijo(""); setIgv(""); setOtrosCargos(""); setGastoEditando(null); setPasoModal(1);
    const conMedidor = locales.filter(l => l.tipo !== "casa");
    setLecturas(conMedidor.map(l => ({ localId: l._id, medidorNumero: 1, lecturaAnterior: 0, lecturaActual: 0 })));
  };

  const updateLectura = useCallback((index: number, field: string, value: number) => {
    setLecturas(prev => { const n = [...prev]; (n[index] as any)[field] = value; return n; });
  }, []);

  // Auto-fill lecturas
  useEffect(() => {
    if (showNuevoGasto && !gastoEditando && locales.length > 0) {
      const conMedidor = locales.filter(l => l.tipo !== "casa");
      let nuevas: any[] = [];
      conMedidor.forEach(local => {
        const esProfesor = local.tipo === "profesor" || local.nombre.toLowerCase().includes("academia");
        if (tipo === "agua" && esProfesor) {
          nuevas.push({ localId: local._id, medidorNumero: 1, lecturaAnterior: 0, lecturaActual: 0 });
          nuevas.push({ localId: local._id, medidorNumero: 2, lecturaAnterior: 0, lecturaActual: 0 });
        } else {
          nuevas.push({ localId: local._id, medidorNumero: 1, lecturaAnterior: 0, lecturaActual: 0 });
        }
      });
      if (gastos.length > 0) {
        const ultimo = gastos.filter(g => g.tipo === tipo).sort((a, b) => b.mes.localeCompare(a.mes))[0];
        if (ultimo) {
          nuevas = nuevas.map(lec => {
            const found = ultimo.lecturas.find(l => {
              const id = typeof l.localId === "string" ? l.localId : l.localId._id;
              return id === lec.localId && (l.medidorNumero || 1) === (lec.medidorNumero || 1);
            });
            return { ...lec, lecturaAnterior: found ? found.lecturaActual : 0, lecturaActual: 0 };
          });
        }
      }
      setLecturas(nuevas);
    }
  }, [showNuevoGasto, tipo, gastoEditando, gastos, locales]);

  const calcularConsumoLecturas = () =>
    lecturas.reduce((t, l) => { const c = l.lecturaActual - l.lecturaAnterior; return t + (c > 0 ? c : 0); }, 0);
  const calcularConsumoCasa = () => {
    const total = parseFloat(consumoTotal) || 0;
    const diff  = total - calcularConsumoLecturas();
    return diff > 0 ? diff : 0;
  };

  const consumoLecturas = useMemo(() => calcularConsumoLecturas(), [lecturas]);
  const consumoCasa     = useMemo(() => calcularConsumoCasa(), [consumoTotal, lecturas]);
  const mesesUnicos     = Array.from(new Set(gastos.map(g => g.mes))).sort().reverse();

  /* ── Derived ─────────────────────────────────────────── */
  const gastosFiltr = gastos
    .filter(g => (filtroTipo === "todos" || g.tipo === filtroTipo) && (!filtroMes || g.mes === filtroMes))
    .sort((a, b) => b.mes.localeCompare(a.mes));

  const gastosPorMes     = gastosFiltr.reduce<Record<string, typeof gastosFiltr>>((acc, g) => {
    if (!acc[g.mes]) acc[g.mes] = [];
    acc[g.mes].push(g);
    return acc;
  }, {});
  const mesesOrdenados   = Object.keys(gastosPorMes).sort((a, b) => b.localeCompare(a));
  const gastosUltimoMes  = gastos.filter(g => g.mes === mesesUnicos[0]);
  const totalUltimoMes   = gastosUltimoMes.reduce((s, g) => s + g.montoTotal, 0);
  const promedioLuz      = gastos.filter(g => g.tipo === "luz").reduce((s, g) => s + g.montoTotal, 0) / (gastos.filter(g => g.tipo === "luz").length || 1);
  const promedioAgua     = gastos.filter(g => g.tipo === "agua").reduce((s, g) => s + g.montoTotal, 0) / (gastos.filter(g => g.tipo === "agua").length || 1);

  /* ── Shared CSS ──────────────────────────────────────── */
  const card   = "bg-white rounded-[18px] border border-black/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.04)]";
  const tp     = "text-[#1d1d1f]";
  const ts     = "text-[#6e6e73]";
  const lbl    = "text-[11px] font-medium text-[#aeaeb2] uppercase tracking-wider";

  /* ── Loading ─────────────────────────────────────────── */
  if (loading) {
    return (
      <DashboardLayout title="">
        <div className="space-y-5">
          <div className="skeleton h-24 rounded-[18px]" />
          <div className="grid grid-cols-3 gap-4">
            {[0,1,2].map(i => <div key={i} className="skeleton h-24 rounded-[18px]" />)}
          </div>
          <div className="skeleton h-12 rounded-[12px]" />
          <div className="grid grid-cols-2 gap-4">
            {[0,1,2,3].map(i => <div key={i} className="skeleton h-48 rounded-[18px]" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* ── Sin locales ─────────────────────────────────────── */
  if (locales.length === 0) {
    return (
      <DashboardLayout title="">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-sm animate-scale-in">
            <div className="w-20 h-20 bg-[#f5f5f7] rounded-[22px] flex items-center justify-center mx-auto mb-5">
              <Building2 className="w-10 h-10 text-[#aeaeb2]" />
            </div>
            <h2 className={`text-[20px] font-semibold ${tp} mb-2 tracking-tight`}>Sin locales configurados</h2>
            <p className={`text-[14px] ${ts} mb-6 leading-relaxed`}>
              Inicializa los locales para comenzar a registrar gastos de agua y luz.
            </p>
            <button
              onClick={inicializarLocales}
              className="px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-[980px] font-semibold text-[14px] transition-all"
            >
              Inicializar Locales
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <DashboardLayout title="">
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: "14px", fontSize: "13px", fontFamily: "var(--font-inter)", color: "#1d1d1f" } }} />

      {/* ── Header ─────────────────────────────────────── */}
      <div className={`animate-fade-up delay-0 ${card} p-4 sm:p-5 mb-5`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="bg-[#1d1d1f] p-3 rounded-[14px]">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-[18px] sm:text-[20px] font-semibold ${tp} tracking-tight`}>Gestión de Gastos</h1>
              <p className={`text-[12px] sm:text-[13px] ${ts} mt-0.5`}>Agua y luz · {gastos.length} registros totales</p>
            </div>
          </div>
          <button
            onClick={() => { setPasoModal(1); setShowNuevoGasto(true); }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#006edb] text-white text-[13px] font-semibold rounded-[12px] transition-all shadow-[0_2px_8px_rgba(0,113,227,0.25)] w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Nuevo Registro
          </button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {[
          { label: "Último Mes",    value: `S/ ${totalUltimoMes.toFixed(2)}`, icon: <Receipt  className="w-5 h-5 text-[#6e6e73]" />, bg: "bg-[#f5f5f7]",  delay: "delay-50"  },
          { label: "Promedio Luz",  value: `S/ ${promedioLuz.toFixed(2)}`,   icon: <Zap      className="w-5 h-5 text-amber-500" />, bg: "bg-amber-50",   delay: "delay-100" },
          { label: "Promedio Agua", value: `S/ ${promedioAgua.toFixed(2)}`,  icon: <Droplets className="w-5 h-5 text-sky-500"   />, bg: "bg-sky-50",     delay: "delay-150" },
        ].map(kpi => (
          <div key={kpi.label} className={`animate-fade-up ${kpi.delay} ${card} p-5 flex items-center gap-4`}>
            <div className={`w-11 h-11 rounded-[12px] ${kpi.bg} flex items-center justify-center flex-shrink-0`}>
              {kpi.icon}
            </div>
            <div>
              <p className={lbl}>{kpi.label}</p>
              <p className={`text-[20px] font-bold ${tp} tracking-tight mt-0.5`}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtros ─────────────────────────────────────── */}
      <div className={`animate-fade-up delay-200 ${card} p-3 mb-5 flex items-center gap-3 flex-wrap`}>
        {/* Tipo */}
        <div className="flex bg-[#e5e5ea] p-1 rounded-[10px] gap-0.5">
          {([
            { key: "todos" as TipoFiltro, label: "Todos" },
            { key: "luz"   as TipoFiltro, label: "Luz",  icon: <Zap      className="w-3 h-3 text-amber-500" /> },
            { key: "agua"  as TipoFiltro, label: "Agua", icon: <Droplets className="w-3 h-3 text-sky-500"   /> },
          ]).map(f => (
            <button key={f.key} onClick={() => setFiltroTipo(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all ${filtroTipo === f.key ? "bg-white text-[#1d1d1f] shadow-[0_1px_3px_rgba(0,0,0,0.1)]" : "text-[#6e6e73] hover:text-[#1d1d1f]"}`}>
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        {/* Mes */}
        <div className="ml-auto flex items-center gap-2">
          <p className={`text-[12px] ${ts}`}>Mes:</p>
          <select
            value={filtroMes}
            onChange={e => setFiltroMes(e.target.value)}
            className={`text-[12px] ${tp} bg-[#f5f5f7] border-none rounded-[10px] px-3 py-2 outline-none focus:ring-2 focus:ring-[#0071e3]/20 cursor-pointer font-medium`}
          >
            <option value="">Todos</option>
            {mesesUnicos.map(m => (
              <option key={m} value={m}>{fmesLargo(m)}</option>
            ))}
          </select>
        </div>

        {/* Contador */}
        <span className={`text-[12px] font-medium ${ts} bg-[#f5f5f7] px-3 py-1.5 rounded-[10px]`}>
          {gastosFiltr.length} registros
        </span>
      </div>

      {/* ── Listado agrupado por mes ─────────────────────── */}
      {gastosFiltr.length === 0 ? (
        <div className={`animate-fade-up delay-250 ${card} py-20 text-center`}>
          <div className="w-14 h-14 rounded-[16px] bg-[#f5f5f7] flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-6 h-6 text-[#aeaeb2]" />
          </div>
          <h3 className={`text-[16px] font-semibold ${tp} mb-1`}>Sin registros</h3>
          <p className={`text-[13px] ${ts}`}>
            {filtroTipo !== "todos" || filtroMes
              ? "Prueba ajustando los filtros."
              : "Crea tu primer registro con el botón de arriba."}
          </p>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-up delay-250">
          {mesesOrdenados.map(mes => {
            const gastosMes = gastosPorMes[mes];
            const totalMes  = gastosMes.reduce((s, g) => s + g.montoTotal, 0);
            const luzMes    = gastosMes.filter(g => g.tipo === "luz").reduce((s, g) => s + g.montoTotal, 0);
            const aguaMes   = gastosMes.filter(g => g.tipo === "agua").reduce((s, g) => s + g.montoTotal, 0);

            return (
              <div key={mes}>
                {/* Separador de mes */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-[#1d1d1f] px-3 py-1 rounded-[8px] flex-shrink-0">
                    <span className="text-[12px] font-semibold text-white capitalize">{fmesCorto(mes)}</span>
                  </div>
                  <h3 className={`text-[15px] font-semibold ${tp} capitalize tracking-tight`}>
                    {fmesLargo(mes)}
                  </h3>
                  <div className="flex-1 h-px bg-black/[0.06]" />
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {luzMes > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[13px] font-semibold text-amber-600">S/ {luzMes.toFixed(2)}</span>
                      </div>
                    )}
                    {aguaMes > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-sky-500" />
                        <span className="text-[13px] font-semibold text-sky-600">S/ {aguaMes.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-l border-black/[0.06] pl-3">
                      <span className={`text-[15px] font-bold ${tp} tracking-tight`}>S/ {totalMes.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Grid de tarjetas — 1 col móvil, 2 cols sm+ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {gastosMes.map(gasto => (
                    <GastoCard
                      key={gasto._id}
                      gasto={gasto}
                      todosGastos={gastos}
                      locales={locales}
                      onEdit={handleEditarGasto}
                      onDelete={confirmarEliminar}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nuevo/Editar Gasto */}
      <ModalNuevoGasto
        showNuevoGasto={showNuevoGasto}
        pasoModal={pasoModal}
        setPasoModal={setPasoModal}
        setShowNuevoGasto={setShowNuevoGasto}
        resetForm={resetForm}
        handleSubmitGasto={handleSubmitGasto}
        mes={mes}
        setMes={setMes}
        tipo={tipo}
        setTipo={setTipo}
        consumoTotal={consumoTotal}
        setConsumoTotal={setConsumoTotal}
        montoTotal={montoTotal}
        setMontoTotal={setMontoTotal}
        cargoFijo={cargoFijo}
        setCargoFijo={setCargoFijo}
        igv={igv}
        setIgv={setIgv}
        otrosCargos={otrosCargos}
        setOtrosCargos={setOtrosCargos}
        lecturas={lecturas}
        locales={locales}
        updateLectura={updateLectura}
        consumoCasa={consumoCasa}
        consumoLecturas={consumoLecturas}
        gastoEditando={gastoEditando}
      />

      {/* Modal Eliminar */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[22px] shadow-2xl max-w-xs w-full p-6 animate-scale-in border border-black/[0.06]">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className={`text-[17px] font-semibold ${tp} text-center mb-1 tracking-tight`}>¿Eliminar registro?</h3>
            <p className={`text-[13px] ${ts} text-center mb-5 leading-relaxed`}>
              Se eliminará el registro de{" "}
              <span className={`font-semibold ${tp}`}>
                {gastos.find(g => g._id === gastoAEliminar)?.mes}
              </span>.
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDeleteConfirm(false); setGastoAEliminar(null); }}
                className={`flex-1 px-4 py-2.5 text-[13px] font-semibold ${ts} bg-[#f5f5f7] hover:bg-[#e5e5ea] rounded-[12px] transition-all`}
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarGasto}
                className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded-[12px] transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

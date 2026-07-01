"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Plus, Zap, Droplets, Receipt, Trash2, Building2 , Calendar, ChevronDown, ChevronUp, PieChart, TrendingUp, TrendingDown, Lightbulb, ChevronRight} from "lucide-react";
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
  const [openDropdownGlobal, setOpenDropdownGlobal] = useState(false);
  const [openDropdownResumen, setOpenDropdownResumen] = useState(false);
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [pasoModal,    setPasoModal]    = useState(1);
  const kpiCarouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = () => {
      setUserRole(localStorage.getItem("userRole"));
      setIsAuth(localStorage.getItem("isAuthenticated") === "true");
    };
    checkAuth();
    window.addEventListener('auth-change', checkAuth);
    cargarDatos();
    return () => window.removeEventListener('auth-change', checkAuth);
  }, []);

  useEffect(() => {
    if (loading) return;
    const carousel = kpiCarouselRef.current;
    if (!carousel) return;

    let intervalId: NodeJS.Timeout;
    const startAutoScroll = () => {
      intervalId = setInterval(() => {
        if (window.innerWidth >= 768) return; // Sólo en móvil
        
        const scrollWidth = carousel.scrollWidth;
        const maxScroll = scrollWidth - carousel.clientWidth;
        if (maxScroll <= 0) return;

        let newScrollLeft = carousel.scrollLeft + carousel.clientWidth * 0.8; 
        if (newScrollLeft >= maxScroll - 10) {
            newScrollLeft = 0; // Volver al inicio si ya llegó al final
        }
        carousel.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
      }, 4000); // Girar cada 4 segundos
    };

    startAutoScroll();
    return () => clearInterval(intervalId);
  }, [loading]);

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

  // Listen for global FAB click
  useEffect(() => {
    const handleOpenNewGasto = () => {
      setPasoModal(1);
      setShowNuevoGasto(true);
    };
    document.addEventListener("open-new-gasto", handleOpenNewGasto);
    
    if (sessionStorage.getItem("openNewGasto") === "true") {
      sessionStorage.removeItem("openNewGasto");
      handleOpenNewGasto();
    }
    
    return () => document.removeEventListener("open-new-gasto", handleOpenNewGasto);
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
            {(isAuth || userRole === "admin") && (
              <button
                onClick={inicializarLocales}
                className="px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-[980px] font-semibold text-[14px] transition-all"
              >
                Inicializar Locales
              </button>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  
  // Calcular KPIs con tendencias (mockeadas o reales comparando meses)
  const gastosMesActual = gastosPorMes[mesesOrdenados[0]] || [];
  const gastosMesAnterior = gastosPorMes[mesesOrdenados[1]] || [];
  
  const totalActual = gastosMesActual.reduce((s, g) => s + g.montoTotal, 0);
  const totalAnterior = gastosMesAnterior.reduce((s, g) => s + g.montoTotal, 0);
  const pctTotal = totalAnterior > 0 ? ((totalActual - totalAnterior) / totalAnterior) * 100 : 0;
  
  const luzActual = gastosMesActual.filter(g => g.tipo === "luz").reduce((s, g) => s + g.montoTotal, 0) || 0;
  const luzAnterior = gastosMesAnterior.filter(g => g.tipo === "luz").reduce((s, g) => s + g.montoTotal, 0) || 0;
  const pctLuz = luzAnterior > 0 ? ((luzActual - luzAnterior) / luzAnterior) * 100 : 0;
  
  const aguaActual = gastosMesActual.filter(g => g.tipo === "agua").reduce((s, g) => s + g.montoTotal, 0) || 0;
  const aguaAnterior = gastosMesAnterior.filter(g => g.tipo === "agua").reduce((s, g) => s + g.montoTotal, 0) || 0;
  const pctAgua = aguaAnterior > 0 ? ((aguaActual - aguaAnterior) / aguaAnterior) * 100 : 0;

  // Render Trend
  const renderTrend = (pct: number) => {
    const isUp = pct > 0;
    const isNeutral = pct === 0;
    if (isNeutral) return <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">Sin cambio vs. mes anterior</span>;
    return (
      <span className={`text-[11px] font-semibold flex items-center gap-1 ${isUp ? 'text-red-500' : 'text-green-500'}`}>
        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(pct).toFixed(1)}% vs. mes anterior
      </span>
    );
  };

  return (
    <DashboardLayout title="">
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: "14px", fontSize: "13px", fontFamily: "var(--font-inter)", color: "#1d1d1f" } }} />

      <div className="animate-fade-up max-w-[1200px] mx-auto pb-10">
        
        {/* ── HEADER & MES GLOBAL ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-end mb-8 gap-4">
          <div className="relative">
            <button 
              onClick={() => setOpenDropdownGlobal(!openDropdownGlobal)}
              className="flex items-center bg-white border border-gray-200 hover:border-gray-300 transition-colors rounded-[12px] px-4 py-2.5 shadow-sm"
            >
              <Calendar className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-[14px] font-semibold text-gray-700 capitalize">
                {filtroMes ? fmesLargo(filtroMes) : "Todos los meses"}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400 ml-3" />
            </button>
            
            {openDropdownGlobal && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownGlobal(false)}></div>
                <div className="absolute right-0 mt-2 w-[220px] bg-white rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.08)] border border-gray-100 z-50 overflow-hidden py-2 animate-fade-down">
                  <button
                    onClick={() => { setFiltroMes(""); setOpenDropdownGlobal(false); }}
                    className={`w-full text-left px-4 py-2.5 text-[14px] font-medium transition-colors ${!filtroMes ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    Todos los meses
                  </button>
                  {mesesUnicos.map(m => (
                    <button
                      key={m}
                      onClick={() => { setFiltroMes(m); setOpenDropdownGlobal(false); }}
                      className={`w-full text-left px-4 py-2.5 text-[14px] font-medium transition-colors capitalize ${filtroMes === m ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {fmesLargo(m)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div ref={kpiCarouselRef} className="flex overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory gap-4 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:mx-0 md:pb-0 mb-8 hide-scrollbar">
          {/* Card 1 */}
          <div className="w-[85vw] sm:w-[300px] flex-shrink-0 snap-center md:w-auto md:flex-shrink md:snap-align-none bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 border border-green-100">
              <Receipt className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-gray-500">Último mes</p>
              <p className="text-[24px] font-bold text-gray-900 tracking-tight mt-0.5">S/ {totalActual.toFixed(2)}</p>
              <div className="mt-1">{renderTrend(pctTotal)}</div>
            </div>
          </div>
          {/* Card 2 */}
          <div className="w-[85vw] sm:w-[300px] flex-shrink-0 snap-center md:w-auto md:flex-shrink md:snap-align-none bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-100">
              <Zap className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-gray-500">Promedio luz</p>
              <p className="text-[24px] font-bold text-gray-900 tracking-tight mt-0.5">S/ {promedioLuz.toFixed(2)}</p>
              <div className="mt-1">{renderTrend(pctLuz)}</div>
            </div>
          </div>
          {/* Card 3 */}
          <div className="w-[85vw] sm:w-[300px] flex-shrink-0 snap-center md:w-auto md:flex-shrink md:snap-align-none bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0 border border-sky-100">
              <Droplets className="w-6 h-6 text-sky-500" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-gray-500">Promedio agua</p>
              <p className="text-[24px] font-bold text-gray-900 tracking-tight mt-0.5">S/ {promedioAgua.toFixed(2)}</p>
              <div className="mt-1">{renderTrend(pctAgua)}</div>
            </div>
          </div>
        </div>

        {/* ── FILTROS ROW ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div className="flex bg-white p-1.5 rounded-[12px] border border-gray-200 shadow-sm gap-1">
            {([
              { key: "todos", label: "Todos" },
              { key: "luz", label: "Electricidad", icon: <Zap className="w-3.5 h-3.5" /> },
              { key: "agua", label: "Agua", icon: <Droplets className="w-3.5 h-3.5" /> }
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setFiltroTipo(f.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[13px] font-semibold transition-all ${
                  filtroTipo === f.key
                    ? "bg-[#0A2640] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {f.icon && <span className={filtroTipo === f.key ? "text-white" : "text-gray-400"}>{f.icon}</span>}
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white border border-gray-200 rounded-[10px] px-3 py-2 shadow-sm">
              <select className="text-[12px] font-medium text-gray-600 bg-transparent border-none outline-none cursor-pointer pr-4 appearance-none">
                <option>Todos los locales</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 -ml-2 pointer-events-none" />
            </div>
            <div className="flex items-center bg-white border border-gray-200 rounded-[10px] px-3 py-2 shadow-sm gap-2">
              <Receipt className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[12px] font-medium text-gray-600">{gastosFiltr.length} registros</span>
            </div>
          </div>
        </div>

        {/* ── RESUMEN DEL MES (Donut Chart visual) ── */}
        {(filtroMes || mesesOrdenados.length > 0) && (
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] mb-10 flex flex-col sm:flex-row sm:items-center gap-8">
            <div className="flex-shrink-0">
              <h2 className="text-[18px] font-bold text-gray-900 tracking-tight">Resumen del mes</h2>
              <div className="relative mt-0.5">
                <button
                  onClick={() => setOpenDropdownResumen(!openDropdownResumen)}
                  className="flex items-center gap-1 text-[14px] font-medium text-gray-500 hover:text-gray-900 transition-colors capitalize group"
                >
                  {fmesLargo(filtroMes || (mesesOrdenados.length > 0 ? mesesOrdenados[0] : ""))}
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
                </button>

                {openDropdownResumen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownResumen(false)}></div>
                    <div className="absolute left-0 mt-2 w-[200px] bg-white rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.08)] border border-gray-100 z-50 overflow-hidden py-2 animate-fade-down">
                      {mesesUnicos.map(m => (
                        <button
                          key={m}
                          onClick={() => { setFiltroMes(m); setOpenDropdownResumen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-[14px] font-medium transition-colors capitalize ${filtroMes === m ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                          {fmesLargo(m)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {(() => {
              const mesSeleccionado = filtroMes || mesesOrdenados[0];
              const gMes = gastosPorMes[mesSeleccionado] || [];
              const tMes = gMes.reduce((s, g) => s + g.montoTotal, 0);
              const lMes = gMes.filter(g => g.tipo === "luz").reduce((s, g) => s + g.montoTotal, 0);
              const aMes = gMes.filter(g => g.tipo === "agua").reduce((s, g) => s + g.montoTotal, 0);
              const pLuz = tMes > 0 ? (lMes / tMes) * 100 : 0;
              const pAgua = tMes > 0 ? (aMes / tMes) * 100 : 0;

              return (
                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 flex-1 w-full">
                  {/* CSS Donut Chart representation */}
                  <div className="relative w-28 h-28 sm:w-24 sm:h-24 flex-shrink-0">
                    <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
                      <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#0ea5e9" strokeWidth="6" />
                      <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f59e0b" strokeWidth="6" strokeDasharray={`${pLuz} ${100 - pLuz}`} strokeDashoffset="0" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PieChart className="w-6 h-6 text-gray-300" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:flex sm:flex-1 items-center gap-4 sm:gap-8 justify-between w-full">
                    <div className="flex items-center gap-2 sm:gap-4 col-span-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-[13px] font-medium text-gray-500">Electricidad</p>
                        <p className="text-[14px] sm:text-[16px] font-bold text-gray-900 tracking-tight">S/ {lMes.toFixed(2)}</p>
                        <p className="text-[10px] sm:text-[11px] font-medium text-gray-400 mt-0.5">{pLuz.toFixed(1)}%<span className="hidden sm:inline"> del total</span></p>
                      </div>
                    </div>

                    <div className="w-px h-12 bg-gray-100 hidden sm:block"></div>

                    <div className="flex items-center gap-2 sm:gap-4 col-span-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0">
                        <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-sky-500" />
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-[13px] font-medium text-gray-500">Agua</p>
                        <p className="text-[14px] sm:text-[16px] font-bold text-gray-900 tracking-tight">S/ {aMes.toFixed(2)}</p>
                        <p className="text-[10px] sm:text-[11px] font-medium text-gray-400 mt-0.5">{pAgua.toFixed(1)}%<span className="hidden sm:inline"> del total</span></p>
                      </div>
                    </div>

                    <div className="w-px h-12 bg-gray-100 hidden sm:block"></div>

                    <div className="text-center sm:text-right col-span-2 mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-gray-100">
                      <p className="text-[12px] sm:text-[13px] font-medium text-gray-500">Total del mes</p>
                      <p className="text-[18px] sm:text-[20px] font-bold text-gray-900 tracking-tight mt-0.5">S/ {tMes.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── LISTADO AGRUPADO POR MES ── */}
        {gastosFiltr.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 border border-gray-100 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-[18px] font-bold text-gray-900 mb-1">Sin registros</h3>
            <p className="text-[14px] text-gray-500">Crea tu primer registro o ajusta los filtros.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {mesesOrdenados.map(mes => {
              const gastosMes = gastosPorMes[mes];
              const totalMes  = gastosMes.reduce((s, g) => s + g.montoTotal, 0);
              const luzMes    = gastosMes.filter(g => g.tipo === "luz").reduce((s, g) => s + g.montoTotal, 0);
              const aguaMes   = gastosMes.filter(g => g.tipo === "agua").reduce((s, g) => s + g.montoTotal, 0);

              return (
                <div key={mes} className="relative">
                  {/* Cabecera del mes (Estilo Sticky/Flotante) */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4 px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[12px] bg-[#0A2640] flex items-center justify-center text-white shadow-md">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <h3 className="text-[19px] font-bold text-gray-900 capitalize tracking-tight">
                        {fmesLargo(mes)}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                      {luzMes > 0 && (
                        <div className="flex items-center gap-1.5 bg-white border border-amber-200 px-3 py-1.5 rounded-full shadow-sm">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-[12px] font-bold text-amber-600">S/ {luzMes.toFixed(2)}</span>
                        </div>
                      )}
                      {aguaMes > 0 && (
                        <div className="flex items-center gap-1.5 bg-white border border-sky-200 px-3 py-1.5 rounded-full shadow-sm">
                          <Droplets className="w-3.5 h-3.5 text-sky-500" />
                          <span className="text-[12px] font-bold text-sky-600">S/ {aguaMes.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 bg-gray-100 px-4 py-1.5 rounded-full">
                        <span className="text-[12px] font-bold text-gray-700">Total: S/ {totalMes.toFixed(2)}</span>
                      </div>
                      <button className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 shadow-sm ml-2 hidden md:flex">
                        <ChevronUp className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Grid de GastoCards */}
                  <div className="flex overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory gap-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:overflow-visible lg:px-0 lg:mx-0 lg:pb-0 hide-scrollbar">
                    {gastosMes.map(gasto => (
                      <div key={gasto._id} className="h-full w-[85vw] sm:w-[400px] flex-shrink-0 snap-center lg:w-auto lg:flex-shrink lg:snap-align-none">
                        <GastoCard
                          gasto={gasto}
                          todosGastos={gastos}
                          locales={locales}
                          onEdit={handleEditarGasto}
                          onDelete={confirmarEliminar}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── CONSEJO DEL MES ── */}
        <div className="mt-12 bg-green-50 rounded-3xl p-6 border border-green-100 flex flex-col md:flex-row md:items-center gap-6 relative overflow-hidden">
          <div className="absolute -left-4 -bottom-4 opacity-50">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c4-4 8-6 8-12a8 8 0 0 0-16 0c0 6 4 8 8 12z"/>
              <path d="M12 22V12"/>
            </svg>
          </div>
          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-green-600" />
              <h4 className="text-[15px] font-bold text-green-800">Consejo del mes</h4>
            </div>
            <p className="text-[14px] text-green-700 font-medium">
              El consumo de electricidad en Panadería representa gran parte del total. Revisa oportunidades de ahorro en este local.
            </p>
          </div>
          <button className="relative z-10 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-full text-[14px] font-semibold flex items-center gap-2 transition-all self-start md:self-center">
            Ver recomendaciones
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      
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

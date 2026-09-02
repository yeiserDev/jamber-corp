"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Plus, Zap, Droplets, Receipt, Trash2, Building2 , Calendar, ChevronDown, ChevronUp, PieChart, TrendingUp, TrendingDown, Lightbulb, ChevronRight, CalendarCheck, Home, Store, Dumbbell, Sparkles} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ModalNuevoGasto from "./ModalNuevoGasto";
import GastoCard from "@/components/gastos/GastoCard";
import toast, { Toaster } from "react-hot-toast";
import { Gasto, Local } from "@/types/gasto";

type TipoFiltro = "todos" | "luz" | "agua";
type ValorLectura = number | "";
type LecturaFormulario = {
  localId: string;
  medidorNumero?: number;
  lecturaAnterior: ValorLectura;
  lecturaActual: ValorLectura;
};

const PERIODO_PANADERIA_MANUAL = "2026-08";

/* ── Helpers ─────────────────────────────────────────────── */
const fmesLargo = (m: string) =>
  new Date(m + "-02").toLocaleDateString("es-ES", { month: "long", year: "numeric" });
const fmesCorto = (m: string) =>
  new Date(m + "-02").toLocaleDateString("es-ES", { month: "short", year: "2-digit" });

const colorLocal = (nombre: string, tipo: string, idx: number) => {
  const colors = [
    { hex: '#a855f7', badge: 'text-purple-600 bg-purple-50' }, // purple
    { hex: '#f59e0b', badge: 'text-amber-600 bg-amber-50' },   // amber
    { hex: '#3b82f6', badge: 'text-blue-600 bg-blue-50' },     // blue
    { hex: '#10b981', badge: 'text-green-600 bg-green-50' },   // green
    { hex: '#ec4899', badge: 'text-pink-600 bg-pink-50' },     // pink
  ];
  if (nombre.toLowerCase().includes('casa')) return { hex: '#64748b', badge: 'text-slate-600 bg-slate-50' };
  return colors[idx % colors.length];
};

const LocalIcon = ({ nombre }: { nombre: string }) => {
  const n = nombre.toLowerCase();
  if (n.includes('casa')) return <Home className="w-4 h-4" />;
  if (n.includes('panadería') || n.includes('panaderia')) return <Store className="w-4 h-4" />;
  if (n.includes('spa')) return <Sparkles className="w-4 h-4" />;
  if (n.includes('academia')) return <Dumbbell className="w-4 h-4" />;
  return <Building2 className="w-4 h-4" />;
};

export default function GastosPage() {
  const [gastos,          setGastos]          = useState<Gasto[]>([]);
  const [locales,         setLocales]         = useState<Local[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [showNuevoGasto,  setShowNuevoGasto]  = useState(false);
  const [filtroTipo,      setFiltroTipo]      = useState<TipoFiltro>("todos");
  const [filtroMes,       setFiltroMes]       = useState("");
  const [openDropdownGlobal, setOpenDropdownGlobal] = useState(false);
  const [openDropdownResumen, setOpenDropdownResumen] = useState(false);
  const [openDropdownLocales, setOpenDropdownLocales] = useState(false);
  const [openDropdownAnios, setOpenDropdownAnios] = useState(false);
  const [filtroLocal, setFiltroLocal] = useState<string>("Todos los locales");
  const [gastoEditando,   setGastoEditando]   = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [gastoAEliminar,  setGastoAEliminar]  = useState<string | null>(null);
  const [gastoToEdit, setGastoToEdit] = useState<any>(null);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  useEffect(() => {
    const handleOpenModal = () => setIsCalendarModalOpen(true);
    window.addEventListener("open-calendar-modal", handleOpenModal);
    return () => window.removeEventListener("open-calendar-modal", handleOpenModal);
  }, []);

  const mesesConDatos = useMemo(() => {
    const s = new Set<string>();
    gastos.forEach(g => {
      s.add(g.mes);
    });
    return s;
  }, [gastos]);
  
  const mesActualIdx = new Date().getMonth();
  const [filtroAnio, setFiltroAnio] = useState<string>(new Date().getFullYear().toString());

  const aniosConDatos = Array.from(new Set(gastos.map(g => g.mes.split("-")[0])));
  if (aniosConDatos.length === 0) aniosConDatos.push(new Date().getFullYear().toString());
  if (!aniosConDatos.includes(filtroAnio)) aniosConDatos.push(filtroAnio);
  aniosConDatos.sort().reverse();

  // Form state
  const [mes,          setMes]          = useState("");
  const [tipo,         setTipo]         = useState<"luz" | "agua">("luz");
  const [consumoTotal, setConsumoTotal] = useState("");
  const [montoTotal,   setMontoTotal]   = useState("");
  const [cargoFijo,    setCargoFijo]    = useState("");
  const [igv,          setIgv]          = useState("");
  const [otrosCargos,  setOtrosCargos]  = useState("");
  const [lecturas,     setLecturas]     = useState<LecturaFormulario[]>([]);
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
    // KPI Carousel auto-scroll removed as it's now hidden on mobile
  }, []);

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
        setLecturas(conMedidor.map((l: Local) => ({ localId: l._id, medidorNumero: 1, lecturaAnterior: "", lecturaActual: "" })));
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
    const lecturaIncompleta = lecturas.find(
      l => l.lecturaAnterior === "" || l.lecturaActual === ""
    );
    if (lecturaIncompleta) {
      const local = locales.find(l => l._id === lecturaIncompleta.localId);
      toast.error(`Completa ambas lecturas de ${local?.nombre || "todos los medidores"}`);
      return;
    }
    const lecturaInvalida = lecturas.find(
      l => Number(l.lecturaActual) < Number(l.lecturaAnterior)
    );
    if (lecturaInvalida) {
      const local = locales.find(l => l._id === lecturaInvalida.localId);
      toast.error(`La lectura actual de ${local?.nombre || "un medidor"} no puede ser menor que la anterior`);
      return;
    }
    const lecturasNormalizadas = lecturas.map(l => ({
      ...l,
      lecturaAnterior: Number(l.lecturaAnterior),
      lecturaActual: Number(l.lecturaActual),
    }));
    const t = toast.loading(gastoEditando ? "Actualizando..." : "Registrando...");
    try {
      const url    = gastoEditando ? `/api/gastos/${gastoEditando}` : "/api/gastos";
      const method = gastoEditando ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes, tipo, consumoTotal: parseFloat(consumoTotal), montoTotal: parseFloat(montoTotal), cargoFijo: cargoFijo ? parseFloat(cargoFijo) : 0, igv: igv ? parseFloat(igv) : 0, otrosCargos: otrosCargos ? parseFloat(otrosCargos) : 0, lecturas: lecturasNormalizadas }),
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
    setLecturas(conMedidor.map(l => ({ localId: l._id, medidorNumero: 1, lecturaAnterior: "", lecturaActual: "" })));
  };

  const updateLectura = useCallback((index: number, field: "lecturaAnterior" | "lecturaActual", value: ValorLectura) => {
    setLecturas(prev => prev.map((lectura, i) => (
      i === index ? { ...lectura, [field]: value } : lectura
    )));
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
      let nuevas: LecturaFormulario[] = [];
      conMedidor.forEach(local => {
        const esProfesor = local.tipo === "profesor" || local.nombre.toLowerCase().includes("academia");
        if (tipo === "agua" && esProfesor) {
          nuevas.push({ localId: local._id, medidorNumero: 1, lecturaAnterior: "", lecturaActual: "" });
          nuevas.push({ localId: local._id, medidorNumero: 2, lecturaAnterior: "", lecturaActual: "" });
        } else {
          nuevas.push({ localId: local._id, medidorNumero: 1, lecturaAnterior: "", lecturaActual: "" });
        }
      });
      if (gastos.length > 0) {
        const ultimo = gastos
          .filter(g => g.tipo === tipo && (!mes || g.mes < mes))
          .sort((a, b) => b.mes.localeCompare(a.mes))[0];
        if (ultimo) {
          nuevas = nuevas.map(lec => {
            const found = ultimo.lecturas.find(l => {
              const id = typeof l.localId === "string" ? l.localId : l.localId._id;
              return id === lec.localId && (l.medidorNumero || 1) === (lec.medidorNumero || 1);
            });
            const local = locales.find(item => item._id === lec.localId);
            const panaderiaManual = mes === PERIODO_PANADERIA_MANUAL && local?.tipo === "panaderia";
            return {
              ...lec,
              lecturaAnterior: panaderiaManual ? "" : (found ? found.lecturaActual : ""),
              lecturaActual: "",
            };
          });
        }
      }
      setLecturas(nuevas);
    }
  }, [showNuevoGasto, tipo, gastoEditando, gastos, locales, mes]);

  const calcularConsumoLecturas = () =>
    lecturas.reduce((t, l) => {
      if (l.lecturaActual === "" || l.lecturaAnterior === "") return t;
      const c = Number(l.lecturaActual) - Number(l.lecturaAnterior);
      return t + (c > 0 ? c : 0);
    }, 0);
  const calcularConsumoCasa = () => {
    const total = parseFloat(consumoTotal) || 0;
    const diff  = total - calcularConsumoLecturas();
    return diff > 0 ? diff : 0;
  };

  const consumoLecturas = useMemo(() => calcularConsumoLecturas(), [lecturas]);
  const consumoCasa     = useMemo(() => calcularConsumoCasa(), [consumoTotal, lecturas]);
  const mesesUnicos     = Array.from(new Set(gastos.map(g => g.mes))).sort().reverse();

  /* ── Derived ─────────────────────────────────────────── */
  const gastosPreLocal = gastos
    .filter(g => (filtroTipo === "todos" || g.tipo === filtroTipo) && (!filtroMes || g.mes === filtroMes));

  const gastosFiltr = gastosPreLocal
    .filter(g => {
      if (filtroLocal === "Todos los locales") return true;
      return g.costosPorLocal?.some(c => {
        const id = typeof c.localId === "string" ? c.localId : c.localId._id;
        return id === filtroLocal;
      });
    })
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

      <div className="animate-fade-up max-w-[1400px] mx-auto pb-10 flex flex-col xl:flex-row gap-8">
        
        {/* ── COLUMNA PRINCIPAL (Gastos) ── */}
        <div className="flex-1 min-w-0">
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
        <div ref={kpiCarouselRef} className="hidden md:grid md:grid-cols-3 md:gap-4 mb-8">
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
              { key: "todos", label: "Todos", icon: undefined },
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
            <div className="flex items-center bg-white border border-gray-200 rounded-[10px] px-3 py-2 shadow-sm gap-2">
              <Receipt className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[12px] font-medium text-gray-600">{gastosFiltr.length} registros</span>
            </div>
          </div>
        </div>

        {/* ── RESUMEN DEL MES (Premium Layout) ── */}
        {(filtroMes || mesesOrdenados.length > 0) && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-10 overflow-hidden relative">
            {/* Fondo sutil */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-amber-50 rounded-full blur-3xl opacity-50 -mr-20 -mt-20 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
              {/* Header */}
              <div className="flex-shrink-0">
                <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">Resumen del mes</h2>
                <div className="relative mt-2">
                  <button
                    onClick={() => setOpenDropdownResumen(!openDropdownResumen)}
                    className="flex items-center gap-1.5 text-[15px] font-semibold text-blue-600 hover:text-blue-700 transition-colors capitalize group bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100/50"
                  >
                    {fmesLargo(filtroMes || (mesesOrdenados.length > 0 ? mesesOrdenados[0] : ""))}
                    <ChevronDown className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
                  </button>

                  {openDropdownResumen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownResumen(false)}></div>
                      <div className="absolute left-0 mt-2 w-[220px] bg-white rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.12)] border border-gray-100 z-50 overflow-hidden py-2 animate-fade-down">
                        {mesesUnicos.map(m => (
                          <button
                            key={m}
                            onClick={() => { setFiltroMes(m); setOpenDropdownResumen(false); }}
                            className={`w-full text-left px-5 py-3 text-[14px] font-medium transition-colors capitalize ${filtroMes === m ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                          >
                            {fmesLargo(m)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Data Layout */}
              {(() => {
                const getMontoGasto = (g: typeof gastosFiltr[0]) => {
                  if (filtroLocal === "Todos los locales") return g.montoTotal;
                  const costoItem = g.costosPorLocal?.find(c => (typeof c.localId === 'string' ? c.localId : c.localId._id) === filtroLocal);
                  return costoItem ? costoItem.monto : 0;
                };

                const mesSeleccionado = filtroMes || mesesOrdenados[0];
                const gMes = gastosPorMes[mesSeleccionado] || [];
                const tMes = gMes.reduce((s, g) => s + getMontoGasto(g), 0);
                const lMes = gMes.filter(g => g.tipo === "luz").reduce((s, g) => s + getMontoGasto(g), 0);
                const aMes = gMes.filter(g => g.tipo === "agua").reduce((s, g) => s + getMontoGasto(g), 0);
                const pLuz = tMes > 0 ? (lMes / tMes) * 100 : 0;
                const pAgua = tMes > 0 ? (aMes / tMes) * 100 : 0;

                return (
                  <div className="flex-1 w-full max-w-3xl">
                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 w-full">
                      
                      {/* Metric 1 */}
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-100/50">
                          <Zap className="w-6 h-6 text-amber-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] font-medium text-gray-500 mb-0.5">Electricidad</p>
                          <p className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">S/ {lMes.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="w-px h-12 bg-gray-100 hidden sm:block"></div>

                      {/* Metric 2 */}
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center flex-shrink-0 border border-sky-100/50">
                          <Droplets className="w-6 h-6 text-sky-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] font-medium text-gray-500 mb-0.5">Agua</p>
                          <p className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">S/ {aMes.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Total Panel */}
                      <div className="sm:ml-auto text-left sm:text-right w-full sm:w-auto bg-gray-50/80 px-5 py-3.5 rounded-2xl border border-gray-100">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Mensual</p>
                        <p className="text-[26px] font-black text-gray-900 tracking-tighter leading-none">S/ {tMes.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Horizontal Progress Bar Breakdown */}
                    {tMes > 0 && (
                      <div className="mt-7">
                        <div className="flex justify-between text-[12px] font-semibold text-gray-400 mb-2 px-1">
                          <span className="text-amber-600/80">{pLuz.toFixed(1)}% Luz</span>
                          <span className="text-sky-600/80">{pAgua.toFixed(1)}% Agua</span>
                        </div>
                        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                          <div className="h-full bg-amber-400 transition-all duration-1000 ease-out" style={{ width: `${pLuz}%` }}></div>
                          <div className="h-full bg-sky-400 transition-all duration-1000 ease-out" style={{ width: `${pAgua}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
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
                          todosGastos={gastosFiltr}
                          locales={locales}
                          filtroLocal={filtroLocal}
                          userRole={userRole}
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

        {/* ── CONSEJO DEL MES (Premium con Banner Árbol) ── */}
        <div className="hidden xl:block mt-10 relative overflow-hidden rounded-3xl shadow-[0_10px_30px_rgb(0,0,0,0.05)] border border-gray-100 bg-white">
           {/* Background Image */}
           <div 
             className="absolute inset-0 z-0 bg-cover bg-right"
             style={{ backgroundImage: 'url(/assets/eco_tree.png)' }}
           ></div>
           
           {/* Gradient Overlay to seamlessly blend image with white background */}
           <div className="absolute inset-0 z-0 bg-white/70 backdrop-blur-sm md:backdrop-blur-none md:bg-gradient-to-r md:from-white md:via-white/95 md:to-white/10"></div>
           
           <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-6 relative z-10 h-full">
              
              <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100/60 flex items-center justify-center flex-shrink-0 shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
                 <Lightbulb className="w-7 h-7 text-green-600" />
              </div>
              
              <div className="flex-1">
                 <h4 className="text-[18px] font-bold text-gray-900 tracking-tight mb-1">Impacto Ambiental</h4>
                 <p className="text-[14px] text-gray-600 font-medium leading-relaxed max-w-xl">
                   El consumo de electricidad en <span className="font-bold text-green-700">Panadería</span> es alto. Revisa oportunidades de ahorro energético para reducir tu huella de carbono.
                 </p>
              </div>
              
              <button className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all self-start md:self-center flex-shrink-0 shadow-[0_4px_20px_rgba(22,163,74,0.4)] hover:shadow-[0_4px_25px_rgba(22,163,74,0.5)] hover:-translate-y-0.5 mt-2 md:mt-0 relative z-10 border border-green-500/50">
                 Ver recomendaciones
                 <ChevronRight className="w-4 h-4" />
              </button>
           </div>
        </div>

        </div>

        {/* ── COLUMNA DERECHA (Dashboard Elements) ── */}
        <div className="hidden xl:flex w-full xl:w-[320px] flex-shrink-0 flex-col gap-6">
          {/* Cobertura del año (Oculto en mobile, reemplazado por modal) */}
          <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
            <div className="flex items-center gap-2 mb-5">
              <CalendarCheck className="w-5 h-5 text-blue-600" />
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-[16px] tracking-tight">Cobertura</h3>
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdownAnios(!openDropdownAnios)}
                    className="flex items-center gap-1.5 bg-blue-50 text-blue-700 font-bold text-[14px] rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    {filtroAnio}
                    <ChevronDown className="w-4 h-4 opacity-70" />
                  </button>

                  {openDropdownAnios && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownAnios(false)}></div>
                      <div className="absolute left-0 mt-2 w-[100px] bg-white rounded-[12px] shadow-[0_10px_40px_rgb(0,0,0,0.12)] border border-gray-100 z-50 overflow-hidden py-1.5 animate-fade-down">
                        {aniosConDatos.map(a => (
                          <button
                            key={a}
                            onClick={() => { setFiltroAnio(a); setOpenDropdownAnios(false); }}
                            className={`w-full text-left px-4 py-2 text-[14px] font-semibold transition-colors ${filtroAnio === a ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }, (_, i) => {
                const key   = `${filtroAnio}-${String(i + 1).padStart(2, "0")}`;
                const tiene = mesesConDatos.has(key);
                const futuro = filtroAnio === new Date().getFullYear().toString() && i > mesActualIdx;
                const isSelected = filtroMes === key;
                const nombre = new Date(`${filtroAnio}-${String(i + 1).padStart(2, "0")}-02`)
                  .toLocaleDateString("es-ES", { month: "short" });
                
                return (
                  <button 
                    key={i} 
                    onClick={() => {
                       if (tiene) {
                         setFiltroMes(key);
                         window.scrollTo({ top: 0, behavior: 'smooth' });
                       }
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all outline-none ${
                    futuro  ? "opacity-30 cursor-default" :
                    tiene   ? `cursor-pointer hover:scale-105 hover:shadow-sm ${isSelected ? 'bg-green-100 ring-2 ring-green-500 shadow-md scale-105' : 'bg-green-50 hover:bg-green-100 border border-green-100/50'}` : 
                    "bg-amber-50 cursor-default"
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${futuro ? "bg-gray-300" : tiene ? "bg-green-500" : "bg-amber-400"}`} />
                    <span className={`text-[10px] font-bold uppercase ${futuro ? "text-gray-400" : tiene ? "text-green-700" : "text-amber-600"}`}>{nombre}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-green-500 rounded-full" /><span className="text-[11px] text-gray-500 font-medium">Con datos</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-amber-400 rounded-full" /><span className="text-[11px] text-gray-500 font-medium">Sin registro</span></div>
            </div>
          </div>
          
          {/* Locales activos */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
            <h3 className="font-bold text-gray-900 text-[16px] tracking-tight mb-4">Locales del Sistema</h3>
            <div className="space-y-2.5">
              {/* Opción: Todos los locales */}
              {(() => {
                const mesSeleccionado = filtroMes || (mesesOrdenados.length > 0 ? mesesOrdenados[0] : null);
                const gastosParaMes = mesSeleccionado ? gastosPreLocal.filter(g => g.mes === mesSeleccionado) : [];
                const montoTotalMes = gastosParaMes.reduce((s, g) => s + g.montoTotal, 0);
                const isSelected = filtroLocal === "Todos los locales";

                return (
                  <button 
                    onClick={() => setFiltroLocal("Todos los locales")}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left mb-4 ${isSelected ? 'bg-gray-900 border-gray-900 shadow-md scale-[1.02]' : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 shadow-sm ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'}`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={`text-[14px] font-semibold leading-tight ${isSelected ? 'text-white' : 'text-gray-900'}`}>Vista General</p>
                        <p className={`text-[12px] font-bold mt-0.5 ${isSelected ? 'text-gray-400' : 'text-gray-500'}`}>S/ {montoTotalMes.toFixed(2)}</p>
                      </div>
                    </div>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-green-400 mr-1 flex-shrink-0 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />}
                  </button>
                );
              })()}
              
              {locales.map((l, idx) => {
                const c = colorLocal(l.nombre, l.tipo, idx);
                const mesSeleccionado = filtroMes || (mesesOrdenados.length > 0 ? mesesOrdenados[0] : null);
                const gastosParaMes = mesSeleccionado ? gastosPreLocal.filter(g => g.mes === mesSeleccionado) : [];
                
                const montoLocal = gastosParaMes.reduce((s, g) => {
                  const costoItem = g.costosPorLocal?.find(c => (typeof c.localId === 'string' ? c.localId : c.localId._id) === l._id);
                  return s + (costoItem ? costoItem.monto : 0);
                }, 0);

                const isSelected = filtroLocal === l._id;

                return (
                  <button 
                    key={l._id} 
                    onClick={() => setFiltroLocal(isSelected ? "Todos los locales" : l._id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${isSelected ? 'bg-blue-50 border-blue-200 shadow-sm scale-[1.02]' : 'bg-gray-50 border-gray-100/60 hover:border-gray-200 hover:bg-gray-100/80'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)]" style={{ backgroundColor: `${c.hex}15`, color: c.hex }}>
                        <LocalIcon nombre={l.nombre} />
                      </div>
                      <div>
                        <p className={`text-[14px] font-semibold leading-tight ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>{l.nombre}</p>
                        <p className="text-[12px] font-bold text-gray-500 mt-0.5">S/ {montoLocal.toFixed(2)}</p>
                      </div>
                    </div>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-blue-500 mr-1 flex-shrink-0" />}
                  </button>
                );
              })}
              {locales.length === 0 && <p className="text-[13px] text-gray-500 text-center py-2">Sin locales</p>}
            </div>
          </div>
          
          {/* Guía Rápida Moderna */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
            <h3 className="font-bold text-gray-900 text-[16px] tracking-tight mb-6 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              ¿Cómo usar el sistema?
            </h3>
            
            <div className="relative">
              {/* Línea conectora */}
              <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-100 via-purple-100 to-emerald-100 z-0"></div>
              
              <div className="space-y-6 relative z-10">
                {/* Paso 1 */}
                <div className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-100/50 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-[14px] font-bold text-gray-900">1. Registra</p>
                    <p className="text-[12.5px] text-gray-500 mt-0.5 leading-snug">Añade facturas mensuales desde el botón superior.</p>
                  </div>
                </div>
                
                {/* Paso 2 */}
                <div className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm border border-purple-100/50 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-[14px] font-bold text-gray-900">2. Explora</p>
                    <p className="text-[12.5px] text-gray-500 mt-0.5 leading-snug">Usa el calendario para viajar a meses pasados.</p>
                  </div>
                </div>
                
                {/* Paso 3 */}
                <div className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-100/50 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-[14px] font-bold text-gray-900">3. Filtra</p>
                    <p className="text-[12.5px] text-gray-500 mt-0.5 leading-snug">Haz clic en un local para aislar su consumo.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
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

      {/* ── Modal de Calendario (Solo Mobile) ── */}
      {isCalendarModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsCalendarModalOpen(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-2">
                 <CalendarCheck className="w-5 h-5 text-blue-600" />
                 <h3 className="font-bold text-gray-900 text-[18px]">Cobertura</h3>
                 <div className="relative">
                   <button
                     onClick={() => setOpenDropdownAnios(!openDropdownAnios)}
                     className="flex items-center gap-1.5 bg-blue-50 text-blue-700 font-bold text-[16px] rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:bg-blue-100 transition-colors"
                   >
                     {filtroAnio}
                     <ChevronDown className="w-4 h-4 opacity-70" />
                   </button>

                   {openDropdownAnios && (
                     <>
                       <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownAnios(false)}></div>
                       <div className="absolute left-0 mt-2 w-[110px] bg-white rounded-[12px] shadow-[0_10px_40px_rgb(0,0,0,0.12)] border border-gray-100 z-50 overflow-hidden py-1.5 animate-fade-down">
                         {aniosConDatos.map(a => (
                           <button
                             key={a}
                             onClick={() => { setFiltroAnio(a); setOpenDropdownAnios(false); }}
                             className={`w-full text-left px-4 py-2.5 text-[15px] font-semibold transition-colors ${filtroAnio === a ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                           >
                             {a}
                           </button>
                         ))}
                       </div>
                     </>
                   )}
                 </div>
               </div>
               <button onClick={() => setIsCalendarModalOpen(false)} className="text-gray-400 hover:text-gray-900 p-1 bg-gray-100 rounded-full">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
               </button>
             </div>
             
             {/* Grilla de meses */}
             <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 12 }, (_, i) => {
                const key   = `${filtroAnio}-${String(i + 1).padStart(2, "0")}`;
                const tiene = mesesConDatos.has(key);
                const futuro = filtroAnio === new Date().getFullYear().toString() && i > mesActualIdx;
                const isSelected = filtroMes === key;
                const nombre = new Date(`${filtroAnio}-${String(i + 1).padStart(2, "0")}-02`)
                  .toLocaleDateString("es-ES", { month: "short" });
                
                return (
                  <button 
                    key={i} 
                    onClick={() => {
                       if (tiene) {
                         setFiltroMes(key);
                         setIsCalendarModalOpen(false);
                         window.scrollTo({ top: 0, behavior: 'smooth' });
                       }
                    }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all outline-none ${
                    futuro  ? "opacity-30 cursor-default" :
                    tiene   ? `cursor-pointer active:scale-95 ${isSelected ? 'bg-green-100 ring-2 ring-green-500 shadow-md scale-105' : 'bg-green-50 active:bg-green-100 border border-green-100/50'}` : 
                    "bg-amber-50 cursor-default"
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${futuro ? "bg-gray-300" : tiene ? "bg-green-500" : "bg-amber-400"}`} />
                    <span className={`text-[11px] font-bold uppercase ${futuro ? "text-gray-400" : tiene ? "text-green-700" : "text-amber-600"}`}>{nombre}</span>
                  </button>
                );
              })}
             </div>
             
             <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
               <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full" /><span className="text-[12px] text-gray-500 font-medium">Con datos</span></div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-400 rounded-full" /><span className="text-[12px] text-gray-500 font-medium">Sin registro</span></div>
             </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Lightbulb, Droplets, DollarSign, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ModalNuevoGasto from "./ModalNuevoGasto";
import GastoCard from "@/components/gastos/GastoCard";
import toast, { Toaster } from 'react-hot-toast';
import { Gasto, Local } from "@/types/gasto";

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNuevoGasto, setShowNuevoGasto] = useState(false);

  // Filtros y Vistas
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'luz' | 'agua'>('todos');
  const [filtroMes, setFiltroMes] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // Future use, currently just styling
  const [activeTab, setActiveTab] = useState<'historial' | 'estadisticas'>('historial');

  const [gastoEditando, setGastoEditando] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [gastoAEliminar, setGastoAEliminar] = useState<string | null>(null);

  // Form state
  const [mes, setMes] = useState('');
  const [tipo, setTipo] = useState<'luz' | 'agua'>('luz');
  const [consumoTotal, setConsumoTotal] = useState('');
  const [montoTotal, setMontoTotal] = useState('');
  const [cargoFijo, setCargoFijo] = useState('');
  const [igv, setIgv] = useState('');
  const [otrosCargos, setOtrosCargos] = useState('');
  const [lecturas, setLecturas] = useState<{
    localId: string;
    medidorNumero?: number;
    lecturaAnterior: number;
    lecturaActual: number;
  }[]>([]);
  const [pasoModal, setPasoModal] = useState(1);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [gastosRes, localesRes] = await Promise.all([
        fetch('/api/gastos', { cache: 'no-store' }),
        fetch('/api/locales', { cache: 'no-store' })
      ]);

      const gastosData = await gastosRes.json();
      const localesData = await localesRes.json();

      if (gastosData.success) {
        setGastos(gastosData.gastos);
      } else {
        // Fallback for empty data
        setGastos([]);
      }

      if (localesData.success) {
        setLocales(localesData.locales);
        // Inicializar lecturas solo con los locales que NO son casa
        const localesConMedidor = localesData.locales.filter((l: Local) => l.tipo !== 'casa');
        setLecturas(localesConMedidor.map((local: Local) => ({
          localId: local._id,
          medidorNumero: 1,
          lecturaAnterior: 0,
          lecturaActual: 0,
        })));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setGastos([]); // Ensure empty array on error
      setLoading(false);
    }
  };

  const inicializarLocales = async () => {
    try {
      const res = await fetch('/api/locales/init', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        toast.success('Locales inicializados correctamente');
        cargarDatos();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al inicializar locales');
    }
  };

  const handleSubmitGasto = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pasoModal < 2) return;

    if (!mes || !consumoTotal || !montoTotal || lecturas.length === 0) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    const loadingToast = toast.loading(gastoEditando ? 'Actualizando gasto...' : 'Registrando gasto...');

    try {
      const url = gastoEditando ? `/api/gastos/${gastoEditando}` : '/api/gastos';
      const method = gastoEditando ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mes,
          tipo,
          consumoTotal: parseFloat(consumoTotal),
          montoTotal: parseFloat(montoTotal),
          cargoFijo: cargoFijo ? parseFloat(cargoFijo) : 0,
          igv: igv ? parseFloat(igv) : 0,
          otrosCargos: otrosCargos ? parseFloat(otrosCargos) : 0,
          lecturas,
        }),
      });

      const data = await res.json();
      toast.dismiss(loadingToast);

      if (data.success) {
        toast.success(gastoEditando ? 'Gasto actualizado exitosamente' : 'Gasto registrado exitosamente');
        setShowNuevoGasto(false);
        setGastoEditando(null);
        resetForm();

        if (gastoEditando) {
          setGastos(prev => prev.map(g => g._id === data.gasto._id ? data.gasto : g));
        } else {
          setGastos(prev => [data.gasto, ...prev]);
        }
      } else {
        toast.error(data.message || 'Error al procesar gasto');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.dismiss(loadingToast);
      toast.error('Error al procesar gasto');
    }
  };

  const handleEditarGasto = (gasto: Gasto) => {
    setGastoEditando(gasto._id);
    setMes(gasto.mes);
    setTipo(gasto.tipo);
    setConsumoTotal(gasto.consumoTotal.toString());
    setMontoTotal(gasto.montoTotal.toString());
    setCargoFijo(gasto.cargoFijo?.toString() || '');
    setIgv(gasto.igv?.toString() || '');
    setOtrosCargos(gasto.otrosCargos?.toString() || '');

    const lecturasForm = gasto.lecturas
      .filter(l => {
        const local = typeof l.localId === 'string' ? locales.find(loc => loc._id === l.localId) : l.localId;
        return local && local.tipo !== 'casa';
      })
      .map(l => ({
        localId: typeof l.localId === 'string' ? l.localId : l.localId._id,
        medidorNumero: l.medidorNumero || 1,
        lecturaAnterior: l.lecturaAnterior,
        lecturaActual: l.lecturaActual,
      }));

    setLecturas(lecturasForm);
    setShowNuevoGasto(true);
  };

  const handleEliminarGasto = async () => {
    if (!gastoAEliminar) return;

    const loadingToast = toast.loading('Eliminando gasto...');

    try {
      const res = await fetch(`/api/gastos/${gastoAEliminar}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      toast.dismiss(loadingToast);

      if (data.success) {
        toast.success('Gasto eliminado correctamente');
        setShowDeleteConfirm(false);
        setGastos(prev => prev.filter(g => g._id !== gastoAEliminar));
        setGastoAEliminar(null);
      } else {
        toast.error(data.message || 'Error al eliminar gasto');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.dismiss(loadingToast);
      toast.error('Error al eliminar gasto');
    }
  };

  const confirmarEliminar = (gastoId: string) => {
    setGastoAEliminar(gastoId);
    setShowDeleteConfirm(true);
  };

  const resetForm = () => {
    setMes('');
    setTipo('luz');
    setConsumoTotal('');
    setMontoTotal('');
    setCargoFijo('');
    setIgv('');
    setOtrosCargos('');
    setGastoEditando(null);
    setPasoModal(1);
    const localesConMedidor = locales.filter(l => l.tipo !== 'casa');
    setLecturas(localesConMedidor.map(local => ({
      localId: local._id,
      medidorNumero: 1,
      lecturaAnterior: 0,
      lecturaActual: 0,
    })));
  };

  const updateLectura = useCallback((index: number, field: string, value: number) => {
    setLecturas(prev => {
      const newLecturas = [...prev];
      (newLecturas[index] as any)[field] = value;
      return newLecturas;
    });
  }, []);

  const gastosFiltr = gastos
    .filter(gasto => {
      const coincideTipo = filtroTipo === 'todos' || gasto.tipo === filtroTipo;
      const coincideMes = !filtroMes || gasto.mes === filtroMes;
      return coincideTipo && coincideMes;
    })
    .sort((a, b) => b.mes.localeCompare(a.mes)); // Newest first

  const calcularConsumoLecturas = (): number => {
    return lecturas.reduce((total, lectura) => {
      const consumo = lectura.lecturaActual - lectura.lecturaAnterior;
      return total + (consumo > 0 ? consumo : 0);
    }, 0);
  };

  const calcularConsumoCasa = (): number => {
    const totalConsumo = parseFloat(consumoTotal) || 0;
    const consumoLecturas = calcularConsumoLecturas();
    const consumoCasa = totalConsumo - consumoLecturas;
    return consumoCasa > 0 ? consumoCasa : 0;
  };

  // Auto-fill logic
  useEffect(() => {
    if (showNuevoGasto && !gastoEditando && locales.length > 0) {
      const localesConMedidor = locales.filter(l => l.tipo !== 'casa');
      let nuevasLecturas: any[] = [];

      localesConMedidor.forEach(local => {
        const esProfesor = local.tipo === 'profesor' || local.nombre.toLowerCase().includes('academia');
        if (tipo === 'agua' && esProfesor) {
          nuevasLecturas.push({ localId: local._id, medidorNumero: 1, lecturaAnterior: 0, lecturaActual: 0 });
          nuevasLecturas.push({ localId: local._id, medidorNumero: 2, lecturaAnterior: 0, lecturaActual: 0 });
        } else {
          nuevasLecturas.push({ localId: local._id, medidorNumero: 1, lecturaAnterior: 0, lecturaActual: 0 });
        }
      });

      if (gastos.length > 0) {
        const ultimoGasto = gastos
          .filter(g => g.tipo === tipo)
          .sort((a, b) => b.mes.localeCompare(a.mes))[0];

        if (ultimoGasto) {
          nuevasLecturas = nuevasLecturas.map(lectura => {
            const found = ultimoGasto.lecturas.find(l => {
              const localIdStr = typeof l.localId === 'string' ? l.localId : l.localId._id;
              return localIdStr === lectura.localId &&
                (l.medidorNumero || 1) === (lectura.medidorNumero || 1);
            });

            return {
              ...lectura,
              lecturaAnterior: found ? found.lecturaActual : 0,
              lecturaActual: 0
            };
          });
        }
      }
      setLecturas(nuevasLecturas);
    }
  }, [showNuevoGasto, tipo, gastoEditando, gastos, locales]);

  const consumoLecturas = useMemo(() => calcularConsumoLecturas(), [lecturas]);
  const consumoCasa = useMemo(() => calcularConsumoCasa(), [consumoTotal, lecturas]);
  const mesesUnicos = Array.from(new Set(gastos.map(g => g.mes))).sort().reverse();

  if (loading) {
    return (
      <DashboardLayout title="">
        <div className="p-6 md:p-8 space-y-4">
          <div className="skeleton h-32 rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            <div className="skeleton h-24 rounded-2xl" />
            <div className="skeleton h-24 rounded-2xl" />
            <div className="skeleton h-24 rounded-2xl" />
          </div>
          <div className="skeleton h-14 rounded-2xl" />
          <div className="skeleton h-28 rounded-2xl" />
          <div className="skeleton h-28 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (locales.length === 0) {
    return (
      <DashboardLayout title="">
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center max-w-sm animate-scale-in">
            <div className="w-20 h-20 bg-[#0A2640]/5 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <Lightbulb className="w-10 h-10 text-[#0A2640]" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Sin locales configurados</h2>
            <p className="text-sm text-gray-400 mb-6">Inicializa los locales para comenzar a registrar gastos de agua y luz.</p>
            <button
              onClick={inicializarLocales}
              className="px-6 py-3 bg-[#0A2640] hover:bg-[#0d3050] text-white rounded-xl transition-all font-semibold text-sm shadow-sm hover:shadow-md"
            >
              Inicializar Locales
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Agrupar gastos filtrados por mes
  const gastosPorMes = gastosFiltr.reduce<Record<string, typeof gastosFiltr>>((acc, gasto) => {
    if (!acc[gasto.mes]) acc[gasto.mes] = [];
    acc[gasto.mes].push(gasto);
    return acc;
  }, {});

  const mesesOrdenados = Object.keys(gastosPorMes).sort((a, b) => b.localeCompare(a));

  // KPI calculations
  const gastosUltimoMes = gastos.filter(g => g.mes === mesesUnicos[0]);
  const totalUltimoMes = gastosUltimoMes.reduce((sum, g) => sum + g.montoTotal, 0);
  const totalLuz = gastos.filter(g => g.tipo === 'luz').reduce((sum, g) => sum + g.montoTotal, 0) / (gastos.filter(g => g.tipo === 'luz').length || 1);
  const totalAgua = gastos.filter(g => g.tipo === 'agua').reduce((sum, g) => sum + g.montoTotal, 0) / (gastos.filter(g => g.tipo === 'agua').length || 1);

  return (
    <DashboardLayout title="">
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', fontSize: '13px' } }} />
      <div className="min-h-screen p-6 md:p-8 bg-gray-50/30">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="animate-fade-up delay-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="h-1 bg-gradient-to-r from-[#0A2640] via-cyan-400 to-sky-500" />
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-[#0A2640] p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0A2640]">Gestión de Servicios</h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Registra y distribuye gastos de agua y luz entre tus locales
                </p>
              </div>
            </div>
            <button
              onClick={() => { setPasoModal(1); setShowNuevoGasto(true); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A2640] hover:bg-[#0d3050] text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Nuevo Registro
            </button>
          </div>
        </div>

        {/* ── KPI Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            {
              label: 'Último Mes',
              value: `S/ ${totalUltimoMes.toFixed(2)}`,
              icon: <DollarSign className="w-4 h-4 text-[#0A2640]" />,
              iconBg: 'bg-slate-50',
              border: 'border-slate-100',
              delay: 'delay-50',
            },
            {
              label: 'Promedio Luz',
              value: `S/ ${totalLuz.toFixed(2)}`,
              icon: <Lightbulb className="w-4 h-4 text-amber-500" />,
              iconBg: 'bg-amber-50',
              border: 'border-amber-100',
              delay: 'delay-100',
            },
            {
              label: 'Promedio Agua',
              value: `S/ ${totalAgua.toFixed(2)}`,
              icon: <Droplets className="w-4 h-4 text-sky-500" />,
              iconBg: 'bg-sky-50',
              border: 'border-sky-100',
              delay: 'delay-150',
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className={`animate-fade-up ${kpi.delay} bg-white rounded-2xl border ${kpi.border} shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-all`}
            >
              <div className={`w-10 h-10 rounded-xl ${kpi.iconBg} flex items-center justify-center shrink-0`}>
                {kpi.icon}
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">{kpi.label}</p>
                <p className="text-lg font-bold text-gray-900">{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filtros ─────────────────────────────────────────── */}
        <div className="animate-fade-up delay-200 flex flex-wrap items-center gap-2 mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
          <div className="flex bg-gray-50 rounded-xl p-1 gap-0.5">
            {[
              { key: 'todos' as const, label: 'Todos' },
              { key: 'luz'   as const, label: '⚡ Luz' },
              { key: 'agua'  as const, label: '💧 Agua' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFiltroTipo(f.key)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filtroTipo === f.key
                    ? 'bg-[#0A2640] text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#0A2640] focus:ring-2 focus:ring-[#0A2640]/10 cursor-pointer transition-all"
            >
              <option value="">Todos los meses</option>
              {mesesUnicos.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Listado agrupado por mes ─────────────────────────── */}
        {gastosFiltr.length === 0 ? (
          <div className="animate-fade-up delay-250 text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <DollarSign className="w-7 h-7 text-gray-300" />
            </div>
            <h3 className="text-base font-bold text-gray-700 mb-1">Sin registros</h3>
            <p className="text-sm text-gray-400">
              {filtroTipo !== 'todos' || filtroMes
                ? 'Prueba ajustando los filtros.'
                : 'Crea tu primer registro con el botón de arriba.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-up delay-250">
            {mesesOrdenados.map(mes => {
              const gastosMes = gastosPorMes[mes];
              const totalMes = gastosMes.reduce((sum, g) => sum + g.montoTotal, 0);
              const mesLabel = new Date(mes + '-02').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

              return (
                <div key={mes}>
                  {/* Month separator */}
                  <div className="flex items-center gap-3 mb-3 px-1">
                    <div className="h-px flex-1 bg-gray-100" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 capitalize">{mesLabel}</span>
                      <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        S/ {totalMes.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>

                  {/* Cards */}
                  <div className="space-y-2">
                    {gastosMes.map((gasto) => (
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

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xs w-full p-6 animate-in fade-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-base font-bold text-gray-900 text-center mb-1">¿Eliminar registro?</h3>
              <p className="text-gray-400 text-center text-sm mb-5">
                Se eliminará el registro de <strong className="text-gray-600">{gastos.find(g => g._id === gastoAEliminar)?.mes}</strong>.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setGastoAEliminar(null); }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEliminarGasto}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
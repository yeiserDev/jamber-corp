import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Gasto from '@/lib/models/Gasto';

// GET - Obtener todos los gastos
export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes');
    const tipo = searchParams.get('tipo');

    const filter: any = {};
    if (mes) filter.mes = mes;
    if (tipo) filter.tipo = tipo;

    const gastos = await Gasto.find(filter)
      .populate('lecturas.localId')
      .populate('costosPorLocal.localId')
      .sort({ mes: -1, tipo: 1 });

    return NextResponse.json({
      success: true,
      gastos,
    });
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener gastos' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo gasto y calcular costos
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    const { mes, tipo, consumoTotal, montoTotal, lecturas, cargoFijo, igv, otrosCargos } = body;

    // Calcular el consumo de cada medidor
    const lecturasConConsumo = lecturas.map((lectura: any) => ({
      ...lectura,
      consumo: lectura.lecturaActual - lectura.lecturaAnterior,
    }));

    // Sumar el consumo total de todos los medidores con lectura
    const consumoTotalLocales = lecturasConConsumo.reduce(
      (sum: number, lectura: any) => sum + lectura.consumo,
      0
    );

    // Calcular el consumo de la casa (diferencia entre recibo total y suma de medidores)
    const consumoCasa = consumoTotal - consumoTotalLocales;

    // Calcular el costo por kWh o m³
    const costoPorUnidad = montoTotal / consumoTotal;

    // Agrupar consumo por local (sumar si hay múltiples medidores)
    const consumoPorLocal = lecturasConConsumo.reduce((acc: any, lectura: any) => {
      const localId = lectura.localId.toString();
      if (!acc[localId]) {
        acc[localId] = { localId: lectura.localId, consumo: 0 };
      }
      acc[localId].consumo += lectura.consumo;
      return acc;
    }, {});

    // Obtener todos los locales para verificar tipos
    const Local = (await import('@/lib/models/Local')).default;
    const todosLocales = await Local.find();

    // Calcular el monto a cobrar a cada local (proporcional al consumo)
    const costosPorLocal = Object.values(consumoPorLocal).map((item: any) => {
      const monto = item.consumo * costoPorUnidad;

      return {
        localId: item.localId,
        consumo: item.consumo,
        monto: parseFloat(monto.toFixed(2)),
      };
    });

    // Buscar el local "Casa" y agregar su consumo automáticamente
    const casaLocal = todosLocales.find((l: any) => l.tipo === 'casa');

    if (casaLocal && consumoCasa > 0) {
      costosPorLocal.push({
        localId: casaLocal._id,
        consumo: parseFloat(consumoCasa.toFixed(2)),
        monto: parseFloat((consumoCasa * costoPorUnidad).toFixed(2)),
      });
    }

    // Crear el gasto
    const gasto = await Gasto.create({
      mes,
      tipo,
      consumoTotal,
      montoTotal,
      cargoFijo: cargoFijo || 0,
      igv: igv || 0,
      otrosCargos: otrosCargos || 0,
      lecturas: lecturasConConsumo,
      costosPorLocal,
    });

    const gastoPopulado = await Gasto.findById(gasto._id)
      .populate('lecturas.localId')
      .populate('costosPorLocal.localId');

    return NextResponse.json(
      {
        success: true,
        gasto: gastoPopulado,
        resumen: {
          consumoTotalLocales,
          costoPorUnidad: parseFloat(costoPorUnidad.toFixed(4)),
          totalCobrado: costosPorLocal.reduce((sum: number, c: any) => sum + c.monto, 0),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error al crear gasto:', error);

    // Manejar error de duplicado
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: `Ya existe un registro de ${error.keyValue.tipo} para el mes ${error.keyValue.mes}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Error al crear gasto' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Gasto from '@/lib/models/Gasto';

// PUT - Actualizar un gasto
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id } = await context.params;

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

    // Actualizar el gasto
    const gastoActualizado = await Gasto.findByIdAndUpdate(
      id,
      {
        mes,
        tipo,
        consumoTotal,
        montoTotal,
        cargoFijo: cargoFijo || 0,
        igv: igv || 0,
        otrosCargos: otrosCargos || 0,
        lecturas: lecturasConConsumo,
        costosPorLocal,
      },
      { new: true, runValidators: true }
    )
      .populate('lecturas.localId')
      .populate('costosPorLocal.localId');

    if (!gastoActualizado) {
      return NextResponse.json(
        { success: false, message: 'Gasto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      gasto: gastoActualizado,
      resumen: {
        consumoTotalLocales,
        costoPorUnidad: parseFloat(costoPorUnidad.toFixed(4)),
        totalCobrado: costosPorLocal.reduce((sum: number, c: any) => sum + c.monto, 0),
      },
    });
  } catch (error: any) {
    console.error('Error al actualizar gasto:', error);

    // Manejar error de duplicado
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: `Ya existe un registro de ${error.keyValue.tipo} para el mes ${error.keyValue.mes}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Error al actualizar gasto' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un gasto
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;

    const gastoEliminado = await Gasto.findByIdAndDelete(id);

    if (!gastoEliminado) {
      return NextResponse.json(
        { success: false, message: 'Gasto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Gasto eliminado correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    return NextResponse.json(
      { success: false, message: 'Error al eliminar gasto' },
      { status: 500 }
    );
  }
}

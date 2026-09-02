import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Gasto from '@/lib/models/Gasto';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { BillingValidationError, calcularDistribucion } from '@/lib/billing/calcularDistribucion';

// PUT - Actualizar un gasto
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // Verificación de Admin mediante JWT
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-session')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'No tienes permisos de administrador' }, { status: 403 });
    }

    const body = await request.json();
    const { id } = await context.params;

    const { mes, tipo, consumoTotal, montoTotal, lecturas, cargoFijo, igv, otrosCargos } = body;

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes) || !['luz', 'agua'].includes(tipo)) {
      throw new BillingValidationError('El periodo o el tipo de servicio no es válido');
    }

    // Calcular el consumo de cada medidor
    const Local = (await import('@/lib/models/Local')).default;
    const todosLocales = await Local.find();
    const casaLocal = todosLocales.find((l: any) => l.tipo === 'casa');
    const calculo = calcularDistribucion({
      consumoTotal,
      montoTotal,
      cargoFijo,
      igv,
      otrosCargos,
      lecturas,
      casaLocalId: casaLocal?._id,
    });

    // Actualizar el gasto
    const gastoActualizado = await Gasto.findByIdAndUpdate(
      id,
      {
        mes,
        tipo,
        consumoTotal,
        montoTotal,
        cargoFijo: calculo.cargoFijo,
        igv: calculo.igv,
        otrosCargos: calculo.otrosCargos,
        lecturas: calculo.lecturasConConsumo,
        costosPorLocal: calculo.costosPorLocal,
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
        consumoTotalLocales: calculo.consumoTotalLocales,
        costoPorUnidad: parseFloat(calculo.costoPorUnidad.toFixed(4)),
        totalCobrado: calculo.costosPorLocal.reduce((sum, c) => sum + c.monto, 0),
      },
    });
  } catch (error: any) {
    console.error('Error al actualizar gasto:', error);

    if (error instanceof BillingValidationError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

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

    // Verificación de Admin mediante JWT
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-session')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'No tienes permisos de administrador' }, { status: 403 });
    }

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

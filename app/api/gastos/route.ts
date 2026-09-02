import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Gasto from '@/lib/models/Gasto';
import '@/lib/models/Local';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { BillingValidationError, calcularDistribucion } from '@/lib/billing/calcularDistribucion';

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

    // Crear el gasto
    const gasto = await Gasto.create({
      mes,
      tipo,
      consumoTotal,
      montoTotal,
      cargoFijo: calculo.cargoFijo,
      igv: calculo.igv,
      otrosCargos: calculo.otrosCargos,
      lecturas: calculo.lecturasConConsumo,
      costosPorLocal: calculo.costosPorLocal,
    });

    const gastoPopulado = await Gasto.findById(gasto._id)
      .populate('lecturas.localId')
      .populate('costosPorLocal.localId');

    return NextResponse.json(
      {
        success: true,
        gasto: gastoPopulado,
        resumen: {
          consumoTotalLocales: calculo.consumoTotalLocales,
          costoPorUnidad: parseFloat(calculo.costoPorUnidad.toFixed(4)),
          totalCobrado: calculo.costosPorLocal.reduce((sum, c) => sum + c.monto, 0),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error al crear gasto:', error);

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
      { success: false, message: 'Error al crear gasto' },
      { status: 500 }
    );
  }
}

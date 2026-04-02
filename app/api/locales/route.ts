import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Local from '@/lib/models/Local';

// GET - Obtener todos los locales
export async function GET() {
  try {
    await dbConnect();
    const locales = await Local.find({ estado: 'activo' }).sort({ tipo: 1 });

    return NextResponse.json({
      success: true,
      locales,
    });
  } catch (error) {
    console.error('Error al obtener locales:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener locales' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo local
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    const local = await Local.create(body);

    return NextResponse.json({
      success: true,
      local,
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear local:', error);
    return NextResponse.json(
      { success: false, message: 'Error al crear local' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar todos los locales (solo para desarrollo)
export async function DELETE() {
  try {
    await dbConnect();
    const result = await Local.deleteMany({});

    return NextResponse.json({
      success: true,
      message: 'Todos los locales han sido eliminados',
      count: result.deletedCount,
    });
  } catch (error) {
    console.error('Error al eliminar locales:', error);
    return NextResponse.json(
      { success: false, message: 'Error al eliminar locales' },
      { status: 500 }
    );
  }
}
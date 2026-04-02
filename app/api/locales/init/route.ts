import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Local from '@/lib/models/Local';

// POST - Inicializar los 3 locales
export async function POST() {
  try {
    await dbConnect();

    // Verificar si ya existen locales
    const existingLocales = await Local.countDocuments();

    if (existingLocales > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Los locales ya han sido inicializados',
          count: existingLocales,
        },
        { status: 400 }
      );
    }

    // Crear los 4 locales (3 comerciales + casa)
    const locales = await Local.insertMany([
      {
        nombre: 'Panadería',
        tipo: 'panaderia',
        direccion: 'Local 1',
        estado: 'activo',
      },
      {
        nombre: 'Profesor',
        tipo: 'profesor',
        direccion: 'Local 2',
        estado: 'activo',
      },
      {
        nombre: 'Spa',
        tipo: 'spa',
        direccion: 'Local 3',
        estado: 'activo',
      },
      {
        nombre: 'Casa',
        tipo: 'casa',
        direccion: 'Residencia',
        estado: 'activo',
      },
    ]);

    return NextResponse.json(
      {
        success: true,
        message: 'Locales creados exitosamente',
        locales,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al inicializar locales:', error);
    return NextResponse.json(
      { success: false, message: 'Error al crear locales', error: String(error) },
      { status: 500 }
    );
  }
}
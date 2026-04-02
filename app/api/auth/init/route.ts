import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

// Ruta para inicializar usuarios (solo para desarrollo)
export async function POST() {
  try {
    await dbConnect();

    // Verificar si ya existen usuarios
    const existingUsers = await User.countDocuments();

    if (existingUsers > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Los usuarios ya han sido inicializados',
          count: existingUsers
        },
        { status: 400 }
      );
    }

    // Hash de las contraseñas
    const hashedAdminPassword = await bcrypt.hash('admin', 10);
    const hashedUserPassword = await bcrypt.hash('123', 10);

    // Crear usuarios
    const users = await User.insertMany([
      {
        username: 'jamber',
        password: hashedAdminPassword,
        role: 'admin',
      },
      {
        username: 'chopchop',
        password: hashedUserPassword,
        role: 'user',
      },
    ]);

    return NextResponse.json(
      {
        success: true,
        message: 'Usuarios creados exitosamente',
        users: users.map(u => ({
          username: u.username,
          role: u.role,
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al inicializar usuarios:', error);
    return NextResponse.json(
      { success: false, message: 'Error al crear usuarios', error: String(error) },
      { status: 500 }
    );
  }
}

// GET para verificar usuarios existentes
export async function GET() {
  try {
    await dbConnect();

    const users = await User.find({}, 'username role createdAt').lean();

    return NextResponse.json(
      {
        success: true,
        count: users.length,
        users: users,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}
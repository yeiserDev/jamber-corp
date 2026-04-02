import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { username, password } = await request.json();

    // Validar que se proporcionen credenciales
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Por favor proporciona usuario y contraseña' },
        { status: 400 }
      );
    }

    // Buscar usuario por username
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    // Login exitoso — establecer cookie de sesión segura
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login exitoso',
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
        },
      },
      { status: 200 }
    );

    response.cookies.set('auth-session', String(user._id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    return response;
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
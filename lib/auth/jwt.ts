import { SignJWT, jwtVerify } from 'jose';

// Utiliza JWT_SECRET desde las variables de entorno, o un fallback seguro en desarrollo
const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length === 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('La variable de entorno JWT_SECRET no está configurada.');
    }
    return 'fallback_secret_for_development_only_do_not_use_in_prod';
  }
  return secret;
};

export const signToken = async (payload: { id: string; role: string; username: string }) => {
  const secret = new TextEncoder().encode(getJwtSecretKey());
  
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Expira en 7 días
    .sign(secret);
    
  return token;
};

export const verifyToken = async (token: string) => {
  try {
    const secret = new TextEncoder().encode(getJwtSecretKey());
    const { payload } = await jwtVerify(token, secret);
    return payload as { id: string; role: string; username: string, exp: number, iat: number };
  } catch (error) {
    return null;
  }
};

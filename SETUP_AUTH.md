# 🔐 Configuración de Autenticación - Jamber Corp

## Paso 1: Inicializar Usuarios en MongoDB

Antes de poder iniciar sesión, necesitas crear los usuarios en la base de datos.

### Opción A: Usando tu navegador

1. Asegúrate de que tu servidor esté corriendo:
   ```bash
   npm run dev
   ```

2. Abre tu navegador y ve a:
   ```
   http://localhost:3000/api/auth/init
   ```

3. Haz una petición POST. Puedes usar:
   - Extensión de navegador como "REST Client"
   - O simplemente ejecuta este comando en tu terminal:

### Opción B: Usando curl (Terminal)

```bash
curl -X POST http://localhost:3000/api/auth/init
```

### Opción C: Usando PowerShell (Windows)

```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/auth/init -Method POST
```

## Paso 2: Verificar que los usuarios fueron creados

Visita en tu navegador:
```
http://localhost:3000/api/auth/init
```

Deberías ver una respuesta JSON con los usuarios creados.

## Paso 3: Iniciar Sesión

Ahora puedes iniciar sesión en:
```
http://localhost:3000/login
```

### Credenciales disponibles:

#### 👑 **Administrador**
- **Usuario:** `jamber`
- **Password:** `admin`
- **Rol:** admin

#### 👤 **Usuario Regular**
- **Usuario:** `chopchop`
- **Password:** `123`
- **Rol:** user

## 🎯 Características del Sistema

✅ Autenticación con MongoDB
✅ Contraseñas hasheadas con bcrypt
✅ 2 roles de usuario (admin y user)
✅ Sesión guardada en localStorage
✅ Interfaz glassmorphism moderna
✅ Diseño responsive

## 📝 Notas Importantes

- Las contraseñas están hasheadas en la base de datos usando bcrypt
- La sesión se guarda en localStorage (temporal, para desarrollo)
- En producción, deberías usar JWT tokens o NextAuth.js
- Los usuarios solo se crean la primera vez que ejecutas `/api/auth/init`

## 🔧 Archivos Creados

- `/lib/models/User.ts` - Modelo de usuario de Mongoose
- `/app/api/auth/login/route.ts` - Endpoint de login
- `/app/api/auth/init/route.ts` - Endpoint para inicializar usuarios
- `/app/login/page.tsx` - Página de login actualizada

## 🚀 Próximos Pasos

Para producción, considera:
1. Implementar JWT tokens
2. Agregar NextAuth.js
3. Implementar refresh tokens
4. Agregar middleware de autenticación en las rutas protegidas
5. Agregar funcionalidad de registro de usuarios
6. Implementar recuperación de contraseña